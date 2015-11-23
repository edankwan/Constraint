
// chunk(common);
// chunk(fog_pars_fragment);

varying float vAlpha;

void main() {

    vec3 outgoingLight = vec3(1.0);


    float d = 1.0 - step(1.0, length(gl_PointCoord.xy - .5) * 2.0);
    // float d = max(0.0, 1.0 - length(gl_PointCoord.xy - .5) * 2.0);
    float c = d * vAlpha;

    // chunk(fog_fragment);
    // chunk(linear_to_gamma_fragment);

    gl_FragColor = vec4(outgoingLight * c, 1.0);
}
