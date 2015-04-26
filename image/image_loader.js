var ImageLoader = ImageLoader || {};
ImageLoader.imgs = new Array();

ImageLoader.loadImage = function(file) {

	var info = {};


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
	if(dataset.elements.x00280103) 		info.pixelRepresentation	= dataset.uint16('x00280103', 0);
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

	var photoMetricInterpretation;
	if(dataset.elements.x00280004)		photoMetricInterpretation	= dataset.string('x00280004', 0);
	info.invert = (photoMetricInterpretation === "MONOCHROME1");
	info.size = info.height * info.width;

	//THIS IS FROM cornerstoneWADOImageLoader
	if(photoMetricInterpretation === "RGB" ||
			photoMetricInterpretation === "PALETTE COLOR" ||
			photoMetricInterpretation === "YBR_FULL" ||
			photoMetricInterpretation === "YBR_FULL_422" ||
			photoMetricInterpretation === "YBR_PARTIAL_422" ||
			photoMetricInterpretation === "YBR_PARTIAL_420" ||
			photoMetricInterpretation === "YBR_RCT")
	{
		console.log("Color image not supported = " + photoMetricInterpretation);
	} else {
		var pixelDataElement = dataset.elements.x7fe00010;
		var pixelDataOffset = pixelDataElement.dataOffset;
		var transferSyntax = dataset.string('x00020010');

		var imageData;
		if(transferSyntax === "1.2.840.10008.1.2.4.90" || // JPEG 2000 lossless
				transferSyntax === "1.2.840.10008.1.2.4.91") // JPEG 2000 lossy	
			imageData = ImageLoader.extractJPEG2000Pixels(dataset, info.width, info.height, 0);
		else
			imageData = ImageLoader.extractUncompressedPixels(dataset, info.width, info.height);
	}

	var dicomImage = new DicomImage(info, imageData);

	return dicomImage;
};

//THIS IS FROM cornerstoneWADOImageLoader
ImageLoader.extractJPEG2000Pixels = function(dataset, width, height, frame)	{
	var compressedPixelData = dicomParser.readEncapsulatedPixelData(dataset, dataset.elements.x7fe00010, frame);
	var jpxImage = new JpxImage();
	jpxImage.parse(compressedPixelData);

	var j2kWidth = jpxImage.width;
	var j2kHeight = jpxImage.height;
	if(j2kWidth !== width) {
		throw 'JPEG2000 decoder returned width of ' + j2kWidth + ', when ' + width + ' is expected';
	}
	if(j2kHeight !== height) {
		throw 'JPEG2000 decoder returned width of ' + j2kHeight + ', when ' + height + ' is expected';
	}
	var componentsCount = jpxImage.componentsCount;
	if(componentsCount !== 1) {
		throw 'JPEG2000 decoder returned a componentCount of ' + componentsCount + ', when 1 is expected';
	}
	var tileCount = jpxImage.tiles.length;
	if(tileCount !== 1) {
		throw 'JPEG2000 decoder returned a tileCount of ' + tileCount + ', when 1 is expected';
	}
	var tileComponents = jpxImage.tiles[0];
	var pixelData = tileComponents.items;
	return pixelData;
};

//THIS IS FROM cornerstoneWADOImageLoader
ImageLoader.getPixelFormat = function(dataset) {
	var pixelRepresentation = dataset.uint16('x00280103');
	var bitsAllocated = dataset.uint16('x00280100');
	if(pixelRepresentation === 0 && bitsAllocated === 8) {
		return 1; // unsigned 8 bit
	} else if(pixelRepresentation === 0 && bitsAllocated === 16) {
		return 2; // unsigned 16 bit
	} else if(pixelRepresentation === 1 && bitsAllocated === 16) {
		return 3; // signed 16 bit data
	}
};

//THIS IS FROM cornerstoneWADOImageLoader
ImageLoader.extractUncompressedPixels = function(dataset, width, height)	{
	var pixelFormat = ImageLoader.getPixelFormat(dataset);
	var pixelDataElement = dataset.elements.x7fe00010;
	var pixelDataOffset = pixelDataElement.dataOffset;
	var numPixels = width * height;
	// Note - we may want to sanity check the rows * columns * bitsAllocated * samplesPerPixel against the buffer size

	if(pixelFormat === 1) 
		return new Uint8Array(dataset.byteArray.buffer, pixelDataOffset, numPixels);
	else if(pixelFormat === 2)
		return new Uint16Array(dataset.byteArray.buffer, pixelDataOffset, numPixels);
	else if(pixelFormat === 3)
		return new Int16Array(dataset.byteArray.buffer, pixelDataOffset, numPixels);
}

ImageLoader.pushImage = function(image) {
	ImageLoader.imgs.push(image);
	if(ImageLoader.totalSize <= ImageLoader.imgs.length) {
		app.setVolume(VolumeFactory.createDicomVolume(ImageLoader.imgs));
		ImageLoader.imgs.length = 0;;
	}
};