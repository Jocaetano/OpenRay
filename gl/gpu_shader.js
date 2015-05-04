define(function () {
	'use strict';
	
	function GpuShader(shaderType) {
		this._shader = gl.createShader(shaderType);
		this._directives = [];
		this._extraCode = '';
	}

	GpuShader.prototype = {

		loadShaderFromURL: function (url) {
			var self = this;
			var onloadF = function () {
				self.loadShaderFromString(this.responseText);
			};
	
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, false);
			xhr.onload = onloadF;
			xhr.send();			
		},

		loadShaderFromString: function (string) {
			this._source = string;

			this.compile();
		},

		compile: function () {
			var source = this.appendDirectives(this._source);
			source += this._extraCode;

			gl.shaderSource(this._shader, source);
			gl.compileShader(this._shader);
			if (!gl.getShaderParameter(this._shader, gl.COMPILE_STATUS)) {
				console.log(gl.getShaderInfoLog(this._shader));
			}
		},

		addDirective: function (string) {
			this._directives.push(string);
		},

		clearDirectives: function () {
			this._directives.length = 0;
		},

		appendDirectives: function (string) {
			if (this._directives.length > 0)
				for (var i = 0; i < this._directives.length; i++)
					string = this._directives[i] + "\n" + string;
			return string;
		},

		addExtraCode: function (code) {
			this._extraCode += code;
		},

		clearExtraCode: function () {
			this._extraCode = '';
		},

		getShader: function () {
			return this._shader;
		}
	};
	
	return GpuShader;
});