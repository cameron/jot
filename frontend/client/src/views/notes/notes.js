angular.module('jot')
.view('notes', ['$scope', 'user', 'modals', '$element', '$timeout',
  function($scope, user, modals, $element, $timeout){
    $element.on('click', function(e){
      if(e.target.tagName == 'PX-RECIPIENTS' ||
          e.target.tagName == 'ADDRESS-BOOK'){
        $scope.showAddressBook = false;
      }
    });


    $scope.$on('actionBar.addRecipient', $scope.focus = function(e){
      $scope.showAddressBook = true;
      document.querySelector('.recipient-search').focus();
      $element[0].dispatchEvent(new Event('zAboveSibs'));
      document.body.scrollTop = 0;
    });

    user.getNotes().then(function(){
      $scope.notes = user.notes
    });

    $scope.$watch('showAddressBook', function(show, was){
      if(show == was) return; // the initialization case

      if(!show){
        document.querySelector('.recipient-search').blur();
        $scope.searchText = '';
      }

      // login before adding recipients
      if(show && !user.name){
        modals.show('login')
        .then(null, function(){
          $scope.showAddressBook = false;
        });
      }

      $timeout(function(){$scope.$emit('showTitleBar', !show)});
    });

    $scope.addRecipient = function(recipient, $event){
      $scope.showAddressBook = false;
      user.note.recipients.push(recipient);
      recipient.recipient = true;
      $scope.searchText = '';
    }

    $scope.popRecipient = function(){
      var toPop;
      if(user.note.recipients.length){
        toPop = user.note.recipients[user.note.recipients.length - 1];
        toPop.confirmingRemoval = !toPop.confirmingRemoval;
        if(!toPop.confirmingRemoval){
          toPop.recipient = false;
          toPop.confirmingRemoval = false;
          user.note.recipients.pop();
        }

      } else {
        $scope.showAddressBook = false;
      }
    }

    $scope.addContact = function(e){
      e.stopPropagation();
      user.ensureLoggedIn().then(function(){
        modals.show('addPixi', 'add contact')
        .then(function(res){
          $scope.addRecipient(res.data);
        }, $scope.focus);
      })
    }

    $scope.editContact = function(contact, e){
      dontBlur();
      modals.show('addPixiByAddress', 'Edit Contact', {contact: contact});
      e.stopImmediatePropagation();
    }

    $scope.deleteContact = function(contact, e){
      dontBlur();
      e.stopImmediatePropagation();
      $scope.focus();
      if(!contact.confirmingDeletion){
        contact.confirmingDeletion = true;

        $scope.$emit('startCapturingClicks', e.target);
        $scope.$on('capturedClick', function(){
          $scope.$emit('stopCapturingClicks');
          contact.confirmingDeletion = false;
        })

        return;
      }

      user.deleteContact(contact.name);
      $scope.contacts = _.remove($scope.contacts, function(other){
        return contact.name != other.name;
      });
    }

    /* 1. The timeout is necessary to avoid preventing the
     * addRecipient click handler from firing, which happens
     * when the address book is hidden before the click handler can fire
     * (weird).
     *
     * Moreover, we need the searchBlur handler to hide the address book
     * in two other cases: the "done" button on a mobile browser keyboard,
     * and tapping in blank space if the address book list is empty.
     */
    var dontBlur;
    $scope.searchBlur = function(){
      var promise = $timeout(function(){ $scope.showAddressBook = false}, 200); // 1.
      dontBlur = function(){ $timeout.cancel(promise); }
    }

    $scope.$on('resetNoteInputs', function(){
      $scope.contacts = user.contacts;
      // GROSS
      $scope.contacts.map(function(contact){
        contact.confirmingRemoval = false;
        contact.recipient = false;
      });
    });

    $scope.$if('!showAddressBook && user.note', function(){
      user.note.recipients.map(function(recipient){
        recipient.confirmingRemoval = false;
      });
    });

  }])
