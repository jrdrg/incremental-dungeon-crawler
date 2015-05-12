var autoprefix = require('gulp-autoprefixer');
var bower = require('main-bower-files');
var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var ngAnnotate = require('gulp-ng-annotate');
var nodemon = require('gulp-nodemon');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');


var outDir = './public/';

var paths = {
    server: {
        src: ['src/server/**/*.js']
    },

    app: {
        js: {
            src: ['src/client/**/*.js'],
            out: 'application.js'
        },
        less: {
            src: ['css/**/*.less'],
            out: 'styles.css'
        }
    },

    vendor: {
        js: {
            src: [],
            out: 'vendor.js'
        },
        css: {
            out: 'vendor-styles.css'
        }
    }
};


gulp.task('compile-less', function () {
    return gulp.src(paths.app.less.src)
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(less())
        .pipe(concat(paths.app.less.out))
        .pipe(autoprefix('last 2 versions'))
        .pipe(gulp.dest(outDir));
});


gulp.task('clean', function () {
    return del(outDir + paths.app.js.out);
});


gulp.task('clean-vendor', function () {
    return del(outDir + paths.vendor.js.out);
});


gulp.task('lint', function () {
    return gulp.src(paths.app.js.src)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


gulp.task('lint-server', function () {
    return gulp.src(paths.server.src)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


gulp.task('scripts', ['clean', 'lint'], function () {
    return gulp.src(paths.app.js.src)
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(ngAnnotate())
        .pipe(concat(paths.app.js.out))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(outDir));
});


gulp.task('vendor-scripts', ['clean-vendor'], function () {
    return gulp.src(bower().concat(paths.vendor.js.src))
        .pipe(uglify())
        .pipe(concat(paths.vendor.js.out))
        .pipe(gulp.dest(outDir));
});


gulp.task('nodemon', function () {
    nodemon({
        script: 'serverApp.js'
    })
        .on('change', ['lint-server'])
        .on('restart', function () {
            console.log('restarted!')
        })
});


gulp.task('watch', [], function () {
    gulp.watch(paths.app.less.src, ['compile-less']);
    gulp.watch(paths.app.js.src, ['scripts']);
});


gulp.task('default', ['scripts', 'compile-less', 'nodemon']);