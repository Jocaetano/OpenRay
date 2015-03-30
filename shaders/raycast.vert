attribute vec2 aVertexPosition;

uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * vec4(vec3(aVertexPosition, 0.0), 1.0);
}