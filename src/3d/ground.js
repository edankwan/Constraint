var settings = require('../core/settings');
var THREE = require('three');

var undef;

var mesh = exports.mesh = undef;
exports.init = init;
exports.update = update;

var _geometry;
var _material;

var BLACK = new THREE.Color(0x111111);
var WHITE = new THREE.Color(0xcccccc);

function init() {
    _geometry = new THREE.PlaneGeometry( 4000, 4000, 10, 10 );
    _material = new THREE.MeshPhongMaterial( {
        color: new THREE.Color(),
        transparent: true,
        shininess: 5
    });


    mesh = exports.mesh = new THREE.Mesh( _geometry, _material );
    mesh.position.y = -200;
    mesh.rotation.x = -1.57;
    mesh.castShadow = false;
    mesh.receiveShadow = true;

}

function update() {
    mesh.visible = !settings.useReflectedGround;
    _material.color.copy(BLACK).lerp(WHITE, settings.whiteRatio);
}
