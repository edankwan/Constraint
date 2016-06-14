uniform sampler2D texturePosition;
uniform sampler2D texturePrevPosition;

uniform mat4 u_prevModelViewMatrix;

varying vec2 v_motion;

void main() {

    vec4 positionInfo = texture2D( texturePosition, position.xy );
    vec4 prevPositionInfo = texture2D( texturePrevPosition, position.xy );

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(positionInfo.xyz, 1.0);
    vec4 prevPos = projectionMatrix * u_prevModelViewMatrix * vec4(prevPositionInfo.xyz, 1.0);

    v_motion = (pos.xy / pos.w - prevPos.xy / prevPos.w);

    gl_Position = pos;

}
