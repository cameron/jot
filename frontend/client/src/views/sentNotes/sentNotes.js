angular.module('jot')

.view('sentNotes', ['$scope', 'user', 'Note', function($scope, user, Note){

  user.getNotes().then(function(notes){
    $scope.notes = notes.data.map(function(note){
      return new Note(note);
    });
  });

  $scope.selectTemplate = function(note, e){
    $scope.modal.complete(note);
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}]);
