
function GpuShader(shaderType) {
	this._shader = gl.createShader(shaderType);
	this._directives = new Array();
	this._extraCode = '';
}

GpuShader.prototype.loadShaderFromURL = function(url) {
	var shaderString = $.ajax({type: "GET", url: url, async: false}).responseText;
	
	this.loadShaderFromString(shaderString);
};

GpuShader.prototype.loadShaderFromString = function(string) {
	this._source = string;
	
	this.compile();
};

GpuShader.prototype.compile = function() {
	
	var source = this.appendDirectives(this._source);
	source += this._extraCode;
	
	gl.shaderSource(this._shader, source);
	gl.compileShader(this._shader);
	if (!gl.getShaderParameter(this._shader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog (this._shader));
	}
};

GpuShader.prototype.addDirective = function(string) {
	this._directives.push(string);
};

GpuShader.prototype.clearDirectives = function() {
	this._directives.length = 0;
};

GpuShader.prototype.appendDirectives = function(string) {
	if(this._directives.length > 0)
		for(var i = 0; i < this._directives.length; i++)
			string = this._directives[i] + "\n" + string;
	return string;
};

GpuShader.prototype.addExtraCode = function(code) {
	this._extraCode += code;
};

GpuShader.prototype.clearExtraCode = function() {
	this._extraCode = '';
};

GpuShader.prototype.getShader = function() {
	return this._shader;
};
