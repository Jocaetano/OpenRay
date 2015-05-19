define(['gpuProgram', 'fbo', 'glTexture2d', 'color', 'transferFunciton', 'glMatrix'],
	function (GpuProgram, FrameBufferObject, GLTexture2D, Color, TransferFunction, glm) {
		'use strict';
	
		//private	
		function _initVolumeProgram() {
			var volumeProgram = new GpuProgram();

			volumeProgram.loadVertexShader('../shaders/shader.vert');
			volumeProgram.loadFragmentShader('../shaders/shader.frag');
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
		}

		function _initRaycastProgram() {
			var raycastProgram = new GpuProgram();

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

			gl.uniform2f(raycastProgram.textureSize, _width, _height);

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
			_raycastProgram.uVolumeTexture = [];
			_raycastProgram.numberOfSlicesT = [];
			_raycastProgram.uVolumeTexture[0] = _raycastProgram.addUniform("volumeTexture" + (1));
			gl.uniform1i(_raycastProgram.uVolumeTexture[0], 1);

			var i = 1;
			for (; i < _numSlices; i++) {
				_raycastProgram.uVolumeTexture[i] = _raycastProgram.addUniform("volumeTexture" + (i + 1));
				gl.uniform1i(_raycastProgram.uVolumeTexture[i], i + 1);
			}

			gl.uniform1i(_raycastProgram.uRaysEndTexture, ++i);
			gl.uniform1i(_raycastProgram.uTransferFunctionTexture, ++i);
			gl.uniform3f(_raycastProgram.volumeSize, box.width(), box.depth(), box.height());
			gl.uniform1f(_raycastProgram.numberOfSlices, _volume._imgContainer.length);
			gl.uniform1f(_raycastProgram.samplingStep, samplingStep);
			gl.uniform1f(_raycastProgram.volumeSpacing, smallerSpacing);
			gl.uniform1f(_raycastProgram.dicomSize, _volume._imageWidth);
		}

		function initVolumeBuffer() {

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

			gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

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

			gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

			var cubeVertexIndices = [
				2, 0, 4, 2, 4, 6,	// Left face
				1, 0, 2, 1, 2, 3,	// Bottom face
				0, 5, 4, 0, 1, 5,	// Front face
				2, 6, 7, 2, 7, 3,	// Back face
				1, 7, 5, 1, 3, 7,	// Right face
				4, 7, 6, 4, 5, 7	// Top face
			];

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _cubeVertexIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
		}

		function _castRays() {
			_resultFBO.bind();
			_resultFBO.attachColor(_resultFBO.tex, 0);

			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.cullFace(gl.FRONT);

			_resultFBO.tex.bind(0);
			var i = 0;
			for (; i < _numSlices; i++) {
				_volumeTexture[i].bind(i + 1);
			}
			_endFBO.tex.bind(++i);
			_transferFunctionTexture.bind(++i);

			var cam = glm.vec3.fromValues(0.0, 0.0, 1.0);
			glm.vec3.add(cam, cam, glm.vec3.fromValues(_translateX, _translateY, -800.0));
			glm.vec3.transformMat4(cam, cam, _objectRotationMatrix);
			glm.vec3.normalize(cam, cam);

			_raycastProgram.bind();
			gl.uniform3f(_raycastProgram.viewVector, cam[0], cam[1], cam[2]);
			gl.uniform3f(_raycastProgram.lightDirection, _light.position[0], _light.position[1], _light.position[2]);
			gl.uniform3f(_raycastProgram.lightAmbientColor, _light.ambient.r, _light.ambient.g, _light.ambient.b);
			gl.uniform3f(_raycastProgram.lightDiffuseColor, _light.diffuse.r, _light.diffuse.g, _light.diffuse.b);
			gl.uniform3f(_raycastProgram.lightSpecularColor, _light.specular.r, _light.specular.g, _light.specular.b);
			gl.uniform1f(_raycastProgram.lightShininess, 32.0);

			gl.uniformMatrix4fv(_raycastProgram.rotMatrixUniform, false, _objectRotationMatrix);

			_drawVolumeBuffer(_raycastProgram);

			_resultFBO.unbind();
		}

		function _drawVolumeBuffer(program) {
			gl.viewport(0, 0, _width, _height);
			glm.mat4.frustum(_pMatrix, -10 * _zoom, 10 * _zoom, -10 * _zoom, 10 * _zoom, 200, 2500.0);

			program.bind();
			gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
			gl.vertexAttribPointer(program.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
			gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
			gl.uniformMatrix4fv(program.pMatrixUniform, false, _pMatrix);
			gl.uniformMatrix4fv(program.mvMatrixUniform, false, _mvMatrix);
			gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

			gl.viewport(0, 0, _widthView, _heightView);
		}

		function _calculateRayEnd() {
			_endFBO.bind();
			_endFBO.attachColor(_endFBO.tex, 0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.BACK);

			_drawVolumeBuffer(_volumeProgram);

			_endFBO.unbind();
		}

		function _setDefaultTransferColors() {
			_transfer.push(0, new Color(0, 0, 0, 0));
			_transfer.push(0.02, new Color(64, 0, 0, 36));
			_transfer.push(0.06, new Color(255, 0, 0, 107));
			_transfer.push(0.08, new Color(128, 128, 0, 143));
			_transfer.push(0.1, new Color(255, 255, 255, 179));
			_transfer.push(1, new Color(255, 255, 255, 255));
		}

		function _updateTransferFunctionTexture() {
			var dataBuffer = new ArrayBuffer(_transferFunctionSize * 4);
			var data = new Uint8Array(dataBuffer);
			var data32 = new Uint32Array(dataBuffer);
			for (var i = 0; i < _transferFunctionSize; i++) {
				var position = i / (_transferFunctionSize - 1);
				data32[i] = _transfer.getColorAt(position);
			}

			_transferFunctionTexture.bind();
			_transferFunctionTexture.updatePixels(data, gl.RGBA);
			_raycastProgram.bind();
			gl.uniform1f(_raycastProgram.transferMinValue, _transfer.getRangeMin());
			gl.uniform1f(_raycastProgram.transferRangeValue, _transfer.getRangeMax() - _transfer.getRangeMin());
		}

		var _width = 0, _height = 0;
		var _widthView = 0, _heightView = 0;
		var _volume;
		var _slicesLength = [];
		var _numSlices = 0;
		var _volumeTexture = [];

		var _resultFBO = new FrameBufferObject();
		var _resultTexture;

		var _endFBO = new FrameBufferObject();

		var _raycastProgram;
		var _volumeProgram = _initVolumeProgram();

		var _usePhongShading = true;
		var _useAlphaGradient = false;

		var _cubeVertexPositionBuffer = gl.createBuffer();
		var _cubeVertexColorBuffer = gl.createBuffer();
		var _cubeVertexIndexBuffer = gl.createBuffer();

		var _translateX = 0.0;
		var _translateY = 0.0;
		var _zoom = 10;
		var _objectRotationMatrix = glm.mat4.create();

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

		var _mvMatrix = glm.mat4.create();
		var _pMatrix = glm.mat4.create();

		return {

			init: function (width, height, volume) {
				_width = width; _height = height;
				_widthView = width; _heightView = height;

				_resultFBO.tex = new GLTexture2D(_width, _height, gl.RGBA);
				_resultTexture = _resultFBO.tex;

				_endFBO.createDepthRenderBuffer(_width, _width, gl.DEPTH_ATTACHMENT);
				_endFBO.tex = new GLTexture2D(_width, _height, gl.RGBA);

				this.setVolume(volume);

				gl.enable(gl.DEPTH_TEST);
				gl.enable(gl.BLEND);
			},

			setVolume: function (volume) {
				_volume = volume;

				var sliceSize = Math.floor(gl.getParameter(gl.MAX_TEXTURE_SIZE) / volume._imageWidth);
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

				_volumeTexture.forEach(function (element) { gl.deleteTexture(element.tex); });

				for (i = 0; i < _numSlices; i++) {
					_volumeTexture[i] = new GLTexture2D(volumeSlices[i]);
				}

				_transferFunctionSize = _volume._maxDensity - _volume._minDensity + 1;

				if (_transferFunctionTexture)
					_transferFunctionTexture.changeSize(_transferFunctionSize, 1);
				else
					_transferFunctionTexture = new GLTexture2D(_transferFunctionSize, 1, gl.RGBA);

				initVolumeBuffer();

				if (_raycastProgram)
					gl.deleteProgram(_raycastProgram.getProgram());

				_raycastProgram = _initRaycastProgram();
				_setRaycastProgramVolume();

				if (_transfer)
					_transfer.setRange(_volume._minDensity, _volume._maxDensity);
				else {
					_transfer = new TransferFunction(_volume._minDensity, _volume._maxDensity);
					_transfer.addObserver(this);
					_setDefaultTransferColors();
				}

				_updateTransferFunctionTexture();
			},

			draw: function () {
				gl.clearColor(0.0, 0.0, 0.0, 0.0);

				glm.mat4.identity(_mvMatrix);
				glm.mat4.translate(_mvMatrix, _mvMatrix, [_translateX, _translateY, -800.0]);
				glm.mat4.multiply(_mvMatrix, _mvMatrix, _objectRotationMatrix);

				_calculateRayEnd();
				_castRays();
			},

			changeRes: function (width, height) {
				_width = width; _height = height;

				_resultFBO.tex.changeSize(width, height);

				_endFBO.changeRenderBufferSize(_width, _width, gl.DEPTH_ATTACHMENT);
				_endFBO.tex.changeSize(width, height);

				_raycastProgram.bind();
				gl.uniform2f(_raycastProgram.textureSize, _width, _height);
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

				transfer.addObserver(this);
				_transfer = transfer;

				_updateTransferFunctionTexture();
			},

			setTransfer: function (transfer) {
				transfer.setRange(_volume._minDensity, _volume._maxDensity);
				transfer.addObserver(this);
				_transfer = transfer;

				_updateTransferFunctionTexture();
			},

			restartProgram: function (usePhongShading, useAlphaGradient) {
				_usePhongShading = usePhongShading;
				_useAlphaGradient = useAlphaGradient;

				this.setVolume(_volume);
			},

			changeLightDirection: function (index, value) {
				_light.position[index] = value;
			},

			moveCamera: function (translateX, translateY, zoom) {
				_translateX = translateX;
				_translateY = translateY;
				_zoom = zoom;
			},

			rotateCamera: function (objectRotationMatrix) {
				_objectRotationMatrix = objectRotationMatrix;
			},

			observedUpdate: function () {
				_updateTransferFunctionTexture();
			},

			get_resultTexture: function () {
				return _resultTexture;
			},

			get_transfer: function () {
				return _transfer;
			},

			toJSON: function () {
				return {
					//'gl': gl,
					'width': _width,
					'height': _height,
					'translateX': _translateX,
					'translateY': _translateY,
					'zoom': _zoom,
					'objectRotationMatrix': _objectRotationMatrix,
					'transfer': _transfer,
					'volumeProgram': _volumeProgram,
					'endFBO': _endFBO
				};
			}
		};
	});