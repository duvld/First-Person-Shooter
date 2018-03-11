var world = {
    functions: {
		rotateAroundAxisAngle: object3D => axis => angle => {
			var q1 = new THREE.Quaternion();
			q1.setFromAxisAngle(axis, angle);
			object3D.quaternion.multiplyQuaternions(q1, object3D.quaternion)
			return object3D;
		},

		rotateAroundYAxis: object3D => angle => {
				world.functions.rotateAroundAxisAngle(object3D)(new THREE.Vector3(0,1,0))(angle)
		},

		move_forward: object3D => amount => {
			var YAxis    = new THREE.Vector3(0, 1, 0);
			var degToRad = THREE.Math.degToRad;
			var rotate   = world.functions.rotateAroundAxisAngle(object3D)(YAxis);

			rotate(degToRad(90));
			object3D.translateX(amount);
			rotate(degToRad(-90));

			return object3D;
		},

        //I wonder if there's more general example?
        //3/10/18 - yeah this one's gross because of the color stuff. refactor later.
        change_grid: scene => grid => params => {
            var size            = params.size;
            var count           = params.count;
            var color           = (params.color           !== undefined) ? params.color : 0x444444;
            var colorCenterLine = (params.colorCenterLine !== undefined) ? params.colorCenterLine : color;
            var colorGrid       = (params.colorGrid       !== undefined) ? params.colorGrid : color;

            scene.remove(grid);
            var new_grid = new THREE.GridHelper(size, count, colorCenterLine, colorGrid);
            scene.add(new_grid);
            return new_grid;
        },
	},

	axes : {
		x: new THREE.Vector3(1, 0, 0),
		y: new THREE.Vector3(0, 1, 0),
		z: new THREE.Vector3(0, 0, 1),
	},
	move_speed : .1,
	rot_speed  : .02,
};
var io    = {
    functions: {},
	gamepads:  {},
};

var game_objs = {
	world: world,
	io   : io,
}
// ^^ Export all of the above to its own file probably later

// NOTE TO SELF: center this around lazy loading

var getWidth  = () => window.innerWidth;
var getHeight = () => window.innerHeight;

var ASPECT_RATIO = () => getWidth()/getHeight();


var scene  = world.scene  = new THREE.Scene();
var camera = world.camera = new THREE.PerspectiveCamera(75, ASPECT_RATIO(), .001, 1000);
scene.add(camera);

//This can be abstracted into a make_reset function like
// reset_func -> reset_params -> reset_obj => obj_resetted
reset_camera = cam => {cam.position.set(0, 1, 5); cam.rotation.set(0,0,0)};
reset_camera(camera);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(getWidth(), getHeight());
document.body.appendChild(renderer.domElement);

var grid = new THREE.GridHelper(1000, 1000);
scene.add(grid);

///////////////
// HANDLE IO //
keyboard = io.keyboard = {}
keyfuncs = io.keyfuncs = {
	//insert key functions here
	KeyA: () => camera.translateX(-world.move_speed),
	KeyD: () => camera.translateX( world.move_speed),
	KeyW: () => world.functions.move_forward(camera)( world.move_speed),
	KeyS: () => world.functions.move_forward(camera)(-world.move_speed),

	KeyQ: () => world.functions.rotateAroundYAxis(camera)( world.rot_speed),
	KeyE: () => world.functions.rotateAroundYAxis(camera)(-world.rot_speed),
	KeyF: () => camera.rotateX(-world.rot_speed),
	KeyR: () => camera.rotateX( world.rot_speed),

	KeyT: () => reset_camera(camera),
}
document.addEventListener('keydown', e => keyboard[e.code] = true)
document.addEventListener('keyup',   e => delete keyboard[e.code])

doKeys = keyfuncs => keyboard => data => {
	for(var k in keyboard){
		try{
			keyfuncs[k](data);
		} catch(e){
			// console.error(e);
		}
	}
}

//////
// Gamepads
/////

gamepads = io.gamepads = {}
axis_indices = {

}
button_indices = {

}
gamepadfuncs = io.gamepadfuncs = {
}

//note: this only seems to work with navigator.getGamepads(), which
      //I assume means that the event listener only captures the gamepad on addition.
//Then again, it didn't seem to work when I connected it while pressing a button, so go figure.
log_pad = io.functions.log_pad = gamepad => {
    var axes = gamepad.axes;
    var buttons = gamepad.buttons;
    var axes_logstr = "";
    for(var i in axes){
        axes_logstr += `Axis ${i}: ${axes[i]}`;
    }
    console.log(axes_logstr);

    var buttons_logstr = "";
    for(var i in buttons){
        buttons_logstr += buttons[i].pressed ? i : '_';
        buttons_logstr += ',';
    }
    console.log(buttons_logstr);
}

io.functions.gamepad_connected    = e => io.gamepads[e.gamepad.index] = e.gamepad;
io.functions.gamepad_disconnected = e => delete io.gamepads[e.gamepad.index];
window.addEventListener('gamepadconnected',    e => io.functions.gamepad_connected(e));
window.addEventListener('gamepaddisconnected', e => io.functions.gamepad_disconnected(e));
///////////////
// END       //
///////////////


//Update vars
thingsToDo = [
	// () => console.log('testing'),
	data => doKeys(keyfuncs)(keyboard)(data),
	() => renderer.render(world.scene, world.camera),
];
var doThings = funcsToDo => data => {
	for(var i in funcsToDo){
		funcsToDo[i](data);
	}
}

//TODO: make this less stateful
var update = timestamp => {
	requestAnimationFrame(update);
	doThings(thingsToDo)(timestamp);
	renderer.render(scene, camera);
}
update()


//shortcuts
ttd = thingsToDo