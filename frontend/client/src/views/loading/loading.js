angular.module('pixinote')
.view('loading', [
  '$scope',
  '$element',
  function($scope, $el){
    $scope.animate = function(){
      $el.addClass('animate')
    }
}]);