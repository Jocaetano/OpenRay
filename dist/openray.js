(function () {

	var º = {};

	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('glShader',factory);
		else
			º.GLShader = factory();
	} (this,
	
		function () {
			'use strict';
	
			function GLShader(glContext, shaderType) {
				this._gl = glContext;
				this._shader = this._gl.createShader(shaderType);
				this._directives = [];
				this._extraCode = '';
				this._source = '';
			}
	
			GLShader.prototype = {
	
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
						for (var i = 0, ii = this._directives.length; i < ii; i++)
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
	
			return GLShader;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('glProgram',['glShader'], factory);
		else
			º.GLProgram = factory(º.GLShader);
	} (this,
	
		function (GLShader) {
			'use strict';
	
			function GLProgram(glContext) {
				this._gl = glContext;
				this.program = this._gl.createProgram();
				this.vertexShader = new GLShader(glContext, this._gl.VERTEX_SHADER);
				this.fragShader = new GLShader(glContext, this._gl.FRAGMENT_SHADER);
				this.attributes = {};
				this.uniforms = {};
			}
	
			GLProgram.prototype = {
	
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
	
			return GLProgram;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('fbo',factory);
		else
			º.FrameBufferObject = factory();
	} (this,
	
		function () {
			'use strict';
	
			function FrameBufferObject(glContext) {
				this._gl = glContext;
				this._fbo = this._gl.createFramebuffer();
				this.renderBuffer = {};
			}
	
			FrameBufferObject.prototype = {
	
				bind: function () {
					this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
				},
	
				unbind: function () {
					this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
				},
	
				attachColor: function (tex, slot) {
					this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0 + slot, this._gl.TEXTURE_2D, tex.getTextureID(), 0);
				},
	
				createDepthRenderBuffer: function (width, height, type) {
					this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
					this.renderBuffer[type] = this._gl.createRenderbuffer();
					this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this.renderBuffer[type]);
					this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, width, height);
	
					this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, type, this._gl.RENDERBUFFER, this.renderBuffer[type]);
				},
	
				changeRenderBufferSize: function (width, height, type) {
					this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
					this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this.renderBuffer[type]);
					this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, width, height);
				}
	
			};
	
			return FrameBufferObject;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('glTexture2d',factory);
		else
			º.GLTexture2D = factory();
	} (this,
	
		function () {
			'use strict';
	
			function GLTexture2D(glContext, widthVolume, height, format) {
				this._gl = glContext;
				if (typeof widthVolume === "object")
					this.loadFromVolume(widthVolume);
				else
					this.createTexture(widthVolume, height, format);
			}
	
			GLTexture2D.prototype = {
				createTexture: function (width, height, format) {
					this.width = width;
					this.height = height;
					this.format = format;
					this._gl.deleteTexture(this.tex);
					this.tex = this._gl.createTexture();
					this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
					this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, width, height, 0, format, this._gl.UNSIGNED_BYTE, null);
					this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
					this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
					this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
					this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
				},
	
				changeSize: function (width, height) {
					this.width = width;
					this.height = height;
					this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
					this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this._gl.UNSIGNED_BYTE, null);
				},
	
				bind: function (slot) {
					slot = slot || 0;
					this._gl.activeTexture(this._gl.TEXTURE0 + slot);
					this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
				},
	
				getTextureID: function () {
					return this.tex;
				},
	
				loadFromVolume: function (volume) {
					var dicomSize = volume._imageWidth;
					//length is the number of images in a row of the final image matrix 
					var length = Math.ceil(Math.sqrt(volume._imgContainer.length));
					this.createTexture((dicomSize + 2) * length,(dicomSize + 2) * length, this._gl.RGB);
	
					//RGB
					var bytesPerPixel = 3;
					var align = 8;
					while ((dicomSize + 2) * bytesPerPixel * length % align) {
						align = align >> 1;
					}
					this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, align);
					//bytesRow is the number of bytes in a row of a single image
					var bytesRow = dicomSize * bytesPerPixel;
					var bytesRowT = (dicomSize + 2) * bytesPerPixel;
	
					//is it faster if we use only one ArrauBuffer?; see mdn TypedArray.prototype.set()
					var imageSizeBytes = dicomSize * bytesRow;
					var dataBuffer = new ArrayBuffer(imageSizeBytes + (dicomSize + 2) * bytesRowT * length * length);
					var dataImage = new Uint8Array(dataBuffer, 0, imageSizeBytes);
					var dataTexture = new Uint8Array(dataBuffer, imageSizeBytes);
	
					for (var i = 0, ii = volume._imgContainer.length; i < ii; i++) {
						volume._imgContainer[i].generateRGBData(dataImage);
						var columnOffset = (i % length) * bytesRowT;
						var rowOffset = Math.floor(i / length) * (dicomSize + 2);
						dataTexture.set(new Uint8Array(dataBuffer, 0, bytesPerPixel), rowOffset * bytesRowT * length + columnOffset);
						dataTexture.set(new Uint8Array(dataBuffer, 0, bytesRow), rowOffset * bytesRowT * length + columnOffset + bytesPerPixel);
						dataTexture.set(new Uint8Array(dataBuffer, bytesRow - bytesPerPixel, bytesPerPixel), rowOffset * bytesRowT * length + columnOffset + bytesRow + bytesPerPixel);
						for (var rowTexture = rowOffset + 1, rowImage = 0; rowImage < dicomSize; rowTexture++ , rowImage++) {
							dataTexture.set(new Uint8Array(dataBuffer, rowImage * bytesRow, bytesPerPixel), rowTexture * bytesRowT * length + columnOffset);
							dataTexture.set(new Uint8Array(dataBuffer, rowImage * bytesRow, bytesRow), rowTexture * bytesRowT * length + columnOffset + bytesPerPixel);
							dataTexture.set(new Uint8Array(dataBuffer, rowImage * bytesRow + (bytesRow - bytesPerPixel), bytesPerPixel), rowTexture * bytesRowT * length + columnOffset + bytesRow + bytesPerPixel);
						}
						dataTexture.set(new Uint8Array(dataBuffer,(rowImage - 1) * bytesRow, bytesPerPixel), rowTexture * bytesRowT * length + columnOffset);
						dataTexture.set(new Uint8Array(dataBuffer,(rowImage - 1) * bytesRow, bytesRow), rowTexture * bytesRowT * length + columnOffset + bytesPerPixel);
						dataTexture.set(new Uint8Array(dataBuffer, imageSizeBytes - bytesPerPixel, bytesPerPixel), rowTexture * bytesRowT * length + columnOffset + bytesRow + bytesPerPixel);
					}
					this.updatePixels(dataTexture, this._gl.RGB);
				},
	
				updatePixels: function (data, format) {
					this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
	
					this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, this.width, this.height, 0, format, this._gl.UNSIGNED_BYTE, data);
	
					this._gl.bindTexture(this._gl.TEXTURE_2D, null);
				}
			};
	
			return GLTexture2D;
		}));
	
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('color',factory);
		else
			º.Color = factory();
	} (this,
	
		function () {
			'use strict';
	
			function Color(r, g, b, a) {
				var color = new ArrayBuffer(4);
				this.color8 = new Uint8ClampedArray(color);
				this.color32 = new Uint32Array(color);
				this.color8[0] = r || 0;
				this.color8[1] = g || 0;
				this.color8[2] = b || 0;
				this.color8[3] = a || 0;
	
				this.r = this.color8[0];
				this.g = this.color8[1];
				this.b = this.color8[2];
				this.a = this.color8[3];
				this.rgba = this.color32[0];
			}
	
			Color.prototype = {
	
				multiply: function (value) {
					return new Color(this.r * value, this.g * value, this.b * value, this.a * value);
				},
	
				plus: function (color) {
					return new Color(this.r + color.r, this.g + color.g, this.b + color.b, this.a + color.a);
				},
	
				minus: function (color) {
					return new Color(this.r - color.r, this.g - color.g, this.b - color.b, this.a - color.a);
				},
	
				data: function () {
					return this.color8;
				},
	
				data32: function () {
					return this.color32;
				},
	
				updateRGBA: function () {
					this.r = this.color8[0];
					this.g = this.color8[1];
					this.b = this.color8[2];
					this.a = this.color8[3];
				},
	
				toJSON: function () {
					return {
						'r': this.r,
						'g': this.g,
						'b': this.b,
						'a': this.a
					};
				}
			};
	
			return Color;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('transferFunciton',factory);
		else
			º.TransferFunction = factory();
	} (this,
	
		function () {
			'use strict';
	
			function lower_bound(array, value, begin, end) {
				begin = begin || 0;
				end = end || array.length;
	
				if (array[0] == value)
					return 0;
				for (var i = begin; i < end; i++) {
					if (array[i] >= value)
						return i - 1;
				}
				return 0;
			}
	
			function upper_bound(array, value, begin, end) {
				begin = begin || 0;
				end = end || array.length;
	
				for (var i = begin; i < end; i++) {
					if (array[i] > value)
						return i;
				}
				return array.length - 1;
			}
	
	
			function _interpolation(colors, firstIt, secondIt, dist) {
				var c1 = colors[firstIt].rgba;
				var c2 = colors[secondIt].rgba;
				var MASK1 = 0xff00ff;
				var MASK2 = 0x00ff00;
				var f2 = ~~(256 * dist);
				var f1 = 256 - f2;
	
				var c3 = ((((c1 & MASK1) * f1) + ((c2 & MASK1) * f2)) >>> 8) & MASK1 | ((((c1 & MASK2) * f1) + ((c2 & MASK2) * f2)) >>> 8) & MASK2;
	
				var c1a = c1 >>> 24;
				var c2a = c2 >>> 24;
				var c3a = c1a + ~~((c2a - c1a) * dist);
				c3a = c3a << 24;
				c3 = c3a | c3;
	
				return c3;
			}
	
			function TransferFunction(min, max) {
				this.nStops = 0;
				this.size = max - min + 1;
				this._min = min;
				this._max = max;
				this._intervals = [];
				this._colors = [];
	
				this._observers = [];
	
				var dataBuffer = new ArrayBuffer(this.size * 4);
				this.data = new Uint8Array(dataBuffer);
				this.data32 = new Uint32Array(dataBuffer);
			}
	
			TransferFunction.prototype = {
	
				addObserver: function (observerCallback) {
					this._observers.push(observerCallback);
				},
	
				notifyObservers: function () {
					this._observers.forEach(function (observerCallback) {
						observerCallback();
					});
				},
	
				createData: function () {
					for (var i = 0, ii = this.size; i < ii; i++) {
						var position = i / (this.size - 1);
						this.data32[i] = this.getColorAt(position);
					}
				},
	
				push: function (interval, color) {
					this._intervals.push(interval);
					this._colors.push(color);
					this.nStops++;
				},
	
				_getAoE: function (it) {
					if (this.nStops < 2)
						return;
	
					var newData;
					var length = 0;
					var byteOffset = 0;
	
					if (it == 0) {
						length = ~~(this._intervals[1] * this.size);
						newData = new Uint32Array(this.data32.buffer, 4, length);
					} else if (it == this.nStops - 1) {
						byteOffset = ~~(this._intervals[it - 1] * this.size);
						length = ~~(this._intervals[it] * this.size) - byteOffset;
						newData = new Uint32Array(this.data32.buffer, byteOffset * 4 + 4, length - 2);
					} else {
						byteOffset = ~~(this._intervals[it - 1] * this.size);
						length = ~~(this._intervals[it + 1] * this.size) - byteOffset;
						newData = new Uint32Array(this.data32.buffer, byteOffset * 4 + 4, length - 2);
					}
	
					return { data: newData, offset: byteOffset };
				},
	
				_updateData: function (newData, byteOffset) {
					var p = 0.0;
					for (var i = 0, ii = newData.length; i < ii; i++) {
						p = (i + byteOffset) / (this.size - 1);
						newData[i] = this.getColorAt(p);
					}
				},
	
				insert: function (interval, color) {
					var it = upper_bound(this._intervals, interval);
	
					this._intervals.splice(it, 0, interval);
					this._colors.splice(it, 0, color);
					this.nStops++;
	
					var aoe = this._getAoE(it);
					this._updateData(aoe.data, aoe.offset);
	
					this.notifyObservers();
	
					return it;
				},
	
				remove: function (position) {
					var aoe = this._getAoE(position);
					this._colors.splice(position, 1);
					this._intervals.splice(position, 1);
					this.nStops--;
					this._updateData(aoe.data, aoe.offset);
					this.notifyObservers();
				},
	
				updateColor: function (position, color) {
					this._colors[position] = color;
					var aoe = this._getAoE(position);
					this._updateData(aoe.data, aoe.offset);
					this.notifyObservers();
				},
	
				moveColor: function (position, interval) {
					this._intervals[position] = interval;
	
					var changed = 0;
					if (interval > this._intervals[position + 1]) {
						this.swap(position, position + 1);
						changed = 1;
					}
					else if (interval < this._intervals[position - 1]) {
						this.swap(position, position - 1);
						changed = -1;
					}
	
					var aoe = this._getAoE(position + changed);
					this._updateData(aoe.data, aoe.offset);
	
					this.notifyObservers();
	
					return changed;
				},
	
				swap: function (position1, position2) {
					var bakInterval = this._intervals.splice(position1, 1);
					var bakColor = this._colors.splice(position1, 1);
	
					this._intervals.splice(position2, 0, bakInterval[0]);
					this._colors.splice(position2, 0, bakColor[0]);
				},
	
				setRange: function (min, max) {
					this._min = min;
					this._max = max;
					this._size = max - min + 1;
				},
	
				getColorAt: function (value) {
					var firstIt = lower_bound(this._intervals, value);
	
					var secondIt = upper_bound(this._intervals, value, firstIt);
	
					var dist = 0.0;
					if (this._intervals[secondIt] != this._intervals[firstIt])
						dist = (value - this._intervals[firstIt]) / (this._intervals[secondIt] - this._intervals[firstIt]);
	
					return _interpolation(this._colors, firstIt, secondIt, dist);
				},
	
				serialize: function () {
					var buffer = new ArrayBuffer(1 + (this.nStops * (4 + 4))); //nStops(1B), interval(4B), RGBA(4B)
					var dataView = new DataView(buffer);
					var resultBuffer = new Uint8Array(buffer);
	
					resultBuffer[0] = this.nStops;
					for (var i = 0, ii = this.nStops; i < ii; i++) {
						dataView.setFloat32(8 * i + 1, this.getInterval(i));
						var colorData = this._colors[i];
						resultBuffer[8 * i + 5] = colorData.r;
						resultBuffer[8 * i + 6] = colorData.g;
						resultBuffer[8 * i + 7] = colorData.b;
						resultBuffer[8 * i + 8] = colorData.a;
					}
					return resultBuffer;
				},
	
				getInterval: function (position) {
					return (this._intervals[position] * (this._max - this._min)) + this._min;
				},
	
				getRangeMin: function () {
					return this._min;
				},
	
				getRangeMax: function () {
					return this._max;
				},
	
				toJSON: function () {
					return {
						'nStops': this.nStops,
						'size': this.size,
						'_min': this._min,
						'_max': this._max,
						'_intervals': this._intervals,
						'_colors': this._colors
					};
				}
			};
	
			return TransferFunction;
	
		}));
	/**
	 * @fileoverview gl-matrix - High performance matrix and vector operations
	 * @author Brandon Jones
	 * @author Colin MacKenzie IV
	 * @version 2.2.2
	 */
	
	/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.
	
	Redistribution and use in source and binary forms, with or without modification,
	are permitted provided that the following conditions are met:
	
	  * Redistributions of source code must retain the above copyright notice, this
	    list of conditions and the following disclaimer.
	  * Redistributions in binary form must reproduce the above copyright notice,
	    this list of conditions and the following disclaimer in the documentation
	    and/or other materials provided with the distribution.
	
	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
	ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */
	
	
	(function(_global) {
	  "use strict";
	
	  var shim = {};
	  if (typeof(exports) === 'undefined') {
	    if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
	      shim.exports = {};
	      define('glMatrix',[],function() {
	        return shim.exports;
	      });
	    } else {
	      // gl-matrix lives in a browser, define its namespaces in global
	      shim.exports = typeof(window) !== 'undefined' ? window : _global;
	    }
	  }
	  else {
	    // gl-matrix lives in commonjs, define its namespaces in exports
	    shim.exports = exports;
	  }
	
	  (function(exports) {
	
	if(!GLMAT_EPSILON) {
	    var GLMAT_EPSILON = 0.000001;
	}
	
	if(!GLMAT_ARRAY_TYPE) {
	    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
	}
	
	if(!GLMAT_RANDOM) {
	    var GLMAT_RANDOM = Math.random;
	}
	
	/**
	 * @class Common utilities
	 * @name glMatrix
	 */
	var glMatrix = {};
	
	/**
	 * Sets the type of array used when creating new vectors and matrices
	 *
	 * @param {Type} type Array type, such as Float32Array or Array
	 */
	glMatrix.setMatrixArrayType = function(type) {
	    GLMAT_ARRAY_TYPE = type;
	}
	
	if(typeof(exports) !== 'undefined') {
	    exports.glMatrix = glMatrix;
	}
	
	var degree = Math.PI / 180;
	
	/**
	* Convert Degree To Radian
	*
	* @param {Number} Angle in Degrees
	*/
	glMatrix.toRadian = function(a){
	     return a * degree;
	}
	;var vec3 = {};
	
	/**
	 * Creates a new vec3 initialized with values from an existing vector
	 *
	 * @param {vec3} a vector to clone
	 * @returns {vec3} a new 3D vector
	 */
	vec3.clone = function(a) {
	    var out = new GLMAT_ARRAY_TYPE(3);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    return out;
	};
	
	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	vec3.fromValues = function(x, y, z) {
	    var out = new GLMAT_ARRAY_TYPE(3);
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    return out;
	};
	
	/**
	 * Adds two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.add = function(out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    out[2] = a[2] + b[2];
	    return out;
	};
	
	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to normalize
	 * @returns {vec3} out
	 */
	vec3.normalize = function(out, a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    var len = x*x + y*y + z*z;
	    if (len > 0) {
	        //TODO: evaluate use of glm_invsqrt here?
	        len = 1 / Math.sqrt(len);
	        out[0] = a[0] * len;
	        out[1] = a[1] * len;
	        out[2] = a[2] * len;
	    }
	    return out;
	};
	
	/**
	 * Transforms the vec3 with a mat4.
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec3} out
	 */
	vec3.transformMat4 = function(out, a, m) {
	    var x = a[0], y = a[1], z = a[2],
	        w = m[3] * x + m[7] * y + m[11] * z + m[15];
	    w = w || 1.0;
	    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
	    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
	    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
	    return out;
	};
	
	if(typeof(exports) !== 'undefined') {
	    exports.vec3 = vec3;
	}
	;
	
	var mat4 = {};
	
	/**
	 * Creates a new identity mat4
	 *
	 * @returns {mat4} a new 4x4 matrix
	 */
	mat4.create = function() {
	    var out = new GLMAT_ARRAY_TYPE(16);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};
	
	/**
	 * Creates a new mat4 initialized with values from an existing matrix
	 *
	 * @param {mat4} a matrix to clone
	 * @returns {mat4} a new 4x4 matrix
	 */
	mat4.clone = function(a) {
	    var out = new GLMAT_ARRAY_TYPE(16);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};
	
	/**
	 * Copy the values from one mat4 to another
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};
	
	/**
	 * Set a mat4 to the identity matrix
	 *
	 * @param {mat4} out the receiving matrix
	 * @returns {mat4} out
	 */
	mat4.identity = function(out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};
	
	/**
	 * Multiplies two mat4's
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	mat4.multiply = function (out, a, b) {
	    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
	        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
	        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
	        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
	
	    // Cache only the current line of the second matrix
	    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
	    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	
	    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
	    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	
	    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
	    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	
	    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
	    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	    return out;
	};
	
	/**
	 * Alias for {@link mat4.multiply}
	 * @function
	 */
	mat4.mul = mat4.multiply;
	
	/**
	 * Translate a mat4 by the given vector
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to translate
	 * @param {vec3} v vector to translate by
	 * @returns {mat4} out
	 */
	mat4.translate = function (out, a, v) {
	    var x = v[0], y = v[1], z = v[2],
	        a00, a01, a02, a03,
	        a10, a11, a12, a13,
	        a20, a21, a22, a23;
	
	    if (a === out) {
	        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
	        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
	        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
	        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
	    } else {
	        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
	        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
	        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
	
	        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
	        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
	        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
	
	        out[12] = a00 * x + a10 * y + a20 * z + a[12];
	        out[13] = a01 * x + a11 * y + a21 * z + a[13];
	        out[14] = a02 * x + a12 * y + a22 * z + a[14];
	        out[15] = a03 * x + a13 * y + a23 * z + a[15];
	    }
	
	    return out;
	};
	
	/**
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateX = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11];
	
	    if (a !== out) { // If the source and destination differ, copy the unchanged rows
	        out[0]  = a[0];
	        out[1]  = a[1];
	        out[2]  = a[2];
	        out[3]  = a[3];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	
	    // Perform axis-specific matrix multiplication
	    out[4] = a10 * c + a20 * s;
	    out[5] = a11 * c + a21 * s;
	    out[6] = a12 * c + a22 * s;
	    out[7] = a13 * c + a23 * s;
	    out[8] = a20 * c - a10 * s;
	    out[9] = a21 * c - a11 * s;
	    out[10] = a22 * c - a12 * s;
	    out[11] = a23 * c - a13 * s;
	    return out;
	};
	
	/**
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateY = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11];
	
	    if (a !== out) { // If the source and destination differ, copy the unchanged rows
	        out[4]  = a[4];
	        out[5]  = a[5];
	        out[6]  = a[6];
	        out[7]  = a[7];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	
	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c - a20 * s;
	    out[1] = a01 * c - a21 * s;
	    out[2] = a02 * c - a22 * s;
	    out[3] = a03 * c - a23 * s;
	    out[8] = a00 * s + a20 * c;
	    out[9] = a01 * s + a21 * c;
	    out[10] = a02 * s + a22 * c;
	    out[11] = a03 * s + a23 * c;
	    return out;
	};
	
	/**
	 * Generates a frustum matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Number} left Left bound of the frustum
	 * @param {Number} right Right bound of the frustum
	 * @param {Number} bottom Bottom bound of the frustum
	 * @param {Number} top Top bound of the frustum
	 * @param {Number} near Near bound of the frustum
	 * @param {Number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.frustum = function (out, left, right, bottom, top, near, far) {
	    var rl = 1 / (right - left),
	        tb = 1 / (top - bottom),
	        nf = 1 / (near - far);
	    out[0] = (near * 2) * rl;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = (near * 2) * tb;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = (right + left) * rl;
	    out[9] = (top + bottom) * tb;
	    out[10] = (far + near) * nf;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = (far * near * 2) * nf;
	    out[15] = 0;
	    return out;
	};
	
	if(typeof(exports) !== 'undefined') {
	    exports.mat4 = mat4;
	}
	;
	
	  })(shim.exports);
	})(this);
	
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('camera',['glMatrix'], factory);
		else
			º.Camera = factory(window);
	} (this,
	
		function (glm) {
			'use strict';
	
			function Camera(zoom, translateX, translateY, translateZ, objectRotationMatrix) {
				zoom = zoom || 1.0;
				translateX = translateX || 0.0;
				translateY = translateY || 0.0;
				translateZ = translateZ || 0.0;
				objectRotationMatrix = objectRotationMatrix || glm.mat4.create();
	
				this.pos = glm.vec3.fromValues(translateX, translateY, translateZ);
	
				this.mvMatrix = glm.mat4.create();
				glm.mat4.translate(this.mvMatrix, this.mvMatrix, [translateX, translateY, translateZ]);
				glm.mat4.multiply(this.mvMatrix, this.mvMatrix, objectRotationMatrix);
	
				this.pMatrix = glm.mat4.create();
				glm.mat4.frustum(this.pMatrix, -10 * zoom, 10 * zoom, -10 * zoom, 10 * zoom, 200, 2500.0);
	
				this.reset = this.reset(this.pos, this.mvMatrix, this.pMatrix);
	
				this._observers = [];
			};
	
			Camera.prototype = {
	
				addObserver: function (observerCallback) {
					this._observers.push(observerCallback);
				},
	
				notifyObservers: function () {
					this._observers.forEach(function (observerCallback) {
						observerCallback();
					});
				},
	
				rotate: function (deltaX, deltaY) {
					var xRotationMatrix = glm.mat4.create();
					glm.mat4.rotateY(xRotationMatrix, xRotationMatrix,(deltaX / 60));
	
					var yRotationMatrix = glm.mat4.create();
					glm.mat4.rotateX(yRotationMatrix, yRotationMatrix,(deltaY / 60));
	
					var newRotationMatrix = glm.mat4.create();
					glm.mat4.multiply(newRotationMatrix, xRotationMatrix, yRotationMatrix);
	
					glm.vec3.transformMat4(this.pos, this.pos, newRotationMatrix);
					glm.vec3.normalize(this.pos, this.pos);
	
					var translateX = this.mvMatrix[12];
					var translateY = this.mvMatrix[13];
					var translateZ = this.mvMatrix[14];
					this.mvMatrix[12] -= translateX;
					this.mvMatrix[13] -= translateY;
					this.mvMatrix[14] -= translateZ;
					glm.mat4.multiply(this.mvMatrix, newRotationMatrix, this.mvMatrix);
					this.mvMatrix[12] += translateX;
					this.mvMatrix[13] += translateY;
					this.mvMatrix[14] += translateZ;
	
					this.notifyObservers();
				},
	
				translate: function (deltaX, deltaY) {
					glm.vec3.add(this.pos, this.pos, glm.vec3.fromValues(deltaX, -deltaY, 0.0));
					glm.vec3.normalize(this.pos, this.pos);
	
					this.mvMatrix[12] += deltaX;
					this.mvMatrix[13] -= deltaY;
	
					this.notifyObservers();
				},
	
				changeZoom: function (delta) {
					var zoom = -delta < 0 ? 0.9 : 1.1;
					this.pMatrix[0] *= zoom;
					this.pMatrix[5] *= zoom;
	
					this.notifyObservers();
				},
	
				reset: function (pos, mvMatrix, pMatrix) {
					var posBak = glm.vec3.clone(pos);
					var mvMatrixBak = glm.mat4.clone(mvMatrix);
					var pMatrixBak = glm.mat4.clone(pMatrix);
	
					return function () {
						this.pos = posBak;
						glm.mat4.copy(this.mvMatrix, mvMatrixBak);
						glm.mat4.copy(this.pMatrix, pMatrixBak);
	
						this.notifyObservers();
					};
				}
			};
	
			return Camera;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('raycaster',['glProgram', 'fbo', 'glTexture2d', 'color', 'transferFunciton', 'camera'], factory);
		else
			window.openray = factory(º.GLProgram, º.FrameBufferObject, º.GLTexture2D, º.Color, º.TransferFunction, º.Camera);
	} (this,
	
		function (GLProgram, FrameBufferObject, GLTexture2D, Color, TransferFunction, Camera) {
			'use strict';
		
			//private
			
			function _initResultProgram() {
				var resultProgram = new GLProgram(_gl);
	
				resultProgram.loadVertexShader('../shaders/appShader.vert');
				resultProgram.loadFragmentShader('../shaders/appShader.frag');
				resultProgram.attachShaders();
				resultProgram.linkProgram();
				resultProgram.bind();
	
				var orthoCam = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, -1, 0, -1, -1, -0, 1];
	
				_gl.uniformMatrix4fv(resultProgram.uniforms.uPMatrix, false, orthoCam);
	
				var Vertices = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
	
				resultProgram.addArrayBuffer(new Float32Array(Vertices), 2, _gl.FLOAT, "aVertexPosition");
	
				return resultProgram;
			}
	
			function _initVolumeProgram() {
				var volumeProgram = new GLProgram(_gl);
	
				volumeProgram.loadVertexShader('../shaders/shader.vert');
				volumeProgram.loadFragmentShader('../shaders/shader.frag');
				volumeProgram.attachShaders();
				volumeProgram.linkProgram();
	
				return volumeProgram;
			}
	
			function _initRaycastProgram() {
				var raycastProgram = new GLProgram(_gl);
	
				if (_numSlices > 1)
					raycastProgram.addDirectiveFragment("#define NUMBER_SLICES_" + _numSlices);
				if (_usePhongShading)
					raycastProgram.addDirectiveFragment("#define USE_PHONG_SHADING");
				if (_useAlphaGradient)
					raycastProgram.addDirectiveFragment("#define USE_GRADIENT_ON_ALPHA");
	
				raycastProgram.loadVertexShader('../shaders/shader.vert');
				raycastProgram.loadFragmentShader('../shaders/raycast.frag');
	
				var shaderF = _createVoxelFunction();
	
				raycastProgram.addExtraCodeFragment(shaderF);
				raycastProgram.compileFragmentShader();
				raycastProgram.attachShaders();
				raycastProgram.linkProgram();
	
				return raycastProgram;
			}
	
			function _createVoxelFunction() {
				var shaderF = "\nuniform sampler2D volumeTexture1;\n";
				shaderF += "\n";
				shaderF += "float voxel(vec3 pos) {\n";
				shaderF += "	float slice = pos.z * numberOfSlices;\n";
				shaderF += "	vec3 rgb = voxelVolume(pos, " + _slicesLength[0] + ".0, volumeTexture1, slice);\n";
				shaderF += "	return ((rgb.g*65280.0 + rgb.r*255.0) * " + _volume._rescaleSlope + ".0) + " + _volume._rescale + ".0;\n";
				shaderF += "}";
	
				if (_numSlices > 1) {
					shaderF = "\n";
					for (var j = 0; j < _numSlices; j++) {
						shaderF += "uniform sampler2D volumeTexture" + (j + 1) + " ;\n";
					}
					shaderF += "\n";
					shaderF += "float voxel(vec3 pos) {\n";
					shaderF += "	vec3 rgb;\n";
					shaderF += "	float slice = pos.z * numberOfSlices;\n";
					shaderF += "	if(slice < " + (_slicesLength[0] - 1) + ".0) {\n";
					shaderF += "		rgb = voxelVolume(pos, " + _slicesLength[0] + ".0 , volumeTexture1, slice);\n";
					shaderF += "	}\n";
					var temp = _slicesLength[0];
					var i = 1;
					for (; i < _numSlices - 1; i++) {
						shaderF += "	else if(slice < " + (temp) + ".0) {\n";
						shaderF += "		rgb = voxelVolumeIntersection(pos, " + Math.ceil(Math.sqrt(_slicesLength[i - 1])) + ".0, " + Math.ceil(Math.sqrt(_slicesLength[i])) + ".0, volumeTexture" + i + ", volumeTexture" + (i + 1) + ", slice - " + (temp - _slicesLength[i - 1]) + ".0);\n";
						shaderF += "	}\n";
						shaderF += "	else if(slice < " + (temp + _slicesLength[i] - 1) + ".0) {\n";
						shaderF += "		rgb = voxelVolume(pos, " + _slicesLength[i] + ".0, volumeTexture" + (i + 1) + ", slice - " + temp + ".0);\n";
						shaderF += "	}\n";
						temp += _slicesLength[i];
					}
					shaderF += "	else if(slice < " + (temp) + ".0) {\n";
					shaderF += "		rgb = voxelVolumeIntersection(pos, " + Math.ceil(Math.sqrt(_slicesLength[i - 1])) + ".0, " + Math.ceil(Math.sqrt(_slicesLength[i])) + ".0, volumeTexture" + i + ", volumeTexture" + (i + 1) + ", slice - " + (temp - _slicesLength[i - 1]) + ".0);\n";
					shaderF += "	}\n";
					shaderF += "	else if(slice < " + (temp + _slicesLength[i]) + ".0) {\n";
					shaderF += "		rgb = voxelVolume(pos, " + _slicesLength[i] + ".0, volumeTexture" + (i + 1) + ", slice - " + (temp) + ".0);\n";
					shaderF += "	}\n";
	
					shaderF += "	return ((rgb.g*65280.0 + rgb.r*255.0) * " + _volume._rescaleSlope + ".0) + " + _volume._rescale + ".0;\n";
					shaderF += "}";
				}
				return shaderF;
			}
	
			function _setRaycastProgramVolume() {
				var box = _volume.boundingBox();
				var spacing = [_volume.getPixelSpacing().x, _volume.getPixelSpacing().y, _volume.getPixelSpacing().z];
				var smallerSpacing = Math.min(spacing[0], Math.min(spacing[1], spacing[2]));
				var samplingStep = 0.5 * smallerSpacing;
				console.log("Sampling steps: " + spacing);
				console.log("Sampling step: " + samplingStep);
				console.log("Box: " + box.width() + "  " + box.depth() + "  " + box.height());
				console.log("Número de slices : " + _slicesLength.length);
	
				_raycastProgram.bind();
	
				_gl.uniform1i(_raycastProgram.uniforms["volumeTexture" + (1)], 1);
				var i = 1;
				for (; i < _numSlices; i++) {
					_gl.uniform1i(_raycastProgram.uniforms["volumeTexture" + (i + 1)], i + 1);
				}
	
				_gl.uniform2f(_raycastProgram.uniforms.textureSize, _width, _height);
				_gl.uniform1i(_raycastProgram.uniforms.raysEndTexture, ++i);
				_gl.uniform1i(_raycastProgram.uniforms.transferFunctionTexture, ++i);
				_gl.uniform3f(_raycastProgram.uniforms.volumeSize, box.width(), box.depth(), box.height());
				_gl.uniform1f(_raycastProgram.uniforms.numberOfSlices, _volume._imgContainer.length);
				_gl.uniform1f(_raycastProgram.uniforms.samplingStep, samplingStep);
				_gl.uniform1f(_raycastProgram.uniforms.volumeSpacing, smallerSpacing);
				_gl.uniform1f(_raycastProgram.uniforms.dicomSize, _volume._imageWidth);
				_gl.uniform3f(_raycastProgram.uniforms.lightDirection, _light.position[0], _light.position[1], _light.position[2]);
				_gl.uniform3f(_raycastProgram.uniforms.lightAmbientColor, _light.ambient.r, _light.ambient.g, _light.ambient.b);
				_gl.uniform3f(_raycastProgram.uniforms.lightDiffuseColor, _light.diffuse.r, _light.diffuse.g, _light.diffuse.b);
				_gl.uniform3f(_raycastProgram.uniforms.lightSpecularColor, _light.specular.r, _light.specular.g, _light.specular.b);
				_gl.uniform1f(_raycastProgram.uniforms.lightShininess, 32.0);
			}
	
			function _initVolumeBuffer() {
	
				var box = _volume.boundingBox();
				box.translate(box.center());
				var vertices = [
					(box.corner(7)[0]), (box.corner(7)[1]), (box.corner(7)[2]),
					(box.corner(6)[0]), (box.corner(6)[1]), (box.corner(6)[2]),
					(box.corner(5)[0]), (box.corner(5)[1]), (box.corner(5)[2]),
					(box.corner(4)[0]), (box.corner(4)[1]), (box.corner(4)[2]),
					(box.corner(3)[0]), (box.corner(3)[1]), (box.corner(3)[2]),
					(box.corner(2)[0]), (box.corner(2)[1]), (box.corner(2)[2]),
					(box.corner(1)[0]), (box.corner(1)[1]), (box.corner(1)[2]),
					(box.corner(0)[0]), (box.corner(0)[1]), (box.corner(0)[2])
				];
	
				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
				_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(vertices), _gl.STATIC_DRAW);
	
				var colors = [
					0.0, 0.0, 0.0, 1.0,
					1.0, 0.0, 0.0, 1.0,
					0.0, 1.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					0.0, 1.0, 1.0, 1.0,
					1.0, 1.0, 1.0, 1.0
				];
	
				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
				_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(colors), _gl.STATIC_DRAW);
	
				var cubeVertexIndices = [
					2, 0, 4, 2, 4, 6,	// Left face
					1, 0, 2, 1, 2, 3,	// Bottom face
					0, 5, 4, 0, 1, 5,	// Front face
					2, 6, 7, 2, 7, 3,	// Back face
					1, 7, 5, 1, 3, 7,	// Right face
					4, 7, 6, 4, 5, 7	// Top face
				];
	
				_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _gl.createBuffer());
				_gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), _gl.STATIC_DRAW);
	
				//			[_raycastProgram, _volumeProgram].forEach(function (program) {
				//				program.bind();
				//				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
				//				program.vertexAttribPointer("aVertexColor", 4, _gl.FLOAT);
				//				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
				//				program.vertexAttribPointer("aVertexPosition", 3, _gl.FLOAT);
				//			});
			}
	
			function _castRays() {
				_resultFBO.bind();
				_resultFBO.attachColor(_resultFBO.tex, 0);
	
				_gl.clear(_gl.COLOR_BUFFER_BIT);
				_gl.cullFace(_gl.FRONT);
	
				_resultFBO.tex.bind(0);
				var i = 0;
				for (; i < _numSlices; i++) {
					_volumeTexture[i].bind(i + 1);
				}
				_endFBO.tex.bind(++i);
				_transferFunctionTexture.bind(++i);
	
				_drawVolumeBuffer(_raycastProgram);
	
				_resultFBO.unbind();
	
				_gl.disable(_gl.CULL_FACE);
			}
	
			function _drawVolumeBuffer(program) {
				_gl.viewport(0, 0, _width, _height);
	
				program.bind();
				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
				program.vertexAttribPointer("aVertexColor", 4, _gl.FLOAT);
				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
				program.vertexAttribPointer("aVertexPosition", 3, _gl.FLOAT);
				_gl.drawElements(_gl.TRIANGLES, 36, _gl.UNSIGNED_SHORT, 0);
	
				_gl.viewport(0, 0, _widthView, _heightView);
			}
	
			function _calculateRayEnd() {
				_endFBO.bind();
				_endFBO.attachColor(_endFBO.tex, 0);
				_gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
				_gl.enable(_gl.CULL_FACE);
				_gl.cullFace(_gl.BACK);
	
				_drawVolumeBuffer(_volumeProgram);
	
				_endFBO.unbind();
			}
	
			function _drawToCanvas() {
				_gl.viewport(0, 0, _widthView, _heightView);
	
				_resultFBO.tex.bind(0);
				_resultProgram.bind();
				_resultProgram.drawArrays(_gl.TRIANGLE_STRIP, 0, 4);
	
				_gl.viewport(0, 0, _width, _height);
			}
	
			function _setDefaultTransferColors() {
				_transfer.push(0, new Color(0, 0, 0, 0));
				_transfer.push(0.02, new Color(64, 0, 0, 36));
				_transfer.push(0.06, new Color(255, 0, 0, 107));
				_transfer.push(0.08, new Color(128, 128, 0, 143));
				_transfer.push(0.1, new Color(255, 255, 255, 179));
				_transfer.push(1, new Color(255, 255, 255, 255));
				_transfer.createData();
			}
	
			function _updateTransferFunction() {
				_transferFunctionTexture.bind();
				_transferFunctionTexture.updatePixels(_transfer.data, _gl.RGBA);
				_raycastProgram.bind();
				_gl.uniform1f(_raycastProgram.uniforms.transferMinValue, _transfer.getRangeMin());
				_gl.uniform1f(_raycastProgram.uniforms.transferRangeValue, _transfer.getRangeMax() - _transfer.getRangeMin());
			}
	
			function _updateCamera() {
				_raycastProgram.bind();
				_gl.uniform3f(_raycastProgram.uniforms.viewVector, _camera.pos[0], _camera.pos[1], _camera.pos[2]);
				_gl.uniformMatrix4fv(_raycastProgram.uniforms.uPMatrix, false, _camera.pMatrix);
				_gl.uniformMatrix4fv(_raycastProgram.uniforms.uMVMatrix, false, _camera.mvMatrix);
				_volumeProgram.bind();
				_gl.uniformMatrix4fv(_volumeProgram.uniforms.uPMatrix, false, _camera.pMatrix);
				_gl.uniformMatrix4fv(_volumeProgram.uniforms.uMVMatrix, false, _camera.mvMatrix);
			}
	
			var _gl;
			var _width = 0, _height = 0;
			var _widthView = 0, _heightView = 0;
			var _volume;
			var _slicesLength = [];
			var _numSlices = 0;
			var _volumeTexture = [];
	
			var _resultFBO;
			var _resultTexture;
	
			var _endFBO;
	
			var _raycastProgram;
			var _volumeProgram;
			var _resultProgram;
	
			var _usePhongShading = true;
			var _useAlphaGradient = false;
	
			var _cubeVertexPositionBuffer;
			var _cubeVertexColorBuffer;
	
			var _camera = new Camera(10, 0, 0, -800);
			_camera.addObserver(_updateCamera);
	
			var _light = {
				position: [0.0, -1.0, 0.0],
				directional: true,
				ambient: new Color(0.0, 0.0, 0.0, 0.0),
				diffuse: new Color(1.0, 1.0, 1.0, 0.0),
				specular: new Color(1.0, 1.0, 1.0, 0.0)
			};
	
			var _transfer;
			var _transferFunctionSize = 0;
			var _transferFunctionTexture;
	
			return {
	
				init: function (glContext, width, height, volume) {
					_gl = glContext;
					_width = width; _height = height;
					_widthView = width; _heightView = height;
	
					_gl.viewport(0, 0, _width, _height);
	
					_resultFBO = new FrameBufferObject(_gl);
					_resultFBO.tex = new GLTexture2D(_gl, _width, _height, _gl.RGBA);
					_resultTexture = _resultFBO.tex;
	
					_cubeVertexPositionBuffer = _gl.createBuffer();
					_cubeVertexColorBuffer = _gl.createBuffer();
	
					_endFBO = new FrameBufferObject(_gl);
					_endFBO.createDepthRenderBuffer(_width, _width, _gl.DEPTH_ATTACHMENT);
					_endFBO.tex = new GLTexture2D(_gl, _width, _height, _gl.RGBA);
	
					_resultProgram = _initResultProgram();
					_volumeProgram = _initVolumeProgram();
					this.setVolume(volume);
	
					_gl.enable(_gl.DEPTH_TEST);
					_gl.enable(_gl.BLEND);
				},
	
				setVolume: function (volume) {
					_volume = volume;
	
					var sliceSize = Math.floor(_gl.getParameter(_gl.MAX_TEXTURE_SIZE) / volume._imageWidth);
					sliceSize *= sliceSize;
					var volumeSlices = [];
	
					var i = 0;
					var a = 0;
					while (a + sliceSize < volume._imgContainer.length) {
						volumeSlices[i] = volume.slice(a, a + sliceSize);
						a = a + sliceSize;
						_slicesLength[i] = sliceSize;
						i++;
					}
					volumeSlices[i] = volume.slice(a, volume._imgContainer.length);
					_slicesLength[i] = volume._imgContainer.length - a;
	
					_numSlices = volumeSlices.length;
	
					_volumeTexture.forEach(function (element) { _gl.deleteTexture(element.tex); });
	
					for (i = 0; i < _numSlices; i++) {
						_volumeTexture[i] = new GLTexture2D(_gl, volumeSlices[i]);
					}
	
					_transferFunctionSize = _volume._maxDensity - _volume._minDensity + 1;
	
					if (_transferFunctionTexture)
						_transferFunctionTexture.changeSize(_transferFunctionSize, 1);
					else
						_transferFunctionTexture = new GLTexture2D(_gl, _transferFunctionSize, 1, _gl.RGBA);
	
					if (_raycastProgram)
						_gl.deleteProgram(_raycastProgram.getProgram());
	
					_raycastProgram = _initRaycastProgram();
					_setRaycastProgramVolume();
	
					_initVolumeBuffer();
	
					if (_transfer)
						_transfer.setRange(_volume._minDensity, _volume._maxDensity);
					else {
						_transfer = new TransferFunction(_volume._minDensity, _volume._maxDensity);
						_transfer.addObserver(_updateTransferFunction);
						_setDefaultTransferColors();
					}
	
					_updateTransferFunction();
					_updateCamera();
				},
	
				draw: function () {
					_gl.clearColor(0.0, 0.0, 0.0, 0.0);
	
					_calculateRayEnd();
					_castRays();
					_drawToCanvas();
				},
	
				changeRes: function (width, height) {
					_width = width; _height = height;
	
					_gl.viewport(0, 0, _width, _height);
	
					_resultFBO.tex.changeSize(width, height);
	
					_endFBO.changeRenderBufferSize(_width, _width, _gl.DEPTH_ATTACHMENT);
					_endFBO.tex.changeSize(width, height);
	
					_raycastProgram.bind();
					_gl.uniform2f(_raycastProgram.uniforms.textureSize, _width, _height);
				},
	
				changeResultTexture: function () {
					if (_resultTexture == _resultFBO.tex) {
						_resultTexture = _endFBO.tex;
						return;
					}
					_resultTexture = _resultFBO.tex;
				},
	
				loadTransferBuffer: function (transferBuffer) {
					var dataView = new DataView(transferBuffer.buffer);
					var transfer = new TransferFunction(_volume._minDensity, _volume._maxDensity);
	
					var nStops = transferBuffer[0];
	
					for (var i = 0; i < nStops; i++) {
						var position = (dataView.getFloat32(8 * i + 1) - transfer._min) / (transfer._max - transfer._min);
						var color = new Color(transferBuffer[8 * i + 5], transferBuffer[8 * i + 6], transferBuffer[8 * i + 7], transferBuffer[8 * i + 8]);
						transfer.push(position, color);
					}
	
					transfer.addObserver(_updateTransferFunction);
					_transfer = transfer;
	
					_updateTransferFunction();
				},
	
				setTransfer: function (transfer) {
					transfer.setRange(_volume._minDensity, _volume._maxDensity);
					transfer.addObserver(_updateTransferFunction);
					_transfer = transfer;
	
					_updateTransferFunction();
				},
	
				restartProgram: function (usePhongShading, useAlphaGradient) {
					_usePhongShading = usePhongShading;
					_useAlphaGradient = useAlphaGradient;
	
					_raycastProgram = _initRaycastProgram();
					_setRaycastProgramVolume();
	
					_raycastProgram.bind();
					_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
					_raycastProgram.vertexAttribPointer("aVertexColor", 4, _gl.FLOAT);
					_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
					_raycastProgram.vertexAttribPointer("aVertexPosition", 3, _gl.FLOAT);
	
					_gl.uniform1f(_raycastProgram.uniforms.transferMinValue, _transfer.getRangeMin());
					_gl.uniform1f(_raycastProgram.uniforms.transferRangeValue, _transfer.getRangeMax() - _transfer.getRangeMin());
					_gl.uniform3f(_raycastProgram.uniforms.viewVector, _camera.pos[0], _camera.pos[1], _camera.pos[2]);
					_gl.uniformMatrix4fv(_raycastProgram.uniforms.uPMatrix, false, _camera.pMatrix);
					_gl.uniformMatrix4fv(_raycastProgram.uniforms.uMVMatrix, false, _camera.mvMatrix);
				},
	
				changeLightDirection: function (index, value) {
					_light.position[index] = value;
					_raycastProgram.bind();
					_gl.uniform3f(_raycastProgram.uniforms.lightDirection, _light.position[0], _light.position[1], _light.position[2]);
				},
	
				observedUpdate: function () {
					_updateTransferFunction();
				},
	
				get_resultTexture: function () {
					return _resultTexture;
				},
	
				get_transfer: function () {
					return _transfer;
				},
	
				get_camera: function () {
					return _camera;
				},
	
				toJSON: function () {
					return {
						//'gl': gl,
						'width': _width,
						'height': _height,
						'camera': _camera,
						'transfer': _transfer,
						'volumeProgram': _volumeProgram,
						'endFBO': _endFBO
					};
				}
			};
		}));
})();