// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
require.config({
    baseUrl: './',
    paths: {
		volume_factory: '../dist/volume.min',
		raycaster: '../dist/openray.min',
		gpuProgram: '../gl/gpu_program'
    }
});

var gl;

var controller;
var app;

define(function (require) {
	console.log("WebGLStart");
	var glCanvas = document.getElementById("raywebgl");
	gl = WebGLUtils.setupWebGL(glCanvas);

	require(['app'], function (App) {
		app = App;
		app.start(glCanvas.width, glCanvas.height);
		controller = new Controller();
	});
});