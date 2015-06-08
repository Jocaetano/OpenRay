define([], function () {
	'use strict';

	function ColorPicker(position, id, updateFunction, color) {
		this.red = color.r;
		this.green = color.g;
		this.blue = color.b;
		this.alpha = color.a;
		this.id = id;
		this.update = updateFunction;

		var colorPicker = document.createElement('div');

		colorPicker.id = id;
		colorPicker['class'] = "colorPickerWidget";
		colorPicker.style.width = "416px";
		colorPicker.style.height = "296px";
		colorPicker.style.position = "absolute";
		colorPicker.style.border = "1px solid";
		colorPicker.style.left = position.x;
		colorPicker.style.top = position.y - 296 + "";
		colorPicker.style.zIndex = "5";
		colorPicker.ondragstart = function () { return false; };
		colorPicker.onselectstart = function () { return false; };
		colorPicker.style.backgroundColor = "#f3f3f3";

		document.body.appendChild(colorPicker);

		this.createColorMapWidget();
		this.createBlueWidget();
		this.createAlphaWidget();

		var listener = function (event) {
			if (event.target['class'] != "colorPickerWidget") {
				document.body.removeChild(colorPicker);
				document.removeEventListener("click", listener, false);
			}
		};

		document.addEventListener("click", listener, false);
	}

	ColorPicker.prototype = {

		updateColorMapWidget: function (blue) {
			var colorCanvas = document.getElementById('colorCanvas');
			var context = colorCanvas.getContext('2d');

			var imageData = context.createImageData(colorCanvas.width, colorCanvas.height);

			for (var i = 0; i < 256; i++) {
				for (var j = 0; j < 256; j++) {
					var index = (i + j * imageData.width) * 4;
					imageData.data[index + 0] = i;
					imageData.data[index + 1] = j;
					imageData.data[index + 2] = blue;
					imageData.data[index + 3] = 255;
				}
			}

			context.fillStyle = this.createGradientPattern();
			context.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

			context.putImageData(imageData, 0, 0);
		},

		createColorMapWidget: function () {
			var colorMap = document.createElement("div");
			colorMap.id = "colorMap";
			colorMap['class'] = "colorPickerWidget";
			colorMap.style.width = "256px";
			colorMap.style.height = "256px";
			colorMap.style.position = "absolute";
			colorMap.style.left = "80px";
			colorMap.style.top = "20px";
			document.getElementById(this.id).appendChild(colorMap);

			var colorCanvas = document.createElement("canvas");
			var context = colorCanvas.getContext('2d');
			colorCanvas.width = 256;
			colorCanvas.height = 256;
			var imageData = context.createImageData(colorCanvas.width, colorCanvas.height);

			colorCanvas.id = "colorCanvas";
			colorCanvas['class'] = "colorPickerWidget";
			colorCanvas.style.position = "absolute";
			colorCanvas.style.left = "0px";
			colorCanvas.style.top = "0px";
			document.getElementById(colorMap.id).appendChild(colorCanvas);

			for (var i = 0; i < 256; i++) {
				for (var j = 0; j < 256; j++) {
					var index = (i + j * imageData.width) * 4;
					imageData.data[index + 0] = i;
					imageData.data[index + 1] = j;
					imageData.data[index + 2] = this.blue;
					imageData.data[index + 3] = 255;
				}
			}

			context.fillStyle = this.createGradientPattern();
			context.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

			context.putImageData(imageData, 0, 0);

			var huePoint = document.createElement("img");
			huePoint.id = "huePoint";
			huePoint['class'] = "colorPickerWidget";
			huePoint.style.width = "15px";
			huePoint.style.height = "15px";
			huePoint.style.position = "absolute";
			huePoint.style.border = "0";
			huePoint.style.zIndex = "5";
			huePoint.style.left = -6.5 + this.red + "px";
			huePoint.style.top = -6.5 + this.green + "px";
			huePoint.src = "colorPicker/mappoint.gif";
			document.getElementById(colorMap.id).appendChild(huePoint);

			var self = this;

			var pickColor = function (event) {
				huePoint.style.left = (event.offsetX - 7.5) + "";
				huePoint.style.top = (event.offsetY - 7.5) + "";
				self.red = event.offsetX + 1;
				self.green = event.offsetY + 1;
				self.update();
			};

			var mouseMoveHandler = function (event) {
				pickColor(event);
			};

			var mouseDownHandler = function (event) {
				pickColor(event);
				colorCanvas.addEventListener("mousemove", mouseMoveHandler, false);
			};

			document.addEventListener("mouseup", function (event) {
				colorCanvas.removeEventListener("mousemove", mouseMoveHandler, false);
			}, false);

			colorCanvas.addEventListener("mousedown", mouseDownHandler, false);
		},

		createBlueWidget: function () {
			var blueDiv = document.createElement("div");
			blueDiv.id = "blueDiv";
			blueDiv['class'] = "colorPickerWidget";
			blueDiv.style.width = "40px";
			blueDiv.style.height = "256px";
			blueDiv.style.position = "absolute";
			blueDiv.style.left = "356px";
			blueDiv.style.top = "20px";
			document.getElementById(this.id).appendChild(blueDiv);

			var blueCanvas = document.createElement("canvas");
			blueCanvas.width = 20;
			blueCanvas.height = 256;
			var context = blueCanvas.getContext('2d');

			blueCanvas.id = "blueCanvas";
			blueCanvas['class'] = "colorPickerWidget";
			blueCanvas.style.position = "absolute";
			blueCanvas.style.left = "9px";
			blueCanvas.style.top = "0px";
			document.getElementById(blueDiv.id).appendChild(blueCanvas);

			var grd = context.createLinearGradient(0, 0, 0, blueCanvas.height);

			grd.addColorStop(0, 'rgb(0, 0, 255)');
			grd.addColorStop(1, 'rgb(0, 0, 0)');

			context.fillStyle = grd;
			context.fillRect(0, 0, blueCanvas.width, blueCanvas.height);

			var rangeArrows = document.createElement("img");
			rangeArrows.id = "rangeArrows";
			rangeArrows['class'] = "colorPickerWidget";
			rangeArrows.style.width = "40px";
			rangeArrows.style.height = "9px";
			rangeArrows.style.position = "absolute";
			rangeArrows.style.border = "0";
			rangeArrows.style.zIndex = "5";
			rangeArrows.style.left = "0%";
			rangeArrows.style.top = -4.5 + this.blue + "px";
			rangeArrows.src = "colorPicker/rangearrows.gif";
			document.getElementById(blueDiv.id).appendChild(rangeArrows);

			var self = this;

			var pickBlue = function (event) {
				rangeArrows.style.top = (event.offsetY - 4.5) + "";
				self.blue = (event.offsetY) + 1;
				self.updateColorMapWidget((event.offsetY) + 1);
				self.update();
			};

			var mouseMoveHandler = function (event) {
				pickBlue(event);
			};

			var mouseDownHandler = function (event) {
				pickBlue(event);
				blueCanvas.addEventListener("mousemove", mouseMoveHandler, false);
			};

			document.addEventListener("mouseup", function (event) {
				blueCanvas.removeEventListener("mousemove", mouseMoveHandler, false);
			}, false);

			blueCanvas.addEventListener("mousedown", mouseDownHandler, false);
		},

		createAlphaWidget: function () {
			var alphaDiv = document.createElement("div");
			alphaDiv.id = "alphaDiv";
			alphaDiv['class'] = "colorPickerWidget";
			alphaDiv.style.width = "40px";
			alphaDiv.style.height = "256px";
			alphaDiv.style.position = "absolute";
			alphaDiv.style.left = "20px";
			alphaDiv.style.top = "20px";
			document.getElementById(this.id).appendChild(alphaDiv);

			var alphaCanvas = document.createElement('canvas');
			var context = alphaCanvas.getContext('2d');

			alphaCanvas.id = "alphaCanvas";
			alphaCanvas['class'] = "colorPickerWidget";
			alphaCanvas.width = 20;
			alphaCanvas.height = 256;
			alphaCanvas.style.position = "absolute";
			alphaCanvas.style.left = "9px";
			alphaCanvas.style.top = "0px";
			document.getElementById(alphaDiv.id).appendChild(alphaCanvas);

			context.fillStyle = this.createGradientPattern();
			context.fillRect(0, 0, alphaCanvas.width, alphaCanvas.height);

			var grd = context.createLinearGradient(0, 0, 0, alphaCanvas.height);

			grd.addColorStop(0, 'rgba(255, 255, 255, 0)');
			grd.addColorStop(1, 'rgba(0, 0, 0, 1)');

			context.fillStyle = grd;
			context.fillRect(0, 0, alphaCanvas.width, alphaCanvas.height);

			var rangeArrows = document.createElement("img");
			rangeArrows.id = "rangeArrows2";
			rangeArrows['class'] = "colorPickerWidget";
			rangeArrows.style.width = "40px";
			rangeArrows.style.height = "9px";
			rangeArrows.style.position = "absolute";
			rangeArrows.style.border = "0";
			rangeArrows.style.zIndex = "5";
			rangeArrows.style.left = "0%";
			rangeArrows.style.top = -4.5 + this.alpha + "px";
			rangeArrows.src = "colorPicker/rangearrows.gif";
			document.getElementById(alphaDiv.id).appendChild(rangeArrows);

			var self = this;

			var pickAlpha = function (event) {
				rangeArrows.style.top = (event.offsetY - 4.5) + "";
				self.alpha = (event.offsetY + 1);
				self.update();
			};

			var mouseMoveHandler = function (event) {
				pickAlpha(event);
			};

			var mouseDownHandler = function (event) {
				pickAlpha(event);
				alphaCanvas.addEventListener("mousemove", mouseMoveHandler, false);
			};

			document.addEventListener("mouseup", function (event) {
				alphaCanvas.removeEventListener("mousemove", mouseMoveHandler, false);
			}, false);

			alphaCanvas.addEventListener("mousedown", mouseDownHandler, false);

		},

		createGradientPattern: function () {
			var pattern = document.createElement('canvas');
			pattern.width = 10;
			pattern.height = 10;
			var pctx = pattern.getContext('2d');

			pctx.fillStyle = "rgb(220, 220, 220)";
			pctx.fillRect(0, 0, 5, 5);
			pctx.fillStyle = "rgb(255, 255, 255)";
			pctx.fillRect(0, 5, 5, 5);
			pctx.fillStyle = "rgb(220, 220, 220)";
			pctx.fillRect(5, 5, 5, 5);
			pctx.fillStyle = "rgb(255, 255, 255)";
			pctx.fillRect(5, 0, 5, 5);

			return pctx.createPattern(pattern, "repeat");;
		}
	};

	return ColorPicker;
});