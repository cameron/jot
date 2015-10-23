angular.module('jot')

.config(['$httpProvider', function($httpProvider){
  $httpProvider.interceptors.push(function(){
    return {
      'request': function(config){
        config.withCredentials = true;
        return config;
      }
    }
  });
}]);
