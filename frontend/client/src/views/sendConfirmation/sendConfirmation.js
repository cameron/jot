angular.module('jot')

.view('sendConfirmation', ['$scope',function($scope){
  $scope.share = function(e){
    FB.ui({
      method: 'share_open_graph',
      action_type: 'og.likes',
      action_properties: JSON.stringify({
        object:'https://developers.facebook.com/docs/',
        image: ''
      })
    }, function(response){});
  };
}]);
