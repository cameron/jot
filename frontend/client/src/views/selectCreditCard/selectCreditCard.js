angular.module('jot')

.view('selectCreditCard', ['$scope', 'user', 'modals',
  function($scope, user, modals){
    $scope.user = user;
    $scope.cards = user.cards;
    $scope.modals = modals;
    $scope.select = function(card){
      user.card = card;
      $scope.modal.close()
    }
  }
])
