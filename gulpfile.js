/*eslint-env node*/
/* jshint node: true */
'use strict';

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    watch = require('gulp-watch'),
    less = require('gulp-less'),
    csslint = require('gulp-csslint'),
    scp = require('gulp-scp2'),
    gutil = require('gulp-util'),
    ping = require('ping'),
    browserSync = require('browser-sync').create(),
    autoprefixer = require('gulp-autoprefixer'),
    shell = require('gulp-shell'),
    perl = require('./lib/perl'),
    config = require('./config');

var themePath = config['themes-local'] + '/' + config['theme'].toLowerCase();

/**
 * File watch and trigger build of:
 * 		* JavaScript
 * 		* CSS/LESS
 * 		* Themes
 */

/**
 *  Availabel task - must be inserted in config.json
 *      - "watch-less",
 *      - "watch-css",
 *      - "watch-js",
 *      - "watch-theme",
 *      - "brower-sync"
 *  "watch-theme" you should only use, if you edit the export.xml
 */

gulp.task('default', config['watch-tasks']);

/**
 * Watch Tasks for theme rendering
 */

 gulp.task('watch-less', function () {
     watch(themePath + '/Style/less/**/*.less', function () {
         gulp.start(['generateLessFile']);
     });
 });

 gulp.task('watch-css', function () {
     watch(themePath + '/Style/*.css', function () {
         gulp.start(['generateCSSFile', 'css-lint']);
     });
 });

 gulp.task('watch-js', function () {
     watch(themePath + '/Style/*.js', function () {
         gulp.start(['generateJSFile']);
     });
 });

 gulp.task('watch-theme', function () {
     watch(themePath + '/**', function () {
         gulp.start(['generateThemeFile']);
     });
 });

/*******************************************************************************
 * Tasks for theme rendering
 *******************************************************************************/
/**
 * LESS
 */
gulp.task('generateLessFile', function () {
    gulp.src(themePath + '/Style/less/StyleExtension.less')
        .pipe(less()).on('error', function (err) {
            gutil.log(err);
            this.emit('end');
        })
        .pipe(autoprefixer('last 2 version', 'ie10'))
        .pipe(gulp.dest(themePath + '/Style'));
});
/**
 * CSS
 */
var customReporter = function (file) {
    gutil.log(gutil.colors.cyan(file.csslint.errorCount) + ' errors in ' + gutil.colors.magenta(file.path));

    file.csslint.results.forEach(function (result) {
        gutil.log(result.error.message + ' on line ' + result.error.line);
    });
};

gulp.task('css-lint', function () {
    gulp.src(themePath + '/Style/*.css')
        .pipe(csslint())
        .pipe(csslint.reporter(customReporter));
});

gulp.task('generateCSSFile', ['is-online'], function () {
    var themeRemotePath = [config.webroot, 'Store/Shops/DemoShop/Styles', config.theme].join('/');
    gulp.src(themePath + '/Style/StyleExtension.css')
        .pipe(scp({
            host: config['vm-domain'],
            username: config['vm-usr'],
            password: config['vm-pwd'],
            dest: themeRemotePath,
            port: 22,
            watch: function(client) {
                client.on('write', function (o) {
                    gutil.log('write %s', o.destination);
                });
            }
        }), perl.buildCSS(browserSync.reload));
});
/**
 * Javascript
 */
gulp.task('generateJSFile', ['is-online'], function () {
    var themeRemotePath = [config.webroot, 'Store/Shops/DemoShop/Styles', config.theme].join('/');
    gulp.src(themePath + '/Style/StyleExtension.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default', {
            verbose: true
        }))
        .pipe(scp({
            host: config['vm-domain'],
            username: config['vm-usr'],
            password: config['vm-pwd'],
            dest: themeRemotePath,
            port: 22,
            watch: function (client) {
                client.on('write', function (o) {
                    gutil.log('write %s', o.destination);
                });
                client.on('end', browserSync.reload);
            }
        }));
});
/*
 * Compress Folder to [themename].theme in the folder build using compress.sh
 */
gulp.task('generateThemeFile', function () {
    gulp.src('')
        .pipe(shell(
            [
                'cd ' + config['themes-local'] + '; ./compress.sh'
            ]
        ));
});
/**
 * Starting Webserver
 */
gulp.task('brower-sync', function () {
    browserSync.init({
        proxy: 'http://' + config['vm-domain'] + '/epages/DemoShop.preview/en_GB/?ObjectPath=/Shops/DemoShop&ChangeAction=SetCookiePreviewStyle&PreviewStyle=' + config.theme
            // logLevel: 'debug',
            // logConnections: true
    });
});
/**
 * epages 6 controls
 */
gulp.task('is-online', function (done) {
    ping.sys.probe(config['vm-domain'], function (isAlive) {
        if (isAlive) {
            gutil.log(gutil.colors.green('VM ' + config['vm-domain'] + ' is online'));
            return done();
        }
        gutil.log(gutil.colors.red('VM ' + config['vm-domain'] + ' seems to be offline'));
    });
});
