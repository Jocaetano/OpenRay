
VolumeRaycaster.prototype.initVolumeProgram = function() {
	var volumeProgram = new GpuProgram();

	volumeProgram._vertexShader.loadShaderFromURL('./shaders/shader.vert');
	volumeProgram._fragShader.loadShaderFromURL('./shaders/shader.frag');
	volumeProgram.attachShaders();
	volumeProgram.linkProgram();
	volumeProgram.bind();
	volumeProgram.vertexPositionAttribute = volumeProgram.addAttribute("aVertexPosition");
	gl.enableVertexAttribArray(volumeProgram.vertexPositionAttribute);
	volumeProgram.vertexColorAttribute = volumeProgram.addAttribute("aVertexColor");
	gl.enableVertexAttribArray(volumeProgram.vertexColorAttribute);
	volumeProgram.pMatrixUniform = volumeProgram.addUniform("uPMatrix");
	volumeProgram.mvMatrixUniform = volumeProgram.addUniform("uMVMatrix");

	return volumeProgram;
};

VolumeRaycaster.prototype.initRaycastProgram = function() {
	var raycastProgram = new GpuProgram();

	if(this.numSlices > 1)
		raycastProgram._fragShader.addDirective("#define NUMBER_SLICES_" + this.numSlices);
	if(this.usePhongShading)
		raycastProgram._fragShader.addDirective("#define USE_PHONG_SHADING");
	if(this.useAlphaGradient)
		raycastProgram._fragShader.addDirective("#define USE_GRADIENT_ON_ALPHA");

	raycastProgram._vertexShader.loadShaderFromURL('./shaders/shader.vert');
	raycastProgram._fragShader.loadShaderFromURL('./shaders/raycast.frag');

	var shaderF = this.createVoxelFunction();

	raycastProgram._fragShader.addExtraCode(shaderF);
	raycastProgram._fragShader.compile();
	raycastProgram.attachShaders();
	raycastProgram.linkProgram();
	raycastProgram.bind();
//	Vertex
	raycastProgram.vertexPositionAttribute = raycastProgram.addAttribute("aVertexPosition");
	gl.enableVertexAttribArray(raycastProgram.vertexPositionAttribute);

	raycastProgram.vertexColorAttribute = raycastProgram.addAttribute("aVertexColor");
	gl.enableVertexAttribArray(raycastProgram.vertexColorAttribute);
	raycastProgram.mvMatrixUniform = raycastProgram.addUniform("uMVMatrix");
	raycastProgram.rotMatrixUniform = raycastProgram.addUniform("rotMatrix");

	raycastProgram.pMatrixUniform = raycastProgram.addUniform("uPMatrix");
//	Fragment

	raycastProgram.uRaysEndTexture = raycastProgram.addUniform("raysEndTexture");
	raycastProgram.uTransferFunctionTexture = raycastProgram.addUniform("transferFunctionTexture");

	raycastProgram.viewVector = raycastProgram.addUniform("viewVector");
	raycastProgram.lightDirection = raycastProgram.addUniform("lightDirection");
	raycastProgram.lightAmbientColor = raycastProgram.addUniform("lightAmbientColor");
	raycastProgram.lightDiffuseColor = raycastProgram.addUniform("lightDiffuseColor");
	raycastProgram.lightSpecularColor = raycastProgram.addUniform("lightSpecularColor");
	raycastProgram.lightShininess = raycastProgram.addUniform("lightShininess");

	raycastProgram.transferMinValue = raycastProgram.addUniform("transferMinValue");
	raycastProgram.transferRangeValue = raycastProgram.addUniform("transferRangeValue");

	raycastProgram.textureSize = raycastProgram.addUniform("textureSize");
	raycastProgram.volumeSize = raycastProgram.addUniform("volumeSize");
	raycastProgram.numberOfSlices = raycastProgram.addUniform("numberOfSlices");
	raycastProgram.samplingStep = raycastProgram.addUniform("samplingStep");
	raycastProgram.volumeSpacing = raycastProgram.addUniform("volumeSpacing");
	raycastProgram.dicomSize = raycastProgram.addUniform("dicomSize");

	gl.uniform2f(raycastProgram.textureSize, this.width,  this.height);

	return raycastProgram;
};

