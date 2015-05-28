define(['gpuShader'], function (GpuShader) {
	'use strict';

	function GpuProgram(glContext) {
		this._gl = glContext;
		this.program = this._gl.createProgram();
		this.vertexShader = new GpuShader(glContext, this._gl.VERTEX_SHADER);
		this.fragShader = new GpuShader(glContext, this._gl.FRAGMENT_SHADER);
		this.attributes = {};
		this.uniforms = {};
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
			var attribLocation = this._gl.getAttribLocation(this.program, attribute);
			this._gl.enableVertexAttribArray(attribLocation);
			return attribLocation;
		},

		vertexAttribPointer: function (attributeName, size, glType) {
			var attribute;
			if (attributeName) {
				attribute = this.attributes[attributeName];
				this._gl.vertexAttribPointer(attribute.location, size, glType, false, 0, 0);
			} else
				for (var attributeName in this.attributes) {
					attribute = this.attributes[attributeName];
					this._gl.bindBuffer(this._gl.ARRAY_BUFFER, attribute.buffer);
					this._gl.vertexAttribPointer(attribute.location, attribute.bufferSize, attribute.bufferType, false, 0, 0);
				};
		},

		bindBufferToAttrib: function (buffer, size, glType, attributeName) {
			if (!this.attributes[attributeName]) {
				console.log("Invalid attributeName");
				return;
			}

			this.attributes[attributeName].buffer = buffer;
			this.attributes[attributeName].bufferSize = size;
			this.attributes[attributeName].bufferType = glType;
		},

		addArrayBuffer: function (arraybuffer, size, glType, attributeName) {
			if (!this.attributes[attributeName]) {
				console.log("Invalid attributeName");
				return;
			}

			var buffer = this._gl.createBuffer();
			this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
			this._gl.bufferData(this._gl.ARRAY_BUFFER, arraybuffer, this._gl.STATIC_DRAW);

			this.attributes[attributeName].buffer = buffer;
			this.attributes[attributeName].bufferSize = size;
			this.attributes[attributeName].bufferType = glType;

			return buffer;
		},

		drawArrays: function (mode, first, count) {
			for (var attributeName in this.attributes) {
				var attribute = this.attributes[attributeName];
				this._gl.bindBuffer(this._gl.ARRAY_BUFFER, attribute.buffer);
				this._gl.vertexAttribPointer(attribute.location, attribute.bufferSize, attribute.bufferType, false, 0, 0);
			};
			this._gl.drawArrays(mode, first, count);
		},

		addElementArrayBuffer: function (arraybuffer) {
			this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._gl.createBuffer());
			this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arraybuffer, this._gl.STATIC_DRAW);
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
				return;
			}

			var activeInfo;
			var activeLocation;
			var ii = this._gl.getProgramParameter(this.program, this._gl.ACTIVE_ATTRIBUTES);
			for (var i = 0; i < ii; i++) {
				activeInfo = this._gl.getActiveAttrib(this.program, i);
				activeLocation = this._gl.getAttribLocation(this.program, activeInfo.name);
				this._gl.enableVertexAttribArray(activeLocation);
				this.attributes[activeInfo.name] = {
					location: activeLocation
				};
			}

			ii = this._gl.getProgramParameter(this.program, this._gl.ACTIVE_UNIFORMS);
			for (i = 0; i < ii; i++) {
				activeInfo = this._gl.getActiveUniform(this.program, i);
				activeLocation = this._gl.getUniformLocation(this.program, activeInfo.name);
				this.uniforms[activeInfo.name] = activeLocation;
			}
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