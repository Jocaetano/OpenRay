function GradientEditor(transfer) {
	this.transfer = transfer;
	this.gradientCanvas = document.getElementById('transferGradient');
	this.context = this.gradientCanvas.getContext('2d');

	this.stopPointsCanvas = document.getElementById('stopPoints');
	this.stopContext = this.stopPointsCanvas.getContext('2d');

	this.stopMouseDown = false;
	this.stopPointsCanvas.addEventListener("mousedown", this.stopCanvasMouseDownHandler(this), false);

	var self = this;

	this.handleMouseMove = this.handleMouseMove(this);
	document.addEventListener("mouseup", function(event) {
		self.stopMouseDown = false; document.removeEventListener("mousemove", self.handleMouseMove, false);
	}, false);
	
	this.update();
}

GradientEditor.prototype.update = function()	{
	this.clear();
	this.context.rect(0, 0, this.gradientCanvas.width, this.gradientCanvas.height);

	this.grd = this.context.createLinearGradient(0, 0, this.gradientCanvas.width, 0);

	for(var i = 0; i < this.transfer._intervals.length; i++) {
		var position = this.transfer._intervals[i];
		var color = this.transfer._colors[i];
		this.addStopPoint(position, color);
	}

	this.context.fillStyle = this.grd;
	this.context.fill();
	
	//TODO remove this
	controller.modified = true;
};

GradientEditor.prototype.setTransfer = function(transfer)	{
	this.transfer = transfer;
	this.update();
}

GradientEditor.prototype.clear = function() {
	this.context.fillStyle = ColorPicker.prototype.createGradientPattern();
	this.context.fillRect(0, 0, this.gradientCanvas.width, this.gradientCanvas.height);

	this.stopContext.clearRect(0, 0, this.stopPointsCanvas.width, this.stopPointsCanvas.height);
};

GradientEditor.prototype.addStopPoint = function(position, color)	{
	this.grd.addColorStop(position, 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a/255.0 + ')');
	
	this.stopContext.strokeStyle = "black";
	this.stopContext.translate(position * this.stopPointsCanvas.width, this.stopPointsCanvas.height/4);

	this.stopContext.beginPath();
	var h = 10 * (Math.sqrt(3)/2);
	this.stopContext.moveTo(0, -h/2);
	this.stopContext.lineTo( -10/2, h/2);
	this.stopContext.lineTo(10/2, h/2);
	this.stopContext.lineTo(0, -h/2);
	this.stopContext.stroke();
	this.stopContext.fillStyle = "black";
	this.stopContext.fill(); 
	this.stopContext.closePath();

	this.stopContext.beginPath();
	this.stopContext.lineTo(-5, -h/2 + 10);
	this.stopContext.lineTo(-5, h/2 + 10);
	this.stopContext.lineTo(5, h/2 + 10);
	this.stopContext.lineTo(5, -h/2 + 10);
	this.stopContext.stroke();
	this.stopContext.fillStyle = 'rgb(' + Math.round(color.r) + ', ' + Math.round(color.g) + ', ' + Math.round(color.b) + ')';
	this.stopContext.fill(); 
	this.stopContext.closePath();

	this.stopContext.translate(-position * this.stopPointsCanvas.width, -this.stopPointsCanvas.height/4);
};

GradientEditor.prototype.stopCanvasMouseDownHandler = function(gradientEditor) {
	return function (event) {
		var hitStopPoint = false;

		for(var i = 1; i < gradientEditor.transfer._intervals.length -1; i++) {
			var interval = gradientEditor.transfer._intervals[i];
			if((event.offsetX < gradientEditor.stopPointsCanvas.width*interval + 5) && (event.offsetX > gradientEditor.stopPointsCanvas.width*interval - 5)) {
				hitStopPoint = true;
				gradientEditor.stopPointSelected = i;
				break;
			}
		}

		if(event.button == 0 && hitStopPoint) {
			gradientEditor.stopMouseDown = true;
			gradientEditor.mouseButton = event.button;
			document.addEventListener("mousemove",  gradientEditor.handleMouseMove, false);
		}	
		else if(event.button == 2) {
			require(['../../transferFunction/color'], function (Color) {
				var update = function () {
					gradientEditor.transfer.updateColor(gradientEditor.stopPointSelected, new Color(this.red, this.green, this.blue, this.alpha));
					gradientEditor.update();
				};

				var position = event.offsetX / gradientEditor.stopPointsCanvas.width;

				var color32 = gradientEditor.transfer.getColorAt(position);
			
				var color = new Color((color32 & 0x000000FF),(color32 & 0x0000FF00) >> 8,(color32 & 0x00FF0000) >> 16, color32 >>> 24);

				if (!hitStopPoint) {
					gradientEditor.stopPointSelected = gradientEditor.transfer.insert(position, color);
					gradientEditor.update();
				}

				new ColorPicker({ 'x': event.layerX, 'y': event.layerY }, "colorPicker", update, color);
			});
		}
		else if(event.button == 1 && hitStopPoint) {
			gradientEditor.transfer.remove(gradientEditor.stopPointSelected);
			gradientEditor.update();
		}
	};
};

GradientEditor.prototype.handleMouseMove = function(gradientEditor) {
	return function(event) {
		var stopCanvas = document.getElementById('stopPoints');

		var value = event.offsetX/stopCanvas.width;

		if(value <= 0.0 || value >= 1.0)
			return;

		var newPosition = gradientEditor.transfer.moveColor(gradientEditor.stopPointSelected, value);
		gradientEditor.update();

		gradientEditor.stopPointSelected = gradientEditor.stopPointSelected + newPosition;
	};
};