VolumeRaycaster.prototype.createVoxelFunction = function() {
	var shaderF = "\nuniform sampler2D volumeTexture1;\n";
	shaderF += "\n";
	shaderF += "float voxel(vec3 pos) {\n";
	shaderF += "	float slice = pos.z * numberOfSlices;\n";
	shaderF += "	vec3 rgb = voxelVolume(pos, " + this.slicesLength[0] + ".0, volumeTexture1, slice);\n";
	shaderF += "	return ((rgb.g*65280.0 + rgb.r*255.0) * " + this.volume._rescaleSlope + ".0) + " + this.volume._rescaleIntercept +".0;\n";
	shaderF += "}";

	if(this.numSlices > 1) {
		shaderF = "\n";
		for(var j = 0; j < this.numSlices; j++) {
			shaderF += "uniform sampler2D volumeTexture" + (j+1) + " ;\n";
		}
		shaderF += "\n";
		shaderF += "float voxel(vec3 pos) {\n";
		shaderF += "	vec3 rgb;\n";
		shaderF += "	float slice = pos.z * numberOfSlices;\n";
		shaderF += "	if(slice < "+ (this.slicesLength[0] - 1) + ".0) {\n";
		shaderF += "		rgb = voxelVolume(pos, " + this.slicesLength[0] + ".0 , volumeTexture1, slice);\n";
		shaderF += "	}\n";
		var temp = this.slicesLength[0];
		var i = 1;
		for(; i < this.numSlices - 1; i++) {
			shaderF += "	else if(slice < " + (temp) + ".0) {\n"
			shaderF += "		rgb = voxelVolumeIntersection(pos, " + Math.ceil(Math.sqrt(this.slicesLength[i-1])) + ".0, " + Math.ceil(Math.sqrt(this.slicesLength[i])) + ".0, volumeTexture" + i + ", volumeTexture" + (i+1) + ", slice - " + (temp - this.slicesLength[i - 1]) + ".0);\n"
			shaderF += "	}\n"
			shaderF += "	else if(slice < " + (temp + this.slicesLength[i] - 1) + ".0) {\n";
			shaderF += "		rgb = voxelVolume(pos, " + this.slicesLength[i] + ".0, volumeTexture" + (i+1) + ", slice - " + temp + ".0);\n"
			shaderF += "	}\n";
			temp += this.slicesLength[i];
		}
		shaderF += "	else if(slice < " + (temp) + ".0) {\n";
		shaderF += "		rgb = voxelVolumeIntersection(pos, " + Math.ceil(Math.sqrt(this.slicesLength[i-1])) + ".0, " + Math.ceil(Math.sqrt(this.slicesLength[i])) + ".0, volumeTexture" + i + ", volumeTexture" + (i+1) + ", slice - " + (temp - this.slicesLength[i - 1]) + ".0);\n";
		shaderF += "	}\n";
		shaderF += "	else if(slice < " + (temp + this.slicesLength[i]) + ".0) {\n";
		shaderF += "		rgb = voxelVolume(pos, " + this.slicesLength[i] + ".0, volumeTexture" + (i+1) + ", slice - " + (temp) + ".0);\n";
		shaderF += "	}\n";

		shaderF += "	return ((rgb.g*65280.0 + rgb.r*255.0) * " + this.volume._rescaleSlope + ".0) + " + this.volume._rescaleIntercept +".0;\n";
		shaderF += "}";
	}
	return shaderF;
};

