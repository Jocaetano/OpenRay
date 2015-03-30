
DicomImage = function(info, buffer) {
	this.imageInfo = info;
	
	if(info.DicomImage)
		this.calculateHULookup(buffer);
	else
		this.buffer = buffer;
};

DicomImage.prototype.densityLimits = function() {
	this.min = this.buffer[0]; 
	this.max = this.min;

	for(var i = 0; i < this.imageInfo.size; ++i)    {        
		var value = this.buffer[i];    
		this.min = (this.min < value) ? this.min : value;
		this.max = (this.max > value) ? this.max : value;
	}

	return {
		'first': this.min,
		'second': this.max
	}; 
};

DicomImage.prototype.generateDicomImageData = function(array, volumeMinDensity){
	var buffer = new ArrayBuffer(4);
	var int32View = new Int32Array(buffer);
	var int8View = new Uint8Array(buffer);

	for(var i = 0; i < this.imageInfo.size; ++i)    {        
		int32View[0] = this.buffer[i] - volumeMinDensity;
		index = 3*i;
		array[index] = int8View[0];
		array[index+1] = int8View[1];
		array[index+2] = int8View[2];
	}
};

DicomImage.prototype.calculateHULookup = function(bufferArray){        
	var newBuffer = new ArrayBuffer(bufferArray.byteLength);
	this.buffer = new Int16Array(newBuffer);
	
	for(var i = 0; i < this.imageInfo.size; ++i)    {   
		var a = bufferArray[i];
		this.buffer[i] = (a  * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept);
	}
};

