(function () {

	var º = {};

	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('box',factory);
		else
			º.Box = factory();
	} (this,
	
		function () {
			'use strict';
	
			function Box(origin, corner) {
				this._origin = origin;
				this._corner = corner;
			}
	
			Box.prototype = {
				//Calculates the parallelepiped width (x axis)
				width: function () {
					return this._corner[0] - this._origin[0];
				},
	
				//Calculates the parallelepiped depth (y axis)
				depth: function () {
					return this._corner[1] - this._origin[1];
				},
	
				//Calculates the parallelepiped height (z axis)
				height: function () {
					return this._corner[2] - this._origin[2];
				},
	
				center: function () {
					var _center = [
						-((this._origin[0] + this._corner[0]) / 2.0),
						-((this._origin[1] + this._corner[1]) / 2.0),
						-((this._origin[2] + this._corner[2]) / 2.0)
					];
	
					return _center;
				},
	
				translate: function (translation) {
					for (var i = 0; i < 3; i++) {
						this._origin[i] += translation[i];
						this._corner[i] += translation[i];
					}
				},
	
				corner: function (index) {
					switch (index) {
						case 0:
							return this._origin;
						case 1:
							return [this._corner[0], this._origin[1], this._origin[2]];
						case 2:
							return [this._origin[0], this._corner[1], this._origin[2]];
						case 3:
							return [this._corner[0], this._corner[1], this._origin[2]];
						case 4:
							return [this._origin[0], this._origin[1], this._corner[2]];
						case 5:
							return [this._corner[0], this._origin[1], this._corner[2]];
						case 6:
							return [this._origin[0], this._corner[1], this._corner[2]];
						case 7:
							return this._corner;
					}
				}
			};
	
			return Box;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('volume',['box'], factory);
		else
			º.Volume = factory(º.Box);
	} (this,
	
		function (Box) {
			'use strict';
	
			function _euclidianDistance(a, b) {
				return Math.sqrt(Math.pow(a.x - b.x, 2.0) + Math.pow(a.y - b.y, 2.0) + Math.pow(a.z - b.z, 2.0));
			}
	
			function Volume(densityLimits, imageInfo, images) {
				this._imageWidth = imageInfo.width;
				this._imageHeight = imageInfo.height;
				this._minDensity = densityLimits.first;
				this._maxDensity = densityLimits.second;
				this._imgContainer = [];
				this._boundDimDirty = true;
				this._rescaleSlope = imageInfo.rescaleSlope || 1;
				this._rescaleIntercept = imageInfo.rescaleIntercept || 0;
				this._rescale = imageInfo.rescaleIntercept - this._minDensity;
	
				if (images) {
					for (var i = 0, ii = images.length; i < ii; i++)
						this.insertImage(images[i]);
					this.calculatePixelSpacing();
				}
			}
	
			Volume.prototype = {
	
				slice: function (begin, end) {
					var volume = {};
					volume.length = end - begin;
					volume._imgContainer = this._imgContainer.slice(begin, end);
					volume._imageWidth = this._imageWidth;
					volume._minDensity = this._minDensity;
	
					return volume;
				},
	
				_recalculateBounding: function () {
					var max_x = 1, max_y = 1, max_z = Math.max(this._imgContainer.length, 1);
	
					for (var i = 0, ii = this._imgContainer.length; i < ii; i++) {
						var value;
						value = this._imgContainer[i].imageInfo.width;
						max_x = Math.max(value, max_x);
	
						value = this._imgContainer[i].imageInfo.height;
						max_y = Math.max(value, max_y);
					}
	
					this._boundingBox = new Box([0, 0, 0], [max_x * this._pixelSpacing.x, max_y * this._pixelSpacing.y, max_z * this._pixelSpacing.z]);
					this._dimensions = [max_x, max_y, max_z];
					this._boundDimDirty = false;
				},
		
				/*Inserts an image in the volume
				@param image the image to be inserted in the volume
				 */
				insertImage: function (image) {
					this._boundDimDirty = true;
					this._imgContainer.push(image);
					var densityLimits = image.densityLimits();
					if (densityLimits.first < this._minDensity)
						this._minDensity = densityLimits.first;
					if (densityLimits.second > this._maxDensity)
						this._maxDensity = densityLimits.second;
				},
		
				/*Inserts a group of images in the volume
				@param images : a array of images to be inserted in the volume
				*/
				insertImages: function (images) {
					for (var i = 0, ii = images.length; i < ii; i++)
						this.insertImage(images[i]);
				},
		
				/*Returns the Volume BoundingBox
				@param return a Box representing the BoundingBox
				*/
				boundingBox: function () {
					if (this._boundDimDirty)
						this._recalculateBounding();
					return this._boundingBox;
				},
	
				calculatePixelSpacing: function () {
					if (!this._pixelSpacing) {
						this._pixelSpacing = { 'x': -1 >>> 0, 'y': -1 >>> 0, 'z': -1 >>> 0 };
						var firstInfo = this._imgContainer[0].imageInfo;
						var secondInfo = this._imgContainer[1].imageInfo;
	
						this._pixelSpacing.x = firstInfo.pixelSpacing.x;
						this._pixelSpacing.y = firstInfo.pixelSpacing.y;
						this._pixelSpacing.z = firstInfo.pixelSpacing.z || Math.min(firstInfo.sliceThickness, _euclidianDistance(firstInfo.position, secondInfo.position));
					}
	
					return this._pixelSpacing;
				},
	
				getPixelSpacing: function () {
					return this._pixelSpacing;
				}
			};
	
			return Volume;
		}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('image',factory);
		else
			º.DicomImage = factory();
	} (this,
	
		function () {
			'use strict';
	
			function DicomImage(info, buffer) {
				this.imageInfo = info;
				this.min = -1; //int16
				this.max = -1; //int16
	
				this.buffer = buffer;
	
				switch (this.imageInfo.bitsAllocated) {
					case 0:
						this.generateRGBData = this.from8toRGB;
						break;
					case 1:
						if (this.buffer instanceof Int16Array)
							this.generateRGBData = this.fromInt16toRGB;
						else
							this.generateRGBData = this.fromUint16toRGB;
						break;
					case 2:
						this.generateRGBData = function () { return console.log("24bit per sample not supported"); };
						break;
					case 3:
						this.generateRGBData = function () { return console.log("32bit per sample not supported"); };
						break;
					default:
						this.generateRGBData = function () { return console.log(this.imageInfo.bitsAllocated); };
				}
			};
	
			DicomImage.prototype = {
	
				densityLimits: function () {
					this.min = this.buffer[0];
					this.max = this.min;
	
					for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
						var value = this.buffer[i];
						if (value < this.min) {
							this.min = value;
							continue;
						}
						if (value > this.max)
							this.max = value;
					}
	
					return {
						'first': this.min * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept,
						'second': this.max * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept
					};
				},
	
				//16 bits to 24 bits(RGB)
				generateRGBData: function (array) { },
	
				fromUint16toRGB: function (array) {
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
	
					var index = 0;
					for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
						int16View[0] = this.buffer[i];
						index = 3 * i;
						array[index] = int8View[0];
						array[index + 1] = int8View[1];
						//		array[index+2] = 0; this byte is never used
					}
				},
	
				fromInt16toRGB: function (array) {
					var buffer = new ArrayBuffer(2);
					var int16View = new Int16Array(buffer);
					var int8View = new Uint8Array(buffer);
	
					var index = 0;
					for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
						int16View[0] = this.buffer[i] - this.min;
						index = 3 * i;
						array[index] = int8View[0];
						array[index + 1] = int8View[1];
					}
				},
	
				from8toRGB: function (array) {
					var index = 0;
					if (this.imageInfo.invert)
						for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
							index = 3 * i;
							array[index] = !this.buffer[i];
						}
					else
						for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
							index = 3 * i;
							array[index] = this.buffer[i];
						}
				},
	
				//operation moved to gpu
				calculateHULookup: function (bufferArray) {
					var newBuffer = new ArrayBuffer(bufferArray.byteLength);
					this.buffer = new Int16Array(newBuffer);
	
					for (var i = 0, ii = this.imageInfo.size; i < ii; ++i) {
						this.buffer[i] = bufferArray[i] * this.imageInfo.rescaleSlope + this.imageInfo.rescaleIntercept;
					}
				}
			};
	
			return DicomImage;
		}));
	
	
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('imageLoader',factory);
		else
			º.ImageLoaderWorker = factory();
	} (this,
	
		function () {
		'use strict';
	
		var workerBlobURL = URL.createObjectURL(new Blob(['(' +
	
			function () {
	
				postMessage(false);
		
				//THIS IS FROM cornerstoneWADOImageLoader
				function _extractUncompressedPixels(dataset, width, height) {
					var pixelFormat = _getPixelFormat(dataset);
					var pixelDataElement = dataset.elements.x7fe00010;
					var pixelDataOffset = pixelDataElement.dataOffset;
					var numPixels = width * height;
					// Note - we may want to sanity check the rows * columns * bitsAllocated * samplesPerPixel against the buffer size
	
					if (pixelFormat === 1)
						return new Uint8Array(dataset.byteArray.buffer, pixelDataOffset, numPixels);
					else if (pixelFormat === 2)
						return new Uint16Array(dataset.byteArray.buffer, pixelDataOffset, numPixels);
					else if (pixelFormat === 3)
						return new Int16Array(dataset.byteArray.buffer, pixelDataOffset, numPixels);
				};
		
				//THIS IS FROM cornerstoneWADOImageLoader
				function _extractJPEG2000Pixels(dataset, width, height, frame) {
					var compressedPixelData = dicomParser.readEncapsulatedPixelData(dataset, dataset.elements.x7fe00010, frame);
					var jpxImage = new JpxImage();
					jpxImage.parse(compressedPixelData);
	
					var j2kWidth = jpxImage.width;
					var j2kHeight = jpxImage.height;
					if (j2kWidth !== width) {
						throw 'JPEG2000 decoder returned width of ' + j2kWidth + ', when ' + width + ' is expected';
					}
					if (j2kHeight !== height) {
						throw 'JPEG2000 decoder returned width of ' + j2kHeight + ', when ' + height + ' is expected';
					}
					var tileComponents = jpxImage.tile;
					var pixelData = tileComponents.items;
					return pixelData;
				};
	
				//THIS IS FROM cornerstoneWADOImageLoader
				function _getPixelFormat(dataset) {
					var pixelRepresentation = dataset.uint16('x00280103');
					var bitsAllocated = dataset.uint16('x00280100');
					if (pixelRepresentation === 0 && bitsAllocated === 8) {
						return 1; // unsigned 8 bit
					} else if (pixelRepresentation === 0 && bitsAllocated === 16) {
						return 2; // unsigned 16 bit
					} else if (pixelRepresentation === 1 && bitsAllocated === 16) {
						return 3; // signed 16 bit data
					}
				};
	
				onmessage = function (msg) {
	
					if (msg.data.url) {
						importScripts(msg.data.url + '/thirdy/dicomParser/dicomParser.min.js');
						importScripts(msg.data.url + '/thirdy/jpeg/jpx.js');
						return;
					}
	
					var info = {};
	
					var dataset = dicomParser.parseDicom(new Uint8Array(msg.data));
	
					//(0028, 0030) PixelSpacing
					if (dataset.elements.x00280030) {
						info.pixelSpacing = { x: dataset.floatString('x00280030', 0), y: dataset.floatString('x00280030', 1) };
					}
	
					//(0020, 0037) ImageOrientationPatient
					if (dataset.elements.x00200037) {
						info.xOrientation = { x: dataset.floatString('x00200037', 0), y: dataset.floatString('x00200037', 1), z: dataset.floatString('x00200037', 2) };
						info.yOrientation = { x: dataset.floatString('x00200037', 3), y: dataset.floatString('x00200037', 4), z: dataset.floatString('x00200037', 5) };
					}
	
					//(0020, 0032) ImagePositionPatient
					if (dataset.elements.x00200032) {
						info.position = { x: dataset.floatString('x00200032', 0), y: dataset.floatString('x00200032', 1), z: dataset.floatString('x00200032', 2) };
					}
	
					if (dataset.elements.x00280002) info.samplesPerPixel = dataset.uint16('x00280002', 0);
					if (dataset.elements.x00180050) info.sliceThickness = dataset.floatString('x00180050', 0);
					if (dataset.elements.x00200013) info.sliceNum = dataset.intString('x00200013', 0);
					if (dataset.elements.x00280103) info.pixelRepresentation = dataset.uint16('x00280103', 0);
					if (dataset.elements.x00280100) info.bitsAllocated = (dataset.uint16('x00280100', 0) >> 3) - 1;
					if (dataset.elements.x00280010) info.height = dataset.uint16('x00280010', 0);
					if (dataset.elements.x00280011) info.width = dataset.uint16('x00280011', 0);
					if (dataset.elements.x00281052) info.rescaleIntercept = dataset.floatString('x00281052', 0);
					if (dataset.elements.x00281053) info.rescaleSlope = dataset.floatString('x00281053', 0);
					if (dataset.elements.x00080008) info.imageType = dataset.string('x00080008', 0);
					if (dataset.elements.x00100010) info.patientName = dataset.string('x00100010', 0);
					if (dataset.elements.x00100040) info.patientSex = dataset.string('x00100040', 0);
					if (dataset.elements.x00101005) info.patientBirthDate = dataset.string('x00101005', 0);
					if (dataset.elements.x00101010) info.patientAge = dataset.intString('x00101010', 0);
					if (dataset.elements.x00280008) info.numberOfFrames = dataset.intString('x00280008', 0);
					if (dataset.elements.x00280009) info.frameIncrementPointer = dataset.floatString('x00280009', 0);
					if (dataset.elements.x00181063) info.frameTime = dataset.floatString('x00181063', 0);
					if (dataset.elements.x00181065) info.frameTimeVector = dataset.floatString('x00181065', 0);
	
					var photoMetricInterpretation;
					if (dataset.elements.x00280004) photoMetricInterpretation = dataset.string('x00280004', 0);
					info.invert = (photoMetricInterpretation === "MONOCHROME1");
					info.size = info.height * info.width;
	
					//THIS IS FROM cornerstoneWADOImageLoader
					if (photoMetricInterpretation === "RGB" ||
						photoMetricInterpretation === "PALETTE COLOR" ||
						photoMetricInterpretation === "YBR_FULL" ||
						photoMetricInterpretation === "YBR_FULL_422" ||
						photoMetricInterpretation === "YBR_PARTIAL_422" ||
						photoMetricInterpretation === "YBR_PARTIAL_420" ||
						photoMetricInterpretation === "YBR_RCT") {
						console.log("Color image not supported = " + photoMetricInterpretation);
					} else {
						var transferSyntax = dataset.string('x00020010');
	
						var imageData;
						if (transferSyntax === "1.2.840.10008.1.2.4.90" || // JPEG 2000 lossless
							transferSyntax === "1.2.840.10008.1.2.4.91") // JPEG 2000 lossy	(drop support?)
							imageData = _extractJPEG2000Pixels(dataset, info.width, info.height, 0);
						else
							imageData = _extractUncompressedPixels(dataset, info.width, info.height);
					}
	
					postMessage([info, imageData]);
				};
			}.toString()
	
			+ ')()'], { type: 'application/javascript' }));
	
		return workerBlobURL;
	}));
	(function (root, factory) {
		if (typeof define === 'function' && define.amd)
			define('volume_factory',['volume', 'image', 'imageLoader'], factory);
		else
			window.VolumeFactory = factory(º.Volume, º.DicomImage, º.ImageLoaderWorker);
	} (this,
	
		function (Volume, DicomImage, imgLoaderWorker) {
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
							if (!e.data) {
								worker.postMessage({ url: document.location.protocol + '//' + document.location.host });
								for (var i = start; i < end; i++)
									worker.postMessage(imagesFiles[i]);
							}
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
						workers[i] = new Worker(imgLoaderWorker);
						workers[i].onmessage = wOnMessage(workers[i], wLength * i, wLength * (i + 1));
					}
					workers[i] = new Worker(imgLoaderWorker);
					workers[i].onmessage = wOnMessage(workers[i], wLength * i, imagesFiles.length);
	
					window.URL.revokeObjectURL(imgLoaderWorker);
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
		}));
})();