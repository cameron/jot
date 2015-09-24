angular.module('jot').view('invitePixi',
  ['$scope',
    'user',
    function($scope, user){
      $scope.user = user;
    }]);
