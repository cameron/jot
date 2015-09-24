angular.module('jot')

.directive('pxView', ['$compile', function($compile){
  /* <div px-view="myView"></div> where scope.myView = 'login'
   *
   * results in
   *
   * <div px-view="myView">
   *   <px-login></px-login>
   * </div>
   *
   * Currently, does not support transference of attributes.
   */

  var module = angular.module('jot');

  var insertView = function(scope, el, viewName){
    viewName = viewName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    var html = angular.element('<px-' + viewName + '></' + viewName + '>');
    el.append(html);
    $compile(html)(scope);
  }

  return {
    restrict: 'A',
    link: function(scope, el, attrs){
      if(!attrs.pxView[0].match('["\']')){
        scope.$watch(attrs.pxView, function(viewName){
          if(viewName) insertView(scope, el, viewName);
        });
      } else {
        insertView(scope, el, attrs.pxView);
      }
    }
  }
}])


.view = function(name, controller, isDirectiveCreator){
  /*
   * Extends the angular module prototype with a function `view` that is a
   * extension of the directive concept, towards a widget-based framework
   * for composing UI. (gulpfile.js is instrumental to this.)
   *
   * Define a view:
   * - set angular.module('myMod').viewTagPrefix = 'xx';
   * - create a new directory: src/views/<viewName>/ containing:
   *   - <viewName>.html
   *   - <viewName>.js containing
   *     - angular.module('myMod').view(<viewName>,
   *                                    <controller | ['dep', controller] | directiveDef>)
   *
   * Compose views in html like this:
   *
   * <xx-my-view></xx-my-view>
   * <div xx-view="'myView'"></div>
   * <div xx-view="myViewExpr"></div>
   *
   * The last pattern can be used for things like routing (see views/modals/modals.js).
   *
   * The expectation is that all UI components outside of a minimal index.html
   * are defined with `view`.
   *
   */
  var directiveCreator, directiveDef, module = angular.module('jot');

  // an annotated directive definition maker
  if(isDirectiveCreator){
    directiveCreator = controller

  // a direct def object or controller
  } else {

    // directive definition object
    if(typeof controller == 'object' && controller.length === undefined){
      directiveDef = controller;

    // controller
    } else {
      directiveDef = {
        controller: controller || function(){}
      }
    }

    directiveCreator = [function(){
      return directiveDef;
    }];
  }

  var directiveCreatorFunc = directiveCreator[directiveCreator.length - 1];
  directiveCreator[directiveCreator.length - 1] = function(){
    var directiveDef = directiveCreatorFunc.apply(null, arguments);

    if(!directiveDef.template && !directiveDef.templateUrl){
      directiveDef.templateUrl = 'views/' + name + '/' + name + '.html';
    }

    directiveDef.scope = directiveDef.scope === undefined ? true : directiveDef.scope;
    return directiveDef;
  }

  module.directive('px' + name[0].toUpperCase() + name.slice(1), directiveCreator);

  return module;
};
