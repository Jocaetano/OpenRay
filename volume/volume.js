
function Volume(densityLimits, imageInfo) {
	this._imageWidth = imageInfo.width;
	this._imageHeight = imageInfo.height;
	this._minDensity = densityLimits.first;
	this._maxDensity = densityLimits.second;
	this._imgContainer = new Array();
	this._boundDimDirty = true;
}

Volume.prototype.slice = function(begin, end) {
	assert(begin >= 0 && end <= this._imgContainer.length && (end - begin > 0), "sliceVolume");
	var volume = {};
	volume.length = end - begin;
	volume._imgContainer = this._imgContainer.slice(begin, end);
	volume._imageWidth = this._imageWidth;
	volume._minDensity = this._minDensity;
	
	return volume;
};

Volume.prototype.voxel = function(indices)	{
	var i = indices[0];
	var j = indices[1];
	var k = indices[2];

	var sliceArea =	this._imageWidth *	this._imageHeight;

	return [i + j * width + k * sliceArea];
};

Volume.prototype._recalculateBounding = function() {
	var max_x = 1, max_y = 1, max_z = Math.max(this._imgContainer.length, 1);

	for (var i = 0; i < this._imgContainer.length; i++) {
		var value;
		value = this._imgContainer[i].imageInfo.width;
		max_x = Math.max(value, max_x);

		value = this._imgContainer[i].imageInfo.height;
		max_y = Math.max(value, max_y);
	}

	var ps = this.getPixelSpacing();

	this._boundingBox = new Box([0,0,0], [max_x * ps.x, max_y *ps.y, max_z * ps.z]);
	this._dimensions = [max_x,max_y,max_z];
	this._boundDimDirty = false;
};

/**Inserts an image in the volume
 * @param image the image to be inserted in the volume
 */
Volume.prototype.insertImage = function(image) {
	this._boundDimDirty = true;
	this._imgContainer.push(image);
	var densityLimits = image.densityLimits();
	if(densityLimits.first < this._minDensity)
		this._minDensity = densityLimits.first;
	if(this._maxDensity < densityLimits.second)
		this._maxDensity = densityLimits.second;
	if (this._imgContainer.length == 2) {
		this._pixelSpacing = this.getPixelSpacing();
	}
};

/**Returns the Volume BoundingBox
 * @param return a Box representing the BoundingBox
 */
Volume.prototype.boundingBox = function() {
	if( this._boundDimDirty ) 
		this._recalculateBounding();
	return this._boundingBox;
};

function euclidianDistance(a, b) {

	var distance = Math.sqrt(Math.pow(a.x - b.x, 2.0) + Math.pow(a.y - b.y, 2.0) + Math.pow(a.z - b.z, 2.0));

	return distance;
}

Volume.prototype.getPixelSpacing = function() {
	var result = {};

	if(this._imgContainer.length == 2) {
		var firstInfo = this._imgContainer[0].imageInfo;
		var secondInfo = this._imgContainer[1].imageInfo;

		result.x = firstInfo.pixelSpacing.x;
		result.y = firstInfo.pixelSpacing.y;
		result.z = firstInfo.pixelSpacing.z || Math.min(firstInfo.sliceThickness, euclidianDistance(firstInfo.position, secondInfo.position));
	}else if(this._imgContainer.length > 2) {
		result = this._pixelSpacing;
	}

	return result;
};