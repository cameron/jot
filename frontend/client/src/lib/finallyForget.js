angular.module('jot')

.service('finallyForget', [
  '$rootScope',
  '$parse',
  function($rootScope, $parse){
    return function($scope, name, promise){

      var ref = $parse(name);
      ref.assign($scope, promise);

      if(!promise){ return }

      promise.finally(function(){
        ref.assign($scope, null);
      });

      return promise;

    }
  }]);
