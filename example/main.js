// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
require.config({
    baseUrl: './',
    paths: {
        app: 'app',
		raycaster: '../dist/openray.min',
		gpuProgram: '../gl/gpu_program'
    }
});

var gl;

function initGL(canvas) {
	try {
		gl = WebGLUtils.setupWebGL(canvas);
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
}

var controller;
var app;

define(function (require) {
	console.log("WebGLStart");
	initGL(document.getElementById("raywebgl"));

	require(['app'], function (App) {
		app = App;
		app.start();
		controller = new Controller();
	});
});