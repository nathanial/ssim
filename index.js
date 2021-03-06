const { readpixels } = require('./src/readpixels');
const { rgb2gray } = require('./src/matlab');
const { mean2d } = require('./src/math');
const { ssim } = require('./src/ssim');
const { originalSsim } = require('./src/originalSsim');
const { force } = require('./src/util');
const defaults = require('./src/defaults.json');
const { version } = require('./version.js');

function validateOptions(options) {
	Object.keys(options).forEach((option) => {
		if (!(option in defaults)) {
			throw new Error(`"${option}" is not a valid option`);
		}
	});
	if ('k1' in options && (typeof options.k1 !== 'number' || options.k1 < 0)) {
		throw new Error(`Invalid k1 value. Default is ${defaults.k1}`);
	}
	if ('k2' in options && (typeof options.k2 !== 'number' || options.k2 < 0)) {
		throw new Error(`Invalid k2 value. Default is ${defaults.k2}`);
	}
}

function getOptions(options) {
	validateOptions(options);
	return Object.assign({}, defaults, options);
}

function validateDimensions([pixels1, pixels2]) {
	if (pixels1.width !== pixels2.width || pixels1.height !== pixels2.height) {
		throw new Error('Image dimensions do not match');
	}

	return [pixels1, pixels2];
}

function toGrayScale([pixels1, pixels2]) {
	pixels1 = rgb2gray(pixels1);
	pixels2 = rgb2gray(pixels2);

	return [pixels1, pixels2];
}

function readImage(image, options) {
	if (options.downsample === 'fast') {
		return readpixels(image, options.maxSize);
	}
	return readpixels(image);
}

function singleSSIM(image1 = force('image1'), image2 = force('image2'), options = {}) {
	const start = new Date().getTime();

	options = getOptions(options);

	const ssimImpl = options.ssim === 'fast' ? ssim : originalSsim;

	return Promise.all([readImage(image1, options), readImage(image2, options)])
		.then(validateDimensions)
		.then(toGrayScale)
		.then(([pixels1, pixels2]) => ssimImpl(pixels1, pixels2, options))
		.then(ssimMap => ({
			ssim_map: ssimMap,
			mssim: mean2d(ssimMap),
			performance: new Date().getTime() - start
		}));
}

singleSSIM.ssim = ssim;
singleSSIM.version = version;

module.exports = singleSSIM;
