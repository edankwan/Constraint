attribute vec2 oppositeUv;

uniform sampler2D texturePosition;
uniform float whiteNodesRatio;

varying float vBrightness;

// chunk(shadowmap_pars_vertex);

void main() {

    vec4 positionInfo = texture2D( texturePosition, position.xy );
    vec4 oppositePositionInfo = texture2D( texturePosition, oppositeUv );
    vec3 pos = positionInfo.xyz;
    float brightness = positionInfo.w;
    vec3 oppositePos = oppositePositionInfo.xyz;

    vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;
    vBrightness = brightness * whiteNodesRatio;

    // chunk(shadowmap_vertex);

    gl_Position = projectionMatrix * mvPosition;


}
