
function Color(r, g, b) {
	this.r = r || 0.0;
	this.g = g || 0.0;
	this.b = b || 0.0;
}

Color.prototype.multiply = function(value) {
	return new Color(this.r * value, this.g * value, this.b * value);
};

Color.prototype.plus = function(color) {
	return new Color(this.r + color.r, this.g + color.g, this.b + color.b);
};

Color.prototype.minus = function(color) {
	return new Color(this.r - color.r, this.g - color.g, this.b - color.b);
};

Color.prototype.data = function() {
	return [this.r, this.g, this.b];
};