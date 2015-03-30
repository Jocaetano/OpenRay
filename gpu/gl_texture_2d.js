
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
	var length = Math.ceil(Math.sqrt(volume._imgContainer.length));
	this.createTexture(dicomSize*length, dicomSize*length, gl.RGB);
	
	var data = new Uint8Array(dicomSize*dicomSize*length*length*3);
	var temp = new Uint8Array(dicomSize*dicomSize*3);
	for(var i = 0; i < volume._imgContainer.length; i++) {
		volume._imgContainer[i].generateDicomImageData(temp, volume._minDensity);
		var columnOffset  = i % length;
		var rowOffset = Math.floor(i/length);
		for(var line = rowOffset*dicomSize; line < (rowOffset+1)*dicomSize; line++) {
			var tempLine = line - rowOffset*dicomSize;
			for(var column = columnOffset*dicomSize*3; column < (columnOffset+1)*dicomSize*3; column++){
				var tempColumn = column - columnOffset*dicomSize*3;
				data[line*dicomSize*length*3 + column] = temp[tempLine*dicomSize*3 + tempColumn];
			}	
		}
	}

	this.updatePixels(data, gl.RGB);
};

GLTexture2D.prototype.updatePixels = function(data, format) {
	gl.bindTexture(gl.TEXTURE_2D, this.tex);

	gl.texImage2D(gl.TEXTURE_2D, 0, format, this.width, this.height, 0, format, gl.UNSIGNED_BYTE, data); 

	gl.bindTexture(gl.TEXTURE_2D, null);
};