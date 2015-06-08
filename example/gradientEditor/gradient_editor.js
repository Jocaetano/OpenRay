define(['color', 'colorPicker'], function (Color, ColorPicker) {
	'use strict';

	function GradientEditor(transfer, parentUpdate) {
		this.parentUpdate = parentUpdate;
		this.transfer = transfer;
		this.gradientCanvas = document.getElementById('transferGradient');
		this.context = this.gradientCanvas.getContext('2d');

		this.stopPointsCanvas = document.getElementById('stopPoints');
		this.stopContext = this.stopPointsCanvas.getContext('2d');

		this.stopPointsCanvas.addEventListener("mousedown", this.stopCanvasMouseDownHandler.bind(this), false);

		var self = this;

		this.handleMouseMove = this.handleMouseMove.bind(this);
		document.addEventListener("mouseup", function (event) {
			document.removeEventListener("mousemove", self.handleMouseMove, false);
		}, false);

		this.update();
	}

	GradientEditor.prototype = {

		update: function () {
			this.clear();
			this.context.rect(0, 0, this.gradientCanvas.width, this.gradientCanvas.height);

			this.grd = this.context.createLinearGradient(0, 0, this.gradientCanvas.width, 0);

			for (var i = 0; i < this.transfer._intervals.length; i++) {
				var position = this.transfer._intervals[i];
				var color = this.transfer._colors[i];
				this.addStopPoint(position, color);
			}

			this.context.fillStyle = this.grd;
			this.context.fill();

			this.parentUpdate();
		},

		setTransfer: function (transfer) {
			this.transfer = transfer;
			this.update();
		},

		clear: function () {
			this.context.fillStyle = ColorPicker.prototype.createGradientPattern();
			this.context.fillRect(0, 0, this.gradientCanvas.width, this.gradientCanvas.height);

			this.stopContext.clearRect(0, 0, this.stopPointsCanvas.width, this.stopPointsCanvas.height);
		},

		addStopPoint: function (position, color) {
			this.grd.addColorStop(position, 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a / 255.0 + ')');

			this.stopContext.strokeStyle = "black";
			this.stopContext.translate(position * this.stopPointsCanvas.width, this.stopPointsCanvas.height / 4);

			this.stopContext.beginPath();
			var h = 10 * (Math.sqrt(3) / 2);
			this.stopContext.moveTo(0, -h / 2);
			this.stopContext.lineTo(-10 / 2, h / 2);
			this.stopContext.lineTo(10 / 2, h / 2);
			this.stopContext.lineTo(0, -h / 2);
			this.stopContext.stroke();
			this.stopContext.fillStyle = "black";
			this.stopContext.fill();
			this.stopContext.closePath();

			this.stopContext.beginPath();
			this.stopContext.lineTo(-5, -h / 2 + 10);
			this.stopContext.lineTo(-5, h / 2 + 10);
			this.stopContext.lineTo(5, h / 2 + 10);
			this.stopContext.lineTo(5, -h / 2 + 10);
			this.stopContext.stroke();
			this.stopContext.fillStyle = 'rgb(' + Math.round(color.r) + ', ' + Math.round(color.g) + ', ' + Math.round(color.b) + ')';
			this.stopContext.fill();
			this.stopContext.closePath();

			this.stopContext.translate(-position * this.stopPointsCanvas.width, -this.stopPointsCanvas.height / 4);
		},

		stopCanvasMouseDownHandler: function (event) {
				var hitStopPoint = false;
				var hitLimits = false;

				for (var i = 0; i < this.transfer._intervals.length; i++) {
					var interval = this.transfer._intervals[i];
					if ((event.offsetX < this.stopPointsCanvas.width * interval + 5) && (event.offsetX > this.stopPointsCanvas.width * interval - 5)) {
						hitStopPoint = true;
						this.stopPointSelected = i;
						if (i == 0 || i == this.transfer._intervals.length)
							hitLimits = true;
						break;
					}
				}

				if (event.button == 0 && hitStopPoint && !hitLimits) {
					document.addEventListener("mousemove", this.handleMouseMove, false);
				}
				else if (event.button == 2) {
					var self = this;
					var update = function () {
						self.transfer.updateColor(self.stopPointSelected, new Color(this.red, this.green, this.blue, this.alpha));
						self.update();
					};

					var position = event.offsetX / this.stopPointsCanvas.width;

					var color32 = this.transfer.getColorAt(position);

					var color = new Color((color32 & 0x000000FF),(color32 & 0x0000FF00) >> 8,(color32 & 0x00FF0000) >> 16, color32 >>> 24);

					if (!hitStopPoint) {
						this.stopPointSelected = this.transfer.insert(position, color);
						this.update();
					}

					new ColorPicker({ 'x': event.pageX, 'y': event.pageY }, "colorPicker", update, color);
				}
				else if (event.button == 1 && hitStopPoint && !hitLimits) {
					this.transfer.remove(this.stopPointSelected);
					this.update();
				}
		},

		handleMouseMove: function (event) {
			var stopCanvas = document.getElementById('stopPoints');

			var value = event.offsetX / stopCanvas.width;

			if (value <= 0.0 || value >= 1.0)
				return;

			var newPosition = this.transfer.moveColor(this.stopPointSelected, value);
			this.update();

			this.stopPointSelected = this.stopPointSelected + newPosition;
		}

	};
	
	return GradientEditor;
});