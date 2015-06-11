function main() {
	console.log("WebGLStart");
	var glCanvas = document.getElementById("raywebgl");
	var gl = glCanvas.getContext('webgl');

	function startOpenRay(volume) {
		openray.init(gl, glCanvas.width, glCanvas.height, volume);
		openray.draw();
	}

	var dicomFiles = document.getElementById('dicomFiles');
	document.getElementById('dicomButton').addEventListener('click', function () {
		dicomFiles.dispatchEvent(new MouseEvent('click'));
	}, false);
	dicomFiles.addEventListener('change', function () {
		if (event.target.files.length < 2) {
			console.log('Need 2 or more images');
			return;
		}

		var totalSize = event.target.files.length;
		var imageFiles = [];

		var onloadF = function (evt) {
			imageFiles.push(evt.target.result);
			if (totalSize <= imageFiles.length) {
				VolumeFactory.createDicomVolume(imageFiles, startOpenRay);
			}
		};

		for (var i = 0, ii = event.target.files.length; i < ii; i++) {
			var reader = new FileReader();
			reader.onload = onloadF;
			reader.readAsArrayBuffer(event.target.files[i]);
		}
	}, false);
}