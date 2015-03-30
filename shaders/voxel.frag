#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D volumeTexture1;
uniform sampler2D volumeTexture2;

uniform float numberOfSlices;

uniform float numberOfSlicesT1;
uniform float numberOfSlicesT2;

vec3 voxelVolumeIntersection(vec3 pos, float numberOfSlices1, float numberOfSlices2, sampler2D texture1, sampler2D texture2) ;

vec3 voxelVolume(vec3 pos, float numberOfSlices, sampler2D volumeTexture, float slice) ;

float voxel(vec3 pos) {
	vec3 rgb;
	
	float slice = pos.z * numberOfSlices;
	
#ifdef NUMBER_SLICES_2
	if(slice < numberOfSlicesT1) {
		rgb = voxelVolume(pos, numberOfSlicesT1, volumeTexture1, slice);
	} else if(slice < numberOfSlicesT1 + 1.0) {
		rgb = voxelVolumeIntersection(pos, numberOfSlicesT1 - 1.0, numberOfSlicesT2 - 1.0, volumeTexture1, volumeTexture2);
	} else if(slice < numberOfSlicesT1 + numberOfSlicesT2 + 1.0) {		
		rgb = voxelVolume(pos, numberOfSlicesT2, volumeTexture2, slice - numberOfSlicesT1);
	}
#else
	rgb = voxelVolume(pos, numberOfSlicesT1, volumeTexture1, slice);
#endif

	return rgb.b*255.0*65536.0 + rgb.g*65280.0 + rgb.r*255.0;
}