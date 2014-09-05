#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler0;
uniform float width;
uniform float height;

void main(void) {
  vec4 color = texture2D(sampler0, vec2(gl_FragCoord.x / width,
                                        1.0 - gl_FragCoord.y / height));
  gl_FragColor = vec4(vec3(0.2126 * color.x + 0.7152 * color.y + 0.0722 * color.z), 1);
}

