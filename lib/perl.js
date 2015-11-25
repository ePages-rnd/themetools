/*eslint-env node*/
/* jshint node: true */
'use strict';

var path = require('path'),
    config = require('../config'),
    ssh = require('./ssh'),
    gutil = require('gulp-util'),
    slash = require('slash');

var buildCSS = function (done) {
    ssh.exec(config['perl-exec'] + ' ' + config['cartridges-remote'] + '/DE_EPAGES/Object/Scripts/set.pl -storename Store -path /Shops/DemoShop/Styles/' + config['theme'] + ' IsInvalid=1', done)();
};

module.exports = {
    buildCSS: buildCSS
};
