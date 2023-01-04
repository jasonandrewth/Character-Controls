//ambientColor
uniform vec3 uColor;

// main function gets executed for every pixel
void main() {
  vec3 baseColour = vec3(1.0);

  baseColour = uColor;
  //this colors all fragments (pixels) in the same color (RGBA)
  gl_FragColor = vec4(baseColour, 1.0);
}
