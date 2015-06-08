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
		glProgram: '../gl/gl_program',
        glShader: '../gl/gl_shader',
        fbo: '../gl/fbo',
        glTexture2d: '../gl/gl_texture_2d',
        color: '../transferFunction/color',
        transferFunciton: '../transferFunction/transfer_function',
		camera: '..	/camera/camera',
        glMatrix: '../thirdy/glMatrix/glMatrix.min',
		raycaster: '../raycaster',
		colorPicker: 'colorPicker/color_picker',
		gradientEditor : 'gradientEditor/gradient_editor'
		//		volume_factory: '../dist/volume.min',
		//		raycaster: '../dist/openray.min',
    }
});

define(['app', 'controller'], function (App, Controller) {
	console.log("WebGLStart");
	var glCanvas = document.getElementById("raywebgl");
	var gl = WebGLUtils.setupWebGL(glCanvas);

	App.start(gl, glCanvas.width, glCanvas.height);
	Controller.init();
});