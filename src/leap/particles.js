var settings = require('./settings');
var THREE = require('three');

var fbo = require('./fbo');
var shaderParse = require('../helpers/shaderParse');
var glslify = require('glslify');

var undef;

var mesh = exports.mesh = undef;
exports.init = init;
exports.update = update;

var _geometry;
var _material;
var _distanceMaterial;

function init(renderer, hands) {

    fbo.init(renderer, hands);

    _initGeometry();
    _initMaterial();

    if(settings.useBillboardParticle) {
        mesh = exports.mesh = new THREE.Mesh( _geometry, _material );
    } else {
        mesh = exports.mesh = new THREE.Points( _geometry, _material );
    }

    // mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.customDistanceMaterial = _distanceMaterial;

}

function _initGeometry() {

    var TEXTURE_SIZE = fbo.TEXTURE_SIZE;
    var AMOUNT = fbo.AMOUNT;
    _geometry = new THREE.BufferGeometry();

    var i, position, fboUV;

    if(settings.useBillboardParticle) {
        position = new Float32Array(AMOUNT * 3 * 3);
        fboUV = new Float32Array(AMOUNT * 3 * 2);

        var positionFlip = new Float32Array(AMOUNT * 3 * 3);
        _geometry.addAttribute( 'positionFlip', new THREE.BufferAttribute( positionFlip, 3 ));

        var angle = Math.PI * 2 / 3;
        var i6, i9;
        for( i = 0; i < AMOUNT; i++ ) {
            i6 = i * 6;
            i9 = i * 9;
            position[ i9 + 0] = Math.sin(angle * 2 + Math.PI);
            position[ i9 + 1] = Math.cos(angle * 2 + Math.PI);
            position[ i9 + 3] = Math.sin(angle + Math.PI);
            position[ i9 + 4] = Math.cos(angle + Math.PI);
            position[ i9 + 6] = Math.sin(angle * 3 + Math.PI);
            position[ i9 + 7] = Math.cos(angle * 3 + Math.PI);

            positionFlip[ i9 + 0] = Math.sin(angle * 2);
            positionFlip[ i9 + 1] = Math.cos(angle * 2);
            positionFlip[ i9 + 3] = Math.sin(angle);
            positionFlip[ i9 + 4] = Math.cos(angle);
            positionFlip[ i9 + 6] = Math.sin(angle * 3);
            positionFlip[ i9 + 7] = Math.cos(angle * 3);

            fboUV[ i6 + 0] = fboUV[ i6 + 2] = fboUV[ i6 + 4] = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
            fboUV[ i6 + 1 ] = fboUV[ i6 + 3 ] = fboUV[ i6 + 5 ] = ~~(i / TEXTURE_SIZE) / TEXTURE_SIZE;
        }
    } else {
        position = new Float32Array(AMOUNT * 3);
        fboUV = new Float32Array(AMOUNT * 2);
        var i2;
        for( i = 0; i < AMOUNT; i++ ) {
            i2 = i * 2;
            fboUV[ i2 + 0] = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
            fboUV[ i2 + 1 ] = ~~(i / TEXTURE_SIZE) / TEXTURE_SIZE;
        }
    }
    _geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ));
    _geometry.addAttribute( 'fboUV', new THREE.BufferAttribute( fboUV, 2 ));
}

function _initMaterial() {

    _material = new THREE.ShaderMaterial( {
        uniforms: {
            texturePosition: { type: 't', value: null },
            flipRatio: { type: 'f', value: 0 },

            fogDensity : { type: 'f', value: 0.00025 },
            fogNear : { type: 'f', value: 1 },
            fogFar : { type: 'f', value: 2000 },
            fogColor : { type: 'c', value: new THREE.Color( 0xffffff ) },

            shadowMap: { type: 'tv', value: [] },
            shadowMapSize: { type: 'v2v', value: [] },
            shadowBias : { type: 'fv1', value: [] },
            shadowDarkness: { type: 'fv1', value: [] },
            shadowMatrix : { type: 'm4v', value: [] }
        },
        defines: {
            USE_BILLBOARD : settings.useBillboardParticle
        },
        vertexShader: shaderParse(glslify('../glsl/leap/particle.vert')),
        fragmentShader: shaderParse(glslify('../glsl/leap/particle.frag')),
        transparent: settings.useBillboardParticle ? false : true,
        blending: settings.useBillboardParticle ? THREE.NoBlending : THREE.NormalBlending,
        depthTest: true,
        depthWrite: true,
        fog: true
    });


    _distanceMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            lightPos: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
            texturePosition: { type: 't', value: null },
            flipRatio: { type: 'f', value: 0 }
        },
        defines: {
            USE_BILLBOARD : settings.useBillboardParticle
        },
        vertexShader: shaderParse(glslify('../glsl/leap/distance.vert')),
        fragmentShader: shaderParse(glslify('../glsl/leap/distance.frag')),
        depthTest: true,
        depthWrite: true,
        side: THREE.BackSide
    });
}

function update() {
    var positionRenderTarget = fbo.update(0);
    mesh.material.uniforms.texturePosition.value = positionRenderTarget;
    mesh.customDistanceMaterial.uniforms.texturePosition.value = positionRenderTarget;
    if(settings.useBillboardParticle) {
        mesh.material.uniforms.flipRatio.value ^= 1;
        mesh.customDistanceMaterial.uniforms.flipRatio.value ^= 1;
    }

}
