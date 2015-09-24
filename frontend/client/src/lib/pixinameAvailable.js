angular.module('jot')

.directive('nameMustBeUnregistered', ['$q', 'api', '$parse', function($q, api, $parse){
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl){

      ctrl.$asyncValidators.name = function(modelVal){

        if(ctrl.$isEmpty(modelVal)){
          return $q.reject();
        }

        var promise = api('get', '/users/' + modelVal);
        var mustBeUnregistered = $parse(attrs.nameMustBeUnregistered)(scope);

        if(mustBeUnregistered !== undefined && !mustBeUnregistered){
          return promise;

        } else {
          var d = $q.defer();
          promise.then(d.reject, d.resolve);
          return d.promise;
        }
      }
    }
  }
}])
