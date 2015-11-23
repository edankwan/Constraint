attribute vec2 fboUV;
uniform sampler2D texturePosition;

#ifdef USE_BILLBOARD

    attribute vec3 positionFlip;
    uniform float flipRatio;

#else

    varying float vAlpha;

#endif

// chunk(shadowmap_pars_vertex);

void main() {

    vec4 posInfo = texture2D( texturePosition, fboUV );
    vec3 pos = posInfo.xyz;

    vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    #ifdef USE_BILLBOARD

        vec4 flipOffset = vec4(mix(position, positionFlip, flipRatio) * 0.5, 1.0);
        worldPosition += flipOffset;

    #else
        gl_PointSize = ( 500.0 / length( mvPosition.xyz ) );
        mvPosition.y += gl_PointSize * 0.5;

    #endif

    // chunk(shadowmap_vertex);


    #ifdef USE_BILLBOARD

        gl_Position = projectionMatrix * (mvPosition + flipOffset);

    #else

        vAlpha = smoothstep(0.0, 0.1, posInfo.w);
        gl_Position = projectionMatrix * mvPosition;

    #endif


}
