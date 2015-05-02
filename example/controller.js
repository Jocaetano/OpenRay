/// <reference path="../typings/jquery/jquery.d.ts"/>
/* global GradientEditor */
/* global VolumeFactory */
/* global ImageFactory */
/* global mat4 */
/* global app */

function Controller() {
	var self = this;
	
	this.translateX = 0.0;
	this.translateY = 0.0;
	this.zoom = 10;
	this.objectRotationMatrix = mat4.create();
	
	this.lastMouseX = 0.0;
	this.lastMouseY = 0.0;

	$("a").click(function () {
		$(".tabbed_content").show();
	});

	$(".tabbed_content").mouseleave(function() {
		$(".tabbed_content").fadeOut('slow');;
	});

	this.resetCamera = this.resetCamera(this);
	$("#resetCamButton").click(this.resetCamera);

	this.handleMouseMove = this.handleMouseMove(this);

	this.mouseWheelHandler = this.mouseWheelHandler(this);

	var canvas = $("#raywebgl");
	canvas.mousewheel(this.mouseWheelHandler);

	this.mouseDownHandler = this.mouseDownHandler(this);
	canvas.mousedown(this.mouseDownHandler);

	this.mouseUpHandler = this.mouseUpHandler(this);
	$(document).mouseup(this.mouseUpHandler);

	this.loadDicom = this.loadDicom(this);
	$("#dicomFiles").change(this.loadDicom);

	this.loadRAW = this.loadRAW(this);
	$("#rawFile").change(this.loadRAW);

	var slider = document.getElementById('lightX');
	this.updateSliderX = this.updateSlider(0, slider, this);
	slider.addEventListener('input', this.updateSliderX, false);

	slider = document.getElementById('lightY');
	this.updateSliderY = this.updateSlider(1, slider, this);
	slider.addEventListener('input', this.updateSliderY, false);

	slider = document.getElementById('lightZ');
	this.updateSliderZ = this.updateSlider(2, slider, this);
	slider.addEventListener('input', this.updateSliderZ, false);

	$(document).keyup(function(event) {
		switch(event.keyCode) {
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
				self.resetCamera();
				break;
			case 65: // A
				$("#dicomFiles").click();
				break;
			case 90: // Z
				self.showRawFileForm();
				break;
			case 84: // T
				$("#loadButton").click();
				break;
			case 49: // 1
				app.raycaster.changeResultTexture();
				break;
		}
		self.modified = true;
	});

	$("#dicomButton").click(function() {
		$("#dicomFiles").click(); self.modified = true;
	});

	$("#rawButton").click(this.showRawFileForm);
	$('#submitRaw').click(function() {
		$("#rawFile").click(); self.modified = true;
	});

	this.saveTransfer = this.saveTransfer(this);
	$("#saveButton").click(this.saveTransfer);

	this.loadTransfer = this.loadTransfer(this);
	$("#loadButton").change(this.loadTransfer);

	var phongCheckBox = document.getElementById('usePhong');
	var alphaGradientCheckBox = document.getElementById('useAlphaGradient');
	this.updateCheckBox = this.updateCheckBox(phongCheckBox, alphaGradientCheckBox, this);
	phongCheckBox.addEventListener('change', this.updateCheckBox, false);
	alphaGradientCheckBox.addEventListener('change', this.updateCheckBox, false);
}

Controller.prototype.updateCheckBox = function(phongCheckBox, alphaGradientCheckBox, selfController) {
	return function(event) {
		app.raycaster.restartProgram(phongCheckBox.checked, alphaGradientCheckBox.checked);
		selfController.modified = true;
	};
};

Controller.prototype.resetCamera = function(selfController) {
	return function() {
		selfController.translateX = 0.0;
		selfController.translateY = 0.0;
		selfController.zoom = 10;
		mat4.identity(selfController.objectRotationMatrix);
		app.raycaster.moveCamera(selfController.translateX, selfController.translateY, selfController.zoom);
		app.raycaster.rotateCamera(selfController.objectRotationMatrix);

		selfController.modified = true;
	};
};

Controller.prototype.updateSlider = function(index, slider, selfController) {
	return function() {
		app.raycaster.changeLightDirection(index, slider.value);
		selfController.modified = true;
	};
};

Controller.prototype.saveTransfer = function(selfController) {
	return function(event) {
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

		window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function(fs) {
			fs.root.getFile('transfer.trf', { create: true }, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					var blob = new Blob([app.raycaster.get_transfer().serialize()]);

					fileWriter.addEventListener("writeend", function() {
						// navigate to file, will download
						location.href = fileEntry.toURL();
					}, false);

					fileWriter.write(blob);
				}, function() {});
			}, function() {});
		}, function() {});
	};
};

Controller.prototype.loadTransfer = function(selfController) {
	return function (event) {
		var files = event.target.files;
		if (!files.length) {
			alert('Please select a file!');
			return;
		}

		var file = files[0];
		var reader = new FileReader();
		reader.onloadend = function(evt) {
			if (evt.target.readyState == FileReader.DONE) {
				var uint8Array = new Uint8Array(evt.target.result);
				app.raycaster.loadTransferBuffer(uint8Array);
				selfController.gradientEditor.setTransfer(app.raycaster.get_transfer());
			}
		};

		var blob = file.slice(0, file.size);
		reader.readAsArrayBuffer(blob);
	};
};

