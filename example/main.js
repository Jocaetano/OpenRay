// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
require.config({
    baseUrl: './',
    paths: {
		volume: '../volume/volume',
		volume_factory: '..//volume/volume_factory',
		box: '../volume/box',
		image: '../image/image',
		imageLoader: '../image/image_loader',
		gpuProgram: '../gl/gpu_program',
        gpuShader: '../gl/gpu_shader',
        fbo: '../gl/fbo',
        glTexture2d: '../gl/gl_texture_2d',
        color: '../transferFunction/color',
        transferFunciton: '../transferFunction/transfer_function',
        glMatrix: '../thirdy/glMatrix/glMatrix.subset',
		raycaster: '../raycaster',
		w: '../volume/w',
		worker: '../thirdy/require/worker',
//		volume_factory: '../dist/volume.min',
//		raycaster: '../dist/openray.min',
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