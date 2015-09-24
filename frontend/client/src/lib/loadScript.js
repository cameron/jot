angular.module('jot')
.service('loadScript', ['$q', function($q){
  return function(url){
    var d = $q.defer();
    var s = document.createElement('script');
    s.src = url;
    s.onload = d.resolve;
    document.body.appendChild(s);
    return d.promise;
  }
}])
