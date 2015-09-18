angular.module('pixinote')

.config(['$httpProvider', function($httpProvider){
  $httpProvider.defaults.headers.common.Accept = "application/vnd.pixinote.v1+json";
  $httpProvider.interceptors.push(function(){
    return {
      'request': function(config){
        config.withCredentials = true;
        return config;
      }
    }
  });
}]);