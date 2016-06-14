var settings = require('../core/settings');
var THREE = require('three');

var undef;

var glslify = require('glslify');
var shaderParse = require('../helpers/shaderParse');

var _copyShader;
var _velocityShader;
var _positionShader;
var _velocityRenderTarget;
var _velocityRenderTarget2;
var _positionRenderTarget;
var _positionRenderTarget2;

var _renderer;
var _fboMesh;
var _fboScene;
var _fboCamera;
var _time = 0;

var TEXTURE_SIZE = exports.TEXTURE_SIZE = settings.textureSize;
var AMOUNT = exports.AMOUNT = TEXTURE_SIZE * TEXTURE_SIZE;

exports.init = init;
exports.update = update;

exports.positionRenderTarget = undef;
exports.prevPositionRenderTarget = undef;

function init(renderer) {

    _renderer = renderer;

    var gl = _renderer.getContext();
    if ( !gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) ) {
        alert( 'No support for vertex shader textures!' );
        return;
    }
    if ( !gl.getExtension( 'OES_texture_float' )) {
        alert( 'No OES_texture_float support for float textures!' );
        return;
    }

    _fboScene = new THREE.Scene();
    _fboCamera = new THREE.Camera();
    _fboCamera.position.z = 1;

    _copyShader = new THREE.ShaderMaterial({
        uniforms: {
            resolution: { type: 'v2', value: new THREE.Vector2( TEXTURE_SIZE, TEXTURE_SIZE ) },
            texture: { type: 't', value: null }
        },
        vertexShader: shaderParse(glslify('../glsl/fbo.vert')),
        fragmentShader: shaderParse(glslify('../glsl/fboThrough.frag'))
    });

    _velocityShader = new THREE.ShaderMaterial({
        uniforms: {
            resolution: { type: 'v2', value: new THREE.Vector2( TEXTURE_SIZE, TEXTURE_SIZE ) },
            mouse3d: { type: 'v3', value: new THREE.Vector3() },
            texturePosition: { type: 't', value: null },
            textureVelocity: { type: 't', value: null },
            constraintRatio: { type: 'f', value: settings.constraintRatio },
            time: { type: 'f', value: 0 },
        },
        vertexShader: shaderParse(glslify('../glsl/fbo.vert')),
        fragmentShader: shaderParse(glslify('../glsl/velocity.frag')),
        blending: THREE.NoBlending,
        transparent: false,
        depthWrite: false,
        depthTest: false
    });

    _positionShader = new THREE.ShaderMaterial({
        uniforms: {
            resolution: { type: 'v2', value: new THREE.Vector2( TEXTURE_SIZE, TEXTURE_SIZE ) },
            texturePosition: { type: 't', value: null },
            textureVelocity: { type: 't', value: null },
            time: { type: 'f', value: 0 },
        },
        vertexShader: shaderParse(glslify('../glsl/fbo.vert')),
        fragmentShader: shaderParse(glslify('../glsl/position.frag')),
        blending: THREE.NoBlending,
        transparent: false,
        depthWrite: false,
        depthTest: false
    });

    _fboMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), _copyShader );
    _fboScene.add( _fboMesh );

    _velocityRenderTarget = new THREE.WebGLRenderTarget( TEXTURE_SIZE, TEXTURE_SIZE, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false
    });
    _velocityRenderTarget2 = _velocityRenderTarget.clone();
    _copyTexture(_createVelocityTexture(), _velocityRenderTarget);
    _copyTexture(_velocityRenderTarget, _velocityRenderTarget2);

    _positionRenderTarget = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false
    });
    _positionRenderTarget2 = _positionRenderTarget.clone();

    _copyTexture(_createPositionTexture(), _positionRenderTarget);
    _copyTexture(_positionRenderTarget, _positionRenderTarget2);

}

function _updateVelocity(dt) {

    // swap
    var tmp = _velocityRenderTarget;
    _velocityRenderTarget = _velocityRenderTarget2;
    _velocityRenderTarget2 = tmp;

    _fboMesh.material = _velocityShader;
    _velocityShader.uniforms.time.value = _time;
    _velocityShader.uniforms.textureVelocity.value = _velocityRenderTarget2;
    _velocityShader.uniforms.texturePosition.value = _positionRenderTarget;
    _renderer.render( _fboScene, _fboCamera, _velocityRenderTarget );
}

function _updatePosition(dt) {

    // swap
    var tmp = _positionRenderTarget;
    _positionRenderTarget = _positionRenderTarget2;
    _positionRenderTarget2 = tmp;

    _fboMesh.material = _positionShader;
    _positionShader.uniforms.time.value = _time;
    _positionShader.uniforms.textureVelocity.value = _velocityRenderTarget;
    _positionShader.uniforms.texturePosition.value = _positionRenderTarget2;
    _renderer.render( _fboScene, _fboCamera, _positionRenderTarget );
}

function _copyTexture(input, output) {
    _fboMesh.material = _copyShader;
    _copyShader.uniforms.texture.value = input;
    _renderer.render( _fboScene, _fboCamera, output );
}

function _createVelocityTexture() {
    var a = new Float32Array( AMOUNT * 4 );
    // vx, vy, vz, gl_FragCoord + 1 % texture_width
    //
    for ( var i = 0, len = a.length; i < len; i += 4 ) {
        a[ i + 0 ] = 0;
        a[ i + 1 ] = 0;
        a[ i + 2 ] = 0;
        a[ i + 3 ] = ((~~(i / 4) % TEXTURE_SIZE) + 1) % TEXTURE_SIZE; // "random" gl_FragCoord x
    }
    var texture = new THREE.DataTexture( a, TEXTURE_SIZE, TEXTURE_SIZE, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
}


function _createPositionTexture() {
    var a = new Float32Array( AMOUNT * 4 );
    // x, y, z
    for ( var i = 0, len = a.length; i < len; i += 4 ) {
        a[ i + 0 ] = (Math.random() - 0.5) * 1;
        a[ i + 1 ] = (Math.random() - 0.5) * 1;
        a[ i + 2 ] = (Math.random() - 0.5) * 1;
    }
    var texture = new THREE.DataTexture( a, TEXTURE_SIZE, TEXTURE_SIZE, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
}

function update(dt) {

    _time += dt;

    var mouse3dUniformValue = _velocityShader.uniforms.mouse3d.value;
    if(settings.followMouse) {
        mouse3dUniformValue.copy(settings.mouse3d);
    } else {
        mouse3dUniformValue.set(0.0, 0.0, -9999);
    }

    _velocityShader.uniforms.constraintRatio.value = settings.constraintRatio;

    _updateVelocity(dt);

    _updatePosition(dt);

    exports.positionRenderTarget = _positionRenderTarget;
    exports.prevPositionRenderTarget = _positionRenderTarget2;
}


