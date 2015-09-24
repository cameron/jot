angular.module('jot')

.view('login', [
  '$scope',
  'user',
  'modals',
  'finallyForget',
  '$timeout',
  '$q',
  function($scope, user, modals, finallyForget, $timeout, $q){

    $scope.pxLogin = function(){
      return user.pxLogin($scope.name, $scope.password)
      .then($scope.modal.complete,
        function(res){
          $scope.badCombo = res.status == 409;
        })
    }

    $scope.fbLogin = function(){
      finallyForget($scope, 'loggingInFB',
        user.fbLogin()
        .then($scope.modal.complete,
          $scope.createAccount.bind(null, true)));
    }

    $scope.forgotPass = function(){
      modals.show('resetPassword');
    }

    $scope.createAccount = function(viaFB){
      // just in case they happen to be logged into facebook
      if(!viaFB){
        delete user.fbId;
        delete user.fbToken;
      } else {
        delete user.password;
      }

      modals.show('createAccount')
      .then($scope.modal.complete);
    };

    // get rid of #login
    $scope.modal.def.promise.finally(function(){
      window.location.hash = '';
    });
  }]);
