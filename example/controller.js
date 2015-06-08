/// <reference path="../typings/jquery/jquery.d.ts"/>

define(['volume_factory', 'gradientEditor', 'app'], function (VolumeFactory, GradientEditor, app) {
	'use strict';
	
	//private
	var _lastMouseX = 0.0;
	var _lastMouseY = 0.0;
	var _mouseButton;

	var _camera;
	var _gradientEditor;

	function _modified() {
		app.modified = true;
	};

	function _updateCheckBox(phongCheckBox, alphaGradientCheckBox) {
		app.raycaster.restartProgram(phongCheckBox.checked, alphaGradientCheckBox.checked);
		_modified();
	};

	function _resetCamera() {
		_camera.reset();
		_modified();
	};

	function _updateSlider(index, slider) {
		app.raycaster.changeLightDirection(index, slider.value);
		_modified();
	};

	function _saveTransfer(event) {
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

		window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function (fs) {
			fs.root.getFile('transfer.trf', { create: true }, function (fileEntry) {
				fileEntry.createWriter(function (fileWriter) {
					var blob = new Blob([app.raycaster.get_transfer().serialize()]);

					fileWriter.addEventListener("writeend", function () {
						// navigate to file, will download
						location.href = fileEntry.toURL();
					}, false);

					fileWriter.write(blob);
				}, function () { });
			}, function () { });
		}, function () { });
	};

	function _loadTransfer(event) {
		var files = event.target.files;
		if (!files.length) {
			alert('Please select a file!');
			return;
		}

		var file = files[0];
		var reader = new FileReader();
		reader.onloadend = function (evt) {
			if (evt.target.readyState == FileReader.DONE) {
				var uint8Array = new Uint8Array(evt.target.result);
				app.raycaster.loadTransferBuffer(uint8Array);
				_gradientEditor.setTransfer(app.raycaster.get_transfer());
			}
		};

		var blob = file.slice(0, file.size);
		reader.readAsArrayBuffer(blob);
	};

	function _mouseUpHandler(event) {
		$(document).off("mousemove");
	};

	function _mouseDownHandler(event) {
		_lastMouseX = event.clientX;
		_lastMouseY = event.clientY;
		_mouseButton = event.button;
		$(document).mousemove(_handleMouseMove);
	};

	function _handleMouseMove(event) {
		var newX = event.clientX;
		var newY = event.clientY;
		var deltaX = newX - _lastMouseX;
		var deltaY = newY - _lastMouseY;
		if (_mouseButton == 2)
			_camera.rotate(deltaX, deltaY);
		else if (_mouseButton == 1)
			_camera.translate(deltaX, deltaY);
		_lastMouseX = newX;
		_lastMouseY = newY;
		_modified();

		return;
	};

	function _mouseWheelHandler(event) {
		var evt = window.event || event;//equalize event object
		var delta = evt.detail ? evt.detail * (-1) : evt.wheelDelta;

		_camera.changeZoom(delta);

		_modified();

		if (evt.preventDefault) //disable default wheel action of scrolling page
			evt.preventDefault();
		else
			return false;
	};

	function _loadDicom(event) {
		if (event.target.files.length < 2) {
			console.log('Need 2 or more images');
			return;
		}

		var totalSize = event.target.files.length;
		var imageFiles = [];

		var onloadF = function (evt) {
			imageFiles.push(evt.target.result);
			if (totalSize <= imageFiles.length) {
				VolumeFactory.createDicomVolume(imageFiles, _setVolume);
			}
		};

		for (var i = 0, ii = event.target.files.length; i < ii; i++) {
			var reader = new FileReader();
			reader.onload = onloadF;
			reader.readAsArrayBuffer(event.target.files[i]);
		}

		_modified();
	};

	function _loadRAW(event) {
		var pixelSpacing = { x: parseFloat($("#psX").val()), y: parseFloat($("#psY").val()), z: parseFloat($("#psZ").val()) };
		var volumeSize = { width: +$("#width").val(), height: +$("#height").val(), nslices: +$("#nslices").val() };
		var bits = +$('input[name=bits]:checked', '#rawFileForm').val();

		var reader = new FileReader();
		reader.onload = function (evt) {
			_setVolume(VolumeFactory.createVolumefromRaw(evt.target.result, bits, volumeSize, pixelSpacing));
		};
		reader.readAsArrayBuffer(event.target.files[0]);

		_hideRawFileForm();
		_modified();
	};

	function _setVolume(volume) {
		app.setVolume(volume);
		if (_gradientEditor)
			_updateTransferGradient(app.raycaster.get_transfer());
		else
			_createGradient(app.raycaster.get_transfer());
		if (!_camera)
			_camera = app.raycaster.get_camera();
	};

	function _showRawFileForm() {
		$("#rawFileForm").css("display", "block");
	};

	function _hideRawFileForm() {
		$("#rawFileForm").css("display", "none");
	};

	function _createGradient(transfer) {
		_gradientEditor = new GradientEditor(transfer, _modified);
		_modified();
	};

	function _updateTransferGradient(transfer) {
		_gradientEditor.update();
		_modified();
	};

	return {
		init: function () {
			$("a").click(function () {
				$(".tabbed_content").show();
			});

			$(".tabbed_content").mouseleave(function () {
				$(".tabbed_content").stop(true, true).fadeOut('slow');
			});

			$(".tabbed_content").mouseenter(function () {
				$(".tabbed_content").stop(true, true).fadeIn(100);
			});

			$("#resetCamButton").click(_resetCamera);

			var canvas = $("#raywebgl");
			canvas.mousewheel(_mouseWheelHandler);
			canvas.mousedown(_mouseDownHandler);
			$(document).mouseup(_mouseUpHandler);

			$("#dicomFiles").change(_loadDicom);
			$("#rawFile").change(_loadRAW);

			$("img#close").click(_hideRawFileForm);

			var slider = document.getElementById('lightX');
			slider.addEventListener('input', _updateSlider.bind(this, 0, slider), false);

			slider = document.getElementById('lightY');
			slider.addEventListener('input', _updateSlider.bind(this, 1, slider), false);

			slider = document.getElementById('lightZ');
			slider.addEventListener('input', _updateSlider.bind(this, 2, slider), false);

			$(document).keyup(function (event) {
				switch (event.keyCode) {
					case 81: // Q
						app.raycaster.changeRes(512, 512);
						break;
					case 87: // W
						app.raycaster.changeRes(1024, 1024);
						break;
					case 69: // E
						app.raycaster.changeRes(2048, 2048);
						break;
					case 82: // R
						app.raycaster.changeRes(4096, 4096);
						break;
					case 48: // 0
						_resetCamera();
						break;
					case 65: // A
						$("#dicomFiles").click();
						break;
					case 90: // Z
						_showRawFileForm();
						break;
					case 84: // T
						$("#loadButton").click();
						break;
					case 49: // 1
						app.raycaster.changeResultTexture();
						break;
				}
				_modified();
			});

			$("#dicomButton").click(function () {
				$("#dicomFiles").click(); _modified();
			});

			$("#rawButton").click(_showRawFileForm);
			$('#submitRaw').click(function () {
				$("#rawFile").click(); _modified();
			});

			$("#saveButton").click(_saveTransfer);
			$("#loadButton").change(_loadTransfer);

			var phongCheckBox = document.getElementById('usePhong');
			var alphaGradientCheckBox = document.getElementById('useAlphaGradient');
			_updateCheckBox = _updateCheckBox.bind(this, phongCheckBox, alphaGradientCheckBox);
			phongCheckBox.addEventListener('change', _updateCheckBox, false);
			alphaGradientCheckBox.addEventListener('change', _updateCheckBox, false);
		}
	};
});


