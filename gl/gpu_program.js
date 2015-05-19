define(['gpuShader'], function (GpuShader) {
	'use strict';

	function GpuProgram(glContext) {
		this._gl = glContext;
		this.program = this._gl.createProgram();
		this.vertexShader = new GpuShader(glContext, this._gl.VERTEX_SHADER);
		this.fragShader = new GpuShader(glContext, this._gl.FRAGMENT_SHADER);
	}

	GpuProgram.prototype = {

		loadFragmentShader: function (url) {
			this.fragShader.loadShaderFromURL(url);
		},

		loadVertexShader: function (url) {
			this.vertexShader.loadShaderFromURL(url);
		},

		addExtraCodeFragment: function (code) {
			this.fragShader.addExtraCode(code);
		},

		addExtraCodeVertex: function (code) {
			this.vertexShader.addExtraCode(code);
		},

		addDirectiveFragment: function (directive) {
			this.fragShader.addDirective(directive);
		},

		addDirectiveVertex: function (directive) {
			this.vertexShader.addDirective(directive);
		},

		compileFragmentShader: function () {
			this.fragShader.compile();
		},

		compileVertexShader: function () {
			this.vertexShader.compile();
		},

		addAttribute: function (attribute) {
			return this._gl.getAttribLocation(this.program, attribute);
		},

		addUniform: function (uniform) {
			return this._gl.getUniformLocation(this.program, uniform);
		},

		getProgram: function () {
			return this.program;
		},

		bind: function () {
			this._gl.useProgram(this.program);
		},

		linkProgram: function () {

			this._gl.linkProgram(this.program);

			if (!this._gl.getProgramParameter(this.program, this._gl.LINK_STATUS)) {
				console.log(this._gl.getProgramInfoLog(this.program));
			}

			//	this._gl.deleteShader(this.vertexShader);
			//	this._gl.deleteShader(this.fragShader);
		},

		restartProgram: function () {
			this._gl.deleteProgram(this.program);
			this.program = this._gl.createProgram();

			this.attachShaders();

			this.linkProgram();
		},

		attachShaders: function () {
			this._gl.attachShader(this.program, this.vertexShader.getShader());
			this._gl.attachShader(this.program, this.fragShader.getShader());
		},

		toJSON: function () {
			return {
				'vertexShader': this.vertexShader,
				'fragShader': this.fragShader
			};
		}
	};

	return GpuProgram;
});