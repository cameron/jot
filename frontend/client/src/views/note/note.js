angular.module('jot')

.view('note', ['$scope', function($scope){
  $scope.note = $scope.modal.data.note;
  $scope.$watch('note.text', function(note_text){
    $scope.note.save();
  })
}]);
