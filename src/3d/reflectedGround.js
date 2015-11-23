var settings = require('../core/settings');
var THREE = require('three');
var glslify = require('glslify');
var shaderParse = require('../helpers/shaderParse');
var math = require('../utils/math');
var lights = require('./lights');

var undef;

exports.init = init;
exports.updateReflectionTextureMatrix = updateReflectionTextureMatrix;
exports.renderReflection = renderReflection;
exports.update = update;

/**
 *
 * Work based on the threejs ocean example: http://threejs.org/examples/#webgl_shaders_ocean
 * @author jbouny / https://github.com/jbouny
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

var mesh = exports.mesh = undef;
var reflection = exports.reflection = undef;

var _clipBias;

var _renderer;
var _scene;
var _mirrorPlane;
var _normal;
var _mirrorWorldPosition;
var _cameraWorldPosition;
var _rotationMatrix;
var _lookAtPosition;
var _clipPlane;
var _camera;

var _textureMatrix;
var _mirrorCamera;
var _texture;
var _material;
var _uniforms;

var BLACK = new THREE.Color(0x000000);
var WHITE = new THREE.Color(0xb2b2b2);

function init(renderer, scene, camera) {

    _renderer = renderer;
    _scene = scene;
    _camera = camera;

    _initReflection();
    _initMesh();

}

function _initMesh() {
    var geometry = new THREE.PlaneGeometry( 4000, 4000 );
    mesh = exports.mesh = new THREE.Mesh( geometry, _material );

    mesh.position.y = -200;
    mesh.rotation.x = -1.57;
    mesh.receiveShadow = true;
}

function _initReflection() {

    reflection = exports.reflection = new THREE.Object3D();

    reflection.matrixNeedsUpdate = true;

    var width = 1024;
    var height =  1024 ;
    _clipBias =  0.0 ;

    _mirrorPlane = new THREE.Plane();
    _normal = new THREE.Vector3( 0, 0, 1 );
    _mirrorWorldPosition = new THREE.Vector3();
    _cameraWorldPosition = new THREE.Vector3();
    _rotationMatrix = new THREE.Matrix4();
    _lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
    _clipPlane = new THREE.Vector4();

    _textureMatrix = new THREE.Matrix4();
    _mirrorCamera = _camera.clone();
    _texture = new THREE.WebGLRenderTarget( width, height );

    _uniforms = THREE.UniformsUtils.merge( [
        THREE.UniformsLib.fog,
        THREE.UniformsLib.shadowmap
    ]);

    var normalsTexture = new THREE.Texture();
    normalsTexture.wrapS = normalsTexture.wrapT = THREE.RepeatWrapping;
    var img = new Image();
    img.src = 'images/normal.jpg';
    if(img.width) {
        normalsTexture.image = img;
        normalsTexture.needsUpdate = true;
    } else {
        img.onload = function(){
            normalsTexture.image = img;
            normalsTexture.needsUpdate = true;
        };
    }
    _uniforms.normalSampler = { type: 't', value: normalsTexture};
    _uniforms.mirrorSampler = { type: 't', value: _texture};
    _uniforms.alpha = { type: 'f', value: 1.0 };
    _uniforms.time = { type: 'f', value: 0.0 };
    _uniforms.distortionScale =  { type: 'f', value: 20.0 };
    _uniforms.textureMatrix =   { type: 'm4', value: _textureMatrix };
    _uniforms.eye = { type: 'v3', value: new THREE.Vector3(0, 0, 0) };
    _uniforms.groundColor = { type: 'c', value: new THREE.Color() };
    _uniforms.lightPosition = { type: 'v3', value: lights.spot.position };

    _material = new THREE.ShaderMaterial( {
        vertexShader: shaderParse(glslify('../glsl/reflectedGround.vert')),
        fragmentShader: shaderParse(glslify('../glsl/reflectedGround.frag')),
        uniforms: _uniforms,
        transparent: true,
        fog: true
    });

    if ( ! THREE.Math.isPowerOfTwo( width ) || ! THREE.Math.isPowerOfTwo( height ) ) {

        _texture.generateMipmaps = false;
        _texture.minFilter = THREE.LinearFilter;

    }

    // updateReflectionTextureMatrix();
    // renderReflection();

}


function updateReflectionTextureMatrix () {

    mesh.updateMatrixWorld();
    _camera.updateMatrixWorld();

    _mirrorWorldPosition.setFromMatrixPosition( mesh.matrixWorld );
    _cameraWorldPosition.setFromMatrixPosition( _camera.matrixWorld );

    _rotationMatrix.extractRotation( mesh.matrixWorld );

    _normal.set( 0, 0, 1 );
    _normal.applyMatrix4( _rotationMatrix );

    var view = _mirrorWorldPosition.clone().sub( _cameraWorldPosition );
    view.reflect( _normal ).negate();
    view.add( _mirrorWorldPosition );

    _rotationMatrix.extractRotation( _camera.matrixWorld );

    _lookAtPosition.set( 0, 0, - 1 );
    _lookAtPosition.applyMatrix4( _rotationMatrix );
    _lookAtPosition.add( _cameraWorldPosition );

    var target = _mirrorWorldPosition.clone().sub( _lookAtPosition );
    target.reflect( _normal ).negate();
    target.add( _mirrorWorldPosition );

    mesh.up.set( 0, - 1, 0 );
    mesh.up.applyMatrix4( _rotationMatrix );
    mesh.up.reflect( _normal ).negate();

    _mirrorCamera.position.copy( view );
    _mirrorCamera.up = mesh.up;
    _mirrorCamera.lookAt( target );
    _mirrorCamera.aspect = _camera.aspect;

    _mirrorCamera.updateProjectionMatrix();
    _mirrorCamera.updateMatrixWorld();
    _mirrorCamera.matrixWorldInverse.getInverse( _mirrorCamera.matrixWorld );

    // Update the texture matrix
    _textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
                            0.0, 0.5, 0.0, 0.5,
                            0.0, 0.0, 0.5, 0.5,
                            0.0, 0.0, 0.0, 1.0 );
    _textureMatrix.multiply( _mirrorCamera.projectionMatrix );
    _textureMatrix.multiply( _mirrorCamera.matrixWorldInverse );

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining _technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    _mirrorPlane.setFromNormalAndCoplanarPoint( _normal, _mirrorWorldPosition );
    _mirrorPlane.applyMatrix4( _mirrorCamera.matrixWorldInverse );

    _clipPlane.set( _mirrorPlane.normal.x, _mirrorPlane.normal.y, _mirrorPlane.normal.z, _mirrorPlane.constant );

    var q = new THREE.Vector4();
    var projectionMatrix = _mirrorCamera.projectionMatrix;

    q.x = ( math.sign( _clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
    q.y = ( math.sign( _clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
    q.z = - 1.0;
    q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

    // Calculate the scaled plane vector
    var c = new THREE.Vector4();
    c = _clipPlane.multiplyScalar( 2.0 / _clipPlane.dot( q ) );

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[ 2 ] = c.x;
    projectionMatrix.elements[ 6 ] = c.y;
    projectionMatrix.elements[ 10 ] = c.z + 1.0 - _clipBias;
    projectionMatrix.elements[ 14 ] = c.w;

    var worldCoordinates = new THREE.Vector3();
    worldCoordinates.setFromMatrixPosition( _camera.matrixWorld );
    _material.uniforms.eye.value = worldCoordinates;

}

function renderReflection () {

    if ( mesh.matrixNeedsUpdate ) updateReflectionTextureMatrix();
    mesh.matrixNeedsUpdate = true;
    var visible = _material.visible;
    _material.visible = false;
    _renderer.render( _scene, _mirrorCamera, _texture, true );
    _material.visible = visible;

}

function update() {

    var useReflectedGround = settings.useReflectedGround;
    mesh.visible = useReflectedGround;
    _uniforms.groundColor.value.copy(BLACK).lerp(WHITE, settings.whiteRatio);

    if(useReflectedGround) {
        renderReflection();
    }
}
