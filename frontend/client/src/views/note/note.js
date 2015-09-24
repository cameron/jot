angular.module('pixinote')

.view('note', ['$scope', function($scope){
  $scope.note = $scope.modal.data.note;
  $scope.$watch('note.value', function(note_text){
    
  })
}]);