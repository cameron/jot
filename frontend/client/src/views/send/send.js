angular.module('jot')
.view('send', ['$rootScope', '$scope', 'user', 'modals',
  function($rootScope, $scope, user, modals){

  $scope.user = user;
}]);
