App.prototype.initBuffers = function() {
	Vertices = [
	            0.0, 0.0, 	1.0, 0.0, 
	            0.0, 1.0, 	1.0, 1.0, 
	            ];

	this.VboID = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.VboID);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Vertices), gl.STATIC_DRAW);
};

App.prototype.initShaders = function() {
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
};

App.prototype.drawScene = function() {
	gl.disable(gl.CULL_FACE);

	mat4.ortho(this.pMatrix, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0);

	this.program.bind();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.VboID);
	gl.vertexAttribPointer(this.program.vertexPositionAttribute, 2, gl.FLOAT, gl.FALSE, 0, 0);
	this.raycaster.resultTexture.bind(0);
	gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.pMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

App.prototype.setVolume = function(volume) {
	this.volume = volume;

	//SET DEFAULT TOOL
	this.createRaycaster();
};

App.prototype.createRaycaster = function() {
	if(!this.running) {
		this.raycaster = new VolumeRaycaster(gl.viewportWidth, gl.viewportHeight, this.volume);
		this.running = true;
	} else {
		this.raycaster.setVolume(this.volume);
	}

	tick();
};

App.prototype.stopRaycaster = function() {
	this.runnning = false;
};

App.prototype.askDicomImages = function() {
	// this is a "call" to loadDicom() on controller.js
	document.getElementById('dicomFiles').click(); 

//	ImageFactory.createC3DEImagesFromWeb();
	controller.modified = true;
};

App.prototype.askRAW = function() {
	// this is a "call" to loadDicom() on controller.js
	document.getElementById('rawFile').click(); 

//	ImageFactory.createRAWFromWeb();
	controller.modified = true;
};

function App() {
	this.pMatrix = mat4.create();
	this.program = this.initShaders();
	this.initBuffers();

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function tick() {
	requestAnimFrame(tick);
	if(controller.modified) {
		app.raycaster.draw();
		app.drawScene();
		controller.modified = false;
	}
}