VolumeRaycaster.prototype.setRaycastProgramVolume = function() {
	var box = this.volume.boundingBox();
	var spacing = [this.volume.getPixelSpacing().x, this.volume.getPixelSpacing().y, this.volume.getPixelSpacing().z];
	var smallerSpacing = Math.min(spacing[0], Math.min(spacing[1], spacing[2]));
	var samplingStep = 0.5 * smallerSpacing;
	console.log("Sampling steps: " + spacing);
	console.log("Sampling step: " + samplingStep);
	console.log("Box: " + box.width() + "  " + box.depth() + "  " + box.height());	

	this.raycastProgram.bind();
	this.raycastProgram.uVolumeTexture = new Array();
	this.raycastProgram.numberOfSlicesT = new Array();
	this.raycastProgram.uVolumeTexture[0] = this.raycastProgram.addUniform("volumeTexture" + (1));
	gl.uniform1i(this.raycastProgram.uVolumeTexture[0], 1);

	var i = 1;
	for(; i < this.numSlices; i++) {
		this.raycastProgram.uVolumeTexture[i] = this.raycastProgram.addUniform("volumeTexture" + (i+1));
		gl.uniform1i(this.raycastProgram.uVolumeTexture[i], i+1);
	}

	gl.uniform1i(this.raycastProgram.uRaysEndTexture, ++i);
	gl.uniform1i(this.raycastProgram.uTransferFunctionTexture, ++i);
	gl.uniform3f(this.raycastProgram.volumeSize, box.width(), box.depth(), box.height());
	gl.uniform1f(this.raycastProgram.numberOfSlices, this.volume._imgContainer.length);
	console.log("Número de slices : " + this.slicesLength.length);
	gl.uniform1f(this.raycastProgram.samplingStep, samplingStep);
	gl.uniform1f(this.raycastProgram.volumeSpacing, smallerSpacing);
	gl.uniform1f(this.raycastProgram.dicomSize, this.volume._imageWidth);
};

VolumeRaycaster.prototype.createBuffers = function() {
	this.cubeVertexPositionBuffer = gl.createBuffer();
	this.cubeVertexColorBuffer = gl.createBuffer();
	this.cubeVertexIndexBuffer = gl.createBuffer();
};

VolumeRaycaster.prototype.initVolumeBuffer = function() {
	this.mvMatrix = mat4.create();
	this.pMatrix = mat4.create();

	var box = this.volume.boundingBox();
	box.translate(box.center());
	vertices = [
	            (box.corner(7)[0]), (box.corner(7)[1]), (box.corner(7)[2]),
	            (box.corner(6)[0]), (box.corner(6)[1]), (box.corner(6)[2]),
	            (box.corner(5)[0]), (box.corner(5)[1]), (box.corner(5)[2]),
	            (box.corner(4)[0]), (box.corner(4)[1]), (box.corner(4)[2]),
	            (box.corner(3)[0]), (box.corner(3)[1]), (box.corner(3)[2]),
	            (box.corner(2)[0]), (box.corner(2)[1]), (box.corner(2)[2]),
	            (box.corner(1)[0]), (box.corner(1)[1]), (box.corner(1)[2]),
	            (box.corner(0)[0]), (box.corner(0)[1]), (box.corner(0)[2]),
	            ];

	gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	colors = [
	          0.0, 0.0, 0.0, 1.0,
	          1.0, 0.0, 0.0, 1.0,
	          0.0, 1.0, 0.0, 1.0,
	          1.0, 1.0, 0.0, 1.0,
	          0.0, 0.0, 1.0, 1.0,
	          1.0, 0.0, 1.0, 1.0,
	          0.0, 1.0, 1.0, 1.0,
	          1.0, 1.0, 1.0, 1.0
	          ];

	gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	cubeVertexIndices = [
	                     2, 0, 4,   2, 4, 6,	// Left face
	                     1, 0, 2,   1, 2, 3,	// Bottom face
	                     0, 5, 4,   0, 1, 5,	// Front face
	                     2, 6, 7,   2, 7, 3,	// Back face
	                     1, 7, 5,   1, 3, 7,	// Right face
	                     4, 7, 6,   4, 5, 7,	// Top face
	                     ];

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
};

VolumeRaycaster.prototype.castRays = function() {
	this.resultFBO.bind();
	this.resultFBO.attachColor(this.resultFBO.tex, 0);

	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.cullFace(gl.FRONT);

	this.resultFBO.tex.bind(0);
	var i = 0;
	for(; i < this.numSlices; i++) {
		this.volumeTexture[i].bind(i+1);	
	}		
	this.endFBO.tex.bind(++i);
	this.transferFunctionTexture.bind(++i);

	var cam = vec3.fromValues(0.0, 0.0, 1.0);
	vec3.add(cam, cam, vec3.fromValues(translateX, translateY, -800.0));
	vec3.transformMat4(cam, cam, objectRotationMatrix);
	vec3.normalize(cam, cam);

	this.raycastProgram.bind();
	gl.uniform3f(this.raycastProgram.viewVector, cam[0], cam[1], cam[2]);
	gl.uniform3f(this.raycastProgram.lightDirection, this.light._position[0], this.light._position[1], this.light._position[2]);
	gl.uniform3f(this.raycastProgram.lightAmbientColor, this.light._ambient.r, this.light._ambient.g, this.light._ambient.b);
	gl.uniform3f(this.raycastProgram.lightDiffuseColor, this.light._diffuse.r, this.light._diffuse.g, this.light._diffuse.b);
	gl.uniform3f(this.raycastProgram.lightSpecularColor, this.light._specular.r, this.light._specular.g, this.light._specular.b);
	gl.uniform1f(this.raycastProgram.lightShininess, 32.0);

	gl.uniformMatrix4fv(this.raycastProgram.rotMatrixUniform, false, objectRotationMatrix);

	this.drawVolumeBuffer(this.raycastProgram);

	this.resultFBO.unbind();
};

