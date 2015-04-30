
var gl;

function initGL(canvas) {
	try {
		gl = canvas.getContext("webgl");
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

	initGL(document.getElementById("raywebgl"));

	controller = new Controller();
	app = new App();
}