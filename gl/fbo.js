define(function () {
	'use strict';
	
	function FrameBufferObject() {
		this._fbo = gl.createFramebuffer();
		this.renderBuffer = {};
	}

	FrameBufferObject.prototype = {

		bind: function () {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
		},

		unbind: function () {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		},

		attachColor: function (tex, slot) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + slot, gl.TEXTURE_2D, tex.getTextureID(), 0);
		},

		createDepthRenderBuffer: function (width, height, type) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
			this.renderBuffer[type] = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer[type]);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, type, gl.RENDERBUFFER, this.renderBuffer[type]);
		},

		changeRenderBufferSize: function (width, height, type) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer[type]);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		}
		
	};
	
	return FrameBufferObject;
});