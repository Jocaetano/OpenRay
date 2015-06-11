(function (root, factory) {
	if (typeof define === 'function' && define.amd)
		define(factory);
	else
		º.GLTexture2D = factory();
} (this,

	function () {
		'use strict';

		function GLTexture2D(glContext, widthVolume, height, format) {
			this._gl = glContext;
			if (typeof widthVolume === "object")
				this.loadFromVolume(widthVolume);
			else
				this.createTexture(widthVolume, height, format);
		}

		GLTexture2D.prototype = {
			createTexture: function (width, height, format) {
				this.width = width;
				this.height = height;
				this.format = format;
				this._gl.deleteTexture(this.tex);
				this.tex = this._gl.createTexture();
				this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
				this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, width, height, 0, format, this._gl.UNSIGNED_BYTE, null);
				this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
				this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
				this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
				this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
			},

			changeSize: function (width, height) {
				this.width = width;
				this.height = height;
				this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
				this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this._gl.UNSIGNED_BYTE, null);
			},

			bind: function (slot) {
				slot = slot || 0;
				this._gl.activeTexture(this._gl.TEXTURE0 + slot);
				this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);
			},

			getTextureID: function () {
				return this.tex;
			},

			loadFromVolume: function (volume) {
				var dicomSize = volume._imageWidth;
				//length is the number of images in a row of the final image matrix 
				var length = Math.ceil(Math.sqrt(volume._imgContainer.length));
				this.createTexture((dicomSize + 2) * length,(dicomSize + 2) * length, this._gl.RGB);

				//RGB
				var bytesPerPixel = 3;
				var align = 8;
				while ((dicomSize + 2) * bytesPerPixel * length % align) {
					align = align >> 1;
				}
				this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, align);
				//bytesRow is the number of bytes in a row of a single image
				var bytesRow = dicomSize * bytesPerPixel;
				var bytesRowT = (dicomSize + 2) * bytesPerPixel;

				//is it faster if we use only one ArrauBuffer?; see mdn TypedArray.prototype.set()
				var imageSizeBytes = dicomSize * bytesRow;
				var dataBuffer = new ArrayBuffer(imageSizeBytes + (dicomSize + 2) * bytesRowT * length * length);
				var dataImage = new Uint8Array(dataBuffer, 0, imageSizeBytes);
				var dataTexture = new Uint8Array(dataBuffer, imageSizeBytes);

				for (var i = 0, ii = volume._imgContainer.length; i < ii; i++) {
					volume._imgContainer[i].generateRGBData(dataImage);
					var columnOffset = (i % length) * bytesRowT;
					var rowOffset = Math.floor(i / length) * (dicomSize + 2);
					dataTexture.set(new Uint8Array(dataBuffer, 0, bytesPerPixel), rowOffset * bytesRowT * length + columnOffset);
					dataTexture.set(new Uint8Array(dataBuffer, 0, bytesRow), rowOffset * bytesRowT * length + columnOffset + bytesPerPixel);
					dataTexture.set(new Uint8Array(dataBuffer, bytesRow - bytesPerPixel, bytesPerPixel), rowOffset * bytesRowT * length + columnOffset + bytesRow + bytesPerPixel);
					for (var rowTexture = rowOffset + 1, rowImage = 0; rowImage < dicomSize; rowTexture++ , rowImage++) {
						dataTexture.set(new Uint8Array(dataBuffer, rowImage * bytesRow, bytesPerPixel), rowTexture * bytesRowT * length + columnOffset);
						dataTexture.set(new Uint8Array(dataBuffer, rowImage * bytesRow, bytesRow), rowTexture * bytesRowT * length + columnOffset + bytesPerPixel);
						dataTexture.set(new Uint8Array(dataBuffer, rowImage * bytesRow + (bytesRow - bytesPerPixel), bytesPerPixel), rowTexture * bytesRowT * length + columnOffset + bytesRow + bytesPerPixel);
					}
					dataTexture.set(new Uint8Array(dataBuffer,(rowImage - 1) * bytesRow, bytesPerPixel), rowTexture * bytesRowT * length + columnOffset);
					dataTexture.set(new Uint8Array(dataBuffer,(rowImage - 1) * bytesRow, bytesRow), rowTexture * bytesRowT * length + columnOffset + bytesPerPixel);
					dataTexture.set(new Uint8Array(dataBuffer, imageSizeBytes - bytesPerPixel, bytesPerPixel), rowTexture * bytesRowT * length + columnOffset + bytesRow + bytesPerPixel);
				}
				this.updatePixels(dataTexture, this._gl.RGB);
			},

			updatePixels: function (data, format) {
				this._gl.bindTexture(this._gl.TEXTURE_2D, this.tex);

				this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, this.width, this.height, 0, format, this._gl.UNSIGNED_BYTE, data);

				this._gl.bindTexture(this._gl.TEXTURE_2D, null);
			}
		};

		return GLTexture2D;
	}));
