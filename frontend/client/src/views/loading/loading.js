angular.module('jot')
.view('loading', [
  '$scope',
  '$element',
  function($scope, $el){
    $scope.animate = function(){
      $el.addClass('animate')
    }
}]);
