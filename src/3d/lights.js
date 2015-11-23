var settings = require('../core/settings');
var THREE = require('three');

var undef;

var mesh = exports.mesh = undef;
var spot = exports.spot = undef;
exports.init = init;
exports.update = update;

var _moveTime = 0;

function init() {

    mesh = exports.mesh = new THREE.Object3D();

    var ambient = new THREE.AmbientLight( 0x999999 );
    mesh.add( ambient );

    spot = exports.spot = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2, 1 );
    spot.position.x = 200;
    spot.position.y = 500;
    spot.position.z = 200;
    spot.target.position.set( 0, 0, 0 );

    spot.castShadow = true;

    spot.shadowCameraNear = 100;
    spot.shadowCameraFar = 2500;
    spot.shadowCameraFov = 90;

    spot.shadowBias = 0.00003;
    spot.shadowDarkness = 1;

    spot.shadowMapWidth = 1024;
    spot.shadowMapHeight = 2048;

    mesh.add( spot );

}

function update(dt, camera) {
    _moveTime += 0;//dt * settings.lightSpeed;
    var angle = _moveTime * 0.0005 - 0.2;
    // mesh.position.x = Math.cos(angle) * 400;
    // mesh.position.z = Math.sin(angle) * 400;

}
