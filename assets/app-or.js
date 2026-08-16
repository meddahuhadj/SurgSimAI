/*
 * app-or.js — OR Command Center & Moteur de Contraintes Frontend Logic
 */

// BUG CORRIGE : ce fichier appelait apiGet/apiPost/apiPut partout mais ces
// helpers n'existaient nulle part dans le projet (ni ici, ni dans app-part*.js) —
// tout appel a l'un d'entre eux levait un ReferenceError avant meme d'atteindre
// le try/catch prevu. Implementation minimale alignee sur le meme pattern que
// le reste de l'app (state.settings.apiBase + jeton via getBackendToken(), voir
// fetchPlans() dans app-part3.js) : sans backend configure ou sans routes
// /or/* reelles cote serveur (aucune trouvee dans backend/ a ce jour — fonctionnalite
// non encore implementee cote backend), ces fonctions rejettent proprement et le
// code appelant retombe sur ses messages d'erreur deja traduits, au lieu de planter.
function _orApiBase() {
  if (!state.settings.apiBase) throw new Error('apiBase not configured');
  return state.settings.apiBase.replace(/\/+$/, '');
}
async function apiGet(path) {
  const token = await getBackendToken();
  const r = await fetch(_orApiBase() + path, { headers: { 'Authorization': 'Bearer ' + token } });
  await handleUnauthorized(r);
  return r;
}
async function apiPost(path, body) {
  const token = await getBackendToken();
  const r = await fetch(_orApiBase() + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body != null ? JSON.stringify(body) : undefined
  });
  await handleUnauthorized(r);
  return r;
}
async function apiPut(path, body) {
  const token = await getBackendToken();
  const r = await fetch(_orApiBase() + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body != null ? JSON.stringify(body) : undefined
  });
  await handleUnauthorized(r);
  return r;
}

let currentSchedules = [];
let operatingRooms = [];
let surgicalProcedures = [];
let latestOptimizationResponse = null;
let selectedOptimizationOption = null;

async function loadORSchedule() {
  const container = document.getElementById('or-calendar-container');
  if (container) {
    container.innerHTML = `<div style="color:var(--text3); font-size:12px; text-align:center; padding:20px;">${I18N.t('or.loadingSchedule')}</div>`;
  }

  try {
    // 1. Fetch operating rooms
    const resRooms = await apiGet('/or/rooms');
    if (resRooms.ok) {
      operatingRooms = await resRooms.json();
    }

    // 2. Fetch surgical procedures catalogue
    const resProcs = await apiGet('/or/procedures');
    if (resProcs.ok) {
      surgicalProcedures = await resProcs.json();
    }

    // 3. Fetch schedules
    const resSched = await apiGet('/or/schedule');
    if (resSched.ok) {
      currentSchedules = await resSched.json();
    }

    renderCalendar();
  } catch (e) {
    console.error('Erreur chargement OR', e);
    if (container) {
      container.innerHTML = `<div style="color:red; padding:20px; text-align:center;">${I18N.t('or.connectionError')}</div>`;
    }
  }
}