VolumeRaycaster.prototype.drawVolumeBuffer = function(program) {
	gl.viewport(0, 0, this.width, this.height);
	mat4.frustum(this.pMatrix, -10*zoom, 10*zoom, -10*zoom, 10*zoom, 200, 2500.0);
//	mat4.perspective(this.pMatrix, 45, 1, 200, 2500);

	program.bind();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexColorBuffer);
	gl.vertexAttribPointer(program.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
	gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.uniformMatrix4fv(program.pMatrixUniform, false, this.pMatrix);
	gl.uniformMatrix4fv(program.mvMatrixUniform, false, this.mvMatrix);
	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

	gl.viewport(0, 0, 1024, 1024);
};

VolumeRaycaster.prototype.calculateRayEnd = function() {
	this.endFBO.bind();
	this.endFBO.attachColor(this.endFBO.tex, 0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	this.drawVolumeBuffer(this.volumeProgram);

	this.endFBO.unbind();
};

VolumeRaycaster.prototype.draw = function() {
	gl.clearColor(0.0, 0.0, 0.0, 0.0);

	mat4.identity(this.mvMatrix);
	mat4.translate(this.mvMatrix, this.mvMatrix, [translateX, translateY, -800.0]);
	mat4.multiply(this.mvMatrix, this.mvMatrix, objectRotationMatrix);

	this.calculateRayEnd();
	this.castRays();
};

VolumeRaycaster.prototype.changeResultTexture = function() {
	if(this.resultTexture == this.resultFBO.tex)
		return this.resultTexture = this.endFBO.tex;
	this.resultTexture = this.resultFBO.tex;
};

VolumeRaycaster.prototype.changeRes = function(width, height) {
	this.width = width; this.height = height; 

	this.resultFBO.tex.changeSize(width, height);

	this.endFBO.changeRenderBufferSize(this.width, this.width, gl.DEPTH_ATTACHMENT);
	this.endFBO.tex.changeSize(width, height);

	this.raycastProgram.bind();
	gl.uniform2f(this.raycastProgram.textureSize, this.width,  this.height);
};

function VolumeRaycaster(width, height, volume) {
	this.width = width; this.height = height; 
	this.resultFBO = new FrameBufferObject();
	this.resultFBO.tex = new GLTexture2D("createTexture", this.width, this.height, gl.RGBA);

	this.resultTexture = this.resultFBO.tex;

	this.endFBO = new FrameBufferObject();
	this.endFBO.createDepthRenderBuffer(this.width, this.width, gl.DEPTH_ATTACHMENT);
	this.endFBO.tex = new GLTexture2D("createTexture", this.width, this.height, gl.RGBA);

	this.volumeProgram = this.initVolumeProgram();

	this.usePhongShading = true;
	this.useAlphaGradient = false;

	this.createBuffers();
	this.setVolume(volume);

	this.light = new LightSource([0.0, -1.0, 0.0],  true, new Color(0.0, 0.0, 0.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0), new Color(1.0, 1.0, 1.0, 1.0));

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
}

VolumeRaycaster.prototype.restartProgram = function(usePhongShading, useAlphaGradient) {
	this.usePhongShading = usePhongShading;
	this.useAlphaGradient = useAlphaGradient;

	this.setVolume(this.volume);
};

VolumeRaycaster.prototype.changeLightDirection = function(index, value) {
	this.light._position[index] = value;
};

VolumeRaycaster.prototype.setVolume = function(volume) {
	this.volume = volume;

	var sliceSize = Math.floor(gl.getParameter(gl.MAX_TEXTURE_SIZE)/volume._imageWidth);
	sliceSize *= sliceSize;
	var volumeSlices = new Array();
	this.slicesLength = new Array();
	var i = 0;
	var a = 0;
	while(a + sliceSize < volume._imgContainer.length) {
		volumeSlices[i] = volume.slice(a, a + sliceSize);
		a = a + sliceSize;
		this.slicesLength[i] = sliceSize;
		i++;
	};
	volumeSlices[i] = volume.slice(a, volume._imgContainer.length);
	this.slicesLength[i] = volume._imgContainer.length - a;

	this.numSlices = volumeSlices.length;

	if(this.volumeTexture) 
		this.volumeTexture.forEach(function(element) { gl.deleteTexture(element.tex); } );

	this.volumeTexture = new Array();
	for(var i = 0; i < this.numSlices; i++) {
		this.volumeTexture[i] = new GLTexture2D("loadFromVolume", volumeSlices[i]);
	}

	this.transferFunctionSize = this.volume._maxDensity - this.volume._minDensity + 1;

	if(this.transferFunctionTexture)
		this.transferFunctionTexture.changeSize(this.transferFunctionSize, 1);
	else
		this.transferFunctionTexture = new GLTexture2D("createTexture", this.transferFunctionSize, 1, gl.RGBA);

	this.initVolumeBuffer();

	if(this.raycastProgram)
		gl.deleteProgram(this.raycastProgram.getProgram());

	this.raycastProgram = this.initRaycastProgram();
	this.setRaycastProgramVolume();

	if(!this.transfer)
		this.setDefaultTransfer();

	this.updateTransferFunctionTexture();
};

VolumeRaycaster.prototype.loadTransferBuffer = function(transferBuffer) {

	transfer = new TransferFunction();

	var size = transferBuffer[0];
	transfer.setRange(transferBuffer[1], transferBuffer[5*(size-1) + 1]);

	for(var i = 0; i < size; i++){
		var position = (transferBuffer[5*i + 1] - transfer._min) / (transfer._max - transfer._min);
		var color = new Color(transferBuffer[5*i + 2], transferBuffer[5*i + 3], transferBuffer[5*i + 4]);
		transfer.insert(position, color, transferBuffer[5*i + 5]);
	}

	this.transfer = transfer;

	this.updateTransferFunctionTexture();
};

VolumeRaycaster.prototype.setTransfer = function(transfer) {

	transfer.setRange(this.volume._minDensity, this.volume._maxDensity);
	this.transfer = transfer;

	this.updateTransferFunctionTexture();
};

VolumeRaycaster.prototype.setDefaultTransfer = function() {
	transfer = new TransferFunction();

	transfer.setRange(this.volume._minDensity, this.volume._maxDensity);
	transfer.insert(0, new Color(0.0, 0.0, 0.0), 0.0);
//	transfer.insert(0.02, new Color(0.25, 0.0, 0.0), 0.14);
//	transfer.insert(0.06, new Color(1.0, 0.0, 0.0), 0.42);
//	transfer.insert(0.08, new Color(0.5, 0.5, 0.0), 0.56);
//	transfer.insert(0.1, new Color(1.0, 1.0, 1.0), 0.70);
	transfer.insert(1, new Color(1.0, 1.0, 1.0), 1.0);

	this.transfer = transfer;
};

VolumeRaycaster.prototype.updateTransferFunctionTexture = function() {
	var data = new Uint8Array(this.transferFunctionSize*4);
	for(var i = 0; i < this.transferFunctionSize; ++i){
		var p = i/(this.transferFunctionSize - 1);
		var c = this.transfer.color(p);
		var a = this.transfer.alpha(p);
		data[4 * i + 0] = c[0]*255;
		data[4 * i + 1] = c[1]*255;
		data[4 * i + 2] = c[2]*255;
		data[4 * i + 3] = a*255;
	}

	this.transferFunctionTexture.bind();
	this.transferFunctionTexture.updatePixels(data, gl.RGBA);
	this.raycastProgram.bind();
	gl.uniform1f(this.raycastProgram.transferMinValue, this.transfer.getRangeMin());
	gl.uniform1f(this.raycastProgram.transferRangeValue, this.transfer.getRangeMax() - this.transfer.getRangeMin());

	controller.updateTransferGradient(this.transfer);
};
