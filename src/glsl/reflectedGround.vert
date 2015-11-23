uniform mat4 textureMatrix;
uniform float time;

varying vec4 mirrorCoord;
varying vec3 worldPosition3;

// chunk(shadowmap_pars_vertex);

void main() {

   vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
   worldPosition3 = worldPosition.xyz;
   mirrorCoord = textureMatrix * worldPosition;

    // chunk(shadowmap_vertex);

   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
