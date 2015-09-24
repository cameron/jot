angular.module('jot')

.view('signature', [
  '$scope',
  'user',
  function($scope, user){
    $scope.user = user;
  }]);
