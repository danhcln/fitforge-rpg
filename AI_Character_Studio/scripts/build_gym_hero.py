"""Build the FitForge athlete from the CC0 Quaternius Standard pack.
Run: blender --background --python AI_Character_Studio/scripts/build_gym_hero.py
"""
import bpy, bmesh, math, json, shutil
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'AI_Character_Studio/vendor/quaternius/Universal Base Characters[Standard]'
OUT = ROOT / 'AI_Character_Studio/source'
OUT.mkdir(parents=True, exist_ok=True)
# The Standard pack references a few normal maps with an extra "_png" suffix.
# Resolve those names locally before importing; no missing vendor paths survive export.
for asset in SOURCE.rglob('*.gltf'):
    for image in json.loads(asset.read_text()).get('images', []):
        if 'uri' not in image:continue
        destination=asset.parent/image['uri']
        if destination.exists():continue
        matches=list(SOURCE.rglob(destination.name.replace('_png','')))
        if matches:shutil.copyfile(matches[0],destination)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE / 'Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'))
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
body = bpy.data.objects['SuperHero_Male']
body.name = 'Athlete_Body'
# Imported glTF bone widgets are not character geometry.
for obj in list(bpy.data.objects):
    if obj.type == 'MESH' and obj.name not in ['Athlete_Body', 'Eyes', 'Eyebrows']:
        bpy.data.objects.remove(obj, do_unlink=True)

def material(name, color, roughness=.8):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return m

skin = material('Skin', (.49, .265, .145))
shirt_mat = material('Jersey', (.012, .39, .31))
short_mat = material('Shorts', (.021, .035, .065))
shoe_mat = material('Sneakers', (.035, .06, .09))
accent = material('Accent', (1, .32, .055))
white = material('Sole', (.8, .87, .83))
hair_mat = material('Hair', (.028, .017, .012))
eye_mat = material('Eyes', (.9, .9, .9), .5)
eye_texture = eye_mat.node_tree.nodes.new('ShaderNodeTexImage')
eye_texture.image = bpy.data.images.load(str(SOURCE/'Base Characters/Godot - UE/T_Eye_Brown.png'))
eye_mat.node_tree.links.new(eye_texture.outputs['Color'], eye_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
bpy.data.objects['Eyes'].data.materials.clear(); bpy.data.objects['Eyes'].data.materials.append(eye_mat)
body.data.materials.clear(); body.data.materials.append(skin)
bpy.data.objects['Eyebrows'].data.materials.clear()
bpy.data.objects['Eyebrows'].data.materials.append(hair_mat)
# Eye albedo supplies the iris; remove missing normal textures from vendor export.
for mat in list(bpy.data.materials):
    if not mat.use_nodes: continue
    for node in list(mat.node_tree.nodes):
        if node.type == 'TEX_IMAGE' and node.image and not Path(bpy.path.abspath(node.image.filepath)).exists():
            mat.node_tree.nodes.remove(node)

# Import the matching head-bone hairstyle, then bind to the original skeleton.
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(SOURCE / 'Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_SimpleParted.gltf'))
for obj in set(bpy.data.objects) - before:
    if obj.type == 'MESH' and 'Hair' in obj.name:
        world = obj.matrix_world.copy()
        obj.parent = rig; obj.matrix_world = world
        for mod in obj.modifiers:
            if mod.type == 'ARMATURE': mod.object = rig
        obj.data.materials.clear(); obj.data.materials.append(hair_mat)
        obj.name = 'Athlete_Hair'
    elif obj.type == 'ARMATURE':
        # Delete after reparenting hair below.
        pass
for obj in list(bpy.data.objects):
    if obj.type == 'ARMATURE' and obj != rig: bpy.data.objects.remove(obj, do_unlink=True)
    elif obj.type == 'MESH' and obj.name.startswith('Icosphere'): bpy.data.objects.remove(obj, do_unlink=True)

