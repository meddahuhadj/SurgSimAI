          // ════════════════════════════════════════════════
          //  MODULE REGISTRY — Définition des spécialités
          // ════════════════════════════════════════════════
          // ════════════════════════════════════════════════
          //  I18N — moteur d'internationalisation (EN/FR/AR-RTL/NL)
          // ════════════════════════════════════════════════
          // Architecture : dictionnaires externes i18n/{locale}.json charges en lazy-load (vrai
          // lazy-load, editables sans toucher au HTML, source de l'export/import de l'editeur de
          // traductions) AVEC repli automatique sur une copie embarquee (I18N_EMBEDDED, generee depuis
          // ces memes 4 fichiers) si fetch() echoue -- notamment en mode file:// (double-clic, sans
          // serveur), ou fetch() d'un fichier local est bloque par le navigateur. Resultat : l'app
          // reste multilingue meme ouverte en double-clic, ET editable via /i18n/*.json quand servie
          // par un serveur (backend ou autre).
          //
          // Perimetre couvert (Phase 1) : chrome UI principal (barre d'outils, onglets, panneaux
          // Plan/Analyse/Staging/DICOM/Audit, notifications courantes, parametres, fiche patient, chat
          // IA hors-ligne). Les ~15 modales exploratoires "NextGen" (deja masquees hors Mode Recherche)
          // restent en francais dans cette passe ; le mecanisme ci-dessous les rend triviales a etendre
          // (ajouter des cles dans les 4 fichiers i18n/*.json + I18N_EMBEDDED, puis data-i18n / I18N.t()
          // dans le HTML/JS concerne -- aucun changement d'architecture necessaire).
          const I18N_EMBEDDED = {"en": {"meta": {"locale": "en", "name": "English", "nativeName": "English", "flag": "🇺🇸", "dir": "ltr", "intl": "en-US"}, "hub": {"subtitle": "AI-Assisted Surgical Simulation & Research Platform", "tagline": "Academic platform for scientific experimentation and Voice-First surgical simulation.", "academic": {"title": "ACADEMIC", "subtitle": "Learn · Practice · Evaluate"}, "research": {"title": "RESEARCH", "subtitle": "Design · Experiment · Analyze"}, "simulation": {"title": "SIMULATION", "subtitle": "Plan · Simulate · Compare"}, "clinical": {"title": "CLINICAL", "subtitle": "Restricted / Separate environment"}, "disclaimer": "⚠️ For research, education and simulation purposes only. Not intended for clinical diagnosis or treatment."}, "modes": {"common": {"back": "← Back", "export": "📥 Export", "voiceDictation": "🎙️ Voice dictation", "notAvailable": "N/A"}, "academic": {"badge": "ACADEMIC MODE", "heading": "Surgical Learning Platform", "subtitle": "Annotated virtual cases, detailed scoring, comparison with the reference strategy.", "libraryTitle": "📚 Educational Case Library", "startCase": "Start →", "objectivesCount": "{count} objective{count, plural, one {} other {s}}", "leaderboardTitle": "🏆 Surgical Challenge — Leaderboard", "noSessions": "No sessions yet. Launch a case to get started.", "tableRank": "#", "tableCase": "Case", "tableScore": "Score", "tableTime": "Time", "tableDate": "Date", "justifTitle": "✍️ Strategy justification", "justifDesc": "Explain why you chose this approach, the margins retained, and the at-risk structures avoided.", "justifPlaceholder": "Enter your clinical reasoning here (voice or text)...", "voiceRecordingStarted": "Voice recording started...", "submitEvaluate": "Submit & Evaluate →", "justifTooShort": "Please provide a more detailed justification (min. 10 characters).", "engineNotLoaded": "V2 Academic Engine not loaded.", "examInProgressTitle": "🎓 EXAM IN PROGRESS — Case {caseId}", "gradeToImprove": "📚 TO IMPROVE", "gradeExcellent": "🏆 EXCELLENT", "gradeVeryGood": "🥇 VERY GOOD", "gradeGood": "🥈 GOOD", "completionTime": "Completion time: {min}m {sec}s", "objectiveScore3d": "Objective Score (3D)", "expertJuryScore": "Expert / Jury Score", "aiSocraticReview": "AI Socratic Review", "aiSocraticExcellent": "Excellent", "detail6dEngineTitle": "6D Engine Detail", "backToHubBtn": "Back to Hub", "exportScientificReportBtn": "Export Scientific Report", "exportingScientificReport": "Exporting scientific record (JSON)...", "dimensions": {"anatomy": "Anatomy", "planning": "Planning", "precision": "Precision", "safety": "Safety", "efficiency": "Efficiency", "decision": "Decision"}}, "research": {"badge": "RESEARCH MODE", "heading": "Scientific Experimentation Platform", "subtitle": "Design, run and analyze surgical studies. Export your datasets for publication.", "studiesTitle": "📊 Available Studies", "studyLabel": "Study {id}", "launchStudy": "Launch study →", "sessionsTitle": "📂 Recorded Sessions", "groupLabel": "Group {group}", "confidencePrompt": "On a scale of 1 to 10, how confident are you in the established plan?", "sessionCompleteTitle": "Study {id} — Session Complete", "metricTime": "⏱ Time", "metricClicks": "🖱 Clicks", "metricVoice": "🎙 Voice", "metricPlanMods": "📝 Plan changes", "metricErrors": "❌ Errors", "metricConfidence": "💪 Confidence", "hypothesisLabel": "Hypothesis:", "exportDataset": "📥 Export Dataset (JSON + CSV)", "noSessions": "No sessions yet. Launch a study to record data.", "sessionCount": "{count} session{count, plural, one {} other {s}} recorded", "lockRequiredAlert": "🔒 RESEARCH STUDY LOCK REQUIRED\nCannot start the official study \"{protocolId}\" without a connection to the FastAPI randomization server.\nAsk the researcher to start the uvicorn server.", "analyticsSessionSummaryTitle": "📊 ANALYTICS Session Summary", "assignedGroupLabel": "Assigned group:", "loggedEventsLabel": "Logged events:", "voiceCommandsLabelV2": "Voice Commands:", "uiErrorsLabel": "UI Errors:", "endStudyBtn": "End Study", "exportDatasetJsonBtn": "Export Dataset (JSON)"}, "simulation": {"badge": "SIMULATION MODE", "heading": "Surgical Simulation Environment", "subtitle": "Virtual cases, comparative scenarios, voice commands and 3 AI levels.", "disclaimer": "⚠️ Simulated results — Not intended for real clinical guidance.", "libraryTitle": "📚 CASE LIBRARY", "launchCase": "Simulate →", "aiLevelTitle": "🤖 AI Level", "voiceCommandsTitle": "🎙 Voice Commands", "reportTitle": "📊 Simulation Report", "caseFallback": "Simulation case", "reportTime": "⏱ Time", "reportVolResected": "✂️ Resected vol. [estimated]", "reportVolRemnant": "🫀 Remaining vol. [estimated]", "reportDistance": "📏 Min. distance", "reportUnsafeMargins": "⚠ Unsafe margins", "reportErrors": "❌ Errors", "reportVoiceCmds": "🎙 Voice commands", "reportScenarios": "📋 Scenarios", "scoreFinal": "Final Score", "comparisonDisclaimer": "⚠️ Analytic estimate (equivalent sphere) from case data — not an exact triangulated mesh calculation, non-clinical, for educational use only.", "reportDisclaimer": "⚠️ Volumes/distances: analytic estimate (equivalent sphere) from case data — not an exact triangulated mesh calculation, not intended to guide a real clinical procedure.", "exportJson": "📥 Export JSON", "needTwoScenariosAlert": "Create at least 2 scenarios (via the + button or Fork) to compare them.", "needTwoScenariosNotify": "⚠ Create at least 2 scenarios to compare them.", "marginPrompt": "Desired resection margin for this scenario (mm)?", "scenarioDefaultName": "Scenario {letter}", "addScenario": "+ Scenario", "scenarioCreatedNotify": "✅ {name} created (Forked from {parent}, margin {margin}mm).", "scenarioSwitchNotify": "🔄 Switched to {name}.", "scenarioOrigin": "start", "comparisonTitle": "⚖️ Scenario Comparison", "actionsLabel": "Actions", "geometryUnavailable": "⚠️ Geometry unavailable for this case — not computed.", "volResectedLabel": "Resected volume [estimated]", "volRemnantLabel": "Remaining volume [estimated]", "distanceToVessel": "Dist. {vessel}", "criticalVesselFallback": "critical vessel", "marginDeficit": "❌ Margin > available space (deficit {n} mm)", "preservesTissue": "{name} preserves more tissue (analytic estimate).", "noActionsRecorded": "No actions recorded", "caseLoadedLabel": "Case loaded", "aiMsgObserver": "👁 Observer AI — Silent. Work freely.", "aiMsgAssistant": "🤖 Assistant AI — I will alert you if a structure is at risk.", "aiMsgAdversary": "⚔️ Adversary AI — I will propose my own strategy. Defend your plan!", "aiCheckAssistantWarn": "⚠️ [Assistant AI] Vascular structure at {dist} mm. Insufficient margin — recommendation ≥ 8 mm.", "aiCheckAssistantOk": "✅ [Assistant AI] Correct margin: {dist} mm.", "aiCheckAdversary": "⚔️ [Adversary AI] Posterior approach proposed: margin {dist} mm. Residual volume +8%. Defend your choice.", "aiLevelStatus": "AI Lvl.{level} — {name}", "aiLevelActivatedNotify": "🤖 AI level {level} activated", "forkLabel": "Fork from {parent} (margin {margin}mm)", "marginParenLabel": "(Margin {mm}mm)", "metricsUnavailableV2": "⚠️ Metrics not computed — geometry unavailable for this case.", "tradeoffScoreLabel": "Trade-off score:", "volResectedEstColon": "Resected vol. [estimated]:", "volRemnantEstColon": "Remaining vol. [estimated]:", "criticalVesselFixedColon": "Dist. critical vessel [fixed, anatomical]:", "marginExceedsColonDeficit": "❌ Requested margin > available space (deficit {n} mm)", "offlineSuffix": "— offline"}, "difficulty": {"beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced", "expert": "Expert"}, "caseType": {"synthetic": "Synthetic case", "ai": "AI-generated case", "real": "Anonymized real case"}, "organs": {"liver": "Liver", "pancreas": "Pancreas", "kidney": "Kidney", "gynecology": "Gynecology", "pediatrics": "Pediatrics"}, "aiLevel": {"observer": {"title": "Observer", "desc": "Silent"}, "assistant": {"title": "Assistant", "desc": "Structure alerts"}, "adversary": {"title": "Adversary", "desc": "Counter-strategy"}}}, "or": {"loadingSchedule": "Loading the OR schedule and constraints...", "connectionError": "Connection error to the scheduling server.", "moveImpossible": "🔴 Cannot move the procedure: {reasons}", "warningPrefix": "🟠 Warning: {warnings}", "frozenPrompt": "This schedule is FROZEN. Enter the administrative/medical emergency reason to change the room:", "frozenCancelled": "Change cancelled: an audit justification is required for a frozen schedule.", "slotMoved": "Slot moved and validated under constraints", "errorPrefix": "Error: {detail}", "constraintViolated": "Constraint violated", "dropUpdateError": "Error during update", "interventionLabel": "Procedure: {name}", "roomLabel": "Room:", "scheduleLabel": "Time:", "freezeOfficial": "🔒 Official Freeze", "delayRealTime": "⏱ Delay / Actual Times", "programFrozen": "Official schedule frozen and signed.", "freezeError": "Error freezing the schedule.", "serverError": "Server error", "delayPrompt": "Number of minutes of actual delay or lead time to record (e.g. 30 for a 30 min delay):", "delayRecorded": "Delay of +{mins} min recorded. Following procedures in the room automatically shifted.", "realtimeError": "Error recording real-time data.", "calculatingPrep": "Calculating readiness score and checking blockers...", "conditionsValidated": "{completed} / {total} conditions validated ({pct}%)", "criticalBlockers": "🔴 Critical blockers (procedure not allowed)", "warnings": "🟠 Warnings", "sectionImaging": "3D Imaging", "sectionSurgery": "Surgery", "sectionAnesthesia": "Anesthesia", "sectionBiology": "Lab Work", "sectionOrTeam": "OR & Team", "sectionEquipment": "Equipment", "sectionIcu": "ICU", "prepLoadError": "Error loading readiness data.", "aiAnalyzing": "The Constraint Engine & AI Copilot is analyzing options...", "optimizeError": "Error computing the optimization.", "optimizeServerError": "Server error during optimization.", "noMovesRequired": "No room changes required. The schedule is already optimal under constraints.", "patientLabel": "Patient: {name}", "assignmentLabel": "Assignment:", "applyingOptimization": "Applying the selected optimization proposal...", "programUpdated": "Schedule updated and validated under constraints!", "applyError": "Error applying the change.", "whatIfPrompt": "Simulate a room being unavailable? Enter the room name/ID (e.g. bloc-2 or Room 2) or leave blank:", "whatIfLaunching": "Launching the \"What-If\" virtual sandbox...", "whatIfError": "Error running the simulation.", "whatIfServerError": "Server error during simulation", "whatIfResultTitle": "📊 VIRTUAL SIMULATION RESULT (No impact on real data)", "whatIfScenario": "Scenario:", "whatIfImpacted": "Affected procedures:", "whatIfReallocations": "Possible reallocations:", "whatIfDeprogramming": "Cancellations to expect:", "whatIfRecommendation": "Recommendation:", "loadingDurationStats": "Loading duration statistics...", "noStatsAvailable": "No statistical data available.", "tableProcedure": "Procedure", "tableSample": "Sample", "tableTheoreticalDuration": "Theoretical Duration", "tableRealAverage": "Real Average", "tableMedianP50": "Median P50", "tableP90Predictive": "Predictive P90", "tableAiRecommendation": "AI Recommendation", "sampleCount": "{count} case(s)", "statsLoadError": "Unable to load statistics.", "networkError": "Network error while fetching data.", "loadingAuditTrail": "Loading the OR audit trail...", "noAuditEvents": "No audit events recorded.", "tableTimestamp": "Timestamp", "tableUser": "User", "tableAction": "Action", "tableResource": "Resource", "tableLevel": "Level", "systemUser": "System", "auditLoadError": "Unable to load the audit trail.", "loadingRegulatoryStatus": "Loading regulatory status...", "mdrLoadError": "Unable to retrieve MDR status.", "mdrClassification": "📋 Medical Device Classification", "mdrEnvironment": "Environment:", "mdrHdsSecurity": "🔒 HDS Compliance &amp; Security", "mdr2faMandatory": "Mandatory 2FA in production:", "mdrYour2fa": "Your user 2FA:", "mdrEncryption": "pgcrypto At-Rest encryption:", "yes": "🟢 Yes", "no": "🔴 No", "enabled": "🟢 Enabled", "inactive": "🟠 Inactive", "operational": "🟢 Operational", "mdrQualityCi": "🛠️ Quality &amp; CI/CD Isolation", "mdrCiPipeline": "Clinical CI pipeline isolated:", "mdrIsolatedMain": "🟢 Isolated (main)", "mdrResearchMode": "Research Mode active:", "mdrResearch": "⚠️ Research", "mdrProduction": "🟢 Production", "mdrRuffLinter": "Ruff Linter &amp; Mypy:", "mdrActive": "🟢 Active", "mdrInactive": "🔴 Inactive", "mdrClinicalData": "📊 Clinical Evaluation Data", "mdrRegisteredPatients": "Registered Patients", "mdrValidatedPlans": "Validated Plans", "mdrAuditEvents": "Audit Events", "vetTitle": "🐾 1. VetSurg3D", "vetSubtitle": "Veterinary Surgery & Volumetry (Canine/Equine).", "vetCanine": "Canine (Dog)", "vetFeline": "Feline (Cat)", "vetEquine": "Equine (Horse)", "vetWeightPlaceholder": "Weight kg", "vetCalculate": "📐 Calculate Veterinary Volume", "vetCalculating": "Calculating...", "vetError": "Calculation error.", "vetOrganVolume": "✅ Organ Volume: {vol} mL<br>Remaining Tissue: <strong>{pct}%</strong> ({safety})", "vetSafe": "🟢 Safe", "vetSubtotal": "🔴 Subtotal", "eduTitle": "🎓 2. SurgSim-Edu 3D", "eduSubtitle": "Virtual simulations for teaching hospitals & residents.", "eduBrowseCatalog": "📚 Browse Teaching Hospital Catalog", "eduLoading": "Loading...", "eduError": "Loading error.", "orKpiTitle": "📊 3. OR-Optimizer KPI", "orKpiSubtitle": "OR profitability & logistics audit.", "orKpiAudit": "📈 Audit OR Profitability", "orKpiAnalyzing": "Analyzing...", "orKpiError": "KPI error.", "orKpiOccupancy": "Occupancy rate: <strong>{pct}%</strong><br>Estimated savings: <strong>{savings} € / month</strong>", "radiomicsTitle": "🧪 4. SurgData Research", "radiomicsSubtitle": "Anonymized Dataset Export (RUO).", "radiomicsExport": "🔬 Export 3D AI Dataset", "radiomicsExporting": "Exporting...", "radiomicsPatientRequired": "A selected patient is required.", "radiomicsServerUnavailable": "Server unavailable.", "radiomicsExported": "✅ Dataset Exported!<br>Pseudo-ID: <code>{id}</code><br>3D voxels analyzed: {count}"}, "common": {"close": "Close", "cancel": "Cancel", "save": "Save", "apply": "Apply", "export": "Export", "import": "Import", "edit": "Edit", "delete": "Delete", "loading": "Loading…", "search": "Search…", "yes": "Yes", "no": "No", "warning": "Warning", "error": "Error", "success": "Success", "info": "Info", "notImplemented": "Not implemented in this prototype", "notCalculated": "Not calculated", "none": "None", "unknown": "Unknown"}, "nav": {"plan": "Plan", "dicom": "DICOM", "twin": "Digital Twin", "ar": "Augmented Reality", "audit": "Audit Trail", "surgai": "SurgAI", "surgsim": "SurgSim", "surgor": "OR AI", "surgnav": "GPS Nav", "surgvoice": "Assistant", "mdrFda": "Compliance", "researchToggle": "Research Mode — reveals exploratory modules not clinically validated (Milestones M21-M40)", "dashToggle": "OR Dashboard", "orToggle": "Operating Room Mode (shared screen)", "touchToggle": "Touch mode (enlarged targets)", "readonlyToggle": "Read-only mode (OR team)", "themeToggle": "Theme", "hubToggle": "Switch module / specialty", "settingsToggle": "Technical settings (Gemini, backend) — research/maintenance mode only", "patientsToggle": "Patients", "logout": "Log out", "preanesthesieToggle": "Pre-anesthesia record", "icuFollowupToggle": "ICU follow-up", "exitOr": "Exit OR Mode", "exitDash": "Exit Dashboard", "researchBanner": "🔬 RESEARCH MODE ACTIVE — the modules shown above are exploratory (Milestones M21-M40), not clinically validated, and must not be used for decision-making in the OR.", "researchModeOnNotify": "🔬 Research Mode activated — exploratory modules + technical Settings (⚙) visible", "researchModeOffNotify": "✅ Clinical Mode — only tools validated for the OR are displayed", "researchModeDeniedNotify": "🔒 Research Mode is not included in your plan ({plan}) — contact an administrator to upgrade."}, "login": {"title": "Sign in", "username": "Username", "password": "Password", "submit": "Sign in", "twofaHint": "6-digit code (authenticator app) or a recovery code.", "twofaCode": "Code", "demoAccountLabel": "💡 Demo Account:", "demoPasswordLabel": "Password:"}, "lang": {"selectorLabel": "Language", "en": "English", "fr": "Français", "ar": "العربية", "nl": "Nederlands", "changed": "Language switched to {language}"}, "sidebar": {"ageSex": "Age / Sex", "weightHeight": "Weight / Height", "diagnosis": "Diagnosis", "orPlanning": "OR Schedule", "notScheduledToday": "Not scheduled today", "urgencyRed": "🔴 Urgent", "urgencyOrange": "🟠 Semi-urgent", "urgencyGreen": "🟢 Scheduled", "switchModule": "Switch module", "room": "Room {n}", "statusOngoing": "Ongoing", "statusDone": "Done", "statusPlanned": "Planned"}, "toolbar": {"importDicom": "Import DICOM", "realSegmentation": "Real AI Segmentation", "realSegmentationTitle": "Runs a real segmentation inference (TotalSegmentator) on the backend and loads the resulting real 3D meshes", "pacs": "PACS", "pacsTitle": "Search a study on the PACS (QIDO-RS) and import a series (WADO-RS)", "threshold3d": "3D Threshold", "voxelsToggle": "Show/hide the voxelized DICOM organ in the 3D scene", "recenter": "Recenter", "recenterTitle": "Recenter camera on the DICOM organ (key R)", "reset": "Reset", "resetTitle": "Reset rotation + zoom (key Space)", "spin": "Spin", "spinTitle": "Toggle automatic rotation"}, "analysis": {"sectionTitle": "Volumetry (computed on the current 3D volume)", "organVolume": "Organ volume", "resectionVolume": "Estimated resection volume", "remnant": "Functional remnant", "realSegmentationBadge": "🏥 real segmentation", "proceduralBadge": "⚠ procedural estimate, non-clinical", "proceduralNote": "Estimate derived from the displayed voxel volume, not a validated AI segmentation. Use “🔬 Real AI Segmentation” for a TotalSegmentator-based calculation.", "riskScoreTitle": "Operative risk score", "riskScoreBadge": "⚠ internal heuristic, not clinically validated", "riskScoreBasedOn": "based on {count} off-target metric(s), age, urgency — internal formula, not a validated risk scale (e.g. POSSUM, ASA)", "riskLow": "Low", "riskModerate": "Moderate", "riskHigh": "High", "scenarios": "Predictive scenarios", "scenarioOptimistic": "Optimistic", "scenarioExpected": "Expected", "scenarioUnfavorable": "Unfavorable", "remnantFunctional": "{pct}% functional remnant", "recalculate": "↻ Recalculate", "recalculated": "Analysis recalculated", "exportPlan": "⭳ Export plan (DICOM SR / JSON)"}, "staging": {"tnmTitle": "🔬 TNM Staging", "tField": "T (Tumor)", "nField": "N (Lymph nodes)", "mField": "M (Metastasis)", "hbpParams": "🏥 HBP Parameters", "bclcField": "BCLC", "childPughField": "Child-Pugh", "colorectalParams": "🏥 Colorectal Parameters", "crmField": "CRM", "thoracicParams": "🫁 Thoracic Parameters", "vemsField": "Preop. FEV1", "volumetryTitle": "📊 Volumetry", "volumetryRealBadge": "🏥 real", "volumetryEstimateBadge": "⚠ estimate", "organVolumeReal": "Organ volume (real AI segmentation)", "organVolumeEstimate": "Organ volume (current volume, estimate)", "tumorVolume": "Segmented tumor volume", "noSegmentation": "(no segmentation)", "computeResectability": "🔄 Compute resectability", "auditLogTitle": "📋 Audit Log ({count} entr{count, plural, one {y} other {ies}})", "auditLogEmpty": "No action recorded.", "resectable": "✅ Resectable — Surgery indicated", "notResectable": "❌ Not resectable as is — Discuss alternative", "exportReport": "⭳ Export staging summary", "reportExported": "Staging report exported (JSON)"}, "dicom": {"importing": "Importing {count} file(s)…", "resampling": "Resampling {n}³ voxels…", "loaded": "{count} DICOM slice(s) loaded — Scroll=navigate, WW={ww} WL={wl}", "reconstructing": "Reconstructing 3D…", "voxelizing": "Voxelizing at threshold {threshold} HU…", "realVolumeShown": "✓ Real DICOM volume shown in 3D — threshold {threshold} HU, {count} voxel(s) in {chunks} chunk(s)", "noVolume": "No DICOM volume to display", "noVoxelsAboveThreshold": "No voxel ≥ {threshold} HU — lower the threshold in the 🎚 bar", "hidden": "DICOM voxels hidden — procedural anatomy restored", "shown": "Real DICOM voxels shown", "reconstructionFailed": "3D reconstruction failed: {error}"}, "settings": {"title": "Settings", "geminiKey": "Gemini API Key", "geminiModel": "Gemini Model", "geminiModelHint": "gemini-flash-latest always points to the newest Flash release (avoids deprecations). Alternatives: {alt1}, {alt2}, or {alt3} (closes 2026-07-22).", "groqKey": "Groq API Key (fallback)", "backendUrl": "Backend URL", "surgeonName": "Surgeon name", "localAiTitle": "🔒 Local AI (offline-first — zero network, zero data leak)", "localAiHint": "If configured below, the local AI is ALWAYS tried first, before Gemini/Groq/backend — the prompt and response never leave the device (WebGPU) or the local network (server).", "localServer": "Local server (Ollama / llama.cpp, OpenAI-compatible API)", "localServerModel": "Model name on the local server", "webgpuModel": "Local in-browser model (WebGPU, WebLLM)", "webgpuChecking": "Checking WebGPU support…", "loadModel": "⬇ Load model", "unloadModel": "✕ Unload", "webgpuHint": "First load: ~1-5 GB download (cached by the browser via IndexedDB — instant afterwards). Requires Chrome/Edge 113+ (desktop or recent Android); not available on Safari/Firefox yet. Once loaded, no network request is made to generate a reply.", "offlineCertifiedTitle": "📚 Certified offline mode", "offlineCertifiedHint": "Forces pre-computed answers, even if an AI key is configured. No network call to Gemini/Groq."}, "patients": {"title": "Patient Database", "searchPlaceholder": "Search a patient…", "editCurrent": "✎ Edit current patient", "updated": "Patient updated (local)", "syncedBackend": "Synced with backend"}, "preanesthesia": {"title": "🩺 Pre-anesthesia record", "forPatient": "Patient of the active module", "asaScore": "ASA score", "asaUrgence": "Emergency (U)", "mallampati": "Mallampati score", "intubationDifficile": "Anticipated difficult intubation", "jeuneSolide": "Solid food fasting (h)", "jeuneLiquide": "Clear liquid fasting (h)", "antecedents": "Medical history", "allergies": "Allergies", "traitement": "Chronic treatment", "checklist": "OR checklist", "anesthesiste": "Anesthesiologist", "conclusion": "Conclusion / plan", "updated": "Pre-anesthesia record updated (local)"}, "icuFollowup": {"title": "🛌 ICU follow-up", "forPatient": "Patient of the active module", "newEntry": "+ New assessment", "sofaRespiration": "Respiration", "sofaCoagulation": "Coagulation", "sofaHepatique": "Liver", "sofaCardio": "Cardiovascular", "sofaNeuro": "Neurological", "sofaRenal": "Renal", "sofaTotal": "SOFA total:", "apache2": "APACHE II score (0-71)", "rass": "RASS", "gcsEye": "Eye (1-4)", "gcsVerbal": "Verbal (1-5)", "gcsMotor": "Motor (1-6)", "gcsTotal": "Glasgow total:", "ventilation": "Mechanical ventilation", "ventMode": "Mode", "bilan": "Fluid balance", "entrees": "Intake (ml)", "sorties": "Output (ml)", "bilanNet": "Net balance:", "notes": "Notes", "auteur": "Author", "add": "+ Add assessment"}, "audit": {"title": "📜 Audit Trail", "filterByPatient": "Filter by patient", "filterByUser": "Filter by user"}, "ai": {"chatPlaceholder": "Ask a question…", "briefingTitle": "🤖 Automatic AI summary", "briefingProcedure": "{procedure} recommended for this patient.", "briefingRemnant": "Estimated functional remnant: {pct}% (safety threshold: {threshold}%)", "briefingRisk": "Operative risk:", "briefingWatch": "⚠️ To monitor: {metrics}", "briefingNoIssue": "✅ No off-target metric detected.", "respondInLanguage": "Respond exclusively in {language}."}, "modals": {"mdrFda": {"title": "🛡️ Compliance status (prototype, not certified) & CCAM dictation draft", "notCertifiedBanner": "⚠️ Uncertified prototype: this software has NOT undergone any CE MDR 2017/745 certification, any FDA 510(k) submission, or any formal HIPAA audit. The information below describes the actual state of the prototype, not an obtained certification.", "regulatoryStateTitle": "📋 Actual regulatory status", "dictationTitle": "🗣️ CCAM dictation draft (demonstration)", "dictationHint": "⚠️ Keyword matching on a predefined text — NOT a real speech-recognition or NLP engine. Must be fully validated before any use:", "reportPreviewTitle": "📄 Draft report (demonstration, not a legal document):"}, "respCycle": {"title": "🌊 Respiratory cycle — simplified kinematic formula, not clinically validated", "banner": "🌊 Illustrative kinematic formula: sinusoidal approximation of respiratory motion (14 cycles/min), not calibrated on this patient, not clinically validated — not a real finite-element solver.", "launchLive": "▶ Launch live cycle", "pause": "⏸️ Pause", "displacementTitle": "📍 Anatomical displacement (formula, real time)", "respiratoryPhase": "Respiratory phase", "craniocaudalShift": "Cranio-caudal displacement (ΔZ)", "anteroposteriorShift": "Antero-posterior tilt (ΔY)", "registrationTitle": "🛠️ Non-rigid registration — not implemented", "registrationHint": "⚠️ No elastic registration solver is implemented in this prototype (see backend/biomechanics_engine.py `/elastic-registration`, which now honestly returns \"not_implemented\" instead of fabricated metrics).", "pneumoPressure": "Pneumoperitoneum pressure (parameter)", "registerButton": "🔄 Register on AR Stereovision / Ultrasound (not implemented)"}}, "i18nAdmin": {"title": "🌐 Translation editor", "hint": "Edits are saved locally (browser) as an override layer, without modifying the source files. Export the JSON to apply them permanently.", "keyColumn": "Key", "exportLanguage": "Export {language} JSON", "importLanguage": "Import {language} JSON", "resetOverrides": "Reset local edits", "overridesSaved": "Translation edits saved locally", "overridesReset": "Local translation edits cleared", "imported": "{language} translations imported ({count} key(s))"}, "plan": {"plannedProcedure": "Planned procedure", "metricsTitle": "{specialty} Metrics", "checklistTitle": "Preop checklist", "exportedViaBackend": "Export generated via backend", "exportedLocal": "Local export generated (backend not configured)"}, "workflow": {"patient": "My Patient", "analysis": "AI Analysis", "simulation": "Simulation", "or": "OR"}, "pipeline": {"loadingTitle": "PACS → AI → 3D Twin pipeline in progress...", "realTitle": "REAL ANATOMY — Patient-Specific 3D Twin", "demoTitle": "DEMO MODE — Procedural Anatomy (Training only)", "estimateTitle": "LOCAL ESTIMATE — Real segmentation backend unavailable (non-clinical)"}, "catalog": {"keyProcedures": "Key procedures", "planCycleTitle": "Plan validation cycle", "implantsTitle": "Implants & Equipment", "hudModule": "Module", "hudPatient": "Patient", "hudProcedure": "Procedure", "hudMode": "Mode", "chatYou": "You", "chatAI": "AI", "aiGreeting": "Hello, I am your {specialty} surgical assistant. How can I help you?"}, "chrome": {"certBanner": "Demonstration prototype — Educational use only", "researchBanner": "🔬 RESEARCH MODE ACTIVE — the modules shown above are exploratory (Milestones M21-M40), not clinically validated, and must not be used for decision-making in the OR.", "exploratoryLab": "🔬 Exploratory Lab", "tabPlan": "Plan", "tabStaging": "🎯 Staging", "tabImplants": "Implants", "tabAiChat": "AI Chat", "tabAnalysis": "Analysis", "progressLabel": "Progress:", "finishScore": "Finish & Score", "quit": "✕ Quit", "clicksLabel": "Clicks:", "voiceLabel": "Voice:", "planModsLabel": "Plan changes:", "timerLabel": "Timer:", "finishSession": "Finish Session", "simReportBtn": "Simulation Report", "validatedPlan": "Validated plan", "approachLabel": "Approach:", "estimatedDurationLabel": "Estimated duration:", "moduleLoadedHbp": "Module {specialty} loaded — Dedicated, validated hepatic pipeline", "moduleLoadedGeneric": "🔬 Specialty {specialty}: Research module (generic segmentation task=total, lower quality)", "dashShort": "Dash", "orShort": "OR", "orCenterShort": "OR Center", "researchModuleBanner": "🛑 RESEARCH MODULE — UNCERTIFIED PROTOTYPE SIMULATION, NOT FOR REAL PATIENT DECISIONS"}, "reports": {"flightPlan": {"title": "Surgical Flight Plan", "subtitle": "GeneralSurgPlan3D MIMO — Oncology Suite 2026", "prototypeBadge": "PROTOTYPE — NOT CERTIFIED", "prototypeTitle": "Uncertified prototype — see 🛡️ MDR Compliance", "dateLabel": "Date:", "patientSection": "👤 Patient Identification", "nameLabel": "Name:", "patientIdLabel": "Patient / PACS ID:", "surgeonLabel": "Attending surgeon:", "surgeonFallback": "Attending Surgeon", "specialtyLabel": "Specialty:", "stagingSection": "🎯 Staging & Decision", "tnmLabel": "TNM classification:", "bclcLabel": "BCLC / Child score:", "statusLabel": "Overall status:", "notCalculated": "Not calculated", "vascularSection": "🟢 Vascular Mapping & Couinaud Segmentectomy (Brisbane 2000)", "tumorSegmentsLabel": "Infiltrated tumor segments:", "none": "None", "resectionLabel": "Recommended surgical approach:", "marginsSection": "🔵 3D Safety Margins (R0/R1)", "distCutLabel": "Tumor - Cut distance:", "distVesselLabel": "Tumor - Vessel distance:", "volumetrySection": "🟡 Volumetry & Parenchymal Ischemia", "flrRawLabel": "Raw anatomical FLR:", "flrFunctionalLabel": "Functional vascularized FLR:", "congestedVolLabel": "Congested / necrotic volume:", "hashFootnote": "Chaining fingerprint (local non-cryptographic hash, djb2 — not SHA-256, must not be presented as legal proof of integrity):", "printBtn": "🖨️ Print / Save as PDF", "signatureLabel": "Electronic signature:"}, "operativePlan": {"popupBlockedWarning": "Please allow pop-ups to export the PDF", "generatingNotify": "📄 Generating and printing the operative plan PDF...", "docTitle": "Surgical Operative Plan", "subtitle": "PRE-OPERATIVE SURGICAL PLANNING REPORT", "dateLabel": "Date:", "fileNumberLabel": "File No.:", "patientSection": "👤 Patient Identification &amp; Diagnosis", "patientLabel": "• Patient:", "yearsOld": "years old", "diagnosisLabel": "• Diagnosis:", "specialtyLabel": "• Specialty:", "referringSurgeonLabel": "• Referring Surgeon:", "referringSurgeonFallback": "Dr. Martin", "bioSection": "🩸 Pre-Operative Lab Work &amp; Risk Scores", "bilirubinLabel": "• Bilirubin:", "inrLabel": "INR:", "creatinineLabel": "Creatinine:", "metricsSection": "📐 3D Resection Metrics &amp; Volumetry (FLR)", "totalOrganVolLabel": "• Total Organ Volume:", "resectedVolPlannedLabel": "• Planned Resected Volume:", "flrLabel": "• Future Liver Remnant (FLR):", "marginLabel": "• Tumor Safety Margin:", "validationSection": "✍️ Validation, Signatures &amp; WORM Cryptographic Traceability", "planStatusLabel": "• Plan Status:", "planStatusFallback": "Draft", "seniorSignerLabel": "• Senior Signatory:", "notSignedFallback": "Not signed", "clinicalNotesLabel": "• Clinical Notes:", "noSpecificNotes": "No specific notes", "cryptoFingerprintLabel": "WORM SHA-256 cryptographic fingerprint:", "footerLine1": "⚠️ SURGICAL PLANNING DOCUMENT — CLINICAL PROTOTYPE OPERATED UNDER THIS MDR 2017/745 CLASS IIB PREPARATION", "footerLine2": "This cryptographically sealed document must be filed in the Electronic Patient Record (EPR) before the operative procedure."}, "planReview": {"modalTitle": "✍️ Plan Review, Validation & Signature Workflow", "lifecycleLabel": "📋 Operative Plan Lifecycle:", "currentStateTitle": "📌 Current Plan State", "patientIdLabel": "• Patient ID:", "planVersionLabel": "• Plan Version:", "currentStatusLabel": "• Current Status:", "authorLabel": "• Author / Creator:", "authorFallback": "Dr. Martin (Surgeon)", "seniorSignatureLabel": "• Senior Signature:", "pendingSignature": "Pending...", "workflowActionsTitle": "✍️ Workflow Actions", "markReviewedBtn": "👀 Mark as Peer-Reviewed", "validateSignBtn": "✍️ Validate & Sign the Plan (Senior Surgeon)", "printExportBtn": "📄 Print / Export the Operative Plan (PDF)", "rejectBtn": "❌ Reject the Plan (Request Corrections)", "notesLabel": "Review Notes / Senior Surgeon Remarks", "notesPlaceholder": "Add clinical observations or modification requirements...", "historyLabel": "Signature History & WORM Cryptographic Timestamps:", "historyInitEntry": "[DRAFT] 2026-08-05T16:00:00Z — Plan v1.0 initialized by the surgical team.", "closeBtn": "Close", "draftStatus": "Draft", "reviewedStatus": "Reviewed", "validatedSignedStatus": "Validated & Signed", "rejectedStatus": "Rejected", "notesFallbackReviewed": "Plan reviewed by the assistant surgeon.", "notesFallbackValidated": "Surgical plan validated and signed by the senior surgeon.", "notesFallbackRejected": "Reason not specified", "signerSignedText": "Pr. Dupont (Senior Surgeon) - Signed ✍️", "reviewedNotify": "👀 Surgical plan marked as Peer-Reviewed", "validatedNotify": "✍️ Surgical plan validated & signed with SHA-256 cryptographic fingerprint", "rejectedNotify": "❌ Surgical plan rejected — Corrections requested: {notes}", "historyReviewed": "[REVIEWED] {ts} — Peer-reviewed: {notes}", "historyValidated": "[VALIDATED] {ts} — Signed by Pr. Dupont (SHA-256 sealed)", "historyRejected": "[REJECTED] {ts} — Rejected: {notes}", "peerReviewStage": "Peer review", "finalValidationStage": "Final validation & Signature", "modificationNoteStart": "Any modification of a validated plan automatically creates a new version", "modificationNoteEnd": "sealed with a SHA-256 hash."}}, "clinical": {"resectionNoTumor": "No tumor segment traced", "resectionRightHep": "🔴 Standard Right Hepatectomy (S5-S6-S7-S8)", "resectionLeftHep": "🔴 Standard Left Hepatectomy (S2-S3-S4)", "resectionBisegRight": "🟠 Right Lateral Bisegmentectomy (S6-S7)", "resectionLobLeft": "🟡 Left Lobectomy / Bisegmentectomy S2-S3", "resectionTargeted": "🟢 Targeted Anatomic Segmentectomy ({segments})", "marginNoTumor": "No tumor", "marginR1": "❌ R1 MARGIN (< 1 mm) - Recurrence risk", "marginNarrowR0": "⚠️ NARROW R0 MARGIN (1-5 mm)", "marginSafeR0": "✅ SAFE R0 MARGIN (> 5 mm)", "ischemiaCritical": "❌ CRITICAL ISCHEMIA — Insufficient functional FLR (< 30%)", "ischemiaWarning": "⚠️ WARNING — Borderline functional FLR on cirrhotic liver", "perfusionPreserved": "✅ PERFUSION / DRAINAGE PRESERVED", "marginNotCalculated": "Not calculated", "ischemiaNormal": "Normal", "noTumorDetected": "No tumor detected"}, "exploratoryLab": {"modalTitle": "🔬 Exploratory Lab (M21-M40)", "warning": "⚠️ These modules are highly speculative and have no clinical validation. They are reserved for advanced research.", "surgAi": "🧠 SurgAI", "surgSim": "⚡ SurgSim", "aiOr": "🏥 AI OR", "gpsNav": "🛰️ GPS Nav", "voiceAssistant": "🎙️ Voice Assistant", "genAiComplications": "🧬 GenAI Complications", "telesurgery": "🛰️ PQC Telesurgery & Bio-4D", "bciInterface": "🧠 BCI & Cortex Interface", "nanoroboticSwarm": "🔬 Nanorobotic Swarm", "l5Autonomy": "🤖⚡ L5 Autonomy & Laser", "reprogramming": "🧬✨ Reprogramming & Sonogenetics", "ramanSpectrometry": "⚡🔬 Raman Spectrometry & Plasma", "cryoIre": "❄️☢️ Cryo-IRE & BNCT Neutrons", "organoids": "🧬🌱 4D Organoids", "iknife": "🔬💨 iKnife REIMS & Ac-225"}, "nextgen": {"surgai": {"title": "🧠 SurgAI-Decision — AI Decision-Making & Explainability (SHAP / Grad-CAM 3D)", "mdrLabel": "⚠️ MDR / FDA Requirement (Zero-Black-Box):", "mdrText": "Every surgical proposal is justified by Shapley (SHAP) weights and localized by 3D Grad-CAM attention on the Digital Twin.", "strategyLabel": "Select an AI-modeled surgical strategy", "optA": "Option A: Laparoscopic Right Hepatectomy (Recommended — Predicted success: 94.2%)", "optB": "Option B: Parenchymal Segmentectomy VII-VIII (Predicted success: 88.5%)", "optC": "Option C: Trans-hepatic Radiofrequency Thermo-ablation (Predicted success: 76.0%)", "prognosisTitle": "📊 Prognostic Analysis &amp; Risks", "durationLabel": "• Estimated operative duration:", "eblLabel": "• Estimated blood loss (EBL):", "riskLabel": "• Morbi-mortality risk score:", "riskLow": "(Low)", "adjustMarginLabel": "Adjust safety margin (", "adjustMarginSuffix": " mm):", "marginUpdateNotify": "SHAP calculation updated for margin {value} mm", "gradcamTitle": "🔥 3D Grad-CAM Attention", "shapRecommendation": "💡 SHAP recommendation: First dissection of the right Glissonian pedicle to reduce hemorrhage risk by 18%.", "approveBtn": "🚀 Approve this plan &amp; Export DICOM-SR", "approveNotify": "Plan approved and exported as DICOM-SR to the Orthanc PACS!", "criticalZonePrefix": "Critical zone detected:", "vesselMshv": "Middle Suprahepatic Vein (MSHV)", "criticalZoneSuffix": "at 1.8 mm from the projected cut plane."}, "surgsim": {"title": "⚡ SurgSim-PhysX — Rheological Simulation &amp; Clamping (WASM/WebGPU)", "engineLabel": "⚡ Continuum Physics Engine:", "engineText": "Computes in real time ($< 100\\text{ ms}$) on WebGPU the hyperelastic deformations and ischemia in case of virtual vascular ligation.", "rheologyTitle": "🧪 Tissue Rheology &amp; Biophysics", "youngLabel": "Young's modulus E (", "youngSuffix": " kPa - Normal liver):", "youngNotify": "Tissue elasticity modulus E recalibrated to {value} kPa", "poissonLabel": "Poisson's ratio ν (", "poissonSuffix": " - Nearly incompressible):", "clampSimTitle": "🩸 Clamping &amp; Ischemia Simulator", "clampRightHepatic": "🔴 Clamp Right Hepatic Artery", "clampPortalBranch": "🔵 Clamp Right Portal Vein Branch", "clampPedicle": "🟡 Clamp Pedicle VI-VII", "vesselRightHepatic": "Right Hepatic Artery", "vesselPortalBranch": "Right Portal Vein Branch", "vesselPedicle": "Segment VI-VII Glissonian Pedicle", "statusSecured": "SECURED ✅", "statusOptimal": "OPTIMAL ⭐", "flrResultLabel": "Instant Volumetric Result (FLR):"}, "surgor": {"title": "🏥 SurgOR-AI — Intelligent Operating Room &amp; MILP Orchestration", "milpLabel": "🤖 Real-Time MILP Solver:", "milpText": "Reduces turnover time by 18% through dynamic rescheduling.", "reoptimizeBtn": "⚡ Reoptimize Schedule", "reoptimizeNotify": "⚡ OR schedule reoptimized by AI! Calculated gain: +22 minutes", "roomsStatusTitle": "📍 Operating Room Status (Real-Time HL7 / IoT)", "thRoom": "Room", "thSpecialty": "Specialty", "thStatus": "Status / Step", "thTracking": "RFID Equipment Tracking", "room1": "Room 1", "room2": "Room 2", "room3": "Room 3", "specNeuro": "Neurosurgery", "specHbpCurrent": "HBP (Current patient)", "specTrauma": "Trauma Surgery", "statusMeningioma": "🟢 Meningioma excision in progress (T+110m)", "statusSterileSetup": "🟢 Sterile setup — Incision in 12m", "statusEmergency": "🟡 Interposed emergency (Polytrauma patient)", "trackMicroscope": "Zeiss KINEVO microscope connected", "trackHepBox": "Hepatectomy Tray #4 RFID UHF ✅", "trackAmplifier": "3D image intensifier in room", "hemoMonitorTitle": "📈 Intraoperative Anesthesia Hemodynamic Monitor (IEEE 11073 / HL7 v2.x)", "bisOptimal": "BIS 44 — Optimal Anesthesia ✅", "mapLabel": "Mean Arterial Pressure (MAP)", "hrLabel": "Heart Rate", "spo2Label": "SpO₂ / EtCO₂", "ischemiaToleranceLabel": "Ischemia Tolerance", "alertText": "ℹ️ Hemodynamic stability index at 98.4%. Ready for vascular clamping or parenchymal resection.", "pringleBtn": "🔴 Simulate Pringle Clamping (18 min)", "renalBtn": "🟠 Simulate Renal Clamping (22 min)", "amiBtn": "🟡 Simulate IMA Clamping (35 min)"}, "surgnav": {"title": "🛰️ SurgNav-GPS — Surgical Navigation &amp; Elastic Registration", "regLabel": "🛰️ Non-Rigid Elastic Registration (60-100 Hz):", "regText": "Dynamically compensates for breathing and tissue deformation with sub-millimeter accuracy.", "precisionTitle": "🎯 Precision &amp; Active Sensors", "rmsLabel": "• Root mean square error (RMS):", "rmsValue": "0.38 mm (Optimal 🎯)", "refSensorLabel": "• Reference sensor:", "endoTrackingLabel": "• Endo-cavitary tracking:", "latencyLabel": "• Motion-to-Photon latency:", "latencyValue": "11.4 ms (< 15 ms OK)", "navModesTitle": "⚙️ Navigation Modes", "rigidRegBtn": "📍 Launch Initial Rigid Registration (ICP)", "rigidRegNotify": "Initial ICP rigid registration recalibrated on 42 bone points", "elasticRegBtn": "🌊 Enable Elastic Registration (Breathing)", "elasticRegNotify": "Non-Rigid Elastic Registration enabled via stereoscopic tracking!"}, "surgvoice": {"title": "🎙️ SurgVoice-LLM — Hands-Free Sterile Voice Assistant", "asrLabel": "🎙️ Offline Voice Recognition:", "asrText": "Whisper-Medical model (WASM GPU) + active OR noise filtering.", "listeningBadge": "🟢 Active listening", "testTitle": "🗣️ Test a surgical voice command in sterile attire:", "cmd1Display": "« Surgi, show only the suprahepatic veins and hide the skeleton. »", "cmd1Response": "Venous system successfully isolated (layer 4 active).", "recognizedNotify": "🎙️ Command recognized (42ms GPU latency):", "cmd2Display": "« Surgi, what is the distance between my CUSA scalpel and the tumor edge? »", "cmd2Response": "The current distance is 4.2 millimeters.", "cmd3Display": "« Surgi, start dictating the CCAM operative report. »", "cmd3Response": "Structured dictation mode enabled: Laparoscopic Approach section being recorded.", "ttsLabel": "Synthesized voice response (TTS):", "ttsPlaceholder": "Ready for your instructions in the OR..."}, "webgpuCut": {"title": "✂️ WebGPU Virtual Cut — Real-Time Resection &amp; FLR Calculation", "introLabel": "✂️ Hepatic Resection Simulation:", "introText": "Virtually cut the parenchyma along an interactive 3D cut plane with 60 Hz recalculation of the remaining liver volume (FLR) and oncologic margins.", "segmentsLabel": "Select the Couinaud segments to remove:", "s6": "S6 (Post-Inf)", "s7": "S7 (Post-Sup)", "s5": "S5 (Ant-Inf)", "s8": "S8 (Ant-Sup)", "cutPlaneTitle": "📐 Cut Plane Parameters", "axialAngleLabel": "• Axial angle:", "offsetLabel": "• Position (offset):", "marginLabel": "• Calculated oncologic margin:", "marginPlaceholder": "— (calculate first)", "voxelSourceLabel": "Procedural 64³ volume", "hintText": "ℹ️ If one or more Couinaud segments are checked above, they take precedence over the free plane for resection calculation (anatomic segmentectomy). Otherwise, the free plane (angle/offset) is used.", "flrAnalysisTitle": "📊 FLR Volumetric Analysis (Calculated)", "totalVolLabel": "• Total Organ Vol.:", "resectedVolLabel": "• Resection Vol.:", "remnantVolLabel": "• Remaining Vol. (FLR):", "safetyPending": "⏳ Calculate first...", "segmentsCountedLabel": "Segments counted in FLR:", "includeManualLabel": "Include manual segments", "comparatorTitle": "⚖️ Strategy Comparator", "saveAsABtn": "📥 Save as Strategy A", "saveAsBBtn": "📥 Save as Strategy B", "thCriteria": "Criteria", "thStrategyA": "Strategy A", "thStrategyB": "Strategy B", "noStrategySaved": "Save at least one strategy to compare.", "recalcBtn": "🔄 Recalculate FLR", "recalcNotify": "FLR recalculated on current volume", "applyBtn": "✂️ Apply Virtual Cut to Digital Twin"}, "raymarching": {"title": "🌟 Ray-Marching DVR — UI mockup, not implemented", "mockupLabel": "⚠️ UI mockup:", "mockupText": "no real volumetric ray-marching rendering is implemented in this prototype (classic Three.js r128 / WebGL). The buttons below display a notification but do not change the 3D rendering.", "transferFnTitle": "🎛️ Transfer Functions (CT Windowing) — mockup", "presetParenchyma": "🟢 Hepatic Parenchyma (40 HU / 150 HU)", "presetVessels": "🔴 Vascular Tree &amp; Pedicles (+120 HU)", "presetTumors": "🟡 Hypervascular Lesions &amp; Tumors", "presetBones": "⚪ Bone Structures (+400 HU)", "specsTitle": "⚡ Target Specifications (not measured)", "specsIntro": "What a real implementation would target, for reference only — none of these values are produced by functional code in this prototype:", "specEngine": "• Execution engine: WGSL Compute Shaders (not implemented)", "specSampling": "• Target sampling rate: 512 ray steps / pixel", "specLighting": "• Global illumination: Monte-Carlo AO (not implemented)"}, "sihInterop": {"title": "🏥 SIH Interoperability (HL7 v2 & FHIR R4/R5)", "connectionLabel": "🏥 Hospital Information System (HIS) Connection:", "connectionText": "Bidirectional exchange with the EPR/PACS via the international standards HL7 v2 (MLLP) and FHIR R4/R5 (REST JSON).", "fhirApiTitle": "🔥 FHIR R4/R5 REST API", "fhirResourceLabel": "FHIR resource to export", "optPatient": "Patient (Identity & History)", "optImagingStudy": "ImagingStudy (DICOM Series & PACS)", "optDiagnosticReport": "DiagnosticReport (3D Volumetry & Segments)", "optProcedure": "Procedure (FHIR R5 Surgical Planning)", "exportFhirBtn": "🌐 Export FHIR Resource (JSON)", "fhirPreviewLabel": "FHIR resource preview:", "fhirPlaceholderStatus": "Select a resource and click Export", "hl7SenderTitle": "📡 HL7 v2 MLLP Sender (Port 2575)", "hl7EventTypeLabel": "HL7 Event Type", "optAdtA08": "ADT^A08 — Patient record update", "optOrmO01": "ORM^O01 — Surgical procedure request", "optOruR01": "ORU^R01 — Operative / 3D report", "mllpHostLabel": "MLLP Host", "mllpPortLabel": "Port", "sendMllpBtn": "📡 Send MLLP Frame (<VT>HL7<FS><CR>)", "hl7FrameLabel": "Sent HL7 v2 frame & Acknowledgment (ACK):", "hl7Pending": "Waiting for an HL7 v2 MLLP frame to be sent..."}, "webxr": {"title": "🥽 WebXR Spatial Computing — Apple Vision Pro & Meta Quest 3", "streamLabel": "🥽 120 Hz Stereoscopic Streaming:", "streamText": "Holographic Digital Twin in ultra-low-latency AR Pass-Through mode (< 9 ms Motion-to-Photon) for guided surgery.", "lidarBadge": "LiDAR + Eye-Tracking 👁️", "telemetryTitle": "📡 Telemetry & Spatial Calibration", "deviceLabel": "• Connected headset:", "deviceValue": "Apple Vision Pro (visionOS 2.0)", "trackingLabel": "• Spatial tracking:", "trackingValue": "NDI Polaris + ARKit Markerless", "rmsLabel": "• RMS alignment error:", "rmsValue": "0.35 mm (Sub-mm 🎯)", "fovealLabel": "• Foveal rendering:", "fovealValue": "Dynamic Eye-Tracking Pro ✅", "recalibrateBtn": "📍 Recalibrate Patient Alignment (42 points)", "gestureTitle": "🖐 Hands-Free Gesture Simulation (26 DOF)", "pinchBtn": "🤏 Test Pinch: 3D Rotation", "pinchLabel": "2-Finger Pinch", "pinchResult": "🔄 Smooth 360° stereoscopic rotation of the organ", "raycastBtn": "👆 Test Index Raycast: CUSA Cut", "raycastLabel": "Index Raycast", "raycastResult": "✂️ Ultrasonic CUSA incision guided by virtual pointer", "grabBtn": "✊ Test Grab: PBD Retraction", "grabLabel": "Grab & Hold", "grabResult": "🖐 Atraumatic retraction of the parenchymal edges", "gesturePending": "Waiting for gesture detection by infrared cameras...", "launchBtn": "🚀 Launch Immersive Navigation", "launchNotify": "🥽 WebXR stereoscopic immersive mode activated in the Vision Pro headset!"}, "robotic": {"title": "🤖 RAS Robotic Console — Intuitive Da Vinci 5 & Medtronic Hugo", "teleopLabel": "🤖 Haptic Teleoperation (1000 Hz):", "teleopText": "7-DOF kinematic telemetry and live resistance calculation in Newtons on the PBD Digital Twin.", "fiberBadge": "Fiber Optic Latency 0.8 ms ⚡", "armsTitle": "🦾 Telemetry of the 4 Robotic Arms", "thArm": "Arm", "thInstrument": "Instrument (RFID)", "thForce": "Force", "thStatus": "Status", "arm1": "Arm 1 (Right)", "arm2": "Arm 2 (Left)", "arm3": "Arm 3 (Camera)", "arm4": "Arm 4 (Aux)", "statusActive": "🟢 Active", "statusFixed": "🔵 Fixed", "statusHolding": "🟡 Holding", "recalibrateBtn": "⚙️ Recalibrate Kinematic Zero (7-DOF)", "recalibrateNotify": "🔄 Denavit-Hartenberg kinematic calibration performed and sealed (SHA-256)", "hapticTitle": "⚡ Haptic Feedback & Safety Simulation", "lightGraspBtn": "🟢 Simulate Light Grasp (1.4 N)", "lightGraspLabel": "Light Grasp", "lightGraspResult": "🟢 Normal resistance — Liver parenchyma intact.", "moderateTractionBtn": "🟡 Simulate Moderate Traction (3.2 N)", "moderateTractionLabel": "Moderate Traction", "moderateTractionResult": "🟡 High resistance — Maximum elastic tension reached.", "criticalOverloadBtn": "🔴 Simulate Critical Overload (4.8 N - Interlock)", "criticalOverloadLabel": "Critical Overload", "criticalOverloadResult": "🛑 TEAR ALERT! 4.5 N threshold exceeded. Interlock lockout triggered!", "hapticPending": "Haptic system armed, awaiting tissue interaction...", "activateBtn": "🚀 Activate Console Teleoperation", "activateNotify": "🤖 Da Vinci 5 console coupled in real time to the PBD Digital Twin!", "hapticFeedbackLabel": "🤖 HAPTIC FEEDBACK", "forceMeasuredLabel": "⚡ Measured force:", "fiberLoopActive": "— 1000 Hz fiber optic loop active.", "safetyAlertNotify": "🛑 ROBOTIC SAFETY ALERT: Force {force} N > 4.5 N threshold! Emergency lockout activated and sealed (SHA-256)", "hapticProcessedNotify": "🦾 Haptic simulation processed: {action} ({force} N) — Tissue stable"}, "genai": {"title": "🧬 GenAI Complications Predictor & Robotic Micro-Surgery (50:1)", "transformerLabel": "🧬 Spatio-Temporal Video Transformer (70B):", "transformerText": "15-sec horizon video prediction of intraoperative risks (vascular rupture, biliary leaks) and micro-robotic tremor filtering (< 5 µm).", "videosBadge": "52,400 OR Videos • 50:1 Scale 🎯", "microsurgeryTitle": "🔬 Robotic Micro-Surgery (Symani / Zeiss)", "consoleLabel": "• Micro-robotic console:", "consoleValue": "Symani Surgical System (MMI)", "kinematicLabel": "• Kinematic demultiplication:", "kinematicValue": "50:1 (10 mm → 0.2 mm)", "tremorLabel": "• RMS tremor filtering:", "tremorValue": "< 3.2 µm (Sub-micron ✨)", "opticsLabel": "• Stereoscopic optics:", "opticsValue": "Zeiss KINEVO 40x 3D 4K", "calibrateBtn": "⚖️ Calibrate Microvascular Movement Scale (50:1)", "calibrateNotify": "✨ 50:1 micro-robotic demultiplication calibrated and sealed in audit_logs (SHA-256)", "predictTitle": "🔮 Simulate Intraoperative GenAI Prediction", "neuroBtn": "🧠 Simulate Neuro: Willis Aneurysm Rupture (84%)", "neuroEvent": "💥 Willis Aneurysm Rupture", "neuroResult": "🛑 CRITICAL ALERT (84%): Excessive wall tension! AI Action: Clamp proximal carotid clip.", "hbpBtn": "🫀 Simulate Liver: Right Duct Biliary Breach (88%)", "hbpEvent": "🌊 Right Duct Biliary Breach", "hbpResult": "🔴 BILIARY LEAK ALERT (88%): Transection too close to the hilum! AI Action: Visualize AR WebXR ICG.", "ophthBtn": "👁️ Simulate Retina: Stable Anastomosis (12%)", "ophthEvent": "👁️ Retinal Anastomosis", "ophthResult": "🟢 SAFE TRAJECTORY (12%): Tremor filtered to 3.2 µm — Stable anastomosis.", "predictPending": "GenAI Transformer model armed — Monitoring OR video feed and FEM in progress...", "activateBtn": "🚀 Activate GenAI Monitoring & Micro-Surgery", "activateNotify": "🧬 Spatio-Temporal GenAI and Micro-Robotic models activated live on the Digital Twin!", "predictionLabel": "🧬 GENAI PREDICTION", "probabilityLabel": "⚡ 15s probability:", "transformerFootnote": "— 70B Transformer (52,400 OR videos).", "criticalAlertNotify": "🛑 GENAI COMPLICATION ALERT ({prob}%): {event}! Preventive AI action recommended and sealed in audit_logs (SHA-256)", "predictionComputedNotify": "🧬 GenAI prediction computed: {event} ({prob}%) — Stable trajectory"}, "pqcBioprint": {"title": "🛰️ PQC (Post-Quantum) Telesurgery & Intraoperative 4D Bioprinting", "infoLabel": "🛰️ Quantum LEO 6G Network & Bio-4D:", "infoText": "Tamper-proof intercontinental teleoperation (NIST CRYSTALS-Kyber/Dilithium) and in-situ printing of vascularized cellular grafts at 37°C.", "badge": "Latency 14.2 ms • BioX 6-Axis ✨", "specsTitle": "🔒 Quantum Telemetry & 6G Satellite Link", "spec1Label": "Key encapsulation:", "spec1Value": "NIST ML-KEM-1024 (Kyber)", "spec2Label": "Digital signature:", "spec2Value": "NIST ML-DSA-87 (Dilithium)", "spec3Label": "Intercontinental link:", "spec3Value": "Paris ↔ Tokyo (6G LEO Mesh)", "spec4Label": "Latency & Jitter:", "spec4Value": "14.2 ms / ±0.08 ms (Zero jitter ⚡)", "calibrateBtn": "🔐 Renegotiate PQC Quantum Keys (60s rotation)", "calibrateNotify": "✨ PQC quantum telesurgery session negotiated and sealed (SHA-256 / Dilithium-5)", "actionsTitle": "🧬 Simulate Intraoperative 4D Bioprinting", "action1Btn": "🫀 Print Liver Patch S6 (42.5 mL / 191s)", "action1Label": "Hepatic Patch S6", "action1Desc": "🟢 G-code computed: In-situ parenchyma printing (Alginate-MSC-VEGF @ 37°C) in 191s.", "action2Btn": "🧠 Print Cranial Dura Mater (14 mL / 63s)", "action2Label": "Cranial Dura Mater", "action2Desc": "🔵 G-code computed: Sterile watertight cranial dura mater reconstruction with bioactive collafilm in 63s.", "action3Btn": "🦴 Print Mandibular Graft (31.2 mL / 140s)", "action3Label": "Mandibular Graft", "action3Desc": "🟡 G-code computed: Osteoinductive vascularized ceramic-PEEK scaffold bioprinting in 140s.", "outputPending": "CELLINK BioX 6-axis bioprinting arm awaiting resection coordinates...", "activateBtn": "🚀 Activate PQC Link & 4D Bioprinting", "activateNotify": "🛰️ PQC LEO 6G telesurgery and 4D bioprinter live-coupled to the Digital Twin!", "resultTemplate": "🛰️ <b>4D BIOPRINTING ({site}):</b> {desc} <br><strong>⚡ Volume: {vol} mL | {layers}</strong> — CELLINK BioX 6-axis arm at 37°C.", "calibratedNotify": "🛰️ 4D bioprinting calibrated on {site} ({vol} mL) — G-code transmitted over the PQC LEO 6G network"}, "bciHaptic": {"title": "🧠 Brain-Computer Interface (BCI 1024-Ch) & Direct Cortical Haptic Feedback (S1)", "infoLabel": "🧠 Thought Control & Cortical Touch:", "infoText": "Sub-millisecond SNN decoding (< 2.4 ms) of the motor cortex (M1) and S1 micro-stimulation to feel tissue resistance in the cortex!", "badge": "1024 Channels • SNN Loihi 2 ⚡", "specsTitle": "⚡ Cortical Telemetry & SNN Decoding", "spec1Label": "Cortical implant:", "spec1Value": "Neuralink N1-Surg / Precision 1024-Ch", "spec2Label": "Neuromorphic decoder:", "spec2Value": "Intel Loihi 2 SNN Chip", "spec3Label": "Decoding latency:", "spec3Value": "2.1 ms (Sub-millisecond ⚡)", "spec4Label": "M1 intent accuracy:", "spec4Value": "99.2% @ 30 kHz sampling", "calibrateBtn": "⚖️ Calibrate M1 / S1 Cortical Matrix (30 kHz)", "calibrateNotify": "✨ M1/S1 cortical matrix calibration successful — Synaptic accuracy 99.2% (SHA-256)", "actionsTitle": "🧠 Simulate Thought-Controlled Teleoperation", "action1Btn": "🧠 Clip Willis Aneurysm by Thought (2.4 N / 53 µA)", "action1Label": "Willis Aneurysm Clipping", "action1Desc": "🟢 M1 intent decoded: Aneurysm clip placed — Smooth, realistic S1 tactile sensation in the cortex.", "action2Btn": "🫀 Transect Liver by Thought (4.2 N / 92 µA)", "action2Label": "Hepatic Parenchyma Transection", "action2Desc": "🟡 M1 intent decoded: Hepatic transection — Intense S1 sensation (92 µA) indicating dense parenchyma.", "action3Btn": "🛑 Simulate Anti-Fatigue Interlock (< 2.1 ms)", "action3Label": "Emergency Interlock", "action3Desc": "🛑 COGNITIVE FATIGUE ALERT (>85%): Instant neural decoupling! Actuators locked and S1 pulses cut.", "outputPending": "SNN decoder armed, awaiting motor cortex action potentials...", "activateBtn": "🚀 Activate BCI Link & S1 Cortical Touch", "activateNotify": "🧠 1024-Ch Brain-Computer Interface and S1 stimulation coupled to the Digital Twin!", "resultTemplate": "🧠 <b>M1 INTENT \\ S1 HAPTIC ({action}):</b> {desc} <br><strong>⚡ PBD Force: {force} N | S1 Stimulation: {icms} @ 200 Hz</strong> — Loihi 2 SNN Chip (< 2.1 ms).", "interlockNotify": "🛑 BCI INTERLOCK ALERT: Critical fatigue/tension index! Immediate neural decoupling (SHA-256)", "processedNotify": "🧠 BCI command processed: {action} ({force} N) — S1 haptic feedback {icms} perceived in the cortex"}, "nanoSwarm": {"title": "🔬 Nanorobotic Swarm (5M Units) & In-Vivo Molecular Oncology (CRISPR-Cas9)", "infoLabel": "🔬 Micro-Vascular Navigation & AMF Hyperthermia:", "infoText": "3D magnetic guidance of 5 million DNA-Origami/Fe3O4 nanorobots toward micro-metastases and CRISPR-Cas9 release at 43.5°C!", "badge": "5,000,000 Units • SPION Fe3O4 ⚡", "specsTitle": "⚡ Swarm Telemetry & Magnetic Gradient", "spec1Label": "Active units:", "spec1Value": "5,000,000 Nanobots (< 100 nm)", "spec2Label": "Core material:", "spec2Value": "Superparamagnetic SPION Fe3O4", "spec3Label": "Table coils:", "spec3Value": "SurgMag 6-Axis Gradient Array (0.85 T/m)", "spec4Label": "Antigenic targeting:", "spec4Value": "Anti-EGFR / Anti-VEGF (98.4%)", "calibrateBtn": "🧲 Calibrate Magnetic Gradient Field (0.85 T/m)", "calibrateNotify": "✨ 0.85 T/m magnetic field calibration and swarm synchronization successful (SHA-256)", "actionsTitle": "🔬 Simulate In-Vivo Oncolytic Intervention", "action1Btn": "🔬 Guide Swarm to Liver Micro-Metastasis S8 (1.2 T/m)", "action1Label": "Hepatic S8 Micro-Metastasis Guidance", "action1Desc": "🟢 Magnetic guidance 1.2 T/m: 4,985,000 nanorobots converged on S8 micro-metastasis — EGFR binding confirmed.", "action2Btn": "🧬 Trigger CRISPR-Cas9 Release (AMF 43.5°C)", "action2Label": "AMF-Triggered CRISPR-Cas9 Release", "action2Desc": "🟢 AMF activation 150 kHz (43.5°C): CRISPR-Cas9 KRAS-G12D release underway — 99.1% tumor apoptosis, 100% healthy parenchyma intact.", "action3Btn": "🛑 Simulate Emergency Stop & Demagnetization", "action3Label": "Emergency Stop", "action3Desc": "🛑 VASCULAR DENSITY ALERT: Instant demagnetization of table coils! Swarm dispersed into normal physiological flow.", "outputPending": "Nanorobotic swarm circulating in the microvasculature, awaiting guidance vectors...", "activateBtn": "🚀 Activate Swarm Guidance & CRISPR Oncology", "activateNotify": "🔬 5M nanorobot swarm and magnetic coils live-coupled to the Digital Twin!", "resultTemplate": "🔬 <b>NANOROBOTIC SWARM ({action}):</b> {desc} <br><strong>⚡ Telemetry: {stat} | Gradient: {param} T/m (or °C)</strong> — EGFR Binding 98.4%.", "interlockNotify": "🛑 NANOROBOT SWARM ALERT: Emergency demagnetization activated! Swarm safely dispersed (SHA-256)", "processedNotify": "🔬 Nanorobotic command processed: {action} ({stat}) — Zero parenchymal damage"}, "autoLaser": {"title": "🤖⚡ Level 5 Autonomous Robotic Surgery & Laser Welding (EPLW 1470 nm)", "infoLabel": "🤖⚡ STAR-5 Autonomy & Laser Welding:", "infoText": "Med-VLA RT-2 model driving microsurgery at 10,000 FPS OCT with albumin-ICG laser fusion (Burst > 280 mmHg)!", "badge": "STAR-5 Autonomy • 1470 nm Laser ⚡", "specsTitle": "⚡ Autonomous AI Telemetry & 3D OCT", "spec1Label": "VLA engine:", "spec1Value": "Med-PaLM 3 Robotics / RT-2", "spec2Label": "Autonomy grade:", "spec2Value": "STAR-5 (100% Autonomous)", "spec3Label": "Tracking sensor:", "spec3Value": "SurgOCT Interferometer (10,000 FPS)", "spec4Label": "Execution speed:", "spec4Value": "5.2x faster (0 tremor)", "calibrateBtn": "⚖️ Calibrate VLA Engine & Laser Head (1470 nm)", "calibrateNotify": "✨ VLA model and 1470 nm laser head calibration successful — Latency 0.78 ms (SHA-256)", "actionsTitle": "🤖 Simulate L5 Execution & Laser Fusion", "action1Btn": "🤖 Autonomous Arterial Anastomosis + Laser (285 mmHg)", "action1Label": "Autonomous Arterial Anastomosis", "action1Desc": "🟢 STAR-5 execution: Hepatic artery micro-anastomosis — Watertight 12.5 J/cm² laser weld (Burst 285 mmHg).", "action2Btn": "🔥 Bile Duct Laser Welding (14.0 J/cm² / 319 mmHg)", "action2Label": "Bile Duct Laser Welding", "action2Desc": "🟢 STAR-5 execution: Bile duct laser welding — Albumin-ICG polymerized in 5.6s with zero leaks or staples.", "action3Btn": "🛑 Instant Human Takeover (< 1 ms)", "action3Label": "Human Takeover", "action3Desc": "🛑 TAKEOVER ALERT (< 1 ms): Actuators immediately transferred to surgeon via BCI/Voice! Laser secured.", "outputPending": "STAR-5 VLA engine armed, awaiting selection of the autonomous gesture...", "activateBtn": "🚀 Activate L5 Autonomy & Laser Welding", "activateNotify": "🤖⚡ STAR-5 autonomy and laser welding live-coupled to the Digital Twin!", "resultTemplate": "🤖⚡ <b>L5 AUTONOMY & LASER WELDING ({action}):</b> {desc} <br><strong>⚡ Force/Fluence: {param} J/cm² | Resistance: {stat}</strong> — RT-2 VLA Engine (< 0.8 ms).", "interlockNotify": "🛑 HUMAN TAKEOVER ALERT (< 1 ms): Control returned to surgeon via BCI! Laser secured (SHA-256)", "processedNotify": "🤖 Autonomous L5 execution successful: {action} ({stat}) — Hermetic tissue fusion guaranteed"}, "epiSono": {"title": "🧬✨ In-Vivo Epigenetic Reprogramming & Deep Sonogenetics (OSKM / FUS 1.2 MHz)", "infoLabel": "🧬✨ Rejuvenation & Sonogenetics:", "infoText": "Focused-ultrasound-triggered (FUS 1.2 MHz) release of Yamanaka factor (OSKM) mRNA LNPs: -20 years on the epigenetic clock with zero teratoma risk!", "badge": "OSKM -20 Years • FUS 1.2 MHz 🌱", "specsTitle": "⚡ Epigenetic Telemetry & UCNP Optogenetics", "spec1Label": "Rejuvenation factors:", "spec1Value": "Yamanaka mRNA LNP (Oct4, Sox2, Klf4, c-Myc)", "spec2Label": "Clock regression:", "spec2Value": "-20.4 Years (0.00% teratoma risk)", "spec3Label": "FUS beam:", "spec3Value": "SurgFUS Phased Array (1.2 MHz / 0.85 MPa)", "spec4Label": "UCNP nanoparticles:", "spec4Value": "NIR 980 nm → Blue 470 nm conversion", "calibrateBtn": "🌱 Calibrate FUS Beams (1.2 MHz) & NIR Laser (980 nm)", "calibrateNotify": "✨ FUS beam (1.2 MHz) and UCNP 980 nm excitation calibration successful (SHA-256)", "actionsTitle": "🧬 Simulate In-Vivo Rejuvenation & Modulation", "action1Btn": "🌱 Post-Ischemic Hepatic Lobe Rejuvenation (-20 Years)", "action1Label": "Post-Ischemic Hepatic Rejuvenation", "action1Desc": "🟢 FUS activation 0.85 MPa: OSKM release in hepatic zone S6/S7 — Epigenetic clock reversed by 20.4 years. Cell viability 90.5%.", "action2Btn": "🌟 Anti-Fibrosis Optogenetic Modulation (UCNP 980 nm)", "action2Label": "Anti-Fibrosis Optogenetic Modulation", "action2Desc": "🟢 NIR laser excitation 980 nm → 470 nm via UCNPs: Collagenase activation — Fibrosis clearance at 94.8% with no skin breach.", "action3Btn": "🛑 Simulate Anti-Teratoma Safety Lockout", "action3Label": "Anti-Teratoma Lockout", "action3Desc": "🛑 ONCOGENIC INTERLOCK ALERT: Instant FUS pulse shutdown! Anti-teratoma safety guaranteed 100% (SHA-256).", "outputPending": "FUS transducer and mRNA LNP vectors armed, awaiting tissue targeting...", "activateBtn": "🚀 Activate Epigenetic Rejuvenation & Sonogenetics", "activateNotify": "🧬✨ Epigenetic reprogramming and sonogenetics coupled to the Digital Twin!", "resultTemplate": "🧬✨ <b>REJUVENATION & SONOGENETICS ({action}):</b> {desc} <br><strong>⚡ FUS Pressure / NIR Laser: {param} MPa (or mW/cm²) | Clock: {stat}</strong> — OSKM mRNA LNP.", "interlockNotify": "🛑 ONCOGENIC INTERLOCK ALERT: Anti-teratoma lockout activated! No cellular transformation (SHA-256)", "processedNotify": "🧬 Epigenetic rejuvenation command processed: {action} ({stat}) — Tissue regenerated"}, "ramanPlasma": {"title": "⚡🔬 CARS/SERS Raman Spectroscopy & Atmospheric Cold Plasma (CAP / RONS)", "infoLabel": "⚡🔬 Optical Biopsy < 10 ms & R0 Plasma:", "infoText": "1000 Hz CARS/SERS Raman vibrational spectroscopy and atmospheric cold plasma jet for targeted apoptotic eradication of infiltrates with zero thermal damage!", "badge": "R0 99.8% • CAP He/Ar 37°C ⚡", "specsTitle": "⚡ Raman Probe & Plasma Sprayer Telemetry", "spec1Label": "Optical biopsy:", "spec1Value": "CARS / SERS fiber-optic probe @ 1000 Hz", "spec2Label": "Latency & Specificity:", "spec2Value": "7.4 ms | R0/R1 specificity: 99.8%", "spec3Label": "Cold plasma jet:", "spec3Value": "Atmospheric CAP (He/Ar 98/2% @ 36.8°C)", "spec4Label": "Reactive species:", "spec4Value": "RONS (H₂O₂, NO₂⁻, ONOO⁻) — Apoptosis 99.99%", "calibrateBtn": "🌱 Calibrate Raman Probe (1000 Hz) & CAP Jet (12.5 kV)", "calibrateNotify": "✨ Raman probe (1000 Hz) and 12.5 kV plasma generator calibration successful (SHA-256)", "actionsTitle": "🔬 Simulate Raman Biopsy & Plasma Eradication", "action1Btn": "⚡ Optical Biopsy of Resection Slice (R0 Margin)", "action1Label": "Optical Biopsy of Resection Slice", "action1Desc": "🟢 1000 Hz CARS/SERS optical biopsy on S7 slice: No aberrant nucleic peak detected at 1575 cm⁻¹. R0 margin certified.", "action2Btn": "🔬 Cold Plasma Eradication of R1 Infiltrate (CAP 37°C)", "action2Label": "Cold Plasma Eradication of R1 Infiltrate", "action2Desc": "🟢 CAP cold plasma jet (12.5 kV / 36.8°C) on micro-infiltrate: Selective RONS-induced apoptosis with no damage to noble vessels.", "action3Btn": "🛑 Simulate Anti-Arc Safety Lockout (0 kV)", "action3Label": "Anti-Arc Lockout", "action3Desc": "🛑 IONIZATION INTERLOCK ALERT: Plasma high voltage cutoff (0.0 kV)! Electric arc protection active (SHA-256).", "outputPending": "CARS Raman probe and cold plasma sprayer ready for margin analysis...", "activateBtn": "🚀 Activate Raman & Cold Plasma Diagnostics", "activateNotify": "⚡🔬 Raman spectroscopy and cold plasma coupled to the Digital Twin!", "resultTemplate": "⚡🔬 <b>RAMAN SPECTROSCOPY & CAP PLASMA ({action}):</b> {desc} <br><strong>⚡ CAP Voltage / Frequency: {param} kV (or Hz) | Result: {stat}</strong> — RONS Apoptosis.", "interlockNotify": "🛑 IONIZATION INTERLOCK ALERT: High voltage cut (0 kV)! Electric arc safely avoided (SHA-256)", "processedNotify": "⚡ Raman/Plasma command processed: {action} ({stat}) — Zero tumor residue, R0 certified"}, "cryoBnct": {"title": "❄️☢️ Irreversible Cryo-Electroporation (nsPEF) & Intraoperative Neutron BNCT", "infoLabel": "❄️☢️ Non-Thermal Hilar Ablation & BNCT Neutrons:", "infoText": "Nanosecond electroporation in contact with major vessels without thrombosis, and sub-cellular alpha decay (5 µm) via Boron-10 neutron capture!", "badge": "nsPEF 30 kV/cm • BNCT ¹⁰B 2.34 MeV ❄️", "specsTitle": "❄️ nsPEF Generator & BNCT Source Telemetry", "spec1Label": "Cryo-IRE:", "spec1Value": "nsPEF 300 ns @ 30 kV/cm + Joule-Thomson -20°C", "spec2Label": "Vascular integrity:", "spec2Value": "100% collagen matrix preserved", "spec3Label": "BNCT neutron source:", "spec3Value": "Epithermal (0.5 eV - 10 keV) @ 1.2x10⁹ n/cm²/s", "spec4Label": "Nuclear reaction:", "spec4Value": "¹⁰B + n → ⁴He (α) + ⁷Li (2.34 MeV over 7 µm)", "calibrateBtn": "🌱 Calibrate nsPEF Generator & BNCT Beam", "calibrateNotify": "✨ nsPEF generator (30 kV/cm) and BNCT neutron beam calibration successful (SHA-256)", "actionsTitle": "🔬 Simulate Cryo-IRE & BNCT Irradiation", "action1Btn": "❄️ nsPEF Hepatic Hilum Ablation (No Thrombosis)", "action1Label": "nsPEF Hepatic Hilum Ablation", "action1Desc": "🟢 nsPEF Cryo-IRE ablation (30 kV/cm / -20°C) in contact with the portal vein: 99.9% lethal tumor nanoporation with zero denaturation of vascular collagen.", "action2Btn": "☢️ BNCT Neutron Irradiation (¹⁰B-BPA Alpha)", "action2Label": "BNCT Neutron Irradiation", "action2Desc": "🟢 Epithermal BNCT irradiation on accumulated ¹⁰B-BPA (65 ppm): Sub-cellular alpha decay (7 µm). 100% of infiltrating tumor cells eradicated.", "action3Btn": "🛑 Simulate Neutron Dosimetry Lockout (0 n/cm²)", "action3Label": "Dosimetry Lockout", "action3Desc": "🛑 NEUTRON DOSIMETRY INTERLOCK ALERT: Absorption threshold reached! Instant source cutoff (0.0 n/cm²/s). SHA-256 shielding protection.", "outputPending": "nsPEF cryo-electroporation generator and BNCT neutron source ready...", "activateBtn": "🚀 Activate Intraoperative Cryo-IRE & BNCT", "activateNotify": "❄️☢️ Cryo-IRE and BNCT coupled to the Digital Twin!", "resultTemplate": "❄️☢️ <b>CRYO-IRE & BNCT NEUTRONS ({action}):</b> {desc} <br><strong>⚡ nsPEF Gradient / Boron: {param} kV/cm (or ppm) | Status: {stat}</strong> — Alpha 2.34 MeV.", "interlockNotify": "🛑 DOSIMETRY INTERLOCK ALERT: Neutron absorption threshold! Immediate beam cutoff (0 n/cm²/s)! SHA-256", "processedNotify": "❄️ Cryo-IRE/BNCT command processed: {action} ({stat}) — Tumor tissue eradicated 100%"}, "organoid4d": {"title": "🧬🌱 4D Organoid Assembly & Biomimetic 2PP Micro-Vasculogenesis", "infoLabel": "🧬🌱 In-Situ Organoid Reconstruction & 2PP Laser:", "infoText": "Acoustic-levitation deposition of 450,000 autologous spheroids and femtosecond-laser micro-capillary anastomosis in < 90 seconds!", "badge": "Levitation 40 kHz • 2PP Laser 780 nm 🌱", "specsTitle": "🌱 Acoustic Levitation & 2PP Laser Telemetry", "spec1Label": "Injector:", "spec1Value": "Acoustic Levitation (40 kHz) + Optical Trap", "spec2Label": "Spheroids:", "spec2Value": "450,000 hepatic organoids (300 µm) @ 10 µm", "spec3Label": "2PP laser:", "spec3Value": "Femtosecond Ti:Sapphire (780 nm / 100 fs)", "spec4Label": "Anastomosis:", "spec4Value": "PEG-DA capillary network crosslinked in 84.5 s", "calibrateBtn": "🌱 Calibrate Acoustic Levitation & 2PP Laser", "calibrateNotify": "✨ Acoustic levitation (40 kHz) and femtosecond 2PP laser calibration successful (SHA-256)", "actionsTitle": "🔬 Simulate Assembly & Micro-Vasculogenesis", "action1Btn": "🌱 Acoustic Organoid Deposition (S5/S8 Cavity)", "action1Label": "Acoustic Organoid Deposition", "action1Desc": "🟢 Acoustic deposition of 450,000 hepatic spheroids (300 µm) into the S5/S8 resection cavity: Perfect architectural assembly (10 µm precision).", "action2Btn": "⚡ 2PP Laser Micro-Vasculogenesis (Anastomosis)", "action2Label": "2PP Laser Micro-Vasculogenesis", "action2Desc": "🟢 2PP laser photopolymerization (780 nm / 180 mW): Micro-capillary network creation and anastomosis to portal vein stumps in 84.5s. 100% perfusion restored!", "action3Btn": "🛑 Simulate Hypoxia Lockout (0 spheroids/s)", "action3Label": "Hypoxia Lockout", "action3Desc": "🛑 HYPOXIA INTERLOCK ALERT: Local capillary perfusion drop! Instant organoid deposition cutoff (0 spheroids/s). SHA-256 necrosis protection.", "outputPending": "Acoustic levitation injector and femtosecond 2PP laser ready...", "activateBtn": "🚀 Activate Organoid & Micro-Vessel Assembly", "activateNotify": "🧬🌱 4D organoids and 2PP laser coupled to the Digital Twin!", "resultTemplate": "🧬🌱 <b>4D ORGANOIDS & 2PP LASER ({action}):</b> {desc} <br><strong>⚡ Levitation / 2PP Laser: {param} spheroids (or mW) | Status: {stat}</strong> — Precision 10 µm.", "interlockNotify": "🛑 HYPOXIA INTERLOCK ALERT: Necrotic risk detected! Immediate injection cutoff (0 spheroids/s)! SHA-256", "processedNotify": "🌱 4D Organoids/2PP command processed: {action} ({stat}) — Complete functional reconstruction"}, "iknifeAc225": {"title": "🔬💨 AEROSOL MOLECULAR DIAGNOSTICS (iKnife REIMS) & ACTINIUM-225 ALPHA THERANOSTICS (Phase 20 / M39-M40)", "introTitle": "🔬 In-Situ Spectrometric Aspiration (0.8s) & 28 MeV Alpha Radioguidance:", "introBody1": "Aspiration of scalpel/laser cutting aerosols continuously feeds a time-of-flight mass spectrometer (", "introBody2": "), identifying the Phosphatidylcholine (PC) membrane ratio to guarantee an R0 margin. In parallel, the intraoperative detection probe maps and irradiates occult micro-clusters (< 250 µm) via targeted alpha emission from ", "introBody3": ".", "panel1Title": "⚡ iKnife Aerosol Telemetry (REIMS ToF)", "p1Label1": "Aspiration flow rate:", "p1Value1": "1.5 L/min (sterile nozzle)", "p1Label2": "Ionization speed:", "p1Value2": "740 ms (time of flight)", "p1Label3": "Targeted membrane peak:", "p1Value3": "PC(34:1) m/z 760.6", "p1Label4": "Histological accuracy:", "p1Value4": "99.95% (R0 specificity)", "panel2Title": "☢️ Alpha Theranostic Probe (Ac-225 / Ga-68)", "p2Label1": "Alpha radionuclide:", "p2Value1": "Actinium-225 (Ac-225)", "p2Label2": "Cascade energy:", "p2Value2": "28 MeV (4 α particles)", "p2Label3": "Tissue penetration:", "p2Value3": "80 µm (0 collateral damage)", "p2Label4": "Direct gamma counting:", "p2Value4": "4,850 cps (150 µm threshold)", "simTitle": "⚙️ Online iKnife Analysis & Actinium-225 Theranostic Shot Simulation:", "btn1Label": "💨 iKnife Aerosol Analysis (R0 Margin)", "action1Name": "Scalpel Smoke Analysis (Healthy Margin)", "action1Desc": "Low PC/PI ratio (0.21), no tumor invasion on the transection line.", "btn2Label": "🛑 iKnife Infiltration Alert (R1)", "action2Name": "Membrane Infiltration Alert", "action2Desc": "Massive PC(34:1) m/z 760.6 proliferative peak! Surgical extension required (+3 mm).", "btn3Label": "☢️ Ac-225 Alpha Shot (8.5 MBq)", "action3Name": "Actinium-225 Theranostic Shot", "action3Desc": "Short-range irradiation (80 µm, 28 MeV) on the S4/hilar micro-cluster. Zero vessel damage.", "btn4Label": "🛑 Radio Interlock (0 MBq)", "action4Name": "Radiological Safety Lockout", "action4Desc": "Immediate cutoff of the Actinium-225 injection line (0 MBq). SHA-256 seal.", "outputPendingLabel": "🔬💨 WAITING FOR AEROSOL ASPIRATION AND GAMMA DETECTION:", "outputPendingText": "Select a command to launch REIMS ionization or Actinium-225 theranostic irradiation.", "activateBtn": "🚀 Activate Aerosol Diagnostics & Alpha-Theranostics", "activateNotify": "🔬💨 iKnife diagnostics and Actinium-225 theranostics synchronized!", "resultTemplate": "🔬💨 <b>iKNIFE REIMS & AC-225 ({action}):</b> {desc} <br><strong>⚡ m/z (or Activity MBq): {param} | Status: {stat}</strong> — Specificity 99.95%.", "interlockNotify": "🛑 RADIOLOGICAL INTERLOCK ALERT: Alpha dose threshold reached! Immediate Actinium-225 injection cutoff (0 MBq)! SHA-256", "marginAlertNotify": "🛑 iKNIFE REIMS ALERT: R1 margin detected (PC 34:1 m/z 760.6 peak)! Membrane infiltration — surgical extension required!", "processedNotify": "💨 iKnife diagnosis / Ac-225 shot processed: {action} ({stat}) — R0 margin and micro-clusters secured"}}}, "fr": {"meta": {"locale": "fr", "name": "French", "nativeName": "Français", "flag": "🇫🇷", "dir": "ltr", "intl": "fr-FR"}, "hub": {"subtitle": "Plateforme de Simulation Chirurgicale et de Recherche Assistée par IA", "tagline": "Plateforme académique, d'expérimentation scientifique et de simulation chirurgicale Voice-First.", "academic": {"title": "ACADÉMIQUE", "subtitle": "Apprendre · Pratiquer · Évaluer"}, "research": {"title": "RECHERCHE", "subtitle": "Concevoir · Expérimenter · Analyser"}, "simulation": {"title": "SIMULATION", "subtitle": "Planifier · Simuler · Comparer"}, "clinical": {"title": "CLINIQUE", "subtitle": "Environnement restreint / séparé"}, "disclaimer": "⚠️ Réservé à la recherche, l'enseignement et la simulation. Non destiné au diagnostic ou au traitement clinique."}, "modes": {"common": {"back": "← Retour", "export": "📥 Exporter", "voiceDictation": "🎙️ Dictée vocale", "notAvailable": "n/d"}, "academic": {"badge": "MODE ACADÉMIQUE", "heading": "Plateforme d'Apprentissage Chirurgical", "subtitle": "Cas virtuels annotés, score détaillé, comparaison avec la stratégie de référence.", "libraryTitle": "📚 Bibliothèque de Cas Éducatifs", "startCase": "Commencer →", "objectivesCount": "{count} objectif{count, plural, one {} other {s}}", "leaderboardTitle": "🏆 Surgical Challenge — Classement", "noSessions": "Aucune session. Lancez un cas pour commencer.", "tableRank": "#", "tableCase": "Cas", "tableScore": "Score", "tableTime": "Temps", "tableDate": "Date", "justifTitle": "✍️ Justification de la stratégie", "justifDesc": "Expliquez pourquoi vous avez choisi cette approche, les marges retenues et les structures à risque évitées.", "justifPlaceholder": "Saisissez votre raisonnement clinique ici (voix ou texte)...", "voiceRecordingStarted": "Enregistrement vocal démarré...", "submitEvaluate": "Soumettre & Évaluer →", "justifTooShort": "Veuillez fournir une justification plus détaillée (min. 10 caractères).", "engineNotLoaded": "Moteur Academic V2 non chargé.", "examInProgressTitle": "🎓 EXAMEN EN COURS — Cas {caseId}", "gradeToImprove": "📚 À AMÉLIORER", "gradeExcellent": "🏆 EXCELLENT", "gradeVeryGood": "🥇 TRÈS BIEN", "gradeGood": "🥈 BIEN", "completionTime": "Temps de complétion : {min}m {sec}s", "objectiveScore3d": "Score Objectif (3D)", "expertJuryScore": "Score Expert / Jury", "aiSocraticReview": "Revue Socratique IA", "aiSocraticExcellent": "Excellente", "detail6dEngineTitle": "Détail Moteur 6D", "backToHubBtn": "Retour au Hub", "exportScientificReportBtn": "Exporter Rapport Scientifique", "exportingScientificReport": "Exportation du dossier scientifique (JSON)...", "dimensions": {"anatomy": "Anatomie", "planning": "Planification", "precision": "Précision", "safety": "Sécurité", "efficiency": "Efficacité", "decision": "Décision"}}, "research": {"badge": "MODE RECHERCHE", "heading": "Plateforme d'Expérimentation Scientifique", "subtitle": "Concevez, exécutez et analysez des études chirurgicales. Exportez vos datasets pour publication.", "studiesTitle": "📊 Études Disponibles", "studyLabel": "Étude {id}", "launchStudy": "Lancer l'étude →", "sessionsTitle": "📂 Sessions Enregistrées", "groupLabel": "Groupe {group}", "confidencePrompt": "Sur une échelle de 1 à 10, quelle est votre confiance dans le plan établi ?", "sessionCompleteTitle": "Étude {id} — Session Terminée", "metricTime": "⏱ Temps", "metricClicks": "🖱 Clics", "metricVoice": "🎙 Vocaux", "metricPlanMods": "📝 Modif. plan", "metricErrors": "❌ Erreurs", "metricConfidence": "💪 Confiance", "hypothesisLabel": "Hypothèse :", "exportDataset": "📥 Exporter Dataset (JSON + CSV)", "noSessions": "Aucune session. Lancez une étude pour enregistrer des données.", "sessionCount": "{count} session{count, plural, one {} other {s}} enregistrée{count, plural, one {} other {s}}", "lockRequiredAlert": "🔒 VERROUILLAGE ÉTUDE RECHERCHE REQUIS\nImpossible de démarrer l'étude officielle « {protocolId} » sans connexion au serveur de randomisation FastAPI.\nDemandez au chercheur de démarrer le serveur uvicorn.", "analyticsSessionSummaryTitle": "📊 ANALYTICS Bilan Session", "assignedGroupLabel": "Groupe assigné :", "loggedEventsLabel": "Événements loggués :", "voiceCommandsLabelV2": "Commandes Vocales :", "uiErrorsLabel": "Erreurs UI :", "endStudyBtn": "Terminer l'étude", "exportDatasetJsonBtn": "Exporter Dataset (JSON)"}, "simulation": {"badge": "MODE SIMULATION", "heading": "Environnement de Simulation Chirurgicale", "subtitle": "Cas virtuels, scénarios comparatifs, commandes vocales et 3 niveaux d'IA.", "disclaimer": "⚠️ Résultats simulés — Non destinés au guidage clinique réel.", "libraryTitle": "📚 BIBLIOTHÈQUE DE CAS", "launchCase": "Simuler →", "aiLevelTitle": "🤖 Niveau IA", "voiceCommandsTitle": "🎙 Commandes Vocales", "reportTitle": "📊 Rapport de Simulation", "caseFallback": "Cas simulation", "reportTime": "⏱ Temps", "reportVolResected": "✂️ Vol. réséqué [estimé]", "reportVolRemnant": "🫀 Vol. restant [estimé]", "reportDistance": "📏 Distance min.", "reportUnsafeMargins": "⚠ Marges non sécurisées", "reportErrors": "❌ Erreurs", "reportVoiceCmds": "🎙 Commandes vocales", "reportScenarios": "📋 Scénarios", "scoreFinal": "Score Final", "comparisonDisclaimer": "⚠️ Estimation analytique (sphère équivalente) à partir des données du cas — pas un calcul de mesh triangulé exact, non cliniques, usage pédagogique uniquement.", "reportDisclaimer": "⚠️ Volumes/distances : estimation analytique (sphère équivalente) à partir des données du cas — pas un calcul de mesh triangulé exact, non destinée au guidage clinique d'une intervention réelle.", "exportJson": "📥 Exporter JSON", "needTwoScenariosAlert": "Créez au moins 2 scénarios (via le bouton + ou Fork) pour pouvoir les comparer.", "needTwoScenariosNotify": "⚠ Créez au moins 2 scénarios pour les comparer.", "marginPrompt": "Marge de résection souhaitée pour ce scénario (mm) ?", "scenarioDefaultName": "Scénario {letter}", "addScenario": "+ Scénario", "scenarioCreatedNotify": "✅ {name} créé (Fork de {parent}, marge {margin}mm).", "scenarioSwitchNotify": "🔄 Passage au {name}.", "scenarioOrigin": "départ", "comparisonTitle": "⚖️ Comparaison Scénarios", "actionsLabel": "Actions", "geometryUnavailable": "⚠️ Géométrie indisponible pour ce cas — non calculé.", "volResectedLabel": "Volume réséqué [estimé]", "volRemnantLabel": "Volume restant [estimé]", "distanceToVessel": "Dist. {vessel}", "criticalVesselFallback": "vaisseau critique", "marginDeficit": "❌ Marge > place disponible (déficit {n} mm)", "preservesTissue": "{name} préserve plus de tissu (estimation analytique).", "noActionsRecorded": "Aucune action enregistrée", "caseLoadedLabel": "Cas chargé", "aiMsgObserver": "👁 IA Observatrice — Silencieuse. Travaillez librement.", "aiMsgAssistant": "🤖 IA Assistante — Je vous alerterai si une structure est à risque.", "aiMsgAdversary": "⚔️ IA Adversaire — Je vais proposer ma propre stratégie. Défendez votre plan !", "aiCheckAssistantWarn": "⚠️ [IA Assistante] Structure vasculaire à {dist} mm. Marge insuffisante — recommandation ≥ 8 mm.", "aiCheckAssistantOk": "✅ [IA Assistante] Marge correcte : {dist} mm.", "aiCheckAdversary": "⚔️ [IA Adversaire] Approche postérieure proposée : marge {dist} mm. Volume résiduel +8%. Défendez votre choix.", "aiLevelStatus": "IA Niv.{level} — {name}", "aiLevelActivatedNotify": "🤖 IA niveau {level} activé", "forkLabel": "Fork depuis {parent} (marge {margin}mm)", "marginParenLabel": "(Marge {mm}mm)", "metricsUnavailableV2": "⚠️ Métriques non calculées — géométrie du cas indisponible.", "tradeoffScoreLabel": "Score de compromis :", "volResectedEstColon": "Vol. réséqué [estimé] :", "volRemnantEstColon": "Vol. restant [estimé] :", "criticalVesselFixedColon": "Dist. vaisseau critique [fixe, anatomique] :", "marginExceedsColonDeficit": "❌ Marge demandée > place disponible (déficit {n} mm)", "offlineSuffix": "— hors-ligne"}, "difficulty": {"beginner": "Débutant", "intermediate": "Intermédiaire", "advanced": "Avancé", "expert": "Expert"}, "caseType": {"synthetic": "Cas synthétique", "ai": "Cas généré IA", "real": "Cas anonymisé réel"}, "organs": {"liver": "Foie", "pancreas": "Pancréas", "kidney": "Rein", "gynecology": "Gynécologie", "pediatrics": "Pédiatrie"}, "aiLevel": {"observer": {"title": "Observatrice", "desc": "Silencieuse"}, "assistant": {"title": "Assistante", "desc": "Alertes structures"}, "adversary": {"title": "Adversaire", "desc": "Contre-stratégie"}}}, "or": {"loadingSchedule": "Chargement du planning et des contraintes du bloc...", "connectionError": "Erreur de connexion au serveur de planning.", "moveImpossible": "🔴 Impossible de déplacer l'intervention : {reasons}", "warningPrefix": "🟠 Attention : {warnings}", "frozenPrompt": "Ce programme est GELÉ (Frozen). Saisissez la raison d'urgence administrative/médicale pour modifier la salle :", "frozenCancelled": "Modification annulée : justification d'audit requise pour un programme gelé.", "slotMoved": "Créneau déplacé et validé sous contraintes", "errorPrefix": "Erreur : {detail}", "constraintViolated": "Contrainte violée", "dropUpdateError": "Erreur lors de la mise à jour", "interventionLabel": "Intervention : {name}", "roomLabel": "Salle :", "scheduleLabel": "Horaire :", "freezeOfficial": "🔒 Gel Officiel (Freeze)", "delayRealTime": "⏱ Retard / Horaires Réels", "programFrozen": "Programme officiel gelé et signé (Frozen).", "freezeError": "Erreur lors du gel du programme.", "serverError": "Erreur serveur", "delayPrompt": "Nombre de minutes de retard ou d'avance réelles à enregistrer (ex: 30 pour 30 min de retard) :", "delayRecorded": "Retard de +{mins} min enregistré. Décalage automatique des interventions suivantes en salle appliqué.", "realtimeError": "Erreur enregistrement temps réel.", "calculatingPrep": "Calcul du score de préparation et vérification des bloqueurs...", "conditionsValidated": "{completed} / {total} conditions validées ({pct}%)", "criticalBlockers": "🔴 Bloqueurs critiques (Intervention interdite)", "warnings": "🟠 Avertissements", "sectionImaging": "Imagerie 3D", "sectionSurgery": "Chirurgie", "sectionAnesthesia": "Anesthésie", "sectionBiology": "Biologie", "sectionOrTeam": "Bloc & Équipe", "sectionEquipment": "Matériel", "sectionIcu": "USI / Réanimation", "prepLoadError": "Erreur de chargement de la préparation.", "aiAnalyzing": "Le Moteur de Contraintes & Copilote IA analyse les possibilités...", "optimizeError": "Erreur lors du calcul de l'optimisation.", "optimizeServerError": "Erreur serveur lors de l'optimisation.", "noMovesRequired": "Aucun mouvement de salle requis. Le planning est déjà optimal sous contraintes.", "patientLabel": "Patient : {name}", "assignmentLabel": "Affectation :", "applyingOptimization": "Application de la proposition d'optimisation retenue...", "programUpdated": "Programme mis à jour et validé sous contraintes !", "applyError": "Erreur lors de l'application.", "whatIfPrompt": "Simuler l'indisponibilité d'une salle ? Saisissez le nom/ID de la salle (ex: bloc-2 ou Salle 2) ou laissez vide :", "whatIfLaunching": "Lancement du Bac à Sable Virtuel « What-If »...", "whatIfError": "Erreur lors de la simulation.", "whatIfServerError": "Erreur serveur simulation", "whatIfResultTitle": "📊 RÉSULTAT SIMULATION VIRTUELLE (Sans impact base réelle)", "whatIfScenario": "Scénario :", "whatIfImpacted": "Interventions affectées :", "whatIfReallocations": "Reclassements possibles :", "whatIfDeprogramming": "Déprogrammations à prévoir :", "whatIfRecommendation": "Recommandation :", "loadingDurationStats": "Chargement des statistiques de durée...", "noStatsAvailable": "Aucune donnée statistique disponible.", "tableProcedure": "Procédure", "tableSample": "Échantillon", "tableTheoreticalDuration": "Durée Théorique", "tableRealAverage": "Moyenne Réelle", "tableMedianP50": "Médiane P50", "tableP90Predictive": "P90 Prédictif", "tableAiRecommendation": "Recommandation IA", "sampleCount": "{count} acte(s)", "statsLoadError": "Impossible de charger les statistiques.", "networkError": "Erreur réseau lors de la récupération des données.", "loadingAuditTrail": "Chargement du registre d'audit du bloc...", "noAuditEvents": "Aucun événement d'audit enregistré.", "tableTimestamp": "Horodatage", "tableUser": "Utilisateur", "tableAction": "Action", "tableResource": "Ressource", "tableLevel": "Niveau", "systemUser": "Système", "auditLoadError": "Impossible de charger le registre d'audit.", "loadingRegulatoryStatus": "Chargement du statut réglementaire...", "mdrLoadError": "Impossible de récupérer le statut MDR.", "mdrClassification": "📋 Classification Medical Device", "mdrEnvironment": "Environnement :", "mdrHdsSecurity": "🔒 Conforme HDS &amp; Sécurité", "mdr2faMandatory": "2FA Obligatoire en prod :", "mdrYour2fa": "Votre 2FA utilisateur :", "mdrEncryption": "Chiffrement pgcrypto At-Rest :", "yes": "🟢 Oui", "no": "🔴 Non", "enabled": "🟢 Activé", "inactive": "🟠 Inactif", "operational": "🟢 Opérationnel", "mdrQualityCi": "🛠️ Étanchéité Qualité &amp; CI/CD", "mdrCiPipeline": "Pipeline CI clinique étanche :", "mdrIsolatedMain": "🟢 Isolée (main)", "mdrResearchMode": "Mode Recherche actif :", "mdrResearch": "⚠️ Recherche", "mdrProduction": "🟢 Production", "mdrRuffLinter": "Ruff Linter &amp; Mypy :", "mdrActive": "🟢 Actifs", "mdrInactive": "🔴 Inactifs", "mdrClinicalData": "📊 Données d'Évaluation Clinique", "mdrRegisteredPatients": "Patients Enregistrés", "mdrValidatedPlans": "Plans Validés", "mdrAuditEvents": "Événements Audit", "vetTitle": "🐾 1. VetSurg3D", "vetSubtitle": "Chirurgie & Volumétrie Vétérinaire (Canin/Équin).", "vetCanine": "Canin (Chien)", "vetFeline": "Félin (Chat)", "vetEquine": "Équin (Cheval)", "vetWeightPlaceholder": "Poids kg", "vetCalculate": "📐 Calculer Volume Vétérinaire", "vetCalculating": "Calcul...", "vetError": "Erreur calcul.", "vetOrganVolume": "✅ Volume Organe : {vol} mL<br>Tissu Restant : <strong>{pct}%</strong> ({safety})", "vetSafe": "🟢 Sûr", "vetSubtotal": "🔴 Subtotal", "eduTitle": "🎓 2. SurgSim-Edu 3D", "eduSubtitle": "Simulations virtuelles pour CHU & Internes.", "eduBrowseCatalog": "📚 Parcourir le Catalogue CHU", "eduLoading": "Chargement...", "eduError": "Erreur chargement.", "orKpiTitle": "📊 3. OR-Optimizer KPI", "orKpiSubtitle": "Audit de rentabilité & logistique du bloc.", "orKpiAudit": "📈 Auditer Rentabilité Bloc", "orKpiAnalyzing": "Analyse...", "orKpiError": "Erreur KPI.", "orKpiOccupancy": "Taux d'occupation : <strong>{pct}%</strong><br>Économies estimées : <strong>{savings} € / mois</strong>", "radiomicsTitle": "🧪 4. SurgData Recherche", "radiomicsSubtitle": "Export de Datasets Anonymisés (RUO).", "radiomicsExport": "🔬 Exporter Dataset IA 3D", "radiomicsExporting": "Exportation...", "radiomicsPatientRequired": "Patient sélectionné requis.", "radiomicsServerUnavailable": "Serveur indisponible.", "radiomicsExported": "✅ Dataset Exporté !<br>Pseudo-ID : <code>{id}</code><br>Voxels 3D analysés : {count}"}, "common": {"close": "Fermer", "cancel": "Annuler", "save": "Enregistrer", "apply": "Appliquer", "export": "Exporter", "import": "Importer", "edit": "Éditer", "delete": "Supprimer", "loading": "Chargement…", "search": "Rechercher…", "yes": "Oui", "no": "Non", "warning": "Avertissement", "error": "Erreur", "success": "Succès", "info": "Info", "notImplemented": "Non implémenté dans ce prototype", "notCalculated": "Non calculé", "none": "Aucun", "unknown": "Inconnu"}, "nav": {"plan": "Plan", "dicom": "DICOM", "twin": "Jumeau Num.", "ar": "Réalité Augm.", "audit": "Audit Trail", "surgai": "SurgAI", "surgsim": "SurgSim", "surgor": "Bloc IA", "surgnav": "GPS Nav", "surgvoice": "Assistant", "mdrFda": "Conformité", "researchToggle": "Mode Recherche — révèle les modules exploratoires non validés cliniquement (Jalons M21-M40)", "dashToggle": "Tableau de Bord Bloc", "orToggle": "Mode Bloc Opératoire (écran partagé)", "touchToggle": "Mode tactile (cibles agrandies)", "readonlyToggle": "Mode lecture seule (équipe du bloc)", "themeToggle": "Thème", "hubToggle": "Changer de module / spécialité", "settingsToggle": "Paramètres techniques (Gemini, backend) — réservé au mode recherche/maintenance", "patientsToggle": "Patients", "logout": "Se déconnecter", "preanesthesieToggle": "Dossier pré-anesthésique", "icuFollowupToggle": "Suivi réanimation / USI", "exitOr": "Sortir Mode OR", "exitDash": "Sortir Tableau de Bord", "researchBanner": "🔬 MODE RECHERCHE ACTIVÉ — les modules affichés ci-dessus sont exploratoires (Jalons M21-M40), non validés cliniquement, et ne doivent pas être utilisés pour la prise de décision au bloc.", "researchModeOnNotify": "🔬 Mode Recherche activé — modules exploratoires + Paramètres techniques (⚙) visibles", "researchModeOffNotify": "✅ Mode Clinique — seuls les outils validés pour le bloc sont affichés", "researchModeDeniedNotify": "🔒 Mode Recherche non inclus dans votre plan ({plan}) — contactez un administrateur pour mettre à niveau."}, "login": {"title": "Connexion", "username": "Identifiant", "password": "Mot de passe", "submit": "Se connecter", "twofaHint": "Code à 6 chiffres (application d'authentification) ou code de secours.", "twofaCode": "Code", "demoAccountLabel": "💡 Compte Démo :", "demoPasswordLabel": "Mot de passe :"}, "lang": {"selectorLabel": "Langue", "en": "English", "fr": "Français", "ar": "العربية", "nl": "Nederlands", "changed": "Langue changée vers {language}"}, "sidebar": {"ageSex": "Âge / Sexe", "weightHeight": "Poids / Taille", "diagnosis": "Diagnostic", "orPlanning": "Planning Bloc", "notScheduledToday": "Non programmé aujourd'hui", "urgencyRed": "🔴 Urgent", "urgencyOrange": "🟠 Semi-urgent", "urgencyGreen": "🟢 Programmé", "switchModule": "Changer de module", "room": "Salle {n}", "statusOngoing": "En cours", "statusDone": "Terminé", "statusPlanned": "Prévu"}, "toolbar": {"importDicom": "Importer DICOM", "realSegmentation": "Segmentation IA réelle", "realSegmentationTitle": "Lance une vraie inférence de segmentation (TotalSegmentator) sur le backend et charge les maillages 3D réels obtenus", "pacs": "PACS", "pacsTitle": "Rechercher une étude sur le PACS (QIDO-RS) et importer une série (WADO-RS)", "threshold3d": "Seuil 3D", "voxelsToggle": "Afficher/masquer l'organe DICOM voxelisé dans la scène 3D", "recenter": "Recadrer", "recenterTitle": "Recadrer la caméra sur l'organe DICOM (touche R)", "reset": "Reset", "resetTitle": "Réinitialiser rotation + zoom (touche Espace)", "spin": "Spin", "spinTitle": "Activer/désactiver la rotation automatique"}, "analysis": {"sectionTitle": "Volumétrie (calculée sur le volume 3D courant)", "organVolume": "Volume organe", "resectionVolume": "Volume de résection estimé", "remnant": "Reste fonctionnel", "realSegmentationBadge": "🏥 segmentation réelle", "proceduralBadge": "⚠ estimation procédurale, non clinique", "proceduralNote": "Estimation dérivée du volume voxel affiché, pas d'une segmentation IA validée. Utilisez « 🔬 Segmentation IA réelle » pour un calcul basé sur TotalSegmentator.", "riskScoreTitle": "Score de risque opératoire", "riskScoreBadge": "⚠ heuristique interne, non validée cliniquement", "riskScoreBasedOn": "basé sur {count} métrique(s) hors cible, âge, urgence — formule interne, pas une échelle de risque validée (ex. POSSUM, ASA)", "riskLow": "Faible", "riskModerate": "Modéré", "riskHigh": "Élevé", "scenarios": "Scénarios prédictifs", "scenarioOptimistic": "Optimiste", "scenarioExpected": "Attendu", "scenarioUnfavorable": "Défavorable", "remnantFunctional": "{pct}% reste fonctionnel", "recalculate": "↻ Recalculer", "recalculated": "Analyse recalculée", "exportPlan": "⭳ Exporter le plan (DICOM SR / JSON)"}, "staging": {"tnmTitle": "🔬 Stadification TNM", "tField": "T (Tumeur)", "nField": "N (Ganglions)", "mField": "M (Métastases)", "hbpParams": "🏥 Paramètres HBP", "bclcField": "BCLC", "childPughField": "Child-Pugh", "colorectalParams": "🏥 Paramètres Colorectaux", "crmField": "CRM", "thoracicParams": "🫁 Paramètres Thoraciques", "vemsField": "VEMS préop.", "volumetryTitle": "📊 Volumétrie", "volumetryRealBadge": "🏥 réelle", "volumetryEstimateBadge": "⚠ estimation", "organVolumeReal": "Volume organe (segmentation IA réelle)", "organVolumeEstimate": "Volume organe (volume courant, estimation)", "tumorVolume": "Volume tumeur segmentée", "noSegmentation": "(aucune segmentation)", "computeResectability": "🔄 Calculer la résécabilité", "auditLogTitle": "📋 Audit Log ({count} entrée{count, plural, one {} other {s}})", "auditLogEmpty": "Aucune action enregistrée.", "resectable": "✅ Résécable — Chirurgie indiquée", "notResectable": "❌ Non résécable en l'état — Discuter alternative", "exportReport": "⭳ Exporter bilan staging", "reportExported": "Bilan staging exporté (JSON)"}, "dicom": {"importing": "Lecture de {count} fichier(s)…", "resampling": "Resampling {n}³ voxels…", "loaded": "{count} coupe(s) DICOM chargée(s) — Molette=naviguer, WW={ww} WL={wl}", "reconstructing": "Reconstruction 3D…", "voxelizing": "Voxelisation au seuil {threshold} HU…", "realVolumeShown": "✓ Volume DICOM réel affiché en 3D — seuil {threshold} HU, {count} voxel(s) en {chunks} chunk(s)", "noVolume": "Aucun volume DICOM à afficher", "noVoxelsAboveThreshold": "Aucun voxel ≥ {threshold} HU — baissez le seuil dans la barre 🎚", "hidden": "Voxels DICOM masqués — anatomie procédurale restaurée", "shown": "Voxels DICOM réels affichés", "reconstructionFailed": "Reconstruction 3D échouée : {error}"}, "settings": {"title": "Paramètres", "geminiKey": "Clé API Gemini", "geminiModel": "Modèle Gemini", "geminiModelHint": "gemini-flash-latest pointe toujours vers le Flash le plus récent (évite les dépréciations). Alternatives : {alt1}, {alt2}, ou {alt3} (ferme le 22/07/2026).", "groqKey": "Clé API Groq (fallback)", "backendUrl": "URL Backend", "surgeonName": "Nom du chirurgien", "localAiTitle": "🔒 IA locale (offline-first — zéro réseau, zéro fuite de données)", "localAiHint": "Si configurée ci-dessous, l'IA locale est TOUJOURS essayée en premier, avant Gemini/Groq/backend — le prompt et la réponse ne quittent jamais l'appareil (WebGPU) ou le réseau local (serveur).", "localServer": "Serveur local (Ollama / llama.cpp, API compatible OpenAI)", "localServerModel": "Nom du modèle sur le serveur local", "webgpuModel": "Modèle local dans le navigateur (WebGPU, WebLLM)", "webgpuChecking": "Vérification du support WebGPU…", "loadModel": "⬇ Charger le modèle", "unloadModel": "✕ Décharger", "webgpuHint": "Premier chargement : téléchargement de ~1 à 5 Go (mis en cache par le navigateur via IndexedDB — instantané ensuite). Nécessite Chrome/Edge 113+ (desktop ou Android récent) ; non disponible sur Safari/Firefox à ce jour. Une fois chargé, aucune requête réseau n'est faite pour générer une réponse.", "offlineCertifiedTitle": "📚 Mode hors-ligne certifié", "offlineCertifiedHint": "Force les réponses pré-calculées, même si une clé IA est configurée. Aucun appel réseau vers Gemini/Groq."}, "patients": {"title": "Base Patients", "searchPlaceholder": "Rechercher un patient…", "editCurrent": "✎ Éditer patient courant", "updated": "Patient mis à jour (local)", "syncedBackend": "Synchronisé avec le backend"}, "preanesthesia": {"title": "🩺 Dossier pré-anesthésique", "forPatient": "Patient du module actif", "asaScore": "Score ASA", "asaUrgence": "Urgence (U)", "mallampati": "Score de Mallampati", "intubationDifficile": "Intubation difficile prévue", "jeuneSolide": "Jeûne solide (h)", "jeuneLiquide": "Jeûne liquide clair (h)", "antecedents": "Antécédents", "allergies": "Allergies", "traitement": "Traitement chronique", "checklist": "Checklist bloc", "anesthesiste": "Anesthésiste", "conclusion": "Conclusion / conduite à tenir", "updated": "Dossier pré-anesthésique mis à jour (local)"}, "icuFollowup": {"title": "🛌 Suivi réanimation / USI", "forPatient": "Patient du module actif", "newEntry": "+ Nouvelle évaluation", "sofaRespiration": "Respiration", "sofaCoagulation": "Coagulation", "sofaHepatique": "Hépatique", "sofaCardio": "Cardiovasculaire", "sofaNeuro": "Neurologique", "sofaRenal": "Rénal", "sofaTotal": "SOFA total :", "apache2": "Score APACHE II (0-71)", "rass": "RASS", "gcsEye": "Oculaire (1-4)", "gcsVerbal": "Verbale (1-5)", "gcsMotor": "Motrice (1-6)", "gcsTotal": "Glasgow total :", "ventilation": "Ventilation mécanique", "ventMode": "Mode", "bilan": "Bilan entrées/sorties", "entrees": "Entrées (ml)", "sorties": "Sorties (ml)", "bilanNet": "Bilan net :", "notes": "Notes", "auteur": "Auteur", "add": "+ Ajouter l'évaluation"}, "audit": {"title": "📜 Audit Trail", "filterByPatient": "Filtrer par patient", "filterByUser": "Filtrer par utilisateur"}, "ai": {"chatPlaceholder": "Posez votre question…", "briefingTitle": "🤖 Synthèse IA automatique", "briefingProcedure": "{procedure} recommandée pour ce patient.", "briefingRemnant": "Reste fonctionnel estimé : {pct}% (seuil de sécurité : {threshold}%)", "briefingRisk": "Risque opératoire :", "briefingWatch": "⚠️ À surveiller : {metrics}", "briefingNoIssue": "✅ Aucune métrique hors cible détectée.", "respondInLanguage": "Réponds exclusivement en {language}."}, "modals": {"mdrFda": {"title": "🛡️ Statut de conformité (prototype, non certifié) & brouillon de dictée CCAM", "notCertifiedBanner": "⚠️ Prototype non certifié : ce logiciel n'a fait l'objet d'AUCUNE certification CE MDR 2017/745, d'AUCUNE soumission FDA 510(k), et d'AUCUN audit HIPAA formel. Les informations ci-dessous décrivent l'état réel du prototype, pas une conformité obtenue.", "regulatoryStateTitle": "📋 État réglementaire réel", "dictationTitle": "🗣️ Brouillon de dictée CCAM (démonstration)", "dictationHint": "⚠️ Appariement de mots-clés sur un texte prédéfini — PAS un moteur de reconnaissance vocale ni de NLP réel. À valider intégralement avant tout usage :", "reportPreviewTitle": "📄 Brouillon de compte-rendu (démonstration, pas un document légal) :"}, "respCycle": {"title": "🌊 Cycle respiratoire — formule cinématique simplifiée, non validée cliniquement", "banner": "🌊 Formule cinématique illustrative : approximation sinusoïdale du mouvement respiratoire (14 cycles/min), non calibrée sur ce patient, non validée cliniquement — pas un solveur par éléments finis réel.", "launchLive": "▶ Lancer Cycle Live", "pause": "⏸️ Mettre en Pause", "displacementTitle": "📍 Déplacement Anatomique (formule, temps réel)", "respiratoryPhase": "Phase respiratoire", "craniocaudalShift": "Déplacement crânio-caudal (ΔZ)", "anteroposteriorShift": "Bascule antéro-postérieure (ΔY)", "registrationTitle": "🛠️ Recalage non-rigide — non implémenté", "registrationHint": "⚠️ Aucun solveur de recalage élastique n'est implémenté dans ce prototype (voir backend/biomechanics_engine.py `/elastic-registration`, qui renvoie désormais honnêtement \"not_implemented\" au lieu de métriques fabriquées).", "pneumoPressure": "Pression pneumopéritoine (paramètre)", "registerButton": "🔄 Recaler sur Stéréovision AR / Écho (non implémenté)"}}, "i18nAdmin": {"title": "🌐 Éditeur de traductions", "hint": "Les modifications sont sauvegardées localement (navigateur) comme couche de surcharge, sans modifier les fichiers source. Exportez le JSON pour les appliquer de façon permanente.", "keyColumn": "Clé", "exportLanguage": "Exporter le JSON {language}", "importLanguage": "Importer le JSON {language}", "resetOverrides": "Réinitialiser les modifications locales", "overridesSaved": "Modifications de traduction sauvegardées localement", "overridesReset": "Modifications de traduction locales effacées", "imported": "Traductions {language} importées ({count} clé(s))"}, "plan": {"plannedProcedure": "Procédure planifiée", "metricsTitle": "Métriques {specialty}", "checklistTitle": "Checklist préopératoire", "exportedViaBackend": "Export généré via le backend", "exportedLocal": "Export local généré (backend non configuré)"}, "workflow": {"patient": "Mon Patient", "analysis": "Analyse IA", "simulation": "Simulation", "or": "Bloc"}, "pipeline": {"loadingTitle": "Pipeline PACS → IA → Jumeau 3D en cours...", "realTitle": "ANATOMIE RÉELLE — Jumeau 3D Patient-Spécifique", "demoTitle": "MODE DÉMO — Anatomie Procédurale (Entraînement uniquement)", "estimateTitle": "ESTIMATION LOCALE — Backend de segmentation réelle indisponible (non clinique)"}, "catalog": {"keyProcedures": "Procédures clés", "planCycleTitle": "Cycle de validation du plan", "implantsTitle": "Implants & Matériel", "hudModule": "Module", "hudPatient": "Patient", "hudProcedure": "Procédure", "hudMode": "Mode", "chatYou": "Vous", "chatAI": "IA", "aiGreeting": "Bonjour, je suis votre assistant chirurgical {specialty}. Comment puis-je vous aider ?"}, "chrome": {"certBanner": "Prototype de démonstration — Usage pédagogique uniquement", "researchBanner": "🔬 MODE RECHERCHE ACTIVÉ — les modules affichés ci-dessus sont exploratoires (Jalons M21-M40), non validés cliniquement, et ne doivent pas être utilisés pour la prise de décision au bloc.", "exploratoryLab": "🔬 Exploratory Lab", "tabPlan": "Plan", "tabStaging": "🎯 Staging", "tabImplants": "Implants", "tabAiChat": "IA Chat", "tabAnalysis": "Analyse", "progressLabel": "Progression :", "finishScore": "Terminer & Score", "quit": "✕ Quitter", "clicksLabel": "Clics :", "voiceLabel": "Vocaux :", "planModsLabel": "Modifs Plan :", "timerLabel": "Timer :", "finishSession": "Terminer Session", "simReportBtn": "Rapport Simulation", "validatedPlan": "Plan validé", "approachLabel": "Voie :", "estimatedDurationLabel": "Durée estimée :", "moduleLoadedHbp": "Module {specialty} chargé — Pipeline hépatique dédié & validé", "moduleLoadedGeneric": "🔬 Spécialité {specialty} : Module de recherche (segmentation générique task=total, qualité inférieure)", "dashShort": "Dash", "orShort": "OR", "orCenterShort": "OR Center", "researchModuleBanner": "🛑 MODULE DE RECHERCHE — SIMULATION PROTOTYPE NON CERTIFIÉE POUR DÉCISION PATIENT RÉELLE"}, "reports": {"flightPlan": {"title": "Plan de Vol Chirurgical", "subtitle": "GeneralSurgPlan3D MIMO — Oncology Suite 2026", "prototypeBadge": "PROTOTYPE — NON CERTIFIÉ", "prototypeTitle": "Prototype non certifié — voir 🛡️ Conformité MDR", "dateLabel": "Date :", "patientSection": "👤 Identification Patient", "nameLabel": "Nom :", "patientIdLabel": "ID Patient / PACS :", "surgeonLabel": "Chirurgien responsable :", "surgeonFallback": "Chirurgien Oncologue", "specialtyLabel": "Spécialité :", "stagingSection": "🎯 Stadification & Décision", "tnmLabel": "Classification TNM :", "bclcLabel": "Score BCLC / Child :", "statusLabel": "Statut global :", "notCalculated": "Non calculée", "vascularSection": "🟢 Cartographie Vasculaire & Segmentectomie Couinaud (Brisbane 2000)", "tumorSegmentsLabel": "Segments tumoraux infiltrés :", "none": "Aucun", "resectionLabel": "Geste chirurgical recommandé :", "marginsSection": "🔵 Marges de Sécurité 3D (R0/R1)", "distCutLabel": "Distance Tumeur - Coupe :", "distVesselLabel": "Distance Tumeur - Vaisseaux :", "volumetrySection": "🟡 Volumétrie & Ischémie Parenchymateuse", "flrRawLabel": "FLR Anatomique brut :", "flrFunctionalLabel": "FLR Fonctionnel vascularisé :", "congestedVolLabel": "Volume congestionné / nécrosé :", "hashFootnote": "Empreinte de chaînage (hash local non cryptographique, djb2 — pas du SHA-256, à ne pas présenter comme une preuve d'intégrité légale) :", "printBtn": "🖨️ Imprimer / Sauvegarder PDF", "signatureLabel": "Signature électronique :"}, "operativePlan": {"popupBlockedWarning": "Veuillez autoriser les pop-ups pour exporter le PDF", "generatingNotify": "📄 Génération et impression du plan opératoire PDF initialisées", "docTitle": "Plan Opératoire Chirurgical", "subtitle": "RAPPORT DE PLANIFICATION CHIRURGICALE PRÉ-OPÉRATOIRE", "dateLabel": "Date :", "fileNumberLabel": "Dossier N° :", "patientSection": "👤 Identification du Patient &amp; Diagnostic", "patientLabel": "• Patient :", "yearsOld": "ans", "diagnosisLabel": "• Diagnostic :", "specialtyLabel": "• Spécialité :", "referringSurgeonLabel": "• Chirurgien Référent :", "referringSurgeonFallback": "Dr. Martin", "bioSection": "🩸 Évaluation Biologique Pré-Opératoire &amp; Scores de Risque", "bilirubinLabel": "• Bilirubine :", "inrLabel": "INR :", "creatinineLabel": "Créatinine :", "metricsSection": "📐 Métriques 3D de Résection &amp; Volumétrie (FLR)", "totalOrganVolLabel": "• Volume Total Organe :", "resectedVolPlannedLabel": "• Volume Réséqué Prévu :", "flrLabel": "• Foie Restant Futur (FLR) :", "marginLabel": "• Marge Tumorale Sécurité :", "validationSection": "✍️ Validation, Signatures &amp; Traçabilité Cryptographique WORM", "planStatusLabel": "• Statut du Plan :", "planStatusFallback": "Brouillon", "seniorSignerLabel": "• Signataire Senior :", "notSignedFallback": "Non signé", "clinicalNotesLabel": "• Remarques Cliniques :", "noSpecificNotes": "Aucune note spécifique", "cryptoFingerprintLabel": "Empreinte Cryptographique WORM SHA-256 :", "footerLine1": "⚠️ DOCUMENT DE PLANIFICATION CHIRURGICALE — PROTOTYPE CLINIQUE EXÉCUTÉ SOUS CE MDR 2017/745 CLASS IIB PREPARATION", "footerLine2": "Ce document scellé cryptographiquement doit être versé au Dossier Patient Informatisé (DPI) avant l'acte opératoire."}, "planReview": {"modalTitle": "✍️ Workflow de Revue, Validation & Signature du Plan", "lifecycleLabel": "📋 Cycle de Vie du Plan Opératoire :", "currentStateTitle": "📌 État Actuel du Plan", "patientIdLabel": "• Patient ID :", "planVersionLabel": "• Version du Plan :", "currentStatusLabel": "• Statut Actuel :", "authorLabel": "• Auteur / Créateur :", "authorFallback": "Dr. Martin (Chirurgien)", "seniorSignatureLabel": "• Signature Senior :", "pendingSignature": "En attente...", "workflowActionsTitle": "✍️ Actions du Workflow", "markReviewedBtn": "👀 Marquer comme Relu par les Pairs (Peer-Reviewed)", "validateSignBtn": "✍️ Valider & Signer le Plan (Chirurgien Senior)", "printExportBtn": "📄 Imprimer / Exporter le Plan Opératoire (PDF)", "rejectBtn": "❌ Rejeter le Plan (Demander Corrections)", "notesLabel": "Notes de Relecture / Remarques du Chirurgien Senior", "notesPlaceholder": "Ajouter des observations cliniques ou exigences de modification...", "historyLabel": "Historique des Signatures & Horodatage Cryptographique WORM :", "historyInitEntry": "[DRAFT] 2026-08-05T16:00:00Z — Plan v1.0 initialisé par l'équipe de chirurgie.", "closeBtn": "Fermer", "draftStatus": "Brouillon", "reviewedStatus": "Relu (Reviewed)", "validatedSignedStatus": "Validé & Signé", "rejectedStatus": "Rejeté", "notesFallbackReviewed": "Plan relu par le chirurgien assistant.", "notesFallbackValidated": "Plan chirurgical validé et signé par le chirurgien senior.", "notesFallbackRejected": "Motif non précisé", "signerSignedText": "Pr. Dupont (Chirurgien Senior) - Signé ✍️", "reviewedNotify": "👀 Plan chirurgical marqué comme Relu par les pairs", "validatedNotify": "✍️ Plan chirurgical validé & signé avec empreinte cryptographique SHA-256", "rejectedNotify": "❌ Plan chirurgical rejeté — Corrections demandées: {notes}", "historyReviewed": "[REVIEWED] {ts} — Relu par les pairs: {notes}", "historyValidated": "[VALIDATED] {ts} — Signé par Pr. Dupont (SHA-256 scellé)", "historyRejected": "[REJECTED] {ts} — Rejeté: {notes}", "peerReviewStage": "Relecture par les pairs", "finalValidationStage": "Validation finale & Signature", "modificationNoteStart": "Toute modification d'un plan validé crée automatiquement une nouvelle version", "modificationNoteEnd": "scellée par hash SHA-256."}}, "clinical": {"resectionNoTumor": "Aucun segment tumoral tracé", "resectionRightHep": "🔴 Hépatectomie Droite Standard (S5-S6-S7-S8)", "resectionLeftHep": "🔴 Hépatectomie Gauche Standard (S2-S3-S4)", "resectionBisegRight": "🟠 Bisegmentectomie Latérale Droite (S6-S7)", "resectionLobLeft": "🟡 Lobectomie Gauche / Bisegmentectomie S2-S3", "resectionTargeted": "🟢 Segmentectomie Anatomique Ciblée ({segments})", "marginNoTumor": "Pas de tumeur", "marginR1": "❌ MARGE R1 (< 1 mm) - Risque de récidive", "marginNarrowR0": "⚠️ MARGE ÉTROITE R0 (1-5 mm)", "marginSafeR0": "✅ MARGE SÉCURISÉE R0 (> 5 mm)", "ischemiaCritical": "❌ ISCHÉMIE CRITIQUE — FLR fonctionnel insuffisant (< 30%)", "ischemiaWarning": "⚠️ ATTENTION — FLR fonctionnel limite sur foie cirrhotique", "perfusionPreserved": "✅ PERFUSION / DRAINAGE PRÉSERVÉS", "marginNotCalculated": "Non calculé", "ischemiaNormal": "Normal", "noTumorDetected": "Aucune tumeur détectée"}, "exploratoryLab": {"modalTitle": "🔬 Exploratory Lab (M21-M40)", "warning": "⚠️ Ces modules sont hautement spéculatifs et n'ont pas de validation clinique. Ils sont réservés à la recherche avancée.", "surgAi": "🧠 SurgAI", "surgSim": "⚡ SurgSim", "aiOr": "🏥 Bloc IA", "gpsNav": "🛰️ GPS Nav", "voiceAssistant": "🎙️ Assistant Vocal", "genAiComplications": "🧬 GenAI Complications", "telesurgery": "🛰️ Téléchirurgie PQC & Bio-4D", "bciInterface": "🧠 Interface BCI & Cortex", "nanoroboticSwarm": "🔬 Essaim Nanorobotique", "l5Autonomy": "🤖⚡ Autonomie L5 & Laser", "reprogramming": "🧬✨ Reprogrammation & Sonogénétique", "ramanSpectrometry": "⚡🔬 Spectrométrie Raman & Plasma", "cryoIre": "❄️☢️ Cryo-IRE & BNCT Neutrons", "organoids": "🧬🌱 Organoïdes 4D", "iknife": "🔬💨 iKnife REIMS & Ac-225"}, "nextgen": {"surgai": {"title": "🧠 SurgAI-Decision — IA Décisionnelle &amp; Explicabilité (SHAP / Grad-CAM 3D)", "mdrLabel": "⚠️ Exigence MDR / FDA (Zero-Black-Box) :", "mdrText": "Chaque proposition chirurgicale est justifiée par les poids de Shapley (SHAP) et localisée par attention Grad-CAM 3D sur le Jumeau Numérique.", "strategyLabel": "Sélectionner une stratégie chirurgicale modélisée par l'IA", "optA": "Option A : Hépatectomie Droite Cœlioscopique (Recommandée — Succès prédit : 94.2%)", "optB": "Option B : Segmentectomie VII-VIII Paremchymateuse (Succès prédit : 88.5%)", "optC": "Option C : Thermo-ablation Radiofréquence Trans-hépatique (Succès prédit : 76.0%)", "prognosisTitle": "📊 Analyse Pronostique &amp; Risques", "durationLabel": "• Durée opératoire estimée :", "eblLabel": "• Perte sanguine estimée (EBL) :", "riskLabel": "• Score de risque morbi-mortalité :", "riskLow": "(Faible)", "adjustMarginLabel": "Ajuster marge de sécurité (", "adjustMarginSuffix": " mm) :", "marginUpdateNotify": "Calcul SHAP mis à jour pour marge {value} mm", "gradcamTitle": "🔥 Attention Grad-CAM 3D", "shapRecommendation": "💡 Recommandation SHAP : Dissection première du pédicule glissonnien droit pour réduire le risque d'hémorragie par 18%.", "approveBtn": "🚀 Approuver ce plan &amp; Exporter DICOM-SR", "approveNotify": "Plan approuvé et exporté en DICOM-SR vers le PACS Orthanc !", "criticalZonePrefix": "Zone critique détectée :", "vesselMshv": "Veine Sus-Hépatique Moyenne (VSHM)", "criticalZoneSuffix": "à 1.8 mm du plan de coupe projectif."}, "surgsim": {"title": "⚡ SurgSim-PhysX — Simulation Rhéologique &amp; Clampage (WASM/WebGPU)", "engineLabel": "⚡ Moteur Physique des Milieux Continus :", "engineText": "Calcule en temps réel ($< 100\\text{ ms}$) sur WebGPU les déformations hyperélastiques et l'ischémie en cas de ligature vasculaire virtuelle.", "rheologyTitle": "🧪 Rhéologie &amp; Biophysique Tissulaire", "youngLabel": "Module de Young E (", "youngSuffix": " kPa - Foie normal) :", "youngNotify": "Module d'élasticité tissulaire E recalibré à {value} kPa", "poissonLabel": "Coefficient de Poisson ν (", "poissonSuffix": " - Quasi-incompressible) :", "clampSimTitle": "🩸 Simulateur de Clampage &amp; Ischémie", "clampRightHepatic": "🔴 Clamper Artère Hépatique Droite", "clampPortalBranch": "🔵 Clamper Veine Porte Branche Droite", "clampPedicle": "🟡 Clamper Pédicule VI-VII", "vesselRightHepatic": "Artère Hépatique Droite", "vesselPortalBranch": "Veine Porte Branche Droite", "vesselPedicle": "Pédicule Glissonnien Segment VI-VII", "statusSecured": "SÉCURISÉ ✅", "statusOptimal": "OPTIMAL ⭐", "flrResultLabel": "Résultat Volumétrique Instantané (FLR) :"}, "surgor": {"title": "🏥 SurgOR-AI — Bloc Opératoire Intelligent &amp; Orchestration MILP", "milpLabel": "🤖 Solveur MILP Temps Réel :", "milpText": "Réduit les temps morts (Turnover Time) de 18% par réordonnancement dynamique.", "reoptimizeBtn": "⚡ Réoptimiser Planning", "reoptimizeNotify": "⚡ Planning du bloc réoptimisé par IA ! Gain calculé : +22 minutes", "roomsStatusTitle": "📍 Statut des Salles d'Opération (Temps Réel HL7 / IoT)", "thRoom": "Salle", "thSpecialty": "Spécialité", "thStatus": "Statut / Étape", "thTracking": "Tracking Matériel RFID", "room1": "Salle 1", "room2": "Salle 2", "room3": "Salle 3", "specNeuro": "Neurochirurgie", "specHbpCurrent": "HBP (Patient actuel)", "specTrauma": "Traumatologie", "statusMeningioma": "🟢 Exérèse méningiome en cours (T+110m)", "statusSterileSetup": "🟢 Installation stérile — Incision dans 12m", "statusEmergency": "🟡 Urgence intercalée (Polytraumatisé)", "trackMicroscope": "Microscope Zeiss KINEVO connecté", "trackHepBox": "Boîte Hépatectomie #4 RFID UHF ✅", "trackAmplifier": "Amplificateur de brillance 3D en salle", "hemoMonitorTitle": "📈 Moniteur Hémodynamique Peropératoire Anesthésie (IEEE 11073 / HL7 v2.x)", "bisOptimal": "BIS 44 — Anesthésie Optimale ✅", "mapLabel": "Pression Artérielle (PAM)", "hrLabel": "Fréquence Cardiaque", "spo2Label": "SpO₂ / EtCO₂", "ischemiaToleranceLabel": "Tolérance Ischémie", "alertText": "ℹ️ Stabilité hémodynamique indexée à 98.4%. Prêt pour clampage vasculaire ou résection parenchymateuse.", "pringleBtn": "🔴 Simulation Clampage Pringle (18 min)", "renalBtn": "🟠 Simulation Clampage Rénal (22 min)", "amiBtn": "🟡 Simulation Clampage AMI (35 min)"}, "surgnav": {"title": "🛰️ SurgNav-GPS — Navigation Chirurgicale &amp; Recalage Élastique", "regLabel": "🛰️ Recalage Élastique Non-Rigide (60-100 Hz) :", "regText": "Compensant dynamiquement la respiration et l'écrasement tissulaire avec une précision sub-millimétrique.", "precisionTitle": "🎯 Précision &amp; Capteurs Actifs", "rmsLabel": "• Erreur quadratique moyenne (RMS) :", "rmsValue": "0.38 mm (Optimal 🎯)", "refSensorLabel": "• Capteur de référence :", "endoTrackingLabel": "• Tracking endo-cavitaire :", "latencyLabel": "• Latence Motion-to-Photon :", "latencyValue": "11.4 ms (< 15 ms OK)", "navModesTitle": "⚙️ Modes de Navigation", "rigidRegBtn": "📍 Lancer Recalage Rigide Initial (ICP)", "rigidRegNotify": "Recalage rigide initial ICP recalibré sur 42 points osseux", "elasticRegBtn": "🌊 Activer Recalage Élastique (Respiration)", "elasticRegNotify": "Recalage Élastique Non-Rigide activé par suivi stéréoscopique !"}, "surgvoice": {"title": "🎙️ SurgVoice-LLM — Assistant Vocal Stérile Mains-Libres", "asrLabel": "🎙️ Reconnaissance Vocale Hors-Ligne :", "asrText": "Modèle Whisper-Medical (WASM GPU) + filtrage actif des bruits du bloc.", "listeningBadge": "🟢 Écoute active", "testTitle": "🗣️ Tester une commande vocale chirurgicale en tenue stérile :", "cmd1Display": "« Surgi, affiche uniquement les veines sus-hépatiques et masque le squelette. »", "cmd1Response": "Système veineux isolé avec succès (couche 4 active).", "recognizedNotify": "🎙️ Commande reconnue (Latence 42ms GPU) :", "cmd2Display": "« Surgi, quelle est la distance entre mon bistouri CUSA et le bord tumoral ? »", "cmd2Response": "La distance actuelle est de 4.2 millimètres.", "cmd3Display": "« Surgi, lance la dictée du compte-rendu opératoire CCAM. »", "cmd3Response": "Mode dictée structurée activé : rubrique Abord Cœlioscopique en cours d'enregistrement.", "ttsLabel": "Réponse vocale de synthèse (TTS) :", "ttsPlaceholder": "Prêt pour vos instructions au bloc opératoire..."}, "webgpuCut": {"title": "✂️ Découpe Virtuelle WebGPU — Résection &amp; Calcul FLR en Temps Réel", "introLabel": "✂️ Simulation de Résection Hépatique :", "introText": "Découpez virtuellement le parenchyme selon un plan de coupe 3D interactif avec recalcul à 60 Hz du volume hépatique restant (FLR) et des marges oncologiques.", "segmentsLabel": "Sélectionner les segments de Couinaud à révoquer :", "s6": "S6 (Post-Inf)", "s7": "S7 (Post-Sup)", "s5": "S5 (Ant-Inf)", "s8": "S8 (Ant-Sup)", "cutPlaneTitle": "📐 Paramètres du Plan de Coupe", "axialAngleLabel": "• Angle axial :", "offsetLabel": "• Position (offset) :", "marginLabel": "• Marge oncologique calculée :", "marginPlaceholder": "— (calculez d'abord)", "voxelSourceLabel": "Volume procédural 64³", "hintText": "ℹ️ Si un ou plusieurs segments de Couinaud sont cochés ci-dessus, ils priment sur le plan libre pour le calcul de résection (segmentectomie anatomique). Sinon, le plan libre (angle/offset) est utilisé.", "flrAnalysisTitle": "📊 Analyse Volumétrique FLR (Calculée)", "totalVolLabel": "• Vol. Total Organe :", "resectedVolLabel": "• Vol. Résection :", "remnantVolLabel": "• Vol. Restant (FLR) :", "safetyPending": "⏳ Calculez d'abord...", "segmentsCountedLabel": "Segments comptabilisés dans FLR :", "includeManualLabel": "Inclure les segments manuels", "comparatorTitle": "⚖️ Comparateur de Stratégies", "saveAsABtn": "📥 Sauvegarder comme Stratégie A", "saveAsBBtn": "📥 Sauvegarder comme Stratégie B", "thCriteria": "Critères", "thStrategyA": "Stratégie A", "thStrategyB": "Stratégie B", "noStrategySaved": "Sauvegardez au moins une stratégie pour comparer.", "recalcBtn": "🔄 Recalculer FLR", "recalcNotify": "FLR recalculé sur le volume courant", "applyBtn": "✂️ Appliquer Découpe Virtuelle sur Jumeau"}, "raymarching": {"title": "🌟 Ray-Marching DVR — maquette d'interface, non implémenté", "mockupLabel": "⚠️ Maquette d'interface :", "mockupText": "aucun rendu par lancer de rayons volumétrique n'est réellement implémenté dans ce prototype (Three.js r128 / WebGL classique). Les boutons ci-dessous affichent une notification mais ne modifient pas le rendu 3D.", "transferFnTitle": "🎛️ Fonctions de Transfert (Fenêtrage CT) — maquette", "presetParenchyma": "🟢 Parenchyme Hépatique (40 HU / 150 HU)", "presetVessels": "🔴 Arbre Vasculaire &amp; Pédicules (+120 HU)", "presetTumors": "🟡 Lesions &amp; Tumeurs Hypervasculaires", "presetBones": "⚪ Structures Osseuses (+400 HU)", "specsTitle": "⚡ Spécifications visées (non mesurées)", "specsIntro": "Ce que viserait une implémentation réelle, à titre indicatif — aucune de ces valeurs n'est produite par du code fonctionnel dans ce prototype :", "specEngine": "• Engine d'exécution : WGSL Compute Shaders (non implémenté)", "specSampling": "• Taux d'échantillonnage visé : 512 pas de rayon / pixel", "specLighting": "• Illumination globale : Monte-Carlo AO (non implémenté)"}, "sihInterop": {"title": "🏥 Interopérabilité SIH (HL7 v2 & FHIR R4/R5)", "connectionLabel": "🏥 Connexion Système d'Information Hospitalier (SIH) :", "connectionText": "Échange birectionnel avec le DPI/PACS via les standards internationaux HL7 v2 (MLLP) et FHIR R4/R5 (REST JSON).", "fhirApiTitle": "🔥 FHIR R4/R5 REST API", "fhirResourceLabel": "Ressource FHIR à exporter", "optPatient": "Patient (Identité & Antécédents)", "optImagingStudy": "ImagingStudy (Séries DICOM & PACS)", "optDiagnosticReport": "DiagnosticReport (Volumétrie 3D & Segments)", "optProcedure": "Procedure (Planification Chirurgicale FHIR R5)", "exportFhirBtn": "🌐 Exporter la ressource FHIR (JSON)", "fhirPreviewLabel": "Aperçu de la ressource FHIR :", "fhirPlaceholderStatus": "Sélectionnez une ressource et cliquez sur Exporter", "hl7SenderTitle": "📡 Émetteur HL7 v2 MLLP (Port 2575)", "hl7EventTypeLabel": "Type d'Événement HL7", "optAdtA08": "ADT^A08 — Mise à jour dossier patient", "optOrmO01": "ORM^O01 — Demande d'intervention chirurgicale", "optOruR01": "ORU^R01 — Compte-rendu opératoire / 3D", "mllpHostLabel": "Hôte MLLP", "mllpPortLabel": "Port", "sendMllpBtn": "📡 Émettre Trame MLLP (<VT>HL7<FS><CR>)", "hl7FrameLabel": "Trame HL7 v2 émise & Accusé (ACK) :", "hl7Pending": "En attente d'émission d'une trame HL7 v2 MLLP..."}, "webxr": {"title": "🥽 WebXR Spatial Computing — Apple Vision Pro & Meta Quest 3", "streamLabel": "🥽 Streaming Stéréoscopique 120 Hz :", "streamText": "Jumeau Numérique holographique en mode AR Pass-Through à très basse latence (< 9 ms Motion-to-Photon) pour chirurgie guidée.", "lidarBadge": "LiDAR + Eye-Tracking 👁️", "telemetryTitle": "📡 Télémétrie & Calibration Spatiale", "deviceLabel": "• Casque connecté :", "deviceValue": "Apple Vision Pro (visionOS 2.0)", "trackingLabel": "• Tracking spatial :", "trackingValue": "NDI Polaris + ARKit Markerless", "rmsLabel": "• Erreur d'alignement RMS :", "rmsValue": "0.35 mm (Sub-mm 🎯)", "fovealLabel": "• Rendu fovéal :", "fovealValue": "Eye-Tracking Pro Dynamique ✅", "recalibrateBtn": "📍 Re-calibrer Alignement Patient (42 points)", "gestureTitle": "🖐 Simulation Gestuelle Mains-Libres (26 DOF)", "pinchBtn": "🤏 Tester Pincement (Pinch) : Rotation 3D", "pinchLabel": "Pinch 2 Doigts", "pinchResult": "🔄 Rotation stéréoscopique fluide de l'organe à 360°", "raycastBtn": "👆 Tester Raycast Index : Découpe CUSA", "raycastLabel": "Index Raycast", "raycastResult": "✂️ Incision ultrasonique CUSA guidée par pointeur virtuel", "grabBtn": "✊ Tester Saisie (Grab) : Écartement PBD", "grabLabel": "Grab & Hold", "grabResult": "🖐 Écartement atraumatique des bords du parenchyme", "gesturePending": "En attente de détection gestuelle par les caméras infrarouges...", "launchBtn": "🚀 Lancer Navigation Immersive", "launchNotify": "🥽 Mode Immersif WebXR stéréoscopique activé dans le casque Vision Pro !"}, "robotic": {"title": "🤖 Console Robotique RAS — Intuitive Da Vinci 5 & Medtronic Hugo", "teleopLabel": "🤖 Télé-opération Haptique (1000 Hz) :", "teleopText": "Télémétrie 7-DOF cinématique et calcul de résistance en Newtons en direct sur le Jumeau Numérique PBD.", "fiberBadge": "Fibre Optique Latence 0.8 ms ⚡", "armsTitle": "🦾 Télémétrie des 4 Bras Robotiques", "thArm": "Bras", "thInstrument": "Instrument (RFID)", "thForce": "Force", "thStatus": "Statut", "arm1": "Bras 1 (Droit)", "arm2": "Bras 2 (Gauche)", "arm3": "Bras 3 (Caméra)", "arm4": "Bras 4 (Aux)", "statusActive": "🟢 Actif", "statusFixed": "🔵 Fixe", "statusHolding": "🟡 Maintien", "recalibrateBtn": "⚙️ Recalibrer Zéro Cinématique (7-DOF)", "recalibrateNotify": "🔄 Calibrage cinématique Denavit-Hartenberg effectué et scellé (SHA-256)", "hapticTitle": "⚡ Simulation Retour Haptique & Sécurité", "lightGraspBtn": "🟢 Simuler Préhension Légère (1.4 N)", "lightGraspLabel": "Préhension Légère", "lightGraspResult": "🟢 Résistance normale — Parenchyme hépatique intact.", "moderateTractionBtn": "🟡 Simuler Traction Modérée (3.2 N)", "moderateTractionLabel": "Traction Modérée", "moderateTractionResult": "🟡 Résistance élevée — Tension élastique maximale atteinte.", "criticalOverloadBtn": "🔴 Simuler Surcharge Critique (4.8 N - Interlock)", "criticalOverloadLabel": "Surcharge Critique", "criticalOverloadResult": "🛑 ALERTE DÉCHIRURE ! Seuil 4.5 N dépassé. Verrouillage Interlock déclenché !", "hapticPending": "Système haptique armé en attente de sollicitation tissulaire...", "activateBtn": "🚀 Activer Télé-Opération Console", "activateNotify": "🤖 Console Da Vinci 5 couplée en temps réel au Jumeau Numérique PBD !", "hapticFeedbackLabel": "🤖 RETOUR HAPTIQUE", "forceMeasuredLabel": "⚡ Force mesurée :", "fiberLoopActive": "— Boucle 1000 Hz fibre optique active.", "safetyAlertNotify": "🛑 ALERTE SÉCURITÉ ROBOTIQUE : Force {force} N > Seuil 4.5 N ! Verrouillage d'urgence activé et scellé (SHA-256)", "hapticProcessedNotify": "🦾 Simulation haptique traitée : {action} ({force} N) — Tissu stable"}, "genai": {"title": "🧬 GenAI Complications Predictor & Micro-Chirurgie Robotique (50:1)", "transformerLabel": "🧬 Spatio-Temporal Video Transformer (70B) :", "transformerText": "Prédiction vidéo à horizon de 15 sec des risques peropératoires (ruptures vasculaires, fuites biliaires) et filtrage du tremblement micro-robotique (< 5 µm).", "videosBadge": "52 400 Vidéos OR • Echelle 50:1 🎯", "microsurgeryTitle": "🔬 Micro-Chirurgie Robotique (Symani / Zeiss)", "consoleLabel": "• Console micro-robotique :", "consoleValue": "Symani Surgical System (MMI)", "kinematicLabel": "• Démultiplication cinématique :", "kinematicValue": "50:1 (10 mm → 0.2 mm)", "tremorLabel": "• Filtrage tremblement RMS :", "tremorValue": "< 3.2 µm (Sub-micron ✨)", "opticsLabel": "• Optique stéréoscopique :", "opticsValue": "Zeiss KINEVO 40x 3D 4K", "calibrateBtn": "⚖️ Calibrer Échelle Mouvement Microvasculaire (50:1)", "calibrateNotify": "✨ Démultiplication micro-robotique 50:1 calibrée et scellée dans audit_logs (SHA-256)", "predictTitle": "🔮 Simuler Prédiction GenAI peropératoire", "neuroBtn": "🧠 Simuler Neuro : Rupture Anévrisme Willis (84%)", "neuroEvent": "💥 Rupture Anévrisme Willis", "neuroResult": "🛑 ALERTE CRITIQUE (84%) : Tension pariétale excessive ! Action IA : Clamper clip carotide proximal.", "hbpBtn": "🫀 Simuler Foie : Brèche Biliaire Canal Droit (88%)", "hbpEvent": "🌊 Brèche Biliaire Canal Droit", "hbpResult": "🔴 ALERTE FUITE BILIAIRE (88%) : Transection trop proche du hile ! Action IA : Visualiser ICG AR WebXR.", "ophthBtn": "👁️ Simuler Rétine : Anastomose Stable (12%)", "ophthEvent": "👁️ Anastomose Rétinienne", "ophthResult": "🟢 TRAJECTOIRE SÉCURISÉE (12%) : Tremblement filtré à 3.2 µm — Anastomose stable.", "predictPending": "Modèle GenAI Transformer armé — Surveillance du flux vidéo OR et FEM en cours...", "activateBtn": "🚀 Activer Surveillance GenAI & Micro-Chirurgie", "activateNotify": "🧬 Modèle GenAI Spatio-Temporal et Micro-Robotique activés en direct sur le Jumeau !", "predictionLabel": "🧬 PRÉDICTION GENAI", "probabilityLabel": "⚡ Probabilité à 15s :", "transformerFootnote": "— Transformer 70B (52 400 vidéos OR).", "criticalAlertNotify": "🛑 ALERTE COMPLICATION GENAI ({prob}%) : {event} ! Action préventive IA recommandée et scellée dans audit_logs (SHA-256)", "predictionComputedNotify": "🧬 Prédiction GenAI calculée : {event} ({prob}%) — Trajectoire stable"}, "pqcBioprint": {"title": "🛰️ Téléchirurgie PQC (Post-Quantique) & Bio-Impression 4D Peropératoire", "infoLabel": "🛰️ Réseau LEO 6G Quantum & Bio-4D :", "infoText": "Télé-opération intercontinentale inviolable (NIST CRYSTALS-Kyber/Dilithium) et impression in-situ de greffons cellulaires vascularisés à 37°C.", "badge": "Latence 14.2 ms • BioX 6-Axes ✨", "specsTitle": "🔒 Télémétrie Quantique & Liaison Satellite 6G", "spec1Label": "Encapsulation clé :", "spec1Value": "NIST ML-KEM-1024 (Kyber)", "spec2Label": "Signature digitale :", "spec2Value": "NIST ML-DSA-87 (Dilithium)", "spec3Label": "Liaison intercontinentale :", "spec3Value": "Paris ↔ Tokyo (6G LEO Mesh)", "spec4Label": "Latence & Jitter :", "spec4Value": "14.2 ms / ±0.08 ms (Zéro gigue ⚡)", "calibrateBtn": "🔐 Re-négocier Clés Quantiques PQC (60s rotation)", "calibrateNotify": "✨ Session téléchirurgie quantique PQC négociée et scellée (SHA-256 / Dilithium-5)", "actionsTitle": "🧬 Simuler Bio-Impression 4D Peropératoire", "action1Btn": "🫀 Imprimer Patch Foie S6 (42.5 mL / 191s)", "action1Label": "Patch Hépatique S6", "action1Desc": "🟢 G-code calculé : Impression in-situ du parenchyme (Alginate-MSC-VEGF @ 37°C) en 191s.", "action2Btn": "🧠 Imprimer Dure-Mère Crânienne (14 mL / 63s)", "action2Label": "Dure-Mère Crânienne", "action2Desc": "🔵 G-code calculé : Reconstruction dure-mère crânienne stérile étanche au collafilm bioactif en 63s.", "action3Btn": "🦴 Imprimer Greffon Mandibulaire (31.2 mL / 140s)", "action3Label": "Greffon Mandibulaire", "action3Desc": "🟡 G-code calculé : Bio-impression scaffold céramique-PEEK ostéo-inducteur vascularisé en 140s.", "outputPending": "Bras bio-imprimeur 6 axes CELLINK BioX en attente des coordonnées de résection...", "activateBtn": "🚀 Activer Liaison PQC & Bio-Impression 4D", "activateNotify": "🛰️ Téléchirurgie PQC LEO 6G et Bio-imprimeur 4D couplés en direct au Jumeau !", "resultTemplate": "🛰️ <b>BIO-IMPRESSION 4D ({site}) :</b> {desc} <br><strong>⚡ Volume : {vol} mL | {layers}</strong> — Bras 6 axes CELLINK BioX à 37°C.", "calibratedNotify": "🛰️ Bio-impression 4D calibrée sur {site} ({vol} mL) — G-code transmis sur réseau LEO 6G PQC"}, "bciHaptic": {"title": "🧠 Interface Cerveau-Machine (BCI 1024-Ch) & Retour Haptique Cortical Direct (S1)", "infoLabel": "🧠 Contrôle par la Pensée & Tact Cortical :", "infoText": "Décodage SNN sub-milliseconde (< 2.4 ms) du cortex moteur (M1) et micro-stimulation S1 pour ressentir la résistance tissulaire dans le cortex !", "badge": "1024 Canaux • SNN Loihi 2 ⚡", "specsTitle": "⚡ Télémétrie Corticale & Décodage SNN", "spec1Label": "Implant cortical :", "spec1Value": "Neuralink N1-Surg / Precision 1024-Ch", "spec2Label": "Décodeur neuromorphique :", "spec2Value": "Intel Loihi 2 SNN Chip", "spec3Label": "Latence de décodage :", "spec3Value": "2.1 ms (Sub-milliseconde ⚡)", "spec4Label": "Précision intention M1 :", "spec4Value": "99.2% @ 30 kHz sampling", "calibrateBtn": "⚖️ Calibrer Matrice Corticale M1 / S1 (30 kHz)", "calibrateNotify": "✨ Calibrage de la matrice corticale M1/S1 réussi — Précision synaptique 99.2% (SHA-256)", "actionsTitle": "🧠 Simuler Télé-Opération par la Pensée", "action1Btn": "🧠 Clip Anévrisme Willis par la Pensée (2.4 N / 53 µA)", "action1Label": "Clippage Anévrisme Willis", "action1Desc": "🟢 Intention M1 décodée : Clip anévrismal posé — Sensation tactile S1 fluide et réaliste dans le cortex.", "action2Btn": "🫀 Transection Foie par la Pensée (4.2 N / 92 µA)", "action2Label": "Transection Parenchyme Hépatique", "action2Desc": "🟡 Intention M1 décodée : Transection hépatique — Sensation S1 intense (92 µA) indiquant un parenchyme dense.", "action3Btn": "🛑 Simuler Interlock Anti-Fatigue (< 2.1 ms)", "action3Label": "Interlock d'Urgence", "action3Desc": "🛑 ALERTE FATIGUE COGNITIVE (>85%) : Découplage neuronal instantané ! Actionneurs verrouillés et impulsions S1 coupées.", "outputPending": "Décodeur SNN armé en attente des potentiels d'action du cortex moteur...", "activateBtn": "🚀 Activer Liaison BCI & Tact Cortical S1", "activateNotify": "🧠 Interface Cerveau-Machine 1024-Ch et stimulation S1 couplées au Jumeau !", "resultTemplate": "🧠 <b>INTENTION M1 \\ HAPTIQUE S1 ({action}) :</b> {desc} <br><strong>⚡ Force PBD : {force} N | Stimulation S1 : {icms} @ 200 Hz</strong> — Puce SNN Loihi 2 (< 2.1 ms).", "interlockNotify": "🛑 ALERTE INTERLOCK BCI : Indice de fatigue/tension critique ! Découplage neuronal immédiat (SHA-256)", "processedNotify": "🧠 Commande BCI traitée : {action} ({force} N) — Retour haptique S1 {icms} perçu dans le cortex"}, "nanoSwarm": {"title": "🔬 Essaim Nanorobotique (5M Unités) & Oncologie Moléculaire In-Vivo (CRISPR-Cas9)", "infoLabel": "🔬 Navigation Micro-Vasculaire & Hyperthermie AMF :", "infoText": "Guidage magnétique 3D de 5 millions de nanorobots ADN-Origami / Fe3O4 vers les micro-métastases et libération CRISPR-Cas9 à 43.5°C !", "badge": "5 000 000 Unités • SPION Fe3O4 ⚡", "specsTitle": "⚡ Télémétrie Essaim & Gradient Magnétique", "spec1Label": "Unités actives :", "spec1Value": "5 000 000 Nanobots (< 100 nm)", "spec2Label": "Matériau cœur :", "spec2Value": "SPION Fe3O4 Superparamagnétique", "spec3Label": "Bobines table :", "spec3Value": "SurgMag 6-Axis Gradient Array (0.85 T/m)", "spec4Label": "Ciblage antigénique :", "spec4Value": "Anti-EGFR / Anti-VEGF (98.4%)", "calibrateBtn": "🧲 Calibrer Champ de Gradient Magnétique (0.85 T/m)", "calibrateNotify": "✨ Calibration du champ magnétique 0.85 T/m et synchronisation essaim réussie (SHA-256)", "actionsTitle": "🔬 Simuler Intervention Oncolytique In-Vivo", "action1Btn": "🔬 Guider Essaim vers Micro-Métastase Foie S8 (1.2 T/m)", "action1Label": "Guidage Micro-Métastase Hépatique S8", "action1Desc": "🟢 Guidage magnétique 1.2 T/m : 4 985 000 nanorobots convergés sur micro-métastase S8 — Arrimage EGFR confirmé.", "action2Btn": "🧬 Déclencher Libération CRISPR-Cas9 (AMF 43.5°C)", "action2Label": "Libération CRISPR-Cas9 par AMF", "action2Desc": "🟢 Activation AMF 150 kHz (43.5°C) : Libération CRISPR-Cas9 KRAS-G12D en cours — Apoptose tumorale 99.1%, parenchyme sain 100% intact.", "action3Btn": "🛑 Simuler Arrêt & Démagnétisation Urgence", "action3Label": "Arrêt d'Urgence", "action3Desc": "🛑 ALERTE DENSITÉ VASCULAIRE : Démagnétisation instantanée des bobines table ! Essaim dispersé en flux physiologique normal.", "outputPending": "Essaim nanorobotique en circulation micro-vasculaire en attente des vecteurs de guidage...", "activateBtn": "🚀 Activer Guidage Essaim & Oncologie CRISPR", "activateNotify": "🔬 Essaim 5M nanorobots et bobines magnétiques couplés en direct au Jumeau !", "resultTemplate": "🔬 <b>ESSAIM NANOROBOTIQUE ({action}) :</b> {desc} <br><strong>⚡ Télémétrie : {stat} | Gradient : {param} T/m (ou °C)</strong> — Arrimage EGFR 98.4%.", "interlockNotify": "🛑 ALERTE ESSAIM NANOROBOTS : Démagnétisation d'urgence activée ! Essaim dispersé en toute sécurité (SHA-256)", "processedNotify": "🔬 Commande nanorobotic traitée : {action} ({stat}) — Zéro dommage parenchymateux"}, "autoLaser": {"title": "🤖⚡ Chirurgie Robotique Autonome Niveau 5 & Soudure Laser (EPLW 1470 nm)", "infoLabel": "🤖⚡ Autonomie STAR-5 & Soudure Laser :", "infoText": "Modèle Med-VLA RT-2 pilotant la micro-chirurgie à 10 000 FPS OCT avec fusion laser albumine-ICG (Burst > 280 mmHg) !", "badge": "STAR-5 Autonomie • 1470 nm Laser ⚡", "specsTitle": "⚡ Télémétrie IA Autonome & OCT 3D", "spec1Label": "Moteur VLA :", "spec1Value": "Med-PaLM 3 Robotics / RT-2", "spec2Label": "Grade Autonomie :", "spec2Value": "STAR-5 (100% Autonome)", "spec3Label": "Capteur de suivi :", "spec3Value": "SurgOCT Interferometer (10 000 FPS)", "spec4Label": "Vitesse d'exécution :", "spec4Value": "5.2x plus rapide (0 tremblement)", "calibrateBtn": "⚖️ Calibrer Moteur VLA & Tête Laser (1470 nm)", "calibrateNotify": "✨ Calibration du modèle VLA et de la tête laser 1470 nm réussie — Latence 0.78 ms (SHA-256)", "actionsTitle": "🤖 Simuler Exécution L5 & Fusion Laser", "action1Btn": "🤖 Anastomose Artérielle Autonome + Laser (285 mmHg)", "action1Label": "Anastomose Artérielle Autonome", "action1Desc": "🟢 Exécution STAR-5 : Micro-anastomose artère hépatique — Soudure laser 12.5 J/cm² étanche (Burst 285 mmHg).", "action2Btn": "🔥 Soudure Laser Canal Biliaire (14.0 J/cm² / 319 mmHg)", "action2Label": "Soudure Laser Canal Biliaire", "action2Desc": "🟢 Exécution STAR-5 : Soudure laser du canal biliaire — Albumine-ICG polymérisée en 5.6s sans aucune fuite ni agrafe.", "action3Btn": "🛑 Reprise de Contrôle Humaine Instantanée (< 1 ms)", "action3Label": "Reprise de Contrôle Humaine", "action3Desc": "🛑 ALERTE REPRISE DE CONTRÔLE (< 1 ms) : Transfert immédiat des actionneurs au chirurgien via BCI/Voice ! Laser en sécurité.", "outputPending": "Moteur VLA STAR-5 armé en attente de la sélection du geste autonome...", "activateBtn": "🚀 Activer Autonomie L5 & Soudure Laser", "activateNotify": "🤖⚡ Autonomie STAR-5 et soudure laser couplées en direct au Jumeau !", "resultTemplate": "🤖⚡ <b>AUTONOMIE L5 & SOUDURE LASER ({action}) :</b> {desc} <br><strong>⚡ Force / Fluence : {param} J/cm² | Résistance : {stat}</strong> — Moteur VLA RT-2 (< 0.8 ms).", "interlockNotify": "🛑 ALERTE TAKEOVER HUMAIN (< 1 ms) : Contrôle rendu au chirurgien par BCI ! Laser sécurisé (SHA-256)", "processedNotify": "🤖 Exécution autonome L5 réussie : {action} ({stat}) — Fusion tissulaire hermétique garantie"}, "epiSono": {"title": "🧬✨ Reprogrammation Epigénétique In-Vivo & Sonogénétique Profonde (OSKM / FUS 1.2 MHz)", "infoLabel": "🧬✨ Réjuvénation & Sonogénétique :", "infoText": "Libération d'ARNm LNP facteurs de Yamanaka (OSKM) activée par ultrasons focalisés (FUS 1.2 MHz) : -20 ans sur l'horloge épigénétique sans risque tératomateux !", "badge": "OSKM -20 Ans • FUS 1.2 MHz 🌱", "specsTitle": "⚡ Télémétrie Epigénétique & Optogénétique UCNP", "spec1Label": "Facteurs de réjuvénation :", "spec1Value": "ARNm LNP Yamanaka (Oct4, Sox2, Klf4, c-Myc)", "spec2Label": "Régression horloge :", "spec2Value": "-20.4 Ans (0.00% risque tératome)", "spec3Label": "Faisceau FUS :", "spec3Value": "SurgFUS Phased Array (1.2 MHz / 0.85 MPa)", "spec4Label": "Nanoparticules UCNP :", "spec4Value": "Conversion NIR 980 nm → Bleu 470 nm", "calibrateBtn": "🌱 Calibrer Faisceaux FUS (1.2 MHz) & Laser NIR (980 nm)", "calibrateNotify": "✨ Calibration des faisceaux FUS 1.2 MHz et excitation UCNP 980 nm réussie (SHA-256)", "actionsTitle": "🧬 Simuler Réjuvénation & Modulation In-Vivo", "action1Btn": "🌱 Réjuvénation Lobe Hépatique Post-Ischémique (-20 Ans)", "action1Label": "Réjuvénation Hépatique Post-Ischémique", "action1Desc": "🟢 Activation FUS 0.85 MPa : Libération OSKM en zone hépatique S6/S7 — Horloge épigénétique inversée de 20.4 ans. Viabilité cellulaire 90.5%.", "action2Btn": "🌟 Modulation Optogénétique Anti-Fibrose (UCNP 980 nm)", "action2Label": "Modulation Optogénétique Anti-Fibrose", "action2Desc": "🟢 Excitation laser NIR 980 nm → 470 nm par UCNPs : Activation de la collagénase — Clairance de la fibrose à 94.8% sans effraction cutanée.", "action3Btn": "🛑 Simuler Verrouillage de Sécurité Anti-Tératome", "action3Label": "Verrouillage Anti-Tératome", "action3Desc": "🛑 ALERTE INTERLOCK ONCOGÉNIQUE : Arrêt instantané des impulsions FUS ! Sécurité anti-tératome garantie à 100% (SHA-256).", "outputPending": "Transducteur FUS et vecteurs ARNm LNP armés en attente du ciblage tissulaire...", "activateBtn": "🚀 Activer Réjuvénation Epigénétique & Sonogénétique", "activateNotify": "🧬✨ Reprogrammation épigénétique et sonogénétique couplées au Jumeau !", "resultTemplate": "🧬✨ <b>RÉJUVÉNATION & SONOGÉNÉTIQUE ({action}) :</b> {desc} <br><strong>⚡ Pression FUS / Laser NIR : {param} MPa (ou mW/cm²) | Horloge : {stat}</strong> — OSKM ARNm LNP.", "interlockNotify": "🛑 ALERTE INTERLOCK ONCOGÉNIQUE : Verrouillage anti-tératome activé ! Aucune transformation cellulaire (SHA-256)", "processedNotify": "🧬 Commande de réjuvénation épigénétique traitée : {action} ({stat}) — Tissu régénéré"}, "ramanPlasma": {"title": "⚡🔬 Spectrométrie Raman CARS/SERS & Plasma Froid Atmosphérique (CAP / RONS)", "infoLabel": "⚡🔬 Biopsie Optique < 10 ms & Plasma R0 :", "infoText": "Spectrométrie vibratoire Raman CARS/SERS à 1000 Hz et jet de plasma froid atmosphérique pour l'éradication ciblée d'infiltrats par apoptose sans dommage thermique !", "badge": "R0 99.8% • CAP He/Ar 37°C ⚡", "specsTitle": "⚡ Télémétrie Sonde Raman & Pulvérisateur Plasma", "spec1Label": "Biopsie Optique :", "spec1Value": "Sonde fibre optique CARS / SERS @ 1000 Hz", "spec2Label": "Latence & Spécificité :", "spec2Value": "7.4 ms | Spécificité R0/R1 : 99.8%", "spec3Label": "Jet de Plasma Froid :", "spec3Value": "CAP Atmosphérique (He/Ar 98/2% @ 36.8°C)", "spec4Label": "Espèces réactives :", "spec4Value": "RONS (H₂O₂, NO₂⁻, ONOO⁻) — Apoptose 99.99%", "calibrateBtn": "🌱 Calibrer Sonde Raman (1000 Hz) & Jet CAP (12.5 kV)", "calibrateNotify": "✨ Calibration de la sonde Raman 1000 Hz et du générateur plasma 12.5 kV réussie (SHA-256)", "actionsTitle": "🔬 Simuler Biopsie Raman & Éradication Plasma", "action1Btn": "⚡ Biopsie Optique Tranche de Section (Marge R0)", "action1Label": "Biopsie Optique Tranche de Section", "action1Desc": "🟢 Biopsie optique CARS/SERS 1000 Hz en tranche S7 : Aucun pic nucléique aberrant détecté à 1575 cm⁻¹. Marge R0 certifiée.", "action2Btn": "🔬 Éradication Plasma Froid d'Infiltrat R1 (CAP 37°C)", "action2Label": "Éradication Plasma Froid d'Infiltrat R1", "action2Desc": "🟢 Jet plasma froid CAP (12.5 kV / 36.8°C) sur micro-infiltrat : Apoptose sélective induite par RONS sans dommage aux vaisseaux nobles.", "action3Btn": "🛑 Simuler Verrouillage de Sécurité Anti-Arc (0 kV)", "action3Label": "Verrouillage Anti-Arc", "action3Desc": "🛑 ALERTE INTERLOCK IONISATION : Coupure haute tension plasma (0.0 kV) ! Protection anti-arc électrique active (SHA-256).", "outputPending": "Sonde Raman CARS et pulvérisateur de plasma froid prêts pour l'analyse des marges...", "activateBtn": "🚀 Activer Diagnostic Raman & Plasma Froid", "activateNotify": "⚡🔬 Spectrométrie Raman et Plasma Froid couplés au Jumeau !", "resultTemplate": "⚡🔬 <b>SPECTROMÉTRIE RAMAN & PLASMA CAP ({action}) :</b> {desc} <br><strong>⚡ Tension CAP / Fréquence : {param} kV (ou Hz) | Résultat : {stat}</strong> — Apoptose RONS.", "interlockNotify": "🛑 ALERTE INTERLOCK IONISATION : Coupure haute tension (0 kV) ! Arc électrique évité en toute sécurité (SHA-256)", "processedNotify": "⚡ Commande Raman/Plasma traitée : {action} ({stat}) — Zéro résidu tumoral R0 certifié"}, "cryoBnct": {"title": "❄️☢️ Cryo-Électroporation Irréversible (nsPEF) & BNCT Peropératoire Neutrons", "infoLabel": "❄️☢️ Ablation Hilaire non-thermique & Neutrons BNCT :", "infoText": "Électroporation nanoseconde au contact des gros vaisseaux sans thrombose et désintégration alpha sub-cellulaire (5 µm) par capture neutronique sur Bore-10 !", "badge": "nsPEF 30 kV/cm • BNCT ¹⁰B 2.34 MeV ❄️", "specsTitle": "❄️ Télémétrie Générateur nsPEF & Source BNCT", "spec1Label": "Cryo-IRE :", "spec1Value": "nsPEF 300 ns @ 30 kV/cm + Joule-Thomson -20°C", "spec2Label": "Intégrité Vasculaire :", "spec2Value": "100% Matrice collagénique préservée", "spec3Label": "Source Neutrons BNCT :", "spec3Value": "Épithermiques (0.5 eV - 10 keV) @ 1.2x10⁹ n/cm²/s", "spec4Label": "Réaction Nucléaire :", "spec4Value": "¹⁰B + n → ⁴He (α) + ⁷Li (2.34 MeV sur 7 µm)", "calibrateBtn": "🌱 Calibrer Générateur nsPEF & Faisceau BNCT", "calibrateNotify": "✨ Calibration du générateur nsPEF (30 kV/cm) et du faisceau neutrons BNCT réussie (SHA-256)", "actionsTitle": "🔬 Simuler Cryo-IRE & Irradiation BNCT", "action1Btn": "❄️ Ablation nsPEF Hile Hépatique (Sans Thrombose)", "action1Label": "Ablation nsPEF Hile Hépatique", "action1Desc": "🟢 Ablation Cryo-IRE nsPEF (30 kV/cm / -20°C) au contact de la veine porte : Nanoporation létale 99.9% tumorale sans aucune dénaturation du collagène vasculaire.", "action2Btn": "☢️ Irradiation Neutrons BNCT (¹⁰B-BPA Alpha)", "action2Label": "Irradiation Neutrons BNCT", "action2Desc": "🟢 Irradiation BNCT épithermique sur ¹⁰B-BPA accumulé (65 ppm) : Désintégration alpha sub-cellulaire (7 µm). 100% des cellules tumorales infiltrantes éradiquées.", "action3Btn": "🛑 Simuler Verrouillage Dosimétrique Neutrons (0 n/cm²)", "action3Label": "Verrouillage Dosimétrique", "action3Desc": "🛑 ALERTE INTERLOCK DOSIMÉTRIE NEUTRONIQUE : Absorption seuil atteinte ! Coupure instantanée de la source (0.0 n/cm²/s). Protection pare-chocs SHA-256.", "outputPending": "Générateur de cryo-électroporation nsPEF et source neutronique BNCT prêts...", "activateBtn": "🚀 Activer Cryo-IRE & BNCT Peropératoire", "activateNotify": "❄️☢️ Cryo-IRE et BNCT couplés au Jumeau Numérique !", "resultTemplate": "❄️☢️ <b>CRYO-IRE & BNCT NEUTRONS ({action}) :</b> {desc} <br><strong>⚡ Gradient nsPEF / Bore : {param} kV/cm (ou ppm) | Statut : {stat}</strong> — Alpha 2.34 MeV.", "interlockNotify": "🛑 ALERTE INTERLOCK DOSIMÉTRIE : Absorption neutronique seuil ! Coupure immédiate du faisceau (0 n/cm²/s) ! SHA-256", "processedNotify": "❄️ Commande Cryo-IRE/BNCT traitée : {action} ({stat}) — Tissu tumoral éradiqué à 100%"}, "organoid4d": {"title": "🧬🌱 Assemblage d'Organoïdes 4D & Micro-Vasculogenèse 2PP Biomimétique", "infoLabel": "🧬🌱 Reconstruction Organoïde in-situ & Laser 2PP :", "infoText": "Dépôt par lévitation acoustique de 450 000 sphéroïdes autologues et anastomose micro-capillaire par laser femtoseconde en < 90 secondes !", "badge": "Lévitation 40 kHz • Laser 2PP 780 nm 🌱", "specsTitle": "🌱 Télémétrie Lévitation Acoustique & Laser 2PP", "spec1Label": "Injecteur :", "spec1Value": "Lévitation Acoustique (40 kHz) + Piège Optique", "spec2Label": "Sphéroïdes :", "spec2Value": "450 000 organoïdes hépatiques (300 µm) @ 10 µm", "spec3Label": "Laser 2PP :", "spec3Value": "Femtoseconde Ti:Sapphire (780 nm / 100 fs)", "spec4Label": "Anastomose :", "spec4Value": "Réseau capillaire PEG-DA réticulé en 84.5 s", "calibrateBtn": "🌱 Calibrer Lévitation Acoustique & Laser 2PP", "calibrateNotify": "✨ Calibration de la lévitation acoustique (40 kHz) et du laser 2PP femtoseconde réussie (SHA-256)", "actionsTitle": "🔬 Simuler Assemblage & Micro-Vasculogenèse", "action1Btn": "🌱 Dépôt Acoustique d'Organoïdes (Cavité S5/S8)", "action1Label": "Dépôt Acoustique d'Organoïdes", "action1Desc": "🟢 Dépôt acoustique de 450 000 sphéroïdes hépatiques (300 µm) dans la cavité de résection S5/S8 : Assemblage architectural parfait (précision 10 µm).", "action2Btn": "⚡ Micro-Vasculogenèse Laser 2PP (Anastomose)", "action2Label": "Micro-Vasculogenèse Laser 2PP", "action2Desc": "🟢 Photopolymérisation laser 2PP (780 nm / 180 mW) : Création du réseau micro-capillaire et anastomose aux moignons de la veine porte en 84.5s. Perfusion 100% rétablie !", "action3Btn": "🛑 Simuler Verrouillage d'Hypoxie (0 sphéroïde/s)", "action3Label": "Verrouillage d'Hypoxie", "action3Desc": "🛑 ALERTE INTERLOCK HYPOXIE : Baisse de perfusion capillaire locale ! Arrêt instantané du dépôt d'organoïdes (0 sphéroïdes/s). Protection nécrose SHA-256.", "outputPending": "Injecteur par lévitation acoustique et laser 2PP femtoseconde prêts...", "activateBtn": "🚀 Activer Assemblage Organoïdes & Micro-Vaisseaux", "activateNotify": "🧬🌱 Organoïdes 4D et laser 2PP couplés au Jumeau Numérique !", "resultTemplate": "🧬🌱 <b>ORGANOÏDES 4D & LASER 2PP ({action}) :</b> {desc} <br><strong>⚡ Lévitation / Laser 2PP : {param} sphéroïdes (ou mW) | Statut : {stat}</strong> — Précision 10 µm.", "interlockNotify": "🛑 ALERTE INTERLOCK HYPOXIE : Risque nécrotique détecté ! Coupure immédiate de l'injection (0 sphéroïde/s) ! SHA-256", "processedNotify": "🌱 Commande Organoïdes 4D/2PP traitée : {action} ({stat}) — Reconstruction fonctionnelle complète"}, "iknifeAc225": {"title": "🔬💨 DIAGNOSTIC MOLÉCULAIRE AÉROSOL (iKnife REIMS) & THÉRANOSTIQUE ALPHA ACTINIUM-225 (Phase 20 / M39-M40)", "introTitle": "🔬 Aspiration Spectrométrique in-situ (0.8s) & Radioguidage Alpha 28 MeV :", "introBody1": "L'aspiration des aérosols de découpe au scalpel/laser alimente en continu un spectromètre de masse à temps de vol (", "introBody2": "), identifiant le ratio membranaire Phosphatidylcholine (PC) pour garantir une marge R0. En parallèle, la sonde de détection peropératoire cartographie et irradie les micro-clusters occultes (< 250 µm) par émission alpha ciblée d'", "introBody3": ".", "panel1Title": "⚡ Télémétrie Aérosol iKnife (REIMS ToF)", "p1Label1": "Débit d'aspiration :", "p1Value1": "1.5 L/min (Buse stérile)", "p1Label2": "Vitesse d'ionisation :", "p1Value2": "740 ms (Temps de Vol)", "p1Label3": "Pic membranaire ciblé :", "p1Value3": "PC(34:1) m/z 760.6", "p1Label4": "Précision histologique :", "p1Value4": "99.95% (Spécificité R0)", "panel2Title": "☢️ Sonde Théranostique Alpha (Ac-225 / Ga-68)", "p2Label1": "Radionucléide alpha :", "p2Value1": "Actinium-225 (Ac-225)", "p2Label2": "Énergie de cascade :", "p2Value2": "28 MeV (4 particules α)", "p2Label3": "Pénétration tissulaire :", "p2Value3": "80 µm (0 dommage collatéral)", "p2Label4": "Comptage gamma direct :", "p2Value4": "4 850 cps (Seuil 150 µm)", "simTitle": "⚙️ Simulation d'Analyse iKnife en ligne et de Tir Théranostique Actinium-225 :", "btn1Label": "💨 Analyse Aérosol iKnife (Marge R0)", "action1Name": "Analyse Fumée Scalpel (Marge saine)", "action1Desc": "Ratio PC/PI faible (0.21), absence d'invasion tumorale sur la ligne de transection.", "btn2Label": "🛑 Alerte Infiltration iKnife (R1)", "action2Name": "Alerte Infiltration Membranaire", "action2Desc": "Pic prolifératif PC(34:1) m/z 760.6 massif ! Extension chirurgicale requise (+3 mm).", "btn3Label": "☢️ Tir Alpha Ac-225 (8.5 MBq)", "action3Name": "Tir Théranostique Actinium-225", "action3Desc": "Irradiation courte portée (80 µm, 28 MeV) sur le micro-cluster S4/Hilaire. Zéro dommage aux vaisseaux.", "btn4Label": "🛑 Interlock Radio (0 MBq)", "action4Name": "Verrouillage Sécurité Radiologique", "action4Desc": "Coupure immédiate de la ligne d'injection Actinium-225 (0 MBq). Sceau SHA-256.", "outputPendingLabel": "🔬💨 EN ATTENTE D'ASPIRATION AÉROSOL ET DE DÉTECTION GAMMA :", "outputPendingText": "Sélectionnez une commande pour lancer l'ionisation REIMS ou l'irradiation théranostique Actinium-225.", "activateBtn": "🚀 Activer Diagnostic Aérosol & Alpha-Théranostique", "activateNotify": "🔬💨 Diagnostic iKnife et théranostique Actinium-225 synchronisés !", "resultTemplate": "🔬💨 <b>iKNIFE REIMS & AC-225 ({action}) :</b> {desc} <br><strong>⚡ m/z (ou Activité MBq) : {param} | Statut : {stat}</strong> — Spécificité 99.95%.", "interlockNotify": "🛑 ALERTE INTERLOCK RADIOLOGIQUE : Seuil dose alpha atteint ! Coupure immédiate d'injection Actinium-225 (0 MBq) ! SHA-256", "marginAlertNotify": "🛑 ALERTE iKNIFE REIMS : Marge R1 détectée (Pic PC 34:1 m/z 760.6) ! Infiltration membranaire — Extension chirurgicale requise !", "processedNotify": "💨 Diagnostic iKnife / Tir Ac-225 traité : {action} ({stat}) — Marge R0 et micro-clusters sécurisés"}}}, "ar": {"meta": {"locale": "ar", "name": "Arabic", "nativeName": "العربية", "flag": "🇩🇿", "dir": "rtl", "intl": "ar-DZ"}, "hub": {"subtitle": "منصة محاكاة جراحية وبحث مدعومة بالذكاء الاصطناعي", "tagline": "منصة أكاديمية للتجريب العلمي والمحاكاة الجراحية بنهج الصوت أولاً (Voice-First).", "academic": {"title": "أكاديمي", "subtitle": "تعلّم · تدرّب · قيّم"}, "research": {"title": "بحث", "subtitle": "صمّم · جرّب · حلّل"}, "simulation": {"title": "محاكاة", "subtitle": "خطّط · حاكِ · قارن"}, "clinical": {"title": "سريري", "subtitle": "بيئة مقيّدة / منفصلة"}, "disclaimer": "⚠️ لأغراض البحث والتعليم والمحاكاة فقط. غير مخصص للتشخيص أو العلاج السريري."}, "modes": {"common": {"back": "← رجوع", "export": "📥 تصدير", "voiceDictation": "🎙️ إملاء صوتي", "notAvailable": "غير متاح"}, "academic": {"badge": "الوضع الأكاديمي", "heading": "منصة التعلم الجراحي", "subtitle": "حالات افتراضية موثّقة، تقييم مفصّل، ومقارنة مع الاستراتيجية المرجعية.", "libraryTitle": "📚 مكتبة الحالات التعليمية", "startCase": "ابدأ →", "objectivesCount": "{count} {count, plural, one{هدف} other{أهداف}}", "leaderboardTitle": "🏆 التحدي الجراحي — لوحة الصدارة", "noSessions": "لا توجد جلسات بعد. ابدأ حالة للانطلاق.", "tableRank": "#", "tableCase": "الحالة", "tableScore": "النتيجة", "tableTime": "الوقت", "tableDate": "التاريخ", "justifTitle": "✍️ تبرير الاستراتيجية", "justifDesc": "اشرح سبب اختيارك لهذا النهج، والهوامش المعتمدة، والبنى المعرّضة للخطر التي تم تجنبها.", "justifPlaceholder": "أدخل تحليلك السريري هنا (صوتيًا أو كتابيًا)...", "voiceRecordingStarted": "بدأ التسجيل الصوتي...", "submitEvaluate": "إرسال وتقييم →", "justifTooShort": "يرجى تقديم تبرير أكثر تفصيلاً (10 أحرف على الأقل).", "engineNotLoaded": "محرك الوضع الأكاديمي V2 غير محمّل.", "examInProgressTitle": "🎓 الامتحان جارٍ — الحالة {caseId}", "gradeToImprove": "📚 يحتاج إلى تحسين", "gradeExcellent": "🏆 ممتاز", "gradeVeryGood": "🥇 جيد جدًا", "gradeGood": "🥈 جيد", "completionTime": "وقت الإنجاز: {min} د {sec} ث", "objectiveScore3d": "النتيجة الموضوعية (ثلاثي الأبعاد)", "expertJuryScore": "نتيجة الخبير / لجنة التحكيم", "aiSocraticReview": "مراجعة سقراطية بالذكاء الاصطناعي", "aiSocraticExcellent": "ممتازة", "detail6dEngineTitle": "تفاصيل محرك الأبعاد الستة", "backToHubBtn": "العودة إلى المركز", "exportScientificReportBtn": "تصدير التقرير العلمي", "exportingScientificReport": "جارٍ تصدير السجل العلمي (JSON)...", "dimensions": {"anatomy": "التشريح", "planning": "التخطيط", "precision": "الدقة", "safety": "السلامة", "efficiency": "الكفاءة", "decision": "القرار"}}, "research": {"badge": "وضع البحث", "heading": "منصة التجريب العلمي", "subtitle": "صمّم ونفّذ وحلّل الدراسات الجراحية. صدّر مجموعات بياناتك للنشر.", "studiesTitle": "📊 الدراسات المتاحة", "studyLabel": "دراسة {id}", "launchStudy": "ابدأ الدراسة →", "sessionsTitle": "📂 الجلسات المسجّلة", "groupLabel": "المجموعة {group}", "confidencePrompt": "على مقياس من 1 إلى 10، ما مدى ثقتك في الخطة الموضوعة؟", "sessionCompleteTitle": "دراسة {id} — انتهت الجلسة", "metricTime": "⏱ الوقت", "metricClicks": "🖱 النقرات", "metricVoice": "🎙 الأوامر الصوتية", "metricPlanMods": "📝 تعديلات الخطة", "metricErrors": "❌ الأخطاء", "metricConfidence": "💪 الثقة", "hypothesisLabel": "الفرضية:", "exportDataset": "📥 تصدير البيانات (JSON + CSV)", "noSessions": "لا توجد جلسات بعد. ابدأ دراسة لتسجيل البيانات.", "sessionCount": "{count} {count, plural, one{جلسة مسجّلة} other{جلسات مسجّلة}}", "lockRequiredAlert": "🔒 يلزم قفل دراسة البحث\nلا يمكن بدء الدراسة الرسمية «{protocolId}» دون اتصال بخادم العشوائية FastAPI.\nاطلب من الباحث تشغيل خادم uvicorn.", "analyticsSessionSummaryTitle": "📊 ملخص جلسة التحليلات", "assignedGroupLabel": "المجموعة المخصَّصة:", "loggedEventsLabel": "الأحداث المسجَّلة:", "voiceCommandsLabelV2": "الأوامر الصوتية:", "uiErrorsLabel": "أخطاء الواجهة:", "endStudyBtn": "إنهاء الدراسة", "exportDatasetJsonBtn": "تصدير مجموعة البيانات (JSON)"}, "simulation": {"badge": "وضع المحاكاة", "heading": "بيئة المحاكاة الجراحية", "subtitle": "حالات افتراضية، سيناريوهات مقارنة، أوامر صوتية، و3 مستويات ذكاء اصطناعي.", "disclaimer": "⚠️ نتائج محاكاة — غير مخصصة للتوجيه السريري الفعلي.", "libraryTitle": "📚 مكتبة الحالات", "launchCase": "محاكاة →", "aiLevelTitle": "🤖 مستوى الذكاء الاصطناعي", "voiceCommandsTitle": "🎙 الأوامر الصوتية", "reportTitle": "📊 تقرير المحاكاة", "caseFallback": "حالة محاكاة", "reportTime": "⏱ الوقت", "reportVolResected": "✂️ الحجم المستأصل [تقديري]", "reportVolRemnant": "🫀 الحجم المتبقي [تقديري]", "reportDistance": "📏 المسافة الدنيا", "reportUnsafeMargins": "⚠ هوامش غير آمنة", "reportErrors": "❌ الأخطاء", "reportVoiceCmds": "🎙 الأوامر الصوتية", "reportScenarios": "📋 السيناريوهات", "scoreFinal": "النتيجة النهائية", "comparisonDisclaimer": "⚠️ تقدير تحليلي (كرة مكافئة) من بيانات الحالة — ليس حسابًا دقيقًا لشبكة مثلثية، غير سريري، للاستخدام التعليمي فقط.", "reportDisclaimer": "⚠️ الأحجام/المسافات: تقدير تحليلي (كرة مكافئة) من بيانات الحالة — ليس حسابًا دقيقًا لشبكة مثلثية، وغير مخصص لتوجيه إجراء سريري حقيقي.", "exportJson": "📥 تصدير JSON", "needTwoScenariosAlert": "أنشئ سيناريوهين على الأقل (عبر زر + أو التفريع) لمقارنتهما.", "needTwoScenariosNotify": "⚠ أنشئ سيناريوهين على الأقل لمقارنتهما.", "marginPrompt": "هامش الاستئصال المطلوب لهذا السيناريو (مم)؟", "scenarioDefaultName": "السيناريو {letter}", "addScenario": "+ سيناريو", "scenarioCreatedNotify": "✅ تم إنشاء {name} (تفريع من {parent}، هامش {margin} مم).", "scenarioSwitchNotify": "🔄 تم الانتقال إلى {name}.", "scenarioOrigin": "البداية", "comparisonTitle": "⚖️ مقارنة السيناريوهات", "actionsLabel": "الإجراءات", "geometryUnavailable": "⚠️ الهندسة غير متوفرة لهذه الحالة — لم يتم الحساب.", "volResectedLabel": "الحجم المستأصل [تقديري]", "volRemnantLabel": "الحجم المتبقي [تقديري]", "distanceToVessel": "المسافة إلى {vessel}", "criticalVesselFallback": "الوعاء الحرج", "marginDeficit": "❌ الهامش أكبر من المساحة المتاحة (عجز {n} مم)", "preservesTissue": "{name} يحافظ على نسيج أكبر (تقدير تحليلي).", "noActionsRecorded": "لم يتم تسجيل أي إجراء", "caseLoadedLabel": "تم تحميل الحالة", "aiMsgObserver": "👁 ذكاء اصطناعي مراقب — صامت. اعمل بحرية.", "aiMsgAssistant": "🤖 ذكاء اصطناعي مساعد — سأنبّهك إذا كانت إحدى البنى معرّضة للخطر.", "aiMsgAdversary": "⚔️ ذكاء اصطناعي مُنافس — سأقترح استراتيجيتي الخاصة. دافع عن خطتك!", "aiCheckAssistantWarn": "⚠️ [الذكاء الاصطناعي المساعد] بنية وعائية على بعد {dist} مم. هامش غير كافٍ — يُنصح بـ ≥ 8 مم.", "aiCheckAssistantOk": "✅ [الذكاء الاصطناعي المساعد] هامش صحيح: {dist} مم.", "aiCheckAdversary": "⚔️ [الذكاء الاصطناعي المنافس] اقتراح مقاربة خلفية: هامش {dist} مم. الحجم المتبقي +8%. دافع عن اختيارك.", "aiLevelStatus": "ذكاء اصطناعي مستوى {level} — {name}", "aiLevelActivatedNotify": "🤖 تم تفعيل مستوى الذكاء الاصطناعي {level}", "forkLabel": "تفريع من {parent} (هامش {margin} مم)", "marginParenLabel": "(هامش {mm} مم)", "metricsUnavailableV2": "⚠️ لم يتم حساب المقاييس — الهندسة غير متوفرة لهذه الحالة.", "tradeoffScoreLabel": "درجة التوازن:", "volResectedEstColon": "الحجم المستأصل [تقديري]:", "volRemnantEstColon": "الحجم المتبقي [تقديري]:", "criticalVesselFixedColon": "المسافة إلى الوعاء الحرج [ثابتة تشريحيًا]:", "marginExceedsColonDeficit": "❌ الهامش المطلوب أكبر من المساحة المتاحة (عجز {n} مم)", "offlineSuffix": "— دون اتصال"}, "difficulty": {"beginner": "مبتدئ", "intermediate": "متوسط", "advanced": "متقدم", "expert": "خبير"}, "caseType": {"synthetic": "حالة اصطناعية", "ai": "حالة مولّدة بالذكاء الاصطناعي", "real": "حالة حقيقية مجهولة الهوية"}, "organs": {"liver": "الكبد", "pancreas": "البنكرياس", "kidney": "الكلية", "gynecology": "أمراض النساء", "pediatrics": "طب الأطفال"}, "aiLevel": {"observer": {"title": "مراقب", "desc": "صامت"}, "assistant": {"title": "مساعد", "desc": "تنبيهات البنى"}, "adversary": {"title": "منافس", "desc": "استراتيجية مضادة"}}}, "or": {"loadingSchedule": "جارٍ تحميل جدول غرف العمليات والقيود...", "connectionError": "خطأ في الاتصال بخادم الجدولة.", "moveImpossible": "🔴 تعذّر نقل التدخل الجراحي: {reasons}", "warningPrefix": "🟠 تنبيه: {warnings}", "frozenPrompt": "هذا البرنامج مُجمَّد (Frozen). أدخل سبب الطوارئ الإدارية/الطبية لتغيير الغرفة:", "frozenCancelled": "تم إلغاء التعديل: يلزم تبرير تدقيقي لبرنامج مُجمَّد.", "slotMoved": "تم نقل الموعد والتحقق منه وفق القيود", "errorPrefix": "خطأ: {detail}", "constraintViolated": "تم انتهاك قيد", "dropUpdateError": "خطأ أثناء التحديث", "interventionLabel": "التدخل الجراحي: {name}", "roomLabel": "الغرفة:", "scheduleLabel": "التوقيت:", "freezeOfficial": "🔒 تجميد رسمي (Freeze)", "delayRealTime": "⏱ تأخير / الأوقات الفعلية", "programFrozen": "تم تجميد البرنامج الرسمي وتوقيعه (Frozen).", "freezeError": "خطأ أثناء تجميد البرنامج.", "serverError": "خطأ في الخادم", "delayPrompt": "عدد دقائق التأخير أو التقديم الفعلي المراد تسجيله (مثال: 30 لتأخير 30 دقيقة):", "delayRecorded": "تم تسجيل تأخير +{mins} دقيقة. تم تطبيق الإزاحة التلقائية للتدخلات التالية في الغرفة.", "realtimeError": "خطأ في تسجيل البيانات الفعلية.", "calculatingPrep": "جارٍ حساب درجة الجاهزية والتحقق من المعوقات...", "conditionsValidated": "{completed} / {total} شروط مستوفاة ({pct}%)", "criticalBlockers": "🔴 معوقات حرجة (التدخل ممنوع)", "warnings": "🟠 تحذيرات", "sectionImaging": "التصوير ثلاثي الأبعاد", "sectionSurgery": "الجراحة", "sectionAnesthesia": "التخدير", "sectionBiology": "التحاليل البيولوجية", "sectionOrTeam": "غرفة العمليات والفريق", "sectionEquipment": "المعدات", "sectionIcu": "العناية المركزة", "prepLoadError": "خطأ في تحميل بيانات الجاهزية.", "aiAnalyzing": "محرك القيود والمساعد الذكي يحلّل الاحتمالات...", "optimizeError": "خطأ أثناء حساب التحسين.", "optimizeServerError": "خطأ في الخادم أثناء التحسين.", "noMovesRequired": "لا حاجة لأي تغيير في الغرف. الجدول مُحسَّن بالفعل وفق القيود.", "patientLabel": "المريض: {name}", "assignmentLabel": "التخصيص:", "applyingOptimization": "جارٍ تطبيق اقتراح التحسين المختار...", "programUpdated": "تم تحديث البرنامج والتحقق منه وفق القيود!", "applyError": "خطأ أثناء التطبيق.", "whatIfPrompt": "هل تريد محاكاة عدم توفر غرفة؟ أدخل اسم/معرّف الغرفة (مثال: bloc-2 أو Salle 2) أو اتركه فارغًا:", "whatIfLaunching": "جارٍ إطلاق صندوق الرمل الافتراضي «What-If»...", "whatIfError": "خطأ أثناء تشغيل المحاكاة.", "whatIfServerError": "خطأ في خادم المحاكاة", "whatIfResultTitle": "📊 نتيجة المحاكاة الافتراضية (بدون تأثير على البيانات الفعلية)", "whatIfScenario": "السيناريو:", "whatIfImpacted": "التدخلات المتأثرة:", "whatIfReallocations": "إعادة التصنيف الممكنة:", "whatIfDeprogramming": "الإلغاءات المتوقعة:", "whatIfRecommendation": "التوصية:", "loadingDurationStats": "جارٍ تحميل إحصاءات المدة...", "noStatsAvailable": "لا توجد بيانات إحصائية متاحة.", "tableProcedure": "الإجراء", "tableSample": "العيّنة", "tableTheoreticalDuration": "المدة النظرية", "tableRealAverage": "المتوسط الفعلي", "tableMedianP50": "الوسيط P50", "tableP90Predictive": "التنبؤي P90", "tableAiRecommendation": "توصية الذكاء الاصطناعي", "sampleCount": "{count} حالة", "statsLoadError": "تعذّر تحميل الإحصاءات.", "networkError": "خطأ في الشبكة أثناء جلب البيانات.", "loadingAuditTrail": "جارٍ تحميل سجل تدقيق غرفة العمليات...", "noAuditEvents": "لا توجد أحداث تدقيق مسجّلة.", "tableTimestamp": "الطابع الزمني", "tableUser": "المستخدم", "tableAction": "الإجراء", "tableResource": "المورد", "tableLevel": "المستوى", "systemUser": "النظام", "auditLoadError": "تعذّر تحميل سجل التدقيق.", "loadingRegulatoryStatus": "جارٍ تحميل الحالة التنظيمية...", "mdrLoadError": "تعذّر استرجاع حالة MDR.", "mdrClassification": "📋 تصنيف الجهاز الطبي", "mdrEnvironment": "البيئة:", "mdrHdsSecurity": "🔒 الامتثال لمعيار HDS والأمان", "mdr2faMandatory": "المصادقة الثنائية إلزامية في الإنتاج:", "mdrYour2fa": "مصادقتك الثنائية:", "mdrEncryption": "تشفير pgcrypto عند التخزين:", "yes": "🟢 نعم", "no": "🔴 لا", "enabled": "🟢 مفعّل", "inactive": "🟠 غير مفعّل", "operational": "🟢 يعمل", "mdrQualityCi": "🛠️ عزل الجودة و CI/CD", "mdrCiPipeline": "خط CI السريري معزول:", "mdrIsolatedMain": "🟢 معزول (main)", "mdrResearchMode": "وضع البحث نشط:", "mdrResearch": "⚠️ بحث", "mdrProduction": "🟢 إنتاج", "mdrRuffLinter": "Ruff Linter و Mypy:", "mdrActive": "🟢 نشط", "mdrInactive": "🔴 غير نشط", "mdrClinicalData": "📊 بيانات التقييم السريري", "mdrRegisteredPatients": "المرضى المسجَّلون", "mdrValidatedPlans": "الخطط المعتمدة", "mdrAuditEvents": "أحداث التدقيق", "vetTitle": "🐾 1. VetSurg3D", "vetSubtitle": "الجراحة والقياس الحجمي البيطري (كلاب/خيول).", "vetCanine": "كلب", "vetFeline": "قطة", "vetEquine": "حصان", "vetWeightPlaceholder": "الوزن كغم", "vetCalculate": "📐 حساب الحجم البيطري", "vetCalculating": "جارٍ الحساب...", "vetError": "خطأ في الحساب.", "vetOrganVolume": "✅ حجم العضو: {vol} مل<br>النسيج المتبقي: <strong>{pct}%</strong> ({safety})", "vetSafe": "🟢 آمن", "vetSubtotal": "🔴 استئصال جزئي كبير", "eduTitle": "🎓 2. SurgSim-Edu 3D", "eduSubtitle": "محاكاة افتراضية للمستشفيات الجامعية والمقيمين.", "eduBrowseCatalog": "📚 تصفّح كتالوج المستشفى الجامعي", "eduLoading": "جارٍ التحميل...", "eduError": "خطأ في التحميل.", "orKpiTitle": "📊 3. OR-Optimizer KPI", "orKpiSubtitle": "تدقيق ربحية ولوجستيات غرفة العمليات.", "orKpiAudit": "📈 تدقيق ربحية غرفة العمليات", "orKpiAnalyzing": "جارٍ التحليل...", "orKpiError": "خطأ في مؤشرات الأداء.", "orKpiOccupancy": "معدّل الإشغال: <strong>{pct}%</strong><br>الوفورات المقدَّرة: <strong>{savings} € / شهريًا</strong>", "radiomicsTitle": "🧪 4. SurgData للبحث", "radiomicsSubtitle": "تصدير مجموعات بيانات مجهولة الهوية (RUO).", "radiomicsExport": "🔬 تصدير مجموعة بيانات الذكاء الاصطناعي ثلاثي الأبعاد", "radiomicsExporting": "جارٍ التصدير...", "radiomicsPatientRequired": "يلزم اختيار مريض.", "radiomicsServerUnavailable": "الخادم غير متاح.", "radiomicsExported": "✅ تم تصدير مجموعة البيانات!<br>المعرّف المستعار: <code>{id}</code><br>وحدات فوكسل ثلاثية الأبعاد محلَّلة: {count}"}, "common": {"close": "إغلاق", "cancel": "إلغاء", "save": "حفظ", "apply": "تطبيق", "export": "تصدير", "import": "استيراد", "edit": "تعديل", "delete": "حذف", "loading": "جارٍ التحميل…", "search": "بحث…", "yes": "نعم", "no": "لا", "warning": "تنبيه", "error": "خطأ", "success": "تم بنجاح", "info": "معلومة", "notImplemented": "غير مُنفَّذ في هذا النموذج الأولي", "notCalculated": "لم يُحسب بعد", "none": "لا شيء", "unknown": "غير معروف"}, "nav": {"plan": "المخطط", "dicom": "DICOM", "twin": "التوأم الرقمي", "ar": "الواقع المعزز", "audit": "سجل التدقيق", "surgai": "المساعد الجراحي الذكي", "surgsim": "المحاكاة الجراحية", "surgor": "ذكاء غرفة العمليات", "surgnav": "الملاحة الجراحية", "surgvoice": "المساعد الصوتي", "mdrFda": "المطابقة التنظيمية", "researchToggle": "وضع البحث — يُظهر الوحدات الاستكشافية غير المعتمدة سريريًا (المراحل M21-M40)", "dashToggle": "لوحة تحكم غرفة العمليات", "orToggle": "وضع غرفة العمليات (شاشة مشتركة)", "touchToggle": "وضع اللمس (أهداف مكبّرة)", "readonlyToggle": "وضع القراءة فقط (فريق غرفة العمليات)", "themeToggle": "المظهر", "hubToggle": "تغيير الوحدة / التخصص", "settingsToggle": "الإعدادات التقنية (Gemini، الخادم الخلفي) — لوضع البحث/الصيانة فقط", "patientsToggle": "المرضى", "logout": "تسجيل الخروج", "preanesthesieToggle": "ملف ما قبل التخدير", "icuFollowupToggle": "متابعة الإنعاش / العناية المركزة", "exitOr": "الخروج من وضع غرفة العمليات", "exitDash": "الخروج من لوحة التحكم", "researchBanner": "🔬 وضع البحث مُفعّل — الوحدات المعروضة أعلاه استكشافية (المراحل M21-M40)، غير معتمدة سريريًا، ويجب عدم استخدامها لاتخاذ القرار داخل غرفة العمليات.", "researchModeOnNotify": "🔬 تم تفعيل وضع البحث — الوحدات الاستكشافية والإعدادات التقنية (⚙) مرئية", "researchModeOffNotify": "✅ الوضع السريري — تُعرض فقط الأدوات المعتمدة للاستخدام في غرفة العمليات", "researchModeDeniedNotify": "🔒 وضع البحث غير مشمول في خطتكم ({plan}) — تواصلوا مع مسؤول للترقية."}, "login": {"title": "تسجيل الدخول", "username": "اسم المستخدم", "password": "كلمة المرور", "submit": "تسجيل الدخول", "twofaHint": "رمز مكوّن من 6 أرقام (تطبيق المصادقة) أو رمز استرداد.", "twofaCode": "الرمز", "demoAccountLabel": "💡 حساب تجريبي:", "demoPasswordLabel": "كلمة المرور:"}, "lang": {"selectorLabel": "اللغة", "en": "English", "fr": "Français", "ar": "العربية", "nl": "Nederlands", "changed": "تم تغيير اللغة إلى {language}"}, "sidebar": {"ageSex": "العمر / الجنس", "weightHeight": "الوزن / الطول", "diagnosis": "التشخيص", "orPlanning": "جدول غرفة العمليات", "notScheduledToday": "غير مبرمج اليوم", "urgencyRed": "🔴 عاجل", "urgencyOrange": "🟠 شبه عاجل", "urgencyGreen": "🟢 مبرمج", "switchModule": "تغيير الوحدة", "room": "القاعة {n}", "statusOngoing": "جارٍ", "statusDone": "منتهٍ", "statusPlanned": "مقرَّر"}, "toolbar": {"importDicom": "استيراد DICOM", "realSegmentation": "تجزئة ذكاء اصطناعي حقيقية", "realSegmentationTitle": "يشغّل استدلال تجزئة حقيقي (TotalSegmentator) على الخادم الخلفي ويحمّل النماذج ثلاثية الأبعاد الحقيقية الناتجة", "pacs": "نظام أرشفة الصور (PACS)", "pacsTitle": "البحث عن دراسة في نظام PACS (QIDO-RS) واستيراد سلسلة صور (WADO-RS)", "threshold3d": "عتبة العرض ثلاثي الأبعاد", "voxelsToggle": "إظهار/إخفاء العضو المُجسَّم من DICOM في المشهد ثلاثي الأبعاد", "recenter": "إعادة توسيط", "recenterTitle": "إعادة توسيط الكاميرا على عضو DICOM (المفتاح R)", "reset": "إعادة ضبط", "resetTitle": "إعادة ضبط الدوران والتكبير (مفتاح المسافة)", "spin": "دوران", "spinTitle": "تفعيل/إيقاف الدوران التلقائي"}, "analysis": {"sectionTitle": "قياس الحجم (محسوب من الحجم ثلاثي الأبعاد الحالي)", "organVolume": "حجم العضو", "resectionVolume": "حجم الاستئصال المقدَّر", "remnant": "الجزء الوظيفي المتبقي", "realSegmentationBadge": "🏥 تجزئة حقيقية", "proceduralBadge": "⚠ تقدير إجرائي، غير سريري", "proceduralNote": "تقدير مُستمَد من الحجم المجسّم المعروض، وليس من تجزئة معتمَدة بالذكاء الاصطناعي. استخدم « 🔬 تجزئة ذكاء اصطناعي حقيقية » لحساب مبني على TotalSegmentator.", "riskScoreTitle": "مؤشر الخطورة الجراحية", "riskScoreBadge": "⚠ معادلة داخلية، غير معتمَدة سريريًا", "riskScoreBasedOn": "مبني على {count} مؤشر(ات) خارج النطاق، العمر، والاستعجال — معادلة داخلية، وليست مقياس خطورة معتمدًا (مثل POSSUM أو ASA)", "riskLow": "منخفض", "riskModerate": "متوسط", "riskHigh": "مرتفع", "scenarios": "السيناريوهات التنبؤية", "scenarioOptimistic": "متفائل", "scenarioExpected": "متوقَّع", "scenarioUnfavorable": "غير مواتٍ", "remnantFunctional": "{pct}% جزء وظيفي متبقٍ", "recalculate": "↻ إعادة الحساب", "recalculated": "تمت إعادة حساب التحليل", "exportPlan": "⭳ تصدير المخطط (DICOM SR / JSON)"}, "staging": {"tnmTitle": "🔬 تصنيف TNM", "tField": "T (الورم)", "nField": "N (العقد اللمفاوية)", "mField": "M (النقائل)", "hbpParams": "🏥 معايير الكبد والمرارة والبنكرياس", "bclcField": "تصنيف BCLC", "childPughField": "تصنيف Child-Pugh", "colorectalParams": "🏥 معايير القولون والمستقيم", "crmField": "الهامش الشعاعي المحيطي (CRM)", "thoracicParams": "🫁 المعايير الصدرية", "vemsField": "الحجم الزفيري بالثانية الأولى (قبل الجراحة)", "volumetryTitle": "📊 قياس الحجم", "volumetryRealBadge": "🏥 حقيقي", "volumetryEstimateBadge": "⚠ تقدير", "organVolumeReal": "حجم العضو (تجزئة ذكاء اصطناعي حقيقية)", "organVolumeEstimate": "حجم العضو (الحجم الحالي، تقدير)", "tumorVolume": "حجم الورم المُجزَّأ", "noSegmentation": "(لا توجد تجزئة)", "computeResectability": "🔄 حساب قابلية الاستئصال", "auditLogTitle": "📋 سجل التدقيق ({count} إدخال)", "auditLogEmpty": "لم يُسجَّل أي إجراء.", "resectable": "✅ قابل للاستئصال — الجراحة مُوصى بها", "notResectable": "❌ غير قابل للاستئصال حاليًا — يجب مناقشة بديل", "exportReport": "⭳ تصدير ملخص التصنيف", "reportExported": "تم تصدير تقرير التصنيف (JSON)"}, "dicom": {"importing": "جارٍ قراءة {count} ملف(ات)…", "resampling": "إعادة أخذ العينات: {n}³ فوكسل…", "loaded": "تم تحميل {count} مقطع(مقاطع) DICOM — عجلة الفأرة=تصفح، WW={ww} WL={wl}", "reconstructing": "جارٍ إعادة البناء ثلاثي الأبعاد…", "voxelizing": "جارٍ التجسيم عند عتبة {threshold} وحدة هاونسفيلد…", "realVolumeShown": "✓ تم عرض حجم DICOM الحقيقي ثلاثي الأبعاد — عتبة {threshold} HU، {count} فوكسل ضمن {chunks} كتلة/كتل", "noVolume": "لا يوجد حجم DICOM لعرضه", "noVoxelsAboveThreshold": "لا توجد وحدات فوكسل ≥ {threshold} HU — اخفض العتبة في الشريط 🎚", "hidden": "تم إخفاء وحدات DICOM — تمت استعادة التشريح الإجرائي", "shown": "تم عرض وحدات DICOM الحقيقية", "reconstructionFailed": "فشلت إعادة البناء ثلاثي الأبعاد: {error}"}, "settings": {"title": "الإعدادات", "geminiKey": "مفتاح واجهة برمجة Gemini", "geminiModel": "نموذج Gemini", "geminiModelHint": "يشير gemini-flash-latest دائمًا إلى أحدث إصدار من Flash (يتجنب التوقف). البدائل: {alt1}، {alt2}، أو {alt3} (يُغلق بتاريخ 2026-07-22).", "groqKey": "مفتاح واجهة برمجة Groq (احتياطي)", "backendUrl": "رابط الخادم الخلفي", "surgeonName": "اسم الجرّاح", "localAiTitle": "🔒 ذكاء اصطناعي محلي (بلا اتصال أولاً — صفر شبكة، صفر تسرّب بيانات)", "localAiHint": "إذا تمت التهيئة أدناه، يُجرَّب الذكاء الاصطناعي المحلي دائمًا أولاً، قبل Gemini/Groq/الخادم الخلفي — لا يغادر الطلب أو الرد الجهاز (WebGPU) أو الشبكة المحلية (الخادم) أبدًا.", "localServer": "خادم محلي (Ollama / llama.cpp، واجهة متوافقة مع OpenAI)", "localServerModel": "اسم النموذج على الخادم المحلي", "webgpuModel": "نموذج محلي داخل المتصفح (WebGPU، WebLLM)", "webgpuChecking": "جارٍ التحقق من دعم WebGPU…", "loadModel": "⬇ تحميل النموذج", "unloadModel": "✕ إلغاء التحميل", "webgpuHint": "التحميل الأول: ~1 إلى 5 غيغابايت (يُخزَّن مؤقتًا بواسطة المتصفح عبر IndexedDB — فوري بعد ذلك). يتطلب Chrome/Edge 113+ (حاسوب أو أندرويد حديث)؛ غير متوفر حاليًا على Safari/Firefox. بعد التحميل، لا يُرسَل أي طلب شبكي لتوليد رد.", "offlineCertifiedTitle": "📚 الوضع المعتمد بلا اتصال", "offlineCertifiedHint": "يفرض إجابات محسوبة مسبقًا، حتى لو تم تهيئة مفتاح ذكاء اصطناعي. لا يوجد أي اتصال شبكي بـ Gemini/Groq."}, "patients": {"title": "قاعدة بيانات المرضى", "searchPlaceholder": "البحث عن مريض…", "editCurrent": "✎ تعديل المريض الحالي", "updated": "تم تحديث بيانات المريض (محليًا)", "syncedBackend": "تمت المزامنة مع الخادم الخلفي"}, "preanesthesia": {"title": "🩺 ملف ما قبل التخدير", "forPatient": "مريض الوحدة النشطة", "asaScore": "درجة ASA", "asaUrgence": "حالة إسعافية (U)", "mallampati": "درجة مالامباتي", "intubationDifficile": "توقع صعوبة التنبيب", "jeuneSolide": "الصيام عن الطعام الصلب (ساعة)", "jeuneLiquide": "الصيام عن السوائل الصافية (ساعة)", "antecedents": "السوابق المرضية", "allergies": "الحساسية", "traitement": "العلاج المزمن", "checklist": "قائمة تحقق غرفة العمليات", "anesthesiste": "طبيب التخدير", "conclusion": "الخلاصة / خطة التسيير", "updated": "تم تحديث ملف ما قبل التخدير (محليًا)"}, "icuFollowup": {"title": "🛌 متابعة الإنعاش / العناية المركزة", "forPatient": "مريض الوحدة النشطة", "newEntry": "+ تقييم جديد", "sofaRespiration": "التنفس", "sofaCoagulation": "التخثر", "sofaHepatique": "الكبد", "sofaCardio": "القلب والأوعية الدموية", "sofaNeuro": "الجهاز العصبي", "sofaRenal": "الكلى", "sofaTotal": "مجموع SOFA:", "apache2": "درجة APACHE II (0-71)", "rass": "RASS", "gcsEye": "فتح العينين (1-4)", "gcsVerbal": "الاستجابة اللفظية (1-5)", "gcsMotor": "الاستجابة الحركية (1-6)", "gcsTotal": "مجموع غلاسكو:", "ventilation": "التهوية الميكانيكية", "ventMode": "الوضع", "bilan": "الميزان المائي", "entrees": "المدخلات (مل)", "sorties": "المخرجات (مل)", "bilanNet": "الميزان الصافي:", "notes": "ملاحظات", "auteur": "الكاتب", "add": "+ إضافة التقييم"}, "audit": {"title": "📜 سجل التدقيق", "filterByPatient": "تصفية حسب المريض", "filterByUser": "تصفية حسب المستخدم"}, "ai": {"chatPlaceholder": "اطرح سؤالك…", "briefingTitle": "🤖 ملخص تلقائي بالذكاء الاصطناعي", "briefingProcedure": "يُوصى بإجراء {procedure} لهذا المريض.", "briefingRemnant": "الجزء الوظيفي المتبقي المقدَّر: {pct}% (عتبة الأمان: {threshold}%)", "briefingRisk": "الخطورة الجراحية:", "briefingWatch": "⚠️ للمراقبة: {metrics}", "briefingNoIssue": "✅ لم يُكتشف أي مؤشر خارج النطاق.", "respondInLanguage": "أجب حصريًا باللغة {language}."}, "modals": {"mdrFda": {"title": "🛡️ حالة المطابقة (نموذج أولي، غير معتمد) ومسودة إملاء CCAM", "notCertifiedBanner": "⚠️ نموذج أولي غير معتمد: لم يخضع هذا البرنامج لأي اعتماد CE MDR 2017/745، ولا لأي تقديم FDA 510(k)، ولا لأي تدقيق HIPAA رسمي. تصف المعلومات أدناه الحالة الفعلية للنموذج الأولي، وليست مطابقة تم الحصول عليها.", "regulatoryStateTitle": "📋 الوضع التنظيمي الفعلي", "dictationTitle": "🗣️ مسودة إملاء CCAM (عرض توضيحي)", "dictationHint": "⚠️ مطابقة كلمات مفتاحية على نص محدَّد مسبقًا — وليس محرك تعرّف صوتي أو معالجة لغة طبيعية حقيقي. يجب التحقق منه بالكامل قبل أي استخدام:", "reportPreviewTitle": "📄 مسودة تقرير (عرض توضيحي، وليس وثيقة قانونية):"}, "respCycle": {"title": "🌊 الدورة التنفسية — معادلة حركية مبسّطة، غير معتمَدة سريريًا", "banner": "🌊 معادلة حركية توضيحية: تقريب جيبي لحركة التنفس (14 دورة/دقيقة)، غير معايَرة على هذا المريض، وغير معتمَدة سريريًا — وليست حلاّلاً حقيقيًا بالعناصر المحدودة.", "launchLive": "▶ تشغيل الدورة الحية", "pause": "⏸️ إيقاف مؤقت", "displacementTitle": "📍 الإزاحة التشريحية (معادلة، وقت حقيقي)", "respiratoryPhase": "الطور التنفسي", "craniocaudalShift": "الإزاحة القحفية الذيلية (ΔZ)", "anteroposteriorShift": "الميلان الأمامي الخلفي (ΔY)", "registrationTitle": "🛠️ التسجيل المرن غير الجاسئ — غير مُنفَّذ", "registrationHint": "⚠️ لا يوجد حلّال تسجيل مرن مُنفَّذ في هذا النموذج الأولي (انظر backend/biomechanics_engine.py، النقطة `/elastic-registration`، التي تعيد الآن بصدق \"not_implemented\" بدلاً من مؤشرات ملفَّقة).", "pneumoPressure": "ضغط الاستنشاق الصفاقي (معامل)", "registerButton": "🔄 التسجيل على الرؤية المجسّمة المعزَّزة / الموجات فوق الصوتية (غير مُنفَّذ)"}}, "i18nAdmin": {"title": "🌐 محرّر الترجمات", "hint": "تُحفظ التعديلات محليًا (في المتصفح) كطبقة تجاوز، دون تعديل الملفات المصدرية. صدّر ملف JSON لتطبيقها بشكل دائم.", "keyColumn": "المفتاح", "exportLanguage": "تصدير JSON بلغة {language}", "importLanguage": "استيراد JSON بلغة {language}", "resetOverrides": "إعادة ضبط التعديلات المحلية", "overridesSaved": "تم حفظ تعديلات الترجمة محليًا", "overridesReset": "تم مسح تعديلات الترجمة المحلية", "imported": "تم استيراد ترجمات {language} ({count} مفتاح/مفاتيح)"}, "plan": {"plannedProcedure": "الإجراء المخطط له", "metricsTitle": "مؤشرات {specialty}", "checklistTitle": "قائمة التحقق قبل الجراحة", "exportedViaBackend": "تم إنشاء التصدير عبر الخادم", "exportedLocal": "تم إنشاء تصدير محلي (الخادم غير مُهيَّأ)"}, "workflow": {"patient": "مريضي", "analysis": "تحليل الذكاء الاصطناعي", "simulation": "المحاكاة", "or": "غرفة العمليات"}, "pipeline": {"loadingTitle": "خط معالجة PACS ← الذكاء الاصطناعي ← التوأم ثلاثي الأبعاد قيد التنفيذ...", "realTitle": "تشريح حقيقي — توأم ثلاثي الأبعاد خاص بالمريض", "demoTitle": "وضع العرض التوضيحي — تشريح إجرائي (للتدريب فقط)", "estimateTitle": "تقدير محلي — خادم التجزئة الحقيقية غير متاح (غير سريري)"}, "catalog": {"keyProcedures": "الإجراءات الرئيسية", "planCycleTitle": "دورة اعتماد الخطة", "implantsTitle": "الزرعات والمعدات", "hudModule": "الوحدة", "hudPatient": "المريض", "hudProcedure": "الإجراء", "hudMode": "الوضع", "chatYou": "أنتم", "chatAI": "الذكاء الاصطناعي", "aiGreeting": "مرحبًا، أنا مساعدكم الجراحي في {specialty}. كيف يمكنني مساعدتكم؟"}, "chrome": {"certBanner": "نموذج تجريبي للعرض — للاستخدام التعليمي فقط", "researchBanner": "🔬 وضع البحث مفعّل — الوحدات المعروضة أعلاه استكشافية (المراحل M21-M40)، غير معتمدة سريريًا، ويجب عدم استخدامها لاتخاذ القرار داخل غرفة العمليات.", "exploratoryLab": "🔬 المختبر الاستكشافي", "tabPlan": "الخطة", "tabStaging": "🎯 التصنيف المرحلي", "tabImplants": "الزرعات", "tabAiChat": "محادثة الذكاء الاصطناعي", "tabAnalysis": "التحليل", "progressLabel": "التقدّم:", "finishScore": "إنهاء وتقييم", "quit": "✕ خروج", "clicksLabel": "النقرات:", "voiceLabel": "الأوامر الصوتية:", "planModsLabel": "تعديلات الخطة:", "timerLabel": "الوقت:", "finishSession": "إنهاء الجلسة", "simReportBtn": "تقرير المحاكاة", "validatedPlan": "خطة معتمدة", "approachLabel": "المدخل الجراحي:", "estimatedDurationLabel": "المدة المقدَّرة:", "moduleLoadedHbp": "تم تحميل وحدة {specialty} — خط معالجة كبدي مخصَّص ومعتمد", "moduleLoadedGeneric": "🔬 التخصص {specialty}: وحدة بحثية (تجزئة عامة task=total، بجودة أقل)", "dashShort": "لوحة", "orShort": "العمليات", "orCenterShort": "مركز العمليات", "researchModuleBanner": "🛑 وحدة بحثية — محاكاة نموذج تجريبي غير معتمد، غير مخصصة لاتخاذ قرارات بشأن مرضى حقيقيين"}, "reports": {"flightPlan": {"title": "خطة الرحلة الجراحية", "subtitle": "GeneralSurgPlan3D MIMO — Oncology Suite 2026", "prototypeBadge": "نموذج تجريبي — غير معتمد", "prototypeTitle": "نموذج تجريبي غير معتمد — راجع 🛡️ الامتثال لـ MDR", "dateLabel": "التاريخ:", "patientSection": "👤 بيانات المريض", "nameLabel": "الاسم:", "patientIdLabel": "معرّف المريض / PACS:", "surgeonLabel": "الجراح المسؤول:", "surgeonFallback": "جراح الأورام", "specialtyLabel": "التخصص:", "stagingSection": "🎯 التصنيف المرحلي والقرار", "tnmLabel": "تصنيف TNM:", "bclcLabel": "نتيجة BCLC / Child:", "statusLabel": "الحالة العامة:", "notCalculated": "لم يتم الحساب", "vascularSection": "🟢 رسم الخريطة الوعائية واستئصال القطعة حسب Couinaud (بريسبان 2000)", "tumorSegmentsLabel": "القطعات الورمية المتسللة:", "none": "لا شيء", "resectionLabel": "الإجراء الجراحي الموصى به:", "marginsSection": "🔵 هوامش الأمان ثلاثية الأبعاد (R0/R1)", "distCutLabel": "المسافة بين الورم وخط القطع:", "distVesselLabel": "المسافة بين الورم والأوعية:", "volumetrySection": "🟡 القياس الحجمي ونقص التروية المتني", "flrRawLabel": "حجم الكبد المتبقي المستقبلي التشريحي الخام:", "flrFunctionalLabel": "حجم الكبد المتبقي المستقبلي الوظيفي المُروَّى:", "congestedVolLabel": "الحجم الاحتقاني / النخري:", "hashFootnote": "بصمة التسلسل (تجزئة محلية غير تشفيرية، djb2 — ليست SHA-256، ولا يجوز تقديمها كإثبات قانوني للسلامة):", "printBtn": "🖨️ طباعة / حفظ كـ PDF", "signatureLabel": "التوقيع الإلكتروني:"}, "operativePlan": {"popupBlockedWarning": "يرجى السماح بالنوافذ المنبثقة لتصدير ملف PDF", "generatingNotify": "📄 جارٍ إنشاء وطباعة ملف PDF لخطة العملية...", "docTitle": "خطة العملية الجراحية", "subtitle": "تقرير التخطيط الجراحي قبل العملية", "dateLabel": "التاريخ:", "fileNumberLabel": "رقم الملف:", "patientSection": "👤 بيانات المريض والتشخيص", "patientLabel": "• المريض:", "yearsOld": "سنة", "diagnosisLabel": "• التشخيص:", "specialtyLabel": "• التخصص:", "referringSurgeonLabel": "• الجراح المحيل:", "referringSurgeonFallback": "د. مارتن", "bioSection": "🩸 التقييم البيولوجي قبل العملية ونتائج الخطورة", "bilirubinLabel": "• البيليروبين:", "inrLabel": "INR:", "creatinineLabel": "الكرياتينين:", "metricsSection": "📐 مقاييس الاستئصال ثلاثية الأبعاد والقياس الحجمي (FLR)", "totalOrganVolLabel": "• الحجم الكلي للعضو:", "resectedVolPlannedLabel": "• الحجم المستأصل المخطَّط:", "flrLabel": "• حجم الكبد المتبقي المستقبلي (FLR):", "marginLabel": "• هامش الأمان الورمي:", "validationSection": "✍️ الاعتماد والتوقيعات وإمكانية التتبع التشفيري WORM", "planStatusLabel": "• حالة الخطة:", "planStatusFallback": "مسودة", "seniorSignerLabel": "• الموقِّع الأول:", "notSignedFallback": "غير موقَّع", "clinicalNotesLabel": "• ملاحظات سريرية:", "noSpecificNotes": "لا توجد ملاحظات محدَّدة", "cryptoFingerprintLabel": "بصمة WORM التشفيرية SHA-256:", "footerLine1": "⚠️ وثيقة تخطيط جراحي — نموذج سريري تجريبي مُشغَّل بموجب إعداد MDR 2017/745 الفئة IIB", "footerLine2": "يجب إيداع هذه الوثيقة المختومة تشفيريًا في السجل الطبي الإلكتروني للمريض قبل الإجراء الجراحي."}, "planReview": {"modalTitle": "✍️ سير عمل مراجعة الخطة واعتمادها وتوقيعها", "lifecycleLabel": "📋 دورة حياة الخطة الجراحية:", "currentStateTitle": "📌 الحالة الحالية للخطة", "patientIdLabel": "• معرّف المريض:", "planVersionLabel": "• نسخة الخطة:", "currentStatusLabel": "• الحالة الحالية:", "authorLabel": "• المؤلف / المُنشئ:", "authorFallback": "د. مارتن (جراح)", "seniorSignatureLabel": "• توقيع الطبيب الأول:", "pendingSignature": "بانتظار التوقيع...", "workflowActionsTitle": "✍️ إجراءات سير العمل", "markReviewedBtn": "👀 وضع علامة \"تمت مراجعته من الأقران\"", "validateSignBtn": "✍️ اعتماد وتوقيع الخطة (الجراح الأول)", "printExportBtn": "📄 طباعة / تصدير الخطة الجراحية (PDF)", "rejectBtn": "❌ رفض الخطة (طلب تصحيحات)", "notesLabel": "ملاحظات المراجعة / تعليقات الجراح الأول", "notesPlaceholder": "أضف ملاحظات سريرية أو متطلبات التعديل...", "historyLabel": "سجل التوقيعات والطوابع الزمنية التشفيرية WORM:", "historyInitEntry": "[DRAFT] 2026-08-05T16:00:00Z — تم إنشاء الخطة v1.0 بواسطة فريق الجراحة.", "closeBtn": "إغلاق", "draftStatus": "مسودة", "reviewedStatus": "تمت المراجعة", "validatedSignedStatus": "معتمدة وموقَّعة", "rejectedStatus": "مرفوضة", "notesFallbackReviewed": "تمت مراجعة الخطة من قبل الجراح المساعد.", "notesFallbackValidated": "تم اعتماد الخطة الجراحية وتوقيعها من قبل الجراح الأول.", "notesFallbackRejected": "السبب غير محدَّد", "signerSignedText": "أ.د. دوبون (الجراح الأول) - تم التوقيع ✍️", "reviewedNotify": "👀 تم وضع علامة \"تمت المراجعة من الأقران\" على الخطة الجراحية", "validatedNotify": "✍️ تم اعتماد الخطة الجراحية وتوقيعها ببصمة تشفيرية SHA-256", "rejectedNotify": "❌ تم رفض الخطة الجراحية — تصحيحات مطلوبة: {notes}", "historyReviewed": "[REVIEWED] {ts} — تمت المراجعة من الأقران: {notes}", "historyValidated": "[VALIDATED] {ts} — وقَّع عليها أ.د. دوبون (مختومة SHA-256)", "historyRejected": "[REJECTED] {ts} — مرفوضة: {notes}", "peerReviewStage": "مراجعة الأقران", "finalValidationStage": "الاعتماد النهائي والتوقيع", "modificationNoteStart": "أي تعديل على خطة معتمدة ينشئ تلقائيًا نسخة جديدة", "modificationNoteEnd": "مختومة بتجزئة SHA-256."}}, "clinical": {"resectionNoTumor": "لم يتم رسم أي قطعة ورمية", "resectionRightHep": "🔴 استئصال الكبد الأيمن القياسي (S5-S6-S7-S8)", "resectionLeftHep": "🔴 استئصال الكبد الأيسر القياسي (S2-S3-S4)", "resectionBisegRight": "🟠 استئصال قطعتين وحشيتين يمنى (S6-S7)", "resectionLobLeft": "🟡 استئصال الفص الأيسر / استئصال قطعتين S2-S3", "resectionTargeted": "🟢 استئصال قطعي تشريحي موجَّه ({segments})", "marginNoTumor": "لا يوجد ورم", "marginR1": "❌ هامش R1 (< 1 مم) - خطر الانتكاس", "marginNarrowR0": "⚠️ هامش R0 ضيّق (1-5 مم)", "marginSafeR0": "✅ هامش R0 آمن (> 5 مم)", "ischemiaCritical": "❌ نقص تروية حرج — حجم الكبد المتبقي الوظيفي غير كافٍ (< 30%)", "ischemiaWarning": "⚠️ تنبيه — حجم الكبد المتبقي الوظيفي حدّي على كبد متشمّع", "perfusionPreserved": "✅ التروية / التصريف محفوظان", "marginNotCalculated": "لم يتم الحساب", "ischemiaNormal": "طبيعي", "noTumorDetected": "لم يتم اكتشاف ورم"}, "exploratoryLab": {"modalTitle": "🔬 المختبر الاستكشافي (M21-M40)", "warning": "⚠️ هذه الوحدات استكشافية بدرجة عالية وليس لها اعتماد سريري. وهي مخصصة للبحث المتقدم.", "surgAi": "🧠 SurgAI", "surgSim": "⚡ SurgSim", "aiOr": "🏥 غرفة العمليات الذكية", "gpsNav": "🛰️ ملاحة GPS", "voiceAssistant": "🎙️ المساعد الصوتي", "genAiComplications": "🧬 مضاعفات GenAI", "telesurgery": "🛰️ الجراحة عن بُعد PQC و Bio-4D", "bciInterface": "🧠 واجهة BCI والقشرة الدماغية", "nanoroboticSwarm": "🔬 سرب الروبوتات النانوية", "l5Autonomy": "🤖⚡ استقلالية المستوى L5 والليزر", "reprogramming": "🧬✨ إعادة البرمجة والصوتنة الجينية", "ramanSpectrometry": "⚡🔬 مطيافية رامان والبلازما", "cryoIre": "❄️☢️ التبريد IRE وعلاج BNCT بالنيوترونات", "organoids": "🧬🌱 الأعضاء المصغّرة الرباعية الأبعاد", "iknife": "🔬💨 سكين iKnife REIMS و Ac-225"}, "nextgen": {"surgai": {"title": "🧠 SurgAI-Decision — اتخاذ القرار بالذكاء الاصطناعي وقابلية التفسير (SHAP / Grad-CAM 3D)", "mdrLabel": "⚠️ متطلبات MDR / FDA (بلا صندوق أسود):", "mdrText": "كل اقتراح جراحي مُبرَّر بأوزان شابلي (SHAP) ومُحدَّد الموقع باهتمام Grad-CAM ثلاثي الأبعاد على التوأم الرقمي.", "strategyLabel": "اختر استراتيجية جراحية مُصمَّمة بالذكاء الاصطناعي", "optA": "الخيار أ: استئصال الكبد الأيمن بالمنظار (موصى به — النجاح المتوقع: 94.2%)", "optB": "الخيار ب: استئصال قطعي متني VII-VIII (النجاح المتوقع: 88.5%)", "optC": "الخيار ج: الاستئصال الحراري بالترددات الراديوية عبر الكبد (النجاح المتوقع: 76.0%)", "prognosisTitle": "📊 التحليل الإنذاري والمخاطر", "durationLabel": "• مدة العملية المقدَّرة:", "eblLabel": "• فقدان الدم المقدَّر (EBL):", "riskLabel": "• درجة خطورة الاعتلال والوفاة:", "riskLow": "(منخفضة)", "adjustMarginLabel": "ضبط هامش الأمان (", "adjustMarginSuffix": " مم):", "marginUpdateNotify": "تم تحديث حساب SHAP لهامش {value} مم", "gradcamTitle": "🔥 اهتمام Grad-CAM ثلاثي الأبعاد", "shapRecommendation": "💡 توصية SHAP: تشريح السويقة الغليسونية اليمنى أولاً لتقليل خطر النزيف بنسبة 18%.", "approveBtn": "🚀 اعتماد هذه الخطة وتصدير DICOM-SR", "approveNotify": "تم اعتماد الخطة وتصديرها بصيغة DICOM-SR إلى نظام PACS Orthanc!", "criticalZonePrefix": "تم اكتشاف منطقة حرجة:", "vesselMshv": "الوريد فوق الكبدي الأوسط (MSHV)", "criticalZoneSuffix": "على بعد 1.8 مم من مستوى القطع المتوقع."}, "surgsim": {"title": "⚡ SurgSim-PhysX — محاكاة انسيابية وتشبيك (WASM/WebGPU)", "engineLabel": "⚡ محرك فيزياء الوسط المتصل:", "engineText": "يحسب في الوقت الفعلي ($< 100\\text{ ms}$) على WebGPU التشوهات فوق المرنة ونقص التروية في حالة الربط الوعائي الافتراضي.", "rheologyTitle": "🧪 الانسيابية والفيزياء الحيوية للنسيج", "youngLabel": "معامل يونغ E (", "youngSuffix": " كيلوباسكال - كبد طبيعي):", "youngNotify": "تمت إعادة معايرة معامل مرونة النسيج E إلى {value} كيلوباسكال", "poissonLabel": "نسبة بواسون ν (", "poissonSuffix": " - شبه غير قابلة للانضغاط):", "clampSimTitle": "🩸 محاكي التشبيك ونقص التروية", "clampRightHepatic": "🔴 تشبيك الشريان الكبدي الأيمن", "clampPortalBranch": "🔵 تشبيك فرع الوريد البابي الأيمن", "clampPedicle": "🟡 تشبيك السويقة VI-VII", "vesselRightHepatic": "الشريان الكبدي الأيمن", "vesselPortalBranch": "فرع الوريد البابي الأيمن", "vesselPedicle": "السويقة الغليسونية للقطعة VI-VII", "statusSecured": "آمن ✅", "statusOptimal": "مثالي ⭐", "flrResultLabel": "النتيجة الحجمية الفورية (FLR):"}, "surgor": {"title": "🏥 SurgOR-AI — غرفة عمليات ذكية وتنسيق MILP", "milpLabel": "🤖 محلّل MILP في الوقت الفعلي:", "milpText": "يقلّل أوقات التبديل بنسبة 18% عبر إعادة الجدولة الديناميكية.", "reoptimizeBtn": "⚡ إعادة تحسين الجدول", "reoptimizeNotify": "⚡ تم إعادة تحسين جدول غرفة العمليات بالذكاء الاصطناعي! المكسب المحسوب: +22 دقيقة", "roomsStatusTitle": "📍 حالة غرف العمليات (الوقت الفعلي HL7 / إنترنت الأشياء)", "thRoom": "الغرفة", "thSpecialty": "التخصص", "thStatus": "الحالة / المرحلة", "thTracking": "تتبع المعدات RFID", "room1": "الغرفة 1", "room2": "الغرفة 2", "room3": "الغرفة 3", "specNeuro": "جراحة الأعصاب", "specHbpCurrent": "الكبد والصفراوية والبنكرياس (المريض الحالي)", "specTrauma": "جراحة الرضوح", "statusMeningioma": "🟢 استئصال ورم سحائي جارٍ (T+110د)", "statusSterileSetup": "🟢 تجهيز معقّم — الشق خلال 12د", "statusEmergency": "🟡 حالة طارئة مُدرَجة (مريض متعدد الرضوح)", "trackMicroscope": "مجهر Zeiss KINEVO متصل", "trackHepBox": "صندوق استئصال الكبد #4 RFID UHF ✅", "trackAmplifier": "مكثف الصورة ثلاثي الأبعاد في الغرفة", "hemoMonitorTitle": "📈 مراقب الدورة الدموية أثناء التخدير الجراحي (IEEE 11073 / HL7 v2.x)", "bisOptimal": "BIS 44 — تخدير مثالي ✅", "mapLabel": "متوسط الضغط الشرياني (MAP)", "hrLabel": "معدل ضربات القلب", "spo2Label": "SpO₂ / EtCO₂", "ischemiaToleranceLabel": "تحمّل نقص التروية", "alertText": "ℹ️ مؤشر الاستقرار الدموي الديناميكي 98.4%. جاهز للتشبيك الوعائي أو الاستئصال المتني.", "pringleBtn": "🔴 محاكاة تشبيك برينغل (18 د)", "renalBtn": "🟠 محاكاة التشبيك الكلوي (22 د)", "amiBtn": "🟡 محاكاة تشبيك الشريان المساريقي السفلي (35 د)"}, "surgnav": {"title": "🛰️ SurgNav-GPS — الملاحة الجراحية والمعايرة المرنة", "regLabel": "🛰️ المعايرة المرنة غير الصلبة (60-100 هرتز):", "regText": "تعوّض ديناميكيًا عن التنفس وانضغاط الأنسجة بدقة دون المليمتر.", "precisionTitle": "🎯 الدقة والمستشعرات النشطة", "rmsLabel": "• متوسط الخطأ التربيعي (RMS):", "rmsValue": "0.38 مم (مثالي 🎯)", "refSensorLabel": "• مستشعر مرجعي:", "endoTrackingLabel": "• التتبع داخل التجويف:", "latencyLabel": "• زمن استجابة الحركة إلى الصورة:", "latencyValue": "11.4 مللي ثانية (< 15 مللي ثانية جيد)", "navModesTitle": "⚙️ أوضاع الملاحة", "rigidRegBtn": "📍 بدء المعايرة الصلبة الأولية (ICP)", "rigidRegNotify": "تمت إعادة معايرة المعايرة الصلبة الأولية ICP على 42 نقطة عظمية", "elasticRegBtn": "🌊 تفعيل المعايرة المرنة (التنفس)", "elasticRegNotify": "تم تفعيل المعايرة المرنة غير الصلبة عبر التتبع المجسّم!"}, "surgvoice": {"title": "🎙️ SurgVoice-LLM — مساعد صوتي معقّم بلا استخدام اليدين", "asrLabel": "🎙️ التعرّف الصوتي دون اتصال:", "asrText": "نموذج Whisper-Medical (WASM GPU) + تصفية فعالة لضوضاء غرفة العمليات.", "listeningBadge": "🟢 استماع نشط", "testTitle": "🗣️ اختبر أمرًا صوتيًا جراحيًا وأنت بالزي المعقّم:", "cmd1Display": "«Surgi، اعرض فقط الأوردة فوق الكبدية وأخفِ الهيكل العظمي.»", "cmd1Response": "تم عزل الجهاز الوريدي بنجاح (الطبقة 4 نشطة).", "recognizedNotify": "🎙️ تم التعرّف على الأمر (زمن استجابة 42 مللي ثانية GPU):", "cmd2Display": "«Surgi، ما هي المسافة بين مبضع CUSA وحافة الورم؟»", "cmd2Response": "المسافة الحالية هي 4.2 مليمتر.", "cmd3Display": "«Surgi، ابدأ إملاء التقرير الجراحي CCAM.»", "cmd3Response": "تم تفعيل وضع الإملاء المنظَّم: قسم المدخل بالمنظار قيد التسجيل.", "ttsLabel": "الرد الصوتي الاصطناعي (TTS):", "ttsPlaceholder": "جاهز لتعليماتكم في غرفة العمليات..."}, "webgpuCut": {"title": "✂️ القطع الافتراضي WebGPU — الاستئصال وحساب FLR في الوقت الفعلي", "introLabel": "✂️ محاكاة استئصال الكبد:", "introText": "قم بقطع المتن افتراضيًا وفق مستوى قطع ثلاثي الأبعاد تفاعلي مع إعادة حساب بتردد 60 هرتز لحجم الكبد المتبقي (FLR) والهوامش الورمية.", "segmentsLabel": "اختر قطعات Couinaud المراد إزالتها:", "s6": "S6 (خلفي سفلي)", "s7": "S7 (خلفي علوي)", "s5": "S5 (أمامي سفلي)", "s8": "S8 (أمامي علوي)", "cutPlaneTitle": "📐 معاملات مستوى القطع", "axialAngleLabel": "• الزاوية المحورية:", "offsetLabel": "• الموضع (الإزاحة):", "marginLabel": "• الهامش الورمي المحسوب:", "marginPlaceholder": "— (احسب أولاً)", "voxelSourceLabel": "حجم إجرائي 64³", "hintText": "ℹ️ إذا تم تحديد قطعة أو أكثر من قطعات Couinaud أعلاه، فإنها تُقدَّم على المستوى الحر في حساب الاستئصال (استئصال قطعي تشريحي). وإلا، يُستخدم المستوى الحر (الزاوية/الإزاحة).", "flrAnalysisTitle": "📊 التحليل الحجمي لـ FLR (محسوب)", "totalVolLabel": "• الحجم الكلي للعضو:", "resectedVolLabel": "• حجم الاستئصال:", "remnantVolLabel": "• الحجم المتبقي (FLR):", "safetyPending": "⏳ احسب أولاً...", "segmentsCountedLabel": "القطعات المحسوبة في FLR:", "includeManualLabel": "تضمين القطعات اليدوية", "comparatorTitle": "⚖️ مقارن الاستراتيجيات", "saveAsABtn": "📥 حفظ كاستراتيجية أ", "saveAsBBtn": "📥 حفظ كاستراتيجية ب", "thCriteria": "المعايير", "thStrategyA": "الاستراتيجية أ", "thStrategyB": "الاستراتيجية ب", "noStrategySaved": "احفظ استراتيجية واحدة على الأقل للمقارنة.", "recalcBtn": "🔄 إعادة حساب FLR", "recalcNotify": "تمت إعادة حساب FLR على الحجم الحالي", "applyBtn": "✂️ تطبيق القطع الافتراضي على التوأم الرقمي"}, "raymarching": {"title": "🌟 Ray-Marching DVR — نموذج واجهة، غير مُنفَّذ", "mockupLabel": "⚠️ نموذج واجهة:", "mockupText": "لا يوجد تصيير حجمي فعلي بتقنية Ray-Marching منفَّذ في هذا النموذج التجريبي (Three.js r128 / WebGL التقليدي). الأزرار أدناه تعرض إشعارًا لكنها لا تغيّر التصيير ثلاثي الأبعاد.", "transferFnTitle": "🎛️ دوال النقل (نوافذ التصوير المقطعي) — نموذج", "presetParenchyma": "🟢 متن الكبد (40 HU / 150 HU)", "presetVessels": "🔴 الشجرة الوعائية والسويقات (+120 HU)", "presetTumors": "🟡 آفات وأورام مفرطة التوعية", "presetBones": "⚪ البنى العظمية (+400 HU)", "specsTitle": "⚡ المواصفات المستهدفة (غير مقيسة)", "specsIntro": "ما قد يستهدفه تطبيق فعلي، للاسترشاد فقط — لا يتم إنتاج أي من هذه القيم بواسطة كود وظيفي في هذا النموذج التجريبي:", "specEngine": "• محرك التنفيذ: WGSL Compute Shaders (غير مُنفَّذ)", "specSampling": "• معدل أخذ العينات المستهدف: 512 خطوة شعاعية / بكسل", "specLighting": "• الإضاءة الشاملة: Monte-Carlo AO (غير مُنفَّذ)"}, "sihInterop": {"title": "🏥 تشغيل بيني لنظام معلومات المستشفى (HL7 v2 و FHIR R4/R5)", "connectionLabel": "🏥 اتصال نظام معلومات المستشفى (SIH):", "connectionText": "تبادل ثنائي الاتجاه مع السجل الطبي الإلكتروني / PACS عبر المعايير الدولية HL7 v2 (MLLP) و FHIR R4/R5 (REST JSON).", "fhirApiTitle": "🔥 واجهة برمجة FHIR R4/R5 REST", "fhirResourceLabel": "مورد FHIR المراد تصديره", "optPatient": "Patient (الهوية والسوابق)", "optImagingStudy": "ImagingStudy (سلاسل DICOM و PACS)", "optDiagnosticReport": "DiagnosticReport (القياس الحجمي ثلاثي الأبعاد والقطعات)", "optProcedure": "Procedure (التخطيط الجراحي FHIR R5)", "exportFhirBtn": "🌐 تصدير مورد FHIR (JSON)", "fhirPreviewLabel": "معاينة مورد FHIR:", "fhirPlaceholderStatus": "اختر موردًا وانقر على تصدير", "hl7SenderTitle": "📡 مُرسِل HL7 v2 MLLP (المنفذ 2575)", "hl7EventTypeLabel": "نوع حدث HL7", "optAdtA08": "ADT^A08 — تحديث سجل المريض", "optOrmO01": "ORM^O01 — طلب تدخل جراحي", "optOruR01": "ORU^R01 — تقرير جراحي / ثلاثي الأبعاد", "mllpHostLabel": "مضيف MLLP", "mllpPortLabel": "المنفذ", "sendMllpBtn": "📡 إرسال إطار MLLP (<VT>HL7<FS><CR>)", "hl7FrameLabel": "إطار HL7 v2 المُرسَل والإقرار (ACK):", "hl7Pending": "في انتظار إرسال إطار HL7 v2 MLLP..."}, "webxr": {"title": "🥽 WebXR للحوسبة المكانية — Apple Vision Pro و Meta Quest 3", "streamLabel": "🥽 بث مجسّم بتردد 120 هرتز:", "streamText": "توأم رقمي هولوغرافي في وضع الواقع المعزز الشفاف بزمن استجابة منخفض جدًا (< 9 مللي ثانية) للجراحة الموجَّهة.", "lidarBadge": "LiDAR + تتبع العين 👁️", "telemetryTitle": "📡 القياس عن بُعد والمعايرة المكانية", "deviceLabel": "• السماعة المتصلة:", "deviceValue": "Apple Vision Pro (visionOS 2.0)", "trackingLabel": "• التتبع المكاني:", "trackingValue": "NDI Polaris + ARKit بدون علامات", "rmsLabel": "• خطأ المحاذاة RMS:", "rmsValue": "0.35 مم (دون المليمتر 🎯)", "fovealLabel": "• التصيير النقروي:", "fovealValue": "تتبع العين الديناميكي المتقدم ✅", "recalibrateBtn": "📍 إعادة معايرة محاذاة المريض (42 نقطة)", "gestureTitle": "🖐 محاكاة الإيماءات بلا استخدام اليدين (26 درجة حرية)", "pinchBtn": "🤏 اختبار القرص: دوران ثلاثي الأبعاد", "pinchLabel": "قرص بإصبعين", "pinchResult": "🔄 دوران مجسّم سلس للعضو بزاوية 360°", "raycastBtn": "👆 اختبار إشارة السبابة: قطع CUSA", "raycastLabel": "إشارة السبابة", "raycastResult": "✂️ شق بالموجات فوق الصوتية CUSA موجَّه بمؤشر افتراضي", "grabBtn": "✊ اختبار الإمساك: سحب PBD", "grabLabel": "إمساك وثبات", "grabResult": "🖐 سحب غير رضحي لحواف المتن", "gesturePending": "في انتظار اكتشاف الإيماءات بواسطة الكاميرات تحت الحمراء...", "launchBtn": "🚀 بدء الملاحة الغامرة", "launchNotify": "🥽 تم تفعيل وضع WebXR الغامر المجسّم في سماعة Vision Pro!"}, "robotic": {"title": "🤖 وحدة تحكم الجراحة الروبوتية RAS — Da Vinci 5 و Medtronic Hugo", "teleopLabel": "🤖 التشغيل عن بُعد اللمسي (1000 هرتز):", "teleopText": "قياس حركي عن بُعد بـ 7 درجات حرية وحساب المقاومة بالنيوتن مباشرة على التوأم الرقمي PBD.", "fiberBadge": "ألياف بصرية زمن استجابة 0.8 مللي ثانية ⚡", "armsTitle": "🦾 قياس عن بُعد للأذرع الروبوتية الأربعة", "thArm": "الذراع", "thInstrument": "الأداة (RFID)", "thForce": "القوة", "thStatus": "الحالة", "arm1": "الذراع 1 (يمنى)", "arm2": "الذراع 2 (يسرى)", "arm3": "الذراع 3 (الكاميرا)", "arm4": "الذراع 4 (مساعدة)", "statusActive": "🟢 نشط", "statusFixed": "🔵 ثابت", "statusHolding": "🟡 تثبيت", "recalibrateBtn": "⚙️ إعادة معايرة الصفر الحركي (7 درجات حرية)", "recalibrateNotify": "🔄 تم إجراء معايرة حركية Denavit-Hartenberg وختمها (SHA-256)", "hapticTitle": "⚡ محاكاة الاستجابة اللمسية والسلامة", "lightGraspBtn": "🟢 محاكاة إمساك خفيف (1.4 نيوتن)", "lightGraspLabel": "إمساك خفيف", "lightGraspResult": "🟢 مقاومة طبيعية — متن الكبد سليم.", "moderateTractionBtn": "🟡 محاكاة شد متوسط (3.2 نيوتن)", "moderateTractionLabel": "شد متوسط", "moderateTractionResult": "🟡 مقاومة مرتفعة — تم بلوغ أقصى شد مرن.", "criticalOverloadBtn": "🔴 محاكاة حمل زائد حرج (4.8 نيوتن - قفل تشابك)", "criticalOverloadLabel": "حمل زائد حرج", "criticalOverloadResult": "🛑 تنبيه تمزق! تم تجاوز عتبة 4.5 نيوتن. تم تفعيل قفل التشابك!", "hapticPending": "النظام اللمسي جاهز بانتظار التفاعل مع النسيج...", "activateBtn": "🚀 تفعيل التشغيل عن بُعد للوحدة", "activateNotify": "🤖 تم ربط وحدة Da Vinci 5 في الوقت الفعلي بالتوأم الرقمي PBD!", "hapticFeedbackLabel": "🤖 استجابة لمسية", "forceMeasuredLabel": "⚡ القوة المقاسة:", "fiberLoopActive": "— حلقة الألياف البصرية 1000 هرتز نشطة.", "safetyAlertNotify": "🛑 تنبيه سلامة الروبوت: القوة {force} نيوتن > عتبة 4.5 نيوتن! تم تفعيل القفل الطارئ وختمه (SHA-256)", "hapticProcessedNotify": "🦾 تمت معالجة المحاكاة اللمسية: {action} ({force} نيوتن) — النسيج مستقر"}, "genai": {"title": "🧬 مُتنبِّئ مضاعفات GenAI والجراحة الدقيقة الروبوتية (50:1)", "transformerLabel": "🧬 محوّل فيديو مكاني-زماني (70 مليار):", "transformerText": "تنبؤ فيديو بأفق 15 ثانية لمخاطر أثناء العملية (تمزقات وعائية، تسربات صفراوية) وتصفية الارتعاش الدقيق الروبوتي (< 5 ميكرومتر).", "videosBadge": "52,400 فيديو غرفة عمليات • مقياس 50:1 🎯", "microsurgeryTitle": "🔬 الجراحة الدقيقة الروبوتية (Symani / Zeiss)", "consoleLabel": "• وحدة التحكم الدقيقة الروبوتية:", "consoleValue": "Symani Surgical System (MMI)", "kinematicLabel": "• التخفيض الحركي:", "kinematicValue": "50:1 (10 مم ← 0.2 مم)", "tremorLabel": "• تصفية الارتعاش RMS:", "tremorValue": "< 3.2 ميكرومتر (دون الميكرون ✨)", "opticsLabel": "• البصريات المجسّمة:", "opticsValue": "Zeiss KINEVO 40x 3D 4K", "calibrateBtn": "⚖️ معايرة مقياس الحركة الوعائية الدقيقة (50:1)", "calibrateNotify": "✨ تمت معايرة التخفيض الدقيق الروبوتي 50:1 وختمه في audit_logs (SHA-256)", "predictTitle": "🔮 محاكاة تنبؤ GenAI أثناء العملية", "neuroBtn": "🧠 محاكاة الأعصاب: تمزق أم دم ويليس (84%)", "neuroEvent": "💥 تمزق أم دم ويليس", "neuroResult": "🛑 تنبيه حرج (84%): توتر جداري مفرط! إجراء الذكاء الاصطناعي: تشبيك مشبك السباتي القريب.", "hbpBtn": "🫀 محاكاة الكبد: خرق صفراوي بالقناة اليمنى (88%)", "hbpEvent": "🌊 خرق صفراوي بالقناة اليمنى", "hbpResult": "🔴 تنبيه تسرب صفراوي (88%): القطع قريب جدًا من السرة! إجراء الذكاء الاصطناعي: عرض ICG بالواقع المعزز WebXR.", "ophthBtn": "👁️ محاكاة الشبكية: مفاغرة مستقرة (12%)", "ophthEvent": "👁️ مفاغرة شبكية", "ophthResult": "🟢 مسار آمن (12%): تمت تصفية الارتعاش إلى 3.2 ميكرومتر — مفاغرة مستقرة.", "predictPending": "نموذج GenAI Transformer جاهز — جارٍ مراقبة بث فيديو غرفة العمليات ونموذج العناصر المحدودة...", "activateBtn": "🚀 تفعيل مراقبة GenAI والجراحة الدقيقة", "activateNotify": "🧬 تم تفعيل نماذج GenAI المكانية-الزمانية والدقيقة الروبوتية مباشرة على التوأم الرقمي!", "predictionLabel": "🧬 تنبؤ GenAI", "probabilityLabel": "⚡ احتمال 15 ثانية:", "transformerFootnote": "— محوّل 70 مليار (52,400 فيديو غرفة عمليات).", "criticalAlertNotify": "🛑 تنبيه مضاعفات GenAI ({prob}%): {event}! يُوصى بإجراء وقائي بالذكاء الاصطناعي وتم ختمه في audit_logs (SHA-256)", "predictionComputedNotify": "🧬 تم حساب تنبؤ GenAI: {event} ({prob}%) — مسار مستقر"}, "pqcBioprint": {"title": "🛰️ الجراحة عن بُعد PQC (ما بعد الكمّي) والطباعة الحيوية 4D أثناء العملية", "infoLabel": "🛰️ شبكة الكم LEO 6G والطباعة الحيوية 4D:", "infoText": "تشغيل عن بُعد عبر القارات مقاوم للتلاعب (NIST CRYSTALS-Kyber/Dilithium) وطباعة موضعية لطعوم خلوية مروّاة عند 37°م.", "badge": "زمن الاستجابة 14.2 ms • BioX سداسي المحاور ✨", "specsTitle": "🔒 قياس الاتصال الكمّي والرابط الساتلي 6G", "spec1Label": "تغليف المفتاح:", "spec1Value": "NIST ML-KEM-1024 (Kyber)", "spec2Label": "التوقيع الرقمي:", "spec2Value": "NIST ML-DSA-87 (Dilithium)", "spec3Label": "الرابط العابر للقارات:", "spec3Value": "باريس ↔ طوكيو (شبكة 6G LEO)", "spec4Label": "زمن الاستجابة والاهتزاز:", "spec4Value": "14.2 ms / ±0.08 ms (اهتزاز صفري ⚡)", "calibrateBtn": "🔐 إعادة تفاوض مفاتيح الكم PQC (تدوير كل 60 ثانية)", "calibrateNotify": "✨ تم التفاوض على جلسة الجراحة الكمّية عن بُعد PQC وختمها (SHA-256 / Dilithium-5)", "actionsTitle": "🧬 محاكاة الطباعة الحيوية 4D أثناء العملية", "action1Btn": "🫀 طباعة رقعة الكبد S6 (42.5 مل / 191 ثانية)", "action1Label": "رقعة كبدية S6", "action1Desc": "🟢 تم حساب G-code: طباعة موضعية للحمة الكبدية (ألجينات-MSC-VEGF عند 37°م) خلال 191 ثانية.", "action2Btn": "🧠 طباعة الأم الجافية القحفية (14 مل / 63 ثانية)", "action2Label": "الأم الجافية القحفية", "action2Desc": "🔵 تم حساب G-code: إعادة بناء معقّمة ومحكمة للأم الجافية القحفية بغشاء كولاجيني حيوي خلال 63 ثانية.", "action3Btn": "🦴 طباعة طعم الفك السفلي (31.2 مل / 140 ثانية)", "action3Label": "طعم الفك السفلي", "action3Desc": "🟡 تم حساب G-code: طباعة حيوية لسقالة سيراميك-PEEK محفزة للعظم ومروّاة خلال 140 ثانية.", "outputPending": "ذراع الطباعة الحيوية سداسية المحاور CELLINK BioX في انتظار إحداثيات الاستئصال...", "activateBtn": "🚀 تفعيل الرابط PQC والطباعة الحيوية 4D", "activateNotify": "🛰️ تم ربط الجراحة عن بُعد PQC LEO 6G والطابعة الحيوية 4D مباشرة بالتوأم الرقمي!", "resultTemplate": "🛰️ <b>طباعة حيوية 4D ({site}):</b> {desc} <br><strong>⚡ الحجم: {vol} مل | {layers}</strong> — ذراع CELLINK BioX سداسي المحاور عند 37°م.", "calibratedNotify": "🛰️ تمت معايرة الطباعة الحيوية 4D على {site} ({vol} مل) — تم إرسال G-code عبر شبكة LEO 6G PQC"}, "bciHaptic": {"title": "🧠 واجهة الدماغ-الحاسوب (BCI 1024 قناة) والتغذية الراجعة اللمسية القشرية المباشرة (S1)", "infoLabel": "🧠 التحكم بالفكر واللمس القشري:", "infoText": "فك تشفير SNN دون الميلي ثانية (< 2.4 ms) للقشرة الحركية (M1) وتحفيز دقيق لـ S1 لاستشعار مقاومة الأنسجة في القشرة!", "badge": "1024 قناة • SNN Loihi 2 ⚡", "specsTitle": "⚡ القياس القشري وفك تشفير SNN", "spec1Label": "الغرسة القشرية:", "spec1Value": "Neuralink N1-Surg / Precision 1024-Ch", "spec2Label": "فك التشفير العصبي الشكل:", "spec2Value": "شريحة Intel Loihi 2 SNN", "spec3Label": "زمن فك التشفير:", "spec3Value": "2.1 ms (دون الميلي ثانية ⚡)", "spec4Label": "دقة نية M1:", "spec4Value": "99.2% عند أخذ عينات 30 كيلوهرتز", "calibrateBtn": "⚖️ معايرة المصفوفة القشرية M1 / S1 (30 كيلوهرتز)", "calibrateNotify": "✨ نجحت معايرة المصفوفة القشرية M1/S1 — دقة تشابكية 99.2% (SHA-256)", "actionsTitle": "🧠 محاكاة التشغيل عن بُعد بالفكر", "action1Btn": "🧠 تثبيت مشبك أم دم ويليس بالفكر (2.4 N / 53 µA)", "action1Label": "تثبيت مشبك أم دم ويليس", "action1Desc": "🟢 تم فك تشفير نية M1: تم وضع مشبك أم الدم — إحساس لمسي S1 سلس وواقعي في القشرة.", "action2Btn": "🫀 قطع الكبد بالفكر (4.2 N / 92 µA)", "action2Label": "قطع الحمة الكبدية", "action2Desc": "🟡 تم فك تشفير نية M1: قطع كبدي — إحساس S1 شديد (92 µA) يشير إلى حمة كثيفة.", "action3Btn": "🛑 محاكاة قفل الأمان المضاد للإرهاق (< 2.1 ms)", "action3Label": "قفل أمان طارئ", "action3Desc": "🛑 تنبيه إرهاق إدراكي (>85%): فصل عصبي فوري! تم قفل المشغلات وقطع نبضات S1.", "outputPending": "فك تشفير SNN مسلّح في انتظار جهود الفعل من القشرة الحركية...", "activateBtn": "🚀 تفعيل رابط BCI ولمس S1 القشري", "activateNotify": "🧠 تم ربط واجهة الدماغ-الحاسوب 1024 قناة وتحفيز S1 بالتوأم الرقمي!", "resultTemplate": "🧠 <b>نية M1 \\ لمس S1 ({action}):</b> {desc} <br><strong>⚡ قوة PBD: {force} N | تحفيز S1: {icms} عند 200 هرتز</strong> — شريحة Loihi 2 SNN (< 2.1 ms).", "interlockNotify": "🛑 تنبيه قفل أمان BCI: مؤشر إرهاق/توتر حرج! فصل عصبي فوري (SHA-256)", "processedNotify": "🧠 تمت معالجة أمر BCI: {action} ({force} N) — تم إدراك التغذية الراجعة اللمسية S1 {icms} في القشرة"}, "nanoSwarm": {"title": "🔬 سرب النانوروبوتات (5 ملايين وحدة) وعلم الأورام الجزيئي داخل الجسم الحي (CRISPR-Cas9)", "infoLabel": "🔬 الملاحة الدقيقة الوعائية والحرارة المفرطة بالمجال المغناطيسي المتناوب:", "infoText": "توجيه مغناطيسي ثلاثي الأبعاد لخمسة ملايين نانوروبوت من DNA-Origami / Fe3O4 نحو النقائل الدقيقة وإطلاق CRISPR-Cas9 عند 43.5°م!", "badge": "5,000,000 وحدة • SPION Fe3O4 ⚡", "specsTitle": "⚡ قياس اتصال السرب والتدرج المغناطيسي", "spec1Label": "الوحدات النشطة:", "spec1Value": "5,000,000 نانوروبوت (< 100 نانومتر)", "spec2Label": "مادة النواة:", "spec2Value": "SPION Fe3O4 فائق البارامغناطيسية", "spec3Label": "ملفات الطاولة:", "spec3Value": "SurgMag مصفوفة تدرج سداسية المحاور (0.85 تسلا/م)", "spec4Label": "الاستهداف المستضدي:", "spec4Value": "Anti-EGFR / Anti-VEGF (98.4%)", "calibrateBtn": "🧲 معايرة حقل التدرج المغناطيسي (0.85 تسلا/م)", "calibrateNotify": "✨ نجحت معايرة الحقل المغناطيسي 0.85 تسلا/م ومزامنة السرب (SHA-256)", "actionsTitle": "🔬 محاكاة تدخل انحلالي ورمي داخل الجسم الحي", "action1Btn": "🔬 توجيه السرب نحو النقيلة الدقيقة الكبدية S8 (1.2 تسلا/م)", "action1Label": "توجيه النقيلة الدقيقة الكبدية S8", "action1Desc": "🟢 توجيه مغناطيسي 1.2 تسلا/م: تقارب 4,985,000 نانوروبوت على النقيلة الدقيقة S8 — تأكيد الارتباط بـ EGFR.", "action2Btn": "🧬 إطلاق CRISPR-Cas9 (مجال مغناطيسي متناوب 43.5°م)", "action2Label": "إطلاق CRISPR-Cas9 بالمجال المغناطيسي المتناوب", "action2Desc": "🟢 تفعيل المجال المغناطيسي المتناوب 150 كيلوهرتز (43.5°م): إطلاق CRISPR-Cas9 KRAS-G12D جارٍ — استماتة ورمية 99.1%، وسلامة الحمة الصحية 100%.", "action3Btn": "🛑 محاكاة الإيقاف الطارئ وإزالة المغنطة", "action3Label": "إيقاف طارئ", "action3Desc": "🛑 تنبيه كثافة وعائية: إزالة مغنطة فورية لملفات الطاولة! تشتت السرب في التدفق الفسيولوجي الطبيعي.", "outputPending": "سرب النانوروبوتات يدور في الأوعية الدقيقة في انتظار متجهات التوجيه...", "activateBtn": "🚀 تفعيل توجيه السرب وعلاج الأورام بـ CRISPR", "activateNotify": "🔬 تم ربط سرب 5 ملايين نانوروبوت والملفات المغناطيسية مباشرة بالتوأم الرقمي!", "resultTemplate": "🔬 <b>سرب النانوروبوتات ({action}):</b> {desc} <br><strong>⚡ القياس: {stat} | التدرج: {param} تسلا/م (أو °م)</strong> — ارتباط EGFR 98.4%.", "interlockNotify": "🛑 تنبيه سرب النانوروبوتات: تم تفعيل إزالة المغنطة الطارئة! تم تشتيت السرب بأمان (SHA-256)", "processedNotify": "🔬 تمت معالجة أمر النانوروبوتات: {action} ({stat}) — صفر تلف في الحمة"}, "autoLaser": {"title": "🤖⚡ الجراحة الروبوتية المستقلة المستوى 5 واللحام بالليزر (EPLW 1470 نانومتر)", "infoLabel": "🤖⚡ استقلالية STAR-5 واللحام بالليزر:", "infoText": "نموذج Med-VLA RT-2 يقود الجراحة الدقيقة بـ 10,000 إطار/ثانية OCT مع الاندماج الليزري بالألبومين-ICG (انفجار > 280 ملم زئبقي)!", "badge": "استقلالية STAR-5 • ليزر 1470 نانومتر ⚡", "specsTitle": "⚡ قياس الذكاء الاصطناعي المستقل و OCT ثلاثي الأبعاد", "spec1Label": "محرك VLA:", "spec1Value": "Med-PaLM 3 Robotics / RT-2", "spec2Label": "درجة الاستقلالية:", "spec2Value": "STAR-5 (مستقل 100%)", "spec3Label": "مستشعر التتبع:", "spec3Value": "SurgOCT Interferometer (10,000 إطار/ثانية)", "spec4Label": "سرعة التنفيذ:", "spec4Value": "أسرع بـ 5.2 مرة (0 رعشة)", "calibrateBtn": "⚖️ معايرة محرك VLA ورأس الليزر (1470 نانومتر)", "calibrateNotify": "✨ نجحت معايرة نموذج VLA ورأس الليزر 1470 نانومتر — زمن استجابة 0.78 ms (SHA-256)", "actionsTitle": "🤖 محاكاة تنفيذ L5 والاندماج الليزري", "action1Btn": "🤖 مفاغرة شريانية مستقلة + ليزر (285 ملم زئبقي)", "action1Label": "مفاغرة شريانية مستقلة", "action1Desc": "🟢 تنفيذ STAR-5: مفاغرة دقيقة للشريان الكبدي — لحام ليزري 12.5 J/سم² محكم (انفجار 285 ملم زئبقي).", "action2Btn": "🔥 لحام ليزري للقناة الصفراوية (14.0 J/سم² / 319 ملم زئبقي)", "action2Label": "لحام ليزري للقناة الصفراوية", "action2Desc": "🟢 تنفيذ STAR-5: لحام ليزري للقناة الصفراوية — بلمرة الألبومين-ICG خلال 5.6 ثانية دون أي تسرب أو دبابيس.", "action3Btn": "🛑 استعادة تحكم بشري فوري (< 1 ms)", "action3Label": "استعادة التحكم البشري", "action3Desc": "🛑 تنبيه استعادة التحكم (< 1 ms): نقل فوري للمشغلات إلى الجراح عبر BCI/الصوت! تم تأمين الليزر.", "outputPending": "محرك VLA STAR-5 مسلّح في انتظار اختيار الحركة المستقلة...", "activateBtn": "🚀 تفعيل استقلالية L5 واللحام بالليزر", "activateNotify": "🤖⚡ تم ربط استقلالية STAR-5 واللحام بالليزر مباشرة بالتوأم الرقمي!", "resultTemplate": "🤖⚡ <b>استقلالية L5 واللحام بالليزر ({action}):</b> {desc} <br><strong>⚡ القوة/التدفق: {param} J/سم² | المقاومة: {stat}</strong> — محرك RT-2 VLA (< 0.8 ms).", "interlockNotify": "🛑 تنبيه استعادة التحكم البشري (< 1 ms): تم إرجاع التحكم إلى الجراح عبر BCI! تم تأمين الليزر (SHA-256)", "processedNotify": "🤖 نجح التنفيذ المستقل L5: {action} ({stat}) — ضمان اندماج نسيجي محكم"}, "epiSono": {"title": "🧬✨ إعادة برمجة إبيجينية داخل الجسم الحي وعلم الوراثة الصوتي العميق (OSKM / FUS 1.2 ميغاهرتز)", "infoLabel": "🧬✨ التجديد الشبابي وعلم الوراثة الصوتي:", "infoText": "إطلاق جسيمات ARNm LNP لعوامل ياماناكا (OSKM) بتفعيل الموجات فوق الصوتية المركزة (FUS 1.2 ميغاهرتز): -20 عامًا على الساعة الإبيجينية دون خطر الورم المسخي!", "badge": "OSKM -20 عامًا • FUS 1.2 ميغاهرتز 🌱", "specsTitle": "⚡ القياس الإبيجيني وعلم البصريات الوراثي UCNP", "spec1Label": "عوامل التجديد الشبابي:", "spec1Value": "ARNm LNP ياماناكا (Oct4, Sox2, Klf4, c-Myc)", "spec2Label": "تراجع الساعة:", "spec2Value": "-20.4 عامًا (0.00% خطر ورم مسخي)", "spec3Label": "حزمة FUS:", "spec3Value": "SurgFUS مصفوفة موجهة (1.2 ميغاهرتز / 0.85 ميغاباسكال)", "spec4Label": "جسيمات UCNP النانوية:", "spec4Value": "تحويل الأشعة تحت الحمراء القريبة 980 نانومتر ← أزرق 470 نانومتر", "calibrateBtn": "🌱 معايرة حزم FUS (1.2 ميغاهرتز) وليزر الأشعة تحت الحمراء (980 نانومتر)", "calibrateNotify": "✨ نجحت معايرة حزم FUS 1.2 ميغاهرتز وتحفيز UCNP 980 نانومتر (SHA-256)", "actionsTitle": "🧬 محاكاة التجديد الشبابي والتعديل داخل الجسم الحي", "action1Btn": "🌱 تجديد شبابي للفص الكبدي بعد نقص التروية (-20 عامًا)", "action1Label": "تجديد شبابي كبدي بعد نقص التروية", "action1Desc": "🟢 تفعيل FUS 0.85 ميغاباسكال: إطلاق OSKM في المنطقة الكبدية S6/S7 — انعكاس الساعة الإبيجينية بمقدار 20.4 عامًا. حيوية خلوية 90.5%.", "action2Btn": "🌟 تعديل بصري وراثي مضاد للتليف (UCNP 980 نانومتر)", "action2Label": "تعديل بصري وراثي مضاد للتليف", "action2Desc": "🟢 تحفيز ليزر الأشعة تحت الحمراء 980 نانومتر ← 470 نانومتر عبر UCNPs: تفعيل الكولاجيناز — إزالة التليف بنسبة 94.8% دون اختراق جلدي.", "action3Btn": "🛑 محاكاة قفل الأمان المضاد للورم المسخي", "action3Label": "قفل مضاد للورم المسخي", "action3Desc": "🛑 تنبيه قفل أمان جيني ورمي: إيقاف فوري لنبضات FUS! ضمان أمان مضاد للورم المسخي بنسبة 100% (SHA-256).", "outputPending": "محول FUS وناقلات ARNm LNP مسلّحة في انتظار استهداف الأنسجة...", "activateBtn": "🚀 تفعيل التجديد الشبابي الإبيجيني وعلم الوراثة الصوتي", "activateNotify": "🧬✨ تم ربط إعادة البرمجة الإبيجينية وعلم الوراثة الصوتي بالتوأم الرقمي!", "resultTemplate": "🧬✨ <b>التجديد الشبابي وعلم الوراثة الصوتي ({action}):</b> {desc} <br><strong>⚡ ضغط FUS / ليزر الأشعة تحت الحمراء: {param} ميغاباسكال (أو مللي واط/سم²) | الساعة: {stat}</strong> — OSKM ARNm LNP.", "interlockNotify": "🛑 تنبيه قفل أمان جيني ورمي: تم تفعيل القفل المضاد للورم المسخي! لا يوجد تحول خلوي (SHA-256)", "processedNotify": "🧬 تمت معالجة أمر التجديد الشبابي الإبيجيني: {action} ({stat}) — تم تجديد النسيج"}, "ramanPlasma": {"title": "⚡🔬 مطيافية رامان CARS/SERS والبلازما الباردة الجوية (CAP / RONS)", "infoLabel": "⚡🔬 خزعة بصرية < 10 مللي ثانية وبلازما R0:", "infoText": "مطيافية رامان الاهتزازية CARS/SERS بتردد 1000 هرتز ونفث بلازما باردة جوية لاستئصال الارتشاحات المستهدف بالاستماتة الخلوية دون ضرر حراري!", "badge": "R0 99.8% • CAP He/Ar 37°م ⚡", "specsTitle": "⚡ قياس اتصال مسبار رامان ورشاش البلازما", "spec1Label": "الخزعة البصرية:", "spec1Value": "مسبار ألياف بصرية CARS / SERS عند 1000 هرتز", "spec2Label": "زمن الاستجابة والنوعية:", "spec2Value": "7.4 ms | نوعية R0/R1: 99.8%", "spec3Label": "نفث البلازما الباردة:", "spec3Value": "CAP جوي (He/Ar 98/2% عند 36.8°م)", "spec4Label": "الأنواع التفاعلية:", "spec4Value": "RONS (H₂O₂، NO₂⁻، ONOO⁻) — استماتة 99.99%", "calibrateBtn": "🌱 معايرة مسبار رامان (1000 هرتز) ونفث CAP (12.5 كيلوفولت)", "calibrateNotify": "✨ نجحت معايرة مسبار رامان 1000 هرتز ومولد البلازما 12.5 كيلوفولت (SHA-256)", "actionsTitle": "🔬 محاكاة خزعة رامان واستئصال البلازما", "action1Btn": "⚡ خزعة بصرية لشريحة الاستئصال (حافة R0)", "action1Label": "خزعة بصرية لشريحة الاستئصال", "action1Desc": "🟢 خزعة بصرية CARS/SERS بتردد 1000 هرتز في شريحة S7: لم يُكتشف أي ذروة نووية شاذة عند 1575 سم⁻¹. تم اعتماد حافة R0.", "action2Btn": "🔬 استئصال بلازما باردة لارتشاح R1 (CAP 37°م)", "action2Label": "استئصال بلازما باردة لارتشاح R1", "action2Desc": "🟢 نفث بلازما باردة CAP (12.5 كيلوفولت / 36.8°م) على ارتشاح دقيق: استماتة خلوية انتقائية مُحفَّزة بـ RONS دون ضرر للأوعية النبيلة.", "action3Btn": "🛑 محاكاة قفل الأمان المضاد للقوس الكهربائي (0 كيلوفولت)", "action3Label": "قفل مضاد للقوس الكهربائي", "action3Desc": "🛑 تنبيه قفل أمان التأين: قطع الجهد العالي للبلازما (0.0 كيلوفولت)! حماية القوس الكهربائي نشطة (SHA-256).", "outputPending": "مسبار رامان CARS ورشاش البلازما الباردة جاهزان لتحليل الحواف...", "activateBtn": "🚀 تفعيل تشخيص رامان والبلازما الباردة", "activateNotify": "⚡🔬 تم ربط مطيافية رامان والبلازما الباردة بالتوأم الرقمي!", "resultTemplate": "⚡🔬 <b>مطيافية رامان وبلازما CAP ({action}):</b> {desc} <br><strong>⚡ جهد CAP / التردد: {param} كيلوفولت (أو هرتز) | النتيجة: {stat}</strong> — استماتة RONS.", "interlockNotify": "🛑 تنبيه قفل أمان التأين: قطع الجهد العالي (0 كيلوفولت)! تم تجنب القوس الكهربائي بأمان (SHA-256)", "processedNotify": "⚡ تمت معالجة أمر رامان/البلازما: {action} ({stat}) — صفر بقايا ورمية، معتمد R0"}, "cryoBnct": {"title": "❄️☢️ كهرباء المسام غير القابلة للعكس (nsPEF) والعلاج بالتقاط النيوترونات البوروني أثناء العملية BNCT", "infoLabel": "❄️☢️ استئصال نقيري غير حراري ونيوترونات BNCT:", "infoText": "كهربة المسام النانوثانية بملامسة الأوعية الكبيرة دون تخثر، وتحلل ألفا دون خلوي (5 µm) عبر التقاط النيوترونات على البورون-10!", "badge": "nsPEF 30 كيلوفولت/سم • BNCT ¹⁰B 2.34 MeV ❄️", "specsTitle": "❄️ قياس اتصال مولد nsPEF ومصدر BNCT", "spec1Label": "Cryo-IRE:", "spec1Value": "nsPEF 300 ns عند 30 كيلوفولت/سم + جول-طومسون -20°م", "spec2Label": "سلامة الأوعية:", "spec2Value": "100% حفاظ على المصفوفة الكولاجينية", "spec3Label": "مصدر نيوترونات BNCT:", "spec3Value": "فوق حرارية (0.5 eV - 10 keV) عند 1.2×10⁹ ن/سم²/ث", "spec4Label": "التفاعل النووي:", "spec4Value": "¹⁰B + n → ⁴He (α) + ⁷Li (2.34 MeV على 7 µm)", "calibrateBtn": "🌱 معايرة مولد nsPEF وحزمة BNCT", "calibrateNotify": "✨ نجحت معايرة مولد nsPEF (30 كيلوفولت/سم) وحزمة نيوترونات BNCT (SHA-256)", "actionsTitle": "🔬 محاكاة Cryo-IRE وتشعيع BNCT", "action1Btn": "❄️ استئصال nsPEF للنقير الكبدي (دون تخثر)", "action1Label": "استئصال nsPEF للنقير الكبدي", "action1Desc": "🟢 استئصال Cryo-IRE nsPEF (30 كيلوفولت/سم / -20°م) بملامسة الوريد البابي: مسامية نانوية قاتلة 99.9% للورم دون أي تمسخ للكولاجين الوعائي.", "action2Btn": "☢️ تشعيع نيوتروني BNCT (ألفا ¹⁰B-BPA)", "action2Label": "تشعيع نيوتروني BNCT", "action2Desc": "🟢 تشعيع BNCT فوق حراري على ¹⁰B-BPA المتراكم (65 جزء بالمليون): تحلل ألفا دون خلوي (7 µm). استئصال 100% من الخلايا الورمية المتسللة.", "action3Btn": "🛑 محاكاة قفل قياس الجرعات النيوترونية (0 ن/سم²)", "action3Label": "قفل قياس الجرعات", "action3Desc": "🛑 تنبيه قفل أمان قياس الجرعات النيوترونية: تم بلوغ عتبة الامتصاص! قطع فوري للمصدر (0.0 ن/سم²/ث). حماية درع SHA-256.", "outputPending": "مولد كهربة المسام nsPEF ومصدر النيوترونات BNCT جاهزان...", "activateBtn": "🚀 تفعيل Cryo-IRE و BNCT أثناء العملية", "activateNotify": "❄️☢️ تم ربط Cryo-IRE و BNCT بالتوأم الرقمي!", "resultTemplate": "❄️☢️ <b>Cryo-IRE و BNCT نيوترونات ({action}):</b> {desc} <br><strong>⚡ تدرج nsPEF / البورون: {param} كيلوفولت/سم (أو جزء بالمليون) | الحالة: {stat}</strong> — ألفا 2.34 MeV.", "interlockNotify": "🛑 تنبيه قفل أمان قياس الجرعات: عتبة امتصاص النيوترونات! قطع فوري للحزمة (0 ن/سم²/ث)! SHA-256", "processedNotify": "❄️ تمت معالجة أمر Cryo-IRE/BNCT: {action} ({stat}) — تم استئصال النسيج الورمي بنسبة 100%"}, "organoid4d": {"title": "🧬🌱 تجميع العضويات 4D وتكوّن الأوعية الدقيقة الحيوي المحاكي 2PP", "infoLabel": "🧬🌱 إعادة بناء العضويات الموضعي وليزر 2PP:", "infoText": "ترسيب بالتحليق الصوتي لـ 450,000 كرية ذاتية المنشأ ومفاغرة شعرية دقيقة بالليزر الفيمتوثانوي في أقل من 90 ثانية!", "badge": "تحليق 40 كيلوهرتز • ليزر 2PP 780 نانومتر 🌱", "specsTitle": "🌱 قياس اتصال التحليق الصوتي وليزر 2PP", "spec1Label": "الحاقن:", "spec1Value": "تحليق صوتي (40 كيلوهرتز) + مصيدة بصرية", "spec2Label": "الكريات:", "spec2Value": "450,000 عضوية كبدية (300 µm) عند 10 µm", "spec3Label": "ليزر 2PP:", "spec3Value": "فيمتوثانوي Ti:Sapphire (780 نانومتر / 100 fs)", "spec4Label": "المفاغرة:", "spec4Value": "شبكة شعرية PEG-DA متشابكة خلال 84.5 ثانية", "calibrateBtn": "🌱 معايرة التحليق الصوتي وليزر 2PP", "calibrateNotify": "✨ نجحت معايرة التحليق الصوتي (40 كيلوهرتز) وليزر 2PP الفيمتوثانوي (SHA-256)", "actionsTitle": "🔬 محاكاة التجميع وتكوّن الأوعية الدقيقة", "action1Btn": "🌱 ترسيب صوتي للعضويات (تجويف S5/S8)", "action1Label": "ترسيب صوتي للعضويات", "action1Desc": "🟢 ترسيب صوتي لـ 450,000 كرية كبدية (300 µm) في تجويف الاستئصال S5/S8: تجميع معماري مثالي (دقة 10 µm).", "action2Btn": "⚡ تكوّن الأوعية الدقيقة بليزر 2PP (مفاغرة)", "action2Label": "تكوّن الأوعية الدقيقة بليزر 2PP", "action2Desc": "🟢 بلمرة ضوئية بليزر 2PP (780 نانومتر / 180 مللي واط): إنشاء الشبكة الشعرية الدقيقة والمفاغرة مع جذعي الوريد البابي خلال 84.5 ثانية. استعادة الترووية 100%!", "action3Btn": "🛑 محاكاة قفل نقص الأكسجة (0 كرية/ث)", "action3Label": "قفل نقص الأكسجة", "action3Desc": "🛑 تنبيه قفل أمان نقص الأكسجة: انخفاض التروية الشعرية الموضعية! قطع فوري لترسيب العضويات (0 كرية/ث). حماية من النخر SHA-256.", "outputPending": "حاقن التحليق الصوتي وليزر 2PP الفيمتوثانوي جاهزان...", "activateBtn": "🚀 تفعيل تجميع العضويات والأوعية الدقيقة", "activateNotify": "🧬🌱 تم ربط العضويات 4D وليزر 2PP بالتوأم الرقمي!", "resultTemplate": "🧬🌱 <b>عضويات 4D وليزر 2PP ({action}):</b> {desc} <br><strong>⚡ التحليق / ليزر 2PP: {param} كرية (أو مللي واط) | الحالة: {stat}</strong> — دقة 10 µm.", "interlockNotify": "🛑 تنبيه قفل أمان نقص الأكسجة: تم اكتشاف خطر نخري! قطع فوري للحقن (0 كرية/ث)! SHA-256", "processedNotify": "🌱 تمت معالجة أمر العضويات 4D/2PP: {action} ({stat}) — إعادة بناء وظيفية كاملة"}, "iknifeAc225": {"title": "🔬💨 التشخيص الجزيئي بالأيروسول (iKnife REIMS) والعلاج الإشعاعي التشخيصي ألفا بالأكتينيوم-225 (المرحلة 20 / M39-M40)", "introTitle": "🔬 الشفط الطيفي الموضعي (0.8 ثانية) والتوجيه الإشعاعي ألفا 28 MeV:", "introBody1": "يغذي شفط أيروسولات القطع بالمشرط/الليزر باستمرار مطياف كتلة بزمن الطيران (", "introBody2": ")، مُحدِّدًا نسبة الغشاء الفوسفاتيديل كولين (PC) لضمان حافة R0. في الوقت نفسه، يقوم مسبار الكشف أثناء العملية برسم خرائط وتشعيع العناقيد الدقيقة الخفية (< 250 µm) عبر انبعاث ألفا موجّه من ", "introBody3": ".", "panel1Title": "⚡ قياس اتصال أيروسول iKnife (REIMS ToF)", "p1Label1": "معدل تدفق الشفط:", "p1Value1": "1.5 لتر/دقيقة (فوهة معقمة)", "p1Label2": "سرعة التأين:", "p1Value2": "740 ms (زمن الطيران)", "p1Label3": "الذروة الغشائية المستهدفة:", "p1Value3": "PC(34:1) m/z 760.6", "p1Label4": "الدقة النسيجية:", "p1Value4": "99.95% (نوعية R0)", "panel2Title": "☢️ المسبار التشخيصي العلاجي ألفا (Ac-225 / Ga-68)", "p2Label1": "النويدة المشعة ألفا:", "p2Value1": "الأكتينيوم-225 (Ac-225)", "p2Label2": "طاقة التتالي:", "p2Value2": "28 MeV (4 جسيمات α)", "p2Label3": "اختراق الأنسجة:", "p2Value3": "80 µm (0 ضرر جانبي)", "p2Label4": "العد الغاما المباشر:", "p2Value4": "4,850 cps (عتبة 150 µm)", "simTitle": "⚙️ محاكاة التحليل الفوري بـ iKnife وتصويب العلاج الإشعاعي التشخيصي بالأكتينيوم-225:", "btn1Label": "💨 تحليل أيروسول iKnife (حافة R0)", "action1Name": "تحليل دخان المشرط (حافة سليمة)", "action1Desc": "نسبة PC/PI منخفضة (0.21)، عدم وجود غزو ورمي على خط القطع.", "btn2Label": "🛑 تنبيه تسلل iKnife (R1)", "action2Name": "تنبيه تسلل غشائي", "action2Desc": "ذروة تكاثرية ضخمة PC(34:1) m/z 760.6! يلزم توسيع جراحي (+3 مم).", "btn3Label": "☢️ تصويب ألفا Ac-225 (8.5 ميغابيكريل)", "action3Name": "تصويب علاجي تشخيصي بالأكتينيوم-225", "action3Desc": "تشعيع قصير المدى (80 µm، 28 MeV) على العنقود الدقيق S4/النقيري. صفر ضرر للأوعية.", "btn4Label": "🛑 قفل أمان إشعاعي (0 ميغابيكريل)", "action4Name": "قفل الأمان الإشعاعي", "action4Desc": "قطع فوري لخط حقن الأكتينيوم-225 (0 ميغابيكريل). ختم SHA-256.", "outputPendingLabel": "🔬💨 في انتظار شفط الأيروسول والكشف الغاما:", "outputPendingText": "اختر أمرًا لبدء تأين REIMS أو التشعيع العلاجي التشخيصي بالأكتينيوم-225.", "activateBtn": "🚀 تفعيل تشخيص الأيروسول والعلاج الإشعاعي ألفا", "activateNotify": "🔬💨 تمت مزامنة تشخيص iKnife والعلاج الإشعاعي التشخيصي بالأكتينيوم-225!", "resultTemplate": "🔬💨 <b>iKNIFE REIMS و AC-225 ({action}):</b> {desc} <br><strong>⚡ m/z (أو النشاط بالميغابيكريل): {param} | الحالة: {stat}</strong> — نوعية 99.95%.", "interlockNotify": "🛑 تنبيه قفل أمان إشعاعي: تم بلوغ عتبة جرعة ألفا! قطع فوري لحقن الأكتينيوم-225 (0 ميغابيكريل)! SHA-256", "marginAlertNotify": "🛑 تنبيه iKnife REIMS: تم اكتشاف حافة R1 (ذروة PC 34:1 m/z 760.6)! تسلل غشائي — يلزم توسيع جراحي!", "processedNotify": "💨 تمت معالجة تشخيص iKnife / تصويب Ac-225: {action} ({stat}) — تم تأمين حافة R0 والعناقيد الدقيقة"}}}, "nl": {"meta": {"locale": "nl", "name": "Dutch", "nativeName": "Nederlands", "flag": "🇳🇱", "dir": "ltr", "intl": "nl-NL"}, "hub": {"subtitle": "AI-ondersteund platform voor chirurgische simulatie en onderzoek", "tagline": "Academisch platform voor wetenschappelijke experimenten en voice-first chirurgische simulatie.", "academic": {"title": "ACADEMISCH", "subtitle": "Leren · Oefenen · Evalueren"}, "research": {"title": "ONDERZOEK", "subtitle": "Ontwerpen · Experimenteren · Analyseren"}, "simulation": {"title": "SIMULATIE", "subtitle": "Plannen · Simuleren · Vergelijken"}, "clinical": {"title": "KLINISCH", "subtitle": "Beperkte / aparte omgeving"}, "disclaimer": "⚠️ Uitsluitend voor onderzoek, onderwijs en simulatie. Niet bedoeld voor klinische diagnose of behandeling."}, "modes": {"common": {"back": "← Terug", "export": "📥 Exporteren", "voiceDictation": "🎙️ Spraakdictaat", "notAvailable": "n.v.t."}, "academic": {"badge": "ACADEMISCHE MODUS", "heading": "Chirurgisch Leerplatform", "subtitle": "Geannoteerde virtuele casussen, gedetailleerde score, vergelijking met de referentiestrategie.", "libraryTitle": "📚 Educatieve Casusbibliotheek", "startCase": "Starten →", "objectivesCount": "{count} doelstelling{count, plural, one {} other {en}}", "leaderboardTitle": "🏆 Surgical Challenge — Klassement", "noSessions": "Nog geen sessies. Start een casus om te beginnen.", "tableRank": "#", "tableCase": "Casus", "tableScore": "Score", "tableTime": "Tijd", "tableDate": "Datum", "justifTitle": "✍️ Onderbouwing van de strategie", "justifDesc": "Leg uit waarom u voor deze aanpak koos, welke marges werden gehanteerd en welke risicostructuren werden vermeden.", "justifPlaceholder": "Voer hier uw klinische redenering in (spraak of tekst)...", "voiceRecordingStarted": "Spraakopname gestart...", "submitEvaluate": "Indienen & Evalueren →", "justifTooShort": "Geef een uitgebreidere onderbouwing (min. 10 tekens).", "engineNotLoaded": "Academic V2-engine niet geladen.", "examInProgressTitle": "🎓 EXAMEN BEZIG — Casus {caseId}", "gradeToImprove": "📚 TE VERBETEREN", "gradeExcellent": "🏆 UITSTEKEND", "gradeVeryGood": "🥇 ZEER GOED", "gradeGood": "🥈 GOED", "completionTime": "Voltooiingstijd: {min}m {sec}s", "objectiveScore3d": "Objectieve Score (3D)", "expertJuryScore": "Expert-/Jury­score", "aiSocraticReview": "AI Socratische Beoordeling", "aiSocraticExcellent": "Uitstekend", "detail6dEngineTitle": "Detail 6D-motor", "backToHubBtn": "Terug naar Hub", "exportScientificReportBtn": "Wetenschappelijk Rapport Exporteren", "exportingScientificReport": "Wetenschappelijk dossier wordt geëxporteerd (JSON)...", "dimensions": {"anatomy": "Anatomie", "planning": "Planning", "precision": "Precisie", "safety": "Veiligheid", "efficiency": "Efficiëntie", "decision": "Beslissing"}}, "research": {"badge": "ONDERZOEKSMODUS", "heading": "Platform voor Wetenschappelijke Experimenten", "subtitle": "Ontwerp, voer uit en analyseer chirurgische studies. Exporteer uw datasets voor publicatie.", "studiesTitle": "📊 Beschikbare Studies", "studyLabel": "Studie {id}", "launchStudy": "Studie starten →", "sessionsTitle": "📂 Opgeslagen Sessies", "groupLabel": "Groep {group}", "confidencePrompt": "Hoe zeker bent u van het opgestelde plan, op een schaal van 1 tot 10?", "sessionCompleteTitle": "Studie {id} — Sessie Voltooid", "metricTime": "⏱ Tijd", "metricClicks": "🖱 Klikken", "metricVoice": "🎙 Spraak", "metricPlanMods": "📝 Planwijzigingen", "metricErrors": "❌ Fouten", "metricConfidence": "💪 Vertrouwen", "hypothesisLabel": "Hypothese:", "exportDataset": "📥 Dataset exporteren (JSON + CSV)", "noSessions": "Nog geen sessies. Start een studie om gegevens vast te leggen.", "sessionCount": "{count} sessie{count, plural, one {} other {s}} vastgelegd", "lockRequiredAlert": "🔒 ONDERZOEKSSTUDIE-VERGRENDELING VEREIST\nKan de officiële studie \"{protocolId}\" niet starten zonder verbinding met de FastAPI-randomisatieserver.\nVraag de onderzoeker om de uvicorn-server te starten.", "analyticsSessionSummaryTitle": "📊 ANALYTICS Sessieoverzicht", "assignedGroupLabel": "Toegewezen groep:", "loggedEventsLabel": "Geregistreerde gebeurtenissen:", "voiceCommandsLabelV2": "Spraakcommando's:", "uiErrorsLabel": "UI-fouten:", "endStudyBtn": "Studie Beëindigen", "exportDatasetJsonBtn": "Dataset Exporteren (JSON)"}, "simulation": {"badge": "SIMULATIEMODUS", "heading": "Chirurgische Simulatieomgeving", "subtitle": "Virtuele casussen, vergelijkende scenario's, spraakcommando's en 3 AI-niveaus.", "disclaimer": "⚠️ Gesimuleerde resultaten — Niet bedoeld voor echte klinische begeleiding.", "libraryTitle": "📚 CASUSBIBLIOTHEEK", "launchCase": "Simuleren →", "aiLevelTitle": "🤖 AI-niveau", "voiceCommandsTitle": "🎙 Spraakcommando's", "reportTitle": "📊 Simulatierapport", "caseFallback": "Simulatiecasus", "reportTime": "⏱ Tijd", "reportVolResected": "✂️ Gereseceerd vol. [geschat]", "reportVolRemnant": "🫀 Resterend vol. [geschat]", "reportDistance": "📏 Min. afstand", "reportUnsafeMargins": "⚠ Onveilige marges", "reportErrors": "❌ Fouten", "reportVoiceCmds": "🎙 Spraakcommando's", "reportScenarios": "📋 Scenario's", "scoreFinal": "Eindscore", "comparisonDisclaimer": "⚠️ Analytische schatting (equivalente bol) op basis van casusgegevens — geen exacte berekening op een getrianguleerd mesh, niet-klinisch, uitsluitend voor educatief gebruik.", "reportDisclaimer": "⚠️ Volumes/afstanden: analytische schatting (equivalente bol) op basis van casusgegevens — geen exacte berekening op een getrianguleerd mesh, niet bedoeld om een echte klinische ingreep te begeleiden.", "exportJson": "📥 JSON exporteren", "needTwoScenariosAlert": "Maak minstens 2 scenario's (via de knop + of Fork) om ze te vergelijken.", "needTwoScenariosNotify": "⚠ Maak minstens 2 scenario's om ze te vergelijken.", "marginPrompt": "Gewenste resectiemarge voor dit scenario (mm)?", "scenarioDefaultName": "Scenario {letter}", "addScenario": "+ Scenario", "scenarioCreatedNotify": "✅ {name} aangemaakt (Fork van {parent}, marge {margin}mm).", "scenarioSwitchNotify": "🔄 Overgeschakeld naar {name}.", "scenarioOrigin": "start", "comparisonTitle": "⚖️ Scenariovergelijking", "actionsLabel": "Acties", "geometryUnavailable": "⚠️ Geometrie niet beschikbaar voor deze casus — niet berekend.", "volResectedLabel": "Gereseceerd volume [geschat]", "volRemnantLabel": "Resterend volume [geschat]", "distanceToVessel": "Afst. {vessel}", "criticalVesselFallback": "kritiek vat", "marginDeficit": "❌ Marge > beschikbare ruimte (tekort {n} mm)", "preservesTissue": "{name} behoudt meer weefsel (analytische schatting).", "noActionsRecorded": "Geen acties geregistreerd", "caseLoadedLabel": "Casus geladen", "aiMsgObserver": "👁 Observator-AI — Stil. Werk vrij.", "aiMsgAssistant": "🤖 Assistent-AI — Ik waarschuw u als een structuur risico loopt.", "aiMsgAdversary": "⚔️ Tegenstander-AI — Ik zal mijn eigen strategie voorstellen. Verdedig uw plan!", "aiCheckAssistantWarn": "⚠️ [Assistent-AI] Vasculaire structuur op {dist} mm. Onvoldoende marge — aanbeveling ≥ 8 mm.", "aiCheckAssistantOk": "✅ [Assistent-AI] Correcte marge: {dist} mm.", "aiCheckAdversary": "⚔️ [Tegenstander-AI] Posterieure benadering voorgesteld: marge {dist} mm. Resterend volume +8%. Verdedig uw keuze.", "aiLevelStatus": "AI Niv.{level} — {name}", "aiLevelActivatedNotify": "🤖 AI-niveau {level} geactiveerd", "forkLabel": "Fork van {parent} (marge {margin}mm)", "marginParenLabel": "(Marge {mm}mm)", "metricsUnavailableV2": "⚠️ Metingen niet berekend — geometrie niet beschikbaar voor deze casus.", "tradeoffScoreLabel": "Afwegingsscore:", "volResectedEstColon": "Gereseceerd vol. [geschat]:", "volRemnantEstColon": "Resterend vol. [geschat]:", "criticalVesselFixedColon": "Afst. kritiek vat [vast, anatomisch]:", "marginExceedsColonDeficit": "❌ Gevraagde marge > beschikbare ruimte (tekort {n} mm)", "offlineSuffix": "— offline"}, "difficulty": {"beginner": "Beginner", "intermediate": "Gemiddeld", "advanced": "Gevorderd", "expert": "Expert"}, "caseType": {"synthetic": "Synthetische casus", "ai": "AI-gegenereerde casus", "real": "Geanonimiseerde reële casus"}, "organs": {"liver": "Lever", "pancreas": "Pancreas", "kidney": "Nier", "gynecology": "Gynaecologie", "pediatrics": "Pediatrie"}, "aiLevel": {"observer": {"title": "Observator", "desc": "Stil"}, "assistant": {"title": "Assistent", "desc": "Structuurwaarschuwingen"}, "adversary": {"title": "Tegenstander", "desc": "Tegenstrategie"}}}, "or": {"loadingSchedule": "Laden van het OK-schema en de beperkingen...", "connectionError": "Verbindingsfout met de planningsserver.", "moveImpossible": "🔴 Kan de ingreep niet verplaatsen: {reasons}", "warningPrefix": "🟠 Let op: {warnings}", "frozenPrompt": "Dit programma is BEVROREN (Frozen). Voer de administratieve/medische noodreden in om de zaal te wijzigen:", "frozenCancelled": "Wijziging geannuleerd: auditverantwoording vereist voor een bevroren programma.", "slotMoved": "Tijdslot verplaatst en gevalideerd onder beperkingen", "errorPrefix": "Fout: {detail}", "constraintViolated": "Beperking geschonden", "dropUpdateError": "Fout bij het bijwerken", "interventionLabel": "Ingreep: {name}", "roomLabel": "Zaal:", "scheduleLabel": "Tijd:", "freezeOfficial": "🔒 Officiële Bevriezing (Freeze)", "delayRealTime": "⏱ Vertraging / Werkelijke Tijden", "programFrozen": "Officieel programma bevroren en ondertekend (Frozen).", "freezeError": "Fout bij het bevriezen van het programma.", "serverError": "Serverfout", "delayPrompt": "Aantal minuten werkelijke vertraging of voorsprong om te registreren (bv. 30 voor 30 min vertraging):", "delayRecorded": "Vertraging van +{mins} min geregistreerd. Automatische verschuiving van volgende ingrepen in de zaal toegepast.", "realtimeError": "Fout bij registratie van real-time gegevens.", "calculatingPrep": "Berekening van gereedheidsscore en controle van blokkerende factoren...", "conditionsValidated": "{completed} / {total} voorwaarden gevalideerd ({pct}%)", "criticalBlockers": "🔴 Kritieke blokkerende factoren (ingreep niet toegestaan)", "warnings": "🟠 Waarschuwingen", "sectionImaging": "3D-beeldvorming", "sectionSurgery": "Chirurgie", "sectionAnesthesia": "Anesthesie", "sectionBiology": "Laboratorium", "sectionOrTeam": "OK & Team", "sectionEquipment": "Materiaal", "sectionIcu": "IC", "prepLoadError": "Fout bij het laden van de gereedheidsgegevens.", "aiAnalyzing": "De Beperkingenmotor & AI-copiloot analyseert de mogelijkheden...", "optimizeError": "Fout bij het berekenen van de optimalisatie.", "optimizeServerError": "Serverfout tijdens optimalisatie.", "noMovesRequired": "Geen zaalwijziging nodig. Het schema is al optimaal onder de beperkingen.", "patientLabel": "Patiënt: {name}", "assignmentLabel": "Toewijzing:", "applyingOptimization": "Het geselecteerde optimalisatievoorstel wordt toegepast...", "programUpdated": "Programma bijgewerkt en gevalideerd onder beperkingen!", "applyError": "Fout bij het toepassen.", "whatIfPrompt": "Onbeschikbaarheid van een zaal simuleren? Voer de naam/ID van de zaal in (bv. bloc-2 of Zaal 2) of laat leeg:", "whatIfLaunching": "De virtuele \"What-If\"-zandbak wordt gestart...", "whatIfError": "Fout bij het uitvoeren van de simulatie.", "whatIfServerError": "Serverfout bij simulatie", "whatIfResultTitle": "📊 RESULTAAT VIRTUELE SIMULATIE (Geen impact op echte gegevens)", "whatIfScenario": "Scenario:", "whatIfImpacted": "Getroffen ingrepen:", "whatIfReallocations": "Mogelijke herindelingen:", "whatIfDeprogramming": "Te verwachten annuleringen:", "whatIfRecommendation": "Aanbeveling:", "loadingDurationStats": "Duurstatistieken laden...", "noStatsAvailable": "Geen statistische gegevens beschikbaar.", "tableProcedure": "Procedure", "tableSample": "Steekproef", "tableTheoreticalDuration": "Theoretische Duur", "tableRealAverage": "Werkelijk Gemiddelde", "tableMedianP50": "Mediaan P50", "tableP90Predictive": "Voorspellende P90", "tableAiRecommendation": "AI-aanbeveling", "sampleCount": "{count} geval(len)", "statsLoadError": "Kan de statistieken niet laden.", "networkError": "Netwerkfout bij het ophalen van gegevens.", "loadingAuditTrail": "Laden van het OK-auditlogboek...", "noAuditEvents": "Geen auditgebeurtenissen geregistreerd.", "tableTimestamp": "Tijdstempel", "tableUser": "Gebruiker", "tableAction": "Actie", "tableResource": "Bron", "tableLevel": "Niveau", "systemUser": "Systeem", "auditLoadError": "Kan het auditlogboek niet laden.", "loadingRegulatoryStatus": "Regelgevingsstatus laden...", "mdrLoadError": "Kan MDR-status niet ophalen.", "mdrClassification": "📋 Classificatie Medisch Hulpmiddel", "mdrEnvironment": "Omgeving:", "mdrHdsSecurity": "🔒 HDS-conform &amp; Beveiliging", "mdr2faMandatory": "2FA verplicht in productie:", "mdrYour2fa": "Uw gebruikers-2FA:", "mdrEncryption": "pgcrypto-versleuteling (At-Rest):", "yes": "🟢 Ja", "no": "🔴 Nee", "enabled": "🟢 Ingeschakeld", "inactive": "🟠 Inactief", "operational": "🟢 Operationeel", "mdrQualityCi": "🛠️ Kwaliteitsisolatie &amp; CI/CD", "mdrCiPipeline": "Klinische CI-pipeline geïsoleerd:", "mdrIsolatedMain": "🟢 Geïsoleerd (main)", "mdrResearchMode": "Onderzoeksmodus actief:", "mdrResearch": "⚠️ Onderzoek", "mdrProduction": "🟢 Productie", "mdrRuffLinter": "Ruff Linter &amp; Mypy:", "mdrActive": "🟢 Actief", "mdrInactive": "🔴 Inactief", "mdrClinicalData": "📊 Klinische Evaluatiegegevens", "mdrRegisteredPatients": "Geregistreerde Patiënten", "mdrValidatedPlans": "Gevalideerde Plannen", "mdrAuditEvents": "Auditgebeurtenissen", "vetTitle": "🐾 1. VetSurg3D", "vetSubtitle": "Diergeneeskundige chirurgie & volumetrie (hond/paard).", "vetCanine": "Hond", "vetFeline": "Kat", "vetEquine": "Paard", "vetWeightPlaceholder": "Gewicht kg", "vetCalculate": "📐 Diergeneeskundig Volume Berekenen", "vetCalculating": "Berekenen...", "vetError": "Berekeningsfout.", "vetOrganVolume": "✅ Orgaanvolume: {vol} mL<br>Resterend weefsel: <strong>{pct}%</strong> ({safety})", "vetSafe": "🟢 Veilig", "vetSubtotal": "🔴 Subtotaal", "eduTitle": "🎓 2. SurgSim-Edu 3D", "eduSubtitle": "Virtuele simulaties voor academische ziekenhuizen & arts-assistenten.", "eduBrowseCatalog": "📚 Catalogus Academisch Ziekenhuis Doorbladeren", "eduLoading": "Laden...", "eduError": "Laadfout.", "orKpiTitle": "📊 3. OR-Optimizer KPI", "orKpiSubtitle": "Audit van OK-rendabiliteit & logistiek.", "orKpiAudit": "📈 OK-rendabiliteit Auditeren", "orKpiAnalyzing": "Analyseren...", "orKpiError": "KPI-fout.", "orKpiOccupancy": "Bezettingsgraad: <strong>{pct}%</strong><br>Geschatte besparingen: <strong>{savings} € / maand</strong>", "radiomicsTitle": "🧪 4. SurgData Onderzoek", "radiomicsSubtitle": "Export van Geanonimiseerde Datasets (RUO).", "radiomicsExport": "🔬 3D AI-dataset Exporteren", "radiomicsExporting": "Exporteren...", "radiomicsPatientRequired": "Een geselecteerde patiënt is vereist.", "radiomicsServerUnavailable": "Server niet beschikbaar.", "radiomicsExported": "✅ Dataset geëxporteerd!<br>Pseudo-ID: <code>{id}</code><br>Geanalyseerde 3D-voxels: {count}"}, "common": {"close": "Sluiten", "cancel": "Annuleren", "save": "Opslaan", "apply": "Toepassen", "export": "Exporteren", "import": "Importeren", "edit": "Bewerken", "delete": "Verwijderen", "loading": "Laden…", "search": "Zoeken…", "yes": "Ja", "no": "Nee", "warning": "Waarschuwing", "error": "Fout", "success": "Gelukt", "info": "Info", "notImplemented": "Niet geïmplementeerd in dit prototype", "notCalculated": "Nog niet berekend", "none": "Geen", "unknown": "Onbekend"}, "nav": {"plan": "Plan", "dicom": "DICOM", "twin": "Digitale Tweeling", "ar": "Augmented Reality", "audit": "Auditlogboek", "surgai": "SurgAI", "surgsim": "SurgSim", "surgor": "OK-AI", "surgnav": "GPS-navigatie", "surgvoice": "Assistent", "mdrFda": "Conformiteit", "researchToggle": "Onderzoeksmodus — toont experimentele modules die niet klinisch gevalideerd zijn (mijlpalen M21-M40)", "dashToggle": "OK-dashboard", "orToggle": "Operatiekamermodus (gedeeld scherm)", "touchToggle": "Aanraakmodus (vergrote knoppen)", "readonlyToggle": "Alleen-lezen modus (OK-team)", "themeToggle": "Thema", "hubToggle": "Module/specialisme wisselen", "settingsToggle": "Technische instellingen (Gemini, backend) — alleen onderzoeks-/onderhoudsmodus", "patientsToggle": "Patiënten", "logout": "Afmelden", "preanesthesieToggle": "Pre-anesthesiedossier", "icuFollowupToggle": "IC-opvolging", "exitOr": "OK-modus verlaten", "exitDash": "Dashboard verlaten", "researchBanner": "🔬 ONDERZOEKSMODUS ACTIEF — de hierboven getoonde modules zijn experimenteel (mijlpalen M21-M40), niet klinisch gevalideerd, en mogen niet worden gebruikt voor besluitvorming in de operatiekamer.", "researchModeOnNotify": "🔬 Onderzoeksmodus geactiveerd — verkennende modules + technische Instellingen (⚙) zichtbaar", "researchModeOffNotify": "✅ Klinische modus — alleen gevalideerde OK-tools worden weergegeven", "researchModeDeniedNotify": "🔒 Onderzoeksmodus is niet inbegrepen in uw abonnement ({plan}) — neem contact op met een beheerder om te upgraden."}, "login": {"title": "Inloggen", "username": "Gebruikersnaam", "password": "Wachtwoord", "submit": "Inloggen", "twofaHint": "6-cijferige code (authenticator-app) of een herstelcode.", "twofaCode": "Code", "demoAccountLabel": "💡 Demo-account:", "demoPasswordLabel": "Wachtwoord:"}, "lang": {"selectorLabel": "Taal", "en": "English", "fr": "Français", "ar": "العربية", "nl": "Nederlands", "changed": "Taal gewijzigd naar {language}"}, "sidebar": {"ageSex": "Leeftijd / Geslacht", "weightHeight": "Gewicht / Lengte", "diagnosis": "Diagnose", "orPlanning": "OK-planning", "notScheduledToday": "Vandaag niet ingepland", "urgencyRed": "🔴 Spoedeisend", "urgencyOrange": "🟠 Semi-spoedeisend", "urgencyGreen": "🟢 Gepland", "switchModule": "Module wisselen", "room": "Zaal {n}", "statusOngoing": "Bezig", "statusDone": "Voltooid", "statusPlanned": "Gepland"}, "toolbar": {"importDicom": "DICOM importeren", "realSegmentation": "Echte AI-segmentatie", "realSegmentationTitle": "Voert een echte segmentatie-inferentie (TotalSegmentator) uit op de backend en laadt de resulterende echte 3D-meshes", "pacs": "PACS", "pacsTitle": "Zoek een onderzoek in het PACS (QIDO-RS) en importeer een serie (WADO-RS)", "threshold3d": "3D-drempelwaarde", "voxelsToggle": "Het gevoxeliseerde DICOM-orgaan tonen/verbergen in de 3D-scène", "recenter": "Centreren", "recenterTitle": "Camera opnieuw centreren op het DICOM-orgaan (toets R)", "reset": "Reset", "resetTitle": "Rotatie + zoom resetten (spatiebalk)", "spin": "Draaien", "spinTitle": "Automatische rotatie in-/uitschakelen"}, "analysis": {"sectionTitle": "Volumetrie (berekend op het huidige 3D-volume)", "organVolume": "Orgaanvolume", "resectionVolume": "Geschat resectievolume", "remnant": "Functionele rest", "realSegmentationBadge": "🏥 echte segmentatie", "proceduralBadge": "⚠ procedurele schatting, niet-klinisch", "proceduralNote": "Schatting afgeleid van het weergegeven voxelvolume, geen gevalideerde AI-segmentatie. Gebruik “🔬 Echte AI-segmentatie” voor een berekening op basis van TotalSegmentator.", "riskScoreTitle": "Operatief risicoscore", "riskScoreBadge": "⚠ interne heuristiek, niet klinisch gevalideerd", "riskScoreBasedOn": "gebaseerd op {count} afwijkende meetwaarde(n), leeftijd, spoedeisendheid — interne formule, geen gevalideerde risicoschaal (bijv. POSSUM, ASA)", "riskLow": "Laag", "riskModerate": "Matig", "riskHigh": "Hoog", "scenarios": "Voorspellende scenario's", "scenarioOptimistic": "Optimistisch", "scenarioExpected": "Verwacht", "scenarioUnfavorable": "Ongunstig", "remnantFunctional": "{pct}% functionele rest", "recalculate": "↻ Herberekenen", "recalculated": "Analyse herberekend", "exportPlan": "⭳ Plan exporteren (DICOM SR / JSON)"}, "staging": {"tnmTitle": "🔬 TNM-stadiëring", "tField": "T (Tumor)", "nField": "N (Lymfeklieren)", "mField": "M (Metastasen)", "hbpParams": "🏥 HPB-parameters", "bclcField": "BCLC", "childPughField": "Child-Pugh", "colorectalParams": "🏥 Colorectale parameters", "crmField": "CRM", "thoracicParams": "🫁 Thoracale parameters", "vemsField": "Preoperatief FEV1", "volumetryTitle": "📊 Volumetrie", "volumetryRealBadge": "🏥 echt", "volumetryEstimateBadge": "⚠ schatting", "organVolumeReal": "Orgaanvolume (echte AI-segmentatie)", "organVolumeEstimate": "Orgaanvolume (huidig volume, schatting)", "tumorVolume": "Gesegmenteerd tumorvolume", "noSegmentation": "(geen segmentatie)", "computeResectability": "🔄 Resectabiliteit berekenen", "auditLogTitle": "📋 Auditlogboek ({count} item{count, plural, one {} other {s}})", "auditLogEmpty": "Geen actie geregistreerd.", "resectable": "✅ Resectabel — Operatie geïndiceerd", "notResectable": "❌ Momenteel niet resectabel — Alternatief bespreken", "exportReport": "⭳ Stadiëringsoverzicht exporteren", "reportExported": "Stadiëringsrapport geëxporteerd (JSON)"}, "dicom": {"importing": "{count} bestand(en) lezen…", "resampling": "Resamplen van {n}³ voxels…", "loaded": "{count} DICOM-slice(s) geladen — Scrollen=navigeren, WW={ww} WL={wl}", "reconstructing": "3D-reconstructie…", "voxelizing": "Voxeliseren bij drempelwaarde {threshold} HU…", "realVolumeShown": "✓ Echt DICOM-volume in 3D weergegeven — drempelwaarde {threshold} HU, {count} voxel(s) in {chunks} chunk(s)", "noVolume": "Geen DICOM-volume om weer te geven", "noVoxelsAboveThreshold": "Geen voxel ≥ {threshold} HU — verlaag de drempelwaarde in de 🎚-balk", "hidden": "DICOM-voxels verborgen — procedurele anatomie hersteld", "shown": "Echte DICOM-voxels weergegeven", "reconstructionFailed": "3D-reconstructie mislukt: {error}"}, "settings": {"title": "Instellingen", "geminiKey": "Gemini API-sleutel", "geminiModel": "Gemini-model", "geminiModelHint": "gemini-flash-latest verwijst altijd naar de nieuwste Flash-release (voorkomt deprecaties). Alternatieven: {alt1}, {alt2}, of {alt3} (sluit op 22-07-2026).", "groqKey": "Groq API-sleutel (fallback)", "backendUrl": "Backend-URL", "surgeonName": "Naam chirurg", "localAiTitle": "🔒 Lokale AI (offline-first — geen netwerk, geen datalek)", "localAiHint": "Indien hieronder geconfigureerd, wordt de lokale AI ALTIJD als eerste geprobeerd, vóór Gemini/Groq/backend — de prompt en het antwoord verlaten nooit het apparaat (WebGPU) of het lokale netwerk (server).", "localServer": "Lokale server (Ollama / llama.cpp, OpenAI-compatibele API)", "localServerModel": "Modelnaam op de lokale server", "webgpuModel": "Lokaal model in de browser (WebGPU, WebLLM)", "webgpuChecking": "WebGPU-ondersteuning controleren…", "loadModel": "⬇ Model laden", "unloadModel": "✕ Verwijderen uit geheugen", "webgpuHint": "Eerste keer laden: ~1-5 GB download (gecachet door de browser via IndexedDB — daarna direct). Vereist Chrome/Edge 113+ (desktop of recente Android); nog niet beschikbaar op Safari/Firefox. Eenmaal geladen wordt er geen netwerkverzoek meer gedaan om een antwoord te genereren.", "offlineCertifiedTitle": "📚 Gecertificeerde offlinemodus", "offlineCertifiedHint": "Forceert vooraf berekende antwoorden, ook als er een AI-sleutel is geconfigureerd. Geen netwerkoproep naar Gemini/Groq."}, "patients": {"title": "Patiëntendatabase", "searchPlaceholder": "Zoek een patiënt…", "editCurrent": "✎ Huidige patiënt bewerken", "updated": "Patiënt bijgewerkt (lokaal)", "syncedBackend": "Gesynchroniseerd met backend"}, "preanesthesia": {"title": "🩺 Pre-anesthesiedossier", "forPatient": "Patiënt van de actieve module", "asaScore": "ASA-score", "asaUrgence": "Spoedgeval (U)", "mallampati": "Mallampati-score", "intubationDifficile": "Verwachte moeilijke intubatie", "jeuneSolide": "Nuchter voor vast voedsel (u)", "jeuneLiquide": "Nuchter voor heldere vloeistoffen (u)", "antecedents": "Voorgeschiedenis", "allergies": "Allergieën", "traitement": "Chronische behandeling", "checklist": "OK-checklist", "anesthesiste": "Anesthesist", "conclusion": "Conclusie / beleid", "updated": "Pre-anesthesiedossier bijgewerkt (lokaal)"}, "icuFollowup": {"title": "🛌 IC-opvolging", "forPatient": "Patiënt van de actieve module", "newEntry": "+ Nieuwe beoordeling", "sofaRespiration": "Ademhaling", "sofaCoagulation": "Stolling", "sofaHepatique": "Lever", "sofaCardio": "Cardiovasculair", "sofaNeuro": "Neurologisch", "sofaRenal": "Nier", "sofaTotal": "SOFA totaal:", "apache2": "APACHE II-score (0-71)", "rass": "RASS", "gcsEye": "Ogen (1-4)", "gcsVerbal": "Verbaal (1-5)", "gcsMotor": "Motorisch (1-6)", "gcsTotal": "Glasgow totaal:", "ventilation": "Mechanische beademing", "ventMode": "Modus", "bilan": "Vochtbalans", "entrees": "Inname (ml)", "sorties": "Uitscheiding (ml)", "bilanNet": "Netto balans:", "notes": "Notities", "auteur": "Auteur", "add": "+ Beoordeling toevoegen"}, "audit": {"title": "📜 Auditlogboek", "filterByPatient": "Filteren op patiënt", "filterByUser": "Filteren op gebruiker"}, "ai": {"chatPlaceholder": "Stel uw vraag…", "briefingTitle": "🤖 Automatische AI-samenvatting", "briefingProcedure": "{procedure} aanbevolen voor deze patiënt.", "briefingRemnant": "Geschatte functionele rest: {pct}% (veiligheidsdrempel: {threshold}%)", "briefingRisk": "Operatief risico:", "briefingWatch": "⚠️ Aandachtspunten: {metrics}", "briefingNoIssue": "✅ Geen afwijkende meetwaarde gedetecteerd.", "respondInLanguage": "Antwoord uitsluitend in het {language}."}, "modals": {"mdrFda": {"title": "🛡️ Conformiteitsstatus (prototype, niet gecertificeerd) & concept CCAM-dictaat", "notCertifiedBanner": "⚠️ Niet-gecertificeerd prototype: deze software heeft GEEN CE MDR 2017/745-certificering, GEEN FDA 510(k)-indiening en GEEN formele HIPAA-audit ondergaan. Onderstaande informatie beschrijft de werkelijke status van het prototype, geen behaalde conformiteit.", "regulatoryStateTitle": "📋 Werkelijke regelgevingsstatus", "dictationTitle": "🗣️ Concept CCAM-dictaat (demonstratie)", "dictationHint": "⚠️ Trefwoordherkenning op een vooraf gedefinieerde tekst — GEEN echte spraakherkenning of NLP-engine. Volledig te valideren vóór elk gebruik:", "reportPreviewTitle": "📄 Conceptrapport (demonstratie, geen juridisch document):"}, "respCycle": {"title": "🌊 Ademhalingscyclus — vereenvoudigde kinematische formule, niet klinisch gevalideerd", "banner": "🌊 Illustratieve kinematische formule: sinusvormige benadering van de ademhalingsbeweging (14 cycli/min), niet gekalibreerd op deze patiënt, niet klinisch gevalideerd — geen echte eindige-elementenoplosser.", "launchLive": "▶ Live cyclus starten", "pause": "⏸️ Pauzeren", "displacementTitle": "📍 Anatomische verplaatsing (formule, realtime)", "respiratoryPhase": "Ademhalingsfase", "craniocaudalShift": "Craniocaudale verplaatsing (ΔZ)", "anteroposteriorShift": "Anteroposterieure kanteling (ΔY)", "registrationTitle": "🛠️ Niet-rigide registratie — niet geïmplementeerd", "registrationHint": "⚠️ Er is geen elastische registratie-oplosser geïmplementeerd in dit prototype (zie backend/biomechanics_engine.py `/elastic-registration`, dat nu eerlijk \"not_implemented\" teruggeeft in plaats van verzonnen waarden).", "pneumoPressure": "Pneumoperitoneumdruk (parameter)", "registerButton": "🔄 Registreren op AR-stereovisie / echografie (niet geïmplementeerd)"}}, "i18nAdmin": {"title": "🌐 Vertaaleditor", "hint": "Wijzigingen worden lokaal (browser) opgeslagen als overschrijvingslaag, zonder de bronbestanden te wijzigen. Exporteer de JSON om ze permanent toe te passen.", "keyColumn": "Sleutel", "exportLanguage": "{language}-JSON exporteren", "importLanguage": "{language}-JSON importeren", "resetOverrides": "Lokale wijzigingen resetten", "overridesSaved": "Vertaalwijzigingen lokaal opgeslagen", "overridesReset": "Lokale vertaalwijzigingen gewist", "imported": "{language}-vertalingen geïmporteerd ({count} sleutel(s))"}, "plan": {"plannedProcedure": "Geplande procedure", "metricsTitle": "{specialty}-metingen", "checklistTitle": "Preoperatieve checklist", "exportedViaBackend": "Export gegenereerd via de backend", "exportedLocal": "Lokale export gegenereerd (backend niet geconfigureerd)"}, "workflow": {"patient": "Mijn patiënt", "analysis": "AI-analyse", "simulation": "Simulatie", "or": "OK"}, "pipeline": {"loadingTitle": "PACS → AI → 3D-tweeling pipeline bezig...", "realTitle": "ECHTE ANATOMIE — Patiëntspecifieke 3D-tweeling", "demoTitle": "DEMOMODUS — Procedurele anatomie (alleen training)", "estimateTitle": "LOKALE SCHATTING — Backend voor echte segmentatie niet beschikbaar (niet-klinisch)"}, "catalog": {"keyProcedures": "Belangrijkste procedures", "planCycleTitle": "Validatiecyclus van het plan", "implantsTitle": "Implantaten & Materiaal", "hudModule": "Module", "hudPatient": "Patiënt", "hudProcedure": "Procedure", "hudMode": "Modus", "chatYou": "U", "chatAI": "AI", "aiGreeting": "Hallo, ik ben uw chirurgische assistent voor {specialty}. Hoe kan ik u helpen?"}, "chrome": {"certBanner": "Demonstratieprototype — Uitsluitend voor educatief gebruik", "researchBanner": "🔬 ONDERZOEKSMODUS ACTIEF — de hierboven getoonde modules zijn experimenteel (Mijlpalen M21-M40), niet klinisch gevalideerd, en mogen niet worden gebruikt voor besluitvorming in de operatiekamer.", "exploratoryLab": "🔬 Verkennend Lab", "tabPlan": "Plan", "tabStaging": "🎯 Staging", "tabImplants": "Implantaten", "tabAiChat": "AI-chat", "tabAnalysis": "Analyse", "progressLabel": "Voortgang:", "finishScore": "Afronden & Score", "quit": "✕ Afsluiten", "clicksLabel": "Klikken:", "voiceLabel": "Spraak:", "planModsLabel": "Planwijzigingen:", "timerLabel": "Timer:", "finishSession": "Sessie Afronden", "simReportBtn": "Simulatierapport", "validatedPlan": "Gevalideerd plan", "approachLabel": "Toegang:", "estimatedDurationLabel": "Geschatte duur:", "moduleLoadedHbp": "Module {specialty} geladen — Toegewijde, gevalideerde hepatische pipeline", "moduleLoadedGeneric": "🔬 Specialisme {specialty}: Onderzoeksmodule (generieke segmentatie task=total, lagere kwaliteit)", "dashShort": "Dash", "orShort": "OK", "orCenterShort": "OK Center", "researchModuleBanner": "🛑 ONDERZOEKSMODULE — NIET-GECERTIFICEERDE PROTOTYPESIMULATIE, NIET VOOR ECHTE PATIËNTBESLISSINGEN"}, "reports": {"flightPlan": {"title": "Chirurgisch Vluchtplan", "subtitle": "GeneralSurgPlan3D MIMO — Oncology Suite 2026", "prototypeBadge": "PROTOTYPE — NIET GECERTIFICEERD", "prototypeTitle": "Niet-gecertificeerd prototype — zie 🛡️ MDR-conformiteit", "dateLabel": "Datum:", "patientSection": "👤 Patiëntidentificatie", "nameLabel": "Naam:", "patientIdLabel": "Patiënt-/PACS-ID:", "surgeonLabel": "Verantwoordelijke chirurg:", "surgeonFallback": "Oncologisch Chirurg", "specialtyLabel": "Specialisme:", "stagingSection": "🎯 Stadiëring & Beslissing", "tnmLabel": "TNM-classificatie:", "bclcLabel": "BCLC-/Child-score:", "statusLabel": "Algehele status:", "notCalculated": "Niet berekend", "vascularSection": "🟢 Vasculaire Mapping & Couinaud-Segmentectomie (Brisbane 2000)", "tumorSegmentsLabel": "Geïnfiltreerde tumorsegmenten:", "none": "Geen", "resectionLabel": "Aanbevolen chirurgische ingreep:", "marginsSection": "🔵 3D-veiligheidsmarges (R0/R1)", "distCutLabel": "Afstand tumor - snijvlak:", "distVesselLabel": "Afstand tumor - vaten:", "volumetrySection": "🟡 Volumetrie & Parenchymateuze Ischemie", "flrRawLabel": "Ruwe anatomische FLR:", "flrFunctionalLabel": "Functionele gevasculariseerde FLR:", "congestedVolLabel": "Congestief / necrotisch volume:", "hashFootnote": "Ketenvingerafdruk (lokale niet-cryptografische hash, djb2 — geen SHA-256, mag niet worden gepresenteerd als juridisch integriteitsbewijs):", "printBtn": "🖨️ Afdrukken / Opslaan als PDF", "signatureLabel": "Elektronische handtekening:"}, "operativePlan": {"popupBlockedWarning": "Sta pop-ups toe om de PDF te exporteren", "generatingNotify": "📄 Operatief plan PDF genereren en afdrukken wordt gestart...", "docTitle": "Chirurgisch Operatieplan", "subtitle": "PREOPERATIEF CHIRURGISCH PLANNINGSRAPPORT", "dateLabel": "Datum:", "fileNumberLabel": "Dossiernr.:", "patientSection": "👤 Patiëntidentificatie &amp; Diagnose", "patientLabel": "• Patiënt:", "yearsOld": "jaar", "diagnosisLabel": "• Diagnose:", "specialtyLabel": "• Specialisme:", "referringSurgeonLabel": "• Verwijzend Chirurg:", "referringSurgeonFallback": "Dr. Martin", "bioSection": "🩸 Preoperatief Laboratoriumonderzoek &amp; Risicoscores", "bilirubinLabel": "• Bilirubine:", "inrLabel": "INR:", "creatinineLabel": "Creatinine:", "metricsSection": "📐 3D-resectiemetingen &amp; Volumetrie (FLR)", "totalOrganVolLabel": "• Totaal Orgaanvolume:", "resectedVolPlannedLabel": "• Gepland Gereseceerd Volume:", "flrLabel": "• Toekomstige Leverrest (FLR):", "marginLabel": "• Tumorveiligheidsmarge:", "validationSection": "✍️ Validatie, Handtekeningen &amp; WORM Cryptografische Traceerbaarheid", "planStatusLabel": "• Planstatus:", "planStatusFallback": "Concept", "seniorSignerLabel": "• Senior Ondertekenaar:", "notSignedFallback": "Niet ondertekend", "clinicalNotesLabel": "• Klinische Opmerkingen:", "noSpecificNotes": "Geen specifieke opmerkingen", "cryptoFingerprintLabel": "WORM SHA-256 cryptografische vingerafdruk:", "footerLine1": "⚠️ CHIRURGISCH PLANNINGSDOCUMENT — KLINISCH PROTOTYPE GEBRUIKT ONDER DEZE MDR 2017/745 KLASSE IIB VOORBEREIDING", "footerLine2": "Dit cryptografisch verzegelde document moet vóór de operatieve ingreep in het Elektronisch Patiëntendossier (EPD) worden opgenomen."}, "planReview": {"modalTitle": "✍️ Workflow voor Beoordeling, Validatie & Ondertekening van het Plan", "lifecycleLabel": "📋 Levenscyclus van het Operatieplan:", "currentStateTitle": "📌 Huidige Status van het Plan", "patientIdLabel": "• Patiënt-ID:", "planVersionLabel": "• Planversie:", "currentStatusLabel": "• Huidige Status:", "authorLabel": "• Auteur / Maker:", "authorFallback": "Dr. Martin (Chirurg)", "seniorSignatureLabel": "• Handtekening Senior:", "pendingSignature": "In afwachting...", "workflowActionsTitle": "✍️ Workflowacties", "markReviewedBtn": "👀 Markeren als Peer-Reviewed", "validateSignBtn": "✍️ Plan Valideren & Ondertekenen (Senior Chirurg)", "printExportBtn": "📄 Operatieplan Afdrukken / Exporteren (PDF)", "rejectBtn": "❌ Plan Afwijzen (Correcties Aanvragen)", "notesLabel": "Beoordelingsnotities / Opmerkingen Senior Chirurg", "notesPlaceholder": "Voeg klinische observaties of wijzigingsvereisten toe...", "historyLabel": "Geschiedenis van Handtekeningen & WORM Cryptografische Tijdstempels:", "historyInitEntry": "[DRAFT] 2026-08-05T16:00:00Z — Plan v1.0 geïnitialiseerd door het chirurgische team.", "closeBtn": "Sluiten", "draftStatus": "Concept", "reviewedStatus": "Beoordeeld (Reviewed)", "validatedSignedStatus": "Gevalideerd & Ondertekend", "rejectedStatus": "Afgewezen", "notesFallbackReviewed": "Plan beoordeeld door de assistent-chirurg.", "notesFallbackValidated": "Chirurgisch plan gevalideerd en ondertekend door de senior chirurg.", "notesFallbackRejected": "Reden niet gespecificeerd", "signerSignedText": "Prof. Dupont (Senior Chirurg) - Ondertekend ✍️", "reviewedNotify": "👀 Chirurgisch plan gemarkeerd als Peer-Reviewed", "validatedNotify": "✍️ Chirurgisch plan gevalideerd & ondertekend met SHA-256 cryptografische vingerafdruk", "rejectedNotify": "❌ Chirurgisch plan afgewezen — Correcties aangevraagd: {notes}", "historyReviewed": "[REVIEWED] {ts} — Peer-reviewed: {notes}", "historyValidated": "[VALIDATED] {ts} — Ondertekend door Prof. Dupont (SHA-256 verzegeld)", "historyRejected": "[REJECTED] {ts} — Afgewezen: {notes}", "peerReviewStage": "Peer review", "finalValidationStage": "Definitieve validatie & Ondertekening", "modificationNoteStart": "Elke wijziging van een gevalideerd plan creëert automatisch een nieuwe versie", "modificationNoteEnd": "verzegeld met een SHA-256-hash."}}, "clinical": {"resectionNoTumor": "Geen tumorsegment afgebakend", "resectionRightHep": "🔴 Standaard Rechter Hepatectomie (S5-S6-S7-S8)", "resectionLeftHep": "🔴 Standaard Linker Hepatectomie (S2-S3-S4)", "resectionBisegRight": "🟠 Rechter Laterale Bisegmentectomie (S6-S7)", "resectionLobLeft": "🟡 Linker Lobectomie / Bisegmentectomie S2-S3", "resectionTargeted": "🟢 Gerichte Anatomische Segmentectomie ({segments})", "marginNoTumor": "Geen tumor", "marginR1": "❌ R1-MARGE (< 1 mm) - Recidiefrisico", "marginNarrowR0": "⚠️ SMALLE R0-MARGE (1-5 mm)", "marginSafeR0": "✅ VEILIGE R0-MARGE (> 5 mm)", "ischemiaCritical": "❌ KRITIEKE ISCHEMIE — Onvoldoende functionele FLR (< 30%)", "ischemiaWarning": "⚠️ LET OP — Grensgeval functionele FLR bij cirrotische lever", "perfusionPreserved": "✅ PERFUSIE / DRAINAGE BEHOUDEN", "marginNotCalculated": "Niet berekend", "ischemiaNormal": "Normaal", "noTumorDetected": "Geen tumor gedetecteerd"}, "exploratoryLab": {"modalTitle": "🔬 Verkennend Lab (M21-M40)", "warning": "⚠️ Deze modules zijn hoogst speculatief en hebben geen klinische validatie. Ze zijn voorbehouden aan geavanceerd onderzoek.", "surgAi": "🧠 SurgAI", "surgSim": "⚡ SurgSim", "aiOr": "🏥 AI-operatiekamer", "gpsNav": "🛰️ GPS-navigatie", "voiceAssistant": "🎙️ Spraakassistent", "genAiComplications": "🧬 GenAI-complicaties", "telesurgery": "🛰️ PQC-telechirurgie & Bio-4D", "bciInterface": "🧠 BCI- & Cortex-interface", "nanoroboticSwarm": "🔬 Nanorobotzwerm", "l5Autonomy": "🤖⚡ L5-autonomie & Laser", "reprogramming": "🧬✨ Herprogrammering & Sonogenetica", "ramanSpectrometry": "⚡🔬 Raman-spectrometrie & Plasma", "cryoIre": "❄️☢️ Cryo-IRE & BNCT-neutronen", "organoids": "🧬🌱 4D-organoïden", "iknife": "🔬💨 iKnife REIMS & Ac-225"}, "nextgen": {"surgai": {"title": "🧠 SurgAI-Decision — AI-besluitvorming &amp; Verklaarbaarheid (SHAP / Grad-CAM 3D)", "mdrLabel": "⚠️ MDR-/FDA-vereiste (Zero-Black-Box):", "mdrText": "Elk chirurgisch voorstel wordt onderbouwd door Shapley-gewichten (SHAP) en gelokaliseerd met 3D Grad-CAM-attentie op de Digitale Tweeling.", "strategyLabel": "Selecteer een door AI gemodelleerde chirurgische strategie", "optA": "Optie A: Laparoscopische Rechter Hepatectomie (Aanbevolen — Voorspeld succes: 94,2%)", "optB": "Optie B: Parenchymateuze Segmentectomie VII-VIII (Voorspeld succes: 88,5%)", "optC": "Optie C: Transhepatische Radiofrequente Thermo-ablatie (Voorspeld succes: 76,0%)", "prognosisTitle": "📊 Prognostische Analyse &amp; Risico's", "durationLabel": "• Geschatte operatieduur:", "eblLabel": "• Geschat bloedverlies (EBL):", "riskLabel": "• Morbi-mortaliteitsrisicoscore:", "riskLow": "(Laag)", "adjustMarginLabel": "Veiligheidsmarge aanpassen (", "adjustMarginSuffix": " mm):", "marginUpdateNotify": "SHAP-berekening bijgewerkt voor marge {value} mm", "gradcamTitle": "🔥 3D Grad-CAM-attentie", "shapRecommendation": "💡 SHAP-aanbeveling: Eerst dissectie van de rechter Glissoniaanse pedikel om het bloedingsrisico met 18% te verminderen.", "approveBtn": "🚀 Dit plan goedkeuren &amp; DICOM-SR exporteren", "approveNotify": "Plan goedgekeurd en geëxporteerd als DICOM-SR naar de Orthanc PACS!", "criticalZonePrefix": "Kritieke zone gedetecteerd:", "vesselMshv": "Middelste Suprahepatische Ader (MSHV)", "criticalZoneSuffix": "op 1,8 mm van het geprojecteerde snijvlak."}, "surgsim": {"title": "⚡ SurgSim-PhysX — Reologische Simulatie &amp; Afklemmen (WASM/WebGPU)", "engineLabel": "⚡ Continuümfysica-engine:", "engineText": "Berekent in real time ($< 100\\text{ ms}$) op WebGPU de hyperelastische vervormingen en ischemie bij virtuele vasculaire ligatie.", "rheologyTitle": "🧪 Weefselreologie &amp; Biofysica", "youngLabel": "Elasticiteitsmodulus E (", "youngSuffix": " kPa - Normale lever):", "youngNotify": "Weefselelasticiteitsmodulus E herijkt naar {value} kPa", "poissonLabel": "Poisson-verhouding ν (", "poissonSuffix": " - Bijna onsamendrukbaar):", "clampSimTitle": "🩸 Afklem- &amp; Ischemiesimulator", "clampRightHepatic": "🔴 Rechter Leverslagader Afklemmen", "clampPortalBranch": "🔵 Rechter Poortadertak Afklemmen", "clampPedicle": "🟡 Pedikel VI-VII Afklemmen", "vesselRightHepatic": "Rechter Leverslagader", "vesselPortalBranch": "Rechter Poortadertak", "vesselPedicle": "Glissoniaanse Pedikel Segment VI-VII", "statusSecured": "VEILIG ✅", "statusOptimal": "OPTIMAAL ⭐", "flrResultLabel": "Directe Volumetrische Uitkomst (FLR):"}, "surgor": {"title": "🏥 SurgOR-AI — Slimme Operatiekamer &amp; MILP-orkestratie", "milpLabel": "🤖 Realtime MILP-solver:", "milpText": "Vermindert de wisseltijd (turnover time) met 18% door dynamische herplanning.", "reoptimizeBtn": "⚡ Planning Heroptimaliseren", "reoptimizeNotify": "⚡ OK-planning heroptimaliseerd door AI! Berekende winst: +22 minuten", "roomsStatusTitle": "📍 Status Operatiekamers (Realtime HL7 / IoT)", "thRoom": "Zaal", "thSpecialty": "Specialisme", "thStatus": "Status / Fase", "thTracking": "RFID-materiaaltracking", "room1": "Zaal 1", "room2": "Zaal 2", "room3": "Zaal 3", "specNeuro": "Neurochirurgie", "specHbpCurrent": "HBP (Huidige patiënt)", "specTrauma": "Traumatologie", "statusMeningioma": "🟢 Meningioomresectie bezig (T+110m)", "statusSterileSetup": "🟢 Steriele opstelling — Incisie over 12m", "statusEmergency": "🟡 Tussengevoegde spoedgeval (Polytrauma)", "trackMicroscope": "Zeiss KINEVO-microscoop verbonden", "trackHepBox": "Hepatectomieset #4 RFID UHF ✅", "trackAmplifier": "3D-beeldversterker in zaal", "hemoMonitorTitle": "📈 Peroperatieve Hemodynamische Anesthesiemonitor (IEEE 11073 / HL7 v2.x)", "bisOptimal": "BIS 44 — Optimale Anesthesie ✅", "mapLabel": "Gemiddelde Arteriële Druk (MAP)", "hrLabel": "Hartslag", "spo2Label": "SpO₂ / EtCO₂", "ischemiaToleranceLabel": "Ischemietolerantie", "alertText": "ℹ️ Hemodynamische stabiliteitsindex op 98,4%. Klaar voor vasculair afklemmen of parenchymateuze resectie.", "pringleBtn": "🔴 Pringle-afklemming Simuleren (18 min)", "renalBtn": "🟠 Renale Afklemming Simuleren (22 min)", "amiBtn": "🟡 AMI-afklemming Simuleren (35 min)"}, "surgnav": {"title": "🛰️ SurgNav-GPS — Chirurgische Navigatie &amp; Elastische Registratie", "regLabel": "🛰️ Niet-Rigide Elastische Registratie (60-100 Hz):", "regText": "Compenseert dynamisch voor ademhaling en weefselvervorming met submillimeter nauwkeurigheid.", "precisionTitle": "🎯 Precisie &amp; Actieve Sensoren", "rmsLabel": "• Gemiddelde kwadratische fout (RMS):", "rmsValue": "0,38 mm (Optimaal 🎯)", "refSensorLabel": "• Referentiesensor:", "endoTrackingLabel": "• Endo-cavitaire tracking:", "latencyLabel": "• Motion-to-Photon-latentie:", "latencyValue": "11,4 ms (< 15 ms OK)", "navModesTitle": "⚙️ Navigatiemodi", "rigidRegBtn": "📍 Initiële Rigide Registratie Starten (ICP)", "rigidRegNotify": "Initiële ICP rigide registratie herijkt op 42 botpunten", "elasticRegBtn": "🌊 Elastische Registratie Inschakelen (Ademhaling)", "elasticRegNotify": "Niet-rigide elastische registratie ingeschakeld via stereoscopische tracking!"}, "surgvoice": {"title": "🎙️ SurgVoice-LLM — Handsfree Steriele Spraakassistent", "asrLabel": "🎙️ Offline Spraakherkenning:", "asrText": "Whisper-Medical model (WASM GPU) + actieve OK-ruisfiltering.", "listeningBadge": "🟢 Actief luisteren", "testTitle": "🗣️ Test een chirurgisch spraakcommando in steriele kleding:", "cmd1Display": "\"Surgi, toon alleen de suprahepatische aders en verberg het skelet.\"", "cmd1Response": "Veneus systeem succesvol geïsoleerd (laag 4 actief).", "recognizedNotify": "🎙️ Commando herkend (42ms GPU-latentie):", "cmd2Display": "\"Surgi, wat is de afstand tussen mijn CUSA-scalpel en de tumorrand?\"", "cmd2Response": "De huidige afstand is 4,2 millimeter.", "cmd3Display": "\"Surgi, start het dicteren van het CCAM-operatieverslag.\"", "cmd3Response": "Gestructureerde dictatiemodus ingeschakeld: sectie Laparoscopische Benadering wordt opgenomen.", "ttsLabel": "Gesynthetiseerd spraakantwoord (TTS):", "ttsPlaceholder": "Klaar voor uw instructies in de operatiekamer..."}, "webgpuCut": {"title": "✂️ WebGPU Virtuele Snede — Real-Time Resectie &amp; FLR-Berekening", "introLabel": "✂️ Simulatie van Leverresectie:", "introText": "Snijd het parenchym virtueel langs een interactief 3D-snijvlak met 60 Hz herberekening van het resterende levervolume (FLR) en oncologische marges.", "segmentsLabel": "Selecteer de te verwijderen Couinaud-segmenten:", "s6": "S6 (Post-Inf)", "s7": "S7 (Post-Sup)", "s5": "S5 (Ant-Inf)", "s8": "S8 (Ant-Sup)", "cutPlaneTitle": "📐 Snijvlakparameters", "axialAngleLabel": "• Axiale hoek:", "offsetLabel": "• Positie (offset):", "marginLabel": "• Berekende oncologische marge:", "marginPlaceholder": "— (eerst berekenen)", "voxelSourceLabel": "Procedureel 64³-volume", "hintText": "ℹ️ Als één of meer Couinaud-segmenten hierboven zijn aangevinkt, hebben deze voorrang op het vrije vlak voor de resectieberekening (anatomische segmentectomie). Anders wordt het vrije vlak (hoek/offset) gebruikt.", "flrAnalysisTitle": "📊 FLR-Volumetrische Analyse (Berekend)", "totalVolLabel": "• Totaal Orgaanvol.:", "resectedVolLabel": "• Resectievol.:", "remnantVolLabel": "• Resterend Vol. (FLR):", "safetyPending": "⏳ Eerst berekenen...", "segmentsCountedLabel": "Meegetelde segmenten in FLR:", "includeManualLabel": "Handmatige segmenten opnemen", "comparatorTitle": "⚖️ Strategievergelijker", "saveAsABtn": "📥 Opslaan als Strategie A", "saveAsBBtn": "📥 Opslaan als Strategie B", "thCriteria": "Criteria", "thStrategyA": "Strategie A", "thStrategyB": "Strategie B", "noStrategySaved": "Sla minstens één strategie op om te vergelijken.", "recalcBtn": "🔄 FLR Herberekenen", "recalcNotify": "FLR herberekend op huidig volume", "applyBtn": "✂️ Virtuele Snede Toepassen op Digitale Tweeling"}, "raymarching": {"title": "🌟 Ray-Marching DVR — UI-mockup, niet geïmplementeerd", "mockupLabel": "⚠️ UI-mockup:", "mockupText": "er is geen echte volumetrische ray-marching rendering geïmplementeerd in dit prototype (klassieke Three.js r128 / WebGL). Onderstaande knoppen tonen een melding maar wijzigen de 3D-rendering niet.", "transferFnTitle": "🎛️ Transferfuncties (CT-windowing) — mockup", "presetParenchyma": "🟢 Hepatisch Parenchym (40 HU / 150 HU)", "presetVessels": "🔴 Vaatboom &amp; Pedikels (+120 HU)", "presetTumors": "🟡 Hypervasculaire Laesies &amp; Tumoren", "presetBones": "⚪ Botstructuren (+400 HU)", "specsTitle": "⚡ Beoogde Specificaties (niet gemeten)", "specsIntro": "Waar een echte implementatie naar zou streven, ter indicatie — geen van deze waarden wordt geproduceerd door functionele code in dit prototype:", "specEngine": "• Uitvoerings-engine: WGSL Compute Shaders (niet geïmplementeerd)", "specSampling": "• Beoogde bemonsteringssnelheid: 512 straalstappen / pixel", "specLighting": "• Globale verlichting: Monte-Carlo AO (niet geïmplementeerd)"}, "sihInterop": {"title": "🏥 ZIS-interoperabiliteit (HL7 v2 & FHIR R4/R5)", "connectionLabel": "🏥 Verbinding Ziekenhuisinformatiesysteem (ZIS):", "connectionText": "Bidirectionele uitwisseling met het EPD/PACS via de internationale standaarden HL7 v2 (MLLP) en FHIR R4/R5 (REST JSON).", "fhirApiTitle": "🔥 FHIR R4/R5 REST API", "fhirResourceLabel": "Te exporteren FHIR-resource", "optPatient": "Patient (Identiteit & Voorgeschiedenis)", "optImagingStudy": "ImagingStudy (DICOM-series & PACS)", "optDiagnosticReport": "DiagnosticReport (3D-volumetrie & Segmenten)", "optProcedure": "Procedure (FHIR R5 Chirurgische Planning)", "exportFhirBtn": "🌐 FHIR-resource Exporteren (JSON)", "fhirPreviewLabel": "Voorbeeld van FHIR-resource:", "fhirPlaceholderStatus": "Selecteer een resource en klik op Exporteren", "hl7SenderTitle": "📡 HL7 v2 MLLP-zender (Poort 2575)", "hl7EventTypeLabel": "HL7-gebeurtenistype", "optAdtA08": "ADT^A08 — Bijwerken patiëntendossier", "optOrmO01": "ORM^O01 — Aanvraag chirurgische ingreep", "optOruR01": "ORU^R01 — Operatie-/3D-verslag", "mllpHostLabel": "MLLP-host", "mllpPortLabel": "Poort", "sendMllpBtn": "📡 MLLP-frame Verzenden (<VT>HL7<FS><CR>)", "hl7FrameLabel": "Verzonden HL7 v2-frame & Bevestiging (ACK):", "hl7Pending": "Wachten op verzending van een HL7 v2 MLLP-frame..."}, "webxr": {"title": "🥽 WebXR Spatial Computing — Apple Vision Pro & Meta Quest 3", "streamLabel": "🥽 120 Hz Stereoscopische Streaming:", "streamText": "Holografische Digitale Tweeling in AR Pass-Through-modus met ultralage latentie (< 9 ms Motion-to-Photon) voor geleide chirurgie.", "lidarBadge": "LiDAR + Eye-Tracking 👁️", "telemetryTitle": "📡 Telemetrie & Ruimtelijke Kalibratie", "deviceLabel": "• Verbonden headset:", "deviceValue": "Apple Vision Pro (visionOS 2.0)", "trackingLabel": "• Ruimtelijke tracking:", "trackingValue": "NDI Polaris + ARKit Markerloos", "rmsLabel": "• RMS-uitlijnfout:", "rmsValue": "0,35 mm (Sub-mm 🎯)", "fovealLabel": "• Foveale rendering:", "fovealValue": "Dynamische Eye-Tracking Pro ✅", "recalibrateBtn": "📍 Patiëntuitlijning Herkalibreren (42 punten)", "gestureTitle": "🖐 Handsfree Gebarensimulatie (26 DOF)", "pinchBtn": "🤏 Knijpgebaar Testen: 3D-rotatie", "pinchLabel": "2-Vinger Knijpgebaar", "pinchResult": "🔄 Vloeiende stereoscopische 360°-rotatie van het orgaan", "raycastBtn": "👆 Wijsvinger-Raycast Testen: CUSA-snede", "raycastLabel": "Wijsvinger-Raycast", "raycastResult": "✂️ Ultrasone CUSA-incisie geleid door virtuele aanwijzer", "grabBtn": "✊ Grijpen Testen: PBD-retractie", "grabLabel": "Grab & Hold", "grabResult": "🖐 Atraumatische retractie van de parenchymranden", "gesturePending": "Wachten op gebaardetectie door infraroodcamera's...", "launchBtn": "🚀 Immersieve Navigatie Starten", "launchNotify": "🥽 WebXR-stereoscopische immersieve modus geactiveerd in de Vision Pro-headset!"}, "robotic": {"title": "🤖 RAS Robotconsole — Intuitive Da Vinci 5 & Medtronic Hugo", "teleopLabel": "🤖 Haptische Teleoperatie (1000 Hz):", "teleopText": "7-DOF kinematische telemetrie en live weerstandsberekening in Newton op de PBD Digitale Tweeling.", "fiberBadge": "Glasvezel Latentie 0,8 ms ⚡", "armsTitle": "🦾 Telemetrie van de 4 Robotarmen", "thArm": "Arm", "thInstrument": "Instrument (RFID)", "thForce": "Kracht", "thStatus": "Status", "arm1": "Arm 1 (Rechts)", "arm2": "Arm 2 (Links)", "arm3": "Arm 3 (Camera)", "arm4": "Arm 4 (Hulp)", "statusActive": "🟢 Actief", "statusFixed": "🔵 Vast", "statusHolding": "🟡 Vasthouden", "recalibrateBtn": "⚙️ Kinematisch Nulpunt Herkalibreren (7-DOF)", "recalibrateNotify": "🔄 Denavit-Hartenberg kinematische kalibratie uitgevoerd en verzegeld (SHA-256)", "hapticTitle": "⚡ Simulatie Haptische Feedback & Veiligheid", "lightGraspBtn": "🟢 Lichte Greep Simuleren (1,4 N)", "lightGraspLabel": "Lichte Greep", "lightGraspResult": "🟢 Normale weerstand — Leverparenchym intact.", "moderateTractionBtn": "🟡 Matige Tractie Simuleren (3,2 N)", "moderateTractionLabel": "Matige Tractie", "moderateTractionResult": "🟡 Hoge weerstand — Maximale elastische spanning bereikt.", "criticalOverloadBtn": "🔴 Kritieke Overbelasting Simuleren (4,8 N - Interlock)", "criticalOverloadLabel": "Kritieke Overbelasting", "criticalOverloadResult": "🛑 SCHEUR-ALARM! Drempel van 4,5 N overschreden. Interlock-vergrendeling geactiveerd!", "hapticPending": "Haptisch systeem gereed, wachtend op weefselinteractie...", "activateBtn": "🚀 Console-teleoperatie Activeren", "activateNotify": "🤖 Da Vinci 5-console real-time gekoppeld aan de PBD Digitale Tweeling!", "hapticFeedbackLabel": "🤖 HAPTISCHE FEEDBACK", "forceMeasuredLabel": "⚡ Gemeten kracht:", "fiberLoopActive": "— 1000 Hz glasvezellus actief.", "safetyAlertNotify": "🛑 ROBOTVEILIGHEIDSALARM: Kracht {force} N > drempel 4,5 N! Noodvergrendeling geactiveerd en verzegeld (SHA-256)", "hapticProcessedNotify": "🦾 Haptische simulatie verwerkt: {action} ({force} N) — Weefsel stabiel"}, "genai": {"title": "🧬 GenAI Complicatievoorspeller & Robotische Microchirurgie (50:1)", "transformerLabel": "🧬 Spatio-Temporal Video Transformer (70B):", "transformerText": "Videovoorspelling met een horizon van 15 sec voor peroperatieve risico's (vasculaire rupturen, galwegleks) en filtering van micro-robotische trilling (< 5 µm).", "videosBadge": "52.400 OK-video's • 50:1 Schaal 🎯", "microsurgeryTitle": "🔬 Robotische Microchirurgie (Symani / Zeiss)", "consoleLabel": "• Micro-robotische console:", "consoleValue": "Symani Surgical System (MMI)", "kinematicLabel": "• Kinematische demultiplicatie:", "kinematicValue": "50:1 (10 mm → 0,2 mm)", "tremorLabel": "• RMS-trillingfiltering:", "tremorValue": "< 3,2 µm (Sub-micron ✨)", "opticsLabel": "• Stereoscopische optiek:", "opticsValue": "Zeiss KINEVO 40x 3D 4K", "calibrateBtn": "⚖️ Microvasculaire Bewegingsschaal Kalibreren (50:1)", "calibrateNotify": "✨ 50:1 micro-robotische demultiplicatie gekalibreerd en verzegeld in audit_logs (SHA-256)", "predictTitle": "🔮 Peroperatieve GenAI-voorspelling Simuleren", "neuroBtn": "🧠 Neuro Simuleren: Willis-aneurysmaruptuur (84%)", "neuroEvent": "💥 Willis-aneurysmaruptuur", "neuroResult": "🛑 KRITIEK ALARM (84%): Overmatige wandspanning! AI-actie: Proximale carotisclip afklemmen.", "hbpBtn": "🫀 Lever Simuleren: Galwegbreuk Rechter Kanaal (88%)", "hbpEvent": "🌊 Galwegbreuk Rechter Kanaal", "hbpResult": "🔴 GALWEGLEK-ALARM (88%): Doorsnijding te dicht bij de hilus! AI-actie: AR WebXR ICG visualiseren.", "ophthBtn": "👁️ Retina Simuleren: Stabiele Anastomose (12%)", "ophthEvent": "👁️ Retinale Anastomose", "ophthResult": "🟢 VEILIG TRAJECT (12%): Trilling gefilterd tot 3,2 µm — Stabiele anastomose.", "predictPending": "GenAI Transformer-model gereed — OK-videofeed en FEM-bewaking bezig...", "activateBtn": "🚀 GenAI-bewaking & Microchirurgie Activeren", "activateNotify": "🧬 Spatio-Temporal GenAI- en micro-robotische modellen live geactiveerd op de Digitale Tweeling!", "predictionLabel": "🧬 GENAI-VOORSPELLING", "probabilityLabel": "⚡ Kans op 15s:", "transformerFootnote": "— 70B Transformer (52.400 OK-video's).", "criticalAlertNotify": "🛑 GENAI-COMPLICATIEALARM ({prob}%): {event}! Preventieve AI-actie aanbevolen en verzegeld in audit_logs (SHA-256)", "predictionComputedNotify": "🧬 GenAI-voorspelling berekend: {event} ({prob}%) — Stabiel traject"}, "pqcBioprint": {"title": "🛰️ PQC (Post-Kwantum) Telechirurgie & Intraoperatief 4D Bioprinten", "infoLabel": "🛰️ Kwantum LEO 6G-netwerk & Bio-4D:", "infoText": "Onschendbare intercontinentale teleoperatie (NIST CRYSTALS-Kyber/Dilithium) en in-situ printen van gevasculariseerde celtransplantaten bij 37°C.", "badge": "Latentie 14,2 ms • BioX 6-assig ✨", "specsTitle": "🔒 Kwantumtelemetrie & 6G-satellietverbinding", "spec1Label": "Sleutelencapsulatie:", "spec1Value": "NIST ML-KEM-1024 (Kyber)", "spec2Label": "Digitale handtekening:", "spec2Value": "NIST ML-DSA-87 (Dilithium)", "spec3Label": "Intercontinentale verbinding:", "spec3Value": "Parijs ↔ Tokio (6G LEO Mesh)", "spec4Label": "Latentie & jitter:", "spec4Value": "14,2 ms / ±0,08 ms (Nul jitter ⚡)", "calibrateBtn": "🔐 PQC-kwantumsleutels heronderhandelen (60s rotatie)", "calibrateNotify": "✨ PQC-kwantum telechirurgiesessie onderhandeld en verzegeld (SHA-256 / Dilithium-5)", "actionsTitle": "🧬 Intraoperatief 4D-bioprinten simuleren", "action1Btn": "🫀 Leverpatch S6 printen (42,5 mL / 191s)", "action1Label": "Leverpatch S6", "action1Desc": "🟢 G-code berekend: in-situ printen van parenchym (Alginaat-MSC-VEGF @ 37°C) in 191s.", "action2Btn": "🧠 Craniale dura mater printen (14 mL / 63s)", "action2Label": "Craniale dura mater", "action2Desc": "🔵 G-code berekend: steriele, waterdichte reconstructie van craniale dura mater met bioactieve collafilm in 63s.", "action3Btn": "🦴 Mandibulair transplantaat printen (31,2 mL / 140s)", "action3Label": "Mandibulair transplantaat", "action3Desc": "🟡 G-code berekend: osteo-inducerend gevasculariseerd keramiek-PEEK scaffold bioprinten in 140s.", "outputPending": "CELLINK BioX 6-assige bioprintarm wacht op resectiecoördinaten...", "activateBtn": "🚀 PQC-verbinding & 4D-bioprinten activeren", "activateNotify": "🛰️ PQC LEO 6G-telechirurgie en 4D-bioprinter live gekoppeld aan de Digital Twin!", "resultTemplate": "🛰️ <b>4D-BIOPRINTEN ({site}):</b> {desc} <br><strong>⚡ Volume: {vol} mL | {layers}</strong> — CELLINK BioX 6-assige arm bij 37°C.", "calibratedNotify": "🛰️ 4D-bioprinten gekalibreerd op {site} ({vol} mL) — G-code verzonden via het PQC LEO 6G-netwerk"}, "bciHaptic": {"title": "🧠 Brein-Computer Interface (BCI 1024-Ch) & Directe Corticale Haptische Feedback (S1)", "infoLabel": "🧠 Gedachtebesturing & Corticale Tast:", "infoText": "Sub-milliseconde SNN-decodering (< 2,4 ms) van de motorische cortex (M1) en S1-microstimulatie om weefselweerstand in de cortex te voelen!", "badge": "1024 Kanalen • SNN Loihi 2 ⚡", "specsTitle": "⚡ Corticale Telemetrie & SNN-decodering", "spec1Label": "Corticaal implantaat:", "spec1Value": "Neuralink N1-Surg / Precision 1024-Ch", "spec2Label": "Neuromorfe decoder:", "spec2Value": "Intel Loihi 2 SNN-chip", "spec3Label": "Decoderingslatentie:", "spec3Value": "2,1 ms (Sub-milliseconde ⚡)", "spec4Label": "M1-intentienauwkeurigheid:", "spec4Value": "99,2% @ 30 kHz sampling", "calibrateBtn": "⚖️ M1/S1-corticale matrix kalibreren (30 kHz)", "calibrateNotify": "✨ Kalibratie van M1/S1-corticale matrix geslaagd — Synaptische nauwkeurigheid 99,2% (SHA-256)", "actionsTitle": "🧠 Gedachtegestuurde teleoperatie simuleren", "action1Btn": "🧠 Willis-aneurysma clippen met gedachte (2,4 N / 53 µA)", "action1Label": "Willis-aneurysma clippen", "action1Desc": "🟢 M1-intentie gedecodeerd: aneurysmaclip geplaatst — Vloeiende, realistische S1-tastsensatie in de cortex.", "action2Btn": "🫀 Lever doorsnijden met gedachte (4,2 N / 92 µA)", "action2Label": "Doorsnijding leverparenchym", "action2Desc": "🟡 M1-intentie gedecodeerd: leverdoorsnijding — Intense S1-sensatie (92 µA) wijst op dicht parenchym.", "action3Btn": "🛑 Anti-vermoeidheidsinterlock simuleren (< 2,1 ms)", "action3Label": "Noodinterlock", "action3Desc": "🛑 WAARSCHUWING COGNITIEVE VERMOEIDHEID (>85%): Onmiddellijke neurale ontkoppeling! Actuatoren vergrendeld en S1-pulsen afgesneden.", "outputPending": "SNN-decoder gereed, wacht op actiepotentialen van de motorische cortex...", "activateBtn": "🚀 BCI-link & S1 corticale tast activeren", "activateNotify": "🧠 1024-kanaals Brein-Computer Interface en S1-stimulatie gekoppeld aan de Digital Twin!", "resultTemplate": "🧠 <b>M1-INTENTIE \\ S1-HAPTIEK ({action}):</b> {desc} <br><strong>⚡ PBD-kracht: {force} N | S1-stimulatie: {icms} @ 200 Hz</strong> — Loihi 2 SNN-chip (< 2,1 ms).", "interlockNotify": "🛑 BCI-INTERLOCKWAARSCHUWING: Kritieke vermoeidheids-/spanningsindex! Onmiddellijke neurale ontkoppeling (SHA-256)", "processedNotify": "🧠 BCI-commando verwerkt: {action} ({force} N) — S1-haptische feedback {icms} waargenomen in de cortex"}, "nanoSwarm": {"title": "🔬 Nanorobotzwerm (5M eenheden) & In-Vivo Moleculaire Oncologie (CRISPR-Cas9)", "infoLabel": "🔬 Micro-Vasculaire Navigatie & AMF-Hyperthermie:", "infoText": "3D magnetische geleiding van 5 miljoen DNA-Origami/Fe3O4-nanorobots naar micrometastasen en CRISPR-Cas9-afgifte bij 43,5°C!", "badge": "5.000.000 eenheden • SPION Fe3O4 ⚡", "specsTitle": "⚡ Zwermtelemetrie & Magnetische Gradiënt", "spec1Label": "Actieve eenheden:", "spec1Value": "5.000.000 nanobots (< 100 nm)", "spec2Label": "Kernmateriaal:", "spec2Value": "Superparamagnetisch SPION Fe3O4", "spec3Label": "Tafelspoelen:", "spec3Value": "SurgMag 6-assige gradiëntarray (0,85 T/m)", "spec4Label": "Antigene targeting:", "spec4Value": "Anti-EGFR / Anti-VEGF (98,4%)", "calibrateBtn": "🧲 Magnetisch gradiëntveld kalibreren (0,85 T/m)", "calibrateNotify": "✨ Kalibratie van 0,85 T/m magnetisch veld en zwermsynchronisatie geslaagd (SHA-256)", "actionsTitle": "🔬 In-vivo oncolytische interventie simuleren", "action1Btn": "🔬 Zwerm naar lever-micrometastase S8 leiden (1,2 T/m)", "action1Label": "Geleiding lever-micrometastase S8", "action1Desc": "🟢 Magnetische geleiding 1,2 T/m: 4.985.000 nanorobots geconvergeerd op micrometastase S8 — EGFR-binding bevestigd.", "action2Btn": "🧬 CRISPR-Cas9-afgifte activeren (AMF 43,5°C)", "action2Label": "AMF-geactiveerde CRISPR-Cas9-afgifte", "action2Desc": "🟢 AMF-activering 150 kHz (43,5°C): CRISPR-Cas9 KRAS-G12D-afgifte in uitvoering — 99,1% tumorapoptose, 100% gezond parenchym intact.", "action3Btn": "🛑 Noodstop & demagnetisatie simuleren", "action3Label": "Noodstop", "action3Desc": "🛑 WAARSCHUWING VASCULAIRE DICHTHEID: Onmiddellijke demagnetisatie van tafelspoelen! Zwerm verspreid in normale fysiologische stroom.", "outputPending": "Nanorobotzwerm circuleert in de microvasculatuur, wacht op geleidingsvectoren...", "activateBtn": "🚀 Zwermgeleiding & CRISPR-oncologie activeren", "activateNotify": "🔬 Zwerm van 5M nanorobots en magneetspoelen live gekoppeld aan de Digital Twin!", "resultTemplate": "🔬 <b>NANOROBOTZWERM ({action}):</b> {desc} <br><strong>⚡ Telemetrie: {stat} | Gradiënt: {param} T/m (of °C)</strong> — EGFR-binding 98,4%.", "interlockNotify": "🛑 NANOROBOTZWERM-WAARSCHUWING: Nooddemagnetisatie geactiveerd! Zwerm veilig verspreid (SHA-256)", "processedNotify": "🔬 Nanorobotcommando verwerkt: {action} ({stat}) — Geen schade aan parenchym"}, "autoLaser": {"title": "🤖⚡ Autonome Robotchirurgie Niveau 5 & Laserlassen (EPLW 1470 nm)", "infoLabel": "🤖⚡ STAR-5-autonomie & Laserlassen:", "infoText": "Med-VLA RT-2-model bestuurt microchirurgie bij 10.000 FPS OCT met albumine-ICG laserfusie (Burst > 280 mmHg)!", "badge": "STAR-5-autonomie • 1470 nm laser ⚡", "specsTitle": "⚡ Autonome AI-telemetrie & 3D-OCT", "spec1Label": "VLA-engine:", "spec1Value": "Med-PaLM 3 Robotics / RT-2", "spec2Label": "Autonomiegraad:", "spec2Value": "STAR-5 (100% autonoom)", "spec3Label": "Trackingsensor:", "spec3Value": "SurgOCT Interferometer (10.000 FPS)", "spec4Label": "Uitvoeringssnelheid:", "spec4Value": "5,2x sneller (0 trilling)", "calibrateBtn": "⚖️ VLA-engine & laserkop kalibreren (1470 nm)", "calibrateNotify": "✨ Kalibratie van VLA-model en 1470 nm-laserkop geslaagd — Latentie 0,78 ms (SHA-256)", "actionsTitle": "🤖 L5-uitvoering & laserfusie simuleren", "action1Btn": "🤖 Autonome arteriële anastomose + laser (285 mmHg)", "action1Label": "Autonome arteriële anastomose", "action1Desc": "🟢 STAR-5-uitvoering: micro-anastomose leverarterie — waterdichte 12,5 J/cm² laserlas (Burst 285 mmHg).", "action2Btn": "🔥 Laserlassen galwegen (14,0 J/cm² / 319 mmHg)", "action2Label": "Laserlassen galwegen", "action2Desc": "🟢 STAR-5-uitvoering: laserlassen van de galweg — Albumine-ICG gepolymeriseerd in 5,6s zonder lekkage of nietjes.", "action3Btn": "🛑 Directe menselijke overname (< 1 ms)", "action3Label": "Menselijke overname", "action3Desc": "🛑 OVERNAMEWAARSCHUWING (< 1 ms): Actuatoren direct overgedragen aan chirurg via BCI/Stem! Laser beveiligd.", "outputPending": "STAR-5 VLA-engine gereed, wacht op selectie van de autonome handeling...", "activateBtn": "🚀 L5-autonomie & laserlassen activeren", "activateNotify": "🤖⚡ STAR-5-autonomie en laserlassen live gekoppeld aan de Digital Twin!", "resultTemplate": "🤖⚡ <b>L5-AUTONOMIE & LASERLASSEN ({action}):</b> {desc} <br><strong>⚡ Kracht/Fluentie: {param} J/cm² | Weerstand: {stat}</strong> — RT-2 VLA-engine (< 0,8 ms).", "interlockNotify": "🛑 MENSELIJKE OVERNAMEWAARSCHUWING (< 1 ms): Controle teruggegeven aan chirurg via BCI! Laser beveiligd (SHA-256)", "processedNotify": "🤖 Autonome L5-uitvoering geslaagd: {action} ({stat}) — Hermetische weefselfusie gegarandeerd"}, "epiSono": {"title": "🧬✨ In-Vivo Epigenetische Herprogrammering & Diepe Sonogenetica (OSKM / FUS 1,2 MHz)", "infoLabel": "🧬✨ Verjonging & Sonogenetica:", "infoText": "Door gefocusseerd ultrageluid geactiveerde (FUS 1,2 MHz) afgifte van Yamanaka-factor (OSKM) mRNA-LNP's: -20 jaar op de epigenetische klok zonder teratoomrisico!", "badge": "OSKM -20 jaar • FUS 1,2 MHz 🌱", "specsTitle": "⚡ Epigenetische telemetrie & UCNP-optogenetica", "spec1Label": "Verjongingsfactoren:", "spec1Value": "Yamanaka mRNA-LNP (Oct4, Sox2, Klf4, c-Myc)", "spec2Label": "Klokregressie:", "spec2Value": "-20,4 jaar (0,00% teratoomrisico)", "spec3Label": "FUS-bundel:", "spec3Value": "SurgFUS Phased Array (1,2 MHz / 0,85 MPa)", "spec4Label": "UCNP-nanodeeltjes:", "spec4Value": "NIR 980 nm → Blauw 470 nm conversie", "calibrateBtn": "🌱 FUS-bundels (1,2 MHz) & NIR-laser (980 nm) kalibreren", "calibrateNotify": "✨ Kalibratie van FUS-bundels 1,2 MHz en UCNP 980 nm-excitatie geslaagd (SHA-256)", "actionsTitle": "🧬 In-vivo verjonging & modulatie simuleren", "action1Btn": "🌱 Verjonging leverkwab na ischemie (-20 jaar)", "action1Label": "Post-ischemische leververjonging", "action1Desc": "🟢 FUS-activering 0,85 MPa: OSKM-afgifte in leverzone S6/S7 — Epigenetische klok 20,4 jaar teruggezet. Celvitaliteit 90,5%.", "action2Btn": "🌟 Optogenetische antifibrose-modulatie (UCNP 980 nm)", "action2Label": "Optogenetische antifibrose-modulatie", "action2Desc": "🟢 NIR-laserexcitatie 980 nm → 470 nm via UCNP's: Collagenase-activering — Fibroseklaring van 94,8% zonder huidbreuk.", "action3Btn": "🛑 Anti-teratoom-veiligheidsvergrendeling simuleren", "action3Label": "Anti-teratoomvergrendeling", "action3Desc": "🛑 ONCOGENE INTERLOCKWAARSCHUWING: Onmiddellijke stopzetting van FUS-pulsen! Anti-teratoomveiligheid 100% gegarandeerd (SHA-256).", "outputPending": "FUS-transducer en mRNA-LNP-vectoren gereed, wachten op weefseltargeting...", "activateBtn": "🚀 Epigenetische verjonging & sonogenetica activeren", "activateNotify": "🧬✨ Epigenetische herprogrammering en sonogenetica gekoppeld aan de Digital Twin!", "resultTemplate": "🧬✨ <b>VERJONGING & SONOGENETICA ({action}):</b> {desc} <br><strong>⚡ FUS-druk / NIR-laser: {param} MPa (of mW/cm²) | Klok: {stat}</strong> — OSKM mRNA-LNP.", "interlockNotify": "🛑 ONCOGENE INTERLOCKWAARSCHUWING: Anti-teratoomvergrendeling geactiveerd! Geen cellulaire transformatie (SHA-256)", "processedNotify": "🧬 Epigenetisch verjongingscommando verwerkt: {action} ({stat}) — Weefsel geregenereerd"}, "ramanPlasma": {"title": "⚡🔬 CARS/SERS Ramanspectroscopie & Atmosferisch Koud Plasma (CAP / RONS)", "infoLabel": "⚡🔬 Optische biopsie < 10 ms & R0-plasma:", "infoText": "1000 Hz CARS/SERS Raman-trillingsspectroscopie en atmosferische koudplasmastraal voor gerichte apoptotische eradicatie van infiltraten zonder thermische schade!", "badge": "R0 99,8% • CAP He/Ar 37°C ⚡", "specsTitle": "⚡ Telemetrie Ramansonde & Plasmaverstuiver", "spec1Label": "Optische biopsie:", "spec1Value": "CARS/SERS glasvezelsonde @ 1000 Hz", "spec2Label": "Latentie & specificiteit:", "spec2Value": "7,4 ms | R0/R1-specificiteit: 99,8%", "spec3Label": "Koudplasmastraal:", "spec3Value": "Atmosferisch CAP (He/Ar 98/2% @ 36,8°C)", "spec4Label": "Reactieve soorten:", "spec4Value": "RONS (H₂O₂, NO₂⁻, ONOO⁻) — Apoptose 99,99%", "calibrateBtn": "🌱 Ramansonde (1000 Hz) & CAP-straal kalibreren (12,5 kV)", "calibrateNotify": "✨ Kalibratie van Ramansonde 1000 Hz en plasmagenerator 12,5 kV geslaagd (SHA-256)", "actionsTitle": "🔬 Ramanbiopsie & plasma-eradicatie simuleren", "action1Btn": "⚡ Optische biopsie van resectieplak (R0-marge)", "action1Label": "Optische biopsie van resectieplak", "action1Desc": "🟢 1000 Hz CARS/SERS optische biopsie op S7-plak: geen afwijkende nucleïnepiek gedetecteerd bij 1575 cm⁻¹. R0-marge gecertificeerd.", "action2Btn": "🔬 Koudplasma-eradicatie van R1-infiltraat (CAP 37°C)", "action2Label": "Koudplasma-eradicatie van R1-infiltraat", "action2Desc": "🟢 CAP-koudplasmastraal (12,5 kV / 36,8°C) op micro-infiltraat: selectieve RONS-geïnduceerde apoptose zonder schade aan edele vaten.", "action3Btn": "🛑 Anti-boog-veiligheidsvergrendeling simuleren (0 kV)", "action3Label": "Anti-boogvergrendeling", "action3Desc": "🛑 IONISATIE-INTERLOCKWAARSCHUWING: Plasma hoogspanning afgesneden (0,0 kV)! Elektrische-boogbeveiliging actief (SHA-256).", "outputPending": "CARS Ramansonde en koudplasmaverstuiver gereed voor margeanalyse...", "activateBtn": "🚀 Raman- & koudplasmadiagnostiek activeren", "activateNotify": "⚡🔬 Ramanspectroscopie en koud plasma gekoppeld aan de Digital Twin!", "resultTemplate": "⚡🔬 <b>RAMANSPECTROSCOPIE & CAP-PLASMA ({action}):</b> {desc} <br><strong>⚡ CAP-spanning / Frequentie: {param} kV (of Hz) | Resultaat: {stat}</strong> — RONS-apoptose.", "interlockNotify": "🛑 IONISATIE-INTERLOCKWAARSCHUWING: Hoogspanning afgesneden (0 kV)! Elektrische boog veilig vermeden (SHA-256)", "processedNotify": "⚡ Raman/Plasma-commando verwerkt: {action} ({stat}) — Geen tumorresidu, R0 gecertificeerd"}, "cryoBnct": {"title": "❄️☢️ Onomkeerbare Cryo-Elektroporatie (nsPEF) & Intraoperatieve Neutronen-BNCT", "infoLabel": "❄️☢️ Niet-thermische hilaire ablatie & BNCT-neutronen:", "infoText": "Nanoseconde-elektroporatie in contact met grote vaten zonder trombose, en sub-cellulair alfaverval (5 µm) via boor-10 neutronenvangst!", "badge": "nsPEF 30 kV/cm • BNCT ¹⁰B 2,34 MeV ❄️", "specsTitle": "❄️ Telemetrie nsPEF-generator & BNCT-bron", "spec1Label": "Cryo-IRE:", "spec1Value": "nsPEF 300 ns @ 30 kV/cm + Joule-Thomson -20°C", "spec2Label": "Vasculaire integriteit:", "spec2Value": "100% collageenmatrix behouden", "spec3Label": "BNCT-neutronenbron:", "spec3Value": "Epithermisch (0,5 eV - 10 keV) @ 1,2x10⁹ n/cm²/s", "spec4Label": "Kernreactie:", "spec4Value": "¹⁰B + n → ⁴He (α) + ⁷Li (2,34 MeV over 7 µm)", "calibrateBtn": "🌱 nsPEF-generator & BNCT-bundel kalibreren", "calibrateNotify": "✨ Kalibratie van nsPEF-generator (30 kV/cm) en BNCT-neutronenbundel geslaagd (SHA-256)", "actionsTitle": "🔬 Cryo-IRE & BNCT-bestraling simuleren", "action1Btn": "❄️ nsPEF-ablatie leverhilus (zonder trombose)", "action1Label": "nsPEF-ablatie leverhilus", "action1Desc": "🟢 nsPEF Cryo-IRE-ablatie (30 kV/cm / -20°C) in contact met de vena portae: 99,9% dodelijke tumornanoporatie zonder denaturatie van vasculair collageen.", "action2Btn": "☢️ BNCT-neutronenbestraling (¹⁰B-BPA alfa)", "action2Label": "BNCT-neutronenbestraling", "action2Desc": "🟢 Epithermische BNCT-bestraling op geaccumuleerd ¹⁰B-BPA (65 ppm): sub-cellulair alfaverval (7 µm). 100% van infiltrerende tumorcellen geëlimineerd.", "action3Btn": "🛑 Neutronendosimetrie-vergrendeling simuleren (0 n/cm²)", "action3Label": "Dosimetrievergrendeling", "action3Desc": "🛑 NEUTRONENDOSIMETRIE-INTERLOCKWAARSCHUWING: absorptiedrempel bereikt! Onmiddellijke bronafsluiting (0,0 n/cm²/s). SHA-256-afscherming.", "outputPending": "nsPEF cryo-elektroporatiegenerator en BNCT-neutronenbron gereed...", "activateBtn": "🚀 Intraoperatieve Cryo-IRE & BNCT activeren", "activateNotify": "❄️☢️ Cryo-IRE en BNCT gekoppeld aan de Digital Twin!", "resultTemplate": "❄️☢️ <b>CRYO-IRE & BNCT-NEUTRONEN ({action}):</b> {desc} <br><strong>⚡ nsPEF-gradiënt / Boor: {param} kV/cm (of ppm) | Status: {stat}</strong> — Alfa 2,34 MeV.", "interlockNotify": "🛑 DOSIMETRIE-INTERLOCKWAARSCHUWING: Neutronenabsorptiedrempel! Onmiddellijke bundelafsluiting (0 n/cm²/s)! SHA-256", "processedNotify": "❄️ Cryo-IRE/BNCT-commando verwerkt: {action} ({stat}) — Tumorweefsel 100% geëlimineerd"}, "organoid4d": {"title": "🧬🌱 4D-organoïde-assemblage & Biomimetische 2PP-Micro-Vasculogenese", "infoLabel": "🧬🌱 In-situ organoïdereconstructie & 2PP-laser:", "infoText": "Akoestische-levitatiedepositie van 450.000 autologe sferoïden en femtoseconde-lasermicrocapillaire anastomose in < 90 seconden!", "badge": "Levitatie 40 kHz • 2PP-laser 780 nm 🌱", "specsTitle": "🌱 Telemetrie akoestische levitatie & 2PP-laser", "spec1Label": "Injector:", "spec1Value": "Akoestische levitatie (40 kHz) + optische val", "spec2Label": "Sferoïden:", "spec2Value": "450.000 hepatische organoïden (300 µm) @ 10 µm", "spec3Label": "2PP-laser:", "spec3Value": "Femtoseconde Ti:Sapphire (780 nm / 100 fs)", "spec4Label": "Anastomose:", "spec4Value": "PEG-DA-capillairnetwerk vernet in 84,5 s", "calibrateBtn": "🌱 Akoestische levitatie & 2PP-laser kalibreren", "calibrateNotify": "✨ Kalibratie van akoestische levitatie (40 kHz) en femtoseconde 2PP-laser geslaagd (SHA-256)", "actionsTitle": "🔬 Assemblage & micro-vasculogenese simuleren", "action1Btn": "🌱 Akoestische organoïdedepositie (S5/S8-holte)", "action1Label": "Akoestische organoïdedepositie", "action1Desc": "🟢 Akoestische depositie van 450.000 hepatische sferoïden (300 µm) in de S5/S8-resectieholte: perfecte architecturale assemblage (10 µm precisie).", "action2Btn": "⚡ 2PP-lasermicro-vasculogenese (anastomose)", "action2Label": "2PP-lasermicro-vasculogenese", "action2Desc": "🟢 2PP-laserfotopolymerisatie (780 nm / 180 mW): aanmaak microcapillair netwerk en anastomose met vena-portae-stompen in 84,5s. 100% perfusie hersteld!", "action3Btn": "🛑 Hypoxievergrendeling simuleren (0 sferoïden/s)", "action3Label": "Hypoxievergrendeling", "action3Desc": "🛑 HYPOXIE-INTERLOCKWAARSCHUWING: lokale capillaire perfusiedaling! Onmiddellijke stopzetting van organoïdedepositie (0 sferoïden/s). SHA-256-necrosebeveiliging.", "outputPending": "Akoestische-levitatie-injector en femtoseconde 2PP-laser gereed...", "activateBtn": "🚀 Organoïde- & microvatassemblage activeren", "activateNotify": "🧬🌱 4D-organoïden en 2PP-laser gekoppeld aan de Digital Twin!", "resultTemplate": "🧬🌱 <b>4D-ORGANOÏDEN & 2PP-LASER ({action}):</b> {desc} <br><strong>⚡ Levitatie / 2PP-laser: {param} sferoïden (of mW) | Status: {stat}</strong> — Precisie 10 µm.", "interlockNotify": "🛑 HYPOXIE-INTERLOCKWAARSCHUWING: Necrotisch risico gedetecteerd! Onmiddellijke injectiestop (0 sferoïden/s)! SHA-256", "processedNotify": "🌱 4D-Organoïden/2PP-commando verwerkt: {action} ({stat}) — Volledige functionele reconstructie"}, "iknifeAc225": {"title": "🔬💨 MOLECULAIRE AEROSOLDIAGNOSTIEK (iKnife REIMS) & ACTINIUM-225 ALFA-THERANOSTIEK (Fase 20 / M39-M40)", "introTitle": "🔬 In-situ spectrometrische aspiratie (0,8s) & 28 MeV alfaradiogeleiding:", "introBody1": "Aspiratie van scalpel-/lasersnij-aerosolen voedt continu een time-of-flight-massaspectrometer (", "introBody2": "), die de fosfatidylcholine (PC) membraanverhouding identificeert om een R0-marge te garanderen. Tegelijkertijd brengt de intraoperatieve detectiesonde occulte microclusters (< 250 µm) in kaart en bestraalt deze via gerichte alfa-emissie van ", "introBody3": ".", "panel1Title": "⚡ iKnife-aerosoltelemetrie (REIMS ToF)", "p1Label1": "Aspiratiedebiet:", "p1Value1": "1,5 L/min (steriel mondstuk)", "p1Label2": "Ionisatiesnelheid:", "p1Value2": "740 ms (time of flight)", "p1Label3": "Beoogde membraanpiek:", "p1Value3": "PC(34:1) m/z 760,6", "p1Label4": "Histologische nauwkeurigheid:", "p1Value4": "99,95% (R0-specificiteit)", "panel2Title": "☢️ Alfa-theranostische sonde (Ac-225 / Ga-68)", "p2Label1": "Alfa-radionuclide:", "p2Value1": "Actinium-225 (Ac-225)", "p2Label2": "Cascade-energie:", "p2Value2": "28 MeV (4 α-deeltjes)", "p2Label3": "Weefselpenetratie:", "p2Value3": "80 µm (0 collaterale schade)", "p2Label4": "Directe gammatelling:", "p2Value4": "4.850 cps (drempel 150 µm)", "simTitle": "⚙️ Online iKnife-analyse en Actinium-225-theranostische schotsimulatie:", "btn1Label": "💨 iKnife-aerosolanalyse (R0-marge)", "action1Name": "Scalpelrookanalyse (Gezonde marge)", "action1Desc": "Lage PC/PI-ratio (0,21), geen tumorinvasie op de transectielijn.", "btn2Label": "🛑 iKnife-infiltratiewaarschuwing (R1)", "action2Name": "Membraaninfiltratiewaarschuwing", "action2Desc": "Massale PC(34:1) m/z 760,6 proliferatiepiek! Chirurgische uitbreiding vereist (+3 mm).", "btn3Label": "☢️ Ac-225 alfaschot (8,5 MBq)", "action3Name": "Actinium-225 theranostische schot", "action3Desc": "Kortedracht-bestraling (80 µm, 28 MeV) op de S4/hilaire microcluster. Geen vaatschade.", "btn4Label": "🛑 Radio-interlock (0 MBq)", "action4Name": "Radiologische veiligheidsvergrendeling", "action4Desc": "Onmiddellijke afsluiting van de Actinium-225-injectielijn (0 MBq). SHA-256-verzegeling.", "outputPendingLabel": "🔬💨 WACHTEN OP AEROSOLASPIRATIE EN GAMMADETECTIE:", "outputPendingText": "Selecteer een commando om REIMS-ionisatie of Actinium-225-theranostische bestraling te starten.", "activateBtn": "🚀 Aerosoldiagnostiek & alfa-theranostiek activeren", "activateNotify": "🔬💨 iKnife-diagnostiek en Actinium-225-theranostiek gesynchroniseerd!", "resultTemplate": "🔬💨 <b>iKNIFE REIMS & AC-225 ({action}):</b> {desc} <br><strong>⚡ m/z (of activiteit MBq): {param} | Status: {stat}</strong> — Specificiteit 99,95%.", "interlockNotify": "🛑 RADIOLOGISCHE INTERLOCKWAARSCHUWING: Alfadosisdrempel bereikt! Onmiddellijke stopzetting Actinium-225-injectie (0 MBq)! SHA-256", "marginAlertNotify": "🛑 iKNIFE REIMS-WAARSCHUWING: R1-marge gedetecteerd (PC 34:1 m/z 760,6-piek)! Membraaninfiltratie — chirurgische uitbreiding vereist!", "processedNotify": "💨 iKnife-diagnose/Ac-225-schot verwerkt: {action} ({stat}) — R0-marge en microclusters beveiligd"}}}};

          const I18N = (function () {
            const SUPPORTED = ['en', 'fr', 'ar', 'nl'];
            const FALLBACK_LOCALE = 'en';
            const STORAGE_LANG_KEY = 'gsp_lang';
            const STORAGE_OVERRIDES_KEY = 'gsp_i18n_overrides';

            let locale = FALLBACK_LOCALE;
            const dictCache = {};          // locale -> dictionnaire charge (fetch ou repli embarque)
            const missing = new Set();     // cles manquantes detectees (aide au suivi/extension)
            let overridesCache = null;     // cache memoire de la couche de surcharge (editeur de traductions)

            function getNested(obj, path) {
              return path.split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, obj);
            }

            function getOverrides() {
              if (overridesCache === null) {
                try { overridesCache = JSON.parse(localStorage.getItem(STORAGE_OVERRIDES_KEY) || '{}'); }
                catch (e) { overridesCache = {}; }
              }
              return overridesCache;
            }
            function saveOverrides(ov) {
              overridesCache = ov;
              try { localStorage.setItem(STORAGE_OVERRIDES_KEY, JSON.stringify(ov)); } catch (e) { }
            }

            // Charge un dictionnaire : fetch(i18n/{locale}.json) si servi via http(s), sinon repli sur
            // la copie embarquee (I18N_EMBEDDED) -- garantit que l'app reste multilingue meme en
            // double-clic (file://).
            async function loadDict(loc) {
              if (dictCache[loc]) return dictCache[loc];
              let dict = null;
              try {
                const resp = await fetch(`i18n/${loc}.json`, { cache: 'no-store' });
                if (resp.ok) dict = await resp.json();
              } catch (e) { /* file:// ou hors-ligne : repli embarque ci-dessous */ }
              if (!dict) dict = I18N_EMBEDDED[loc] || I18N_EMBEDDED[FALLBACK_LOCALE];
              dictCache[loc] = dict;
              return dict;
            }

            // Sous-ensemble ICU pratique et sans dependance externe (coherent avec resilience.py,
            // "pas de dependance externe pour un logiciel medical, code auditable") : interpolation
            // {name} et pluriel {count, plural, one {..} other {..}}. Ne couvre pas la norme ICU
            // complete (ordinaux, select imbriques, skeletons de date) -- non necessaire ici.
            function formatICU(template, params) {
              if (typeof template !== 'string') return template;
              let out = template.replace(/\{(\w+),\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\}/g,
                (_, varName, one, other) => {
                  const n = Number(params && params[varName]);
                  return (Number.isFinite(n) && Math.abs(n) === 1) ? one : other;
                });
              out = out.replace(/\{(\w+)\}/g, (m, key) => {
                if (params && Object.prototype.hasOwnProperty.call(params, key)) return params[key];
                return m;
              });
              return out;
            }

            function t(key, params) {
              const dict = dictCache[locale] || I18N_EMBEDDED[locale];
              let val = dict ? getNested(dict, key) : undefined;
              const overrides = getOverrides();
              if (overrides[locale] && Object.prototype.hasOwnProperty.call(overrides[locale], key)) {
                val = overrides[locale][key];
              }
              if (val === undefined) {
                const fb = dictCache[FALLBACK_LOCALE] || I18N_EMBEDDED[FALLBACK_LOCALE];
                val = fb ? getNested(fb, key) : undefined;
                if (val === undefined) {
                  missing.add(key);
                  console.warn(`[I18N] Cle de traduction manquante : "${key}"`);
                  return key;
                }
              }
              return formatICU(val, params);
            }

            function applyTranslations(root) {
              root = root || document;
              root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
              root.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); });
              root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); });
            }

            function detectBrowserLocale() {
              const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
              if (nav.startsWith('fr')) return 'fr';
              if (nav.startsWith('ar')) return 'ar';
              if (nav.startsWith('nl')) return 'nl';
              return 'en';
            }

            function languageName(loc) {
              const dict = dictCache[loc || locale] || I18N_EMBEDDED[loc || locale];
              return (dict && dict.meta && dict.meta.nativeName) || 'English';
            }

            function formatDate(date, opts) {
              const dict = dictCache[locale] || I18N_EMBEDDED[locale];
              const intlLocale = (dict && dict.meta && dict.meta.intl) || 'en-US';
              try { return new Intl.DateTimeFormat(intlLocale, opts).format(date); }
              catch (e) { return date.toLocaleString(); }
            }
            function formatNumber(n, opts) {
              const dict = dictCache[locale] || I18N_EMBEDDED[locale];
              const intlLocale = (dict && dict.meta && dict.meta.intl) || 'en-US';
              try { return new Intl.NumberFormat(intlLocale, opts).format(n); }
              catch (e) { return String(n); }
            }

            // IMPORTANT securite clinique RTL : cette fonction ne touche QUE lang/dir sur <html> (chrome
            // UI). Aucune regle ne doit jamais inverser le viewport 3D ou les canvases MPR -- voir le
            // bloc CSS html[dir="rtl"] en fin de <style>, qui exclut explicitement #viewport-wrap et
            // .mpr-canvas. L'orientation d'une image medicale ne doit jamais dependre de la langue.
            async function setLocale(loc, opts) {
              opts = opts || {};
              if (SUPPORTED.indexOf(loc) === -1) loc = FALLBACK_LOCALE;
              await loadDict(loc);
              if (!dictCache[FALLBACK_LOCALE]) await loadDict(FALLBACK_LOCALE);
              locale = loc;
              const dict = dictCache[loc];
              const dir = (dict && dict.meta && dict.meta.dir) || 'ltr';
              document.documentElement.setAttribute('lang', loc);
              document.documentElement.setAttribute('dir', dir);
              document.body.classList.toggle('i18n-rtl', dir === 'rtl');
              try { localStorage.setItem(STORAGE_LANG_KEY, loc); } catch (e) { }
              applyTranslations(document);
              if (!opts.silent && typeof window !== 'undefined' && typeof window.onI18nLocaleChanged === 'function') window.onI18nLocaleChanged(loc);
            }

            function currentLocale() { return locale; }
            function currentIntl() {
              const dict = dictCache[locale] || I18N_EMBEDDED[locale];
              return (dict && dict.meta && dict.meta.intl) || 'en-US';
            }
            function reportMissing() { return Array.from(missing); }

            function flattenObj(obj, prefix) {
              const out = {};
              Object.keys(obj).forEach(k => {
                const full = prefix ? `${prefix}.${k}` : k;
                if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) Object.assign(out, flattenObj(obj[k], full));
                else out[full] = obj[k];
              });
              return out;
            }

            return {
              SUPPORTED, t, setLocale, currentLocale, currentIntl, detectBrowserLocale, applyTranslations,
              languageName, formatDate, formatNumber, reportMissing, getOverrides,
              setOverride(loc, key, value) {
                const ov = getOverrides();
                ov[loc] = ov[loc] || {};
                ov[loc][key] = value;
                saveOverrides(ov);
              },
              clearOverrides() { saveOverrides({}); },
              async exportLocale(loc) {
                await loadDict(loc);
                const base = JSON.parse(JSON.stringify(dictCache[loc] || {}));
                const ov = getOverrides()[loc] || {};
                Object.keys(ov).forEach(k => {
                  const parts = k.split('.'); let node = base;
                  for (let i = 0; i < parts.length - 1; i++) { node[parts[i]] = node[parts[i]] || {}; node = node[parts[i]]; }
                  node[parts[parts.length - 1]] = ov[k];
                });
                return base;
              },
              importLocale(loc, nested) {
                const flat = flattenObj(nested, '');
                const ov = getOverrides();
                ov[loc] = Object.assign({}, ov[loc] || {}, flat);
                saveOverrides(ov);
                return Object.keys(flat).length;
              }
            };
          })();

          const MODULES = {
            hbp: {
              id: 'hbp', name: 'Hépato-Bilio-Pancréatique', short: 'HBP', icon: '🫁',
              color: '#4fc3f7', colorRgb: '79,195,247',
              desc: 'Planification de résections hépatiques, pancréatiques et biliaires avec calcul volumétrique FLR.',
              procedures: ['Hépatectomie droite', 'Hépatectomie gauche', 'Segmentectomie', 'Duodénopancréatectomie', 'Cholécystectomie complexe'],
              metrics: [
                { key: 'TLV', label: 'Total Liver Volume', val: '1680 ml', st: 'ok' },
                { key: 'FLR', label: 'Future Liver Remnant', val: '42%', st: 'ok' },
                { key: 'TV', label: 'Tumor Volume', val: '185 ml', st: 'warn' },
                { key: 'ICG', label: 'ICG-R15', val: '8.2%', st: 'ok' }
              ],
              structures: [
                { name: 'Foie', open: true, children: ['Segment I (Caudé)', 'Segment II', 'Segment III', 'Segment IVa', 'Segment IVb', 'Segment V', 'Segment VI', 'Segment VII', 'Segment VIII'] },
                { name: 'Voies biliaires', open: false, children: ['Confluent hilair', 'CDH', 'CDG', 'Cholédoque'] },
                { name: 'Vaisseaux', open: true, children: ['Tronc porte', 'Branche porte dr.', 'Branche porte g.', 'VSH', 'VCI', 'Artère hépatique'] },
                { name: 'Pancréas', open: false, children: ['Tête', 'Isthme', 'Corps', 'Queue', 'Canal de Wirsung'] }
              ],
              implants: [
                { name: 'Clip titane L', ref: 'TI-LG-200', tags: ['vasculaire', 'HBP'], sel: false },
                { name: 'Stapler endo GIA', ref: 'EGIA-60AMT', tags: ['parenchyme', 'coupure'], sel: true },
                { name: 'Drain Blake 19Fr', ref: 'BLK-19-R', tags: ['drainage'], sel: false }
              ],
              checklist: [
                { done: true, text: '<strong>Scanner triphasé</strong> avec reconstruction 3D' },
                { done: true, text: '<strong>Bilirubine, ICG-R15</strong> — Fonction hépatique' },
                { done: true, text: '<strong>Calcul FLR</strong> BSA-based ≥ 30%' },
                { done: false, text: '<strong>Biopsie hépatique</strong> — Évaluer fibrose/cirrhose' },
                { done: false, text: '<strong>Consultation anesthésie</strong> — Score ASA' }
              ],
              patient: { id: '48392-HEP', nom: 'Benali, Karim', age: 58, sexe: 'M', poids: 70, taille: 170, diag: 'CHC Segment VII', urg: 'orange' },
              aiChips: ['Quel est le FLR ?', 'Risque de fistule biliaire ?', 'Plan de coupe optimal ?', 'Résultats attendus à 5 ans ?'],
              hubProcs: ['Hépatectomie', 'Segmentectomie', 'DPC', 'Cholécystectomie']
            },
            colorectal: {
              id: 'colorectal', name: 'Chirurgie Colorectale', short: 'Colo-Rectal', icon: '🔬',
              color: '#22c55e', colorRgb: '34,197,94',
              desc: 'Planification de colectomies, résections rectales et exérèses tumorales avec analyse CRM.',
              procedures: ['Hémicolectomie droite', 'Hémicolectomie gauche', 'Résection antérieure rectum', 'Amputation abdomino-périnéale', 'Cœlioscopie colorectale'],
              metrics: [
                { key: 'DTC', label: 'Dist. Tumeur-Carrefour', val: '8.2 cm', st: 'ok' },
                { key: 'MRF', label: 'Mésorectal Fascia', val: '2.1 mm', st: 'warn' },
                { key: 'EMVI', label: 'Invasion vasculaire', val: 'Négatif', st: 'ok' },
                { key: 'CRM', label: 'Circumferential RM', val: 'Négatif', st: 'ok' }
              ],
              structures: [
                { name: 'Côlon', open: true, children: ['Cæcum', 'Côlon ascendant', 'Angle droit', 'Côlon transverse', 'Angle gauche', 'Côlon descendant', 'Côlon sigmoïde'] },
                { name: 'Rectum', open: true, children: ['Haut rectum', 'Moyen rectum', 'Bas rectum', 'Carrefour ano-rectal'] },
                { name: 'Vaisseaux mésentériques', open: false, children: ['A. mésentérique sup.', 'A. mésentérique inf.', 'V. mésentérique sup.', 'Arcade colique moyenne', 'Artère marginale'] },
                { name: 'Nerfs pelviens', open: false, children: ['Plexus hypogastrique sup.', 'Plexus hypogastrique inf.', 'Nerfs pelviens splanchniques', 'Nerf érecteur'] }
              ],
              implants: [
                { name: 'Stapler EEA 28mm', ref: 'EEA-28-C', tags: ['anastomose', 'circulaire'], sel: true },
                { name: 'Stapler endo TA', ref: 'ETA-60-T', tags: ['section', 'rectum'], sel: false },
                { name: 'Clip Hem-o-lok', ref: 'HML-LG', tags: ['vasculaire'], sel: false }
              ],
              checklist: [
                { done: true, text: '<strong>IRM pelvienne</strong> — Stade T, CRM, EMVI' },
                { done: true, text: '<strong>Scanner thoraco-abdominal</strong> — Bilan métastatique' },
                { done: true, text: '<strong>Marqueurs CEA</strong> — Suivi tumoral' },
                { done: false, text: '<strong>Radiothérapie néo-adjuvante</strong> — Évaluer indication' },
                { done: false, text: '<strong>Consultation stomathérapeute</strong> — Si AAP envisagée' }
              ],
              patient: { id: '51027-CR', nom: 'Dubois, Marie', age: 64, sexe: 'F', poids: 62, taille: 162, diag: 'Adénocarcinome rectum moyen T3N1', urg: 'rouge' },
              aiChips: ['Distance CRM ?', 'Réponse au néo-adjuvant ?', 'Type d\'anastomose ?', 'Risque de récidive locale ?'],
              hubProcs: ['Hémicolectomie', 'RAR', 'AAP', 'Cœlioscopie']
            },
            gastrique: {
              id: 'gastrique', name: 'Chirurgie Gastrique', short: 'Gastrique', icon: '🏥',
              color: '#ff6b35', colorRgb: '255,107,53',
              desc: 'Planification de gastrectomies totales ou subtotales et curages ganglionnaires D1+/D2.',
              procedures: ['Gastrectomie totale', 'Gastrectomie subtotale', 'Gastrectomie proximale', 'By-pass gastrique Roux-en-Y', 'Piloroplastie'],
              metrics: [
                { key: 'DTC', label: 'Dist. Tumeur-Carde', val: '6.8 cm', st: 'ok' },
                { key: 'Stade', label: 'Stade TNM', val: 'T3N1M0', st: 'warn' },
                { key: 'SRS', label: 'Score SRS', val: '2/5', st: 'ok' },
                { key: 'Linité', label: 'Signe de linité', val: 'Non', st: 'ok' }
              ],
              structures: [
                { name: 'Estomac', open: true, children: ['Cardia', 'Fundus', 'Petite courbure', 'Corps', 'Grande courbure', 'Antre', 'Pylore'] },
                { name: 'Vaisseaux gastriques', open: false, children: ['A. gastrique gauche', 'A. gastrique droite', 'A. gastro-épiploïque dr.', 'A. gastro-épiploïque g.', 'A. gastro-duodénale'] },
                { name: 'Stations ganglionnaires', open: true, children: ['N1 — Paracardiale dr.', 'N2 — Paracardiale g.', 'N3 — Petite courbure', 'N4 — Grande courbure', 'N5 — Suprapylorique', 'N6 — Infrapylorique'] },
                { name: 'Organes adjacents', open: false, children: ['Rate', 'Pancréas (corps/queue)', 'Côlon transverse', 'Ligament hépatogastrique'] }
              ],
              implants: [
                { name: 'Stapler EEA 25mm', ref: 'EEA-25-C', tags: ['anastomose', 'circulaire'], sel: true },
                { name: 'Stapler linear 60mm', ref: 'TLC-60', tags: ['section'], sel: false },
                { name: 'Clip Hem-o-lok ML', ref: 'HML-ML', tags: ['pédicule'], sel: false }
              ],
              checklist: [
                { done: true, text: '<strong>Scanner thoraco-abdominal</strong> avec injection' },
                { done: true, text: '<strong>EGD + biopsies</strong> — Histologie + HER2' },
                { done: true, text: '<strong>CA 19-9, CEA</strong> — Marqueurs tumoraux' },
                { done: false, text: '<strong>Écho-endoscopie</strong> — Stade T local' },
                { done: false, text: '<strong>CT-PET</strong> — Si suspicion métastatique' }
              ],
              patient: { id: '62410-GA', nom: 'Kouassi, Jean', age: 71, sexe: 'M', poids: 68, taille: 175, diag: 'Adénocarcinome antre gastrique T3N1', urg: 'orange' },
              aiChips: ['Extension tumorale ?', 'Curage D2 complet ?', 'Risque de fuite anastomotique ?', 'Pronostic stade IIIA ?'],
              hubProcs: ['Gastrectomie totale', 'Gastrectomie subtotale', 'By-pass', 'Curage D2']
            },
            thyroide: {
              id: 'thyroide', name: 'Chirurgie Thyroïdienne', short: 'Thyroïde', icon: '🦋',
              color: '#a855f7', colorRgb: '168,85,247',
              desc: 'Planification de thyroïdectomies et curages cervicaux avec préservation récurrentiel.',
              procedures: ['Thyroïdectomie totale', 'Lobectomie isthmolobaire', 'Curage cervical central (VI)', 'Curage cervical latéral (II-IV)'],
              metrics: [
                { key: 'Vol', label: 'Volume thyroïdien', val: '28 ml', st: 'ok' },
                { key: 'Nod', label: 'Nodule principal', val: '1.8 cm TI-RADS 5', st: 'warn' },
                { key: 'PTH', label: 'PTH préop.', val: '62 pg/ml', st: 'ok' },
                { key: 'Ca²⁺', label: 'Calcium ionisé', val: '1.22 mmol/L', st: 'ok' }
              ],
              structures: [
                { name: 'Thyroïde', open: true, children: ['Lobe droit', 'Lobe gauche', 'Isthme', 'Pyramide de Lalouette'] },
                { name: 'Parathyroïdes', open: true, children: ['Supérieure droite', 'Supérieure gauche', 'Inférieure droite', 'Inférieure gauche'] },
                { name: 'Nerfs récurrents', open: true, children: ['Récurrent droit', 'Récurrent gauche', 'Nerf laryngé supérieur ext.'] },
                { name: 'Ganglions cervicaux', open: false, children: ['Central (VI)', 'Pré-laryngé (Délphien)', 'Latéral dr. (II-IV)', 'Latéral g. (II-IV)', 'Sus-claviculaire (V)'] }
              ],
              implants: [
                { name: 'Neuromonitor NGM', ref: 'NIM-3.0', tags: ['monitoring', 'récurrence'], sel: true },
                { name: 'Hémoclip mini', ref: 'HC-MINI', tags: ['hémostase'], sel: false },
                { name: 'Drain aspiratif Penrose', ref: 'PEN-08', tags: ['drainage'], sel: false }
              ],
              checklist: [
                { done: true, text: '<strong>Échographie cervicale</strong> — Caractérisation nodules' },
                { done: true, text: '<strong>FNAB</strong> — Cytologie nodule suspect (Bethesda)' },
                { done: true, text: '<strong>TSH, fT4, calcitonine, PTH</strong> — Bilan biologique' },
                { done: false, text: '<strong>Calcium/Vitamine D</strong> — Correction si déficit' },
                { done: false, text: '<strong>ECBU + Fibroscopie laryngée</strong> — Voix pré-op' }
              ],
              patient: { id: '33815-TH', nom: 'Martin, Sophie', age: 45, sexe: 'F', poids: 58, taille: 165, diag: 'Nodule TI-RADS 5 lobe droit, Bethesda V', urg: 'vert' },
              aiChips: ['Risque de lésion récurrentiel ?', 'Indication curage central ?', 'Surveillance PTH post-op ?', 'Chirurgie bilatérale ou unilatérale ?'],
              hubProcs: ['Thyroïdectomie totale', 'Lobectomie', 'Curage central', 'Curage latéral']
            },
            thoracique: {
              id: 'thoracique', name: 'Chirurgie Thoracique', short: 'Thoracique', icon: '🫁',
              color: '#06b6d4', colorRgb: '6,182,212',
              desc: 'Planification de résections pulmonaires anatomiques et médiastinales avec évaluation fonctionnelle.',
              procedures: ['Lobectomie', 'Segmentectomie', 'Pneumonectomie', 'Résection atypique (wedge)', 'Médiastinoscopie'],
              metrics: [
                { key: 'VEMS', label: 'VEMS préop.', val: '2.4 L (82%)', st: 'ok' },
                { key: 'DLCO', label: 'DLCO', val: '78%', st: 'ok' },
                { key: 'VO₂', label: 'VO₂ max', val: '18 ml/kg/min', st: 'ok' },
                { key: 'Tum.', label: 'Taille tumorale', val: '3.2 cm', st: 'warn' }
              ],
              structures: [
                { name: 'Poumon droit', open: true, children: ['Lobe supérieur (S1-S3)', 'Lobe moyen (S4-S5)', 'Lobe inférieur (S6-S10)'] },
                { name: 'Poumon gauche', open: true, children: ['Lobe supérieur (S1-S3+S4)', 'Lingula (S4-S5)', 'Lobe inférieur (S6-S10)'] },
                { name: 'Artères pulmonaires', open: false, children: ['Tronc pulmonaire', 'Artère pulmonaire dr.', 'Interlobaire dr.', 'Artère pulmonaire g.', 'Interlobaire g.'] },
                { name: 'Médiastin', open: false, children: ['Trachée', 'Carène', 'Veine cave sup.', 'Aorte thoracique', 'Nerf phrénique dr.', 'Nerf récurrent g.'] }
              ],
              implants: [
                { name: 'Stapler endo GIA 45', ref: 'EGIA-45-AMT', tags: ['fissure', 'vaisseaux'], sel: true },
                { name: 'Clip titane L', ref: 'TI-LG-200', tags: ['artère', 'segmentaire'], sel: false },
                { name: 'Drain thoracique 28Fr', ref: 'DTC-28', tags: ['drainage', 'pleural'], sel: true }
              ],
              checklist: [
                { done: true, text: '<strong>Scanner thoracique</strong> avec reconstruction bronchique' },
                { done: true, text: '<strong>Épreuves fonctionnelles respiratoires</strong> — VEMS, DLCO' },
                { done: true, text: '<strong>VO₂ max</strong> — Test d\'effort cardiopulmonaire' },
                { done: false, text: '<strong>TEP-TDM</strong> — Bilan d\'extension' },
                { done: false, text: '<strong>Coronarographie / Écho cardiaque</strong> — Si > 65 ans' }
              ],
              patient: { id: '71093-TH', nom: 'Rousseau, Pierre', age: 67, sexe: 'M', poids: 78, taille: 178, diag: 'NSCLC lobe supérieur droit T2aN0', urg: 'orange' },
              aiChips: ['VEMS post-op prédit ?', 'Fissure complète ?', 'Ganglions médiastinaux ?', 'Indication néo-adjuvante ?'],
              hubProcs: ['Lobectomie', 'Segmentectomie', 'Pneumonectomie', 'Wedge']
            },
            cardiaque: {
              id: 'cardiaque', name: 'Chirurgie Cardiaque', short: 'Cardiaque', icon: '❤️',
              color: '#ef4444', colorRgb: '239,68,68',
              desc: 'Planification de chirurgie valvulaire, coronaire et aortique avec évaluation hémodynamique.',
              procedures: ['Pontage coronaire (CABG)', 'Remplacement valvulaire aortique', 'Réparation mitrale', 'Chirurgie aorte ascendante', 'Procédure Maze'],
              metrics: [
                { key: 'FEVG', label: 'FEVG', val: '52%', st: 'warn' },
                { key: 'GdS', label: 'Gradient sténose Ao', val: '48 mmHg', st: 'warn' },
                { key: 'IC', label: 'Index cardiaque', val: '2.8 L/min/m²', st: 'ok' },
                { key: 'ES', label: 'EuroSCORE II', val: '3.2%', st: 'ok' }
              ],
              structures: [
                { name: 'Valves cardiaques', open: true, children: ['Valve aortique (3 feuillets)', 'Valve mitrale (A2-P2)', 'Valve tricuspide', 'Valve pulmonaire'] },
                { name: 'Coronaires', open: true, children: ['IVA (inter-ventriculaire ant.)', 'Coronaire droite', 'Circonflexe', 'Diagonale', 'Marginale obtuse'] },
                { name: 'Aorte', open: false, children: ['Anneau aortique', 'Sinus de Valsalva', 'Aorte ascendante', 'Crosse aortique', 'Isthme aortique'] },
                { name: 'Veines et cavités', open: false, children: ['VCS', 'VCI', 'Sinus coronaire', 'OG', 'OD', 'VG', 'VD'] }
              ],
              implants: [
                { name: 'Prothèse biologique Ao 23mm', ref: 'MITRIS-23', tags: ['valve', 'aortique'], sel: true },
                { name: 'Pontage mammaire LIMA', ref: 'LIMA-AUTO', tags: ['greffon', 'coronaire'], sel: true },
                { name: 'Pacing wire epicardique', ref: 'PW-EP-2', tags: ['stimulation', 'temporaire'], sel: false }
              ],
              checklist: [
                { done: true, text: '<strong>Coronarographie</strong> — Lésions coronaires' },
                { done: true, text: '<strong>Échocardiographie TTE/TEE</strong> — Fonction VG, valves' },
                { done: true, text: '<strong>EuroSCORE II</strong> — Risque opératoire' },
                { done: false, text: '<strong>Scanner aortique</strong> — Si pathologie aortique' },
                { done: false, text: '<strong>Tests de revascularisation</strong> — Viabilité myocardique' }
              ],
              patient: { id: '88201-CA', nom: 'Ferdi, Ahmed', age: 72, sexe: 'M', poids: 82, taille: 172, diag: 'Sténose aortique sévère + tritronculaire', urg: 'rouge' },
              aiChips: ['EuroSCORE détaillé ?', 'Choix valve mécanique vs biologique ?', 'Viabilité myocardique ?', 'Stratégie de revascularisation ?'],
              hubProcs: ['CABG', 'TAVI chirurgical', 'Réparation mitrale', 'Remplacement Ao']
            },
            urologie: {
              id: 'urologie', name: 'Chirurgie Urologique', short: 'Urologie', icon: '🧫',
              color: '#14b8a6', colorRgb: '20,184,166',
              desc: 'Planification de néphrectomies, prostatectomies et cystectomies avec cartographie PI-RADS et score RENAL.',
              procedures: ['Néphrectomie partielle', 'Néphrectomie totale élargie', 'Prostatectomie radicale', 'Cystectomie radicale + dérivation', 'Urétéroscopie / NLPC'],
              metrics: [
                { key: 'RENAL', label: 'Score RENAL', val: '8x (élevé)', st: 'warn' },
                { key: 'Taille', label: 'Taille tumorale', val: '4.1 cm', st: 'warn' },
                { key: 'DFG', label: 'DFG (MDRD)', val: '68 ml/min/1.73m²', st: 'ok' },
                { key: 'PSA', label: 'PSA total', val: '—', st: 'ok' }
              ],
              structures: [
                { name: 'Rein droit', open: true, children: ['Pôle supérieur', 'Pôle moyen', 'Pôle inférieur', 'Sinus rénal', 'Bassinet', 'Calices'] },
                { name: 'Voies excrétrices', open: false, children: ['Uretère lombaire', 'Uretère iliaque', 'Uretère pelvien', 'Jonction pyélo-urétérale'] },
                { name: 'Vaisseaux rénaux', open: true, children: ['Artère rénale principale', 'Artère polaire sup.', 'Artère polaire inf.', 'Veine rénale', 'Veine gonadique'] },
                { name: 'Pelvis / Prostate', open: false, children: ['Vessie', 'Prostate', 'Vésicules séminales', 'Bandelettes neuro-vasculaires'] }
              ],
              implants: [
                { name: 'Clip Hem-o-lok XL', ref: 'HML-XL', tags: ['vasculaire', 'pédicule rénal'], sel: true },
                { name: 'Stent urétéral JJ 6Fr', ref: 'JJ-6-26', tags: ['drainage', 'urétéral'], sel: false },
                { name: 'Agent hémostatique Surgicel', ref: 'SURG-FIB', tags: ['hémostase', 'tranche section'], sel: true }
              ],
              checklist: [
                { done: true, text: '<strong>Uro-TDM injecté</strong> — Cartographie vasculaire et score RENAL' },
                { done: true, text: '<strong>IRM prostatique multiparamétrique</strong> — Score PI-RADS (si prostate)' },
                { done: true, text: '<strong>Créatinine, DFG, ECBU</strong> — Fonction rénale et stérilité urinaire' },
                { done: false, text: '<strong>Scintigraphie rénale (MAG3)</strong> — Fonction séparée si limite' },
                { done: false, text: '<strong>Consultation anesthésie</strong> — Score ASA, gestion anticoagulants' }
              ],
              patient: { id: '59274-URO', nom: 'Ziani, Karim', age: 61, sexe: 'M', poids: 79, taille: 174, diag: 'Tumeur rénale droite cT1b, RENAL 8x', urg: 'orange' },
              aiChips: ['Score RENAL détaillé ?', 'Risque hémorragique au clampage ?', 'Marge chirurgicale attendue ?', 'Fonction rénale post-op prédite ?'],
              hubProcs: ['Néphrectomie partielle', 'Prostatectomie', 'Cystectomie', 'NLPC']
            },
            anesthesie_reanimation: {
              id: 'anesthesie_reanimation', name: 'Anesthésie-Réanimation', short: 'Anesthésie-Réa', icon: '💉',
              color: '#f59e0b', colorRgb: '245,158,11',
              desc: 'Évaluation pré-anesthésique, monitorage per-opératoire et suivi en réanimation : score ASA, voies aériennes, accès vasculaires et surveillance hémodynamique.',
              procedures: ['Anesthésie générale', 'Rachianesthésie', 'Anesthésie loco-régionale (ALR) échoguidée', 'Sédation-analgésie', 'Ventilation mécanique en réanimation'],
              metrics: [
                { key: 'ASA', label: 'Score ASA', val: 'II', st: 'ok' },
                { key: 'Mallampati', label: 'Score de Mallampati', val: 'II', st: 'ok' },
                { key: 'Jeûne', label: 'Jeûne solide', val: '8 h', st: 'ok' },
                { key: 'SOFA', label: 'Score SOFA (si réa)', val: '2', st: 'ok' }
              ],
              structures: [
                { name: 'Voies aériennes', open: true, children: ['Cavité buccale', 'Oropharynx', 'Larynx / Glotte', 'Trachée', 'Carène'] },
                { name: 'Accès vasculaires', open: true, children: ['Voie veineuse périphérique', 'Voie veineuse centrale (VVC)', 'Cathéter artériel (KTA)', 'Voie intra-osseuse'] },
                { name: 'Neuraxial / ALR', open: false, children: ['Espace péridural', 'Espace sous-arachnoïdien', 'Plexus brachial', 'Nerf sciatique', 'Nerf fémoral'] },
                { name: 'Monitorage', open: false, children: ['ECG', 'PA invasive/non invasive', 'SpO2', 'Capnographie (EtCO2)', 'BIS/Entropie', 'Curarométrie (TOF)'] }
              ],
              implants: [
                { name: 'Masque laryngé', ref: 'LMA-4', tags: ['VAS', 'supraglottique'], sel: true },
                { name: "Sonde d'intubation 7.5", ref: 'ETT-7.5', tags: ['intubation'], sel: false },
                { name: 'Cathéter péridural', ref: 'EPI-18G', tags: ['neuraxial'], sel: false }
              ],
              checklist: [
                { done: true, text: '<strong>Consultation pré-anesthésique</strong> — Score ASA' },
                { done: true, text: '<strong>Score de Mallampati</strong> — Évaluation voies aériennes' },
                { done: false, text: '<strong>Jeûne vérifié</strong> — Solide ≥ 6h / Liquide clair ≥ 2h' },
                { done: false, text: '<strong>Allergies vérifiées</strong> — Latex, antibiotiques, curares' },
                { done: false, text: '<strong>Checklist HAS bloc</strong> — Sécurité du patient au bloc' }
              ],
              patient: { id: '70112-ANR', nom: 'Cherif, Yasmine', age: 54, sexe: 'F', poids: 65, taille: 160, diag: 'Bilan pré-anesthésique — cholécystectomie programmée', urg: 'vert' },
              aiChips: ['Score ASA attendu ?', "Risque d'intubation difficile ?", 'Délai de jeûne respecté ?', "Contre-indications à l'ALR ?"],
              hubProcs: ['Anesthésie générale', 'Rachianesthésie', 'ALR échoguidée', 'Sédation en réanimation']
            }
          };

          // ════════════════════════════════════════════════
          //  AUTO-CONFIGURATION PRODUCTION
          //  Pour un déploiement en production, ne montrez jamais la clé Gemini ni
          //  l'URL du backend au chirurgien. Injectez window.APP_CONFIG dans une
          //  balise script séparée, chargée AVANT ce fichier, avec par exemple :
          //    window.APP_CONFIG = {
          //      apiBase: 'https://backend.hopital.local/api',
          //      geminiKey: '', // laisser vide si le backend proxy Gemini
          //      chirurgien: 'Dr. Hadj'
          //    };
          //  Ces valeurs deviennent les réglages par défaut et le bouton ⚙ reste
          //  masqué (voir .admin-only) tant que le Mode Recherche n'est pas activé.
          // ════════════════════════════════════════════════
          const APP_CONFIG = (typeof window !== 'undefined' && window.APP_CONFIG) || {};

          // ════════════════════════════════════════════════
          //  STATE
          // ════════════════════════════════════════════════
          const state = {
            mod: null,
            light: false,
            or: false,
            researchMode: false,
            workflowStep: 0,
            dashboard: false,
            touchMode: false,
            readOnly: false,
            gemini: false,
            tab: 'plan',
            viewMode: '3d',
            timerRunning: true,
            timerSec: 0,
            timerInterval: null,
            settings: {
              geminiKey: APP_CONFIG.geminiKey || '',
              geminiModel: APP_CONFIG.geminiModel || 'gemini-flash-latest',
              groqKey: APP_CONFIG.groqKey || '',
              apiBase: APP_CONFIG.apiBase || '',
              localServerUrl: APP_CONFIG.localServerUrl || '',
              localServerModel: APP_CONFIG.localServerModel || 'llama3',
              chirurgien: APP_CONFIG.chirurgien || 'Dr. Hadj',
              offlineCertified: APP_CONFIG.offlineCertified || false
            },
            localEngine: null,      // instance MLCEngine (WebLLM) une fois chargée, sinon null
            localEngineModel: null, // id du modèle actuellement chargé en WebGPU
            session: { token: null, expiresAt: null, username: null, role: null }, // remplace l'ancien backendToken — voir ensureSession()/clearSession() (app-part3.js)
            preanesthesie: {},      // dossiers pré-anesthésiques en cache local, indexés par patient.id (fallback hors-backend)
            icuFollowups: {},       // { [patient.id]: [évaluations réa/USI...] } en cache local (fallback hors-backend)
            aiBusy: false,
            mpr: {
              plane: { axial: 0, coronal: 0, sagittal: 0 },
              max: { axial: 63, coronal: 63, sagittal: 63 },
              ww: 400, wl: 40,
              dragging: null,
              dragStartY: 0, dragStartX: 0,
              volume: null,      // Float32Array 64^3, procedural or real
              volSize: 64,
              fromDicom: false,
              spacing: { x: 1, y: 1, z: 1 } // mm
            },
            patients: {},        // local cache of patients created/edited this session
            live: {
              history: [],        // [{role:'user'|'model', text}] — real multi-turn memory for Gemini Live
              voiceOn: false,
              listening: false,
              speaking: false,
              processingTurn: false,
              errorStreak: 0,
              stream: null,
              currentRecorder: null,
              recordingCancelled: false,
              pendingUtterances: 0,
              streamDone: false
            }
          };

          // ════════════════════════════════════════════════
          //  THREE.JS — 3D Viewport
          // ════════════════════════════════════════════════
          let scene, camera, renderer, organMesh, wireframeMesh, vesselGroup, clipPlane;
          let organParts = [];        // { mesh, name, kind } for the current module's anatomy
          let mouseDown = false, mouseX = 0, mouseY = 0, rotX = 0, rotY = 0;
          let instrumentRaycaster = null;
          let instrDragState = { active: false, instrIdx: -1, startMouse: null, startPos: null, plane: null };

          function initViewport() {
            const canvas = document.getElementById('gl-canvas');
            const wrap = document.getElementById('viewport-wrap');
            const w = wrap.clientWidth, h = wrap.clientHeight;

            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x080c10);

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
            camera.position.set(0, 0, 5);

            const amb = new THREE.AmbientLight(0xffffff, 0.3);
            scene.add(amb);
            const p1 = new THREE.PointLight(0x4fc3f7, 1.2, 20); p1.position.set(3, 3, 3); scene.add(p1);
            const p2 = new THREE.PointLight(0xff6b35, 0.6, 20); p2.position.set(-3, -2, 4); scene.add(p2);

            buildOrgan();

            // ── 3D Ruler Measurement System ──
            const ruler3D = {
              active: false,
              points: [], // [THREE.Vector3, THREE.Vector3]
              markers: [], // THREE.Mesh objects
              line: null,
              label: null
            };
            window.ruler3D = ruler3D;

            window.toggle3DRuler = function(forceState) {
              ruler3D.active = typeof forceState === 'boolean' ? forceState : !ruler3D.active;
              const btn = document.getElementById('btn-3d-ruler');
              if (btn) btn.classList.toggle('active', ruler3D.active);
              if (ruler3D.active) {
                notify('📐 Règle 3D activée : cliquez 2 points sur l\'anatomie 3D pour mesurer la distance (mm)', 'info');
                canvas.style.cursor = 'crosshair';
              } else {
                canvas.style.cursor = 'default';
                clear3DRuler();
              }
            };

            function clear3DRuler() {
              ruler3D.points = [];
              ruler3D.markers.forEach(m => scene.remove(m));
              ruler3D.markers = [];
              if (ruler3D.line) { scene.remove(ruler3D.line); ruler3D.line = null; }
              const oldLabel = document.getElementById('ruler3d-label');
              if (oldLabel) oldLabel.remove();
            }
            window.clear3DRuler = clear3DRuler;

            function add3DRulerPoint(intersectionPoint) {
              ruler3D.points.push(intersectionPoint);
              // Add sphere marker
              const sphereGeo = new THREE.SphereGeometry(0.04, 16, 16);
              const sphereMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, depthTest: false });
              const marker = new THREE.Mesh(sphereGeo, sphereMat);
              marker.position.copy(intersectionPoint);
              marker.renderOrder = 999;
              scene.add(marker);
              ruler3D.markers.push(marker);

              if (ruler3D.points.length === 2) {
                // Draw line between 2 points
                const lineGeo = new THREE.BufferGeometry().setFromPoints(ruler3D.points);
                const lineMat = new THREE.LineDashedMaterial({ color: 0xfacc15, dashSize: 0.1, gapSize: 0.05, depthTest: false });
                ruler3D.line = new THREE.Line(lineGeo, lineMat);
                ruler3D.line.computeLineDistances();
                ruler3D.line.renderOrder = 999;
                scene.add(ruler3D.line);

                // Calculate distance in scene units (scaled to mm: 1 unit ~ 100mm in anatomical scale)
                const distanceMm = (ruler3D.points[0].distanceTo(ruler3D.points[1]) * 100).toFixed(1);
                notify(`📏 Mesure 3D : ${distanceMm} mm`, 'ok');
                logAudit('measure_3d_ruler', { distance_mm: parseFloat(distanceMm) });

                // Add 3D text/floating badge on canvas
                const midPoint = new THREE.Vector3().addVectors(ruler3D.points[0], ruler3D.points[1]).multiplyScalar(0.5);
                update3DRulerLabel(midPoint, distanceMm);
              }
            }

            function update3DRulerLabel(midPoint, distanceMm) {
              let labelEl = document.getElementById('ruler3d-label');
              if (!labelEl) {
                labelEl = document.createElement('div');
                labelEl.id = 'ruler3d-label';
                labelEl.style.position = 'absolute';
                labelEl.style.padding = '4px 8px';
                labelEl.style.background = 'rgba(15, 23, 42, 0.9)';
                labelEl.style.color = '#facc15';
                labelEl.style.border = '1px solid #facc15';
                labelEl.style.borderRadius = '4px';
                labelEl.style.fontFamily = 'monospace';
                labelEl.style.fontSize = '12px';
                labelEl.style.fontWeight = 'bold';
                labelEl.style.pointerEvents = 'none';
                labelEl.style.zIndex = '100';
                wrap.appendChild(labelEl);
              }
              // Project 3D coordinate to 2D screen
              const vector = midPoint.clone().project(camera);
              const x = (vector.x * 0.5 + 0.5) * w;
              const y = (-(vector.y * 0.5) + 0.5) * h;
              labelEl.style.left = `${x}px`;
              labelEl.style.top = `${y}px`;
              labelEl.textContent = `📏 ${distanceMm} mm`;
            }

            canvas.addEventListener('mousedown', e => {
              if (ruler3D.active) {
                const rect = renderer.domElement.getBoundingClientRect();
                const ndc = new THREE.Vector2(
                  ((e.clientX - rect.left) / rect.width) * 2 - 1,
                  -((e.clientY - rect.top) / rect.height) * 2 + 1
                );
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(ndc, camera);
                const targetObjects = [];
                scene.traverse(o => { if (o.isMesh && o.visible && o !== wireframeMesh) targetObjects.push(o); });
                const hits = raycaster.intersectObjects(targetObjects, true);
                if (hits.length > 0) {
                  if (ruler3D.points.length >= 2) clear3DRuler();
                  add3DRulerPoint(hits[0].point);
                }
                return;
              }

              if (twin.active && twin.deformMode) { twinGrabStart(e); return; }

              // — Clic sur un instrument : sélection par raycaster —
              const instrMeshes = instrumentManager.placedInstruments.map(p => p.mesh);
              if (instrMeshes.length > 0 && instrumentRaycaster) {
                const rect = renderer.domElement.getBoundingClientRect();
                const ndc = new THREE.Vector2(
                  ((e.clientX - rect.left) / rect.width) * 2 - 1,
                  -((e.clientY - rect.top) / rect.height) * 2 + 1
                );
                instrumentRaycaster.setFromCamera(ndc, camera);
                // On teste les enfants des groupes aussi
                const allChildren = [];
                instrMeshes.forEach(m => m.traverse(o => { if (o.isMesh) allChildren.push(o); }));
                const hits = instrumentRaycaster.intersectObjects(allChildren, true);
                if (hits.length > 0) {
                  // Remonter jusqu'à trouver quel groupe racine a été touché
                  let hitObj = hits[0].object;
                  let rootMesh = null;
                  while (hitObj) {
                    const found = instrumentManager.placedInstruments.findIndex(p => p.mesh === hitObj);
                    if (found >= 0) { rootMesh = found; break; }
                    hitObj = hitObj.parent;
                  }
                  if (rootMesh >= 0) {
                    instrumentManager.select(rootMesh);
                    // Débuter le drag
                    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                    dragPlane.normal.copy(camera.getWorldDirection(new THREE.Vector3())).negate();
                    instrDragState = {
                      active: true, instrIdx: rootMesh, startMouse: { x: e.clientX, y: e.clientY },
                      startPos: instrumentManager.placedInstruments[rootMesh].mesh.position.clone(), plane: dragPlane
                    };
                    // Ouvrir le panneau si fermé
                    const panel = document.getElementById('instrument-panel');
                    if (panel && panel.style.display === 'none') toggleInstrumentPanel();
                    return; // Ne pas déclencher la rotation de la scène
                  }
                }
              }
              mouseDown = true; mouseX = e.clientX; mouseY = e.clientY;
            });
            canvas.addEventListener('mousemove', e => {
              if (twin.active && twin.deformMode) { twinGrabMove(e); return; }
              // Drag d'un instrument sélectionné
              if (instrDragState.active && instrDragState.instrIdx >= 0) {
                const entry = instrumentManager.placedInstruments[instrDragState.instrIdx];
                if (entry) {
                  const dx = (e.clientX - instrDragState.startMouse.x) * 0.005;
                  const dy = -(e.clientY - instrDragState.startMouse.y) * 0.005;
                  entry.mesh.position.x = instrDragState.startPos.x + dx * camera.position.z * 0.5;
                  const newY = instrDragState.startPos.y + dy * camera.position.z * 0.5;
                  entry._baseY = newY; // _baseY synchronisé pour animation non-cumulative
                  // Sync sliders
                  const ctrlX = document.getElementById('ctrl-x');
                  const ctrlY = document.getElementById('ctrl-y');
                  if (ctrlX) ctrlX.value = entry.mesh.position.x;
                  if (ctrlY) ctrlY.value = newY;
                }
                return;
              }
              if (!mouseDown) return;
              rotY += (e.clientX - mouseX) * 0.008; rotX += (e.clientY - mouseY) * 0.008;
              mouseX = e.clientX; mouseY = e.clientY;
            });
            canvas.addEventListener('mouseup', () => { mouseDown = false; twinGrabEnd(); instrDragState.active = false; });
            canvas.addEventListener('mouseleave', () => { mouseDown = false; twinGrabEnd(); instrDragState.active = false; });
            canvas.addEventListener('wheel', e => { camera.position.z = Math.max(2.5, Math.min(10, camera.position.z + e.deltaY * 0.005)) });

            animate();
          }

          // ── Seeded RNG so each module always renders the same anatomy shape ──
          function seedFromString(s) {
            let h = 0; for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0 }
            return h >>> 0;
          }
          function mulberry32(seed) {
            return function () {
              seed |= 0; seed = seed + 0x6D2B79F5 | 0;
              let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
              t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
              return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };
          }

          // Lump-shape generator: a noisy blob whose silhouette is biased by `axisScale`
          // so different organs (compact gland vs elongated lung vs lobed liver) read distinctly.
          function makeLumpGeometry(radius, axisScale, rng, detail) {
            const geo = new THREE.IcosahedronGeometry(radius, detail || 3);
            const pos = geo.attributes.position;
            const fx = 2 + rng() * 2, fy = 2 + rng() * 2, fz = 2 + rng() * 2;
            const px = rng() * 10, py = rng() * 10, pz = rng() * 10;
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
              const noise = Math.sin(x * fx + px) * Math.cos(y * fy + py) * 0.16 + Math.sin(z * fz + pz) * 0.11;
              pos.setXYZ(i, x * (1 + noise) * axisScale.x, y * (1 + noise * 0.8) * axisScale.y, z * (1 + noise * 0.6) * axisScale.z);
            }
            geo.computeVertexNormals();
            return geo;
          }

          // Per-specialty base silhouette so HBP/thoracique/cardiaque/etc. don't all look identical.
          const SPECIALTY_SHAPE = {
            hbp: { axis: { x: 1.35, y: 1.0, z: 0.85 }, lobes: 4, tubular: 0.55 },
            colorectal: { axis: { x: 1.6, y: 0.55, z: 0.55 }, lobes: 3, tubular: 0.7 },
            gastrique: { axis: { x: 1.1, y: 1.3, z: 0.7 }, lobes: 2, tubular: 0.35 },
            thyroide: { axis: { x: 1.3, y: 0.55, z: 0.5 }, lobes: 2, tubular: 0.25 },
            thoracique: { axis: { x: 0.85, y: 1.5, z: 0.9 }, lobes: 5, tubular: 0.6 },
            cardiaque: { axis: { x: 1.0, y: 1.15, z: 1.0 }, lobes: 4, tubular: 0.65 },
            urologie: { axis: { x: 0.75, y: 1.2, z: 0.6 }, lobes: 3, tubular: 0.5 },
            anesthesie_reanimation: { axis: { x: 1.0, y: 1.3, z: 0.8 }, lobes: 3, tubular: 0.45 }
          };

          // Words that hint a substructure should be rendered as a tube (vessel/nerve/duct)
          // vs. a small nodule cluster (ganglion/nodule) vs. a solid sub-lobe (default).
          function classifySubstructure(name) {
            const n = name.toLowerCase();
            if (/nerf|artère|art\.|veine|v\.|canal|urétère|coronaire|iva|circonflexe|aorte|pédicule|vaisseau/.test(n)) return 'tube';
            if (/ganglion|node|nodule|adénopathie/.test(n)) return 'nodule';
            return 'lobe';
          }

          function buildOrgan() {
            if (organMesh) { scene.remove(organMesh); scene.remove(wireframeMesh) }
            if (vesselGroup) { scene.remove(vesselGroup) }
            organParts = [];

            const mod = MODULES[state.mod];
            const color = new THREE.Color(mod.color);
            const shape = SPECIALTY_SHAPE[state.mod] || SPECIALTY_SHAPE.hbp;
            const rng = mulberry32(seedFromString(state.mod));

            // ── Main organ body (lump shaped per specialty) ──
            const geo = makeLumpGeometry(1.25, shape.axis, rng, 4);
            const mat = new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: 0.42, shininess: 70, side: THREE.DoubleSide });
            organMesh = new THREE.Mesh(geo, mat);
            scene.add(organMesh);
            organParts.push({ mesh: organMesh, name: mod.name, kind: 'organe' });

            const wireMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.09 });
            wireframeMesh = new THREE.Mesh(geo.clone(), wireMat);
            scene.add(wireframeMesh);

            // ── Group that holds every accessory structure (lobes/tubes/nodules), rotates with organ ──
            vesselGroup = new THREE.Group();

            // Flatten module.structures[].children into typed substructures, spread deterministically
            // around the organ body so each specialty renders a genuinely different anatomy.
            let items = [];
            (mod.structures || []).forEach(group => {
              (group.children || []).forEach(child => items.push({ group: group.name, name: child }));
            });
            if (items.length === 0) items = [{ group: mod.name, name: mod.name }];

            items.forEach((it, idx) => {
              const kind = classifySubstructure(it.name);
              const t = idx / Math.max(1, items.length);
              const theta = t * Math.PI * 2 + rng() * 0.6;
              const phi = (rng() - 0.5) * Math.PI * 0.7;
              const R = 0.55 + rng() * 0.55;
              const cx = Math.cos(theta) * Math.cos(phi) * R * shape.axis.x;
              const cy = Math.sin(phi) * R * shape.axis.y;
              const cz = Math.sin(theta) * Math.cos(phi) * R * shape.axis.z;

              let mesh;
              if (kind === 'tube') {
                const segs = [new THREE.Vector3(cx * 0.2, cy * 0.2, cz * 0.2)];
                const n = 3 + Math.floor(rng() * 2);
                for (let s = 1; s <= n; s++) {
                  const f = s / n;
                  segs.push(new THREE.Vector3(
                    cx * f + (rng() - 0.5) * 0.15,
                    cy * f + (rng() - 0.5) * 0.15,
                    cz * f + (rng() - 0.5) * 0.15
                  ));
                }
                const curve = new THREE.CatmullRomCurve3(segs);
                const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.02 + rng() * 0.025, 6, false);
                const tubeMat = new THREE.MeshPhongMaterial({ color: 0xff6b35, transparent: true, opacity: 0.8, shininess: 60 });
                mesh = new THREE.Mesh(tubeGeo, tubeMat);
              } else if (kind === 'nodule') {
                const nodGeo = new THREE.SphereGeometry(0.045 + rng() * 0.03, 10, 10);
                const nodMat = new THREE.MeshPhongMaterial({ color: 0xeab308, transparent: true, opacity: 0.85 });
                mesh = new THREE.Mesh(nodGeo, nodMat);
                mesh.position.set(cx, cy, cz);
              } else {
                const lobeGeo = makeLumpGeometry(0.28 + rng() * 0.16, { x: 1, y: 1, z: 1 }, rng, 1);
                const lobeMat = new THREE.MeshPhongMaterial({ color: color.clone().offsetHSL(0, 0, (rng() - 0.5) * 0.15), transparent: true, opacity: 0.5 });
                mesh = new THREE.Mesh(lobeGeo, lobeMat);
                mesh.position.set(cx, cy, cz);
              }
              mesh.userData = { label: it.name, group: it.group, kind };
              vesselGroup.add(mesh);
              organParts.push({ mesh, name: it.name, kind });
            });
            scene.add(vesselGroup);

            // ── Lesion marker (from module.metrics — pick the metric that reads like a size/nodule) ──
            const lesionGeo = new THREE.SphereGeometry(0.16, 16, 16);
            const lesionMat = new THREE.MeshPhongMaterial({ color: 0xef4444, transparent: true, opacity: 0.55, emissive: 0x330000 });
            const lesionMesh = new THREE.Mesh(lesionGeo, lesionMat);
            lesionMesh.position.set(0.35 * shape.axis.x, 0.15 * shape.axis.y, 0.25 * shape.axis.z);
            lesionMesh.userData = { label: 'Lésion cible', kind: 'lesion' };
            vesselGroup.add(lesionMesh);
            organParts.push({ mesh: lesionMesh, name: 'Lésion cible', kind: 'lesion' });

            // ── Clip / resection plane visual ──
            const discGeo = new THREE.RingGeometry(0.2, 1.8, 32);
            const discMat = new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
            clipPlane = new THREE.Mesh(discGeo, discMat);
            clipPlane.position.set(0.3, 0, 0);
            clipPlane.rotation.y = Math.PI / 2;
            scene.add(clipPlane);

            // Anatomy also drives the MPR procedural volume so both views stay consistent.
            buildProceduralVolume();
          }

          // ════════════════════════════════════════════════
          //  JUMEAU NUMÉRIQUE — tissu mou déformable (Position-Based Dynamics)
          // ════════════════════════════════════════════════
          // Position Based Dynamics (Müller et al., 2007) : au lieu d'intégrer des
          // forces (masse-ressort classique, instable à pas de temps grossier), on
          // déplace directement les particules pour satisfaire des contraintes de
          // distance, résolues itérativement. Choisi ici pour deux raisons concrètes :
          // (1) inconditionnellement stable même si le framerate du navigateur varie —
          // un masse-ressort explicite « explose » facilement dans ces conditions ;
          // (2) implémentation compacte et auditable (~120 lignes), sans dépendance
          // physique externe (cannon-es, ammo.js...) — important dans un logiciel
          // médical où chaque comportement doit pouvoir être relu et justifié.
          //
          // Portée honnête : ceci est une DÉMONSTRATION de déformation de tissu mou
          // (retour élastique après palpation/traction), PAS une simulation
          // biomécanique validée (pas de propriétés tissulaires réelles type
          // hyperélasticité de Mooney-Rivlin, pas de découpe/coagulation). Utile pour
          // montrer le principe et comme base d'itération, pas pour une décision
          // clinique.
          const twin = {
            active: false,
            deformMode: false,
            mesh: null,
            geometry: null,
            particles: [],       // {pos: Vector3, prev: Vector3, pinned: bool}
            constraints: [],      // {a, b, restLength}
            grabbed: null,         // index de la particule actuellement saisie, ou null
            grabPlane: null,
            raycaster: null,
            substeps: 6,           // itérations de résolution de contraintes par frame
            stiffness: 0.4,        // 0..1 — rigidité du tissu (0.2 très mou, 0.6 ferme)
            gravity: -0.35,
          };

          function buildTwinGeometry() {
            const shape = SPECIALTY_SHAPE[state.mod] || SPECIALTY_SHAPE.hbp;
            const rng = mulberry32(seedFromString(state.mod));
            // Détail=2 → assez de sommets pour un rendu convaincant, assez peu pour
            // résoudre les contraintes PBD à 60 img/s en JavaScript pur (pas de GPU
            // compute ici). Le detail=4 utilisé pour l'organe "Plan" (10k+ sommets)
            // ferait chuter le framerate si on tentait d'y appliquer PBD tel quel.
            const raw = makeLumpGeometry(1.25, shape.axis, rng, 2);
            // BUG CORRIGÉ : THREE.IcosahedronGeometry n'est PAS indexée (geo.index ===
            // null) — chaque triangle a ses 3 sommets dupliqués en mémoire, même aux
            // arêtes partagées avec le triangle voisin. Sans fusion, buildTwinConstraints
            // (qui lit geo.index) ne trouve aucune arête et le "tissu" est un nuage de
            // triangles totalement déconnectés qui tombent indépendamment sous la
            // gravité dès la première frame — un bug bien pire que "maillage invisible".
            return mergeGeometryVertices(raw);
          }

          // Retourne le vrai maillage bas-poly du foie du patient (chargé par
          // loadRealMeshesIntoScene() lors d'une segmentation IA réelle réussie),
          // ou null s'il n'y en a pas encore — auquel cas enterDigitalTwin() retombe
          // sur l'anatomie procédurale (buildTwinGeometry()). Clone la géométrie
          // pour ne pas partager le même buffer entre plusieurs sessions Jumeau
          // successives (exit/enter/reset la modifient en place via la simulation PBD).
          function buildTwinGeometryFromRealLiverMesh() {
            return realLiverTwinGeometry ? realLiverTwinGeometry.clone() : null;
          }

          // Fusionne les sommets géométriquement coïncidents d'une géométrie non
          // indexée en une géométrie indexée équivalente (mêmes triangles, sommets
          // partagés). Nécessaire pour que buildTwinConstraints() puisse déduire la
          // topologie réelle du maillage (quels sommets sont voisins).
          function mergeGeometryVertices(geo, precision = 5) {
            const pos = geo.attributes.position;
            const map = new Map();
            const newPositions = [];
            const indices = new Array(pos.count);
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
              const key = x.toFixed(precision) + '_' + y.toFixed(precision) + '_' + z.toFixed(precision);
              let idx = map.get(key);
              if (idx === undefined) {
                idx = newPositions.length / 3;
                newPositions.push(x, y, z);
                map.set(key, idx);
              }
              indices[i] = idx;
            }
            const merged = new THREE.BufferGeometry();
            merged.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
            merged.setIndex(indices);
            merged.computeVertexNormals();
            return merged;
          }

          function buildTwinParticles(geo) {
            const pos = geo.attributes.position;
            const particles = [];
            for (let i = 0; i < pos.count; i++) {
              const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
              particles.push({ pos: v, prev: v.clone(), pinned: false });
            }
            // Ancrage : les sommets du côté -X restent fixes, comme un organe retenu
            // par son pédicule vasculaire/ligament suspenseur. Sans cela, l'organe
            // entier tomberait hors champ sous la gravité — pas réaliste, et ça
            // recréerait l'impression d'un « maillage disparu ».
            // Seuil PROPORTIONNEL à l'étendue du maillage (pas une constante absolue) :
            // nécessaire pour que l'ancrage ait un sens quelle que soit l'échelle —
            // anatomie procédurale (rayon ~1.25) ou vrai maillage patient bas-poly
            // (échelle différente selon le volume hépatique réel du patient).
            geo.computeBoundingBox();
            const bbox = geo.boundingBox;
            const pinThreshold = bbox.min.x + (bbox.max.x - bbox.min.x) * 0.12;
            particles.forEach(p => { if (p.pos.x < pinThreshold) p.pinned = true; });
            return particles;
          }

          function buildTwinConstraints(geo, particles) {
            const index = geo.index;
            const seen = new Set();
            const constraints = [];
            const addConstraint = (a, b) => {
              const key = a < b ? (a + '_' + b) : (b + '_' + a);
              if (seen.has(key)) return;
              seen.add(key);
              constraints.push({ a, b, restLength: particles[a].pos.distanceTo(particles[b].pos) });
            };
            if (index) {
              const arr = index.array;
              for (let i = 0; i < arr.length; i += 3) {
                addConstraint(arr[i], arr[i + 1]); addConstraint(arr[i + 1], arr[i + 2]); addConstraint(arr[i + 2], arr[i]);
              }
            }
            return constraints;
          }

          function enterDigitalTwin() {
            if (!scene || twin.active) return;
            twin.active = true;
            twin.deformMode = false;
            twin.grabbed = null;
            twin.raycaster = twin.raycaster || new THREE.Raycaster();
            twin.grabPlane = twin.grabPlane || new THREE.Plane();

            // On masque l'organe "Plan" (sans le détruire : on le retrouve intact, avec
            // sa rotation et ses sous-structures, en quittant le mode jumeau).
            if (organMesh) organMesh.visible = false;
            if (wireframeMesh) wireframeMesh.visible = false;
            if (vesselGroup) vesselGroup.visible = false;
            if (clipPlane) clipPlane.visible = false;

            // Vrai maillage du patient (segmentation IA réelle) si disponible,
            // sinon anatomie procédurale générique — voir buildTwinGeometryFromRealLiverMesh().
            const realGeo = buildTwinGeometryFromRealLiverMesh();
            twin.geometry = realGeo || buildTwinGeometry();
            twin.usingRealMesh = !!realGeo;
            twin.particles = buildTwinParticles(twin.geometry);
            twin.constraints = buildTwinConstraints(twin.geometry, twin.particles);

            const mod = MODULES[state.mod];
            const mat = new THREE.MeshPhongMaterial({
              color: new THREE.Color(mod.color), transparent: true, opacity: 0.6, shininess: 55,
              side: THREE.DoubleSide,
            });
            twin.mesh = new THREE.Mesh(twin.geometry, mat);
            scene.add(twin.mesh);

            // Marqueurs des points d'ancrage (pédicule) — enfants du mesh pour hériter
            // automatiquement sa rotation, pas de synchronisation manuelle nécessaire.
            const anchorGeo = new THREE.SphereGeometry(0.045, 8, 8);
            const anchorMat = new THREE.MeshBasicMaterial({ color: 0xff6b35 });
            twin.particles.forEach(p => {
              if (p.pinned) {
                const s = new THREE.Mesh(anchorGeo, anchorMat);
                s.position.copy(p.pos);
                twin.mesh.add(s);
              }
            });

            document.getElementById('vp-tools-normal').style.display = 'none';
            document.getElementById('vp-tools-twin').style.display = 'flex';
            document.getElementById('twin-hint').style.display = 'block';
            notify(twin.usingRealMesh
              ? `Jumeau numérique activé — maillage réel du patient (segmentation IA)`
              : `Jumeau numérique activé — ${mod.name} (anatomie procédurale générique, aucune segmentation réelle chargée)`,
              'ok');
          }

          function exitDigitalTwin() {
            if (!twin.active) return;
            twin.active = false;
            twin.deformMode = false;
            twin.resectMode = false;
            twin.grabbed = null;
            if (twin.mesh) {
              scene.remove(twin.mesh);
              twin.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
              twin.mesh = null;
            }
            twin.particles = []; twin.constraints = [];
            if (organMesh) organMesh.visible = true;
            if (wireframeMesh) wireframeMesh.visible = true;
            if (vesselGroup) vesselGroup.visible = true;
            if (clipPlane) clipPlane.visible = true;

            document.getElementById('vp-tools-normal').style.display = 'flex';
            document.getElementById('vp-tools-twin').style.display = 'none';
            document.getElementById('twin-hint').style.display = 'none';
            const resectPanel = document.getElementById('resection-panel');
            if (resectPanel) resectPanel.style.display = 'none';
          }

          function resetDigitalTwin() {
            if (!twin.active) return;
            exitDigitalTwin();
            enterDigitalTwin();
          }

          function setTwinInteraction(mode) {
            twin.deformMode = (mode === 'deform');
            twin.resectMode = (mode === 'resect');

            const btnRot = document.getElementById('twin-btn-rotate');
            const btnDef = document.getElementById('twin-btn-deform');
            const btnRes = document.getElementById('twin-btn-resect');
            if (btnRot) btnRot.classList.toggle('on', mode === 'rotate');
            if (btnDef) btnDef.classList.toggle('on', mode === 'deform');
            if (btnRes) btnRes.classList.toggle('on', mode === 'resect');

            const resectPanel = document.getElementById('resection-panel');
            if (resectPanel) resectPanel.style.display = twin.resectMode ? 'block' : 'none';

            if (clipPlane) clipPlane.visible = twin.resectMode;
            if (twin.resectMode) updateResectionPlane();
          }

          function setResectionAxis(axis) {
            twin.resectAxis = axis;
            ['x', 'y', 'z'].forEach(a => {
              const el = document.getElementById('resect-axe-' + a);
              if (el) el.classList.toggle('on', a === axis);
            });
            updateResectionPlane();
          }

          function updateResectionPlane() {
            if (!twin.active || !clipPlane) return;
            const slider = document.getElementById('resect-x');
            const val = slider ? parseFloat(slider.value) / 100 : 0.3;
            const axis = twin.resectAxis || 'x';

            // Repositionne le plan de coupe visuel
            clipPlane.visible = true;
            clipPlane.position.set(0, 0, 0);
            clipPlane.rotation.set(0, 0, 0);

            if (axis === 'x') {
              clipPlane.position.x = val;
              clipPlane.rotation.y = Math.PI / 2;
            } else if (axis === 'y') {
              clipPlane.position.y = val;
              clipPlane.rotation.x = Math.PI / 2;
            } else {
              clipPlane.position.z = val;
            }

            // Calcul du volume réséqué (proportion de sommets du maillage jumeau du côté réséqué)
            if (!twin.particles || !twin.particles.length) return;
            let total = twin.particles.length;
            let resectedCount = 0;
            twin.particles.forEach(p => {
              const coord = axis === 'x' ? p.pos.x : (axis === 'y' ? p.pos.y : p.pos.z);
              if (coord > val) resectedCount++;
            });

            const ratio = resectedCount / total;
            // Volume de l'organe du CAS RÉELLEMENT CHARGÉ (PLATFORM_MODE.activeCase.geometry,
            // voir CASE_LIBRARY dans app-modes.js) — plus une constante 1200 identique
            // pour tous les cas. Repli à 1200 cm³ (foie adulte moyen) uniquement si
            // aucun cas de simulation avec géométrie n'est chargé (ex: usage hors Mode Simulation).
            const caseGeometry = (typeof PLATFORM_MODE !== 'undefined') ? PLATFORM_MODE.activeCase?.geometry : null;
            const approxTotalVol = caseGeometry?.organVolMl || 1200;
            const volRemoved = Math.round(approxTotalVol * ratio);
            const volRemain  = Math.round(approxTotalVol * (1 - ratio));

            const elRem = document.getElementById('resect-vol-removed');
            const elKeep = document.getElementById('resect-vol-remain');
            if (elRem) elRem.textContent = volRemoved;
            if (elKeep) elKeep.textContent = volRemain;

            // Calcul de la marge tumorale (distance entre le plan et la lésion cible)
            // Lésion positionnée à (0.35, 0.15, 0.25) dans le maillage générique du
            // jumeau numérique — ceci reste une position ILLUSTRATIVE (le jumeau est
            // une forme générique, pas la segmentation du cas). Ce qui EST spécifique
            // au cas, en revanche, c'est le seuil de sécurité utilisé plus bas.
            const lesionPos = { x: 0.35, y: 0.15, z: 0.25 };
            const planePos  = val;
            const lesionCoord = axis === 'x' ? lesionPos.x : (axis === 'y' ? lesionPos.y : lesionPos.z);
            const marginDistMm = Math.round(Math.abs(lesionCoord - planePos) * 100); // 1.0 unite = ~100mm

            const elMargT = document.getElementById('resect-margin-tumor');
            if (elMargT) elMargT.textContent = marginDistMm;

            // Calcul de la marge vasculaire (vaisseau le plus proche)
            const vesselPos = { x: 0.1, y: 0.1, z: 0.1 };
            const vesselCoord = axis === 'x' ? vesselPos.x : (axis === 'y' ? vesselPos.y : vesselPos.z);
            const marginVesselMm = Math.round(Math.abs(vesselCoord - planePos) * 100);

            const elMargV = document.getElementById('resect-margin-vessel');
            if (elMargV) elMargV.textContent = marginVesselMm;

            // Badge de sécurité des marges — seuil dérivé de la distance vaisseau
            // RÉELLE du cas chargé (CASE_LIBRARY[...].geometry.criticalVesselDistanceMm)
            // au lieu d'un seuil générique 10/5mm identique pour tous les cas.
            const vesselThresholdMm = caseGeometry?.criticalVesselDistanceMm ?? 10;
            const warnThresholdMm = vesselThresholdMm / 2;
            const badge = document.getElementById('resect-safety-badge');
            if (badge) {
              if (marginDistMm >= vesselThresholdMm) {
                badge.style.background = 'rgba(16,185,129,.15)';
                badge.style.color = '#10b981';
                badge.textContent = `✅ Marge sécuritaire (${marginDistMm} mm ≥ ${vesselThresholdMm} mm requis pour ce cas)`;
              } else if (marginDistMm >= warnThresholdMm) {
                badge.style.background = 'rgba(250,204,21,.15)';
                badge.style.color = '#facc15';
                badge.textContent = `⚠️ Marge limite (${marginDistMm} mm, entre ${warnThresholdMm} et ${vesselThresholdMm} mm)`;
              } else {
                badge.style.background = 'rgba(239,68,68,.15)';
                badge.style.color = '#ef4444';
                badge.textContent = `❌ Marge insuffisante (${marginDistMm} mm < ${warnThresholdMm} mm)`;
              }
            }
          }

          function stepTwinPhysics(dt) {
            if (!twin.active || !twin.particles.length) return;
            const g = twin.gravity;
            twin.particles.forEach((p, i) => {
              if (p.pinned || i === twin.grabbed) return;
              const vx = (p.pos.x - p.prev.x) * 0.98, vy = (p.pos.y - p.prev.y) * 0.98 + g * dt * dt, vz = (p.pos.z - p.prev.z) * 0.98;
              p.prev.copy(p.pos);
              p.pos.x += vx; p.pos.y += vy; p.pos.z += vz;
            });

            for (let iter = 0; iter < twin.substeps; iter++) {
              for (const c of twin.constraints) {
                const pa = twin.particles[c.a], pb = twin.particles[c.b];
                const aFixed = pa.pinned || c.a === twin.grabbed;
                const bFixed = pb.pinned || c.b === twin.grabbed;
                if (aFixed && bFixed) continue;
                const delta = new THREE.Vector3().subVectors(pb.pos, pa.pos);
                const dist = delta.length() || 1e-6;
                const diff = (dist - c.restLength) / dist;
                const wa = aFixed ? 0 : 1, wb = bFixed ? 0 : 1, wSum = wa + wb;
                const corr = delta.multiplyScalar(twin.stiffness * diff / wSum);
                if (!aFixed) pa.pos.add(corr.clone().multiplyScalar(wa));
                if (!bFixed) pb.pos.sub(corr.clone().multiplyScalar(wb));
              }
            }

            const posAttr = twin.geometry.attributes.position;
            twin.particles.forEach((p, i) => posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z));
            posAttr.needsUpdate = true;
            twin.geometry.computeVertexNormals();
          }

          function twinNdcFromEvent(e) {
            const rect = renderer.domElement.getBoundingClientRect();
            return new THREE.Vector2(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
          }

          function twinGrabStart(e) {
            if (!twin.mesh) return;
            twin.raycaster.setFromCamera(twinNdcFromEvent(e), camera);
            const hit = twin.raycaster.intersectObject(twin.mesh)[0];
            if (!hit) return;
            const localPoint = twin.mesh.worldToLocal(hit.point.clone());
            let best = -1, bestD = Infinity;
            twin.particles.forEach((p, i) => {
              if (p.pinned) return;
              const d = p.pos.distanceTo(localPoint);
              if (d < bestD) { bestD = d; best = i; }
            });
            if (best < 0) return;
            twin.grabbed = best;
            const worldNormal = camera.getWorldDirection(new THREE.Vector3());
            twin.grabPlane.setFromNormalAndCoplanarPoint(worldNormal, hit.point);
          }

          function twinGrabMove(e) {
            if (twin.grabbed == null) return;
            twin.raycaster.setFromCamera(twinNdcFromEvent(e), camera);
            const target = new THREE.Vector3();
            if (twin.raycaster.ray.intersectPlane(twin.grabPlane, target)) {
              const local = twin.mesh.worldToLocal(target.clone());
              const p = twin.particles[twin.grabbed];
              p.pos.copy(local);
              p.prev.copy(local); // vitesse nulle pendant la saisie -> pas de "lancer" involontaire
            }
          }

          function twinGrabEnd() {
            twin.grabbed = null;
          }

          function animate() {
            requestAnimationFrame(animate);
            const t = Date.now() * 0.001;

            if (twin.active) {
              if (!twin.deformMode) {
                twin.mesh.rotation.y += 0.002;
                twin.mesh.rotation.y += rotY * 0.02; twin.mesh.rotation.x += rotX * 0.02;
                rotX *= 0.95; rotY *= 0.95;
              }
              stepTwinPhysics(1 / 60);
            } else if (organMesh) {
              organMesh.rotation.y += 0.002;
              organMesh.rotation.y += rotY * 0.02; organMesh.rotation.x += rotX * 0.02;
              wireframeMesh.rotation.copy(organMesh.rotation);
              vesselGroup.rotation.copy(organMesh.rotation);
              clipPlane.rotation.copy(organMesh.rotation);
              rotX *= 0.95; rotY *= 0.95;
            }

            // — L'isosurface DICOM voxelisée partage la même rotation que l'organe procédural —
            if (typeof dicomIsoMesh !== 'undefined' && dicomIsoMesh && !twin.active) {
              // Spin auto uniquement si activé
              if (typeof dicomSpinEnabled === 'undefined' || dicomSpinEnabled) {
                dicomIsoMesh.rotation.y += (typeof dicomSpinSpeed !== 'undefined' ? dicomSpinSpeed : 0.002);
              }
              dicomIsoMesh.rotation.y += rotY * 0.02; dicomIsoMesh.rotation.x += rotX * 0.02;
            }

            // — Animation des instruments 3D —
            if (typeof instrumentManager !== 'undefined' && instrumentManager.placedInstruments.length > 0) {
              instrumentManager.placedInstruments.forEach((entry, i) => {
                if (!entry.mesh) return;
                // Initialise la position de base au premier passage (non-cumulative)
                if (!entry._baseY) entry._baseY = entry.mesh.position.y;
                const isSelected = (i === instrumentManager.selectedIdx);
                // Flottement sinusoïdal autour de la position de base (non-cumulatif)
                const freq = 0.5 + i * 0.13;
                const amp = isSelected ? 0.12 : 0.06;
                if (!instrDragState.active || instrDragState.instrIdx !== i) {
                  entry.mesh.position.y = entry._baseY + Math.sin(t * freq + i * 1.2) * amp;
                  // Rotation Y continue et clairement visible
                  entry.mesh.rotation.y = t * (isSelected ? 1.2 : 0.6) + i * Math.PI * 0.4;
                  // Inclinaison oscillante sur X (effet de balançage)
                  entry.mesh.rotation.x = Math.sin(t * 0.4 + i) * 0.08;
                }
                // Pulsation emissive sur l'instrument sélectionné
                if (isSelected) {
                  entry.mesh.traverse(o => {
                    if (o.material && o.material.emissive) {
                      o.material.emissiveIntensity = 0.2 + 0.18 * Math.sin(t * 4);
                    }
                  });
                }
              });
            }

            renderer.render(scene, camera);
          }

          function onResize() {
            if (!renderer) return;
            const wrap = document.getElementById('viewport-wrap');
            const w = wrap.clientWidth, h = wrap.clientHeight;
            renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
          }

          // ════════════════════════════════════════════════
          //  LIBRAIRIE D'INSTRUMENTS CHIRURGICAUX 3D
          //  Assets procéduraux Three.js + moteur de placement interactif
          // ════════════════════════════════════════════════

          // Catalogue complet de la librairie d'instruments
          const INSTRUMENT_LIBRARY = [
            // ── ENDOSCOPIE & IMAGERIE ──
            {
              id: 'laparoscope_hd', name: 'Laparoscope HD 30°', category: 'endo',
              icon: '📷', color: 0x374151, emissive: 0x001133,
              desc: 'Optique 10mm, éclair. LED, champ 30°',
              build(THREE) {
                const g = new THREE.Group();
                // Corps cylindrique principal
                const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1f2937, shininess: 120 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.rotation.z = Math.PI / 2; g.add(body);
                // Tête optique (sphère bleutée)
                const lensGeo = new THREE.SphereGeometry(0.055, 16, 16);
                const lensMat = new THREE.MeshPhongMaterial({ color: 0x1e40af, emissive: 0x001133, transparent: true, opacity: 0.9, shininess: 200 });
                const lens = new THREE.Mesh(lensGeo, lensMat); lens.position.set(0.62, 0, 0); g.add(lens);
                // Anneau de lumiere LED
                const ringGeo = new THREE.TorusGeometry(0.05, 0.008, 8, 24);
                const ringMat = new THREE.MeshPhongMaterial({ color: 0xfef3c7, emissive: 0x554400, shininess: 80 });
                const ring = new THREE.Mesh(ringGeo, ringMat); ring.position.set(0.58, 0, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
                // Câble lumiere froide
                const cableGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8);
                const cableMat = new THREE.MeshPhongMaterial({ color: 0x111827 });
                const cable = new THREE.Mesh(cableGeo, cableMat); cable.position.set(-0.4, -0.08, 0); cable.rotation.z = Math.PI / 4; g.add(cable);
                return g;
              }
            },
            {
              id: 'camera_4k', name: 'Tête de caméra 4K 3D', category: 'endo',
              icon: '🎬', color: 0x111827, emissive: 0x000011,
              desc: 'Caméra 3D 4K, 2 capteurs 1/2.3"',
              build(THREE) {
                const g = new THREE.Group();
                const bodyGeo = new THREE.BoxGeometry(0.22, 0.12, 0.12);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x111827, shininess: 150 });
                g.add(new THREE.Mesh(bodyGeo, bodyMat));
                // Deux objectifs (stéréo)
                [-0.04, 0.04].forEach(oy => {
                  const lenGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12);
                  const lenMat = new THREE.MeshPhongMaterial({ color: 0x1e40af, emissive: 0x000066, transparent: true, opacity: 0.92, shininess: 220 });
                  const l = new THREE.Mesh(lenGeo, lenMat); l.rotation.z = Math.PI / 2; l.position.set(0.12, oy, 0); g.add(l);
                });
                // Logo LED
                const indGeo = new THREE.SphereGeometry(0.012, 8, 8);
                const indMat = new THREE.MeshPhongMaterial({ color: 0x10b981, emissive: 0x005522 });
                const ind = new THREE.Mesh(indGeo, indMat); ind.position.set(-0.09, 0.05, 0.06); g.add(ind);
                return g;
              }
            },
            // ── INSTRUMENTS DE COUPE ──
            {
              id: 'bistouri_lame', name: 'Bistouri lame #22', category: 'coupe',
              icon: '🔪', color: 0xd1d5db, emissive: 0x000000,
              desc: 'Manche INOX, lame acier carbone #22',
              build(THREE) {
                const g = new THREE.Group();
                // Manche
                const handleGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.9, 12);
                const handleMat = new THREE.MeshPhongMaterial({ color: 0xd1d5db, shininess: 180 });
                const handle = new THREE.Mesh(handleGeo, handleMat); handle.rotation.z = Math.PI / 2; g.add(handle);
                // Garde
                const guardGeo = new THREE.BoxGeometry(0.028, 0.06, 0.02);
                const guardMat = new THREE.MeshPhongMaterial({ color: 0x9ca3af, shininess: 160 });
                const guard = new THREE.Mesh(guardGeo, guardMat); guard.position.set(0.42, 0, 0); g.add(guard);
                // Lame (profil triangulaire plat — curviléaire)
                const bladeShape = new THREE.Shape();
                bladeShape.moveTo(0, 0); bladeShape.lineTo(0.35, 0.0); bladeShape.lineTo(0.22, 0.04); bladeShape.closePath();
                const bladeGeo = new THREE.ShapeGeometry(bladeShape);
                const bladeMat = new THREE.MeshPhongMaterial({ color: 0xe5e7eb, side: THREE.DoubleSide, shininess: 240 });
                const blade = new THREE.Mesh(bladeGeo, bladeMat); blade.position.set(0.45, 0, 0); g.add(blade);
                return g;
              }
            },
            {
              id: 'ciseau_mayo', name: 'Ciseaux de Mayo courbés', category: 'coupe',
              icon: '✂️', color: 0xe5e7eb, emissive: 0x000000,
              desc: 'Ciseaux dissection INOX, 17 cm',
              build(THREE) {
                const g = new THREE.Group();
                const mat = new THREE.MeshPhongMaterial({ color: 0xd1d5db, shininess: 200 });
                // Anneau gauche
                const r1Geo = new THREE.TorusGeometry(0.055, 0.012, 8, 24); const r1 = new THREE.Mesh(r1Geo, mat); r1.position.set(-0.4, 0, 0); g.add(r1);
                // Anneau droit
                const r2Geo = new THREE.TorusGeometry(0.055, 0.012, 8, 24); const r2 = new THREE.Mesh(r2Geo, mat); r2.position.set(-0.25, 0.08, 0); g.add(r2);
                // Branche 1
                const b1Geo = new THREE.CylinderGeometry(0.009, 0.009, 0.9, 8); const b1 = new THREE.Mesh(b1Geo, mat); b1.rotation.z = Math.PI / 2; b1.position.set(0.08, 0.025, 0); g.add(b1);
                // Branche 2 (légèrement écartée)
                const b2Geo = new THREE.CylinderGeometry(0.009, 0.009, 0.9, 8); const b2 = new THREE.Mesh(b2Geo, mat); b2.rotation.z = Math.PI / 2; b2.position.set(0.08, -0.02, 0.01); g.add(b2);
                return g;
              }
            },
            {
              id: 'pince_dissection', name: 'Pince de dissection endo', category: 'coupe',
              icon: '🥺', color: 0x9ca3af, emissive: 0x000000,
              desc: 'Pince Maryland 5mm, rotation 360°',
              build(THREE) {
                const g = new THREE.Group();
                const mat = new THREE.MeshPhongMaterial({ color: 0x6b7280, shininess: 160 });
                // Tige d'insertion
                const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 12); const shaft = new THREE.Mesh(shaftGeo, mat); shaft.rotation.z = Math.PI / 2; g.add(shaft);
                // Mâchoire 1 (prong)
                const jaw1Geo = new THREE.CylinderGeometry(0.007, 0.003, 0.18, 8); const jaw1 = new THREE.Mesh(jaw1Geo, mat); jaw1.rotation.z = Math.PI / 2 + 0.15; jaw1.position.set(0.56, 0.04, 0); g.add(jaw1);
                // Mâchoire 2
                const jaw2Geo = new THREE.CylinderGeometry(0.007, 0.003, 0.18, 8); const jaw2 = new THREE.Mesh(jaw2Geo, mat); jaw2.rotation.z = Math.PI / 2 - 0.15; jaw2.position.set(0.56, -0.04, 0); g.add(jaw2);
                // Pivot
                const pivotGeo = new THREE.SphereGeometry(0.028, 12, 12); const pivot = new THREE.Mesh(pivotGeo, mat); pivot.position.set(0.5, 0, 0); g.add(pivot);
                return g;
              }
            },
            // ── ROBOTIQUE CHIRURGICALE ──
            {
              id: 'davinci_arm', name: 'Bras Da Vinci 5 (EndoWrist)', category: 'robot',
              icon: '🤖', color: 0x6366f1, emissive: 0x110022,
              desc: '7 DDL, serrage 1N-40N, ech. 10:1',
              build(THREE) {
                const g = new THREE.Group();
                // Segment proximal
                const s1Mat = new THREE.MeshPhongMaterial({ color: 0x4338ca, shininess: 140 });
                const s1Geo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12); const s1 = new THREE.Mesh(s1Geo, s1Mat); s1.rotation.z = Math.PI / 2; s1.position.set(-0.2, 0, 0); g.add(s1);
                // Coude 1
                const e1Geo = new THREE.SphereGeometry(0.045, 12, 12); const e1 = new THREE.Mesh(e1Geo, s1Mat); e1.position.set(0.1, 0, 0); g.add(e1);
                // Segment distal (incliné)
                const s2Mat = new THREE.MeshPhongMaterial({ color: 0x4f46e5, shininess: 160 });
                const s2Geo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12); const s2 = new THREE.Mesh(s2Geo, s2Mat); s2.rotation.z = Math.PI / 2 + 0.35; s2.position.set(0.32, 0.07, 0); g.add(s2);
                // Poignet (wrist)
                const wGeo = new THREE.SphereGeometry(0.033, 12, 12); const w = new THREE.Mesh(wGeo, s2Mat); w.position.set(0.52, 0.16, 0); g.add(w);
                // Effecteur (pinces)
                const eMat = new THREE.MeshPhongMaterial({ color: 0x818cf8, shininess: 200 });
                [0.035, -0.035].forEach(oy => {
                  const eGeo = new THREE.CylinderGeometry(0.01, 0.005, 0.14, 8); const e = new THREE.Mesh(eGeo, eMat); e.rotation.z = Math.PI / 2 + 0.2; e.position.set(0.62 + Math.abs(oy), 0.22 + oy, 0); g.add(e);
                });
                // Bague LED de statut (verte = actif)
                const ledGeo = new THREE.TorusGeometry(0.046, 0.006, 6, 20); const ledMat = new THREE.MeshPhongMaterial({ color: 0x10b981, emissive: 0x004422 }); const led = new THREE.Mesh(ledGeo, ledMat); led.position.set(0.1, 0, 0); led.rotation.y = Math.PI / 2; g.add(led);
                return g;
              }
            },
            {
              id: 'hugo_trocar', name: 'Trocard Hugo RAS 8mm', category: 'robot',
              icon: '🔧', color: 0xf59e0b, emissive: 0x220800,
              desc: 'Accès mécanique robotisé, valve Hasson',
              build(THREE) {
                const g = new THREE.Group();
                const mat = new THREE.MeshPhongMaterial({ color: 0xd97706, shininess: 120 });
                // Canule principale
                const canGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.9, 16); const can = new THREE.Mesh(canGeo, mat); g.add(can);
                // Tête (poignée)
                const topGeo = new THREE.CylinderGeometry(0.075, 0.055, 0.1, 16); const top = new THREE.Mesh(topGeo, mat); top.position.y = 0.5; g.add(top);
                // Valve (anneau de maintien)
                const valveGeo = new THREE.TorusGeometry(0.042, 0.012, 8, 20); const valveMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24, shininess: 100 }); const valve = new THREE.Mesh(valveGeo, valveMat); valve.position.y = 0.38; valve.rotation.x = Math.PI / 2; g.add(valve);
                // Stylet (retraiteraçon)
                const styletGeo = new THREE.CylinderGeometry(0.01, 0.005, 1.05, 8); const styletMat = new THREE.MeshPhongMaterial({ color: 0x9ca3af }); const stylet = new THREE.Mesh(styletGeo, styletMat); stylet.position.y = -0.03; g.add(stylet);
                g.rotation.x = Math.PI / 8;
                return g;
              }
            },
            // ── ÉNERGIE & HÉMOSTASE ──
            {
              id: 'coagulation_bipolaire', name: 'Pince bipolaire énergie', category: 'energie',
              icon: '⚡', color: 0xf59e0b, emissive: 0x331100,
              desc: 'Lig. vasculaire 7mm, 300 W bipol.',
              build(THREE) {
                const g = new THREE.Group();
                const mat = new THREE.MeshPhongMaterial({ color: 0x92400e, shininess: 140 });
                // Corps principal
                const bodyGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 12); const body = new THREE.Mesh(bodyGeo, mat); body.rotation.z = Math.PI / 2; g.add(body);
                // Bandes d'énergie (jaunes)
                [-.3, 0, .3].forEach(x => {
                  const bGeo = new THREE.TorusGeometry(0.031, 0.006, 6, 20); const bMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24, emissive: 0x221100 }); const b = new THREE.Mesh(bGeo, bMat); b.position.set(x, 0, 0); b.rotation.y = Math.PI / 2; g.add(b);
                });
                // Mâchoires (bipolaires)
                const jMat = new THREE.MeshPhongMaterial({ color: 0xfef3c7, shininess: 220 });
                [0.04, -0.04].forEach(oy => {
                  const jGeo = new THREE.BoxGeometry(0.22, 0.012, 0.012); const j = new THREE.Mesh(jGeo, jMat); j.position.set(0.61, oy, 0); g.add(j);
                });
                // Lueur d'énergie (emissive sphere)
                const glowGeo = new THREE.SphereGeometry(0.02, 8, 8); const glowMat = new THREE.MeshPhongMaterial({ color: 0xfef08a, emissive: 0x554400, transparent: true, opacity: 0.8 }); const glow = new THREE.Mesh(glowGeo, glowMat); glow.position.set(0.72, 0, 0); g.add(glow);
                return g;
              }
            },
            {
              id: 'electrocautere_monopolaire', name: 'Bistouri électrique monopolaire', category: 'energie',
              icon: '🔥', color: 0xef4444, emissive: 0x220000,
              desc: 'ESU monopolaire, 350W, mode coupe/coag',
              build(THREE) {
                const g = new THREE.Group();
                const mat = new THREE.MeshPhongMaterial({ color: 0xfef3c7, shininess: 120 });
                // Manche plastique jaune
                const hGeo = new THREE.BoxGeometry(0.9, 0.045, 0.045); const h = new THREE.Mesh(hGeo, mat); g.add(h);
                // Boutons de mode (rouge=coag, bleu=coupe)
                const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.05), new THREE.MeshPhongMaterial({ color: 0xef4444 })); r.position.set(-0.12, 0.03, 0); g.add(r);
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.05), new THREE.MeshPhongMaterial({ color: 0x3b82f6 })); b.position.set(-0.2, 0.03, 0); g.add(b);
                // Pointe active
                const tipGeo = new THREE.CylinderGeometry(0.005, 0.001, 0.18, 8); const tipMat = new THREE.MeshPhongMaterial({ color: 0x9ca3af, emissive: 0x330000, shininess: 240 }); const tip = new THREE.Mesh(tipGeo, tipMat); tip.rotation.z = Math.PI / 2; tip.position.set(0.54, 0, 0); g.add(tip);
                return g;
              }
            },
            {
              id: 'aspirateur_suction', name: 'Aspirateur-irrigateur CUSA', category: 'energie',
              icon: '💧', color: 0x06b6d4, emissive: 0x001122,
              desc: 'CUSA Excell, ultra-sons 23kHz, aspiration 500 mmHg',
              build(THREE) {
                const g = new THREE.Group();
                const mat = new THREE.MeshPhongMaterial({ color: 0x0891b2, shininess: 140 });
                // Tuyau principal
                const tGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 12); const t = new THREE.Mesh(tGeo, mat); t.rotation.z = Math.PI / 2; g.add(t);
                // Raccord aspiration
                const rGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 16); const rMat = new THREE.MeshPhongMaterial({ color: 0x22d3ee, shininess: 160 }); const r = new THREE.Mesh(rGeo, rMat); r.position.set(-0.3, 0, 0); r.rotation.y = Math.PI / 2; g.add(r);
                // Pointe ultrasonore
                const pGeo = new THREE.CylinderGeometry(0.012, 0.004, 0.2, 8); const pMat = new THREE.MeshPhongMaterial({ color: 0x67e8f9, shininess: 220 }); const p = new THREE.Mesh(pGeo, pMat); p.rotation.z = Math.PI / 2; p.position.set(0.62, 0, 0); g.add(p);
                return g;
              }
            }
          ];

          // ── Gestionnaire d'instruments 3D ──
          const instrumentManager = {
            placedInstruments: [],  // [{id, mesh, data, selected}]
            selectedIdx: -1,
            activeCategory: 'all',

            // Place un instrument dans la scène à une position par défaut intelligente
            place(instrData) {
              if (!scene || !renderer) { notify('Viewport 3D non initialisé — ouvrez la vue 3D', 'warn'); return; }
              const mesh = instrData.build(THREE);
              // Position initiale : disposition en étoile autour du jumeau, visible dans le champ caméra
              const count = this.placedInstruments.length;
              const angle = (count / Math.max(5, this.placedInstruments.length + 1)) * Math.PI * 2;
              const radius = 2.2;
              const baseY = (count % 3 - 1) * 0.5;
              mesh.position.set(
                Math.cos(angle) * radius,
                baseY,
                Math.sin(angle) * radius
              );
              mesh.scale.setScalar(0.9);
              mesh.userData = { instrId: instrData.id, name: instrData.name };
              scene.add(mesh);
              // _baseY mémorisé immédiatement pour l'animation sinusoïdale non-cumulative
              const entry = { id: instrData.id, mesh, data: instrData, selected: false, _baseY: baseY };
              this.placedInstruments.push(entry);
              // Mise à jour compteur
              this._updateCount();
              this.select(this.placedInstruments.length - 1);
              notify(`🔪 ${instrData.name} ajouté à la scène — cliquez dessus pour le déplacer`, 'ok');
            },

            // Sélectionne un instrument placé
            select(idx) {
              // Désélectionne l'ancien
              if (this.selectedIdx >= 0 && this.placedInstruments[this.selectedIdx]) {
                this.placedInstruments[this.selectedIdx].selected = false;
                this._setHighlight(this.placedInstruments[this.selectedIdx].mesh, false);
              }
              this.selectedIdx = idx;
              if (idx < 0 || !this.placedInstruments[idx]) {
                document.getElementById('instrument-controls').style.display = 'none';
                return;
              }
              const entry = this.placedInstruments[idx];
              entry.selected = true;
              this._setHighlight(entry.mesh, true);
              document.getElementById('instrument-ctrl-title').textContent = entry.data.icon + ' ' + entry.data.name;
              document.getElementById('ctrl-x').value = entry.mesh.position.x;
              document.getElementById('ctrl-y').value = entry.mesh.position.y;
              document.getElementById('ctrl-z').value = entry.mesh.position.z;
              document.getElementById('ctrl-ry').value = entry.mesh.rotation.y;
              document.getElementById('ctrl-scale').value = entry.mesh.scale.x;
              document.getElementById('instrument-controls').style.display = 'block';
            },

            moveSelected(axis, val) {
              if (this.selectedIdx < 0) return;
              const entry = this.placedInstruments[this.selectedIdx];
              const m = entry.mesh;
              if (axis === 'x') m.position.x = val;
              if (axis === 'y') { entry._baseY = val; } // _baseY mis à jour pour que l'animation ne l'écrase pas
              if (axis === 'z') m.position.z = val;
            },

            rotateSelected(axis, val) {
              if (this.selectedIdx < 0) return;
              const m = this.placedInstruments[this.selectedIdx].mesh;
              if (axis === 'y') m.rotation.y = val;
            },

            scaleSelected(val) {
              if (this.selectedIdx < 0) return;
              this.placedInstruments[this.selectedIdx].mesh.scale.setScalar(val);
            },

            removeSelected() {
              if (this.selectedIdx < 0) return;
              const entry = this.placedInstruments.splice(this.selectedIdx, 1)[0];
              scene.remove(entry.mesh);
              entry.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
              this.selectedIdx = -1;
              this._updateCount();
              document.getElementById('instrument-controls').style.display = 'none';
              renderInstrumentList(this.activeCategory);
              notify(`🗑️ ${entry.data.name} retiré de la scène`, 'info');
            },

            clearAll() {
              [...this.placedInstruments].forEach(e => {
                scene.remove(e.mesh);
                e.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
              });
              this.placedInstruments = [];
              this.selectedIdx = -1;
              this._updateCount();
              document.getElementById('instrument-controls').style.display = 'none';
              notify('🗑️ Tous les instruments retirés de la scène', 'info');
            },

            _setHighlight(mesh, on) {
              mesh.traverse(o => {
                if (o.material) {
                  o.material.emissiveIntensity = on ? 0.4 : (o.material.emissiveIntensity > 0.35 ? 0.2 : 0);
                  if (on && o.material.color) o.material.emissive = new THREE.Color(0x1e1b4b);
                }
              });
            },

            _updateCount() {
              const el = document.getElementById('instrument-count-label');
              if (el) el.textContent = this.placedInstruments.length + ' instrument(s) en scène';
              // Met à jour la liste des instruments placés
              renderInstrumentList(this.activeCategory);
            }
          };

          function toggleInstrumentPanel() {
            const panel = document.getElementById('instrument-panel');
            const btn = document.getElementById('btn-instrument-lib');
            if (!panel) return;
            const open = panel.style.display !== 'none';
            panel.style.display = open ? 'none' : 'flex';
            if (btn) btn.classList.toggle('on', !open);
            if (!open) renderInstrumentList('all');
          }

          function filterInstruments(cat) {
            instrumentManager.activeCategory = cat;
            document.querySelectorAll('.instr-cat').forEach(b => {
              const isActive = b.id === 'icat-' + cat;
              b.style.background = isActive ? 'rgba(168,85,247,.25)' : 'var(--bg2)';
              b.style.color = isActive ? '#a855f7' : 'var(--text3)';
              b.style.borderColor = isActive ? 'rgba(168,85,247,.4)' : 'var(--border)';
            });
            renderInstrumentList(cat);
          }

          function renderInstrumentList(cat) {
            const list = document.getElementById('instrument-list');
            if (!list) return;
            const filtered = cat === 'all' ? INSTRUMENT_LIBRARY : INSTRUMENT_LIBRARY.filter(i => i.category === cat);
            const placedIds = instrumentManager.placedInstruments.map(e => e.id);

            list.innerHTML = filtered.map((instr, _) => {
              const placedEntries = instrumentManager.placedInstruments.filter(e => e.id === instr.id);
              const placedCount = placedEntries.length;
              const selectedEntry = placedEntries.find((e, i) => instrumentManager.placedInstruments.indexOf(e) === instrumentManager.selectedIdx);
              return `
      <div style="display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:6px;margin-bottom:3px;background:${placedCount > 0 ? 'rgba(168,85,247,.08)' : 'transparent'};border:1px solid ${placedCount > 0 ? 'rgba(168,85,247,.25)' : 'transparent'};cursor:pointer" onclick="instrumentManager.place(INSTRUMENT_LIBRARY.find(x=>x.id==='${instr.id}'))" title="Cliquer pour ajouter dans la scène">
        <span style="font-size:18px;min-width:22px">${instr.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:${placedCount > 0 ? '#a855f7' : 'var(--text1)'};font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${instr.name}</div>
          <div style="color:var(--text3);font-size:8.5px">${instr.desc}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <button onclick="event.stopPropagation();instrumentManager.place(INSTRUMENT_LIBRARY.find(x=>x.id==='${instr.id}'))" style="background:#a855f7;color:#fff;border:none;padding:3px 7px;border-radius:4px;font-size:9px;cursor:pointer;white-space:nowrap">${placedCount > 0 ? '+' : 'Ajouter'}</button>
          ${placedCount > 0 ? `<span style="font-size:8px;color:#a855f7">${placedCount} en scène</span>` : ''}
        </div>
      </div>`;
            }).join('');
          }

          // ════════════════════════════════════════════════
          //  MPR Canvases
          // ════════════════════════════════════════════════
          // ════════════════════════════════════════════════
          //  VOLUME — procedural (demo) or real (DICOM upload)
          // ════════════════════════════════════════════════
          // Builds a 64³ Hounsfield-like volume so the 3 MPR planes are true orthogonal
          // slices of ONE coherent 3D dataset — not three independently-drawn canvases.
          function buildProceduralVolume() {
            const N = state.mpr.volSize;
            const vol = new Float32Array(N * N * N);
            const shape = SPECIALTY_SHAPE[state.mod] || SPECIALTY_SHAPE.hbp;
            const rng = mulberry32(seedFromString(state.mod + '-vol'));
            // A handful of random blob centers for vessel-like high-density streaks
            const streaks = [];
            for (let i = 0; i < 5; i++) {
              streaks.push({
                a: [(rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6],
                b: [(rng() - 0.5) * 0.15, (rng() - 0.5) * 0.15, (rng() - 0.5) * 0.15],
                r: 0.03 + rng() * 0.02
              });
            }
            const lesionC = [0.18, 0.08, 0.13];

            for (let z = 0; z < N; z++) {
              const nz = z / N - 0.5;
              for (let y = 0; y < N; y++) {
                const ny = y / N - 0.5;
                for (let x = 0; x < N; x++) {
                  const nx = x / N - 0.5;
                  const ex = nx / (0.36 * shape.axis.x), ey = ny / (0.36 * shape.axis.y), ez = nz / (0.36 * shape.axis.z);
                  const dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
                  const wobble = Math.sin(nx * 22 + nz * 9) * 0.03 + Math.cos(ny * 18) * 0.02;
                  let hu = 0; // air/background
                  if (dist < 1.0 + wobble) {
                    hu = 38 + Math.sin(nx * 30) * Math.cos(ny * 26) * 6 + Math.sin(nz * 20) * 5; // soft tissue
                  }
                  // vessel/duct streaks: distance from point to segment a-b
                  for (const s of streaks) {
                    const px = nx - s.a[0], py = ny - s.a[1], pz = nz - s.a[2];
                    const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], dz = s.b[2] - s.a[2];
                    const len2 = dx * dx + dy * dy + dz * dz || 1e-6;
                    let t = (px * dx + py * dy + pz * dz) / len2; t = Math.max(0, Math.min(1, t));
                    const cx = s.a[0] + dx * t, cy = s.a[1] + dy * t, cz = s.a[2] + dz * t;
                    const d2 = (nx - cx) ** 2 + (ny - cy) ** 2 + (nz - cz) ** 2;
                    if (d2 < s.r * s.r) hu = 210;
                  }
                  // lesion: small dense sphere
                  const dl = (nx - lesionC[0]) ** 2 + (ny - lesionC[1]) ** 2 + (nz - lesionC[2]) ** 2;
                  if (dl < 0.018) hu = 130;
                  vol[z * N * N + y * N + x] = hu;
                }
              }
            }
            state.mpr.volume = vol;
            state.mpr.fromDicom = false;
            state.mpr.plane = { axial: Math.floor(N / 2), coronal: Math.floor(N / 2), sagittal: Math.floor(N / 2) };
            state.mpr.max = { axial: N - 1, coronal: N - 1, sagittal: N - 1 };
          }

          function sampleVolume(x, y, z) {
            const N = state.mpr.volSize;
            x = Math.max(0, Math.min(N - 1, x | 0)); y = Math.max(0, Math.min(N - 1, y | 0)); z = Math.max(0, Math.min(N - 1, z | 0));
            return state.mpr.volume ? state.mpr.volume[z * N * N + y * N + x] : 0;
          }

          function initMPR() {
            if (!state.mpr.volume) buildProceduralVolume();
            ['axial', 'coronal', 'sagittal'].forEach(plane => {
              const canvas = document.getElementById('mpr-' + plane);
              const ctx = canvas.getContext('2d');
              const rect = canvas.parentElement.getBoundingClientRect();
              canvas.width = rect.width; canvas.height = rect.height;
              drawMPRSlice(ctx, canvas.width, canvas.height, plane);
              updateMprSliceLabel(plane);

              canvas.onmousemove = e => {
                const r = canvas.getBoundingClientRect();
                const x = Math.round((e.clientX - r.left) / r.width * state.mpr.volSize);
                const y = Math.round((e.clientY - r.top) / r.height * state.mpr.volSize);
                document.getElementById('mpr-' + plane + '-coords').textContent = `X:${x} Y:${y}`;
                if (state.mpr.dragging === plane) {
                  const dWW = (e.clientX - state.mpr.dragStartX) * 4;
                  const dWL = (state.mpr.dragStartY - e.clientY) * 2;
                  state.mpr.ww = Math.max(20, state.mpr.ww0 + dWW);
                  state.mpr.wl = state.mpr.wl0 + dWL;
                  ['axial', 'coronal', 'sagittal'].forEach(refreshMprCanvas);
                }
              };
              canvas.onmousedown = e => {
                state.mpr.dragging = plane;
                state.mpr.dragStartX = e.clientX; state.mpr.dragStartY = e.clientY;
                state.mpr.ww0 = state.mpr.ww; state.mpr.wl0 = state.mpr.wl;
              };
              window.addEventListener('mouseup', () => state.mpr.dragging = null);
              canvas.onwheel = e => {
                e.preventDefault();
                const dir = e.deltaY > 0 ? -1 : 1;
                state.mpr.plane[plane] = Math.max(0, Math.min(state.mpr.max[plane], state.mpr.plane[plane] + dir));
                refreshMprCanvas(plane);
                updateMprSliceLabel(plane);
              };
            });
          }

          function refreshMprCanvas(plane) {
            const canvas = document.getElementById('mpr-' + plane);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            drawMPRSlice(ctx, canvas.width, canvas.height, plane);
          }

          function updateMprSliceLabel(plane) {
            const el = document.getElementById('mpr-' + plane + '-slice');
            if (el) el.textContent = `${state.mpr.plane[plane]}/${state.mpr.max[plane]}`;
          }

          function drawMPRSlice(ctx, w, h, plane) {
            const N = state.mpr.volSize;
            const imgData = ctx.createImageData(w, h);
            const d = imgData.data;
            const mod = MODULES[state.mod];
            const col = new THREE.Color(mod.color);
            const idx = state.mpr.plane[plane];
            const ww = state.mpr.ww, wl = state.mpr.wl;
            const lo = wl - ww / 2, hi = wl + ww / 2;

            for (let py = 0; py < h; py++) {
              const vy = Math.floor(py / h * N);
              for (let px = 0; px < w; px++) {
                const vx = Math.floor(px / w * N);
                let hu;
                if (plane === 'axial') hu = sampleVolume(vx, vy, idx);
                else if (plane === 'coronal') hu = sampleVolume(vx, idx, vy);
                else hu = sampleVolume(idx, vy, vx);

                // window/level normalisation
                let g = (hu - lo) / (hi - lo); g = Math.max(0, Math.min(1, g));
                const isVessel = hu > 180 && hu < 230;
                const isLesion = hu >= 120 && hu <= 150;
                const i = (py * w + px) * 4;
                if (isVessel) {
                  d[i] = 255; d[i + 1] = 107; d[i + 2] = 53;
                } else if (isLesion) {
                  d[i] = 239; d[i + 1] = 68; d[i + 2] = 68;
                } else {
                  const base = g * 220;
                  d[i] = base * 0.5 + col.r * g * 60;
                  d[i + 1] = base * 0.5 + col.g * g * 60;
                  d[i + 2] = base * 0.5 + col.b * g * 60;
                }
                d[i + 3] = 255;
              }
            }
            ctx.putImageData(imgData, 0, 0);

            // Crosshair (position of the other two planes' current slice) for spatial context
            ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
            ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
            ctx.stroke();

            // Overlay labels
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(w - 64, h - 22, 60, 18);
            ctx.fillStyle = mod.color; ctx.font = '9px JetBrains Mono';
            ctx.fillText(plane.toUpperCase(), w - 60, h - 9);
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(2, 2, 74, 14);
            ctx.fillStyle = '#94a3b8'; ctx.font = '8px JetBrains Mono';
            ctx.fillText(`WW${Math.round(ww)} WL${Math.round(wl)}`, 5, 12);
            if (state.mpr.fromDicom) {
              ctx.fillStyle = 'rgba(34,197,94,.85)'; ctx.font = '8px JetBrains Mono';
              ctx.fillText('DICOM', w - 64, 12);
            }
          }

          // ════════════════════════════════════════════════
          //  SEGMENTATION IA RÉELLE — TotalSegmentator (backend) → maillages GLB réels
          //  Remplace/enrichit l'anatomie procédurale par de vrais maillages issus
          //  d'une inférence nnU-Net, quand le backend est configuré et équipé.
          // ════════════════════════════════════════════════
          const gltfLoader = (typeof THREE !== 'undefined' && THREE.GLTFLoader) ? new THREE.GLTFLoader() : null;
          let realMeshGroup = null; // groupe Three.js contenant les maillages réels chargés
          // Provenance de la segmentation réelle affichée (point 1 du plan de refonte) : série DICOM
          // source, nombre de structures et modèle d'inférence — alimente le panneau Plan et les
          // snapshots enregistrés. null = aucun maillage réel chargé (estimation procédurale).
          let planProvenance = null;
          // Géométrie bas-poly du foie réel (liver_total_lowpoly.glb), recentrée sur
          // l'origine — alimente le Jumeau numérique PBD à la place de l'anatomie
          // procédurale quand une segmentation réelle est disponible pour ce patient.
          let realLiverTwinGeometry = null;

          function setRealSegStatus(text) {
            const el = document.getElementById('real-seg-status');
            if (el) el.textContent = text;
          }

          async function runRealSegmentation(fileList) {
            if (guardReadOnly('lancement de segmentation')) return;
            const files = Array.from(fileList || []);
            if (!files.length) return;
            if (!state.settings.apiBase) {
              notify('Configurez l\'URL du backend dans ⚙ Paramètres pour utiliser la segmentation IA réelle.', 'warn');
              return;
            }
            const base = state.settings.apiBase.replace(/\/+$/, '');

            // Vérifie d'abord ce qui est réellement disponible côté serveur, pour un message honnête
            try {
              const cap = await (await fetch(base + '/segmentation/capabilities')).json();
              if (!cap.ready_for_real_segmentation) {
                const missing = ['totalsegmentator', 'dicom2nifti', 'nibabel'].filter(k => !cap[k]);
                notify('Segmentation réelle indisponible sur ce serveur (manque: ' + missing.join(', ') + '). Voir requirements-segmentation.txt.', 'warn');
                return;
              }
            } catch (e) {
              notify('Impossible de joindre le backend pour vérifier ses capacités : ' + e.message, 'warn');
              return;
            }

            const mod = MODULES[state.mod];
            // Correctif de sécurité patient : un job de segmentation peut prendre jusqu'à ~15 min
            // (pollSegmentationJob). Rien n'empêchait le chirurgien de changer de patient/module pendant
            // l'attente — le résultat, une fois prêt, s'appliquait alors AVEUGLÉMENT au patient affiché à
            // ce moment-là, pas à celui pour lequel le job avait été lancé (même famille de bug que
            // resetPatientState()/switchModule(), mais via une race condition asynchrone plutôt qu'un état
            // non réinitialisé). On capture l'ID patient au lancement et on revérifie à la réception.
            const startedForPatientId = mod.patient.id;
            setRealSegStatus('Envoi des fichiers...');
            showLoader('Segmentation IA réelle', 'Envoi des données au serveur (TotalSegmentator)...');

            try {
              const form = new FormData();
              files.forEach(f => form.append('files', f, f.name));
              // `specialty` choisit le pipeline de segmentation côté serveur :
              // hbp = Couinaud + vaisseaux + tumeur ; autres spécialités = pipeline
              // générique task='total' (roi_subset) — voir segmentation_specialties.py.
              const startResp = await fetch(`${base}/segmentation/auto?patient_id=${encodeURIComponent(mod.patient.id)}&specialty=${encodeURIComponent(state.mod)}`, { method: 'POST', body: form });
              if (!startResp.ok) throw new Error('Démarrage du job échoué (' + startResp.status + ')');
              const { job_id } = await startResp.json();
              notify('Job de segmentation démarré (' + job_id + ') — inférence nnU-Net en cours...', 'info');

              const result = await pollSegmentationJob(base, job_id);

              hideLoader();
              const currentPatientId = MODULES[state.mod] && MODULES[state.mod].patient && MODULES[state.mod].patient.id;
              if (currentPatientId !== startedForPatientId) {
                notify(`⚠️ Segmentation de ${startedForPatientId} terminée, mais un autre patient (${currentPatientId}) est maintenant affiché — résultat ignoré pour éviter de mélanger les dossiers. Relancez la segmentation sur le patient ${startedForPatientId} si besoin.`, 'warn');
                setRealSegStatus('Résultat ignoré (patient changé pendant le calcul)');
                return;
              }
              await loadRealMeshesIntoScene(result, base);
              // hbp → foie total ; autres spécialités → somme des volumes segmentés.
              const totalText = result.liver_total_ml != null
                ? `foie total ${result.liver_total_ml} mL`
                : (result.total_ml != null ? `${result.total_ml} mL au total` : '');
              notify(`✓ Segmentation réelle chargée — ${result.segments.length} structure(s)${totalText ? ', ' + totalText : ''}`, 'ok');
              setRealSegStatus('Segmentation IA réelle chargée ✓');
            } catch (e) {
              hideLoader();
              notify('Segmentation réelle échouée : ' + e.message, 'warn');
              setRealSegStatus('Échec — voir notification');
            }
          }

          // Polling partagé entre runRealSegmentation (upload direct) et
          // segmentExistingSeries (série déjà importée, PACS ou upload manuel) — pour
          // que le comportement d'attente (délai, messages de progression) ne diverge
          // pas entre les deux points d'entrée.
          async function pollSegmentationJob(base, job_id) {
            for (let i = 0; i < 180; i++) { // jusqu'à ~15 min de patience (180 * 5s)
              await new Promise(r => setTimeout(r, 5000));
              const st = await (await fetch(`${base}/segmentation/status/${job_id}`)).json();
              setRealSegStatus(st.progress || st.status);
              showLoader('Segmentation IA réelle', st.progress || 'Traitement en cours...');
              if (st.status === 'done') return st.result;
              if (st.status === 'error') throw new Error(st.error || 'Échec du job de segmentation.');
            }
            throw new Error('Délai dépassé — le job tourne peut-être encore côté serveur.');
          }

          // Segmente directement une série DÉJÀ IMPORTÉE (upload manuel, PACS DICOMweb
          // ou DIMSE) sans avoir à re-sélectionner les fichiers depuis l'ordinateur —
          // le pont entre l'import DICOM/PACS et le viewer 3D.
          async function segmentExistingSeries(seriesId, btn) {
            if (guardReadOnly('lancement de segmentation')) return;
            if (!state.settings.apiBase) {
              notify('Configurez l\'URL du backend dans ⚙ Paramètres pour utiliser la segmentation IA réelle.', 'warn');
              return;
            }
            const base = state.settings.apiBase.replace(/\/+$/, '');
            const originalText = btn.textContent;
            btn.disabled = true; btn.textContent = 'Démarrage...';
            // Même correctif de sécurité patient que runRealSegmentation() : ce job peut prendre jusqu'à
            // ~15 min, pendant lesquelles le chirurgien peut changer de patient/module.
            const startedForPatientId = MODULES[state.mod] && MODULES[state.mod].patient && MODULES[state.mod].patient.id;
            try {
              const token = await getBackendToken();
              const startResp = await fetch(`${base}/segmentation/from-series/${encodeURIComponent(seriesId)}?specialty=${encodeURIComponent(state.mod)}`,
                { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
              if (await handleUnauthorized(startResp)) {
                notify('Reconnecté — relancez la segmentation.', 'info');
                btn.disabled = false; btn.textContent = originalText;
                return;
              }
              if (!startResp.ok) {
                const body = await startResp.json().catch(() => ({}));
                throw new Error(body.detail || ('HTTP ' + startResp.status));
              }
              const { job_id } = await startResp.json();
              notify('Job de segmentation démarré (' + job_id + ') depuis la série importée...', 'info');
              showLoader('Segmentation IA réelle', 'Conversion DICOM → NIfTI puis inférence...');
              closeModal('dicom-viewer');

              const result = await pollSegmentationJob(base, job_id);

              hideLoader();
              const currentPatientId = MODULES[state.mod] && MODULES[state.mod].patient && MODULES[state.mod].patient.id;
              if (currentPatientId !== startedForPatientId) {
                notify(`⚠️ Segmentation de ${startedForPatientId} terminée, mais un autre patient (${currentPatientId}) est maintenant affiché — résultat ignoré pour éviter de mélanger les dossiers.`, 'warn');
                setRealSegStatus('Résultat ignoré (patient changé pendant le calcul)');
                btn.disabled = false; btn.textContent = originalText;
                return;
              }
              await loadRealMeshesIntoScene(result, base);
              notify(`✓ Segmentation chargée depuis la série importée — ${result.segments.length} structure(s)`, 'ok');
              setRealSegStatus('Segmentation IA réelle chargée ✓');
            } catch (e) {
              hideLoader();
              notify('Échec de la segmentation : ' + e.message, 'warn');
              btn.disabled = false; btn.textContent = originalText;
            }
          }

          // Extrait une géométrie unique, indexée et recentrée sur l'origine, à
          // partir d'un Object3D chargé via GLTFLoader (potentiellement plusieurs
          // sous-meshes). `applyMatrix4(child.matrixWorld)` fige l'échelle/position
          // déjà appliquées à l'objet racine (ex. le scale 0.012 mm->scène utilisé
          // ci-dessous) directement dans les positions des sommets. Contrairement à
          // la vue "Plan" (décalée de -0.6 pour cohabiter avec l'organe procédural),
          // le Jumeau n'a pas d'offset : on recentre donc sur (0,0,0).
          function extractRecenteredGeometryFromObject3D(object3D) {
            object3D.updateWorldMatrix(true, true);
            const geometries = [];
            object3D.traverse((child) => {
              if (child.isMesh && child.geometry && child.geometry.attributes.position) {
                const g = child.geometry.clone();
                g.applyMatrix4(child.matrixWorld);
                geometries.push(g);
              }
            });
            if (!geometries.length) return null;

            const merged = (geometries.length > 1 && THREE.BufferGeometryUtils)
              ? THREE.BufferGeometryUtils.mergeBufferGeometries(geometries, false)
              : geometries[0];
            if (!merged) return null;

            const indexed = mergeGeometryVertices(merged);
            indexed.computeBoundingBox();
            const center = new THREE.Vector3();
            indexed.boundingBox.getCenter(center);
            indexed.translate(-center.x, -center.y, -center.z);
            return indexed;
          }

          async function loadRealMeshesIntoScene(result, base) {
            if (!gltfLoader) { notify('THREE.GLTFLoader non chargé — impossible d\'afficher les maillages réels.', 'warn'); return; }

            if (realMeshGroup) { scene.remove(realMeshGroup); }
            realMeshGroup = new THREE.Group();
            realMeshGroup.name = 'realSegmentationMeshes';

            // Une fois de vrais maillages chargés, on estompe l'anatomie procédurale
            // pour laisser la vraie segmentation prendre le dessus visuellement.
            if (organMesh) organMesh.material.opacity = 0.08;
            if (wireframeMesh) wireframeMesh.material.opacity = 0.03;
            if (vesselGroup) vesselGroup.visible = false;

            const allEntries = [...(result.segments || []), ...(result.vessels || [])];
            let loaded = 0;
            for (const entry of allEntries) {
              if (!entry.mesh_url) continue;
              const url = base + entry.mesh_url;
              try {
                const gltf = await new Promise((resolve, reject) => gltfLoader.load(url, resolve, undefined, reject));
                const obj = gltf.scene;
                obj.userData = { label: entry.label || entry.name || entry.organ, kind: 'real-mesh', volume_ml: entry.volume_ml };
                // Les maillages sortent du pipeline en mm réels — on les ramène à l'échelle
                // de la scène (~1-2 unités) de façon cohérente avec l'anatomie procédurale.
                obj.scale.set(0.012, 0.012, 0.012);
                obj.position.set(-0.6, 0, 0);
                realMeshGroup.add(obj);
                loaded++;
              } catch (e) {
                console.warn('Maillage non chargé:', entry.label, e);
              }
            }
            scene.add(realMeshGroup);
            notify(`${loaded} maillage(s) 3D réel(s) chargé(s) dans la scène`, loaded > 0 ? 'ok' : 'warn');
            // Provenance (point 1) : série DICOM qui a produit cette segmentation + ce qui a été chargé.
            planProvenance = {
              source_series_id: result.source_series_id || null,
              structures: allEntries.filter(e => e.mesh_url).length,
              model: result.model || 'TotalSegmentator (nnU-Net)',
              timestamp: Date.now()
            };

            // Maillage bas-poly du foie, dédié au Jumeau numérique PBD (voir
            // segmentation_service.py:_maybe_build_lowpoly_twin_mesh) — chargé
            // séparément du groupe ci-dessus car recentré différemment (pas
            // d'offset -0.6) et beaucoup plus léger (~1500 faces, PBD-friendly).
            realLiverTwinGeometry = null;
            const liverEntry = (result.segments || []).find(e => e.organ === 'liver' && e.mesh_url_lowpoly);
            if (liverEntry) {
              try {
                const gltf = await new Promise((resolve, reject) =>
                  gltfLoader.load(base + liverEntry.mesh_url_lowpoly, resolve, undefined, reject));
                // Même conversion mm réels -> échelle scène que dans la boucle
                // ci-dessus (obj.scale.set(0.012,...)) : sans elle, le maillage
                // resterait à l'échelle réelle (~100-200 unités de rayon) au lieu
                // de ~1-2 unités, complètement disproportionné dans la scène du Jumeau.
                gltf.scene.scale.set(0.012, 0.012, 0.012);
                realLiverTwinGeometry = extractRecenteredGeometryFromObject3D(gltf.scene);
              } catch (e) {
                console.warn('Maillage bas-poly (Jumeau numérique) non chargé:', e);
              }
            }
            // Si l'onglet Jumeau est déjà ouvert, on le rafraîchit avec le vrai
            // maillage qui vient de finir de charger, au lieu d'attendre un
            // changement d'onglet.
            if (typeof twin !== 'undefined' && twin.active) { resetDigitalTwin(); }
          }

          // ════════════════════════════════════════════════
          //  PACS — recherche QIDO-RS + import WADO-RS (priorité 4 feuille de route)
          //  Réutilise getBackendToken() (déclaré plus bas, hissé par le parseur JS
          //  comme toute function declaration du même bloc <script>).
          // ════════════════════════════════════════════════
          function openPacsPanel() {
            if (!state.settings.apiBase) {
              notify('Configurez l\'URL du backend dans ⚙ Paramètres pour utiliser le connecteur PACS.', 'warn');
              return;
            }
            const mod = MODULES[state.mod];
            document.getElementById('pacs-active-patient').textContent = `${mod.patient.nom} (${mod.patient.id})`;
            document.getElementById('pacs-filter-patientid').value = '';
            document.getElementById('pacs-filter-name').value = '';
            document.getElementById('pacs-filter-date').value = '';
            document.getElementById('pacs-results').innerHTML = '';
            openModal('pacs');
          }

          async function pacsAuthedFetch(path, opts = {}) {
            const base = state.settings.apiBase.replace(/\/+$/, '');
            const token = await getBackendToken();
            const headers = Object.assign({ 'Authorization': 'Bearer ' + token }, opts.headers || {});
            const r = await fetch(base + path, Object.assign({}, opts, { headers }));
            if (await handleUnauthorized(r)) {
              throw new Error('Session expirée — reconnectez-vous puis relancez cette action.');
            }
            if (!r.ok) {
              let detail = r.status;
              try { detail = (await r.json()).detail || detail; } catch (e) { }
              throw new Error(String(detail));
            }
            return r.json();
          }

          async function searchPacsStudies() {
            const results = document.getElementById('pacs-results');
            results.innerHTML = '<div style="color:var(--text3)">Recherche en cours (QIDO-RS)...</div>';
            const qidoUrl = document.getElementById('pacs-qido-url').value.trim();
            const params = new URLSearchParams();
            const pid = document.getElementById('pacs-filter-patientid').value.trim();
            const name = document.getElementById('pacs-filter-name').value.trim();
            const date = document.getElementById('pacs-filter-date').value.trim();
            if (pid) params.set('patient_id', pid);
            if (name) params.set('patient_name', name);
            if (date) params.set('study_date', date);
            if (qidoUrl) params.set('qido_url', qidoUrl);
            try {
              const studies = await pacsAuthedFetch('/pacs/studies?' + params.toString());
              if (!studies.length) { results.innerHTML = '<div style="color:var(--text3)">Aucune étude trouvée.</div>'; return; }
              results.innerHTML = studies.map((s, i) => `
      <div style="border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">
        <div><strong>${s.patient_name || '?'}</strong> — ${s.patient_id || '?'} — ${s.study_date || '?'}</div>
        <div style="color:var(--text3)">${s.study_description || ''} ${s.accession_number ? ('· Acc. ' + s.accession_number) : ''}</div>
        <button class="btn btn-secondary" style="margin-top:6px" onclick="loadPacsSeries('${s.study_uid}', this)">Voir les séries</button>
        <div class="pacs-series-list" style="margin-top:6px"></div>
      </div>`).join('');
            } catch (e) {
              results.innerHTML = `<div style="color:#ef4444">Échec de la recherche PACS : ${e.message}</div>`;
            }
          }

          async function loadPacsSeries(studyUid, btn) {
            const container = btn.parentElement.querySelector('.pacs-series-list');
            container.innerHTML = 'Chargement des séries (QIDO-RS)...';
            const qidoUrl = document.getElementById('pacs-qido-url').value.trim();
            const q = qidoUrl ? ('?qido_url=' + encodeURIComponent(qidoUrl)) : '';
            try {
              const series = await pacsAuthedFetch(`/pacs/studies/${encodeURIComponent(studyUid)}/series${q}`);
              if (!series.length) { container.innerHTML = '<span style="color:var(--text3)">Aucune série.</span>'; return; }
              container.innerHTML = series.map(s => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-top:1px solid var(--border)">
        <span>${s.modality || '?'} — ${s.series_description || 'sans description'} (${s.num_instances || '?'} instance(s))</span>
        <button class="btn btn-primary" style="font-size:9px;padding:3px 8px" onclick="importPacsSeries('${studyUid}','${s.series_uid}', this)">⬇ Importer (WADO-RS)</button>
      </div>`).join('');
            } catch (e) {
              container.innerHTML = `<span style="color:#ef4444">Échec : ${e.message}</span>`;
            }
          }

          async function importPacsSeries(studyUid, seriesUid, btn) {
            const mod = MODULES[state.mod];
            btn.disabled = true; btn.textContent = 'Import en cours...';
            const qidoUrl = document.getElementById('pacs-qido-url').value.trim();
            try {
              const body = { patient_id: mod.patient.id, study_uid: studyUid, series_uid: seriesUid };
              if (qidoUrl) body.qido_url = qidoUrl;
              const result = await pacsAuthedFetch('/pacs/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              notify(`✓ Série importée (${result.num_instances} instance(s), ${result.modality}) — visible dans /dicom/${mod.patient.id}`, 'ok');
              btn.textContent = '✓ Importée';
            } catch (e) {
              notify('Échec de l\'import PACS : ' + e.message, 'warn');
              btn.disabled = false; btn.textContent = '⬇ Importer (WADO-RS)';
            }
          }

          // ════════════════════════════════════════════════
          //  AUDIT TRAIL — jusqu'ici l'onglet de nav ne faisait rien du tout
          //  (même défaut que "Jumeau Num." avant correction). Le backend expose déjà
          //  GET /audit et l'écrit à chaque action sensible : il manquait juste un
          //  panneau pour le consulter.
          // ════════════════════════════════════════════════
          function openAuditTrail() {
            if (!state.settings.apiBase) {
              notify('Configurez l\'URL du backend dans ⚙ Paramètres pour consulter le journal d\'audit.', 'warn');
              return;
            }
            const mod = MODULES[state.mod];
            document.getElementById('audit-filter-patient').value = mod && mod.patient ? mod.patient.id : '';
            document.getElementById('audit-filter-user').value = '';
            openModal('audit');
            loadAuditTrail();
          }

          async function loadAuditTrail() {
            const results = document.getElementById('audit-results');
            results.innerHTML = '<div style="color:var(--text3)">Chargement...</div>';
            const patientId = document.getElementById('audit-filter-patient').value.trim();
            const username = document.getElementById('audit-filter-user').value.trim();
            const params = new URLSearchParams({ limit: '100' });
            if (patientId) params.set('patient_id', patientId);
            if (username) params.set('username', username);
            try {
              const rows = await pacsAuthedFetch('/audit?' + params.toString());
              if (!rows.length) { results.innerHTML = '<div style="color:var(--text3)">Aucune entrée.</div>'; return; }
              results.innerHTML = `<table style="width:100%;border-collapse:collapse">
      <thead><tr style="text-align:left;border-bottom:1px solid var(--border);color:var(--text3)">
        <th style="padding:4px">Date/heure</th><th style="padding:4px">Utilisateur</th>
        <th style="padding:4px">Action</th><th style="padding:4px">Patient</th><th style="padding:4px">Statut</th>
      </tr></thead><tbody>
      ${rows.map(r => `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:4px;white-space:nowrap">${I18N.formatDate(new Date(r.created_at), { dateStyle: 'short', timeStyle: 'medium' })}</td>
        <td style="padding:4px">${r.username || '—'}</td>
        <td style="padding:4px">${r.action}${r.resource ? ` <span style="color:var(--text3)">(${r.resource})</span>` : ''}</td>
        <td style="padding:4px">${r.patient_id || '—'}</td>
        <td style="padding:4px;color:${r.niveau === 'error' ? '#ef4444' : r.niveau === 'ok' ? '#22c55e' : 'var(--text3)'}">${r.niveau}</td>
      </tr>`).join('')}
      </tbody></table>`;
            } catch (e) {
              results.innerHTML = `<div style="color:#ef4444">Échec du chargement : ${e.message}</div>`;
            }
          }

          // ════════════════════════════════════════════════
          //  DICOM — panneau listant les séries enregistrées (import manuel + PACS)
          // ════════════════════════════════════════════════
          function openDicomViewer() {
            if (!state.settings.apiBase) {
              notify('Configurez l\'URL du backend dans ⚙ Paramètres pour lister les séries DICOM.', 'warn');
              return;
            }
            const mod = MODULES[state.mod];
            document.getElementById('dicom-viewer-patient').textContent = mod.patient.nom + ' (' + mod.patient.id + ')';
            openModal('dicom-viewer');
            loadDicomSeriesList();
          }

          async function loadDicomSeriesList() {
            const results = document.getElementById('dicom-viewer-results');
            results.innerHTML = '<div style="color:var(--text3)">Chargement...</div>';
            const mod = MODULES[state.mod];
            try {
              const rows = await pacsAuthedFetch('/dicom/' + encodeURIComponent(mod.patient.id));
              if (!rows.length) { results.innerHTML = '<div style="color:var(--text3)">Aucune série enregistrée pour ce patient. Utilisez « 📁 Importer DICOM » ou « 📡 PACS » dans la vue Plan.</div>'; return; }
              results.innerHTML = rows.map(s => `
      <div style="border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">
        <div><strong>${s.modality}</strong> — ${s.filename || 'sans nom'} — ${s.num_slices} coupe(s)</div>
        <div style="color:var(--text3)">${s.rows}×${s.cols}px · épaisseur ${s.slice_thickness_mm}mm · série ${s.series_uid.slice(0, 18)}...</div>
        ${s.local_path
                  ? `<button class="btn btn-primary" style="font-size:9px;padding:3px 8px;margin-top:6px" onclick="segmentExistingSeries('${s.id}', this)">🔬 Segmenter cette série</button>`
                  : `<div style="font-size:9px;color:var(--text3);margin-top:6px">⚠ Pixels non sauvegardés (série importée avant la correction) — réimportez-la pour pouvoir la segmenter.</div>`}
      </div>`).join('');
            } catch (e) {
              results.innerHTML = `<div style="color:#ef4444">Échec du chargement : ${e.message}</div>`;
            }
          }

          // ════════════════════════════════════════════════
          //  RÉALITÉ AUGMENTÉE — vraie détection/lancement WebXR, pas de simulation.
          //  Portée honnête : rendu AR sans suivi de marqueur ni recalage patient —
          //  affiche l'organe en surimpression, ce n'est pas un dispositif de
          //  navigation chirurgicale.
          // ════════════════════════════════════════════════
          async function openArPanel() {
            openModal('ar');
            const statusEl = document.getElementById('ar-status');
            const launchEl = document.getElementById('ar-launch');
            const unsupportedEl = document.getElementById('ar-unsupported');
            launchEl.style.display = 'none'; unsupportedEl.style.display = 'none';

            if (!navigator.xr) {
              statusEl.textContent = 'navigator.xr indisponible dans ce navigateur.';
              unsupportedEl.style.display = 'block';
              return;
            }
            try {
              const supported = await navigator.xr.isSessionSupported('immersive-ar');
              if (supported) {
                statusEl.textContent = '✓ Ce navigateur/appareil supporte la réalité augmentée WebXR.';
                launchEl.style.display = 'block';
              } else {
                statusEl.textContent = 'WebXR détecté, mais la session "immersive-ar" n\'est pas supportée ici.';
                unsupportedEl.style.display = 'block';
              }
            } catch (e) {
              statusEl.textContent = 'Impossible de vérifier le support AR : ' + e.message;
              unsupportedEl.style.display = 'block';
            }
          }

          let arSession = null;
          async function launchArSession() {
            try {
              arSession = await navigator.xr.requestSession('immersive-ar', { optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } });
              notify('Session WebXR AR démarrée — placez l\'appareil face à une surface.', 'ok');
              closeModal('ar');
              arSession.addEventListener('end', () => { notify('Session AR terminée.', 'info'); arSession = null; });
              // Rendu minimal : la scène/renderer existants ne sont pas configurés en
              // mode XR (renderer.xr.enabled=false par défaut) — brancher réellement
              // le rendu WebXR (base layer, boucle xrSession.requestAnimationFrame,
              // pose de la caméra) est un chantier à part entière, hors du périmètre
              // de cette session. Ce qui est livré ici est réel et honnête : une
              // vraie session immersive-ar démarre bel et bien sur un appareil
              // compatible ; le rendu de l'organe dedans reste à connecter.
            } catch (e) {
              notify('Échec du lancement de la session AR : ' + e.message, 'warn');
            }
          }

          // ════════════════════════════════════════════════
          //  DICOM — real slice loading (dicom-parser)
          // ════════════════════════════════════════════════
          // Utilitaire: laisse respirer le main thread (évite le freeze UI)
          function _yieldMainThread() {
            return new Promise(r => setTimeout(r, 0));
          }

          async function loadDicomFiles(fileList) {
            if (guardReadOnly('import DICOM')) return;
            if (!window.dicomParser) { notify('dicom-parser non chargé', 'warn'); return; }
            const files = Array.from(fileList);
            if (!files.length) return;
            showLoader('Import DICOM', I18N.t('dicom.importing', { count: files.length }));
            try {
              const slices = [];
              for (let fi = 0; fi < files.length; fi++) {
                const f = files[fi];
                const buf = new Uint8Array(await f.arrayBuffer());
                let ds;
                try { ds = dicomParser.parseDicom(buf); } catch (e) { console.warn('Erreur parsing DICOM:', e); continue; }

                // Vérifier si l'image est compressée (JPEG etc.)
                const ts = ds.string('x00020010');
                if (ts && ts.startsWith('1.2.840.10008.1.2.4.')) {
                  notify('Image DICOM compressée détectée. Décompression locale non supportée.', 'warn');
                  continue;
                }

                const rows = ds.uint16('x00280010'), cols = ds.uint16('x00280011');
                const pxElement = ds.elements.x7fe00010;
                if (!rows || !cols || !pxElement) continue;

                // Vérifier si PixelData est encapsulé
                if (pxElement.length === 4294967295) {
                  notify('Format DICOM encapsulé non supporté en local.', 'warn');
                  continue;
                }

                const bitsAlloc = ds.uint16('x00280100') || 16;
                const pixelRep = ds.uint16('x00280103') || 0; // 0=unsigned, 1=signed
                const intercept = parseFloat(ds.string('x00281052') || '0');
                const slope = parseFloat(ds.string('x00281053') || '1');
                const instanceStr = ds.string('x00200013');
                const instanceNum = instanceStr ? parseInt(instanceStr, 10) : 0;
                // Parse spacing tags
                const pixelSpacingStr = ds.string('x00280030');
                let spacingX = 1, spacingY = 1;
                if (pixelSpacingStr) {
                  const vals = pixelSpacingStr.split('\\').map(parseFloat);
                  if (vals.length >= 2) {
                    spacingX = vals[0];
                    spacingY = vals[1];
                  }
                }
                const sliceThickness = parseFloat(ds.string('x00180050') || '1');

                let pixels;
                const pxBuf = buf.buffer.slice(buf.byteOffset + pxElement.dataOffset, buf.byteOffset + pxElement.dataOffset + pxElement.length);
                if (bitsAlloc === 16) {
                  pixels = pixelRep === 1 ? new Int16Array(pxBuf) : new Uint16Array(pxBuf);
                } else {
                  pixels = new Uint8Array(pxBuf);
                }
                slices.push({ rows, cols, pixels, intercept, slope, z: instanceNum, spacingX, spacingY, sliceThickness });

                // Yield après chaque fichier (sécurité contre gros dossiers)
                if ((fi & 3) === 3) await _yieldMainThread();
              }
              if (!slices.length) { notify('Aucune image DICOM valide détectée', 'warn'); hideLoader(); return; }

              // Tri des coupes par numéro d'instance pour reconstruire le volume correctement
              slices.sort((a, b) => a.z - b.z);

              // Resample every slice into an N x N grid and stack into an N³ volume (HU values)
              // → fait par tranches Z avec yield entre chaque tranche pour ne pas freezer l'UI
              const N = state.mpr.volSize;
              const vol = new Float32Array(N * N * N);
              showLoader('Import DICOM', I18N.t('dicom.resampling', { n: N }));
              for (let z = 0; z < N; z++) {
                const s = slices[Math.min(slices.length - 1, Math.floor(z / N * slices.length))];
                for (let y = 0; y < N; y++) {
                  const sy = Math.floor(y / N * s.rows);
                  for (let x = 0; x < N; x++) {
                    const sx = Math.floor(x / N * s.cols);
                    let raw = s.pixels[sy * s.cols + sx];
                    if (raw === undefined || isNaN(raw)) raw = -1024;
                    const hu = raw * s.slope + s.intercept;
                    vol[z * N * N + y * N + x] = isNaN(hu) ? -1024 : hu;
                  }
                }
                // Yield toutes les 8 tranches Z (≈ 1ms chacune) → respiration UI
                if ((z & 7) === 7) await _yieldMainThread();
              }

              state.mpr.volume = vol;
              state.mpr.fromDicom = true;
              // Fenêtrage clinique standard (WW=400 HU, WL=40 HU)
              state.mpr.ww = 400;
              state.mpr.wl = 40;
              state.mpr.plane = { axial: Math.floor(N / 2), coronal: Math.floor(N / 2), sagittal: Math.floor(N / 2) };
              state.mpr.max = { axial: N - 1, coronal: N - 1, sagittal: N - 1 };
              // Set spacing from first slice (assumes uniform spacing)
              if (slices.length) {
                const first = slices[0];
                state.mpr.spacing = { x: first.spacingX, y: first.spacingY, z: first.sliceThickness };
                const spacingEls = document.querySelectorAll('.mpr-spacing');
                spacingEls.forEach(el => { el.textContent = `Spacing: ${first.spacingX}×${first.spacingY}×${first.sliceThickness} mm`; });
              }

              // Compute min/max HU for proper window/level
              let minHU = Infinity, maxHU = -Infinity;
              for (let i = 0; i < vol.length; i++) {
                const v = vol[i];
                if (v < minHU) minHU = v;
                if (v > maxHU) maxHU = v;
              }
              // Set window/level to cover full HU range (or a typical abdominal range)
              const ww = maxHU - minHU;
              const wl = (maxHU + minHU) / 2;
              state.mpr.ww = Math.max(80, Math.min(400, ww)); // clamp for UI sliders
              state.mpr.wl = Math.max(-200, Math.min(800, wl));
              // Update 3D threshold (tissu mou ~30 HU)
              const autoThreshold3D = 30;
              const sliderEl = document.getElementById('dicom3d-threshold');
              const sliderValEl = document.getElementById('dicom3d-threshold-val');
              if (sliderEl) { sliderEl.min = '-200'; sliderEl.max = '800'; sliderEl.value = autoThreshold3D; }
              if (sliderValEl) sliderValEl.textContent = autoThreshold3D;

              await _yieldMainThread();
              initMPR();
              notify(I18N.t('dicom.loaded', { count: slices.length, ww: state.mpr.ww.toFixed(0), wl: state.mpr.wl.toFixed(0) }), 'ok');

              // Reconstruction 3D — laissée à un setTimeout pour ne pas bloquer la notification
              setTimeout(() => {
                try {
                  showDicomIn3D(autoThreshold3D);
                  hideLoader();
                } catch (e) {
                  console.error('showDicomIn3D failed:', e);
                  notify(I18N.t('dicom.reconstructionFailed', { error: e.message }), 'warn');
                  hideLoader();
                }
              }, 50);

              // Re‑draw after layout settles (canvas may be 0‑size on first pass)
              setTimeout(() => {
                ['axial', 'coronal', 'sagittal'].forEach(plane => {
                  const c = document.getElementById('mpr-' + plane);
                  if (!c) return;
                  const rect = c.parentElement.getBoundingClientRect();
                  if (rect.width > 10) { c.width = rect.width; c.height = rect.height; }
                  drawMPRSlice(c.getContext('2d'), c.width, c.height, plane);
                });
              }, 500);
            } catch (e) {
              console.error(e);
              notify('Erreur de lecture DICOM: ' + e.message, 'warn');
              hideLoader();
            }
          }


          // ════════════════════════════════════════════════
          //  DICOM → VIEWER 3D — Voxel Mesh (BoxGeometry par chunk)
          //  Approche déterministe et fiable : chaque voxel au-dessus du seuil est rendu
          //  comme un petit cube. Pour limiter le nombre de meshes, on groupe les voxels
          //  en chunks 8×8×8 → 1 InstancedMesh par chunk.
          //  Résultat : visuel "minecraft-like" voxelisé, mais lisible cliniquement
          //  et surtout GARANTI visible dans la scène Three.js.
          // ════════════════════════════════════════════════
          let dicomIsoMesh = null;            // Group contenant les InstancedMesh chunks
          let dicomIsoEnabled = false;        // isosurface visible ou non
          let dicomIsoSize = 0;               // taille du cube (côté)
          let dicomIsoThreshold = 30;         // dernier seuil utilisé

          const DICOM_VOXEL_CHUNK = 8;        // taille d'un chunk (côtés)

          // BoxGeometry partagée : 1×1×1 cube (chaque instance aura sa propre position)
          let _dicomSharedBox = null;
          function _dicomGetSharedBox() {
            if (!_dicomSharedBox && typeof THREE !== 'undefined') {
              _dicomSharedBox = new THREE.BoxGeometry(1, 1, 1);
              _dicomSharedBox.computeVertexNormals();
            }
            return _dicomSharedBox;
          }

          function _dicomSafeScene() {
            return (typeof scene !== 'undefined' && scene) ? scene : null;
          }

          function _dicomDisposeIso() {
            const sc = _dicomSafeScene();
            if (dicomIsoMesh && sc) { sc.remove(dicomIsoMesh); }
            if (dicomIsoMesh) {
              dicomIsoMesh.traverse(o => {
                try { o.geometry && o.geometry.dispose && o.geometry.dispose(); } catch (e) { }
                try { o.material && o.material.dispose && o.material.dispose(); } catch (e) { }
              });
            }
            dicomIsoMesh = null;
          }

          // Construit le mesh voxel à partir de state.mpr.volume. Synchrone mais
          // chunké : on parcourt l'espace par blocs de 8×8×8 voxels. Chaque chunk
          // produit au pire 512 voxels → 1 InstancedMesh = 1 draw call.
          function _dicomBuildVoxelMesh(vol, N, threshold) {
            const sharedBox = _dicomGetSharedBox();
            if (!sharedBox) {
              console.warn('_dicomBuildVoxelMesh: THREE non disponible');
              return null;
            }
            const sc = _dicomSafeScene();
            if (!sc) return null;

            const group = new THREE.Group();
            group.name = 'dicom-voxel-group';
            const color = state.mod === 'hbp' ? 0x4fc3f7 : (state.mod === 'cardiaque' ? 0xef4444 : (state.mod === 'thoracique' ? 0x06b6d4 : 0xff6b35));
            const mat = new THREE.MeshStandardMaterial({
              color, transparent: true, opacity: 0.85,
              roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide
            });

            // Compteur total de voxels actifs (pour la notification)
            let totalActive = 0;
            let chunksBuilt = 0;

            // Dimensions du cube en unités Three.js : 64 unités (1 voxel = 1 unité)
            // Centré sur l'origine.
            const half = N * 0.5;

            // Parcours par chunks
            for (let cz = 0; cz < N; cz += DICOM_VOXEL_CHUNK) {
              for (let cy = 0; cy < N; cy += DICOM_VOXEL_CHUNK) {
                for (let cx = 0; cx < N; cx += DICOM_VOXEL_CHUNK) {
                  // Compter les voxels actifs dans ce chunk
                  const positions = [];
                  for (let z = cz; z < Math.min(N, cz + DICOM_VOXEL_CHUNK); z++) {
                    for (let y = cy; y < Math.min(N, cy + DICOM_VOXEL_CHUNK); y++) {
                      for (let x = cx; x < Math.min(N, cx + DICOM_VOXEL_CHUNK); x++) {
                        if (vol[z * N * N + y * N + x] >= threshold) {
                          // Position centrée sur le voxel
                          positions.push(x - half + 0.5, y - half + 0.5, z - half + 0.5);
                        }
                      }
                    }
                  }
                  if (positions.length === 0) continue;
                  const count = positions.length / 3;
                  totalActive += count;

                  // InstancedMesh : 1 draw call pour tout le chunk
                  const inst = new THREE.InstancedMesh(sharedBox, mat, count);
                  inst.name = `dicom-chunk-${cx}-${cy}-${cz}`;
                  const m = new THREE.Matrix4();
                  for (let i = 0; i < count; i++) {
                    m.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                    inst.setMatrixAt(i, m);
                  }
                  inst.instanceMatrix.needsUpdate = true;
                  group.add(inst);
                  chunksBuilt++;
                }
              }
            }

            if (totalActive === 0) {
              return null; // aucun voxel au-dessus du seuil
            }
            return { group, totalActive, chunksBuilt };
          }

          async function showDicomIn3D(threshold) {
            const sc = _dicomSafeScene();
            if (!sc) {
              console.warn('showDicomIn3D: scène Three.js non initialisée (sélectionnez d\'abord un module)');
              notify('Sélectionnez d\'abord un module depuis le Hub', 'warn');
              return;
            }
            if (typeof THREE === 'undefined') {
              console.warn('showDicomIn3D: THREE non chargé');
              return;
            }
            if (!state.mpr.volume) {
              notify(I18N.t('dicom.noVolume'), 'warn');
              return;
            }

            const N = state.mpr.volSize;
            const vol = state.mpr.volume;
            dicomIsoSize = N;
            dicomIsoThreshold = threshold;

            _dicomDisposeIso();

            showLoader('Reconstruction 3D', I18N.t('dicom.voxelizing', { threshold }));
            // Petite pause pour afficher le loader
            await new Promise(r => setTimeout(r, 30));

            const built = _dicomBuildVoxelMesh(vol, N, threshold);
            if (!built) {
              hideLoader();
              notify(I18N.t('dicom.noVoxelsAboveThreshold', { threshold }), 'warn');
              return;
            }

            dicomIsoMesh = built.group;
            sc.add(dicomIsoMesh);
            dicomIsoEnabled = true;

            // Estompe l'anatomie procédurale pendant que les voxels DICOM RÉELS sont affichés — sans
            // ça, les deux se superposaient à l'écran (échelles et positions différentes), rendant les
            // voxels DICOM difficiles à distinguer de l'organe procédural. Même traitement que
            // loadRealMeshesIntoScene()/digitalTwinPipeline pour les vraies segmentations IA.
            if (organMesh) organMesh.material.opacity = 0.05;
            if (wireframeMesh) wireframeMesh.material.opacity = 0.02;
            if (vesselGroup) vesselGroup.visible = false;

            // Recentrer la caméra pour voir le cube 64³
            if (typeof camera !== 'undefined' && camera) {
              camera.position.set(0, 0, Math.max(N * 1.2, 4));
              camera.lookAt(0, 0, 0);
            }
            hideLoader();
            notify(I18N.t('dicom.realVolumeShown', { threshold, count: built.totalActive, chunks: built.chunksBuilt }), 'ok');
          }

          function hideDicomIn3D() {
            _dicomDisposeIso();
            dicomIsoEnabled = false;
            // Restaure l'anatomie procédurale estompée par showDicomIn3D().
            if (organMesh) organMesh.material.opacity = 0.42;
            if (wireframeMesh) wireframeMesh.material.opacity = 0.09;
            if (vesselGroup) vesselGroup.visible = true;
            notify(I18N.t('dicom.hidden'), 'info');
          }

          // ════════════════════════════════════════════════
          //  MANIPULATION DU MESH DICOM DANS LE VIEWER 3D
          //  Visibilité, recadrage caméra, reset, spin auto, raccourcis clavier
          // ════════════════════════════════════════════════
          let dicomSpinEnabled = true;          // rotation auto activée par défaut
          let dicomSpinSpeed = 0.002;           // rad/frame (même vitesse que organMesh)

          function toggleDicomIn3D() {
            if (!dicomIsoMesh) {
              // Pas encore construit : on (re)génère au seuil courant
              if (state.mpr.fromDicom && state.mpr.volume) {
                showDicomIn3D(dicomIsoThreshold || 30).catch(e => console.error(e));
              } else {
                notify(I18N.t('dicom.noVolume'), 'warn');
              }
              return;
            }
            if (dicomIsoMesh.visible) {
              dicomIsoMesh.visible = false;
              dicomIsoEnabled = false;
              if (organMesh) organMesh.material.opacity = 0.42;
              if (wireframeMesh) wireframeMesh.material.opacity = 0.09;
              if (vesselGroup) vesselGroup.visible = true;
              notify(I18N.t('dicom.hidden'), 'info');
            } else {
              dicomIsoMesh.visible = true;
              dicomIsoEnabled = true;
              if (organMesh) organMesh.material.opacity = 0.05;
              if (wireframeMesh) wireframeMesh.material.opacity = 0.02;
              if (vesselGroup) vesselGroup.visible = false;
              notify(I18N.t('dicom.shown'), 'ok');
            }
          }

          function recenterDicomIn3D() {
            if (typeof camera === 'undefined' || !camera) {
              notify('Caméra non initialisée', 'warn');
              return;
            }
            const N = (typeof dicomIsoSize !== 'undefined' && dicomIsoSize) ? dicomIsoSize : 64;
            // Cadre l'organe : distance ≈ 1.4 × la taille du cube
            const dist = N * 1.4;
            camera.position.set(0, 0, dist);
            camera.lookAt(0, 0, 0);
            // Remise à zéro des rotations utilisateur (souris)
            if (typeof rotX !== 'undefined') rotX = 0;
            if (typeof rotY !== 'undefined') rotY = 0;
            notify(`Caméra recadrée — distance ${dist.toFixed(0)} unités (touche R)`, 'ok');
          }

          function resetDicomView() {
            if (typeof camera === 'undefined' || !camera) return;
            // Réinitialise la caméra à sa position d'origine
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            // Réinitialise les rotations accumulées
            if (typeof rotX !== 'undefined') rotX = 0;
            if (typeof rotY !== 'undefined') rotY = 0;
            // Remet à zéro la rotation de l'organe DICOM et de l'organe procédural
            if (typeof dicomIsoMesh !== 'undefined' && dicomIsoMesh) {
              dicomIsoMesh.rotation.set(0, 0, 0);
            }
            if (typeof organMesh !== 'undefined' && organMesh) {
              organMesh.rotation.set(0, 0, 0);
            }
            notify('Vue réinitialisée (touche Espace)', 'ok');
          }

          function toggleDicomSpin() {
            dicomSpinEnabled = !dicomSpinEnabled;
            const btn = document.getElementById('dicom3d-spin');
            if (btn) {
              btn.classList.toggle('on', dicomSpinEnabled);
              btn.textContent = dicomSpinEnabled ? '🌀 Spin ON' : '🌀 Spin OFF';
            }
            notify('Rotation auto ' + (dicomSpinEnabled ? 'activée' : 'désactivée') + ' (touche S)', 'info');
          }

          // Raccourcis clavier globaux (Espace, R, V, S)
          document.addEventListener('keydown', (e) => {
            // Ignorer si l'utilisateur est dans un input/textarea
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.code === 'Space') { e.preventDefault(); resetDicomView(); }
            else if (e.key === 'r' || e.key === 'R') { recenterDicomIn3D(); }
            else if (e.key === 'v' || e.key === 'V') { toggleDicomIn3D(); }
            else if (e.key === 's' || e.key === 'S') { toggleDicomSpin(); }
          });

          // Branchement temps réel du slider
          function _wireDicomThresholdSlider() {
            const slider = document.getElementById('dicom3d-threshold');
            if (!slider || slider._wired) return;
            slider._wired = true;
            slider.addEventListener('input', () => {
              const v = parseFloat(slider.value);
              const lbl = document.getElementById('dicom3d-threshold-val');
              if (lbl) lbl.textContent = v;
              if (state.mpr.fromDicom && state.mpr.volume) {
                // Reconstruction voxel — fire-and-forget
                showDicomIn3D(v).catch(e => console.error('showDicomIn3D failed:', e));
              }
            });
          }

          // Initialisation au chargement
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(_wireDicomThresholdSlider, 50);
          });

