varying vec2 vUv;
uniform vec2 uResolution;
uniform float uAlpha;
uniform float uTime;

const float sqrt2 = 1.41421356237309;
#pragma glslify: noise = require(./noise)

void main() {

    vec2 toCenter = gl_FragCoord.xy / uResolution - 0.5;
    float angle = atan(toCenter.y / toCenter.x);

    float a = smoothstep(0.3 + 0.3 * noise(angle * 32313.12513 + uTime) , sqrt2, max(length(toCenter) * 2.0, 0.0));

    gl_FragColor = vec4(0.0, 0.0, 0.0, a * uAlpha);
}
