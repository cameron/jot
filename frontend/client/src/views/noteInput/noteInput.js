angular.module('pixinote')

.view('noteInput',['$scope', 'user', '$element', function($scope, user, el){

  $scope.focus = function(textOrImage, e){
    if(
      // don't allow clicks to interrupt a transition
      $scope.transitioning ||

      // don't focus unless there's a note object
      !user.note ||

      // don't refocus on the same state
      textOrImage == user.note.focus
    ) { return }

    if(!textOrImage){
      user.note[user.note.focus == 'image' ? 'saveImage' : 'save']();
      document.querySelector('text-input').blur();
    }

    user.note.focus = textOrImage;

    $scope.transitioning = true;

    if(user.note.focus){
      el[0].dispatchEvent(new Event('zAboveSibs'));
      $scope.focus[textOrImage](e)
    }
  }

  $scope.focus.text = function(){
    // focusTextArea() is triggered by more than just clicks on the input
    // itself (e.g., action-bar), so make sure to focus it.
    document.querySelector('text-input').focus();
  };

  $scope.focus.image = function(e){
    // only allow the click (which will trigger the desktop file select and
    // mobile file/camera dialog) if we haven't already selected an image
    if(user.note.hasImage || user.note.imageData || user.note.imageFrom){
      e.stopPropagation();
    }
  };

  $scope.$on('actionBar.addImage', function(){
    $scope.focus('image');
    $scope.$broadcast('pickImage');
  });
  $scope.$on('actionBar.addText', $scope.focus.bind(null, 'text'));
  $scope.$on('actionBar.doneCropping', $scope.focus.bind(null, false));
  $scope.$on('actionBar.doneWriting', $scope.focus.bind(null, false));
  $scope.$expr('disablePinchAndDrag = user.note.focus != "image"');
  $scope.$on('actionBar.pickImage', $scope.$broadcast.bind($scope, 'pickImage'));

  // manages some $scope state for the envelope animation,
  // which has 3 different transitions (in, close, out), and
  // runs forward and backwards.
  var nextEnvelopeState = function(isReady, wasReady){
    if(isReady == undefined){ return }
    if($scope.readyToSend){
      user.note.sealed = user.note.sealing;
      user.note.sealing = true;
    } else {
      user.note.sealing = user.note.sealed;
      user.note.sealed = false;
    }
  }

  $scope.$watch('readyToSend', nextEnvelopeState)

  $scope.enveloped = function(){
    nextEnvelopeState($scope.readyToSend);
  }
}])
