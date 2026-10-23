"""Export the packed .blend source without downloading the original vendor pack."""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'AI_Character_Studio/source/fitforge_athlete.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type in ['MESH','ARMATURE']:obj.select_set(True)
bpy.context.scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/fitforge_athlete.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_morph=True,export_skins=True,export_yup=True)
