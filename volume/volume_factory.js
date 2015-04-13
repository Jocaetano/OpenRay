var VolumeFactory  = VolumeFactory || {};

VolumeFactory.C3DEImageOrderer = function(img1, img2) {
	return img1.imageInfo.sliceNum - img2.imageInfo.sliceNum;
};

VolumeFactory.createDicomVolume = function(images) {
	images.sort(VolumeFactory.C3DEImageOrderer);
	var vol = new Volume(images[0].densityLimits(), images[0].imageInfo, images);
	return vol;
};

VolumeFactory.createVolumefromRaw = function(fileBuffer, pixelType, dimX, dimY, dimZ, pixelSpacing) {	
	var imageSize = dimX * dimY;
	var dcmInfo = {};
	dcmInfo.height = dimY;
	dcmInfo.width = dimX;
	dcmInfo.size = dimY * dimX;
	dcmInfo.pixelSpacing = pixelSpacing;
	dcmInfo.bitsAllocated = pixelType*8;
	dcmInfo.rescaleSlope = 1;
	dcmInfo.rescaleIntercept = 0;
	
	var imgContainer = VolumeFactory.createImagesFromRaw(fileBuffer, dcmInfo, pixelType, imageSize, dimZ);

	var vol = new Volume(imgContainer[0].densityLimits(), dcmInfo, imgContainer);

	return vol;
};

VolumeFactory.createImagesFromRaw = function(fileBuffer, dcmInfo, pixelType, imageSize, dimZ) {
	var imgContainer = new Array();
	var bufferView;
	var startByte = 0;

	for (var i = 0; i < dimZ; i++) {
		switch(pixelType) {
		case 1:
			bufferView = new Uint8Array(fileBuffer, startByte, imageSize);
			break;
		case 2:
			bufferView = new Uint16Array(fileBuffer, startByte, imageSize);
			break;
		case 3:
			bufferView = new Uint8Array(fileBuffer, startByte, imageSize*3);
			break;
		case 4:
			bufferView = new Uint32Array(fileBuffer, startByte, imageSize);
			break;
		default : 
			bufferView = new Uint8Array(fileBuffer, startByte, imageSize);
		}
		var image = new DicomImage(dcmInfo, bufferView);
		imgContainer.push(image);

		startByte += imageSize * pixelType;
	}

	return imgContainer;
};