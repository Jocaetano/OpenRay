define(['gpuShader'], function (GpuShader) {
	'use strict';

	function GpuProgram() {
		this.program = gl.createProgram();
		this.vertexShader = new GpuShader(gl.VERTEX_SHADER);
		this.fragShader = new GpuShader(gl.FRAGMENT_SHADER);
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
			return gl.getAttribLocation(this.program, attribute);
		},

		addUniform: function (uniform) {
			return gl.getUniformLocation(this.program, uniform);
		},

		getProgram: function () {
			return this.program;
		},

		bind: function () {
			gl.useProgram(this.program);
		},

		linkProgram: function () {

			gl.linkProgram(this.program);

			if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
				console.log(gl.getProgramInfoLog(this.program));
			}

			//	gl.deleteShader(this.vertexShader);
			//	gl.deleteShader(this.fragShader);
		},

		restartProgram: function () {
			gl.deleteProgram(this.program);
			this.program = gl.createProgram();

			this.attachShaders();

			this.linkProgram();
		},

		attachShaders: function () {
			gl.attachShader(this.program, this.vertexShader.getShader());
			gl.attachShader(this.program, this.fragShader.getShader());
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