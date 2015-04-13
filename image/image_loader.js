var ImageLoader = ImageLoader || {};
ImageLoader.imgs = new Array();

ImageLoader.loadImage = function(file) {

	var info = {};
	
	try {
		var dataset = dicomParser.parseDicom(new Uint8Array(file));
		
		//(0028, 0030) PixelSpacing
		if(dataset.elements.x00280030) {
			info.pixelSpacing = { x: dataset.floatString('x00280030', 0), y: dataset.floatString('x00280030', 1)};
		}
		
		//(0020, 0037) ImageOrientationPatient
		if(dataset.elements.x00200037) {
			info.xOrientation = { x: dataset.floatString('x00200037', 0), y:  dataset.floatString('x00200037', 1), z: dataset.floatString('x00200037', 2)};
			info.yOrientation = { x: dataset.floatString('x00200037', 3), y:  dataset.floatString('x00200037', 4), z: dataset.floatString('x00200037', 5)};
		}

		//(0020, 0032) ImagePositionPatient
		if(dataset.elements.x00200032) {
			info.position = { x: dataset.floatString('x00200032', 0), y: dataset.floatString('x00200032', 1), z: dataset.floatString('x00200032', 2)};
		}
		
		if(dataset.elements.x00280002)		info.samplesPerPixel		= dataset.uint16('x00280002', 0);
		if(dataset.elements.x00180050)		info.sliceThickness			= dataset.floatString('x00180050', 0);
		if(dataset.elements.x00200013)		info.sliceNum				= dataset.intString('x00200013', 0);
		if(dataset.elements.x00280100)		info.bitsAllocated			= dataset.uint16('x00280100', 0);
		if(dataset.elements.x00280010)		info.height					= dataset.uint16('x00280010', 0);
		if(dataset.elements.x00280011) 		info.width					= dataset.uint16('x00280011', 0);
		if(dataset.elements.x00281052)		info.rescaleIntercept		= dataset.floatString('x00281052', 0);
		if(dataset.elements.x00281053)		info.rescaleSlope			= dataset.floatString('x00281053', 0);
		if(dataset.elements.x00080008) 		info.imageType				= dataset.string('x00080008', 0);
		if(dataset.elements.x00100010) 		info.patientName			= dataset.string('x00100010', 0);
		if(dataset.elements.x00100040)  	info.patientSex				= dataset.string('x00100040', 0);
		if(dataset.elements.x00101005)		info.patientBirthDate		= dataset.string('x00101005', 0);
		if(dataset.elements.x00101010)		info.patientAge				= dataset.intString('x00101010', 0);
		if(dataset.elements.x00280008)		info.numberOfFrames			= dataset.intString('x00280008', 0);
		if(dataset.elements.x00280009)		info.frameIncrementPointer	= dataset.floatString('x00280009', 0);
		if(dataset.elements.x00181063) 		info.frameTime				= dataset.floatString('x00181063', 0);
		if(dataset.elements.x00181065) 		info.frameTimeVector		= dataset.floatString('x00181065', 0);
	}
	catch(err)	{
		$('#parseError').text(err);
	}

	info.size = info.height * info.width;
	
	//There is probably a better way to get the pixelBuffer using the dicomParser - Found it, cornerstoneWADOImageLoader.extractUncompressedPixels(dataSet, width, height, frame)
	var dicomImage = new DicomImage(info, new Uint16Array(file, dataset.elements.x7fe00010.dataOffset, info.size));
	
	return dicomImage;
};

ImageLoader.pushImage = function(image) {
	ImageLoader.imgs.push(image);
	if(ImageLoader.totalSize <= ImageLoader.imgs.length) {
		app.setVolume(VolumeFactory.createDicomVolume(ImageLoader.imgs));
		ImageLoader.imgs.length = 0;;
	}
};