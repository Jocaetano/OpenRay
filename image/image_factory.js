var ImageFactory = ImageFactory || {};

ImageFactory.createC3DEImages = function(files) {
	ImageLoader.totalSize = files.length;

	for (var i = 0; i <  files.length; i++) {
		var reader = new FileReader();
		reader.onload = function(evt)     {
			ImageLoader.pushImage(ImageLoader.loadImage(evt.target.result));
		};
		reader.readAsArrayBuffer(files[i]);
	}
};

ImageFactory.createC3DEImagesFromWeb = function() {

	ImageLoader.totalSize = 300;
	
	for(var i = 100; i < 401; i++) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', './ANGIO_CT/IM-0001-0' + i + '.dcm', true);

		xhr.responseType = 'arraybuffer';

		xhr.onload = function(e) {
			ImageLoader.pushImage(ImageLoader.loadImage(this.response));
		};

		xhr.send();
	}
};

ImageFactory.createRAWFromWeb = function() {

	var xhr = new XMLHttpRequest();
	xhr.open('GET', './VOLUME_RAW/S7_300_300_300_3.8.raw', true);

	xhr.responseType = 'arraybuffer';

	xhr.onload = function(e) {
		var pixelSpacing = {x : 1, y : 1, z : 1};
		app.setVolume(VolumeFactory.createVolumefromRaw(this.response, 1, 300, 300, 300, pixelSpacing));
	};

	xhr.send();
};
