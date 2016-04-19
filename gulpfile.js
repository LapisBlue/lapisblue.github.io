var gulp = require('gulp');
var deploy = require('gulp-gh-pages');
var rimraf = require('gulp-rimraf');
var minify = require('gulp-clean-css');
var concat = require('gulp-concat');
var templates = require('gulp-jade');
var stylus = require('gulp-stylus');
var sourcemaps = require('gulp-sourcemaps');
var livereload = require('gulp-livereload');
var runseq = require('run-sequence');
var open = require('open');

// server stuff
var connect = require('connect');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var connectLivereload = require('connect-livereload');

var paths = {
  assets: ['./app/assets/**/*', './app/assets/.travis.yml'],
  stylus: ['app/**/*.styl', 'app/**/*.css', '!app/**/_*.styl'],
  templates: ['app/**/*.jade', '!app/**/_*.jade']
};

// BUILD

gulp.task('assets', function () {

  return gulp.src(paths.assets)
    .pipe(gulp.dest('./public'));

});

gulp.task('stylus', function () {

  return gulp.src(paths.stylus)
    .pipe(sourcemaps.init())
    .pipe(stylus({
      use: require('nib')()
    }))
    .pipe(concat('app.css'))
    .pipe(sourcemaps.write('../maps/', {sourceRoot: '../app/'}))
    .pipe(gulp.dest('./public/css'));

});

gulp.task('templates', function () {

  return gulp.src(paths.templates)
    .pipe(templates())
    .pipe(gulp.dest('./public'));

});

// PRODUCTION BUILD

gulp.task('stylus:prod', function () {

  return gulp.src(paths.stylus)
    .pipe(stylus({
      use: require('nib')()
    }))
    .pipe(concat('app.css'))
    .pipe(minify())
    .pipe(gulp.dest('./public/css'));

});

gulp.task('clean', function () {
  return gulp.src('./public', {read: false})
    .pipe(rimraf());
});

gulp.task('build', ['templates', 'stylus', 'assets']);
gulp.task('build:prod', function (cb) {
  runseq(
    'clean',
    ['templates', 'stylus:prod', 'assets'],
    cb
  );
});

// DEVELOPMENT

gulp.task('serve', ['build'], function () {
  var port = livereload.listen().port;

  connect()
    .use(connectLivereload({
      port: port
    }))
    .use(serveStatic('public/'))
    .use(serveIndex('public/'))
    .listen(3000, '0.0.0.0');

  gulp.watch(['public/**/*'], function (file) {
    livereload.changed(file.path);
  });
});

gulp.task('watch', ['build'], function () {

  gulp.watch(paths.assets, ['assets']);
  gulp.watch(['app/**/*.styl'], ['stylus']);
  gulp.watch(['app/**/*.jade'], ['templates']);

});

gulp.task('open', ['serve'], function () {
  open('http://localhost:3000');
});

gulp.task('dev', ['watch', 'serve', 'open']);

// DEPLOYMENT

gulp.task('deploy', ['build:prod'], function () {

  return gulp.src(['./public/**/*', './public/.travis.yml'])
    .pipe(deploy({
      branch: 'master'
    }));

});

gulp.task('travis-deploy', ['build:prod'], function () {

  return gulp.src(['./public/**/*', './public/.travis.yml'])
    .pipe(deploy({
      branch: 'master',
      remoteUrl: process.env.GIT_REPO
    }));

});
