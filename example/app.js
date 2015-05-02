
define(['../raycaster'], function (Raycaster) {
	//private
	var _pMatrix = mat4.create();
	var _program = initShaders();
	var _VboID = initBuffers();
	var _volume;
	
	function initBuffers() {
		var Vertices = [
			0.0, 0.0, 1.0, 0.0,
			0.0, 1.0, 1.0, 1.0,
		];

		var VboID = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, VboID);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Vertices), gl.STATIC_DRAW);
		
		return VboID;
	}

	function initShaders() {
		var shaderProgram = new GpuProgram();

		shaderProgram._vertexShader.loadShaderFromURL('./shaders/appShader.vert');
		shaderProgram._fragShader.loadShaderFromURL('./shaders/appShader.frag');
		shaderProgram.attachShaders();
		shaderProgram.linkProgram();
		shaderProgram.bind();
		shaderProgram.vertexPositionAttribute = shaderProgram.addAttribute("aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		shaderProgram.pMatrixUniform = shaderProgram.addUniform("uPMatrix");

		return shaderProgram;
	}
			
	function drawScene() {
		gl.disable(gl.CULL_FACE);

		mat4.ortho(_pMatrix, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0);

		_program.bind();
		gl.bindBuffer(gl.ARRAY_BUFFER, _VboID);
		gl.vertexAttribPointer(_program.vertexPositionAttribute, 2, gl.FLOAT, gl.FALSE, 0, 0);
		gl.uniformMatrix4fv(_program.pMatrixUniform, false, _pMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	
	//public
	function App() {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	}
	
    App.prototype = {
        askRAW: function() {
			// this is a "call" to loadDicom() on controller.js
			document.getElementById('rawFile').click(); 

			//	ImageFactory.createRAWFromWeb();
        },
		
		askDicomImages: function() {
			// this is a "call" to loadDicom() on controller.js
			document.getElementById('dicomFiles').click(); 
	
			//	ImageFactory.createC3DEImagesFromWeb();
		},

		createRaycaster: function () {
			this.raycaster = new Raycaster(gl.viewportWidth, gl.viewportHeight, _volume);
			this.running = true;
			tick();
		},
		
		setVolume: function(volume) {
			_volume = volume;

			if (!this.running)
				this.createRaycaster();
			else
				this.raycaster.setVolume(_volume);
		},
		
		draw: function() {
			this.raycaster.draw();
			this.raycaster.get_resultTexture().bind(0);
			drawScene();
		}, 
    };
	
	return App;
});

function tick() {
	requestAnimFrame(tick);
	if(controller.modified) {
		app.draw();
		controller.modified = false;
	}
}



