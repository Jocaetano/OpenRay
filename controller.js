
var translateX = 0.0;
var translateY = 0.0;
var zoom = 10;
var objectRotationMatrix = mat4.create();

var lastMouseX = 0.0;
var lastMouseY = 0.0;

function Controller() {
	var canvas = document.getElementById("raywebgl");
	initGL(canvas);

	var self = this;
	
	$("a").click(function() {
		$(".tabbed_content").show();
	});

	$(".tabbed_content").mouseleave(function() {
		$(".tabbed_content").fadeOut('slow');;
	});

	this.resetCamera = this.resetCamera(this);
	$("#resetCamButton").click(this.resetCamera);

	this.handleMouseMove = this.handleMouseMove(this);

	this.mouseWheelHandler = this.mouseWheelHandler(this);
	canvas.addEventListener("mousewheel", this.mouseWheelHandler , false);
	canvas.addEventListener("DOMMouseScroll", this.mouseWheelHandler , false);

	this.mouseDownHandler = this.mouseDownHandler(this);
	canvas.addEventListener("mousedown", this.mouseDownHandler, false);

	this.mouseUpHandler = this.mouseUpHandler(this);
	document.addEventListener("mouseup", this.mouseUpHandler, false);

	this.loadDicom = this.loadDicom(this);
	document.getElementById('dicomFiles').addEventListener('change', this.loadDicom, false);
	
	this.loadRAW = this.loadRAW(this);
	document.getElementById('rawFile').addEventListener('change', this.loadRAW, false);

	var slider = document.getElementById('lightX');
	this.updateSliderX = this.updateSlider(0, slider, this);
	slider.addEventListener('change', this.updateSliderX, false);

	slider = document.getElementById('lightY');
	this.updateSliderY = this.updateSlider(1, slider, this);
	slider.addEventListener('change', this.updateSliderY, false);

	slider = document.getElementById('lightZ');
	this.updateSliderZ = this.updateSlider(2, slider, this);
	slider.addEventListener('change', this.updateSliderZ, false);

	document.addEventListener("keyup", function(event) {
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
			raycasterStart("askDicomImages");
			break;
		case 90: // Z
			raycasterStart("askRAW");
			break;
		case 84: // T
			document.getElementById('loadButton').click();
			break;
		case 49: // 1
			app.raycaster.changeResultTexture(); 
			break;
		}
		self.modified = true; 
	}, false);

	document.getElementById('dicomButton').addEventListener('click', function() {
		raycasterStart("askDicomImages"); self.modified = true; 
	}, false);
	
	document.getElementById('rawButton').addEventListener('click', function() {
		raycasterStart("askRAW"); self.modified = true; 
	}, false);

	this.saveTransfer = this.saveTransfer(this);
	document.getElementById('saveButton').addEventListener('click', this.saveTransfer, false);

	this.loadTransfer = this.loadTransfer(this);
	document.getElementById('loadButton').addEventListener('change', this.loadTransfer, false);

	var phongCheckBox = document.getElementById('usePhong');
	var alphaGradientCheckBox = document.getElementById('useAlphaGradient');
	this.updateCheckBox = this.updateCheckBox(phongCheckBox, alphaGradientCheckBox, this);
	phongCheckBox.addEventListener('change', this.updateCheckBox, false);
	alphaGradientCheckBox.addEventListener('change', this.updateCheckBox, false);
}

Controller.prototype.updateCheckBox = function(phongCheckBox, alphaGradientCheckBox, selfController) {
	return function(event) {
		app.raycaster.restartProgram(phongCheckBox.checked, alphaGradientCheckBox.checked);
	};
};

Controller.prototype.resetCamera = function(selfController) {
	return function() {
		translateX = 0.0;
		translateY = 0.0;
		zoom = 10;
		mat4.identity(objectRotationMatrix);
		
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
	return function (event) {
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;    

		window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
			fs.root.getFile('transfer.trf', {create: true}, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					var blob = new Blob([app.raycaster.transfer.serialize()]);

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
				selfController.gradientEditor.setTransfer(app.raycaster.transfer);
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
		document.removeEventListener("mousemove", selfController.handleMouseMove, false);
	};
};

Controller.prototype.mouseDownHandler = function(selfController) {
	return function (event) {
		selfController.canvasMouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
		selfController.mouseButton = event.button;
		document.addEventListener("mousemove",  selfController.handleMouseMove, false);
	};
};

Controller.prototype.mouseWheelHandler = function(selfController) {
	return function (event) {
		var evt = window.event || event ;//equalize event object
		var delta = evt.detail ? evt.detail * (-1) : evt.wheelDelta;

		zoom = -delta < 0 ? zoom = zoom * 0.9 : zoom * 1.1;

		selfController.modified = true;

		if (evt.preventDefault) //disable default wheel action of scrolling page
			evt.preventDefault();
		else
			return false;
	};
};

Controller.prototype.loadDicom = function(selfController)	{
	return function (event) {
		if (event.target.files.length < 2) {
			console.log('Need 2 or more images');
			return;
		}

		ImageFactory.createC3DEImages(event.target.files);

		selfController.modified = true;
	};
};

Controller.prototype.loadRAW = function(selfController)	{
	return function (event) {
		
		var reader = new FileReader();
		reader.onload = function(evt)     {
			var pixelSpacing = {x : 1, y : 1, z : 1};
			app.setVolume(VolumeFactory.createVolumefromRaw(evt.target.result, 1, 256, 256, 110, pixelSpacing));
		};
		reader.readAsArrayBuffer(event.target.files[0]);

		selfController.modified = true;
	};
};

Controller.prototype.createGradient = function(transfer)	{
	this.gradientEditor = new GradientEditor(transfer);
	this.modified = true;
};

Controller.prototype.updateTransferGradient = function(transfer)	{
	this.gradientEditor.update();
	this.modified = true;
};

Controller.prototype.handleMouseMove = function(selfController) {
	return function (event) {
		if(selfController.canvasMouseDown) {
			if(selfController.mouseButton == 2) {
				var newX = event.clientX;
				var newY = event.clientY;

				var deltaX = newX - lastMouseX;
				var xRotationMatrix = mat4.create();
				mat4.rotateY(xRotationMatrix, xRotationMatrix, (deltaX/60));

				var deltaY = newY - lastMouseY;
				var yRotationMatrix = mat4.create();
				mat4.rotateX(yRotationMatrix, yRotationMatrix, (deltaY/60));

				var newRotationMatrix = mat4.create();
				mat4.multiply(newRotationMatrix, xRotationMatrix, yRotationMatrix);

				mat4.multiply(objectRotationMatrix, newRotationMatrix, objectRotationMatrix);

				lastMouseX = newX;
				lastMouseY = newY;
			}
			if(selfController.mouseButton == 1) {
				var newX = event.clientX;
				var newY = event.clientY;

				translateX += (newX - lastMouseX);
				translateY -= (newY - lastMouseY);

				lastMouseX = newX;
				lastMouseY = newY;
			}
			selfController.modified = true;
		}

		return;
	};
};
