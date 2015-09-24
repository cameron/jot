angular.module('jot')

.view('profile', ['$scope', 'user', 'modals', function($scope, user, modals){
  $scope.user = user;
  $scope.modals = modals;
  $scope.save = function(){
    user.save().then(null, function(){
      $scope.saveError = true;
    })
  }

  $scope.sentNotes = function(){
    modals.show('sentNotes')
    .then(function(templateNote){
      $scope.hideSidebar();
      $scope.user.note.text = templateNote.text;
      $scope.user.note.imageFrom = templateNote.id
      $scope.user.note.save();
    })
  }

  $scope.updateSignature = function(){
    modals.show('createSignature', 'Update Signature', {update: true});
  }

  $scope.updateAddress = function(){
    modals.show('enterAddress', 'Update Address', {update: true});
  }

  $scope.updateCard = function(){
    modals.show('addCreditCard', 'Update Card', {update: Boolean(user.card && user.card.last4)});
  }

  $scope.invite = function(){
    modals.show('invitePixi');
  }
}]);
