angular.module('pixinote')

.view('createAccount', ['$scope', 'user', 'modals', function($scope, user, modals){
  $scope.user = user;

  $scope.next = function(){
    return user.createAccount()
    .then($scope.modal.complete, $scope.modal.cancel);
  }
}])
