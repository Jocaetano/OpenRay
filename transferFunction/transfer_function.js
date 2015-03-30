//function StopPoint(position, color, alpha) {
//	this.position = position;
//	this.color = color;
//	this.alpha = alpha;
//}
//
//StopPoint.prototype.stopPointOrderer = function(stopPointA, stopPointB) {
//	return stopPointA.position - stopPointB.position;
//};

function TransferFunction() {
//	this._stopPoints = new Array();

	this._intervals = new Array();
	this._colors = new Array();
	this._alphas = new Array();
	this.nStops = 0;
}

TransferFunction.prototype.insert = function(interval, color, alpha) {
	var it = upper_bound(this._intervals, interval);

	this._intervals.splice(it ,0, interval);
	this._colors.splice(it ,0, color);
	this._alphas.splice(it ,0, alpha);
	this.nStops++;
};

TransferFunction.prototype.remove = function(position) {
	this._intervals.splice(position , 1);
	this._colors.splice(position , 1);
	this._alphas.splice(position, 1);
	this.nStops--;
};

//TransferFunction.prototype.insertStopPoint = function(stopPoint) {
//	var it = this._stopPoints.length;
//	for (var i = 0; i < this._stopPoints.length; i++) {
//		if(this._stopPoints[i].position > stopPoint.position)
//			it = i;
//	}
//
//	this._stopPoints.splice(it ,0, stopPoint);
//};

TransferFunction.prototype.update = function(position, interval, color, alpha, oldPosition) {
	var bakInterval = this._intervals.splice(position, 1);
	(oldPosition) ? bakInterval : bakInterval = [interval];
	var bakColor = this._colors.splice(position, 1);
	(color) ? bakColor = [color] : bakColor;
	var bakAlpha = this._alphas.splice(position, 1);
	(alpha) ? bakAlpha = [alpha] : bakAlpha;

	var it = upper_bound(this._intervals, bakInterval[0]);

	var changed = 0;
	if(bakInterval >= this._intervals[position]) {
		it--;
		changed = 1;
	} else if(bakInterval <= this._intervals[position-1]) {
		changed = -1;
	}

	this._intervals.splice(it ,0, bakInterval[0]);
	this._colors.splice(it ,0, bakColor[0]);
	this._alphas.splice(it ,0, bakAlpha[0]);

	if(changed)
		this.swap(position, position + changed);

	return changed;
};

TransferFunction.prototype.swap = function(position1, position2) {
	var bakInterval = this._intervals.splice(position1, 1);
	var bakColor = this._colors.splice(position1, 1);
	var bakAlpha = this._alphas.splice(position1, 1);

	this._intervals.splice(position2 ,0, bakInterval[0]);
	this._colors.splice(position2 ,0, bakColor[0]);
	this._alphas.splice(position2 ,0, bakAlpha[0]);
};

TransferFunction.prototype.setRange = function(min, max) {
	this._min = min;
	this._max = max;
	this._size = max - min;
};

//TransferFunction.prototype.colorStopPoint = function(value) {
//	var self = this;
//	var mainReturn = function(firstIt, secondIt, dist) {
//		return ((self._stopPoints[firstIt].color.multiply(1 - dist)).plus(self._stopPoints[secondIt].color.multiply(dist))).data();
//	};
//	
//	return this.interpolation(value, [0,0,0], mainReturn);
//};

TransferFunction.prototype.color = function(value) {
	var self = this;
	var mainReturn = function(firstIt, secondIt, dist) {
		return self._colors[firstIt].plus(self._colors[secondIt].minus(self._colors[firstIt]).multiply(dist)).data();
	};
	
	return this.interpolation(value, [0,0,0], mainReturn);
};

TransferFunction.prototype.alpha = function(value) {
	var self = this;
	var mainReturn = function(firstIt, secondIt, dist) {
		return self._alphas[firstIt] + dist * (self._alphas[secondIt] - self._alphas[firstIt]);
	};

	return this.interpolation(value, 0.0, mainReturn);
};

TransferFunction.prototype.interpolation = function(value, defaultReturn, mainReturn) {
	var firstIt = lower_bound(this._intervals, value);

	if(firstIt == (this._intervals.length)){
		return defaultReturn;
	}

	while (this._intervals[firstIt] > value && firstIt != 0) {
		--firstIt;
	}

	if (this._intervals[firstIt] > value) {
		return defaultReturn;
	}

	var secondIt = upper_bound(this._intervals, value, firstIt);

	if (secondIt == (this._intervals.length)) {
		--secondIt;
	}

	if (this._intervals[secondIt] < value) {
		return defaultReturn;
	}

	var dist = 0.0;
	if (this._intervals[secondIt] != this._intervals[firstIt]) {
		dist = (value - this._intervals[firstIt]) / (this._intervals[secondIt] - this._intervals[firstIt]);
	}

	return mainReturn(firstIt, secondIt, dist);
};

TransferFunction.prototype.serialize = function() {
	var buffer = new ArrayBuffer(4 + (this.nStops * 5 * 4)); //size + posição, RGB, e alfa, 32 bits
	var resultBuffer = new Float32Array(buffer);
	resultBuffer[0] = this.nStops;
	for(var i = 0; i < this.nStops; i++) {
		var colorData = this._colors[i].data();
		resultBuffer[5*i + 1] = this.getInterval(i);
		resultBuffer[5*i + 2] = colorData[0];
		resultBuffer[5*i + 3] = colorData[1];
		resultBuffer[5*i + 4] = colorData[2];
		resultBuffer[5*i + 5] = this._alphas[i];
	}
	return resultBuffer;
 };

TransferFunction.prototype.getInterval = function(position) {
	return (this._intervals[position] * (this._max - this._min)) + this._min;
};

TransferFunction.prototype.getRangeMin = function() {
	return this._min;
};

TransferFunction.prototype.getRangeMax = function() {
	return this._max;
};

function lower_bound(array, value, begin, end) {
	begin = begin || 0;
	end = end || array.length;

	for (var i = begin; i < end; i++) {
		if(!(array[i] < value))
			return i;
	}
	return array.length - 1;
}

function upper_bound(array, value, begin, end) {
	begin = begin || 0;
	end = end || array.length;

	for (var i = begin; i < end; i++) {
		if(array[i] > value)
			return i;
	}
	return array.length;
}