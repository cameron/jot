angular.module('jot')

.view('note', ['$scope', function($scope){
  $scope.note = $scope.modal.data.note;
  $scope.$watch('note.text', function(text){
    if(!$scope.note.guid && !text){ return };
    $scope.note.save();
  })
}]);
