define(['volume', 'image'], function (Volume, DicomImage) {
	'use strict';

	function _C3DEImageOrderer(img1, img2) {
		return img1.imageInfo.sliceNum - img2.imageInfo.sliceNum;
	};

	function _createImagesFromRaw(fileBuffer, dcmInfo, pixelType, imageSize, nslices) {
		var imgContainer = [];
		var startByte = 0;
		
		var PixelArray;
		switch (pixelType) {
			case 0:
				PixelArray = Uint8Array;
				break;
			case 1:
				PixelArray = Uint16Array;
				break;
			case 2:
				break;
			case 3:
				PixelArray = Uint32Array;
				break;
			default:
				PixelArray = Uint8Array;
		}
		
		pixelType++;
		for (var i = 0; i < nslices; i++) {
			imgContainer.push(new DicomImage(dcmInfo, new PixelArray(fileBuffer, startByte, imageSize)));

			startByte += imageSize * pixelType;
		}

		return imgContainer;
	}

	return {

		createDicomVolume: function (imagesFiles, callback) {
			var images = [];
			var nWorkers = Math.min(imagesFiles.length, navigator.hardwareConcurrency || 2);
			var wLength = Math.floor(imagesFiles.length / nWorkers);
			var workers = [];
			function wOnMessage(worker, start, end) {
				return function (e) {
					if (!e.data)
						for (var i = start; i < end; i++)
							worker.postMessage(imagesFiles[i]);
					else {
						images.push(new DicomImage(e.data[0], e.data[1]));
						if (images.length == imagesFiles.length) {
							images.sort(_C3DEImageOrderer);
							callback(new Volume(images[0].densityLimits(), images[0].imageInfo, images));
						}
					}
				};
			}
			for (var i = 0; i < nWorkers - 1; i++) {
				workers[i] = new Worker('../image/image_loader.js');
				workers[i].onmessage = wOnMessage(workers[i], wLength * i, wLength * (i + 1));
			}
			workers[i] = new Worker('../image/image_loader.js');
			workers[i].onmessage = wOnMessage(workers[i], wLength * i, imagesFiles.length);
		},

		createVolumefromRaw: function (fileBuffer, pixelType, volumeSize, pixelSpacing) {
			var imageSize = volumeSize.width * volumeSize.height;
			
			var info = {};
			info.height = volumeSize.height;
			info.width = volumeSize.width;
			info.size = imageSize;
			info.pixelSpacing = pixelSpacing;
			info.bitsAllocated = pixelType;
			info.rescaleSlope = 1;
			info.rescaleIntercept = 0;

			var imgContainer = _createImagesFromRaw(fileBuffer, info, pixelType, imageSize, volumeSize.nslices);

			return new Volume(imgContainer[0].densityLimits(), info, imgContainer);;
		},
	};
});