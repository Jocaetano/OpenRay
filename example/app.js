
define(['raycaster', 'gpuProgram'], function (openray, GpuProgram) {
	'use strict';
	
	//private
	var _gl;
	var _pMatrix;
	var _program;
	var _VboID;
	var _volume;
	var _width = 0;
	var _height = 0;
	var _running = false;

	function _initBuffers() {
		var Vertices = [
			0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 1.0,
		];

		var VboID = _gl.createBuffer();
		_gl.bindBuffer(_gl.ARRAY_BUFFER, VboID);
		_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(Vertices), _gl.STATIC_DRAW);

		return VboID;
	}

	function _initShaders() {
		var shaderProgram = new GpuProgram(_gl);

		shaderProgram.loadVertexShader('./shaders/appShader.vert');
		shaderProgram.loadFragmentShader('./shaders/appShader.frag');
		shaderProgram.attachShaders();
		shaderProgram.linkProgram();
		shaderProgram.bind();
		shaderProgram.vertexPositionAttribute = shaderProgram.addAttribute("aVertexPosition");
		_gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		shaderProgram.pMatrixUniform = shaderProgram.addUniform("uPMatrix");

		return shaderProgram;
	}

	function _drawScene() {
		_gl.disable(_gl.CULL_FACE);

		mat4.ortho(_pMatrix, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0);

		_program.bind();
		_gl.bindBuffer(_gl.ARRAY_BUFFER, _VboID);
		_gl.vertexAttribPointer(_program.vertexPositionAttribute, 2, _gl.FLOAT, _gl.FALSE, 0, 0);
		_gl.uniformMatrix4fv(_program.pMatrixUniform, false, _pMatrix);
		_gl.drawArrays(_gl.TRIANGLE_STRIP, 0, 4);
	}
	
	//public	
    return {
		start: function (glContext, width, height) {
			_gl = glContext;
			_pMatrix = mat4.create();
			_program = _initShaders();
			_VboID = _initBuffers();
			_width = width, _height = height;
			_gl.viewport(0, 0, _width, _height);
			this.raycaster = openray;
			this.modified = false;
			this.tick = this.tick(this);
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

		tick: function (self) {
			return function () {
				window.requestAnimationFrame(self.tick);
				if (self.modified) {
					self.draw();
					self.modified = false;
				}
			};
		}
    };
});



