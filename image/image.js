
define(function () {
	'use strict';

	function DicomImage(info, buffer) {
		this.imageInfo = info;
		this.min = -1; //int16
		this.max = -1; //int16

		this.buffer = buffer;

		switch (this.imageInfo.bitsAllocated) {
			case 0:
				this.generateRGBData = this.from8toRGB;
				break;
			case 1:
				if (this.buffer instanceof Int16Array)
					this.generateRGBData = this.fromInt16toRGB;
				else
					this.generateRGBData = this.fromUint16toRGB;
				break;
			case 2:
				this.generateRGBData = function () { return console.log("24bit per sample not supported"); };
				break;
			case 3:
				this.generateRGBData = function () { return console.log("32bit per sample not supported"); };
				break;
			default:
				this.generateRGBData = function () { return console.log(this.imageInfo.bitsAllocated); };
		}
	};

	DicomImage.prototype = {
		
		densityLimits: function () {
			this.min = this.buffer[0];
			this.max = this.min;

			for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
				var value = this.buffer[i];
				if (value < this.min) {
					this.min = value;
					continue;
				}
				if (value > this.max)
					this.max = value;
			}

			return {
				'first': this.min * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept,
				'second': this.max * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept
			};
		},

		//16 bits to 24 bits(RGB)
		generateRGBData: function (array) {	},

		fromUint16toRGB: function (array) {
			//NEXT STEP, USE FLOAT64ARRAY TO READ
			//	var uint32view = new Uint32Array(array.buffer);
			//	//X0XX XX0X 0XX0     X => 1111 1111
			//	for (var i = 0, j = 0; i < uint32view.length; i += 3, j++) {
			//	    uint32view[i] = this.buffer[i+j] | this.buffer[i+j+1] << 24;
			//	    uint32view[i+1] = this.buffer[i+j+1] >> 8 | this.buffer[i+j+2]  << 16;
			//	    uint32view[i+2] = this.buffer[i+j+3] << 8;
			//	}

			var buffer = new ArrayBuffer(2);
			var int16View = new Uint16Array(buffer);
			var int8View = new Uint8Array(buffer);

			var index = 0;
			for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
				int16View[0] = this.buffer[i];
				index = 3 * i;
				array[index] = int8View[0];
				array[index + 1] = int8View[1];
				//		array[index+2] = 0; this byte is never used
			}
		},

		fromInt16toRGB: function (array) {
			var buffer = new ArrayBuffer(2);
			var int16View = new Int16Array(buffer);
			var int8View = new Uint8Array(buffer);

			var index = 0;
			for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
				int16View[0] = this.buffer[i] - this.min;
				index = 3 * i;
				array[index] = int8View[0];
				array[index + 1] = int8View[1];
			}
		},

		from8toRGB: function (array) {
			var index = 0;
			if (this.imageInfo.invert)
				for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
					index = 3 * i;
					array[index] = !this.buffer[i];
				}
			else
				for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
					index = 3 * i;
					array[index] = this.buffer[i];
				}
		},

		//operation moved to gpu
		calculateHULookup: function (bufferArray) {
			var newBuffer = new ArrayBuffer(bufferArray.byteLength);
			this.buffer = new Int16Array(newBuffer);

			for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
				this.buffer[i] = bufferArray[i] * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept;
			}
		}
	};

	return DicomImage;
});