def subset(name, predicate, mat, offset):
    obj = body.copy(); obj.data = body.data.copy(); bpy.context.collection.objects.link(obj)
    obj.name = name
    bm = bmesh.new(); bm.from_mesh(obj.data)
    remove = [f for f in bm.faces if not predicate(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=remove, context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]
    if loose: bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.normal_update()
    boundary=[v for v in bm.verts if any(e.is_boundary for e in v.link_edges)]
    if name == 'Training_Shorts':
        for v in boundary: v.co.z = .67 if v.co.z < .85 else 1.055
    else:
        for _ in range(8):
            coords={v: v.co.lerp(sum((e.other_vert(v).co for e in v.link_edges if e.is_boundary),Vector()) / max(1,sum(e.is_boundary for e in v.link_edges)),.45) for v in boundary}
            for v,co in coords.items():v.co=co
    for v in bm.verts: v.co += v.normal * offset
    bm.to_mesh(obj.data); bm.free()
    obj.data.materials.clear(); obj.data.materials.append(mat)
    for f in obj.data.polygons: f.material_index = 0
    return obj

def shirt_region(p):
    x,y,z = p
    return 1.015 < z < 1.535 and abs(x) < .215 and not (z > 1.43 and abs(x) < .095) and not (z > 1.34 and abs(x) > .17)
def shorts_region(p): return .66 < p.z < 1.055
def shoes_region(p): return p.z < .155
shirt = subset('Training_Tank', shirt_region, shirt_mat, .024)
shorts = subset('Training_Shorts', shorts_region, short_mat, .024)
# Remove only feet hidden inside sneakers; keep skin behind smoothed garment edges.
bm=bmesh.new(); bm.from_mesh(body.data)
hidden=[f for f in bm.faces if f.calc_center_median().z < .085 or .72 < f.calc_center_median().z < 1.015 or (shirt_region(f.calc_center_median()) and abs(f.calc_center_median().x) < .145 and 1.08 < f.calc_center_median().z < 1.39)]
bmesh.ops.delete(bm, geom=hidden, context='FACES')
loose=[v for v in bm.verts if not v.link_faces]
if loose: bmesh.ops.delete(bm, geom=loose, context='VERTS')
bm.to_mesh(body.data); bm.free()

def rigged_object(obj, bone):
    obj.parent = rig
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Athlete rig','ARMATURE'); mod.object=rig

def rounded_box(name, location, scale, mat, bone, bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj=bpy.context.object; obj.name=name; obj.scale=scale
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mod=obj.modifiers.new('Soft corners','BEVEL');mod.width=bevel;mod.segments=3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat);rigged_object(obj,bone)
    return obj

# A small athletic chest badge and shoe accents give the outfit a distinct identity.
badge=rounded_box('Forge_Badge',(0,-.19,1.325),(.065,.014,.075),accent,'spine_03',.012)
for side in [-1,1]:
    suffix='l' if side>0 else 'r'
    rounded_box('Sneaker_'+suffix,(side*.113,.006,.057),(.145,.31,.105),shoe_mat,'foot_'+suffix,.035)
    rounded_box('Sole_'+suffix,(side*.113,.006,.008),(.15,.32,.033),white,'foot_'+suffix,.015)
    rounded_box('Shoe_Accent_'+suffix,(side*.113,.06,.114),(.07,.04,.008),accent,'foot_'+suffix,.004)
    for y in [-.055,-.03,-.005]:
        rounded_box('Lace_'+suffix,(side*.113,y,.112),(.075,.008,.006),white,'foot_'+suffix,.002)

def smoothstep(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def band(x,a,b,c,d): return smoothstep(a,b,x)*(1-smoothstep(c,d,x))

# Every garment uses the same deformation field as its underlying skin.
def deform(p,key):
    x,y,z=p; ax=abs(x); sign=1 if x>=0 else -1
    torso=(1-smoothstep(.18,.29,ax))*band(z,.90,1.04,1.44,1.55)
    arms=band(ax,.20,.30,.62,.74)*band(z,1.26,1.36,1.53,1.61)
    legs=band(z,.17,.30,.86,.97)
    chest=torso*band(z,1.16,1.29,1.46,1.54)
    belly=torso*band(z,.94,1.05,1.22,1.34)
    if key=='Muscle':
        x += x*.10*torso
        y += (y-.02)*(.20*torso+.20*arms+.12*legs)
        z += (z-1.455)*.19*arms
        x += (x-sign*.114)*.14*legs
    elif key=='BodyFat':
        x += x*.28*belly
        y += (y-.025)*(.65*belly+.10*chest)
        x += (x-sign*.114)*.10*legs
    elif key=='Chest':
        x += x*.12*chest
        y += (y-.025)*.27*chest
        z += (z-1.455)*.14*arms
    elif key=='Legs':
        x += (x-sign*.114)*.30*legs
        y += (y-.035)*.28*legs
    return Vector((x,y,z))

meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for obj in meshes:
    for p in obj.data.polygons:p.use_smooth=True
    # Slim the superhero base slightly; retain the recognizable adult proportions.
    if obj in [body,shirt,shorts,badge]:
        for v in obj.data.vertices:
            x,y,z=v.co
            t=(1-smoothstep(.18,.28,abs(x)))*band(z,.85,1.0,1.45,1.56)
            v.co.y = .02+(y-.02)*(1-.12*t)
        obj.shape_key_add(name='Basis')
        for key in ['Muscle','BodyFat','Chest','Legs']:
            shape=obj.shape_key_add(name=key)
            for i,v in enumerate(obj.data.vertices):shape.data[i].co=deform(v.co,key)

for obj in [body,bpy.data.objects['Eyes']]:
    if not obj.data.shape_keys:obj.shape_key_add(name='Basis')
    blink=obj.shape_key_add(name='Blink')
    for i,v in enumerate(obj.data.vertices):
        x,y,z=v.co
        if obj.name=='Eyes':blink.data[i].co.z=1.698+(z-1.698)*.06
        elif .012<abs(x)<.072 and y<-.048 and 1.674<z<1.722:
            influence=band(abs(x),.012,.025,.057,.072)*band(z,1.674,1.684,1.714,1.722)
            blink.data[i].co.z=z+(1.698-z)*influence

# Rigged resting pose and a subtle breathing loop, keeping legs planted.
def arm_pose(bone,angle):
    pb=rig.pose.bones[bone];pb.rotation_mode='QUATERNION'
    axis=pb.bone.matrix_local.to_3x3().inverted() @ Vector((0,1,0))
    pb.rotation_quaternion=Quaternion(axis,angle)
for side,sign in [('l',1),('r',-1)]:arm_pose('upperarm_'+side,sign*math.radians(68))
scene=bpy.context.scene;scene.render.fps=30
scene.frame_start=1;scene.frame_end=120
for frame in [1,31,61,91,121]:
    phase=(frame-1)/120*math.tau
    for side,sign in [('l',1),('r',-1)]:
        arm_pose('upperarm_'+side,sign*math.radians(68+math.sin(phase)*.7))
        rig.pose.bones['upperarm_'+side].keyframe_insert('rotation_quaternion',frame=frame)
    pb=rig.pose.bones['spine_03'];pb.scale=(1+math.sin(phase)*.006,1+math.sin(phase)*.005,1+math.sin(phase)*.006)
    pb.keyframe_insert('scale',frame=frame)
if rig.animation_data and rig.animation_data.action:rig.animation_data.action.name='Idle'
scene.frame_set(1)

# Pack textures for a self-contained editable Blender source.
for image in bpy.data.images:
    if image.source == 'FILE' and Path(bpy.path.abspath(image.filepath)).exists():image.reload()
    if image.has_data:
        if image.size[0]>1024 or image.size[1]>1024:image.scale(1024,1024)
        image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'fitforge_athlete.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in [rig]+meshes:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/fitforge_athlete.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_morph=True,export_skins=True,export_yup=True)
shutil.copyfile(SOURCE/'License_Standard.txt',OUT/'QUATERNIUS_LICENSE.txt')

# Reproducible preview lighting, kept out of the game export.
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=720;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.075,.105,.15,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.025));floor=bpy.context.object
floor.data.materials.append(material('Studio Floor',(.025,.045,.065)))
for loc,power,size in [((3,-4,5),450,4),((-3,-2,3),200,3),((1,3,4),500,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.4,-5,2.2));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.95))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.3;scene.camera=camera
scene.render.filepath=str(ROOT/'docs/athlete-preview.png')
bpy.ops.render.render(write_still=True)
print('BUILD_COMPLETE')
