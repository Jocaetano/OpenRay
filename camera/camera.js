define(['glMatrix'], function (glm) {

	function Camera(zoom, translateX, translateY, objectRotationMatrix) {
		this.zoom = zoom || 0.0;
		this.translateX = translateX || 0.0;
		this.translateY = translateY || 0.0;
		this.objectRotationMatrix = objectRotationMatrix || glm.mat4.create();

		this.pos;
		this.mvMatrix = glm.mat4.create();
		this.pMatrix = glm.mat4.create();
	};

	Camera.prototype = {

		rotate: function (deltaX, deltaY) {
			var xRotationMatrix = glm.mat4.create();
			glm.mat4.rotateY(xRotationMatrix, xRotationMatrix,(deltaX / 60));

			var yRotationMatrix = glm.mat4.create();
			glm.mat4.rotateX(yRotationMatrix, yRotationMatrix,(deltaY / 60));

			var newRotationMatrix = glm.mat4.create();
			glm.mat4.multiply(newRotationMatrix, xRotationMatrix, yRotationMatrix);

			glm.mat4.multiply(this.objectRotationMatrix, newRotationMatrix, this.objectRotationMatrix);
		},

		translate: function (deltaX, deltaY) {
			this.translateX += deltaX;
			this.translateY -= deltaY;
		},

		changeZoom: function (delta) {
			this.zoom = -delta < 0 ? this.zoom * 0.9 : this.zoom * 1.1;
		},

		transform: function () {
			glm.mat4.identity(this.mvMatrix);
			glm.mat4.translate(this.mvMatrix, this.mvMatrix, [this.translateX, this.translateY, -800.0]);
			glm.mat4.multiply(this.mvMatrix, this.mvMatrix, this.objectRotationMatrix);
		},

		perspective: function () {
			glm.mat4.frustum(this.pMatrix, -10 * this.zoom, 10 * this.zoom, -10 * this.zoom, 10 * this.zoom, 200, 2500.0);
		},

		updatePos: function () {
			this.pos = glm.vec3.fromValues(0.0, 0.0, 1.0);
			glm.vec3.add(this.pos, this.pos, glm.vec3.fromValues(this.translateX, this.translateY, -800.0));
			glm.vec3.transformMat4(this.pos, this.pos, this.objectRotationMatrix);
			glm.vec3.normalize(this.pos, this.pos);
		}
	};

	return Camera;
});