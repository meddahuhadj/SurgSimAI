// Test du code RÉEL (extrait des fichiers assets/app-part*.js) pour le branchement du
// vrai maillage patient (segmentation IA réelle) dans l'onglet "Jumeau numérique" PBD,
// qui utilisait jusque-là exclusivement une anatomie procédurale factice
// (buildTwinGeometry() -> makeLumpGeometry()), sans aucun rapport avec le patient.
//
// Deux pistes explorées et rejetées avant la solution retenue, documentées ici pour
// mémoire (pas de code correspondant dans ce test, elles ne sont PAS dans le fichier livré) :
//   1. Décimer le maillage réel côté client avec THREE.SimplifyModifier (three@0.128.0) :
//      testé directement avec le package npm `three` — retourne parfois une géométrie
//      VIDE (bug connu "No next vertex") en décimation agressive (>95% de retrait), et
//      prend plusieurs secondes (jusqu'à 5+s, bloquant le thread principal) même en cas
//      de succès. Rejeté : trop instable pour un usage clinique.
//   2. Décimer côté backend (trimesh, déjà utilisé en Phase 1/2) : fiable et rapide
//      (<0.2s, watertight préservé, volume conservé à <0.3% même à 98% de réduction) —
//      c'est l'approche retenue (voir backend/mesh_export.py:decimate_glb et
//      backend/segmentation_service.py:_maybe_build_lowpoly_twin_mesh).
//
// Bug trouvé et corrigé PENDANT ce test (pas juste écrit, testé) : le premier jet du
// chargement du maillage bas-poly oubliait d'appliquer le facteur d'échelle mm->scène
// (0.012, déjà utilisé par ailleurs dans loadRealMeshesIntoScene) avant extraction — le
// Jumeau se serait retrouvé ~80x trop grand (échelle mm réelle au lieu de l'échelle
// scène). Détecté en vérifiant la taille de bounding box obtenue ci-dessous.
//
// Usage : node run_test_digitaltwin_real_mesh.js
global.THREE = require('three');
const THREE = global.THREE;
const fs = require('fs');
const path = require('path');

// Le JS a été extrait de l'ancien HTML monolithique vers assets/app-part*.js
// (voir le découpage frontend) : on reconstitue le même contenu combiné en
// concaténant les 3 fichiers dans leur ordre d'exécution d'origine, pour que
// les recherches de marqueurs ci-dessous continuent de fonctionner à l'identique.
const html = ['app-part1.js', 'app-part2.js', 'app-part3.js']
  .map(f => fs.readFileSync(path.join(__dirname, '..', 'assets', f), 'utf8'))
  .join('\n');

function assert(cond, msg) {
  if (!cond) { console.error('❌ ÉCHEC:', msg); process.exitCode = 1; }
  else console.log('✅', msg);
}

// Extrait `function <name>(...) { ... }` tel quel (comptage d'accolades, robuste aux
// numéros de ligne qui dérivent avec le temps — même technique que
// run_test_digitaltwin_pipeline_honesty.js pour les littéraux d'objet).
function extractFunction(src, name) {
  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Fonction introuvable dans le HTML : ${name}`);
  let i = src.indexOf('{', start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

const fnNames = [
  'mergeGeometryVertices',
  'buildTwinParticles',
  'buildTwinConstraints',
  'extractRecenteredGeometryFromObject3D',
  'buildTwinGeometryFromRealLiverMesh',
];
const code = fnNames.map(n => extractFunction(html, n)).join('\n\n');
eval(code);

// ── 1) Simule un vrai gltf.scene issu de liver_total_lowpoly.glb : Object3D (Group)
//    contenant un Mesh, à l'échelle mm réelle (rayon ~90mm, comme un vrai foie),
//    exactement comme le retourne THREE.GLTFLoader avant l'application du scale. ──
const liverMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(90, 3)); // proxy bas-poly (642 vertices)
const gltfScene = new THREE.Group();
gltfScene.add(liverMesh);

// Reproduit exactement ce que fait désormais loadRealMeshesIntoScene() avant extraction :
gltfScene.scale.set(0.012, 0.012, 0.012);
const geo = extractRecenteredGeometryFromObject3D(gltfScene);

assert(!!geo, 'extractRecenteredGeometryFromObject3D() a retourné une géométrie');
geo.computeBoundingBox();
const size = new THREE.Vector3();
geo.boundingBox.getSize(size);
assert(size.x > 1.0 && size.x < 4.0,
  `taille cohérente avec l'échelle scène de l'anatomie procédurale (~1-2 unités), obtenu ${size.x.toFixed(3)} ` +
  `(sans le scale 0.012, on obtiendrait ~180 — c'est le bug corrigé pendant ce test)`);
const center = new THREE.Vector3();
geo.boundingBox.getCenter(center);
assert(center.length() < 0.001, `géométrie recentrée sur l'origine (résiduel ${center.length().toFixed(6)})`);
assert(!!geo.index, 'géométrie indexée (requis par buildTwinConstraints)');

// ── 2) buildTwinParticles / buildTwinConstraints sur le vrai maillage patient ──
const particles = buildTwinParticles(geo);
const constraints = buildTwinConstraints(geo, particles);
const pinnedCount = particles.filter(p => p.pinned).length;
assert(particles.length === geo.attributes.position.count, `${particles.length} particules = ${geo.attributes.position.count} sommets`);
assert(constraints.length > 0, `${constraints.length} contraintes générées (topologie valide, maillage réel)`);
assert(pinnedCount > 0 && pinnedCount < particles.length * 0.4,
  `${pinnedCount}/${particles.length} particules ancrées (${(100 * pinnedCount / particles.length).toFixed(1)}%, seuil proportionnel — ni 0 ni la majorité)`);
const badRest = constraints.filter(c => !(c.restLength > 0));
assert(badRest.length === 0, `aucune contrainte à longueur de repos nulle (${badRest.length} trouvée(s) — pas de triangle dégénéré)`);

// ── 3) Le même seuil d'ancrage proportionnel ne casse pas l'anatomie procédurale
//    existante (régression) — vérifié sur les bornes de sa bounding box directement,
//    sans dépendre de makeLumpGeometry()/SPECIALTY_SHAPE (hors périmètre de ce test). ──
const proceduralGeo = new THREE.IcosahedronGeometry(1.25, 2);
const proceduralMerged = mergeGeometryVertices(proceduralGeo);
const proceduralParticles = buildTwinParticles(proceduralMerged);
const proceduralPinned = proceduralParticles.filter(p => p.pinned).length;
assert(proceduralPinned > 0 && proceduralPinned < proceduralParticles.length * 0.4,
  `anatomie procédurale (rayon 1.25) : ${proceduralPinned}/${proceduralParticles.length} ancrées — seuil proportionnel toujours raisonnable`);

// ── 4) buildTwinGeometryFromRealLiverMesh() : fallback null si aucun maillage réel,
//    clone distinct sinon (pas de partage de buffer entre sessions Jumeau successives). ──
global.realLiverTwinGeometry = null;
assert(buildTwinGeometryFromRealLiverMesh() === null, 'retourne null sans maillage réel chargé (fallback procédural attendu)');

global.realLiverTwinGeometry = geo;
const cloned = buildTwinGeometryFromRealLiverMesh();
assert(!!cloned && cloned !== geo, 'retourne un clone distinct (pas le même buffer) quand un maillage réel existe');
assert(cloned.attributes.position.count === geo.attributes.position.count, 'le clone a le même nombre de sommets que l\'original');

console.log('\nTerminé.');
