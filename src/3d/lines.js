var settings = require('../core/settings');
var THREE = require('three');
var shaderParse = require('../helpers/shaderParse');
var glslify = require('glslify');

var fbo = require('./fbo');
var math = require('../utils/math');
var MeshMotionMaterial = require('./postprocessing/motionBlur/MeshMotionMaterial');

var undef;

exports.init = init;
exports.update = update;

var mesh = exports.mesh = undef;

var _geometry;
var _material;
var _depthMaterial;

function init() {

    var PARTICLE_AMOUNT = fbo.AMOUNT;
    var TEXTURE_SIZE = fbo.TEXTURE_SIZE;
    var LINE_AMOUNT = settings.lineAmount;

    // use position x, y for the pointA fboUv and z for line side
    var positions = new Float32Array(LINE_AMOUNT * 2 * 3);
    var oppositeUv = new Float32Array(LINE_AMOUNT * 2 * 2);

    var i4, i6, indexA, indexB;
    for(var i = 0; i < LINE_AMOUNT; ++i ) {
        i4 = i * 4;
        i6 = i * 6;
        indexA = i %  PARTICLE_AMOUNT;
        positions[i6 + 0] = oppositeUv[ i4 + 2] = (indexA % TEXTURE_SIZE) / TEXTURE_SIZE;
        positions[i6 + 1] = oppositeUv[ i4 + 3] = ~~(indexA / TEXTURE_SIZE) / TEXTURE_SIZE;
        positions[i6 + 2] = -1;

        indexB = ~~(math.hash(i * 100.0) * PARTICLE_AMOUNT);
        if(indexB === indexA) indexB = ( indexB + 1 ) % PARTICLE_AMOUNT;
        positions[i6 + 3] = oppositeUv[ i4 + 0] = (indexB % TEXTURE_SIZE) / TEXTURE_SIZE;
        positions[i6 + 4] = oppositeUv[ i4 + 1] = ~~(indexB / TEXTURE_SIZE) / TEXTURE_SIZE;
        positions[i6 + 5] = 1;
    }
    _geometry = new THREE.BufferGeometry();
    _geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
    _geometry.addAttribute( 'oppositeUv', new THREE.BufferAttribute( oppositeUv, 2 ));
    _material = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.merge( [
            THREE.UniformsLib.fog,
            THREE.UniformsLib.shadowmap, {
            texturePosition: { type: 't', value: null },
            whiteNodesRatio: { type: 'f', value: 1 },
            whiteRatio: { type: 'f', value: 1 }
        }]),
        vertexShader: shaderParse(glslify('../glsl/lines.vert')),
        fragmentShader: shaderParse(glslify('../glsl/lines.frag')),
        linewidth: 1,
        blending: THREE.NoBlending,
        fog: true
    });

    _depthMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            texturePosition: { type: 't', value: null },
        },
        vertexShader: shaderParse(glslify('../glsl/lineDepth.vert')),
        fragmentShader: shaderParse(glslify('../glsl/lineDepth.frag')),
        depthTest: true,
        depthWrite: true
    });

    mesh = exports.mesh = new THREE.LineSegments(_geometry, _material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.customDepthMaterial = _depthMaterial;

    // mesh.motionMaterial = new MeshMotionMaterial( {
    //     uniforms: {
    //         texturePosition: { type: 't', value: undef },
    //         texturePrevPosition: { type: 't', value: undef }
    //     },
    //     vertexShader: shaderParse(glslify('../glsl/linesMotion.vert')),
    //     depthTest: true,
    //     depthWrite: true,
    //     blending: THREE.NoBlending
    // });

}

function update(dt) {

    var positionRenderTarget = fbo.positionRenderTarget;
    _material.uniforms.texturePosition.value = positionRenderTarget;
    _depthMaterial.uniforms.texturePosition.value = positionRenderTarget;
    // mesh.motionMaterial.uniforms.texturePrevPosition.value = fbo.prevPositionRenderTarget;

    _material.uniforms.whiteNodesRatio.value = settings.whiteNodesRatio;
    _material.uniforms.whiteRatio.value = settings.whiteRatio;

}
