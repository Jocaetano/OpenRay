
define(['raycaster'], function (openray) {
	'use strict';
	
	//private
	var _gl;
	var _volume;
	var _width = 0;
	var _height = 0;
	var _running = false;
	
	//public	
    return {
		start: function (glContext, width, height) {
			_gl = glContext;
			_width = width, _height = height;
			this.raycaster = openray;
			this.modified = false;
			this.tick = this.tick.bind(this);
		},

		startRaycaster: function () {
			this.raycaster.init(_gl, _width, _height, _volume);
			_running = true;
			window.requestAnimationFrame(this.tick);
		},

		setVolume: function (volume) {
			_volume = volume;

			if (!_running)
				this.startRaycaster();
			else
				this.raycaster.setVolume(_volume);
		},

		tick: function () {
			window.requestAnimationFrame(this.tick);
			if (this.modified) {
				this.raycaster.draw();
				this.modified = false;
			}
		}
    };
});