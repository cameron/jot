angular.module('jot', ['hyperscope'])

.config(['$locationProvider', function($locationProvider){
  $locationProvider.html5Mode(true);
  // ngTouch wasn't cooperating
  FastClick.attach(document.body);
  angular.module('jot').viewTagPrefix = 'px'; // see src/view.js
}])


.run(['$rootScope', 'hyperscope', function($rootScope, hyperscope){
  $rootScope.loaded = true;
  hyperscope($rootScope.__proto__);
}])
