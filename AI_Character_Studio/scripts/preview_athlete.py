"""Render front/back and all-morph stress views from the editable source."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'AI_Character_Studio/source/fitforge_athlete.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=480;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('QA Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.12,.15,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
for loc,power in [((3,-4,5),450),((-3,-2,3),200),((1,3,4),400)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.size=4
    light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=2.2
for name,location,value in [('front',(0,-5,1.1),0),('back',(0,5,1.1),0),('morph-max',(2.2,-5,2),1)]:
    for obj in bpy.data.objects:
        if obj.type=='MESH' and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                if key.name in ['Muscle','BodyFat','Chest','Legs']:key.value=value
    camera.location=location;camera.rotation_euler=(Vector((0,0,.95))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/f'docs/athlete-{name}.png');bpy.ops.render.render(write_still=True)