function renderCalendar() {
  const container = document.getElementById('or-calendar-container');
  if (!container) return;
  
  let html = `<div style="display:flex; flex-direction:column; gap:12px;">`;
  
  // Header timeline hours (07:00 to 19:00)
  html += `<div style="display:flex; padding-left:130px; font-size:11px; color:var(--text3); border-bottom:1px solid var(--border); padding-bottom:4px;">`;
  for (let h = 7; h <= 18; h++) {
    html += `<div style="flex:1; text-align:left; border-left:1px solid rgba(255,255,255,0.05); padding-left:4px;">${h.toString().padStart(2,'0')}:00</div>`;
  }
  html += `</div>`;

  operatingRooms.forEach(room => {
    html += `<div style="display:flex; border:1px solid var(--border); border-radius:8px; background:var(--bg2); overflow:hidden;">`;
    html += `<div style="width:130px; background:var(--bg0); padding:12px 10px; border-right:1px solid var(--border); font-size:12px; font-weight:bold; display:flex; flex-direction:column; justify-content:center;">
              <div>${room.name}</div>
              <div style="font-size:10px; color:var(--text3); font-weight:normal; margin-top:2px;">${(room.capabilities || []).join(', ') || room.type}</div>
            </div>`;
    
    html += `<div style="flex:1; position:relative; height:70px; background:var(--bg1);" 
                 class="or-droppable" 
                 ondragover="orDragOver(event)" 
                 ondrop="orDrop(event, '${room.id}')">`;
                 
    // Render blocks for this room
    const roomSchedules = currentSchedules.filter(s => s.operating_room_id === room.id);
    roomSchedules.forEach(s => {
      const st = new Date(s.start_time);
      const et = new Date(s.end_time);
      
      const startHour = st.getUTCHours() + st.getUTCMinutes()/60;
      const endHour = et.getUTCHours() + et.getUTCMinutes()/60;
      
      const leftPct = Math.max(0, (startHour - 7) / 12) * 100; // 07:00 to 19:00 = 12 hours
      const widthPct = Math.max(3, ((endHour - startHour) / 12) * 100);
      
      let color = '#6366f1'; // Draft / Scheduled default (Purple)
      if (s.status === 'frozen') color = '#3b82f6'; // Frozen (Blue)
      if (s.status === 'in_progress') color = '#0284c7'; // In progress (Cyan)
      if (s.status === 'completed') color = '#10b981'; // Completed (Green)
      if (s.delay_mins > 0) color = '#f59e0b'; // Delayed (Amber)

      let badgeIcon = '';
      if (s.status === 'frozen') badgeIcon = '🔒 ';
      if (s.delay_mins > 0) badgeIcon = `⚠️ +${s.delay_mins}m `;

      html += `<div class="or-draggable" draggable="true" 
                    ondragstart="orDragStart(event, '${s.id}')"
                    onclick="selectScheduleItem('${s.id}')"
                    style="position:absolute; left:${leftPct}%; width:${widthPct}%; height:90%; top:5%;
                           background:${color}; color:#fff; padding:6px 8px; border-radius:6px;
                           box-shadow:0 2px 4px rgba(0,0,0,0.2); font-size:11px; cursor:pointer; overflow:hidden;">
                 <div style="font-weight:bold; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${badgeIcon}${s.patient_name || s.patient_id}</div>
                 <div style="font-size:10px; opacity:0.9; margin-top:2px;">
                   ${st.getUTCHours().toString().padStart(2,'0')}:${st.getUTCMinutes().toString().padStart(2,'0')} - 
                   ${et.getUTCHours().toString().padStart(2,'0')}:${et.getUTCMinutes().toString().padStart(2,'0')}
                   ${s.procedure_name ? ' • ' + s.procedure_name : ''}
                 </div>
               </div>`;
    });
    
    html += `</div></div>`;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

let orDraggedScheduleId = null;

function orDragStart(event, scheduleId) {
  orDraggedScheduleId = scheduleId;
  event.dataTransfer.effectAllowed = "move";
}

function orDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

async function orDrop(event, roomId) {
  event.preventDefault();
  if (!orDraggedScheduleId) return;
  
  const sched = currentSchedules.find(s => s.id === orDraggedScheduleId);
  if (!sched) return;
  
  if (sched.operating_room_id === roomId) return; // Dropped in same room
  
  // 1. Instant backend constraint validation call before drop!
  try {
    const valRes = await apiPost('/or/schedule/validate-slot', {
      schedule_id: sched.id,
      operating_room_id: roomId,
      patient_id: sched.patient_id,
      procedure_id: sched.procedure_id,
      start_time: sched.start_time,
      end_time: sched.end_time,
      primary_surgeon_id: sched.primary_surgeon_id,
      anesthesiologist_id: sched.anesthesiologist_id
    });
    
    if (valRes.ok) {
      const val = await valRes.json();
      if (!val.is_valid) {
        notify(I18N.t('or.moveImpossible', { reasons: val.hard_blockers.join(" | ") }), "error");
        return;
      }
      if (val.soft_warnings.length > 0) {
        notify(I18N.t('or.warningPrefix', { warnings: val.soft_warnings.join(" | ") }), "warn");
      }
    }
  } catch(e) {
    console.warn("Validation des contraintes inaccessible", e);
  }

  // 2. Audit check if schedule is frozen
  let auditReason = null;
  if (sched.status === 'frozen') {
    auditReason = prompt(I18N.t('or.frozenPrompt'));
    if (!auditReason || auditReason.trim().length < 5) {
      notify(I18N.t('or.frozenCancelled'), "error");
      return;
    }
  }

  // 3. Execute update
  try {
    const res = await apiPut('/or/schedule/' + orDraggedScheduleId, {
      operating_room_id: roomId,
      audit_reason: auditReason
    });

    if (res.ok) {
      notify(I18N.t('or.slotMoved'), "ok");
      loadORSchedule();
    } else {
      const err = await res.json();
      notify(I18N.t('or.errorPrefix', { detail: err.detail || I18N.t('or.constraintViolated') }), "error");
    }
  } catch(e) {
    console.error("Erreur drop", e);
    notify(I18N.t('or.dropUpdateError'), "error");
  }
}

let selectedScheduleId = null;

function selectScheduleItem(scheduleId) {
  selectedScheduleId = scheduleId;
  const sched = currentSchedules.find(s => s.id === scheduleId);
  if (sched && sched.patient_id) {
    loadPreparationScore(sched.patient_id);
    renderScheduleActionsPanel(sched);
  }
}

function renderScheduleActionsPanel(sched) {
  const panel = document.getElementById('or-schedule-actions-panel');
  if (!panel) return;

  const st = new Date(sched.start_time);
  const et = new Date(sched.end_time);

  let html = `
    <div style="padding:12px; background:var(--bg0); border-radius:8px; border:1px solid var(--border); margin-top:15px; font-size:12px;">
      <div style="font-weight:bold; font-size:13px; margin-bottom:8px; color:var(--text1); display:flex; justify-content:space-between; align-items:center;">
        <span>${I18N.t('or.interventionLabel', { name: sched.patient_name || sched.patient_id })}</span>
        <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.1);">${sched.status.toUpperCase()}</span>
      </div>
      <div style="color:var(--text2); margin-bottom:10px;">
        ${I18N.t('or.roomLabel')} <b>${sched.room_name || sched.operating_room_id}</b> | ${I18N.t('or.scheduleLabel')} <b>${st.getUTCHours()}:${st.getUTCMinutes().toString().padStart(2,'0')} - ${et.getUTCHours()}:${et.getUTCMinutes().toString().padStart(2,'0')}</b>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" onclick="actionFreezeSchedule('${sched.id}')" ${sched.status === 'frozen' ? 'disabled' : ''}>
          ${I18N.t('or.freezeOfficial')}
        </button>
        <button class="btn btn-sm btn-primary" onclick="actionRecordDelayPrompt('${sched.id}')">
          ${I18N.t('or.delayRealTime')}
        </button>
      </div>
    </div>
  `;
  panel.innerHTML = html;
}

async function actionFreezeSchedule(scheduleId) {
  try {
    const res = await apiPost(`/or/schedule/${scheduleId}/freeze`, {});
    if (res.ok) {
      notify(I18N.t('or.programFrozen'), "ok");
      loadORSchedule();
    } else {
      notify(I18N.t('or.freezeError'), "error");
    }
  } catch(e) {
    notify(I18N.t('or.serverError'), "error");
  }
}

async function actionRecordDelayPrompt(scheduleId) {
  const mins = prompt(I18N.t('or.delayPrompt'));
  if (mins === null) return;

  const delayInt = parseInt(mins, 10);
  if (isNaN(delayInt)) return;

  const sched = currentSchedules.find(s => s.id === scheduleId);
  if (!sched) return;

  const originalStart = new Date(sched.start_time);
  const actualIncision = new Date(originalStart.getTime() + delayInt * 60000);

  try {
    const res = await apiPost(`/or/schedule/${scheduleId}/realtime`, {
      actual_incision_time: actualIncision.toISOString(),
      reason: "Saisie manuelle temps réel par le coordinateur du bloc"
    });

    if (res.ok) {
      notify(I18N.t('or.delayRecorded', { mins: delayInt }), "ok");
      loadORSchedule();
    } else {
      notify(I18N.t('or.realtimeError'), "error");
    }
  } catch(e) {
    notify(I18N.t('or.serverError'), "error");
  }
}

async function loadPreparationScore(patientId) {
  const container = document.getElementById('or-prep-score-container');
  if (!container) return;
  container.innerHTML = `<div style="color:var(--text3); font-size:12px; text-align:center; padding:20px;">${I18N.t('or.calculatingPrep')}</div>`;

  try {
    const res = await apiGet('/or/preparation/' + patientId);
    let data = null;
    
    if (res.ok) {
      data = await res.json();
    } else {
      data = {
        patient_id: patientId,
        score_pct: 70,
        readiness_status: "READY_WITH_WARNINGS",
        readiness_level: "🟠 READY WITH WARNINGS",
        critical_blockers: [],
        warnings: ["Bilan TP/INR non renseigné"],
        completed_count: 14,
        total_count: 20,
        imagerie: { "Scanner disponible": true, "Segmentation validée": true },
        chirurgie: { "Plan opératoire validé": true, "Indication chirurgicale": true },
        anesthesie: { "Consultation réalisée": true, "ASA renseigné": true },
        biologie: { "NFS": true, "TP/INR": false },
        bloc: { "Salle réservée": true },
        materiel: { "Instrumentation": true, "Implants": true },
        reanimation: { "Lit USI réservé": true }
      };
    }
    
    let badgeColor = '#10b981'; // Green
    if (data.readiness_status === 'BLOCKED') badgeColor = '#ef4444';
    if (data.readiness_status === 'READY_WITH_WARNINGS') badgeColor = '#f59e0b';

    let html = `
      <div style="text-align:center; margin-bottom:15px; background:var(--bg0); padding:15px; border-radius:8px; border:1px solid var(--border);">
        <div style="font-size:16px; font-weight:bold; color:${badgeColor}; margin-bottom:4px;">${data.readiness_level}</div>
        <div style="font-size:12px; color:var(--text2);">${I18N.t('or.conditionsValidated', { completed: data.completed_count, total: data.total_count, pct: data.score_pct })}</div>
      </div>
    `;

    // Critical blockers box
    if (data.critical_blockers && data.critical_blockers.length > 0) {
      html += `<div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:10px; border-radius:6px; margin-bottom:12px;">
        <div style="font-weight:bold; color:#ef4444; font-size:12px; margin-bottom:4px;">${I18N.t('or.criticalBlockers')}</div>
        <ul style="margin:0; padding-left:18px; font-size:12px; color:#fca5a5;">`;
      data.critical_blockers.forEach(b => {
        html += `<li>${b}</li>`;
      });
      html += `</ul></div>`;
    }

    // Warnings box
    if (data.warnings && data.warnings.length > 0) {
      html += `<div style="background:rgba(245,158,11,0.15); border:1px solid #f59e0b; padding:10px; border-radius:6px; margin-bottom:12px;">
        <div style="font-weight:bold; color:#f59e0b; font-size:12px; margin-bottom:4px;">${I18N.t('or.warnings')}</div>
        <ul style="margin:0; padding-left:18px; font-size:12px; color:#fcd34d;">`;
      data.warnings.forEach(w => {
        html += `<li>${w}</li>`;
      });
      html += `</ul></div>`;
    }

    // Titres de section traduits ; les libelles individuels de checklist
    // (checkName ci-dessous, ex. "Scanner disponible") restent tels que
    // renvoyes par le backend reel /or/preparation/{id} — ou par les
    // donnees de demonstration ci-dessus si le backend est indisponible.
    const sections = [
      { key: 'imagerie', title: I18N.t('or.sectionImaging') },
      { key: 'chirurgie', title: I18N.t('or.sectionSurgery') },
      { key: 'anesthesie', title: I18N.t('or.sectionAnesthesia') },
      { key: 'biologie', title: I18N.t('or.sectionBiology') },
      { key: 'bloc', title: I18N.t('or.sectionOrTeam') },
      { key: 'materiel', title: I18N.t('or.sectionEquipment') },
      { key: 'reanimation', title: I18N.t('or.sectionIcu') }
    ];

    sections.forEach(sec => {
      if (!data[sec.key]) return;
      html += `<div style="margin-bottom:10px;">
        <div style="font-weight:bold; margin-bottom:4px; font-size:11px; text-transform:uppercase; color:var(--text3);">${sec.title}</div>
        <ul style="list-style:none; padding:0; margin:0; font-size:12px;">`;
        
      for (const [checkName, isPassed] of Object.entries(data[sec.key])) {
        const icon = isPassed ? '<span style="color:#10b981">✅</span>' : '<span style="color:#ef4444">❌</span>';
        html += `<li style="margin-bottom:3px;">${icon} ${checkName}</li>`;
      }
      
      html += `</ul></div>`;
    });
    
    container.innerHTML = html;
    
  } catch (e) {
    console.error('Erreur prep score', e);
    if (container) {
      container.innerHTML = `<div style="color:red; padding:20px;">${I18N.t('or.prepLoadError')}</div>`;
    }
  }
}

async function optimizeScheduleAI() {
  notify(I18N.t('or.aiAnalyzing'), "info");
  
  try {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23,59,59,999);
    
    const res = await apiPost('/or/schedule/optimize', {
      date_start: today.toISOString(),
      date_end: endOfDay.toISOString()
    });
    
    if (res.ok) {
      latestOptimizationResponse = await res.json();
      
      const reasoningElem = document.getElementById('ai-opt-reasoning');
      if (reasoningElem) reasoningElem.innerText = latestOptimizationResponse.reasoning_summary;

      const timeElem = document.getElementById('ai-opt-time-saved');
      if (timeElem) timeElem.innerText = latestOptimizationResponse.estimated_time_saved_mins;
      
      let optionsHtml = '';
      if (latestOptimizationResponse.options && latestOptimizationResponse.options.length > 0) {
        selectedOptimizationOption = latestOptimizationResponse.options[0];
        
        optionsHtml += `<div style="display:flex; gap:10px; margin-bottom:15px;">`;
        latestOptimizationResponse.options.forEach((opt, idx) => {
          const activeStyle = idx === 0 ? 'border-color:#38bdf8; background:rgba(56,189,248,0.1);' : '';
          optionsHtml += `
            <button class="btn btn-sm btn-secondary" onclick="switchOptimizationOption('${opt.option_id}')" style="${activeStyle}">
              ${opt.title}
            </button>
          `;
        });
        optionsHtml += `</div>`;
      }

      const changesElem = document.getElementById('ai-opt-changes');
      if (changesElem) {
        changesElem.innerHTML = optionsHtml + renderOptionChangesList(latestOptimizationResponse.changes);
      }
      
      openModal('or-optimization-review');
    } else {
      notify(I18N.t('or.optimizeError'), "error");
    }
  } catch (e) {
    console.error("Erreur optimisation", e);
    notify(I18N.t('or.optimizeServerError'), "error");
  }
}

function switchOptimizationOption(optionId) {
  if (!latestOptimizationResponse || !latestOptimizationResponse.options) return;
  const opt = latestOptimizationResponse.options.find(o => o.option_id === optionId);
  if (opt) {
    selectedOptimizationOption = opt;
    latestOptimizationResponse.changes = opt.changes;
    latestOptimizationResponse.estimated_time_saved_mins = opt.time_saved_mins;
    
    const timeElem = document.getElementById('ai-opt-time-saved');
    if (timeElem) timeElem.innerText = opt.time_saved_mins;

    const changesElem = document.getElementById('ai-opt-changes');
    if (changesElem) {
      changesElem.innerHTML = renderOptionChangesList(opt.changes);
    }
  }
}

function renderOptionChangesList(changes) {
  if (!changes || changes.length === 0) {
    return `<div style="padding:15px; color:var(--text3);">${I18N.t('or.noMovesRequired')}</div>`;
  }
  let html = '';
  changes.forEach(c => {
    const sched = currentSchedules.find(s => s.id === c.schedule_id);
    const pName = sched ? sched.patient_name : c.schedule_id;

    const oldRoom = operatingRooms.find(r => r.id === c.original_room_id)?.name || c.original_room_id;
    const newRoom = operatingRooms.find(r => r.id === c.new_room_id)?.name || c.new_room_id;

    html += `
      <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); background:var(--bg0); border-radius:6px; margin-bottom:8px;">
        <div style="font-weight:bold; color:var(--text1)">${I18N.t('or.patientLabel', { name: pName })}</div>
        <div style="font-size:12px; margin-top:4px;">${I18N.t('or.assignmentLabel')} <span style="text-decoration:line-through; color:var(--text3)">${oldRoom}</span> ➔ <span style="color:#38bdf8; font-weight:bold;">${newRoom}</span></div>
        <div style="color:var(--text3); font-style:italic; margin-top:4px; font-size:11px;">"${c.reasoning}"</div>
      </div>
    `;
  });
  return html;
}

async function applyOptimization() {
  if (!latestOptimizationResponse || latestOptimizationResponse.changes.length === 0) {
    closeModal('or-optimization-review');
    return;
  }

  notify(I18N.t('or.applyingOptimization'), "info");

  try {
    const res = await apiPost('/or/schedule/apply-optimization', latestOptimizationResponse);
    if (res.ok) {
      notify(I18N.t('or.programUpdated'), "ok");
      closeModal('or-optimization-review');
      loadORSchedule();
    } else {
      notify(I18N.t('or.applyError'), "error");
    }
  } catch (e) {
    console.error("Erreur apply", e);
    notify(I18N.t('or.serverError'), "error");
  }
}

async function runWhatIfSimulation() {
  const roomSelect = prompt(I18N.t('or.whatIfPrompt'));
  let roomId = null;
  if (roomSelect && roomSelect.trim()) {
    const foundRoom = operatingRooms.find(r => r.name.toLowerCase().includes(roomSelect.toLowerCase()) || r.id === roomSelect);
    roomId = foundRoom ? foundRoom.id : roomSelect;
  }

  notify(I18N.t('or.whatIfLaunching'), "info");

  try {
    const today = new Date();
    const res = await apiPost('/or/simulation/what-if', {
      date: today.toISOString(),
      room_unavailable_id: roomId
    });

    if (res.ok) {
      const sim = await res.json();
      alert(`${I18N.t('or.whatIfResultTitle')}\n\n${I18N.t('or.whatIfScenario')} ${sim.scenario_description}\n${I18N.t('or.whatIfImpacted')} ${sim.impacted_schedules_count}\n${I18N.t('or.whatIfReallocations')} ${sim.reallocated_schedules.length}\n${I18N.t('or.whatIfDeprogramming')} ${sim.unfeasible_schedules.length}\n\n${I18N.t('or.whatIfRecommendation')}\n${sim.recommendation}`);
    } else {
      notify(I18N.t('or.whatIfError'), "error");
    }
  } catch (e) {
    notify(I18N.t('or.whatIfServerError'), "error");
  }
}

async function openORDurationAnalyticsModal() {
  openModal('or-duration-analytics');
  const container = document.getElementById('or-duration-analytics-content');
  if (!container) return;
  container.innerHTML = `<div style="color:var(--text3); text-align:center; padding:20px;">${I18N.t('or.loadingDurationStats')}</div>`;

  try {
    const res = await apiGet('/or/analytics/procedure-durations');
    if (res.ok) {
      const data = await res.json();
      if (!data.stats || data.stats.length === 0) {
        container.innerHTML = `<div style="color:var(--text3); text-align:center; padding:20px;">${I18N.t('or.noStatsAvailable')}</div>`;
        return;
      }

      let html = `
        <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border); color:var(--text2);">
              <th style="padding:8px;">${I18N.t('or.tableProcedure')}</th>
              <th style="padding:8px;">${I18N.t('or.tableSample')}</th>
              <th style="padding:8px;">${I18N.t('or.tableTheoreticalDuration')}</th>
              <th style="padding:8px;">${I18N.t('or.tableRealAverage')}</th>
              <th style="padding:8px;">${I18N.t('or.tableMedianP50')}</th>
              <th style="padding:8px; color:var(--accent);">${I18N.t('or.tableP90Predictive')}</th>
              <th style="padding:8px;">${I18N.t('or.tableAiRecommendation')}</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.stats.forEach(st => {
        html += `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:8px; font-weight:bold; color:var(--text1);">${st.procedure_name}</td>
            <td style="padding:8px;">${I18N.t('or.sampleCount', { count: st.sample_count })}</td>
            <td style="padding:8px;">${st.estimated_duration_mins} min</td>
            <td style="padding:8px;">${st.avg_actual_duration_mins} min</td>
            <td style="padding:8px;">${st.p50_duration_mins} min</td>
            <td style="padding:8px; font-weight:bold; color:#38bdf8;">${st.p90_duration_mins} min</td>
            <td style="padding:8px; color:var(--text2); font-style:italic;">${st.recommendation}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${I18N.t('or.statsLoadError')}</div>`;
    }
  } catch (e) {
    console.error("Erreur analytics", e);
    container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${I18N.t('or.networkError')}</div>`;
  }
}

async function openORAuditTrailModal() {
  openModal('or-audit-trail');
  const container = document.getElementById('or-audit-trail-content');
  if (!container) return;
  container.innerHTML = `<div style="color:var(--text3); text-align:center; padding:20px;">${I18N.t('or.loadingAuditTrail')}</div>`;

  try {
    const res = await apiGet('/or/audit-trail');
    if (res.ok) {
      const logs = await res.json();
      if (!logs || logs.length === 0) {
        container.innerHTML = `<div style="color:var(--text3); text-align:center; padding:20px;">${I18N.t('or.noAuditEvents')}</div>`;
        return;
      }

      let html = `
        <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border); color:var(--text2);">
              <th style="padding:8px;">${I18N.t('or.tableTimestamp')}</th>
              <th style="padding:8px;">${I18N.t('or.tableUser')}</th>
              <th style="padding:8px;">${I18N.t('or.tableAction')}</th>
              <th style="padding:8px;">${I18N.t('or.tableResource')}</th>
              <th style="padding:8px;">${I18N.t('or.tableLevel')}</th>
            </tr>
          </thead>
          <tbody>
      `;

      logs.forEach(l => {
        const dt = new Date(l.created_at).toLocaleString(I18N.currentIntl());
        const levelBadge = l.niveau === 'warning' ? '🟠 warning' : (l.niveau === 'error' ? '🔴 error' : '🟢 info');
        html += `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:8px; color:var(--text3); font-size:11px;">${dt}</td>
            <td style="padding:8px; font-weight:bold; color:var(--text1);">${l.username || I18N.t('or.systemUser')}</td>
            <td style="padding:8px; font-weight:bold; color:#38bdf8;">${l.action}</td>
            <td style="padding:8px; color:var(--text2);">${l.resource || '-'}</td>
            <td style="padding:8px;">${levelBadge}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${I18N.t('or.auditLoadError')}</div>`;
    }
  } catch (e) {
    console.error("Erreur audit", e);
    container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${I18N.t('or.networkError')}</div>`;
  }
}

/**
 * Charge le statut de conformité réglementaire MDR (UE) 2017/745 et HDS
 */
async function openMDRDossierModal() {
  openModal('mdr-dossier');
  const container = document.getElementById('mdr-dossier-content');
  if (!container) return;
  container.innerHTML = `<div style="color:var(--text3); text-align:center; padding:20px;">${I18N.t('or.loadingRegulatoryStatus')}</div>`;

  try {
    const res = await apiGet('/compliance/mdr-dossier-status');
    if (res.ok) {
      const d = await res.json();
      const T = (k) => I18N.t('or.' + k);
      let html = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:15px; border-radius:6px;">
            <div style="font-weight:bold; color:#ec4899; margin-bottom:8px;">${T('mdrClassification')}</div>
            <div style="font-size:13px; color:var(--text1); font-weight:600;">${d.mdr_classification}</div>
            <div style="font-size:11px; color:var(--text3); margin-top:4px;">${T('mdrEnvironment')} ${d.app_environment}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:15px; border-radius:6px;">
            <div style="font-weight:bold; color:#10b981; margin-bottom:8px;">${T('mdrHdsSecurity')}</div>
            <div style="font-size:12px; color:var(--text2);">
              • ${T('mdr2faMandatory')} <strong>${d.hds_security_checks.mandatory_2fa_enforced_in_production ? T('yes') : T('no')}</strong><br>
              • ${T('mdrYour2fa')} <strong>${d.hds_security_checks.current_user_2fa_enabled ? T('enabled') : T('inactive')}</strong><br>
              • ${T('mdrEncryption')} <strong>${d.hds_security_checks.pgcrypto_at_rest_available ? T('operational') : T('no')}</strong>
            </div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:15px; border-radius:6px; margin-bottom:15px;">
          <div style="font-weight:bold; color:#38bdf8; margin-bottom:8px;">${T('mdrQualityCi')}</div>
          <div style="font-size:12px; color:var(--text2); display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div>• ${T('mdrCiPipeline')} <strong>${d.quality_and_ci_isolation.ci_clinical_pipeline_isolated ? T('mdrIsolatedMain') : T('no')}</strong></div>
            <div>• ${T('mdrResearchMode')} <strong>${d.quality_and_ci_isolation.research_mode_active ? T('mdrResearch') : T('mdrProduction')}</strong></div>
            <div>• ${T('mdrRuffLinter')} <strong>${d.quality_and_ci_isolation.ruff_linter_enabled ? T('mdrActive') : T('mdrInactive')}</strong></div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:15px; border-radius:6px;">
          <div style="font-weight:bold; color:#a855f7; margin-bottom:8px;">${T('mdrClinicalData')}</div>
          <div style="font-size:12px; color:var(--text2); display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; text-align:center;">
            <div><div style="font-size:18px; font-weight:bold; color:#fff;">${d.clinical_evaluation_dataset.registered_patients_count}</div><div style="font-size:11px; color:var(--text3);">${T('mdrRegisteredPatients')}</div></div>
            <div><div style="font-size:18px; font-weight:bold; color:#fff;">${d.clinical_evaluation_dataset.validated_surgical_plans_count}</div><div style="font-size:11px; color:var(--text3);">${T('mdrValidatedPlans')}</div></div>
            <div><div style="font-size:18px; font-weight:bold; color:#fff;">${d.clinical_evaluation_dataset.audit_trail_records_count}</div><div style="font-size:11px; color:var(--text3);">${T('mdrAuditEvents')}</div></div>
          </div>
        </div>
      `;
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${I18N.t('or.mdrLoadError')}</div>`;
    }
  } catch (e) {
    console.error("Erreur MDR status", e);
    container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">${I18N.t('or.networkError')}</div>`;
  }
}

/**
 * Charge le tableau de bord B2B de la Suite Commerciale Hors Certification
 */
async function openCommercialSuiteModal() {
  openModal('commercial-suite');
  const container = document.getElementById('commercial-suite-content');
  if (!container) return;

  const T = (k) => I18N.t('or.' + k);
  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:15px; margin-bottom:20px;">

      <!-- VetSurg3D -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(0,242,254,0.3); padding:15px; border-radius:6px;">
        <div style="font-weight:bold; color:#00f2fe; margin-bottom:6px; font-size:14px;">${T('vetTitle')}</div>
        <div style="font-size:11.5px; color:var(--text3); margin-bottom:10px;">${T('vetSubtitle')}</div>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <select id="vet-species-sel" style="background:#1e293b; color:#fff; border:1px solid #334155; padding:4px; border-radius:4px; font-size:11px;">
            <option value="canine">${T('vetCanine')}</option>
            <option value="feline">${T('vetFeline')}</option>
            <option value="equine">${T('vetEquine')}</option>
          </select>
          <input id="vet-weight" type="number" value="25" placeholder="${T('vetWeightPlaceholder')}" style="width:70px; background:#1e293b; color:#fff; border:1px solid #334155; padding:4px; border-radius:4px; font-size:11px;">
        </div>
        <button onclick="testVetVolumetrie()" style="width:100%; background:#00f2fe; color:#000; font-weight:bold; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">${T('vetCalculate')}</button>
        <div id="vet-res" style="font-size:11px; margin-top:8px; color:#38bdf8;"></div>
      </div>

      <!-- SurgSim-Edu -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(168,85,247,0.3); padding:15px; border-radius:6px;">
        <div style="font-weight:bold; color:#a855f7; margin-bottom:6px; font-size:14px;">${T('eduTitle')}</div>
        <div style="font-size:11.5px; color:var(--text3); margin-bottom:10px;">${T('eduSubtitle')}</div>
        <button onclick="testEduScenarios()" style="width:100%; background:#a855f7; color:#fff; font-weight:bold; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">${T('eduBrowseCatalog')}</button>
        <div id="edu-res" style="font-size:11px; margin-top:8px; color:#c084fc;"></div>
      </div>

      <!-- OR-Optimizer KPI -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(34,197,94,0.3); padding:15px; border-radius:6px;">
        <div style="font-weight:bold; color:#22c55e; margin-bottom:6px; font-size:14px;">${T('orKpiTitle')}</div>
        <div style="font-size:11.5px; color:var(--text3); margin-bottom:10px;">${T('orKpiSubtitle')}</div>
        <button onclick="testOrKpi()" style="width:100%; background:#22c55e; color:#000; font-weight:bold; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">${T('orKpiAudit')}</button>
        <div id="or-kpi-res" style="font-size:11px; margin-top:8px; color:#4ade80;"></div>
      </div>

      <!-- SurgData Radiomics -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(245,158,11,0.3); padding:15px; border-radius:6px;">
        <div style="font-weight:bold; color:#f59e0b; margin-bottom:6px; font-size:14px;">${T('radiomicsTitle')}</div>
        <div style="font-size:11.5px; color:var(--text3); margin-bottom:10px;">${T('radiomicsSubtitle')}</div>
        <button onclick="testRadiomicsExport()" style="width:100%; background:#f59e0b; color:#000; font-weight:bold; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:11px;">${T('radiomicsExport')}</button>
        <div id="radiomics-res" style="font-size:11px; margin-top:8px; color:#fbbf24;"></div>
      </div>

    </div>
  `;
}

async function testVetVolumetrie() {
  const species = document.getElementById('vet-species-sel').value;
  const weight = parseFloat(document.getElementById('vet-weight').value) || 25.0;
  const out = document.getElementById('vet-res');
  out.innerText = I18N.t('or.vetCalculating');
  try {
    const res = await apiPost(`/vet/volumetrie?species=${species}&weight_kg=${weight}&lesion_volume_ml=15.0`);
    if (res.ok) {
      const d = await res.json();
      out.innerHTML = I18N.t('or.vetOrganVolume', { vol: d.estimated_total_organ_volume_ml, pct: d.remnant_pct, safety: d.is_safe ? I18N.t('or.vetSafe') : I18N.t('or.vetSubtotal') });
    } else { out.innerText = I18N.t('or.vetError'); }
  } catch(e) { out.innerText = I18N.t('or.radiomicsServerUnavailable'); }
}

async function testEduScenarios() {
  const out = document.getElementById('edu-res');
  out.innerText = I18N.t('or.eduLoading');
  try {
    const res = await apiGet('/surgsim-edu/scenarios');
    if (res.ok) {
      const list = await res.json();
      out.innerHTML = list.map(c => `• <strong>${c.case_id}</strong>: ${c.title} (${c.difficulty})`).join('<br>');
    } else { out.innerText = I18N.t('or.eduError'); }
  } catch(e) { out.innerText = I18N.t('or.radiomicsServerUnavailable'); }
}

async function testOrKpi() {
  const out = document.getElementById('or-kpi-res');
  out.innerText = I18N.t('or.orKpiAnalyzing');
  try {
    const res = await apiGet('/operations/kpi');
    if (res.ok) {
      const d = await res.json();
      out.innerHTML = I18N.t('or.orKpiOccupancy', { pct: d.or_occupancy_rate_pct, savings: d.estimated_monthly_overtime_cost_savings_eur });
    } else { out.innerText = I18N.t('or.orKpiError'); }
  } catch(e) { out.innerText = I18N.t('or.radiomicsServerUnavailable'); }
}

async function testRadiomicsExport() {
  const out = document.getElementById('radiomics-res');
  out.innerText = I18N.t('or.radiomicsExporting');
  try {
    const patId = window.currentPatientId || "PAT-DEMO";
    const res = await apiPost(`/radiomics/anonymized-export/${patId}`);
    if (res.ok) {
      const d = await res.json();
      out.innerHTML = I18N.t('or.radiomicsExported', { id: d.anonymized_patient.id, count: d.radiomic_features_3d.voxel_count });
    } else { out.innerText = I18N.t('or.radiomicsPatientRequired'); }
  } catch(e) { out.innerText = I18N.t('or.radiomicsServerUnavailable'); }
}
