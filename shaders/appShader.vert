
attribute vec2 aVertexPosition;

uniform mat4 uPMatrix;

varying vec2 vTexCoord;

void main() {
   gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
   vTexCoord = aVertexPosition;
}
