"""Run in Blender: builds the original CRT asset without touching existing scenes.
Coordinates in helpers are browser/Three.js coordinates (Y up, Z towards viewer).
"""
import bpy
import math
import os
from mathutils import Vector

ROOT = os.environ.get('MAXSUN_PROJECT_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Regeneration replaces only our generated scene; unrelated scenes stay intact.
for previous in list(bpy.data.scenes):
    if previous.name == 'Max Sun - Analog CRT':
        for obj in list(previous.objects):
            if len(obj.users_scene) == 1:
                bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.scenes.remove(previous)
scene = bpy.data.scenes.new('Max Sun - Analog CRT')
bpy.context.window.scene = scene
collection = scene.collection


def material(name, color, roughness=.6, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat

shell = material('Charcoal textured ABS', (.055, .059, .052), .74)
front = material('Warm graphite fascia', (.095, .102, .086), .58)
edge = material('Aged satin nickel', (.28, .29, .23), .38, .72)
recess = material('Recess black', (.009, .012, .009), .82)
rubber = material('Soft black rubber', (.025, .029, .023), .95)
knob = material('Control graphite', (.15, .16, .135), .42, .3)
ink = material('Warm ivory lettering', (.65, .68, .56), .7)
glass = material('Unlit phosphor glass', (.012, .024, .017), .22, .12)
led = material('Amber standby light', (.52, .24, .055), .35)
bsdf = led.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Emission Color'].default_value = (.8, .26, .045, 1)
bsdf.inputs['Emission Strength'].default_value = 1.4


def coords(x, y, z):
    return (x, -z, y)


def box(name, center, size, mat, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=coords(*center))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft manufactured edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 4
        obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj


def cylinder(name, x, y, z, radius, depth, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth,
        location=coords(x, y, z), rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    mod = obj.modifiers.new('Soft rim', 'BEVEL')
    mod.width = .025
    mod.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def label(text, x, y, z, size=.13):
    # Blender text lies in local XY; rotate so it faces the front (-Y).
    bpy.ops.object.text_add(location=coords(x, y, z), rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = 'Label_' + text
    obj.data.body = text
    obj.data.align_x = 'CENTER'
    obj.data.size = size
    obj.data.extrude = .001
    obj.data.materials.append(ink)
    bpy.ops.object.convert(target='MESH')
    return obj

box('Cabinet', (0, 0, -.85), (14, 9.2, 3.45), shell, .25)
box('FrontFascia', (0, 0, .84), (13.8, 9, .34), front, .18)
box('ScreenMetalRim', (-1.05, .12, 1.03), (11.18, 8.25, .22), edge, .34)
box('ScreenRubberSeal', (-1.05, .12, 1.16), (10.96, 8.02, .17), recess, .32)
box('ScreenGlass', (-1.05, .12, 1.25), (10.56, 7.64, .12), glass, .30)
# HTML screen plane: center (-1.05, .12, 1.325), size (10.40, 7.48).
box('ControlPanel', (5.56, .05, 1.03), (2.12, 8.27, .20), recess, .08)
box('TunerDisplay', (5.56, 3.38, 1.17), (1.76, .65, .12), knob, .035)
box('TunerGlass', (5.56, 3.38, 1.245), (1.57, .44, .04), glass, .015)
label('UHF / VHF', 5.56, 3.32, 1.275, .12)

for name, x, y in [('channel-up', 5.10, 2.35), ('channel-down', 6.02, 2.35)]:
    box('Socket_' + name, (x, y, 1.15), (.77, .57, .12), edge, .07)
    box('Button_' + name, (x, y, 1.28), (.64, .43, .22), knob, .055)
label('CHANNEL', 5.56, 2.83, 1.18, .13)
label('+', 5.10, 2.29, 1.40, .19)
label('-', 6.02, 2.29, 1.40, .19)
label('VOLUME', 5.56, 1.86, 1.18, .13)
box('VolumeBezel', (5.56, 1.38, 1.16), (1.82, .50, .12), edge, .05)
box('VolumeTrack', (5.56, 1.38, 1.235), (1.62, .16, .06), recess, .035)
for i in range(7):
    box('VolumeTick_%s' % i, (4.92 + i * 1.28 / 6, 1.08, 1.20), (.02, .07, .014), ink, .003)
thumb = box('VolumeThumb', (5.56, 1.38, 1.36), (.24, .44, .24), knob, .035)
bpy.context.view_layer.update()
grip = box('VolumeThumbGrip', (5.56, 1.38, 1.49), (.025, .25, .014), ink, .004)
grip.parent = thumb
grip.matrix_parent_inverse = thumb.matrix_world.inverted()

box('ViewSocket', (5.56, .37, 1.15), (1.72, .48, .12), edge, .04)
box('Button_view', (5.56, .37, 1.28), (1.53, .34, .22), knob, .035)
label('VIEW', 5.56, .31, 1.40, .13)

for i in range(16):
    box('SpeakerSlat_%02d' % i, (5.56, -.28 - i * .118, 1.16), (1.72, .042, .08), front, .013)
cylinder('PowerSocket', 5.56, -3.08, 1.16, .45, .13, edge)
cylinder('Button_power', 5.56, -3.08, 1.29, .36, .23, knob)
box('PowerIndicatorMark', (5.56, -2.99, 1.425), (.032, .19, .01), ink, .005)
label('POWER', 5.56, -3.78, 1.18, .13)
cylinder('StandbyLED', 6.15, -3.65, 1.21, .045, .04, led)
label('MAX SUN', -5.7, -4.31, 1.04, .14)
label('SOLID STATE / COLOR', .05, -4.31, 1.04, .10)
box('LeftFoot', (-5.3, -4.71, -.1), (1.3, .3, 2.1), rubber, .08)
box('RightFoot', (5.3, -4.71, -.1), (1.3, .3, 2.1), rubber, .08)
for i in range(14):
    box('TopVent_%02d' % i, (-4.9 + i * .36, 4.605, -.75), (.17, .015, 1.5), recess, .007)

# The rear is now explorable: removable back cover, cooling slots, screws, ports.
box('RearCover', (0, 0, -2.62), (12.85, 7.95, .18), shell, .18)
for side in [-1, 1]:
    for i in range(13):
        box('RearVent_%s_%02d' % (side, i), (side * 3.05, 2.9 - i * .19, -2.725), (4.65, .075, .045), recess, .025)
for x in [-5.95, 0, 5.95]:
    for y in [-3.52, 3.52]:
        cylinder('RearScrew', x, y, -2.75, .075, .045, edge)
        box('RearScrewSlot', (x, y, -2.777), (.09, .017, .008), recess, .002)
box('RearConnectionPanel', (-3.4, -2.5, -2.75), (3.5, 1.15, .10), recess, .07)
for i in range(3):
    cylinder('RearAVRing_%s' % i, -4.5 + i * .55, -2.5, -2.84, .135, .10, edge)
    cylinder('RearAVSocket_%s' % i, -4.5 + i * .55, -2.5, -2.90, .07, .045, recess)
box('RearPowerSocket', (4.8, -2.8, -2.77), (.85, .55, .15), recess, .04)
box('RearSerialPlate', (.5, -2.6, -2.75), (3.5, .9, .04), recess, .03)
rear_label = label('MAX SUN / ANALOG CRT', .5, -2.61, -2.78, .16)
rear_label.rotation_euler.z += math.pi

# Swivelling telescopic rabbit ears. Separate pivots are interactive in the site.
for side, base, tip in [
    ('left', (-1.65, 4.72, -.15), (-3.7, 7.25, -.25)),
    ('right', (-.55, 4.72, -.15), (1.6, 7.35, -.25)),
]:
    cylinder('AntennaSocket_' + side, base[0], base[1] - .05, base[2], .20, .24, recess)
    pivot = bpy.data.objects.new('Antenna_' + side, None)
    collection.objects.link(pivot)
    pivot.location = coords(*base)
    bpy.context.view_layer.update()
    start = Vector(coords(*base))
    finish = Vector(coords(*tip))
    delta = finish - start
    for index, (a, b, radius) in enumerate([(0, .38, .040), (.35, .72, .030), (.69, 1, .022)]):
        p1, p2 = start + delta * a, start + delta * b
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=(p2-p1).length, location=(p1+p2)/2)
        rod = bpy.context.object
        rod.name = 'AntennaRod_' + side + '_' + str(index)
        rod.rotation_euler = (p2-p1).to_track_quat('Z', 'Y').to_euler()
        rod.data.materials.append(edge)
        rod.parent = pivot
        rod.matrix_parent_inverse = pivot.matrix_world.inverted()
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.070, location=finish)
    cap = bpy.context.object
    cap.name = 'AntennaTip_' + side
    cap.data.materials.append(edge)
    cap.parent = pivot
    cap.matrix_parent_inverse = pivot.matrix_world.inverted()

# Save a useful native Blender scene and export only the model (no camera/lights).
model_objects = list(scene.objects)
os.makedirs(os.path.join(ROOT, 'public/models'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'assets/blender'), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in model_objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, 'public/models/retro-tv.glb'),
    export_format='GLB', use_selection=True, export_apply=True, export_yup=True)

world = bpy.data.worlds.new('Dark studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.07, .08, .06, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .35
scene.world = world

def area(name, position, energy, size, color):
    bpy.ops.object.light_add(type='AREA', location=coords(*position))
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = energy
    obj.data.shape = 'DISK'
    obj.data.size = size
    obj.data.color = color
    obj.rotation_euler = (Vector(coords(0, 0, 0)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
area('Large warm softbox', (-5, 7, 9), 1600, 7, (1, .89, .72))
area('Cool fill', (6, 3, 7), 1000, 6, (.72, .83, 1))
area('Top rim', (0, 8, -2), 1800, 5, (.8, 1, .75))
target = Vector(coords(0, 1.2, 0))
radius, yaw, pitch = 23, .28, .14
camera_position = coords(math.sin(yaw)*math.cos(pitch)*radius, 1.2 + math.sin(pitch)*radius, math.cos(yaw)*math.cos(pitch)*radius)
bpy.ops.object.camera_add(location=camera_position)
camera = bpy.context.object
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 16.2
scene.camera = camera
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x = 1620
scene.render.resolution_y = 1450
scene.render.resolution_percentage = 100
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'assets/blender/retro-tv.blend'))
if os.environ.get('RENDER_TV_POSTER') == '1':
    camera.data.ortho_scale = 16.2
    scene.render.resolution_x = 1620
    scene.render.resolution_y = 1450
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(ROOT, 'assets/blender/retro-tv-poster.png')
    bpy.ops.render.render(write_still=True)

result = {'objects': len(model_objects), 'glb': os.path.join(ROOT, 'public/models/retro-tv.glb'), 'bytes': os.path.getsize(os.path.join(ROOT, 'public/models/retro-tv.glb'))}
