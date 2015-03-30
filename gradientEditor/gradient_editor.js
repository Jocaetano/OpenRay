function GradientEditor() {
	this.canvas = document.getElementById('transferGradient');
	this.context = this.canvas.getContext('2d');

	this.stopCanvas = document.getElementById('stopPoints');
	this.stopContext = this.stopCanvas.getContext('2d');

	this.stopMouseDown = false;
	this.stopCanvas.addEventListener("mousedown", this.stopCanvasMouseDownHandler(this), false);

	var self = this;
	
	this.handleMouseMove = this.handleMouseMove(this);
	document.addEventListener("mouseup", function(event) {
		self.stopMouseDown = false; document.removeEventListener("mousemove", self.handleMouseMove, false);
	}, false);
}

GradientEditor.prototype.clear = function() {

	this.context.fillStyle = ColorPicker.prototype.createGradientPattern();
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

	this.stopContext.clearRect(0, 0, this.stopCanvas.width, this.stopCanvas.height);
};

GradientEditor.prototype.update = function(transfer)	{
	this.clear();
	this.context.rect(0, 0, this.canvas.width, this.canvas.height);

	var grd = this.context.createLinearGradient(0, 0, this.canvas.width, 0);

	for(var i = 0; i < transfer._intervals.length; i++) {
		var position = transfer._intervals[i];
		var color = 'rgba(' + Math.round(transfer._colors[i].r*255) + ', ' + Math.round(transfer._colors[i].g*255) + ', ' + Math.round(transfer._colors[i].b*255) + ', ' + transfer._alphas[i] + ')';
		grd.addColorStop(position, color);
		this.addStopPoint({'position': position, 'color': transfer._colors[i]});
	}

	this.context.fillStyle = grd;
	this.context.fill();

	this.transfer = transfer;
};

GradientEditor.prototype.addStopPoint = function(stopPoint)	{
//	var self = this;
//	var temp = {
//			layer: true,
//			fillStyle: 'rgb(' + Math.round(stopPoint.color.r*255) + ', ' + Math.round(stopPoint.color.g*255) + ', ' + Math.round(stopPoint.color.b*255) + ')',
//			x: stopPoint.position * this.stopCanvas.width, 
//			y: this.stopCanvas.height/2,
//			radius: 5, 
//			strokeStyle: "black",
//			strokeWidth: 1,
//			mousedown : function(layer) {
//				console.log(layer);
//				self.stopMouseDown = true;
//				self.mouseButton = 0;
//				document.addEventListener("mousemove",  self.handleMouseMove, false);
//			}, 
//			mouseup : function(layer) {
//				self.stopMouseDown = false; document.removeEventListener("mousemove", self.handleMouseMove, false);
//			}
//	};
//
//	$("#stopPoints").drawArc(temp);
	
	
	
	
	
	
	var h = 10 * (Math.sqrt(3)/2);

	this.stopContext.strokeStyle = "black";

	this.stopContext.translate(stopPoint.position * this.stopCanvas.width, this.stopCanvas.height/4);

	this.stopContext.beginPath();

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
	this.stopContext.fillStyle = 'rgb(' + Math.round(stopPoint.color.r*255) + ', ' + Math.round(stopPoint.color.g*255) + ', ' + Math.round(stopPoint.color.b*255) + ')';
	this.stopContext.fill(); 

	this.stopContext.closePath();

	this.stopContext.translate(-stopPoint.position * this.stopCanvas.width, -this.stopCanvas.height/4);
};

GradientEditor.prototype.stopCanvasMouseDownHandler = function(gradientEditor) {
	return function (event) {
		var hitStopPoint = false;

		for(var i = 1; i < gradientEditor.transfer._intervals.length -1; i++) {
			var position = transfer._intervals[i];
			if((event.offsetX < gradientEditor.stopCanvas.width*position + 5) && (event.offsetX > gradientEditor.stopCanvas.width*position - 5)) {
				hitStopPoint = true;
				gradientEditor.transfer.hit = i;
				break;
			}
		}

		if(event.button == 0 && hitStopPoint) {
			gradientEditor.stopMouseDown = true;
			gradientEditor.mouseButton = event.button;
			document.addEventListener("mousemove",  gradientEditor.handleMouseMove, false);
		}	
		else 	if(event.button == 2) {
			var update = function() {
				app.raycaster.transfer.update(gradientEditor.transfer.hit, 0, new Color(this.red/255, this.green/255, this.blue/255), this.alpha, true);
				app.raycaster.updateTransferFunctionTexture();
			};
			
			var position = event.offsetX/gradientEditor.stopCanvas.width;
			
			var colorData = gradientEditor.transfer.color(position);
			var color = new Color(colorData[0], colorData[1], colorData[2]);
			var alpha = gradientEditor.transfer.alpha(position);
			
			new ColorPicker({'x': event.layerX, 'y': event.layerY}, "colorPicker", update, color, alpha);

			if(!hitStopPoint) {


				gradientEditor.addStopPoint({'position': position, 'color': color});

				app.raycaster.transfer.insert(position, color, alpha);

				app.raycaster.updateTransferFunctionTexture();

				for(var i = 1; i < gradientEditor.transfer._intervals.length -1; i++) {
					var position = transfer._intervals[i];
					if((event.offsetX < gradientEditor.stopCanvas.width*position + 5) && (event.offsetX > gradientEditor.stopCanvas.width*position - 5)) {
						hitStopPoint = true;
						gradientEditor.transfer.hit = i;
						break;
					}
				}
			}
		}else 	if(event.button == 1 && hitStopPoint) {
			app.raycaster.transfer.remove(gradientEditor.transfer.hit);

			app.raycaster.updateTransferFunctionTexture();
		}
	};
};

GradientEditor.prototype.handleMouseMove = function(gradientEditor) {
	return function(event) {
		var stopCanvas = document.getElementById('stopPoints');

		var value = event.offsetX/stopCanvas.width;

		var changed = app.raycaster.transfer.update(gradientEditor.transfer.hit, value);
		gradientEditor.transfer.hit = gradientEditor.transfer.hit + changed;

		app.raycaster.updateTransferFunctionTexture();

		return;
	};
};
