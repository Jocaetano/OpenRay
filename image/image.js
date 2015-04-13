
DicomImage = function(info, buffer) {
	this.imageInfo = info;
	this.min = -1; //int16
	this.max = -1; //int16

	//Uint16Array
	this.buffer = buffer;
};

DicomImage.prototype.densityLimits = function() {
	this.min = this.buffer[0]; 
	this.max = this.min;

	for(var i = 0; i < this.imageInfo.size; ++i)    {       
		var value = this.buffer[i];
		if(value < this.min) {
			this.min = value;
			continue;
		}
		if(value > this.max)
			this.max = value;
	}

	return {
		'first': this.min * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept,
		'second': this.max * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept
	}; 
};

//16 bits to 24 bits(RGB)
DicomImage.prototype.generateRGBData = function(array){
	
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

	for(var i = 0; i < this.imageInfo.size; ++i)    {      
		int16View[0] = this.buffer[i];
		index = 3*i;
		array[index] = int8View[0];
		array[index+1] = int8View[1];
//		array[index+2] = 0; this byte is never used
	}
};

//operation moved to gpu
DicomImage.prototype.calculateHULookup = function(bufferArray){        
	var newBuffer = new ArrayBuffer(bufferArray.byteLength);
	this.buffer = new Int16Array(newBuffer);

	for(var i = 0; i < this.imageInfo.size; ++i)    {  
		this.buffer[i] = bufferArray[i] * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept;
	}
};
