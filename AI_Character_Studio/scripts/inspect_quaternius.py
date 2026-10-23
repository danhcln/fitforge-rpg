import bpy, json
from pathlib import Path
root = Path(__file__).resolve().parents[2]
base = root / 'AI_Character_Studio/vendor/quaternius/Universal Base Characters[Standard]'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(base / 'Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'))
for obj in bpy.data.objects:
    print('OBJECT', obj.name, obj.type, 'loc', tuple(obj.location), 'dim', tuple(obj.dimensions))
    if obj.type == 'MESH':
        print('BOUNDS', [min(v.co[i] for v in obj.data.vertices) for i in range(3)], [max(v.co[i] for v in obj.data.vertices) for i in range(3)])
        print('MATERIALS', [m.name for m in obj.data.materials])
    if obj.type == 'ARMATURE':
        print('BONES', json.dumps({b.name: [list(b.head_local), list(b.tail_local)] for b in obj.data.bones}))
