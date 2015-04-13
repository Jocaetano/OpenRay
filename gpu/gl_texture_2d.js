
function GLTexture2D(func) {
	this[func].apply(this, Array.prototype.slice.call(arguments, 1));
}

GLTexture2D.prototype.createTexture = function(width, height, format) {
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
};

GLTexture2D.prototype.changeSize = function(width, height) {
	this.width = width;
	this.height = height;
	gl.bindTexture(gl.TEXTURE_2D, this.tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, null);	
};

GLTexture2D.prototype.bind = function(slot) {
	slot = slot || 0;
	gl.activeTexture(gl.TEXTURE0 + slot);
	gl.bindTexture(gl.TEXTURE_2D, this.tex);
};

GLTexture2D.prototype.getTextureID = function() {
	return this.tex;
};

GLTexture2D.prototype.loadFromImage = function(imageURL) {
	this.tex = gl.createTexture();
	this.tex.image = new Image();
	var self = this;
	self.tex.image.onload = function() 	{
		gl.bindTexture(gl.TEXTURE_2D, self.tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self.tex.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	this.tex.image.src = imageURL;
};

GLTexture2D.prototype.loadFromVolume = function(volume) {
	var dicomSize = volume._imageWidth;
	//length is the number of images in a row of the final image matrix 
	var length = Math.ceil(Math.sqrt(volume._imgContainer.length));
	this.createTexture(dicomSize*length, dicomSize*length, gl.RGB);
	//bytesRow is the number of bytes in a row of a single image
	var bytesRow = dicomSize*3;

	//maybe it's faster if we use only one ArrauBuffer; see mdn TypedArray.prototype.set()
	var imageSizeBytes = dicomSize*bytesRow;
	var dataBuffer = new ArrayBuffer(imageSizeBytes + imageSizeBytes*length*length);
	var dataImage = new Uint8Array(dataBuffer, 0, imageSizeBytes);
	var dataTexture = new Uint8Array(dataBuffer, imageSizeBytes, imageSizeBytes*length*length);

	for(var i = 0; i < volume._imgContainer.length; i++) {
		volume._imgContainer[i].generateRGBData(dataImage);
		var columnOffset  = (i % length) * bytesRow;
		var rowOffset = Math.floor(i/length) * dicomSize;
		for(var rowTexture = rowOffset, rowImage = 0; rowImage < dicomSize; rowTexture++, rowImage++) {
			dataTexture.set(new Uint8Array(dataBuffer, bytesRow*rowImage, bytesRow), rowTexture*bytesRow*length + columnOffset);
		}
	}
	this.updatePixels(dataTexture, gl.RGB);
};

GLTexture2D.prototype.updatePixels = function(data, format) {
	gl.bindTexture(gl.TEXTURE_2D, this.tex);

	gl.texImage2D(gl.TEXTURE_2D, 0, format, this.width, this.height, 0, format, gl.UNSIGNED_BYTE, data); 

	gl.bindTexture(gl.TEXTURE_2D, null);
};