
function Color(r, g, b, a) {
	var color = new ArrayBuffer(4);
	this.color8 = new Uint8ClampedArray(color);
	this.color32 = new Uint32Array(color);
	this.color8[0] = r || 0;
	this.color8[1] = g || 0;
	this.color8[2] = b || 0;
	this.color8[3] = a || 0;
	
	this.r = this.color8[0];
	this.g = this.color8[1];
	this.b = this.color8[2];
	this.a = this.color8[3];
	this.rgba = this.color32[0];
}

Color.prototype.multiply = function(value) {
	return new Color(this.r * value, this.g * value, this.b * value, this.a * value);
};

Color.prototype.plus = function(color) {
	return new Color(this.r + color.r, this.g + color.g, this.b + color.b, this.a + color.a);
};

Color.prototype.minus = function(color) {
	return new Color(this.r - color.r, this.g - color.g, this.b - color.b, this.a - color.a);
};

Color.prototype.data = function() {
	return this.color8;
};

Color.prototype.data32 = function() {
	return this.color32;
};

Color.prototype.updateRGBA = function() {
	this.r = this.color8[0];
	this.g = this.color8[1];
	this.b = this.color8[2];
	this.a = this.color8[3];
};