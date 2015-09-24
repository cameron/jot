angular.module('jot')

.view('addPixiByAddress', [

  '$scope',
  'user',
  'modals',
  '$timeout',

  function($scope, user, modals, $timeout){
    var method = 'addContact';

    if($scope.modal.data.contact){
      method = 'updateContact';
      _.extend($scope, $scope.modal.data.contact);
      if(typeof $scope.zip == 'string'){
        $scope.zip = Number($scope.zip.substr(0,5));
      }
    }

    $scope.submit = function(){
      var updatedContact = {
        id: $scope.id,
        realname: $scope.realname,
        street1: $scope.street1,
        street2: $scope.street2,
        zip: $scope.zip
      };

      return user[method](updatedContact)
             .then(function(res){
               _.extend($scope.modal.data.pixi, updatedContact);
               $scope.modal.complete(res);
             });
    };

    $scope.delete = function(){
      if(!$scope.confirmingDelete){
        $scope.confirmingDelete = true;
      } else {
        $scope.deleting = true;
        $timeout(function(){
          user.deleteContact($scope.id, $scope.member === false)
          .then(function(){
            $scope.modal.complete();
          }, function(){
            $scope.confirmingDelete = false;
            $scope.deleting = false;
          });
        }, 2000);
      };
    }
  }]);
