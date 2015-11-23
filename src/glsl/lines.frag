
// chunk(common);
// chunk(fog_pars_fragment);
// chunk(shadowmap_pars_fragment);

varying float vBrightness;
varying float vSide;
varying float vAlpha;

uniform float whiteRatio;

void main() {

    vec3 outgoingLight = vec3(1.0);

    // chunk(shadowmap_fragment);

    outgoingLight = 0.05 + pow(shadowMask, vec3(1.5 - whiteRatio * 1.0)) * 0.95 + vBrightness * (1.0 - whiteRatio * 0.65);

    // chunk(fog_fragment);
    // chunk(linear_to_gamma_fragment);

    gl_FragColor = vec4(outgoingLight, 1.0);
}
