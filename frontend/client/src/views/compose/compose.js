angular.module('pixinote')

.view('compose',[
  '$scope',
  'user',
  '$element',
  'modals',
  '$timeout',
  function($scope, user, $element, modals, $timeout){

    $scope.user = user;
    $scope.modals = modals;

    $scope.$watch('user.note', function(note, old){
      if(note === undefined){ return };
      $scope.note = note;
    });

    user.getNote();

    var updateNextAction = $scope.updateNextAction = function(){
      $scope.primaryAction = false;
      if ($scope.sent) {
        $scope.nextAction = 'newNote';

      } else if(user.note && user.note.focus == 'image'){
        $scope.nextAction = 'editImage';

      } else if(user.note && user.note.focus == 'text'){
        $scope.nextAction = 'completeText';

      } else if(!user.note || !(user.note.imageData || user.note.hasImage || user.note.imageFrom)){
        $scope.nextAction = 'image';

      } else if(!user.note || !user.note.text){
        $scope.nextAction = 'text';

      } else if(!user.note || user.note.recipients.length < 1){
        $scope.nextAction = 'recipients'

      } else if(user.note && !$scope.readyToSend){
        $scope.nextAction = 'seal';

      } else if(!user.card){
        $scope.nextAction = 'add-cc';

      } else if($scope.sending){
        $scope.nextAction = 'sending';

      } else if(user.note){
        $scope.nextAction = 'send';
      }
    };

    $scope.$watchGroup([
      'user.note.imageData',
      'user.note.hasImage',
      'user.note.text',
      'user.note.recipients.length',
      'user.note.sealed',
      'sent',
      'sending',
      'user.note.focus',
      'readyToSend'], updateNextAction);

    $scope.addRecipient = function(){
      $scope.$broadcast('actionBar.addRecipient');
    }

    $scope.addImage = function(){
      $scope.$broadcast('actionBar.addImage');
    }

    $scope.addText = function(){
      $scope.$broadcast('actionBar.addText');
    }

    $scope.login = function(){
      modals.show('logIn');
    }

    $scope.seal = function(){
      $scope.readyToSend = true;
    }

    $scope.addCC = function(){
      modals.show('addCreditCard').then(function(){
        $scope.$emit('startCapturingClicks', $element.find('action-bar')[0])
        updateNextAction();
      });
    }

    $scope.doneCropping = function(){
      $scope.$broadcast('actionBar.doneCropping');
    }

    $scope.doneWriting = function(){
      $scope.$broadcast('actionBar.doneWriting');
    }

    $scope.pickImage = function(){
      $scope.$broadcast('actionBar.pickImage');
    }

    $scope.$on('capturedClick', function(){
      $scope.$emit('stopCapturingClicks');
      $scope.readyToSend = false;
    })

    $scope.send = function(){
      $scope.sending = true;
      $scope.error = null;
      user.sendNote()
      .then(function(){
        $scope.sent = true;
        $scope.readyToSend = undefined; // yik.
        $scope.previousRecipients = user.note.recipients.map(function(recipient){
          return recipient.member ? '*' + recipient.name : recipient.realname;
        });
      }, function(){
        $scope.error = "Please reload the page and try again."
      })
      .finally(function(){
        $scope.sending = false;
        $scope.$emit('stopCapturingClicks');
      });
    }

    $scope.newNote = function(){
      $scope.sent = $scope.sendAnimComplete = false;
      user._getFreshNote();
      $scope.resetNoteInputs();
    }

    $scope.sendAnimationComplete = function(){
      $scope.sendAnimComplete = true;
    }

    $scope.$watch('recipients.length', 'amount = ($newVal * 2.5).toFixed(2)');

  }])
