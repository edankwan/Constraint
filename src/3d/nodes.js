var settings = require('../core/settings');
var THREE = require('three');
var shaderParse = require('../helpers/shaderParse');
var glslify = require('glslify');

var fbo = require('./fbo');
var math = require('../utils/math');

var undef;

exports.init = init;
exports.update = update;

var mesh = exports.mesh = undef;

var _geometry;
var _material;

function init() {

    var PARTICLE_AMOUNT = fbo.AMOUNT;
    var TEXTURE_SIZE = fbo.TEXTURE_SIZE;

    // use position x, y for the point
    var positions = new Float32Array(PARTICLE_AMOUNT  * 3);

    var i3;
    for(var i = 0; i < PARTICLE_AMOUNT; ++i ) {
        i3 = i * 3;
        positions[i3 + 0] = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
        positions[i3 + 1] = ~~(i / TEXTURE_SIZE) / TEXTURE_SIZE;
        positions[i3 + 2] = Math.pow(math.hash(20 + i * 31.512), 5);
    }
    _geometry = new THREE.BufferGeometry();
    _geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
    _material = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.merge( [
            THREE.UniformsLib.fog,
            THREE.UniformsLib.shadowmap, {
            texturePosition: { type: 't', value: null },
            alpha: { type: 'f', value: 1 }
        }]),
        vertexShader: shaderParse(glslify('../glsl/node.vert')),
        fragmentShader: shaderParse(glslify('../glsl/node.frag')),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        fog: true
    });

    mesh = exports.mesh = new THREE.Points(_geometry, _material);

}

function update(dt) {

    mesh.visible = settings.useWhiteNodes;

    var positionRenderTarget = fbo.positionRenderTarget;
    _material.uniforms.texturePosition.value = positionRenderTarget;
    _material.uniforms.alpha.value = 1 - settings.whiteRatio * 0.9;

}
