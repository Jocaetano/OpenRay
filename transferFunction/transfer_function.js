define(function () {
	'use strict';

	function lower_bound(array, value, begin, end) {
		begin = begin || 0;
		end = end || array.length;

		if (array[0] == value)
			return 0;
		for (var i = begin; i < end; i++) {
			if (array[i] >= value)
				return i - 1;
		}
		return 0;
	}

	function upper_bound(array, value, begin, end) {
		begin = begin || 0;
		end = end || array.length;

		for (var i = begin; i < end; i++) {
			if (array[i] > value)
				return i;
		}
		return array.length - 1;
	}


	function _interpolation(colors, firstIt, secondIt, dist) {
		var c1 = colors[firstIt].rgba;
		var c2 = colors[secondIt].rgba;
		var MASK1 = 0xff00ff;
		var MASK2 = 0x00ff00;
		var f2 = ~~(256 * dist);
		var f1 = 256 - f2;

		var c3 = ((((c1 & MASK1) * f1) + ((c2 & MASK1) * f2)) >>> 8) & MASK1 | ((((c1 & MASK2) * f1) + ((c2 & MASK2) * f2)) >>> 8) & MASK2;

		var c1a = c1 >>> 24;
		var c2a = c2 >>> 24;
		var c3a = c1a + ~~((c2a - c1a) * dist);
		c3a = c3a << 24;
		c3 = c3a | c3;

		return c3;
	}

	function TransferFunction(min, max) {
		this.nStops = 0;
		this.size = max - min + 1;
		this._min = min;
		this._max = max;
		this._intervals = [];
		this._colors = [];

		this._observers = [];

		//this.data = new Uint32Array(this.size);
	}

	TransferFunction.prototype = {

		addObserver: function (observer) {
			this._observers.push(observer);
		},

		notifyObservers: function () {
			this._observers.forEach(function (element) { element.observedUpdate(); });
		},

		push: function (interval, color) {
			this._intervals.push(interval);
			this._colors.push(color);
			this.nStops++;

			this.notifyObservers();
		},

		insert: function (interval, color) {
			var it = upper_bound(this._intervals, interval);

			this._intervals.splice(it, 0, interval);
			this._colors.splice(it, 0, color);
			this.nStops++;

			this.notifyObservers();

			return it;
		},

		/*
		_updateData: function (it) {
			if (this.nStops < 2)
				return;

			var newData;
			var length = 0;
			var byteOffset = 0;

			var t2 = performance.now();
			if (it == 0) {
				length = ~~(this._intervals[1] * this.size);
				newData = new Uint32Array(this.data.buffer, 4, length);
			} else if (it == this.nStops - 1) {
				byteOffset = ~~(this._intervals[it - 1] * this.size);
				length = ~~(this._intervals[it] * this.size) - byteOffset;
				newData = new Uint32Array(this.data.buffer, byteOffset * 4 + 4, length - 2);
			} else {
				byteOffset = ~~(this._intervals[it - 1] * this.size);
				length = ~~(this._intervals[it + 1] * this.size) - byteOffset;
				newData = new Uint32Array(this.data.buffer, byteOffset * 4 + 4, length - 2);
			}

			for (var i = 0; i < newData.length; i++) {
				var p = (i + byteOffset) / (this.size - 1);
				newData[i] = this.color(p).rgba;
			}

			var t3 = performance.now();
			console.log(t3 - t2);
		},
		*/

		remove: function (position) {
			this._intervals.splice(position, 1);
			this._colors.splice(position, 1);
			this.nStops--;
			this.notifyObservers();
		},

		updateColor: function (position, color) {
			this._colors[position] = color;
			this.notifyObservers();
		},

		moveColor: function (position, interval) {
			this._intervals[position] = interval;

			var changed = 0;
			if (interval > this._intervals[position + 1]) {
				this.swap(position, position + 1);
				changed = 1;
			}
			else if (interval < this._intervals[position - 1]) {
				this.swap(position, position - 1);
				changed = -1;
			}

			this.notifyObservers();

			return changed;
		},

		swap: function (position1, position2) {
			var bakInterval = this._intervals.splice(position1, 1);
			var bakColor = this._colors.splice(position1, 1);

			this._intervals.splice(position2, 0, bakInterval[0]);
			this._colors.splice(position2, 0, bakColor[0]);
		},

		setRange: function (min, max) {
			this._min = min;
			this._max = max;
			this._size = max - min + 1;
		},

		getColorAt: function (value) {
			var firstIt = lower_bound(this._intervals, value);

			var secondIt = upper_bound(this._intervals, value, firstIt);

			var dist = 0.0;
			if (this._intervals[secondIt] != this._intervals[firstIt])
				dist = (value - this._intervals[firstIt]) / (this._intervals[secondIt] - this._intervals[firstIt]);

			return _interpolation(this._colors, firstIt, secondIt, dist);
		},

		serialize: function () {
			var buffer = new ArrayBuffer(1 + (this.nStops * (4 + 4))); //nStops(1B), interval(4B), RGBA(4B)
			var dataView = new DataView(buffer);
			var resultBuffer = new Uint8Array(buffer);

			resultBuffer[0] = this.nStops;
			for (var i = 0; i < this.nStops; i++) {
				dataView.setFloat32(8 * i + 1, this.getInterval(i));
				var colorData = this._colors[i];
				resultBuffer[8 * i + 5] = colorData.r;
				resultBuffer[8 * i + 6] = colorData.g;
				resultBuffer[8 * i + 7] = colorData.b;
				resultBuffer[8 * i + 8] = colorData.a;
			}
			return resultBuffer;
		},

		getInterval: function (position) {
			return (this._intervals[position] * (this._max - this._min)) + this._min;
		},

		getRangeMin: function () {
			return this._min;
		},

		getRangeMax: function () {
			return this._max;
		},

		toJSON: function () {
			return {
				'nStops': this.nStops, 
				'size': this.size, 
				'_min': this._min, 
				'_max': this._max, 
				'_intervals': this._intervals, 
				'_colors': this._colors
			};
		}
	};

	return TransferFunction;

});