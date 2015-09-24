angular.module('jot')

.service('api', ['$http', function($http){
  var api = function(method, config, url, params){
    // support the alternate signature api(method, url, params)
    if(typeof config == 'string'){
      params = url;
      url = config;
      config = undefined;
    }

    config = config || {};
    config.data = params;
    config.url = '/api' + url;
    config.method = method;

    if(typeof params == 'object'){
      params = JSON.stringify(params);
    }

    return $http(config);
  };

  return api;
}])
