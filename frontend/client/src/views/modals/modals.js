angular.module('jot')
.service('modals', [
  '$timeout',
  '$q',
  '$rootScope',
  function($timeout, $q, $rootScope){
  var modals = {};
  modals.modals = [];
  modals.show = function(viewName, title, data){

    // For the invocation `modals.show(viewName[, data])`
    if(typeof title != "string"){
      data = title;

      // E.g., "viewName" -> "View Name".
      title = viewName.replace(/([A-Z])/g, " $1");
      title = title[0].toUpperCase() + title.slice(1);
    }

    var deferred = $q.defer();
    var modal = {
      def: deferred,
      name: viewName,
      show: false,
      title: title,
      data: data || {},
      _close: function(){
        modal.show = false;

        $timeout(function(){
          modals.modals.splice(modals.modals.indexOf(modal), 1);

        // keep in sync with sass/_variables.scss:$animation-duration
        }, 300);
      },
      cancel: function(reason){
        deferred.reject(reason);
        modal._close()
      },
      complete: function(data){
        deferred.resolve(data);
        modal._close();
      }
    };

    modals.modals.push(modal);

    $rootScope.$applyWithCare(function(){});
    return deferred.promise;
  };

  modals.confirm = function(text, posPrompt, negPrompt){
    // see hack below
    var defer = $q.defer();
    modals.confirming = ([defer]).concat(Array.prototype.slice.apply(arguments));
    return defer.promise;
  }

  return modals;
}])


.view('modals', {
  controller: ['modals', '$scope',
    function(modals, $scope){
      $scope.modals = modals.modals;

      // hack for the simple confirm modal
      $scope._modals = modals;
      var confirmDefer;
      $scope.$watch('_modals.confirming', function(content){
        if(!content || content.length == 0) {
          confirmDefer = null;
          $scope.confirmText = null;
          $scope.posPrompt = null;
          $scope.negPrompt = null;
        } else {
          confirmDefer = content[0];
          $scope.confirmText = content[1];
          $scope.posPrompt = content[2];
          $scope.negPrompt = content[3];
        }
      });

      // TODO seems like these should live in the ModalCtrl
      $scope.yes = function(){
        confirmDefer.resolve();
        modals.confirming = [];
      }

      $scope.no = function(e){
        confirmDefer.reject();
        modals.confirming = [];
        e.stopPropagation();
      }

    }],
  scope: {
    'closeModal': '=?'
  }
})

.controller('ModalCtrl', [
  '$element',
  'modals',
  '$scope',
  '$timeout',
  function($element, modals, $scope, $timeout){
  $scope.loaded = function(){
    document.activeElement.blur();
    // hack to address the irregular case where the modal will appear without
    // animating up from the bottom...
    $timeout(function(){$scope.modal.show = true}, 50);
  }
}])
