
function Box(origin, corner) {
	this._origin = origin;
	this._corner = corner;
}

/**Calculates the parallelepiped width (x axis)
 */
Box.prototype.width = function() {
	return this._corner[0] - this._origin[0];
};

/**Calculates the parallelepiped depth (y axis)
 */
Box.prototype.depth = function() {
	return this._corner[1] - this._origin[1];
};

/**Calculates the parallelepiped height (z axis)
 */
Box.prototype.height = function() {
	return this._corner[2] - this._origin[2];
};

Box.prototype.center = function() {
	var _center = [
	        -((this._origin[0] + this._corner[0]) / 2.0),
			-((this._origin[1] + this._corner[1]) / 2.0),
			-((this._origin[2] + this._corner[2]) / 2.0)
			];
	
	return _center;
};

Box.prototype.translate = function(translation) {
	for(var i = 0; i < 3; i++) {
		this._origin[i] += translation[i];
		this._corner[i] += translation[i];
	}
};

Box.prototype.corner = function(index) {
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
};