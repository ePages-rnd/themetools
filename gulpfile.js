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
    uglify = require('gulp-uglify'),
    rename = require("gulp-rename"),
    browserSync = require('browser-sync').create(),
    autoprefixer = require('gulp-autoprefixer'),
    shell = require('gulp-shell'),
    perl = require('./lib/perl'),
    stripCssComments = require('gulp-strip-css-comments'),
    config = require('./config');

var globalLessPath = config['themes-local'] + '/_less/**/*.less';
var themePath = config['themes-local'].trim() + '/' + config['theme'].toLowerCase();
var machine = config['vm-usr'] + '@' + config['vm-domain'];

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

gulp.task('default', config['watch-tasks-theme']);

/**
 * Watch Tasks for theme rendering
 */

gulp.task('watch-less', function() {
    watch([themePath + "/Style/less/**/*.less", globalLessPath], function() {
        gulp.start(['generateLessFile']);
    });
});

gulp.task('watch-css', function() {
    watch(themePath + '/Style/*.css', function() {
        gulp.start(['generateCSSFile', 'css-lint']);
    });
});

gulp.task('watch-js', function() {
    watch(themePath + '/Style/StyleExtension.js', function() {
        gulp.start(['generateJSFile', 'compressJSFile']);
    });
});

gulp.task('watch-theme', function() {
    watch(themePath + '/**', function() {
        gulp.start(['generateThemeFile']);
    });
});

/*******************************************************************************
 * Tasks for theme rendering
 *******************************************************************************/
/**
 * LESS
 */
gulp.task('generateLessFile', function() {
    return gulp.src(themePath + '/Style/less/StyleExtension.less')
        .pipe(less())
        .on('error', function(err) {
            gutil.log(err);
            this.emit('end');
        })
        .pipe(stripCssComments())
        .pipe(gulp.dest(themePath + '/Style'));
});
/**
 * CSS
 */
gulp.task('css-lint', function() {
    return gulp.src(themePath + '/Style/*.css')
        .pipe(csslint())
        .pipe(csslint.formatter('compact'));
});

gulp.task('generateCSSFile', ['is-online'], function() {
    var themeRemotePath = [config.webroot, 'Store/Shops/DemoShop/Styles', config.theme].join('/');
    return gulp.src(themePath + '/Style/StyleExtension.css')
        .pipe(autoprefixer('last 2 version', 'ie10'))
        .pipe(scp({
            host: config['vm-domain'],
            username: config['vm-usr'],
            password: config['vm-pwd'],
            dest: themeRemotePath,
            port: 22,
            watch: function(client) {
                client.on('write', function(o) {
                    gutil.log('write %s', o.destination);
                });
            }
        }), perl.buildCSS(browserSync.reload))
        .on('end', changePermission);
});
/**
 * Javascript
 */
gulp.task('generateJSFile', ['is-online'], function() {
    var themeRemotePath = [config.webroot, 'Store/Shops/DemoShop/Styles', config.theme].join('/');
    return gulp.src(themePath + '/Style/StyleExtension.js')
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
            watch: function(client) {
                client.on('write', function(o) {
                    gutil.log('write %s', o.destination);
                });
                client.on('end', browserSync.reload, changePermission);
            }
        }))
        .on('end', changePermission);
});

gulp.task('compressJSFile', ['is-online'], function() {
    var themeRemotePath = [config.webroot, 'Store/Shops/DemoShop/Styles', config.theme].join('/');
    return gulp.src(themePath + '/Style/StyleExtension.js')
        .pipe(rename('StyleExtension.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(themePath + '/Style'))
        .pipe(scp({
            host: config['vm-domain'],
            username: config['vm-usr'],
            password: config['vm-pwd'],
            dest: themeRemotePath,
            port: 22,
            watch: function(client) {
                client.on('write', function(o) {
                    gutil.log('write %s', o.destination);
                });
            }
        }))
        .on('end', changePermission);
});

function changePermission() {
    var themeRemotePath = [config.webroot, 'Store/Shops/DemoShop/Styles', config.theme].join('/');
    gulp.src('')
        .pipe(shell(
            [
                'ssh ' + machine + ' "chown -R eprunapp:apache ' + themeRemotePath + '/' + '"',
                'echo Permission has changed'
            ]
        ));
}

/*
 * Compress Folder to [themename].theme in the folder build using compress.sh
 */
gulp.task('generateThemeFile', function() {
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
gulp.task('brower-sync', function() {
    browserSync.init({
        proxy: 'http://' + config['vm-domain'] + '/epages/DemoShop.preview/en_GB/?ObjectPath=/Shops/DemoShop&ChangeAction=SetCookiePreviewStyle&PreviewStyle=' + config.theme
            // logLevel: 'debug',
            // logConnections: true
    });
});
/**
 * epages 6 controls
 */
gulp.task('is-online', function(done) {
    ping.sys.probe(config['vm-domain'], function(isAlive) {
        if (isAlive) {
            gutil.log(gutil.colors.green('VM ' + config['vm-domain'] + ' is online'));
            return done();
        }
        gutil.log(gutil.colors.red('VM ' + config['vm-domain'] + ' seems to be offline'));
    });
});