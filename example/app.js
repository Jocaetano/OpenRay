
define(['raycaster', 'gpuProgram'], function (openray, GpuProgram) {
	'use strict';
	
	//private
	var _gl;
	var _pMatrix;
	var _program;
	var _volume;
	var _width = 0;
	var _height = 0;
	var _running = false;

	function _initBuffers() {
		var Vertices = [
			0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 1.0,
		];

		_program.addArrayBuffer(new Float32Array(Vertices), 2, _gl.FLOAT, "aVertexPosition");
	}

	function _initShaders() {
		var shaderProgram = new GpuProgram(_gl);

		shaderProgram.loadVertexShader('./shaders/appShader.vert');
		shaderProgram.loadFragmentShader('./shaders/appShader.frag');
		shaderProgram.attachShaders();
		shaderProgram.linkProgram();

		return shaderProgram;
	}

	function _drawScene() {
		mat4.ortho(_pMatrix, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0);

		_program.bind();
		_gl.uniformMatrix4fv(_program.uniforms.uPMatrix, false, _pMatrix);
		_program.drawArrays(_gl.TRIANGLE_STRIP, 0, 4);
	}
	
	//public	
    return {
		start: function (glContext, width, height) {
			_gl = glContext;
			_pMatrix = mat4.create();
			_program = _initShaders();
			_initBuffers();
			_width = width, _height = height;
			_gl.viewport(0, 0, _width, _height);
			this.raycaster = openray;
			this.modified = false;
			this.tick = this.tick.bind(this);
		},

		createRaycaster: function () {
			this.raycaster.init(_gl, _width, _height, _volume);
			_running = true;
			this.tick();
		},

		setVolume: function (volume) {
			_volume = volume;

			if (!_running)
				this.createRaycaster();
			else
				this.raycaster.setVolume(_volume);
		},

		draw: function () {
			this.raycaster.draw();
			this.raycaster.get_resultTexture().bind(0);
			_drawScene();
		},

		tick: function () {
			window.requestAnimationFrame(this.tick);
			if (this.modified) {
				this.draw();
				this.modified = false;
			}
		}
    };
});



