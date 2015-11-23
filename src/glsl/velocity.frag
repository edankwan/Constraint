uniform vec2 resolution;
uniform float constraintRatio;
uniform vec3 mouse3d;

uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;

const float INTERSECTION_PRECISION = 1.0;

#pragma glslify: curl = require(./curl)
#pragma glslify: random = require(glsl-random)

void main() {

    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 velocityInfo = texture2D( textureVelocity, uv );
    vec3 velocity = velocityInfo.xyz;

    vec4 positionInfo = texture2D( texturePosition, uv );
    vec3 position = positionInfo.xyz;

    vec3 constraintPosition = texture2D( texturePosition, vec2(velocityInfo.w / resolution.x, uv.y) ).xyz;

    vec3 constraintVector = constraintPosition - position;
    float constraintDistance = length(constraintVector);

    vec3 mousePos = mouse3d - position;

    velocity *= 0.8;
    velocity += (1.0 - smoothstep(0.0, 800.0, length(mousePos))) * normalize(mousePos) * 0.5;
    velocity += curl(position * 0.1) * 0.75;
    velocity += constraintVector * (1.0 - smoothstep(0.0, 400.0, constraintDistance)) * constraintRatio;
    velocity += (-position) * smoothstep(195.0, 270.0, length(position)) * .03;

    gl_FragColor = vec4(velocity, velocityInfo.w );

}
