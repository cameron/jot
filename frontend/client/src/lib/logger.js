angular.module('jot')

/*
 * Logger
 * Prefix and toggle collections of logging statements.
 *
 * E.g.:
 *
 * var myLogger = logger('my');
 * ...
 * logger('stuff') -> 'my stuff' in console
 *
 *
 * Now, the exciting part:
 *
 * var myLogger = logger('my', true);
 * ...
 * logger('stuff') -> nothing
 *
 * */

.service('logger', function(){
  var logger = function(label, disabled){
    if(disabled){ return function(){} };
    return console.log.bind(console, label);
  }
  return logger;
});
