angular.module('jot')

.view('currentCreditCard', [
  '$scope',
  'user',
  'modals',
  '$element',
  function($scope, user, modals, $element){
    $element.bind('click', function(){
      modals.show('addCreditCard', 'Update Card', {update: true});
      $scope.$apply();
    });
    $scope.user = user;
    $scope.ccIconUrl = function(type){
      return type ? 'views/send/images/' + type.toLowerCase() + '.jpg' : '';
    };
  }]);
