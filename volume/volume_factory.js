define(['volume', 'imageLoader', 'image'], function (Volume, ImageLoader, DicomImage) {
	var VolumeFactory = VolumeFactory || {};

	function _C3DEImageOrderer(img1, img2) {
		return img1.imageInfo.sliceNum - img2.imageInfo.sliceNum;
	};

	function _createImagesFromRaw(fileBuffer, dcmInfo, pixelType, imageSize, nslices) {
		var imgContainer = [];
		var bufferView;
		var startByte = 0;

		for (var i = 0; i < nslices; i++) {
			switch (pixelType) {
				case 1:
					bufferView = new Uint8Array(fileBuffer, startByte, imageSize);
					break;
				case 2:
					bufferView = new Uint16Array(fileBuffer, startByte, imageSize);
					break;
				case 3:
					bufferView = new Uint8Array(fileBuffer, startByte, imageSize * 3);
					break;
				case 4:
					bufferView = new Uint32Array(fileBuffer, startByte, imageSize);
					break;
				default:
					bufferView = new Uint8Array(fileBuffer, startByte, imageSize);
			}
			var image = new DicomImage(dcmInfo, bufferView);
			imgContainer.push(image);

			startByte += imageSize * pixelType;
		}

		return imgContainer;
	}

	return {

		createDicomVolume: function (imagesFiles) {
			var images = [];
			imagesFiles.forEach(function (element) {
				images.push(ImageLoader.loadImage(element));
			});
			images.sort(_C3DEImageOrderer);
			return new Volume(images[0].densityLimits(), images[0].imageInfo, images);;
		},

		createVolumefromRaw: function (fileBuffer, pixelType, volumeSize, pixelSpacing) {
			var imageSize = volumeSize.width * volumeSize.height;
			var info = {};
			info.height = volumeSize.height;
			info.width = volumeSize.width;
			info.size = imageSize;
			info.pixelSpacing = pixelSpacing;
			info.bitsAllocated = pixelType * 8;
			info.rescaleSlope = 1;
			info.rescaleIntercept = 0;

			var imgContainer = _createImagesFromRaw(fileBuffer, info, pixelType, imageSize, volumeSize.nslices);

			return new Volume(imgContainer[0].densityLimits(), info, imgContainer);;
		},
	};
});