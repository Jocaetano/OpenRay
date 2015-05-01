precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D textureMap;

void main(void)
{
   gl_FragColor = texture2D(textureMap, vTexCoord);
}
