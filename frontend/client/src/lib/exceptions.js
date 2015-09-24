angular.module('jot')

.config(['$provide', function($provide){
 $provide.decorator('$exceptionHandler', ['$log', '$delegate',
    function($log, $delegate) {
      return function(exception, cause) {
        // custom error handling (wtf angular -- why isn't this default behavior?)
        $log.debug(cause);
        $delegate(exception, cause);
      };
    }]);
}])
