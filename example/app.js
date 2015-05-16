
define(['raycaster', 'gpuProgram'], function (openray, GpuProgram) {
	'use strict';
	
	//private
	var _pMatrix = mat4.create();
	var _program = _initShaders();
	var _VboID = _initBuffers();
	var _volume;
	var _width = 0;
	var _height = 0;
	var _running = false;
	
	function _initBuffers() {
		var Vertices = [
			0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 1.0,
		];

		var VboID = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, VboID);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Vertices), gl.STATIC_DRAW);

		return VboID;
	}

	function _initShaders() {
		var shaderProgram = new GpuProgram();

		shaderProgram.loadVertexShader('./shaders/appShader.vert');
		shaderProgram.loadFragmentShader('./shaders/appShader.frag');
		shaderProgram.attachShaders();
		shaderProgram.linkProgram();
		shaderProgram.bind();
		shaderProgram.vertexPositionAttribute = shaderProgram.addAttribute("aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		shaderProgram.pMatrixUniform = shaderProgram.addUniform("uPMatrix");

		return shaderProgram;
	}

	function _drawScene() {
		gl.disable(gl.CULL_FACE);

		mat4.ortho(_pMatrix, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0);

		_program.bind();
		gl.bindBuffer(gl.ARRAY_BUFFER, _VboID);
		gl.vertexAttribPointer(_program.vertexPositionAttribute, 2, gl.FLOAT, gl.FALSE, 0, 0);
		gl.uniformMatrix4fv(_program.pMatrixUniform, false, _pMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	
	//public	
    return {
		start: function (width, height) {
			_width = width, _height = height;
			gl.viewport(0, 0, _width, _height);
			this.raycaster = openray;
			this.tick = this.tick(this);
		},

		createRaycaster: function () {
			this.raycaster.init(_width, _height, _volume);
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
				if (controller.modified) {
					self.draw();
					controller.modified = false;
				}
			};
		}
    };
});



