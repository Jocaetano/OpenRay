define(['box'], function (Box) {
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
});