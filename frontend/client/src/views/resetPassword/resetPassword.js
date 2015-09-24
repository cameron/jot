angular.module('jot')

.view('resetPassword', [
  '$scope',
  'api',
  'user',

  function($scope, api, user){

    $scope.user = user;

    $scope.reset = function(){
      return api('post', '/reset', {email: user.email})
      .success(function(){
        $scope.sent = true;
      })
      .error(function(res, status){
        $scope[ status == 404 ? 'notFound' : 'error' ] = true
      });
    }

    $scope.done = function(){
      $scope.modal.complete();
    }

  }]);
