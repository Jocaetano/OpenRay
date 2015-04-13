
precision highp float;

uniform sampler2D raysEndTexture;
uniform sampler2D transferFunctionTexture;

uniform float transferMinValue;
uniform float transferRangeValue;
uniform float samplingStep;
uniform vec2 textureSize;
uniform float volumeSpacing;
uniform vec3 volumeSize;

uniform vec3 viewVector;
uniform vec3 lightDirection;
uniform vec3 lightAmbientColor;
uniform vec3 lightDiffuseColor;
uniform vec3 lightSpecularColor;
uniform float lightShininess ;

uniform float numberOfSlices;

varying vec4 vColor;

vec3 voxelVolumeIntersection(vec3 pos, float slicesOverT1, float slicesOverT2, sampler2D texture1, sampler2D texture2, float slice) {
	vec2 texpos1, texpos2;
	float slice1 = floor(slice);
		
	float row1 = floor(slice1/slicesOverT1);
	float column1 = slice1 - (row1 * slicesOverT1);
		
	texpos1.x = (pos.x + column1)/slicesOverT1;
	texpos1.y = (pos.y + row1)/slicesOverT1;
		
	texpos2.x = (pos.x)/slicesOverT2;
	texpos2.y = (pos.y)/slicesOverT2;
		
	return mix(texture2D(texture1, texpos1).rgb, texture2D(texture2, texpos2).rgb, mod(slice, 1.0));
}

vec3 voxelVolume(vec3 pos, float numberOfSlices, sampler2D volumeTexture, float slice) {
	float slicesOver = ceil(sqrt(numberOfSlices) - 0.01);
	vec2 texpos1, texpos2;

	float slice1 = min(floor(slice), numberOfSlices - 1.0);
	float slice2 = min(slice1 + 1.0, numberOfSlices - 1.0);
		
	float row1 = floor(slice1/slicesOver);
	float column1 = slice1 - (row1 * slicesOver);
		
	float row2 = floor(slice2/slicesOver);
	float column2 = slice2 - (row2 * slicesOver);
		
	texpos1.x = (pos.x + column1)/slicesOver;
	texpos1.y = (pos.y + row1)/slicesOver;
		
	texpos2.x = (pos.x + column2)/slicesOver;
	texpos2.y = (pos.y + row2)/slicesOver;
		
	return mix(texture2D(volumeTexture, texpos1).rgb, texture2D(volumeTexture, texpos2).rgb, mod(slice, 1.0));
}

float voxel(vec3 pos) ;

vec4 compositeFrontToBack(vec4 color, vec4 sample) {
	float newAlpha = sample.a * (1.0 - color.a);
	return vec4(sample.rgb * newAlpha, newAlpha);
}

vec4 transfer(float value) {
	float pos = value / transferRangeValue;
	return texture2D(transferFunctionTexture, vec2(pos, 1.0));
}

vec3 gradientOnVolume(float v, vec3 pos) {
	vec3 gradStep = vec3(volumeSpacing) / volumeSize;

	float v0 = voxel(pos + vec3(gradStep.x, 0.0, 0.0));
	float v1 = voxel(pos + vec3(0.0, gradStep.y, 0.0));
	float v2 = voxel(pos + vec3(0.0, 0.0, gradStep.z));

	return vec3(v - v0, v - v1, v - v2);
}

vec3 gradientOnAlpha(float v, vec3 pos) {
	vec3 gradStep = vec3(volumeSpacing) / volumeSize;

	float v0 = transfer(voxel(pos + vec3(gradStep.x, 0.0, 0.0))).a;
	float v1 = transfer(voxel(pos + vec3(0.0, gradStep.y, 0.0))).a;
	float v2 = transfer(voxel(pos + vec3(0.0, 0.0, gradStep.z))).a;

	return vec3(v - v0, v - v1, v - v2);
}

vec3 gradient(float posValue, vec3 pos) {
#ifdef USE_GRADIENT_ON_ALPHA
	return gradientOnAlpha(posValue, pos);
#else
	return gradientOnVolume(posValue, pos);
#endif
}

vec4 shade(vec4 sample, vec3 normal) {
	vec3 halfVector = normalize(lightDirection + viewVector);

	float NdotL = max(0.0, dot(normal, normalize(lightDirection)));
	float NdotH = max(0.0, dot(normal, halfVector));

	vec3 ambient = lightAmbientColor;
	vec3 diffuse = NdotL * lightDiffuseColor * sample.rgb;
	vec3 specular = lightSpecularColor * pow(NdotH, lightShininess);

	return vec4(ambient + diffuse + specular, sample.a);
}

struct Ray {
    vec3 _origin;
    vec3 _dir;
};

void main() {
	vec2 pos = gl_FragCoord.xy / textureSize.x;

	vec4 rayStart = vColor;
	if (rayStart.a == 0.0) {
		discard;
	}

	vec4 rayEnd = texture2D(raysEndTexture, pos);

	vec3 v = rayEnd.xyz - rayStart.xyz;

	Ray ray = Ray(rayStart.xyz, normalize(normalize(v) * volumeSize) / volumeSize);
	float rayLength = length(v * volumeSize);

	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
	float d = samplingStep * 0.5;
	
	vec3 step = ray._dir * samplingStep;
	vec3 rayPos = ray._origin;

	for(float i = 0.0; i < 2000.0; i++) {
		if(d > rayLength || color.a >= 1.0) 
			break;
			
		rayPos += step;

		float value = voxel(rayPos);
		vec4 sample = transfer(value);
		
		if(sample.a > 0.0001) {
#ifdef USE_PHONG_SHADING
			vec3 grad = normalize(gradient(value, rayPos));
			vec4 shadedSample = shade(sample, grad); 

			color += compositeFrontToBack(color, shadedSample);
#else	
			color += compositeFrontToBack(color, sample);
#endif	
		}
		
		d += samplingStep;
	}
	
	gl_FragColor = color;
}
