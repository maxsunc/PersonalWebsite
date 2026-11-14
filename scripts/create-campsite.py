"""Build the website's Y-up campsite in Blender, export a separate GLB, and render a preview.
Run from Blender's Python console/MCP. The TV is referenced only in the .blend preview.
"""
import bpy, math, random, os
from mathutils import Vector, Matrix
random.seed(71)
ROOT = os.environ.get('MAXSUN_PROJECT_ROOT', '/Users/maxsuncanada/github/PersonalWebsite')
for previous in list(bpy.data.scenes):
    if previous.name == 'Midnight Campsite':
        for obj in list(previous.objects):
            if len(obj.users_scene) == 1: bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.scenes.remove(previous)
scene = bpy.data.scenes.new('Midnight Campsite'); bpy.context.window.scene = scene
materials = {}
def mat(name, color, roughness=.85, metallic=0, emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness; p.inputs['Metallic'].default_value=metallic
    if emission: p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
    materials[name]=m; return m
soil=mat('Forest earth',(.038,.053,.027)); grass=mat('Grass moss',(.10,.18,.055)); grass2=mat('Grass sage',(.15,.23,.075)); grass3=mat('Grass shadow',(.055,.105,.036))
bark=mat('Deep furrowed bark',(.105,.048,.023)); barklight=mat('Bark ridges',(.19,.085,.035)); cut=mat('Fresh stump heartwood',(.39,.23,.105)); ring=mat('Growth rings',(.205,.102,.04))
stone=mat('River slate',(.17,.20,.21)); stone2=mat('Warm granite',(.25,.24,.20)); coal=mat('Charcoal logs',(.025,.017,.012)); ember=mat('Glowing embers',(.9,.055,.004),emission=3)
flame=mat('Fire amber',(1,.14,.008),emission=3); gold=mat('Fire golden core',(1,.60,.06),emission=4)
needles=mat('Pine deep green',(.022,.065,.046)); needletips=mat('Pine blue green',(.033,.095,.074)); brass=mat('Lantern aged brass',(.23,.16,.06),.45,.6); glow=mat('Lantern glow',(1,.47,.09),emission=2)
red=mat('Enamel mug',(.25,.035,.024),.35); ivory=mat('Mug rim',(.52,.47,.33)); blanket=mat('Wool blanket',(.13,.19,.21)); stripe=mat('Blanket stripe',(.40,.35,.24))
def finish(o,name,m): o.name=name; o.data.materials.append(m); return o
def box(name,loc,size,m,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft edges','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,m)
def ico(name,loc,scale,m,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc); o=bpy.context.object; o.scale=scale
    return finish(o,name,m)
def rod(name,a,b,r,m,vertices=10):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(a+b)/2)
    o=bpy.context.object; o.rotation_euler=d.to_track_quat('Z','Y').to_euler(); return finish(o,name,m)
def cone(name,loc,r1,r2,height,m,vertices=12):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=height,location=loc,rotation=(-math.pi/2,0,0))
    return finish(bpy.context.object,name,m)
def torus(name,loc,r,thick,m):
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=thick,major_segments=48,minor_segments=6,location=loc,rotation=(math.pi/2,0,0))
    return finish(bpy.context.object,name,m)
# Large undulating ground: no small diorama platform edge to clip through.
segments=128; rings=20; vertices=[(0,-8,0)]; faces=[]
for j in range(1,rings+1):
    radius=j*25
    for i in range(segments):
        a=i*2*math.pi/segments; x=math.cos(a)*radius; z=math.sin(a)*radius
        y=-8 if radius<=25 else -8+math.sin(a*3+.7)*min(4,(radius-25)*.045)+math.cos(a*5)*.5
        vertices.append((x,y,z))
for i in range(segments): faces.append((0,1+i,1+(i+1)%segments))
for j in range(rings-1):
    for i in range(segments):
        a=1+j*segments+i; b=1+j*segments+(i+1)%segments; c=a+segments; d=b+segments
        faces.extend([(a,c,d),(a,d,b)])
mesh=bpy.data.meshes.new('Terrain mesh'); mesh.from_pydata(vertices,[],[tuple(reversed(face)) for face in faces]); mesh.update()
o=bpy.data.objects.new('Terrain',mesh); scene.collection.objects.link(o); finish(o,'Terrain',soil)
# The stump is large enough for the existing CRT, with a flat, sturdy cut surface.
cone('Stump trunk',(0,-6.4,0),8.3,7.8,3.2,bark,32)
cone('Stump cut surface',(0,-4.78,0),7.82,7.82,.10,cut,48)
for radius in (1.1,1.8,2.7,3.9,5.25,6.7,7.5): torus('Stump growth ring',(0,-4.72,0),radius,.027,ring)
for i in range(28):
    a=i*2*math.pi/28; r=7.95+random.random()*.2
    rod('Bark ridge',(math.cos(a)*(r+.25),-7.85,math.sin(a)*(r+.25)),(math.cos(a)*(r-.3),-4.9,math.sin(a)*(r-.3)),.15+random.random()*.08,barklight if i%3 else bark)
