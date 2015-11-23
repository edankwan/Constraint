
// chunk(common);
// chunk(fog_pars_fragment);
// chunk(shadowmap_pars_fragment);

#ifdef USE_BILLBOARD

#else

    varying float vAlpha;

#endif

void main() {

    vec3 outgoingLight = vec3(1.0);

    // chunk(shadowmap_fragment);

    outgoingLight *= 0.1 + pow(shadowMask, vec3(1.5)) * 0.9;

    // chunk(fog_fragment);
    // chunk(linear_to_gamma_fragment);


    #ifdef USE_BILLBOARD

        gl_FragColor = vec4( outgoingLight, 1.0 );

    #else

        float d = length(gl_PointCoord.xy - .5) * 2.0;

        gl_FragColor = vec4( outgoingLight, vAlpha ) * (1.0 - step(1.0, d)) ;

    #endif
}
