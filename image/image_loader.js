var ImageLoader = ImageLoader || {};
ImageLoader.imgs = new Array();

ImageLoader.loadImage = function(file) {
	/*
	var jParser = new DicomParser(file);
 	
	jParser.parseAll();        

	var info = {};

	if(jParser.dicomElements.PixelSpacing) {
		var temp = jParser.dicomElements.PixelSpacing;
		info.pixelSpacing = { x: parseFloat(temp.value[0]), y: parseFloat(temp.value[1])};
	}

	if(jParser.dicomElements.ImageOrientationPatient) {
		var temp = jParser.dicomElements.ImageOrientationPatient;
		info.xOrientation = { x: parseFloat(temp.value[0]), y:  parseFloat(temp.value[1]), z: parseFloat(temp.value[2])};
		info.yOrientation = { x: parseFloat(temp.value[3]), y:  parseFloat(temp.value[4]), z: parseFloat(temp.value[5])};
	}

	if(jParser.dicomElements.ImagePositionPatient) {
		temp = jParser.dicomElements.ImagePositionPatient;
		info.position = { x: parseFloat(temp.value[0]), y: parseFloat(temp.value[1]), z: parseFloat(temp.value[2])};
	}

	if(jParser.dicomElements.SamplesPerPixel)		info.samplesPerPixel 		= parseFloat(jParser.dicomElements.SamplesPerPixel.value[0]);
	if(jParser.dicomElements.SliceThickness)		info.sliceThickness 		= parseFloat(jParser.dicomElements.SliceThickness.value[0]);
	if(jParser.dicomElements.InstanceNumber)		info.sliceNum 				= parseFloat(jParser.dicomElements.InstanceNumber.value[0]);
	if(jParser.dicomElements.BitsAllocated)			info.depth 					= jParser.dicomElements.BitsAllocated.value[0];
	if(jParser.dicomElements.Rows)					info.height 				= parseFloat(jParser.dicomElements.Rows.value[0]);
	if(jParser.dicomElements.Columns) 				info.width 					= parseFloat(jParser.dicomElements.Columns.value[0]);
	if(jParser.dicomElements.RescaleSlope)			info.rescaleSlope			= parseFloat(jParser.dicomElements.RescaleSlope.value[0]);
	if(jParser.dicomElements.RescaleIntercept)		info.rescaleIntercept		= parseFloat(jParser.dicomElements.RescaleIntercept.value[0]);
	if(jParser.dicomElements.ImageType) 			info.imageType 				= jParser.dicomElements.ImageType.value[0];
	if(jParser.dicomElements.PatientName) 			info.patientName 			= jParser.dicomElements.PatientName.value[0];
	if(jParser.dicomElements.PatientSex)  			info.patientSex 			= jParser.dicomElements.PatientSex.value[0];
	if(jParser.dicomElements.PatientAge)			info.patientAge 			= parseFloat(jParser.dicomElements.PatientAge.value[0]);
	if(jParser.dicomElements.PatientBirthDate)		info.patientBirthDate 		= jParser.dicomElements.PatientBirthDate.value[0];
	if(jParser.dicomElements.FrameIncrementPointer)	info.frameIncrementPointer	= parseFloat(jParser.dicomElements.FrameIncrementPointer.value[0]);
	if(jParser.dicomElements.NumberOfFrames)		info.numberOfFrames 		= parseFloat(jParser.dicomElements.NumberOfFrames.value[0]);
	if(jParser.dicomElements.FrameTime) 			info.frameTime 				= parseFloat(jParser.dicomElements.FrameTime.value[0]);
	if(jParser.dicomElements.FrameTimeVector) 		info.frameTimeVector 		= parseFloat(jParser.dicomElements.FrameTimeVector.value[0]);

	info.size = info.height * info.width;

	info.DicomImage = true;
	
	*/	

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
		if(dataset.elements.x00280100)		info.depth					= dataset.uint16('x00280100', 0);
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
		// we catch the error and display it to the user
		$('#parseError').text(err);
	}

	info.size = info.height * info.width;

	info.DicomImage = true;
	
	var dicomImage = new DicomImage(info, new Uint16Array(file, dataset.elements.x7fe00010.dataOffset, dataset.elements.x7fe00010.length/2));
//	var dicomImage = new DicomImage(info, jParser.getImageBuffer());
	
	return dicomImage;
};

ImageLoader.pushImage = function(image) {
	ImageLoader.imgs.push(image);
	if(ImageLoader.totalSize <= ImageLoader.imgs.length) {
		app.setVolume(VolumeFactory.createDicomVolume(ImageLoader.imgs));
		ImageLoader.imgs.length = 0;;
	}
};