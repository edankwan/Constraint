uniform vec2 resolution;

uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;
uniform float time;

const float INTERSECTION_PRECISION = 1.0;

#pragma glslify: random = require(glsl-random)

void main() {

    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec3 velocity = texture2D( textureVelocity, uv ).xyz;

    vec4 positionInfo = texture2D( texturePosition, uv );
    vec3 position = positionInfo.xyz;
    float brightness = positionInfo.w;

    position += velocity;

    float onEdgeRatio = smoothstep(190.0, 200.0, length(position));

    gl_FragColor = vec4(position, onEdgeRatio);

}
