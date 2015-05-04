define(function () {
	'use strict';

	function GLTexture2D(widthVolume, height, format) {
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
			gl.deleteTexture(this.tex);
			this.tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		},

		changeSize: function (width, height) {
			this.width = width;
			this.height = height;
			gl.bindTexture(gl.TEXTURE_2D, this.tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, null);
		},

		bind: function (slot) {
			slot = slot || 0;
			gl.activeTexture(gl.TEXTURE0 + slot);
			gl.bindTexture(gl.TEXTURE_2D, this.tex);
		},

		getTextureID: function () {
			return this.tex;
		},

		loadFromVolume: function (volume) {
			var dicomSize = volume._imageWidth;
			//length is the number of images in a row of the final image matrix 
			var length = Math.ceil(Math.sqrt(volume._imgContainer.length));
			this.createTexture((dicomSize + 2) * length,(dicomSize + 2) * length, gl.RGB);

			//RGB
			var bytesPerPixel = 3;
			var align = 8;
			while ((dicomSize + 2) * bytesPerPixel * length % align) {
				align = align >> 1;
			}
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, align);
			//bytesRow is the number of bytes in a row of a single image
			var bytesRow = dicomSize * bytesPerPixel;
			var bytesRowT = (dicomSize + 2) * bytesPerPixel;

			//is it faster if we use only one ArrauBuffer?; see mdn TypedArray.prototype.set()
			var imageSizeBytes = dicomSize * bytesRow;
			var dataBuffer = new ArrayBuffer(imageSizeBytes + (dicomSize + 2) * bytesRowT * length * length);
			var dataImage = new Uint8Array(dataBuffer, 0, imageSizeBytes);
			var dataTexture = new Uint8Array(dataBuffer, imageSizeBytes);

			for (var i = 0; i < volume._imgContainer.length; i++) {
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
			this.updatePixels(dataTexture, gl.RGB);
		},

		updatePixels: function (data, format) {
			gl.bindTexture(gl.TEXTURE_2D, this.tex);

			gl.texImage2D(gl.TEXTURE_2D, 0, format, this.width, this.height, 0, format, gl.UNSIGNED_BYTE, data);

			gl.bindTexture(gl.TEXTURE_2D, null);
		}
	};
	
	return GLTexture2D;
});
