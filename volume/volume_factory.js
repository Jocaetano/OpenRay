var VolumeFactory  = VolumeFactory || {};

VolumeFactory.C3DEImageOrderer = function(img1, img2) {
	return img1.imageInfo.sliceNum - img2.imageInfo.sliceNum;
};

VolumeFactory.createDicomVolume = function(images) {
	images.sort(VolumeFactory.C3DEImageOrderer);	
	var vol = new Volume(images[0].densityLimits(), images[0].imageInfo);
	for (var i = 0; i < images.length; i++) {
		vol.insertImage(images[i]);
	}
	return vol;
};

VolumeFactory.createVolumefromRaw = function(fileBuffer, pixelType, dimX, dimY, dimZ, pixelSpacing) {	
	var imagesSize = dimX * dimY;

	var imgContainer = VolumeFactory.createImagesFromRaw(fileBuffer, pixelType, imagesSize, dimX, dimY, dimZ);

	var dcmInfo = {};
	dcmInfo.height = dimY;
	dcmInfo.width = dimX;
	dcmInfo.size = dimY * dimX;
	dcmInfo.pixelSpacing = pixelSpacing;

	var vol = new Volume(imgContainer[0].densityLimits(), dcmInfo);

	var i = 0;
	imgContainer.forEach(
			function(image) {
				dcmInfo.position = {x : 0, y : 0, z : pixelSpacing.z * i};
				image.imageInfo = dcmInfo;
				vol.insertImage(image);
			}
	);
	
	return vol;
};

VolumeFactory.createImagesFromRaw = function(fileBuffer, pixelType, imageSize, dimX, dimY, dimZ) {

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
		case 4:
			bufferView = new Uint32Array(fileBuffer, startByte, imageSize);
			break;
		default : 
			bufferView = 0;
		}
		var image = new DicomImage({}, bufferView);
		imgContainer.push(image);

		startByte += imageSize * pixelType;
	}

	return imgContainer;
};