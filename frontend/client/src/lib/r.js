// r.js
// add-ons for $q promises

angular.module('jot')

.run(['$q', function($q){
  var p = $q.defer().promise;
  p.__proto__.link = function(promise){
    return this.then(promise.resolve, promise.reject, promise.notify);
  }
}])
