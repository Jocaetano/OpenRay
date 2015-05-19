define(function () {
	'use strict';
	
	function GpuShader(glContext, shaderType) {
		this._gl = glContext;
		this._shader = this._gl.createShader(shaderType);
		this._directives = [];
		this._extraCode = '';
		this._source = '';
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

			this._gl.shaderSource(this._shader, source);
			this._gl.compileShader(this._shader);
			if (!this._gl.getShaderParameter(this._shader, this._gl.COMPILE_STATUS)) {
				console.log(this._gl.getShaderInfoLog(this._shader));
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
		},
		
		toJSON: function () {
			return {
				'source': this._source,
				'directives': this._directives,
				'extraCode': this._extraCode
			};
		}
	};
	
	return GpuShader;
});