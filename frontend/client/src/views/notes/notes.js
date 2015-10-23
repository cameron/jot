angular.module('jot')
.view('notes', [
  '$scope',
  'user',
  'modals',
  '$rootScope',
  '$element',
  function($scope, user, modals, $rs, $element){
    user.getNotes().then(function(){
      $scope.notes = user.notes
    });

    var editingNote;
    $scope.editNote = function(note, e){
      debugger;
      console.log('xxxxx');
      $rs.editing = note.editing = true;
      editingNote = note;
      $element.css('top', ($element[0].scrollTop + e.target.offsetTop) + 'px');
    }
    $rs.$if('!editing', function(){
      if(editingNote){
        editingNote.editing = false;
        editingNote = null;
      }
    })
  }])
