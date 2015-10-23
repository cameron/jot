/* gulpfile.utils.js
 *
 * file() and stream() make defining build output short and sweet by
 * relying on convention and a little json configuration rather than code. E.g.,
 *
 * file('js.js', {
 *   src: ['src/module.js', 'src/lib/*.js', ...],
 *   ops: [
 *     sourcemaps.init,
 *     concat,
 *     sourcemaps.write.bind(null, 'maps)
 *   ]
 * })
 *
 * will create a file `build/js.js` that is the ordered concatentation of all
 * files matched by the globs in the config.src array, as well as a sourcemap
 * for chrome and firefox dev tools.
 *
 * file() and stream() have nearly identical interfaces:
 *
 *   file(name, config)
 *   stream(name, config)
 *
 * and differ in their output. file() produces a file on disk, and stream()
 * produces a stream of text that can be used alongside file globs in the
 * list `config.src`. `config` is a dictionary:
 *
 * {
 *   // glob, stream, or list of file globs and stream objects to merge into
 *   // a single output stream or file. respects order for files (and not streams,
 *   // which is a bug).
 *   src: '' || stream() || [],
 *
 *   // list of tasks (file or stream names) to wait on.
 *   deps: [],
 *
 *   // list of functions to pipe the merged src stream through.
 *   // functions that require configuration can be passed as in:
 *   // `sass.bind(null, {errLogToConsole: true})`
 *   ops: [],
 *
 *   // (optional, file() only) override the default ./build/<name>
 *   // destination file.
 *   dest: ''
 * }
 *
 * */

var del = require('del');
var gulp = require('gulp');
var webserver = require('gulp-webserver');
var watch = require('gulp-watch');
var gzip = require('gulp-gzip');
var order = require('gulp-order');
var es = require('event-stream');
var debug = require('gulp-debug');
var concat = require('gulp-concat');


// Defines a single build output file.
var file = function(name, config){

  // config.src is made up of file globs and streams to be processed separately
  var streams = config.src.filter(function(src){
    return src.isStreamMaker;
  });

  var globs = config.src.filter(function(src){
    return typeof src == 'string'; // glob
  });

  var watch = (config.watch || []);
  streams.map(function(stream){
    var ret = _getStreamWatchAndSrc(stream);
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
    return _makeTaskStream(name, config).pipe(gulp.dest(config.dest));
  });
};


var stream = function(name, config){
  var streamMaker = _makeTaskStream.bind(null, name, config);

  // Keep track of some things so the task that this stream is included in can
  // do things like gulp-order and gulp-watch the appropriate files.
  streamMaker.isStreamMaker = true;
  streamMaker.streamName = name;
  streamMaker.watch = config.watch;
  streamMaker.src = config.src;
  return streamMaker;
}


// list of [fileGlob, task] pairs that will be turned into a gulp watch task
var watchGlobTaskPairs = [];


// becomes the deps array for a master build task
var buildTasks = [];

var _makeTaskStream = function(name, config){
  var ordered = [], streams = [], globs = [];

  config.src.map(function(globOrStream){
    if(globOrStream.isStreamMaker){
      // NB: this ordered array has no effect for streams
      ordered.push(globOrStream.streamName);
      streams.push(globOrStream());

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




// Recursively grab the watch and src properties off a stream and its source
// tree created by the `stream` helper above so that the consuming `file` helper
// can watch the appropriate files.
var _getStreamWatchAndSrc = function(stream){
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

  streams.map(_getStreamWatchAndSrc).map(function(subRet){
    ret.watch.push.apply(ret.watch, subRet.watch);
    ret.src.push.apply(ret.src, subRet.src);
  });

  return ret;
}


gulp.task('serve', function() {
  gulp.src('build/')
    .pipe(webserver({
      host: '0.0.0.0',
      livereload: true,
      directoryListing: false
    }));
});


var commitTasks = function(){
  gulp.task('watch', ['build'], function(){
    watchGlobTaskPairs.map(function(globTaskPair){
      watch(globTaskPair[0], function(e){
        gulp.start(globTaskPair[1]);
      });
    });
  })


  gulp.task('build', buildTasks);

  gulp.task('default', ['serve', 'watch']);
}


gulp.task('clean', function(cb){
  del(['build/'], cb);
});

module.exports = {
  file: file,
  stream: stream,
  commitTasks: commitTasks
}