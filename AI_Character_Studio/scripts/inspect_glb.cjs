const fs = require('fs');
const path = require('path');

const glbPath = path.resolve(__dirname, '../../public/models/gym_avatar_v3.glb');
const buf = fs.readFileSync(glbPath);
const chunk0Length = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonStr);

console.log('=== GLTF INSPECTION ===');
console.log('Asset:', gltf.asset);
console.log('Scenes:', gltf.scenes?.length);
console.log('Meshes count:', gltf.meshes ? gltf.meshes.length : 0);

if (gltf.meshes) {
  gltf.meshes.forEach((m, idx) => {
    console.log(`\nMesh [${idx}]: "${m.name || 'unnamed'}"`);
    if (m.extras) {
      console.log('  extras:', JSON.stringify(m.extras, null, 2));
    }
    if (m.weights) {
      console.log('  weights length:', m.weights.length);
      console.log('  weights sample:', m.weights.slice(0, 10));
    }
    if (m.targetNames) {
      console.log('  targetNames count:', m.targetNames.length);
      console.log('  targetNames:', m.targetNames);
    }
    if (m.primitives) {
      console.log('  primitives count:', m.primitives.length);
      m.primitives.forEach((p, pIdx) => {
        console.log(`    primitive [${pIdx}] attributes:`, Object.keys(p.attributes));
        if (p.targets) {
          console.log(`    primitive [${pIdx}] targets count:`, p.targets.length);
        }
      });
    }
  });
}

console.log('\n=== NODES ===');
gltf.nodes?.forEach((n, idx) => {
  console.log(`Node [${idx}]: "${n.name}" (mesh: ${n.mesh !== undefined ? n.mesh : 'none'}, children: ${JSON.stringify(n.children || [])})`);
});

if (gltf.animations) {
  console.log('\n=== ANIMATIONS ===');
  console.log('Animations count:', gltf.animations.length);
  gltf.animations.forEach((a, idx) => {
    console.log(`Animation [${idx}]: "${a.name}" channels: ${a.channels.length}`);
  });
}
