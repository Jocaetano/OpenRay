define(['glProgram', 'fbo', 'glTexture2d', 'color', 'transferFunciton', 'camera'],
	function (GLProgram, FrameBufferObject, GLTexture2D, Color, TransferFunction, Camera) {
		'use strict';
	
		//private	
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

			[_raycastProgram, _volumeProgram].forEach(function (program) {
				program.bind();
				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexColorBuffer);
				program.vertexAttribPointer("aVertexColor", 4, _gl.FLOAT);
				_gl.bindBuffer(_gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
				program.vertexAttribPointer("aVertexPosition", 3, _gl.FLOAT);
			});
		}

		function _castRays() {
			_gl.clear(_gl.COLOR_BUFFER_BIT);
			_gl.cullFace(_gl.FRONT);

			var i = 0;
			for (; i < _numSlices; i++) {
				_volumeTexture[i].bind(i + 1);
			}
			_endFBO.tex.bind(++i);
			_transferFunctionTexture.bind(++i);

			_drawVolumeBuffer(_raycastProgram);
		}

		function _drawVolumeBuffer(program) {
			//			_gl.viewport(0, 0, _width, _height);

			program.bind();
			_gl.drawElements(_gl.TRIANGLES, 36, _gl.UNSIGNED_SHORT, 0);

			//			_gl.viewport(0, 0, _widthView, _heightView);
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

		var _resultTexture;

		var _endFBO;

		var _raycastProgram;
		var _volumeProgram;

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

				_cubeVertexPositionBuffer = _gl.createBuffer();
				_cubeVertexColorBuffer = _gl.createBuffer();

				_endFBO = new FrameBufferObject(_gl);
				_endFBO.createDepthRenderBuffer(_width, _width, _gl.DEPTH_ATTACHMENT);
				_endFBO.tex = new GLTexture2D(_gl, _width, _height, _gl.RGBA);

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

				_gl.disable(_gl.CULL_FACE);
			},

			changeRes: function (width, height) {
				_width = width; _height = height;

				_gl.viewport(0, 0, _width, _height);

				_endFBO.changeRenderBufferSize(_width, _width, _gl.DEPTH_ATTACHMENT);
				_endFBO.tex.changeSize(width, height);

				_raycastProgram.bind();
				_gl.uniform2f(_raycastProgram.uniforms.textureSize, _width, _height);
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
	});