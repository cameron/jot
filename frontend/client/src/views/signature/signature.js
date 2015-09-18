angular.module('pixinote')

.view('signature', [
  '$scope',
  'user',
  function($scope, user){
    $scope.user = user;
  }]);