for i in range(8):
    a=i*math.pi/4+.2
    rod('Spreading stump root',(math.cos(a)*6.5,-7.45,math.sin(a)*6.5),(math.cos(a)*10.3,-7.85,math.sin(a)*10.3),.48,bark)
# Campfire on the left, sheltered by a natural stone ring.
FX,FZ=-13,4
cone('Fire clearing',(FX,-7.94,FZ),5.0,5.0,.10,soil,40)
cone('Ash bed',(FX,-7.84,FZ),3.4,3.4,.12,coal,32)
for i in range(14):
    a=i*math.pi*2/14
    rock=ico('Fire ring stone',(FX+math.cos(a)*3.8,-7.35,FZ+math.sin(a)*3.8),(.8,.62,.65),stone if i%3 else stone2,2); rock.rotation_euler.y=a
for i in range(5):
    a=i*math.pi/2.5
    start=(FX-math.cos(a)*2.7,-7.05+(i%2)*.4,FZ-math.sin(a)*2.7)
    end=(FX+math.cos(a)*2.7,-6.8+(i%2)*.4,FZ+math.sin(a)*2.7)
    rod('Charred firewood',start,end,.43,coal,12)
    rod('Ember seam',(start[0],start[1]+.34,start[2]),(end[0],end[1]+.34,end[2]),.045,ember,6)
for i in range(30):
    a=random.random()*math.tau; r=random.random()*2.9
    ico('Hot coal',(FX+math.cos(a)*r,-7.45,FZ+math.sin(a)*r),(.12,.09,.12),ember)
# Sculpted flame tongues. Browser adds motion and a transparent fire shader.
for i in range(7):
    a=i*math.tau/7; radius=.9 if i else 0; h=2.2+random.random()*2
    base=Vector((FX+math.cos(a)*radius,-6.85,FZ+math.sin(a)*radius))
    vs=[]; fs=[]; sides=12; levels=9
    for j in range(levels):
        t=j/(levels-1); r=(math.sin(math.pi*(t*.86+.06))**.8)*(1-t)*.8
        for k in range(sides):
            angle=k*math.tau/sides
            vs.append((math.cos(angle)*r+.45*t*t*math.sin(i),t*h,math.sin(angle)*r+.3*t*t*math.cos(i)))
    for j in range(levels-1):
        for k in range(sides): fs.append((j*sides+k,j*sides+(k+1)%sides,(j+1)*sides+(k+1)%sides,(j+1)*sides+k))
    me=bpy.data.meshes.new('Flame sculpt'); me.from_pydata(vs,[],fs); me.update()
    ob=bpy.data.objects.new('CampFlame_'+str(i),me); scene.collection.objects.link(ob); ob.location=base; finish(ob,ob.name,flame if i%2 else gold)
    for p in me.polygons: p.use_smooth=True
# Grass blades: one compact mesh per color, not thousands of scene objects.
for variant,m in enumerate((grass,grass2,grass3)):
    vs=[]; fs=[]
    for i in range(4200):
        a=random.random()*math.tau; r=math.sqrt(random.random())*72; x=math.cos(a)*r; z=math.sin(a)*r
        if x*x+z*z<85 or (x-FX)**2+(z-FZ)**2<27: continue
        y=-7.97 if r<25 else -8+math.sin(a*3+.7)*min(4,(r-25)*.045)+math.cos(a*5)*.5
        h=random.uniform(.22,.70); w=random.uniform(.045,.12); wind=random.uniform(-.25,.25)
        for rotation in (random.random()*math.tau,random.random()*math.tau):
            dx,dz=math.cos(rotation)*w,math.sin(rotation)*w; n=len(vs)
            vs.extend([(x-dx,y,z-dz),(x+dx,y,z+dz),(x+wind,y+h,z+.12)])
            fs.append((n,n+1,n+2))
    me=bpy.data.meshes.new('Grass blades'); me.from_pydata(vs,[],fs); me.update()
    ob=bpy.data.objects.new('FieldGrass_'+str(variant),me); scene.collection.objects.link(ob); finish(ob,ob.name,m)
# A distant ring of firs, leaving the front of the clearing open.
for i in range(48):
    a=i*math.tau/48+random.uniform(-.025,.025); r=random.uniform(48,82)
    x,z=math.cos(a)*r,math.sin(a)*r
    if z>20 and abs(x)<25: continue
    ground=-8+math.sin(a*3+.7)*min(4,(r-25)*.045)+math.cos(a*5)*.5
    h=random.uniform(10,23)
    rod('Forest trunk',(x,ground,z),(x,ground+h*.8,z),.42,bark)
    for j in range(4): cone('Fir silhouette',(x,ground+h*(.30+j*.17),z),h*(.23-j*.042),.03,h*.46,needles if j%2 else needletips)
