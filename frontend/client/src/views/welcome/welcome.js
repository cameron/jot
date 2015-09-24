angular.module('jot')

.view('welcome', ['$scope', 'modals', 'user', '$q', function($scope, modals, user, $q){
  $scope.user = user;

  // so the top-left "x" btn doesn't just rewind to the previous modal
  $scope.modal.cancel = $scope.modal.complete;

  $scope.addContacts = function(){
    modals.show('addPixi').then($scope.modal.complete, $scope.modal.cancel);
  }
}])
