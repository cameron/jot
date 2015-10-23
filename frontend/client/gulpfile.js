var template = require('gulp-template');
var cache = require('gulp-cached');
var ngTemplates = require('gulp-angular-templates');
var remember = require('gulp-remember');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var includeSource = require('gulp-include-source');
var fs = require('fs');
var util = require('gulp-util');

var utils = require('./gulpfile.utils.js');
var file = utils.file;
var stream = utils.stream;

var configjs = stream('config.js', {
  src: ['src/config.js'],
  ops: [
    template.bind(null, process.env)
  ]
});


var htmljs = stream('html.js', {
  src: ['src/*/**/*.html'],
  ops: [
    cache.bind(null, 'templates'),
    ngTemplates.bind(null, {module: 'jot'}),
    remember.bind(null, 'templates'),
    concat,
    uglify
  ]
});


file('js.js', {
  src:([
    'src/.bower_components/hammerjs/hammer.js',
    'src/.bower_components/blueimp-load-image/js/load-image.all.min.js',
    'src/.bower_components/angular/angular.js',
    'src/.bower_components/fastclick/lib/fastclick.js',
    'src/.bower_components/lodash/dist/lodash.js',
    'src/.bower_components/hyperscope/hyperscope.js',
    'src/thirdparty/stripe.js',
    'src/module.js',
    htmljs, // NB: current gulp-order impl is broken for streams
    configjs,
    'src/lib/view.js',
    'src/lib/link.js',
    'src/lib/**/*.js',
    'src/views/**/*.js',
    'src/svg/**/*.js'
  ]),
  ops: [
    sourcemaps.init,
    concat,
    process.env.PX_UGLIFY_CSS ? uglify : util.noop,
    sourcemaps.write.bind(null, 'maps'),
    // TODO gzip
    ]
});


file('css.css', {
  src: ['src/**/*.scss'],
  ops: [
    sass.bind(null, {errLogToConsole: true}),
    process.env.PX_UGLIFY_CSS ? minifyCss : util.noop]
});


file('webfonts', {
  src: ['src/style/webfonts/**/*', '!src/webfonts/*js'],
  dest:'build/webfonts/'
})


file('images', {
  src: ['src/**/*.jpg', 'src/**/*.png', 'src/**/*.svg'],
})


file('index.html', {
  src: ['src/index.html'],
  deps: ['webfonts', 'js.js', 'css.css'],
  ops: [
    template.bind(null, {
      'LOADING_CSS': fs.readFileSync('src/style/loading.css')
    }),
    includeSource.bind(null, {
      cwd: 'build'
      //queryStringCacheBust: true // useful on iOS safari
    })]
})


file('jot.manifest', {
  src: ['src/jot.manifest'],
  watch: ['build/js.js', 'build/css.css', 'build/index.html'],
  ops: [
    function(){ return template({date: Date()}) }
  ]
})

utils.commitTasks();