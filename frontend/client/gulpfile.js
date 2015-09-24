var del = require('del');
var mkdirp = require('mkdirp');
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var webserver = require('gulp-webserver');
var ngAnnotate = require('gulp-ng-annotate');
var ngTemplates = require('gulp-angular-templates');
var includeSource = require('gulp-include-source');
var watch = require('gulp-watch');
var gzip = require('gulp-gzip');
var cache = require('gulp-cached');
var remember = require('gulp-remember');
var order = require('gulp-order');
var es = require('event-stream');
var debug = require('gulp-debug');
var template = require('gulp-template');
var util = require('gulp-util');

var dieOnError = true;

// list of [fileGlob, task] pairs that will be turned into a gulp watch task
var watchGlobTaskPairs = [];


// becomes the deps array for a master build task
var buildTasks = [];


var makeTaskStream = function(name, config){
  var ordered = [], streams = [], globs = [];

  config.src.map(function(globOrStream){
    // stream
    if(globOrStream.isStreamMaker){
      // NB: this ordered array has no effect for streams
      ordered.push(globOrStream.streamName);
      streams.push(globOrStream());

    // glob
    } else {
      ordered.push(globOrStream)
      globs.push(globOrStream);
    }
  });

  streams.push(gulp.src(globs));

  var stream = es.merge(streams);
  stream = stream.pipe(order(ordered, {base: '.'})); // TOOD try ./ to fix the html.js being out of order

  // handy for debugging
  // stream = stream.pipe(debug());

  (config.ops || []).map(function(op){

    // Some unfortunate special cases not anticipated when this pattern
    // was implemented.
    if(op == concat) {
      op = op.bind(null, name);

    } else if(op == gzip){
      stream = stream.pipe(gulp.dest(config.dest))
      op = gzip.bind(null, {append: false})
    }

    stream = stream.pipe(op());
  });
 stream.on('error', function(){ console.log(arguments)});
  return stream;
}

// a task factory
// `config.ops`: func || [func, arg, ...]
var file = function(name, config){

  // config.src is made up of file globs and streams
  // to be processed separately
  var streams = config.src.filter(function(src){
    return src.isStreamMaker;
  });

  var globs = config.src.filter(function(src){
    return typeof src == 'string'; // glob
  });

  var watch = (config.watch || []);
  streams.map(function(stream){
    var ret = getStreamWatchAndSrc(stream);
    ret.watch.length && watch.push.apply(watch, ret.watch);
    ret.src.length && globs.push.apply(globs, ret.src);
  });

  streams.map(function(stream){
    stream.watch && watch.push.apply(watch, stream.watch);
  });

  config.dest = config.dest || 'build/';
  config.deps = config.deps || [];

  watchGlobTaskPairs.push([watch.concat(globs), [name]]);
  buildTasks.push(name);

  gulp.task(name, config.deps, function() {
    return makeTaskStream(name, config).pipe(gulp.dest(config.dest));
  });

};


var _streams = {};
var stream = function(name, config){
  if(config == undefined){
    return _streams[name];
  }

  var streamMaker = makeTaskStream.bind(null, name, config);

  // Keep track of some things so the task that this stream
  // is included in can do things like gulp-order and gulp-watch
  // the appropriate files.
  streamMaker.isStreamMaker = true;
  streamMaker.streamName = name;
  streamMaker.watch = config.watch;
  streamMaker.src = config.src;

  _streams[name] = streamMaker;
}

// Recursively grab the watch and src properties off
// a stream created by the `stream` helper above so that
// the consuming `file` helper can watch the appropriate
// files to trigger a rebuild.
var getStreamWatchAndSrc = function(stream){
  var ret = {
    watch: [],
    src: []
  },
      streams = [];

  (['src', 'watch']).map(function(prop){
    stream[prop] && stream[prop].map(function(globOrStream){
      if(typeof globOrStream == 'string'){
        ret[prop].push(globOrStream);
      } else {
        ret[prop].push(globOrStream);
      }
    });
  });

  streams.map(getStreamWatchAndSrc).map(function(subRet){
    ret.watch.push.apply(ret.watch, subRet.watch);
    ret.src.push.apply(ret.src, subRet.src);
  });

  return ret;
}


// Create Streams And Files

stream('config.js', {
  src: ['src/config.js'],
  ops: [
    template.bind(null, process.env)
  ]
});

stream('html.js', {
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
    stream('html.js'), // NB: current gulp-order impl is broken for streams
    stream('config.js'),
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
    // gzip
    ]
});


file('css.css', {
  src: ['src/**/*.scss'],
  ops: [sass.bind(null, {errLogToConsole: true}),
    process.env.PX_UGLIFY_CSS ? minifyCss : util.noop]
});


file('webfonts', {
  src: ['src/sass/webfonts/**/*', '!src/webfonts/*js'],
  dest:'build/webfonts/'
})


file('images', {
  src: ['src/**/*.jpg', 'src/**/*.png', 'src/**/*.svg'],
})


file('index.html', {
  src: ['src/index.html'],
  deps: ['webfonts', 'js.js', 'css.css'],
  ops: [includeSource.bind(null, {
    cwd: 'build'
    //queryStringCacheBust: true
  })]
})

file('jot.manifest', {
  src: ['src/jot.manifest'],
  ops: [
    template.bind(null, {date: Date()})
  ]
})

gulp.task('watch', ['build'], function(){
  dieOnError = true;
  watchGlobTaskPairs.map(function(globTaskPair){
    watch(globTaskPair[0], function(e){
      gulp.start(globTaskPair[1]);
    });
  });
})


gulp.task('serve', function() {
  gulp.src('build/')
    .pipe(webserver({
      host: '0.0.0.0',
      livereload: true,
      directoryListing: false
    }));
});


gulp.task('build', buildTasks);


gulp.task('clean', function(cb){
  del(['build/'], cb);
});


gulp.task('default', ['serve', 'watch']);
