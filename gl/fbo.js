define(function () {
	'use strict';
	
	function FrameBufferObject(glContext) {
		this._gl = glContext;
		this._fbo = this._gl.createFramebuffer();
		this.renderBuffer = {};
	}

	FrameBufferObject.prototype = {

		bind: function () {
			this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
		},

		unbind: function () {
			this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
		},

		attachColor: function (tex, slot) {
			this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0 + slot, this._gl.TEXTURE_2D, tex.getTextureID(), 0);
		},

		createDepthRenderBuffer: function (width, height, type) {
			this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
			this.renderBuffer[type] = this._gl.createRenderbuffer();
			this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this.renderBuffer[type]);
			this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, width, height);

			this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, type, this._gl.RENDERBUFFER, this.renderBuffer[type]);
		},

		changeRenderBufferSize: function (width, height, type) {
			this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fbo);
			this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this.renderBuffer[type]);
			this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, width, height);
		}
		
	};
	
	return FrameBufferObject;
});