# Foreground stones, a fallen log seat, a folded blanket, and lantern.
for i in range(26):
    a=random.random()*math.tau; r=random.uniform(18,42); x,z=math.cos(a)*r,math.sin(a)*r
    s=random.uniform(.35,1.3); ico('Field stone',(x,-7.8,z),(s,s*.65,s*.9),stone,2)
rod('Fallen log seat',(7,-6.8,12),(18,-6.8,10.5),1.15,bark,16)
rod('Log cut end',(17.9,-6.8,10.51),(18.03,-6.8,10.49),1.04,cut,20)
box('Folded camp blanket',(11,-5.75,11.5),(3.7,.22,2),blanket,.12)
for x in (9.7,10.7,11.7,12.7): box('Woven blanket stripe',(x,-5.62,11.5),(.13,.025,1.95),stripe,.02)
# Small lantern next to the stump.
LX,LZ=9,4
cone('Lantern base',(LX,-7.6,LZ),.7,.7,.3,brass)
cone('Lantern top',(LX,-5.8,LZ),.75,.4,.45,brass)
cone('Lantern luminous chamber',(LX,-6.65,LZ),.37,.37,1.5,glow)
for i in range(4):
    a=i*math.pi/2; rod('Lantern cage',(LX+math.cos(a)*.51,-7.4,LZ+math.sin(a)*.51),(LX+math.cos(a)*.51,-5.95,LZ+math.sin(a)*.51),.045,brass)
# Merge static meshes by material, but preserve terrain, grass, and individual flames.
bpy.ops.object.select_all(action='DESELECT')
for m in materials.values():
    objects=[o for o in scene.objects if o.type=='MESH' and not o.name.startswith(('CampFlame','FieldGrass','Terrain')) and o.data.materials and o.data.materials[0]==m]
    if len(objects)<2: continue
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]; bpy.ops.object.join(); objects[0].name='Camp_'+m.name
    bpy.ops.object.select_all(action='DESELECT')
# Native preview lighting: physically illuminating fire, not just emissive geometry.
scene.world=bpy.data.worlds.new('Campsite night'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.014,.025,.065,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.16
for name,loc,color,energy in [('Campfire light',(FX,-4.8,FZ),(1,.29,.045),1900),('Lantern light',(LX,-6.2,LZ),(1,.55,.18),50)]:
    data=bpy.data.lights.new(name,'POINT'); data.energy=energy; data.color=color; data.shadow_soft_size=1
    ob=bpy.data.objects.new(name,data); scene.collection.objects.link(ob); ob.location=loc
moon=bpy.data.lights.new('Soft moon','AREA'); moon.energy=1800; moon.color=(.32,.48,1); moon.shape='DISK'; moon.size=30
ob=bpy.data.objects.new('Soft moon',moon); scene.collection.objects.link(ob); ob.location=(10,30,-5); ob.rotation_euler=(Vector((0,-7,0))-ob.location).to_track_quat('-Z','Y').to_euler()
camera_data=bpy.data.cameras.new('Campsite preview'); camera=bpy.data.objects.new('Campsite preview',camera_data); scene.collection.objects.link(camera)
camera.location=(18,16,48); forward=(Vector((-2,-1,1))-camera.location).normalized(); right=forward.cross(Vector((0,1,0))).normalized(); up=right.cross(forward)
camera.rotation_euler=Matrix((right,up,-forward)).transposed().to_euler(); camera_data.type='ORTHO'; camera_data.ortho_scale=50; scene.camera=camera
scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.render.resolution_x=1500; scene.render.resolution_y=1050; scene.render.resolution_percentage=100
os.makedirs(ROOT+'/public/models',exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type=='MESH': o.select_set(True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/models/campsite.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=False,export_cameras=False,export_lights=False)
# Add the existing TV to the editable Blender scene, excluded from the environment GLB.
reference=bpy.data.scenes.get('Max Sun - Analog CRT')
if reference:
    rotation=Matrix.Rotation(-math.pi/2,4,'X')
    for original in reference.objects:
        if original.type!='MESH': continue
        copy=original.copy(); copy.data=original.data.copy(); copy.parent=None; copy.name='PreviewTV_'+original.name
        scene.collection.objects.link(copy); copy.matrix_world=rotation @ original.matrix_world
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/campsite.blend')
scene.render.filepath=ROOT+'/assets/blender/campsite-preview.png'; bpy.ops.render.render(write_still=True)
