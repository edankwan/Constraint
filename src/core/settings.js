var parse = require('mout/queryString/parse');
var keys = require('mout/object/keys');
var query = exports.query = parse(window.location.href.replace('#','?'));

// need restart
exports.useStats = false;
exports.textureSize = 128;
exports.lineAmount = 65536;

// lines
exports.followMouse = false;
exports.constraintRatio = 0.07;
exports.useWhiteNodes = false;
exports.whiteNodesRatio = 1;

exports.useReflectedGround = true;

exports.isWhite = false;
exports.whiteRatio = 0;


exports.fxaa = false;
var motionBlurQualityMap = exports.motionBlurQualityMap = {
    best: 1,
    high: 0.5,
    medium: 1 / 3,
    low: 0.25
};
exports.motionBlurQualityList = keys(motionBlurQualityMap);
query.motionBlurQuality = motionBlurQualityMap[query.motionBlurQuality] ? query.motionBlurQuality : 'high';
exports.motionBlur = false;
exports.motionBlurPause = false;
exports.bloom = false;
