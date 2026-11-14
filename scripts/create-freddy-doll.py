"""Original low-poly Freddy-inspired plush prop; Y-up, with feet on local y=0.
Run through Blender MCP, or MAXSUN_PROJECT_ROOT="$PWD" blender --background --python scripts/create-freddy-doll.py.
"""
import bpy, math, os
from mathutils import Vector, Matrix
ROOT = os.environ.get('MAXSUN_PROJECT_ROOT', '/Users/maxsuncanada/github/PersonalWebsite')
for old in list(bpy.data.scenes):
    if old.name == 'Freddy Doll':
        for ob in list(old.objects):
            if len(ob.users_scene) == 1: bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new('Freddy Doll'); bpy.context.window.scene = scene
materials = {}
def material(name, color, roughness=.9):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color,1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color,1); p.inputs['Roughness'].default_value = roughness
    materials[name] = m; return m
fur=material('Freddy warm brown plush',(.28,.105,.031)); dark=material('Freddy darker seams',(.115,.041,.013))
tan=material('Freddy muzzle and paw pads',(.57,.34,.14)); black=material('Freddy hat bow and nose',(.012,.010,.009),.65)
white=material('Freddy eye whites',(.82,.77,.65)); blue=material('Freddy blue irises',(.05,.30,.50),.45)
metal=material('Freddy microphone',(.14,.16,.15),.5)
def ellipsoid(name, loc, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=loc)
    ob=bpy.context.object; ob.name=name; ob.scale=scale; ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth=True
    return ob
def cylinder(name,loc,radius,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=depth,location=loc,rotation=(-math.pi/2,0,0))
    ob=bpy.context.object; ob.name=name; ob.data.materials.append(mat)
    bevel=ob.modifiers.new('Rounded plush trim','BEVEL'); bevel.width=.035; bevel.segments=2
    bpy.context.view_layer.objects.active=ob; bpy.ops.object.modifier_apply(modifier=bevel.name)
    return ob
# Seated plush silhouette, with a large round head, ears, top hat and bow tie.
ellipsoid('Freddy belly',(0,1.55,0),(.98,1.13,.66),fur)
ellipsoid('Freddy tummy patch',(0,1.48,.52),(.66,.75,.23),tan)
for side in (-1,1):
    ellipsoid('Freddy seated leg',(side*.67,.53,.35),(.54,.50,.65),fur)
    ellipsoid('Freddy foot',(side*.68,.36,.82),(.58,.36,.68),fur)
    ellipsoid('Freddy foot pad',(side*.68,.35,1.38),(.36,.23,.11),tan)
    arm=ellipsoid('Freddy arm',(side*1.02,1.52,.09),(.37,.79,.40),fur); arm.rotation_euler.z=side*.25
    ellipsoid('Freddy wrist seam',(side*1.18,1.03,.22),(.33,.13,.34),dark)
    ellipsoid('Freddy paw',(side*1.18,.87,.30),(.40,.38,.41),fur)
ellipsoid('Freddy head',(0,3.18,0),(1.19,1.02,.84),fur)
for side in (-1,1):
    ellipsoid('Freddy round ear',(side*1.03,3.91,-.03),(.43,.47,.27),fur)
    ellipsoid('Freddy ear inset',(side*1.03,3.93,.19),(.25,.29,.08),tan)
    ellipsoid('Freddy eye socket',(side*.46,3.37,.72),(.36,.42,.15),dark)
    ellipsoid('Freddy eye',(side*.46,3.38,.83),(.25,.29,.10),white)
    ellipsoid('Freddy iris',(side*.46,3.37,.921),(.12,.16,.035),blue)
    ellipsoid('Freddy pupil',(side*.46,3.37,.953),(.058,.10,.022),black)
    ellipsoid('Freddy eye catchlight',(side*.46-.035,3.43,.973),(.026,.033,.012),white)
    brow=ellipsoid('Freddy eyebrow',(side*.46,3.79,.82),(.31,.095,.10),black); brow.rotation_euler.z=side*-.12
    ellipsoid('Freddy muzzle cheek',(side*.29,2.91,.79),(.48,.34,.29),tan)
    for dx,dy in ((-.10,.03),(.06,.10),(.15,-.02)):
        ellipsoid('Freddy freckles',(side*.29+dx,2.94+dy,1.063),(.030,.027,.015),dark)
