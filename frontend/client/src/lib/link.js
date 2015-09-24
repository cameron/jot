(function(){
  var module = angular.module('jot')
  module.linkFns = {};

  /* For the sake of being able to compose some subset of directives without markup
   * (that is, inside another link function),
   * the link function catalogs directives that only apply a link
   * function so that they can be invoked inside another's link function.
   *
   * See viewController.js for an example.
   */

  module.link = function(name, linkFn, priority){
    module.linkFns[name] = linkFn;
    module.directive(name, function(){
      return {
        restrict: 'A',
        link: linkFn,
        priority: priority
      }
    });
    return module;
  };
})();
