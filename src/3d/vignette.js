var settings = require('../core/settings');
var THREE = require('three');

var undef;

var glslify = require('glslify');
var shaderParse = require('../helpers/shaderParse');

var mesh = exports.mesh = undef;

exports.init = init;
exports.resize = resize;
exports.update = update;

var _resolution;
var _uTime;

function init() {
    var geometry = new THREE.PlaneBufferGeometry( 2, 2);
    var material = new THREE.ShaderMaterial( {
        uniforms: {
            uAlpha : exports.alphaUniform = {type : 'f', value: 1 },
            uTime : _uTime = {type : 'f', value: 0 },
            uResolution : {type : 'v2', value: _resolution = new THREE.Vector2() }
        },
        vertexShader: shaderParse(glslify('../glsl/vignette.vert')),
        fragmentShader: shaderParse(glslify('../glsl/vignette.frag')),
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false
    });

    mesh = exports.mesh = new THREE.Mesh( geometry, material );
    mesh.frustumCulled = false;
    mesh.renderOrder = 1024;

}

function resize(width, height) {
    _resolution.set(width, height);
}

function update(dt) {
    _uTime.value = (_uTime.value + dt) % 15171;
}
