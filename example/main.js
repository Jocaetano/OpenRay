
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

define(function(require) {
	console.log("WebGLStart");
	initGL(document.getElementById("raywebgl"));

	controller = new Controller();
	require(['./app'], function (App) {
		app = new App();
	});
});