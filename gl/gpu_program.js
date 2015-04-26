
function GpuProgram() {
	this._program = gl.createProgram();
	this._directives = new Array();
	this._vertexShader = new GpuShader(gl.VERTEX_SHADER);
	this._fragShader = new GpuShader(gl.FRAGMENT_SHADER);
}

GpuProgram.prototype.attachShaders = function() {
	gl.attachShader(this._program, this._vertexShader.getShader());
	gl.attachShader(this._program, this._fragShader.getShader());
};

GpuProgram.prototype.loadVertexShader = function(url) {
	this._vertexShader.loadShaderFromURL(url);
};

GpuProgram.prototype.restartProgram = function() {
	gl.deleteProgram(this._program);
	this._program = gl.createProgram();
	
	this.attachShaders();
	
	this.linkProgram();
};

GpuProgram.prototype.loadFragmentShader = function(url) {
	this._fragShader.loadShaderFromURL(url);
};

GpuProgram.prototype.linkProgram = function() {

	gl.linkProgram(this._program);
	
	if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
		console.log(gl.getProgramInfoLog (this._program));
	}

//	gl.deleteShader(this._vertexShader);
//	gl.deleteShader(this._fragShader);
};

GpuProgram.prototype.addAttribute = function(attribute) {
	return gl.getAttribLocation(this._program, attribute);
};

GpuProgram.prototype.addUniform = function(uniform) {
	return gl.getUniformLocation(this._program, uniform);
};

GpuProgram.prototype.getProgram = function() {
	return this._program;
};

GpuProgram.prototype.bind = function() {
	gl.useProgram(this._program);
};
