precision highp float;

uniform sampler2D mirrorSampler;
uniform float alpha;
uniform float time;
uniform float distortionScale;
uniform sampler2D normalSampler;
uniform vec3 eye;
uniform vec3 groundColor;
uniform vec3 lightPosition;

varying vec4 mirrorCoord;
varying vec3 worldPosition3;

#pragma glslify: random = require(glsl-random)

vec4 getNoise( vec2 uv )
{
    uv *= 22.0;
    vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
    vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
    vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
    vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
    vec4 noise = ( texture2D( normalSampler, uv0 ) ) +
       ( texture2D( normalSampler, uv1 ) ) +
       ( texture2D( normalSampler, uv2 ) ) +
       ( texture2D( normalSampler, uv3 ) );
   return noise * 0.5 - 1.0;
}

// chunk(common);
// chunk(fog_pars_fragment);
// chunk(shadowmap_pars_fragment);


void main()
{
    vec4 noise = getNoise( worldPosition3.xz );
    vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 2.0, 1.5 )  + (vec3( random(worldPosition3.xz), random(worldPosition3.xz + 20.0), random(worldPosition3.xz + 40.0) ) - 0.5) * 0.2 ) ;

    vec3 outgoingLight = vec3(1.0);

    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.1);

    vec3 worldToEye = eye-worldPosition3;
    vec3 eyeDirection = normalize( worldToEye );

    float d = length(worldToEye);

    vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / d ) * distortionScale;
    vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.z + distortion ) );

    float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
    float rf0 = 0.9;
    float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
    outgoingLight = mix( diffuseLight, ( reflectionSample + reflectionSample * specularLight ), reflectance );

    outgoingLight = pow(outgoingLight * 0.5, vec3(1.5));

    // the following is a super nasty way to hyjack the internal shadow
    // chunk_replace vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;
    vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;
    shadowCoord.xy += distortion * 3.0;
    // end_chunk_replace

    // chunk(shadowmap_fragment);

    vec3 lightDirection = lightPosition - worldPosition3;
    outgoingLight += (1.0 - smoothstep(500.0, 1400.0, length(lightDirection)) * (0.5 + surfaceNormal.z * 0.5)) * 0.1;

    outgoingLight *= 0.5 + shadowMask * 0.2 ;
    outgoingLight += theta * 0.15;

    outgoingLight += groundColor;

    // chunk(fog_fragment);
    // chunk(linear_to_gamma_fragment);

    gl_FragColor = vec4( outgoingLight, 1.0 );
}
