angular.module('pixinote').view('invitePixi',
  ['$scope',
    'user',
    function($scope, user){
      $scope.user = user;
    }]);
