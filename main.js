
var gl;

function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
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

function main() {
	console.log("WebGLStart");

	controller = new Controller();
}

function raycasterStart(askVolume) {
	app = app || new App();
	
	app[askVolume]();
}