ellipsoid('Freddy nose',(0,3.08,1.08),(.25,.17,.14),black)
ellipsoid('Freddy smile',(0,2.70,.89),(.50,.105,.10),dark)
ellipsoid('Freddy lower lip',(0,2.64,.81),(.53,.11,.14),fur)
cylinder('Freddy hat brim',(0,4.08,-.01),.91,.13,black)
cylinder('Freddy top hat',(0,4.43,-.01),.64,.65,black)
cylinder('Freddy hat ribbon',(0,4.20,-.01),.655,.12,dark)
for side in (-1,1):
    bow=ellipsoid('Freddy bow wing',(side*.27,2.27,.67),(.31,.19,.13),black); bow.rotation_euler.z=side*.22
ellipsoid('Freddy bow knot',(0,2.27,.76),(.14,.15,.10),black)
for y in (1.88,1.48): ellipsoid('Freddy belly button',(0,y,.767),(.085,.085,.045),black)
# Small microphone nestled in one paw.
cylinder('Freddy microphone handle',(-1.26,1.13,.68),.10,.69,black)
ellipsoid('Freddy microphone grille',(-1.26,1.53,.68),(.21,.24,.21),metal)
for y in (1.43,1.53,1.63): cylinder('Freddy microphone band',(-1.26,y,.68),.211,.018,dark)
# Join by material to keep the prop cheap to render.
bpy.ops.object.select_all(action='DESELECT')
for mat in materials.values():
    objects=[ob for ob in scene.objects if ob.type=='MESH' and ob.data.materials and ob.data.materials[0]==mat]
    if not objects: continue
    for ob in objects: ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1: bpy.ops.object.join()
    objects[0].name='Freddy_'+mat.name
    bpy.ops.object.select_all(action='DESELECT')
for ob in scene.objects:
    if ob.type=='MESH': ob.select_set(True)
os.makedirs(ROOT+'/public/models',exist_ok=True); os.makedirs(ROOT+'/assets/blender',exist_ok=True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/models/freddy-doll.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=False,export_cameras=False,export_lights=False)
# Native preview only: no floor, lighting or camera in the exported prop.
scene.world=bpy.data.worlds.new('Freddy preview night'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.015,.022,.035,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.3
for name,loc,color,power,size in [('Fire warm side',(-4,5,6),(1,.48,.18),550,4),('Green screen bounce',(4,3,4),(.70,1,.63),180,3)]:
    data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.color=color; data.size=size
    ob=bpy.data.objects.new(name,data); scene.collection.objects.link(ob); ob.location=loc
    forward=(Vector((0,2,0))-ob.location).normalized(); right=forward.cross(Vector((0,1,0))).normalized(); up=right.cross(forward)
    ob.rotation_euler=Matrix((right,up,-forward)).transposed().to_euler()
data=bpy.data.cameras.new('Freddy preview'); camera=bpy.data.objects.new('Freddy preview',data); scene.collection.objects.link(camera)
camera.location=(7,5.8,14); forward=(Vector((0,2.3,0))-camera.location).normalized(); right=forward.cross(Vector((0,1,0))).normalized(); up=right.cross(forward)
camera.rotation_euler=Matrix((right,up,-forward)).transposed().to_euler(); data.type='ORTHO'; data.ortho_scale=6.2; scene.camera=camera
scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.render.resolution_x=900; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/freddy-doll.blend')
scene.render.filepath=ROOT+'/assets/blender/freddy-doll-preview.png'; bpy.ops.render.render(write_still=True)
