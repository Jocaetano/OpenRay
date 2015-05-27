/// <reference path="../typings/jquery/jquery.d.ts"/>
/* global app */

function Controller(app) {
	this.app = app;

	this.translateX = 0.0;
	this.translateY = 0.0;
	this.zoom = 10;
	this.objectRotationMatrix = mat4.create();
	this.mouseButton = 0;

	this.lastMouseX = 0.0;
	this.lastMouseY = 0.0;

	$("a").click(function () {
		$(".tabbed_content").show();
	});

	$(".tabbed_content").mouseleave(function () {
		$(".tabbed_content").fadeOut('slow');
	});

	$("#resetCamButton").click(this.resetCamera.bind(this));

	this.modified = this.modified.bind(this);

	var canvas = $("#raywebgl");
	canvas.mousewheel(this.mouseWheelHandler.bind(this));
	canvas.mousedown(this.mouseDownHandler.bind(this));
	$(document).mouseup(this.mouseUpHandler.bind(this));

	$("#dicomFiles").change(this.loadDicom.bind(this));
	$("#rawFile").change(this.loadRAW.bind(this));

	$("img#close").click(this.hideRawFileForm);

	var slider = document.getElementById('lightX');
	slider.addEventListener('input', this.updateSlider.bind(this, 0, slider), false);

	slider = document.getElementById('lightY');
	slider.addEventListener('input', this.updateSlider.bind(this, 1, slider), false);

	slider = document.getElementById('lightZ');
	slider.addEventListener('input', this.updateSlider.bind(this, 2, slider), false);

	$(document).keyup(function (event) {
		switch (event.keyCode) {
			case 81: // Q
				this.app.raycaster.changeRes(512, 512);
				break;
			case 87: // W
				this.app.raycaster.changeRes(1024, 1024);
				break;
			case 69: // E
				this.app.raycaster.changeRes(2048, 2048);
				break;
			case 82: // R
				this.app.raycaster.changeRes(4096, 4096);
				break;
			case 48: // 0
				this.resetCamera();
				break;
			case 65: // A
				$("#dicomFiles").click();
				break;
			case 90: // Z
				this.showRawFileForm();
				break;
			case 84: // T
				$("#loadButton").click();
				break;
			case 49: // 1
				this.app.raycaster.changeResultTexture();
				break;
		}
		this.modified();
	}.bind(this));

	$("#dicomButton").click(function () {
		$("#dicomFiles").click(); this.modified();
	}.bind(this));

	$("#rawButton").click(this.showRawFileForm);
	$('#submitRaw').click(function () {
		$("#rawFile").click(); this.modified();
	}.bind(this));

	$("#saveButton").click(this.saveTransfer.bind(this));
	$("#loadButton").change(this.loadTransfer.bind(this));

	var phongCheckBox = document.getElementById('usePhong');
	var alphaGradientCheckBox = document.getElementById('useAlphaGradient');
	this.updateCheckBox = this.updateCheckBox.bind(this, phongCheckBox, alphaGradientCheckBox);
	phongCheckBox.addEventListener('change', this.updateCheckBox, false);
	alphaGradientCheckBox.addEventListener('change', this.updateCheckBox, false);
}

Controller.prototype.modified = function () {
	this.app.modified = true;
};

Controller.prototype.updateCheckBox = function (phongCheckBox, alphaGradientCheckBox) {
	this.app.raycaster.restartProgram(phongCheckBox.checked, alphaGradientCheckBox.checked);
	this.modified();
};

Controller.prototype.resetCamera = function () {
	this.translateX = 0.0;
	this.translateY = 0.0;
	this.zoom = 10;
	mat4.identity(this.objectRotationMatrix);
	this.app.raycaster.moveCamera(this.translateX, this.translateY, this.zoom);
	this.app.raycaster.rotateCamera(this.objectRotationMatrix);

	this.modified();
};

Controller.prototype.updateSlider = function (index, slider) {
	this.app.raycaster.changeLightDirection(index, slider.value);
	this.modified();
};

Controller.prototype.saveTransfer = function (event) {
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

	window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function (fs) {
		fs.root.getFile('transfer.trf', { create: true }, function (fileEntry) {
			fileEntry.createWriter(function (fileWriter) {
				var blob = new Blob([this.app.raycaster.get_transfer().serialize()]);

				fileWriter.addEventListener("writeend", function () {
					// navigate to file, will download
					location.href = fileEntry.toURL();
				}, false);

				fileWriter.write(blob);
			}, function () { });
		}, function () { });
	}, function () { });
};

