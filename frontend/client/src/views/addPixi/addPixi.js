angular.module('jot')
.view('addPixi', [
  '$scope',
  'api',
  'user',
  'modals',
  function($scope, api, user, modals){
    $scope.addContact = function(){
      return user.addContact($scope.name)
             .then($scope.modal.complete);
    }

    $scope.byAddress = function(){
      modals.show('addPixiByAddress', 'By Address')
      .then($scope.modal.complete);
    }

    $scope.invite = function(){
      modals.show('invitePixi')
      .then($scope.modal.complete);
    }
  }]);
