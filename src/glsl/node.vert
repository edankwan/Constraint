attribute vec2 oppositeUv;

uniform sampler2D texturePosition;
uniform float alpha;

varying float vAlpha;

// chunk(shadowmap_pars_vertex);
#pragma glslify: random = require(glsl-random)

void main() {

    vec3 pos = texture2D( texturePosition, position.xy ).xyz;

    vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    // chunk(shadowmap_vertex);

    float size = 3.0 + position.z * 80.0;

    vAlpha = position.z * smoothstep(190.0, 200.0, length(pos)) * alpha * pow(1.0 - position.z, 3.0) * 0.18;

    gl_PointSize = ( size * 500.0 / length( mvPosition.xyz ) );
    gl_Position = projectionMatrix * mvPosition;


}
