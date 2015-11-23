var quickLoader = require('quick-loader');
var dat = require('dat-gui');
var Stats = require('stats.js');
var css = require('dom-css');
var raf = require('raf');

var THREE = require('three');

var OrbitControls = require('./controls/OrbitControls');
var settings = require('./core/settings');

var fbo = require('./3d/fbo');
var lights = require('./3d/lights');
var lines = require('./3d/lines');
var nodes = require('./3d/nodes');
var ground = require('./3d/ground');
var vignette = require('./3d/vignette');
var reflectedGround = require('./3d/reflectedGround');
var math = require('./utils/math');

var undef;
var _gui;
var _stats;

var _width = 0;
var _height = 0;

var _control;
var _camera;
var _scene;
var _renderer;

var _isDown = false;
var _time = 0;
var _ray = new THREE.Ray();

var _initAnimation = 0;

var _logo;
var _footerItems;

var BLACK = new THREE.Color(0x222222);
var WHITE = new THREE.Color(0xeeeeee);

function init() {

    if(settings.useStats) {
        _stats = new Stats();
        css(_stats.domElement, {
            position : 'absolute',
            left : '0px',
            top : '0px',
            zIndex : 2048
        });

        document.body.appendChild( _stats.domElement );
    }

    settings.mouse = new THREE.Vector2();
    settings.mouse3d = _ray.origin;

    _renderer = new THREE.WebGLRenderer({
        antialias : true
    });
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _renderer.shadowMap.enabled = true;
    document.body.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.fog = new THREE.FogExp2( 0x222222, 0.001 );

    _camera = new THREE.PerspectiveCamera( 45, 1, 1, 3000);
    _camera.position.set(0, 500, 1200).normalize().multiplyScalar(1500);

    _control = new OrbitControls( _camera, _renderer.domElement );
    _control.minDistance = 600;
    _control.maxDistance = 1500;
    _control.minPolarAngle = 0.3;
    _control.maxPolarAngle = Math.PI / 2;
    _control.target.y = -30;
    _control.noPan = true;
    _control.update();

    fbo.init(_renderer);

    lights.init();
    _scene.add(lights.mesh);

    lines.init();
    _scene.add(lines.mesh);

    nodes.init();
    _scene.add(nodes.mesh);

    ground.init(_renderer);
    _scene.add(ground.mesh);

    vignette.init(_renderer);
    _scene.add(vignette.mesh);

    reflectedGround.init(_renderer, _scene, _camera);
    _scene.add(reflectedGround.mesh);

    _gui = new dat.GUI();
    var linesGui = _gui.addFolder('lines');
    linesGui.add(settings, 'constraintRatio', 0, 0.15).name('constraint ratio');
    linesGui.add(settings, 'followMouse').name('follow mouse');
    linesGui.add(settings, 'useWhiteNodes').name('white nodes');
    var envGui = _gui.addFolder('env');
    envGui.add(settings, 'useReflectedGround').name('reflected ground');
    envGui.add(settings, 'isWhite').name('white theme');
    envGui.add(vignette.mesh, 'visible').name('vignette');

    if(window.screen.width > 480) {
        linesGui.open();
        envGui.open();
    }

    _logo = document.querySelector('.logo');
    _footerItems = document.querySelectorAll('.footer span');

    window.addEventListener('resize', _onResize);
    window.addEventListener('mousedown', _onDown);
    window.addEventListener('mousemove', _onMove);
    window.addEventListener('mouseup', _onUp);
    window.addEventListener('touchstart', _bindTouch(_onDown));
    window.addEventListener('touchmove', _bindTouch(_onMove));
    window.addEventListener('touchend', _onUp);

    _time = Date.now();
    _onResize();
    _loop();

}

function _bindTouch(func) {
    return function (evt) {
        func(evt.changedTouches[0]);
    }
}

function _onDown(evt) {
    _isDown = true;
    _onMove(evt);
}

function _onMove(evt) {
    // if(_isDown) {
        settings.mouse.x = (evt.pageX / _width) * 2 - 1;
        settings.mouse.y = -(evt.pageY / _height) * 2 + 1;
    // }
}

function _onUp() {
    _isDown = false;
}

function _onResize() {
    _width = window.innerWidth;
    _height = window.innerHeight;

    vignette.resize(_width, _height);

    _camera.aspect = _width / _height;
    _camera.updateProjectionMatrix();
    _renderer.setSize(_width, _height);

}

function _loop() {
    var newTime = Date.now();
    raf(_loop);
    if(settings.useStats) _stats.begin();
    _render(newTime - _time);
    if(settings.useStats) _stats.end();
    _time = newTime;
}

function _render(dt) {

    settings.whiteRatio += ((settings.isWhite ? 1 : 0) - settings.whiteRatio) * 0.2;
    settings.whiteNodesRatio += ((settings.useWhiteNodes ? 1 : 0) - settings.whiteNodesRatio) * 0.1;

    _scene.fog.color.copy(BLACK).lerp(WHITE, settings.whiteRatio);
    _renderer.setClearColor(_scene.fog.color.getHex());
    vignette.alphaUniform.value = math.lerp(0.5, 0.2, settings.whiteRatio);

    _initAnimation = Math.min(_initAnimation + dt * 0.0002, 1);
    var zoomAnimation = Math.pow(_initAnimation, 2);

    _control.maxDistance = zoomAnimation === 1 ? 1500 : math.lerp(1500, 900, zoomAnimation);
    _control.update();

    // update mouse3d
    _camera.updateMatrixWorld();
    _ray.origin.setFromMatrixPosition( _camera.matrixWorld );
    _ray.direction.set( settings.mouse.x, settings.mouse.y, 0.5 ).unproject( _camera ).sub( _ray.origin ).normalize();
    _ray.origin.add( _ray.direction.multiplyScalar( _ray.origin.length() * 0.9 ) );

    lights.update(dt, _camera);
    fbo.update(dt);
    lines.update(dt);
    nodes.update(dt);
    vignette.update(dt);

    ground.update();
    reflectedGround.update();

    _renderer.render(_scene, _camera);

    document.documentElement.classList.toggle('is-white', settings.isWhite);
    var ratio = Math.min((1 - Math.abs(_initAnimation - 0.5) * 2) * 1.2, 1);
    var blur = (1 - ratio) * 10;
    _logo.style.display = ratio ? 'block' : 'none';
    if(ratio) {
        _logo.style.opacity = ratio;
        _logo.style.webkitFilter = 'blur(' + blur + 'px)';
        ratio = (0.8 + Math.pow(_initAnimation, 1.5) * 0.3);
        if(_width < 580) ratio *= 0.5;
        _logo.style.transform = 'scale3d(' + ratio + ',' + ratio + ',1)';
    }

    for(var i = 0, len = _footerItems.length; i < len; i++) {
        ratio = math.unLerp(0.5 + i * 0.01, 0.6 + i * 0.01, _initAnimation);
        _footerItems[i].style.transform = 'translate3d(0,' + ((1 - Math.pow(ratio, 3)) * 50) + 'px,0)';
    }

}

quickLoader.add('images/logo.png');
quickLoader.add('images/normal.jpg');
quickLoader.start(function(percent) {
    if(percent === 1) {
        init();
    }
});
