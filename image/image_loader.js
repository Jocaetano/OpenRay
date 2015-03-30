var ImageLoader = ImageLoader || {};
ImageLoader.imgs = new Array();

ImageLoader.loadImage = function(file) {
	var dicomParser = new DicomParser(file);
	
	dicomParser.parseAll();        

	var info = {};

	if(dicomParser.dicomElements.PixelSpacing) {
		var temp = dicomParser.dicomElements.PixelSpacing;
		info.pixelSpacing = { x: parseFloat(temp.value[0]), y: parseFloat(temp.value[1])};
	}

	if(dicomParser.dicomElements.ImageOrientationPatient) {
		var temp = dicomParser.dicomElements.ImageOrientationPatient;
		info.xOrientation = { x: parseFloat(temp.value[0]), y:  parseFloat(temp.value[1]), z: parseFloat(temp.value[2])};
		info.yOrientation = { x: parseFloat(temp.value[3]), y:  parseFloat(temp.value[4]), z: parseFloat(temp.value[5])};
	}

	if(dicomParser.dicomElements.ImagePositionPatient) {
		temp = dicomParser.dicomElements.ImagePositionPatient;
		info.position = { x: parseFloat(temp.value[0]), y: parseFloat(temp.value[1]), z: parseFloat(temp.value[2])};
	}

	if(dicomParser.dicomElements.SamplesPerPixel)		info.samplesPerPixel 		= parseFloat(dicomParser.dicomElements.SamplesPerPixel.value[0]);
	if(dicomParser.dicomElements.SliceThickness)		info.imageThickness 		= parseFloat(dicomParser.dicomElements.SliceThickness.value[0]);
	if(dicomParser.dicomElements.InstanceNumber)		info.sliceNum 				= parseFloat(dicomParser.dicomElements.InstanceNumber.value[0]);
	if(dicomParser.dicomElements.BitsAllocated)			info.depth 					= dicomParser.dicomElements.BitsAllocated.value[0];
	if(dicomParser.dicomElements.Rows)					info.height 				= parseFloat(dicomParser.dicomElements.Rows.value[0]);
	if(dicomParser.dicomElements.Columns) 				info.width 					= parseFloat(dicomParser.dicomElements.Columns.value[0]);
	if(dicomParser.dicomElements.RescaleSlope)			info.rescaleSlope			= parseFloat(dicomParser.dicomElements.RescaleSlope.value[0]);
	if(dicomParser.dicomElements.RescaleIntercept)		info.rescaleIntercept		= parseFloat(dicomParser.dicomElements.RescaleIntercept.value[0]);
	if(dicomParser.dicomElements.ImageType) 			info.imageType 				= dicomParser.dicomElements.ImageType.value[0];
	if(dicomParser.dicomElements.PatientName) 			info.patientName 			= dicomParser.dicomElements.PatientName.value[0];
	if(dicomParser.dicomElements.PatientSex)  			info.patientSex 			= dicomParser.dicomElements.PatientSex.value[0];
	if(dicomParser.dicomElements.PatientAge)			info.patientAge 			= parseFloat(dicomParser.dicomElements.PatientAge.value[0]);
	if(dicomParser.dicomElements.PatientBirthDate)		info.patientBirthDate 		= dicomParser.dicomElements.PatientBirthDate.value[0];
	if(dicomParser.dicomElements.FrameIncrementPointer)	info.frameIncrementPointer	= parseFloat(dicomParser.dicomElements.FrameIncrementPointer.value[0]);
	if(dicomParser.dicomElements.NumberOfFrames)		info.numberOfFrames 		= parseFloat(dicomParser.dicomElements.NumberOfFrames.value[0]);
	if(dicomParser.dicomElements.FrameTime) 			info.frameTime 				= parseFloat(dicomParser.dicomElements.FrameTime.value[0]);
	if(dicomParser.dicomElements.FrameTimeVector) 		info.frameTimeVector 		= parseFloat(dicomParser.dicomElements.FrameTimeVector.value[0]);
	
	info.size = info.height * info.width;
	
	info.DicomImage = true;

	return new DicomImage(info, dicomParser.getImageBuffer());
};

ImageLoader.pushImage = function(image) {
	ImageLoader.imgs.push(image);
	if(ImageLoader.totalSize <= ImageLoader.imgs.length) {
		app.setVolume(VolumeFactory.createDicomVolume(ImageLoader.imgs));
		ImageLoader.imgs.length = 0;;
	}
};