Controller.prototype.mouseUpHandler = function(selfController) {
	return function (event) {
		selfController.canvasMouseDown = false;
		selfController.stopMouseDown = false;
		$(document).off("mousemove", selfController.handleMouseMove);
	};
};

Controller.prototype.mouseDownHandler = function(selfController) {
	return function (event) {
		selfController.canvasMouseDown = true;
		selfController.lastMouseX = event.clientX;
		selfController.lastMouseY = event.clientY;
		selfController.mouseButton = event.button;
		$(document).mousemove(selfController.handleMouseMove);
	};
};

Controller.prototype.mouseWheelHandler = function(selfController) {
	return function (event) {
		var evt = window.event || event;//equalize event object
		var delta = evt.detail ? evt.detail * (-1) : evt.wheelDelta;

		selfController.zoom = -delta < 0 ? selfController.zoom = selfController.zoom * 0.9 : selfController.zoom * 1.1;
		app.raycaster.moveCamera(selfController.translateX, selfController.translateY, selfController.zoom);

		selfController.modified = true;

		if (evt.preventDefault) //disable default wheel action of scrolling page
			evt.preventDefault();
		else
			return false;
	};
};

Controller.prototype.loadDicom = function(selfController) {
	return function (event) {
		if (event.target.files.length < 2) {
			console.log('Need 2 or more images');
			return;
		}

		ImageLoader.totalSize = event.target.files.length;

		var onloadF = function (evt) {
			ImageLoader.pushImage(ImageLoader.loadImage(evt.target.result));
			if (ImageLoader.totalSize <= ImageLoader.imgs.length) {
				app.setVolume(VolumeFactory.createDicomVolume(ImageLoader.imgs));
				ImageLoader.imgs.length = 0;;
				if (selfController.gradientEditor)
					selfController.updateTransferGradient(app.raycaster.get_transfer());
				else
					selfController.createGradient(app.raycaster.get_transfer());
			}
		};
		
		for (var i = 0; i < event.target.files.length; i++) {
			var reader = new FileReader();
			reader.onload = onloadF;
			reader.readAsArrayBuffer(event.target.files[i]);
		}
		

		selfController.modified = true;
	};
};

Controller.prototype.loadRAW = function(selfController) {
	return function (event) {

		var pixelSpacing = { x: parseFloat($("#psX").val()), y: parseFloat($("#psY").val()), z: parseFloat($("#psZ").val()) };
		var volumeSize = { width: parseInt($("#width").val(), 10), height: parseInt($("#height").val(), 10), nslices: parseInt($("#nslices").val(), 10) };
		var bits = $('input[name=bits]:checked', '#rawFileForm').val();

		var reader = new FileReader();
		reader.onload = function(evt) {
			app.setVolume(VolumeFactory.createVolumefromRaw(evt.target.result, bits, volumeSize, pixelSpacing));
			if (selfController.gradientEditor)
				selfController.updateTransferGradient(app.raycaster.get_transfer());
			else
				selfController.createGradient(app.raycaster.get_transfer());
		};
		reader.readAsArrayBuffer(event.target.files[0]);

		selfController.hideRawFileForm();
		selfController.modified = true;
	};
};

//Show rawFile popup
Controller.prototype.showRawFileForm = function() {
	$("#rawFileForm").css("display" , "block");
};

//Hide rawFile popup
Controller.prototype.hideRawFileForm = function() {
	$("#rawFileForm").css("display", "none");
};

Controller.prototype.createGradient = function(transfer) {
	this.gradientEditor = new GradientEditor(transfer);
	this.modified = true;
};

Controller.prototype.updateTransferGradient = function(transfer) {
	this.gradientEditor.update();
	this.modified = true;
};

Controller.prototype.handleMouseMove = function(selfController) {
	return function (event) {
		if (selfController.canvasMouseDown) {
			var newX = event.clientX;
			var newY = event.clientY;
			if (selfController.mouseButton == 2) {

				var deltaX = newX - selfController.lastMouseX;
				var xRotationMatrix = mat4.create();
				mat4.rotateY(xRotationMatrix, xRotationMatrix,(deltaX / 60));

				var deltaY = newY - selfController.lastMouseY;
				var yRotationMatrix = mat4.create();
				mat4.rotateX(yRotationMatrix, yRotationMatrix,(deltaY / 60));

				var newRotationMatrix = mat4.create();
				mat4.multiply(newRotationMatrix, xRotationMatrix, yRotationMatrix);

				mat4.multiply(selfController.objectRotationMatrix, newRotationMatrix, selfController.objectRotationMatrix);

				selfController.lastMouseX = newX;
				selfController.lastMouseY = newY;
				
				app.raycaster.rotateCamera(selfController.objectRotationMatrix);
			}
			if (selfController.mouseButton == 1) {
				selfController.translateX += (newX - selfController.lastMouseX);
				selfController.translateY -= (newY - selfController.lastMouseY);

				selfController.lastMouseX = newX;
				selfController.lastMouseY = newY;
				
				app.raycaster.moveCamera(selfController.translateX, selfController.translateY, selfController.zoom);
			}
			selfController.modified = true;
		}

		return;
	};
};
