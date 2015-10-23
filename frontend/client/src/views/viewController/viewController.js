angular.module('jot')
.view('viewController', {
  link: function(scope, el, attrs){
    var module = angular.module('jot');

    // See lib/linkOnlyDirective.js
    // (verdict: this is unnecessarily verbose. move back to markup, somehow,
    // the main challenge being how to merge two ngClass directives)
    (['pxTransitionEnd',
      ['pxClass', {
        'hide-nav': "hideNav",
        transitioning: "transitioning",
        'hide-title-bar': "hideTitleBar"
      }]])
    .map(function(linkFnName){

      /* In markup, attr directives often have values.
       * To represent that here, we have a possible 2-element array,
       *  where the second element would be (in markup) the attribute
       * string value.
       */
      var linkFnAttr;
      if(linkFnName instanceof Array){
        attrs[linkFnName[0]] = linkFnName[1];
        linkFnName = linkFnName[0];
      }
      module.linkFns[linkFnName](scope, el, attrs);
    });

    _.extend(scope, {
      showTitleBar: function(scopeEvent, show){
        scope.hideTitleBar = !show;
        scope.transitioning = true;
      },

      openSidebar: function(open){
        scope.revealSidebar = open === undefined ? true : open;
        scope.transitioning = true;
      },

      maybeCloseSidebar: function(scopeEvent, mouseEvent){
        if(scope.revealSidebar && !scope.transitioning){
          scope.openSidebar(false);
          mouseEvent && mouseEvent.stopPropagation();
        }
      }
    });

    scope.$on('hideSidebar', scope.maybeCloseSidebar);
    scope.$on('openSidebar', scope.openSidebar);
    scope.$on('showTitleBar', scope.showTitleBar);
  },

  // http://angularjs.org/1.3.9/docs/api/ng/service/$compile.html#directive-definition-object
  // @ -- one-way binding, supports {{ expr }}
  // = -- two-way binding,
  // & -- key becomes a function executing the expression (value) on the parent scope
  scope: {
    titleView: '@',
    title: '@',
    rightBtnView: '@',
    rightBtnClick: '=?',
    rightBtnClass: '@',
    leftBtnClick: '=?',
    leftBtnView: '@',
    leftBtnClass: '@',
    modal: '=?'
  },
  transclude: true
});
