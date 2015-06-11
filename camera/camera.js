(function (root, factory) {
	if (typeof define === 'function' && define.amd)
		define(['glMatrix'], factory);
	else
		º.Camera = factory(window);
} (this,

	function (glm) {
		'use strict';

		function Camera(zoom, translateX, translateY, translateZ, objectRotationMatrix) {
			zoom = zoom || 1.0;
			translateX = translateX || 0.0;
			translateY = translateY || 0.0;
			translateZ = translateZ || 0.0;
			objectRotationMatrix = objectRotationMatrix || glm.mat4.create();

			this.pos = glm.vec3.fromValues(translateX, translateY, translateZ);

			this.mvMatrix = glm.mat4.create();
			glm.mat4.translate(this.mvMatrix, this.mvMatrix, [translateX, translateY, translateZ]);
			glm.mat4.multiply(this.mvMatrix, this.mvMatrix, objectRotationMatrix);

			this.pMatrix = glm.mat4.create();
			glm.mat4.frustum(this.pMatrix, -10 * zoom, 10 * zoom, -10 * zoom, 10 * zoom, 200, 2500.0);

			this.reset = this.reset(this.pos, this.mvMatrix, this.pMatrix);

			this._observers = [];
		};

		Camera.prototype = {

			addObserver: function (observerCallback) {
				this._observers.push(observerCallback);
			},

			notifyObservers: function () {
				this._observers.forEach(function (observerCallback) {
					observerCallback();
				});
			},

			rotate: function (deltaX, deltaY) {
				var xRotationMatrix = glm.mat4.create();
				glm.mat4.rotateY(xRotationMatrix, xRotationMatrix,(deltaX / 60));

				var yRotationMatrix = glm.mat4.create();
				glm.mat4.rotateX(yRotationMatrix, yRotationMatrix,(deltaY / 60));

				var newRotationMatrix = glm.mat4.create();
				glm.mat4.multiply(newRotationMatrix, xRotationMatrix, yRotationMatrix);

				glm.vec3.transformMat4(this.pos, this.pos, newRotationMatrix);
				glm.vec3.normalize(this.pos, this.pos);

				var translateX = this.mvMatrix[12];
				var translateY = this.mvMatrix[13];
				var translateZ = this.mvMatrix[14];
				this.mvMatrix[12] -= translateX;
				this.mvMatrix[13] -= translateY;
				this.mvMatrix[14] -= translateZ;
				glm.mat4.multiply(this.mvMatrix, newRotationMatrix, this.mvMatrix);
				this.mvMatrix[12] += translateX;
				this.mvMatrix[13] += translateY;
				this.mvMatrix[14] += translateZ;

				this.notifyObservers();
			},

			translate: function (deltaX, deltaY) {
				glm.vec3.add(this.pos, this.pos, glm.vec3.fromValues(deltaX, -deltaY, 0.0));
				glm.vec3.normalize(this.pos, this.pos);

				this.mvMatrix[12] += deltaX;
				this.mvMatrix[13] -= deltaY;

				this.notifyObservers();
			},

			changeZoom: function (delta) {
				var zoom = -delta < 0 ? 0.9 : 1.1;
				this.pMatrix[0] *= zoom;
				this.pMatrix[5] *= zoom;

				this.notifyObservers();
			},

			reset: function (pos, mvMatrix, pMatrix) {
				var posBak = glm.vec3.clone(pos);
				var mvMatrixBak = glm.mat4.clone(mvMatrix);
				var pMatrixBak = glm.mat4.clone(pMatrix);

				return function () {
					this.pos = posBak;
					glm.mat4.copy(this.mvMatrix, mvMatrixBak);
					glm.mat4.copy(this.pMatrix, pMatrixBak);

					this.notifyObservers();
				};
			}
		};

		return Camera;
	}));