Controller.prototype.loadTransfer = function (event) {
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
			this.app.raycaster.loadTransferBuffer(uint8Array);
			this.gradientEditor.setTransfer(this.app.raycaster.get_transfer());
		}
	};

	var blob = file.slice(0, file.size);
	reader.readAsArrayBuffer(blob);
};

Controller.prototype.mouseUpHandler = function (event) {
	$(document).off("mousemove");
};

Controller.prototype.mouseDownHandler = function (event) {
	this.canvasMouseDown = true;
	this.lastMouseX = event.clientX;
	this.lastMouseY = event.clientY;
	this.mouseButton = event.button;
	$(document).mousemove(this.handleMouseMove.bind(this));
};

Controller.prototype.handleMouseMove = function (event) {
	var newX = event.clientX;
	var newY = event.clientY;
	var deltaX = newX - this.lastMouseX;
	var deltaY = newY - this.lastMouseY;
	if (this.mouseButton == 2)
		this.camera.rotate(deltaX, deltaY);
	else if (this.mouseButton == 1)
		this.camera.translate(deltaX, deltaY);
	this.lastMouseX = newX;
	this.lastMouseY = newY;
	this.modified();

	return;
};

Controller.prototype.mouseWheelHandler = function (event) {
	var evt = window.event || event;//equalize event object
	var delta = evt.detail ? evt.detail * (-1) : evt.wheelDelta;

	this.camera.changeZoom(delta);

	this.modified();

	if (evt.preventDefault) //disable default wheel action of scrolling page
		evt.preventDefault();
	else
		return false;
};

Controller.prototype.loadDicom = function (event) {
	require(['volume_factory'], function (VolumeFactory) {
		if (event.target.files.length < 2) {
			console.log('Need 2 or more images');
			return;
		}

		var totalSize = event.target.files.length;
		var imageFiles = [];

		var onloadF = function (evt) {
			imageFiles.push(evt.target.result);
			if (totalSize <= imageFiles.length) {
				VolumeFactory.createDicomVolume(imageFiles, this.setVolume.bind(this));
			}
		};

		for (var i = 0, ii = event.target.files.length; i < ii; i++) {
			var reader = new FileReader();
			reader.onload = onloadF.bind(this);
			reader.readAsArrayBuffer(event.target.files[i]);
		}


		this.modified();
	}.bind(this));
};

Controller.prototype.loadRAW = function (event) {
	require(['volume_factory'], function (VolumeFactory) {
		var pixelSpacing = { x: parseFloat($("#psX").val()), y: parseFloat($("#psY").val()), z: parseFloat($("#psZ").val()) };
		var volumeSize = { width: +$("#width").val(), height: +$("#height").val(), nslices: +$("#nslices").val() };
		var bits = +$('input[name=bits]:checked', '#rawFileForm').val();

		var reader = new FileReader();
		reader.onload = function (evt) {
			this.setVolume(VolumeFactory.createVolumefromRaw(evt.target.result, bits, volumeSize, pixelSpacing));
		}.bind(this);
		reader.readAsArrayBuffer(event.target.files[0]);

		this.hideRawFileForm();
		this.modified();
	}.bind(this));
};

Controller.prototype.setVolume = function (volume) {
	this.app.setVolume(volume);
	if (this.gradientEditor)
		this.updateTransferGradient(this.app.raycaster.get_transfer());
	else
		this.createGradient(this.app.raycaster.get_transfer());
	if (!this.camera)
		this.camera = this.app.raycaster.get_camera();
};

//Show rawFile popup
Controller.prototype.showRawFileForm = function () {
	$("#rawFileForm").css("display", "block");
};

//Hide rawFile popup
Controller.prototype.hideRawFileForm = function () {
	$("#rawFileForm").css("display", "none");
};

Controller.prototype.createGradient = function (transfer) {
	this.gradientEditor = new GradientEditor(transfer, this.modified);
	this.modified();
};

Controller.prototype.updateTransferGradient = function (transfer) {
	this.gradientEditor.update();
	this.modified();
};
