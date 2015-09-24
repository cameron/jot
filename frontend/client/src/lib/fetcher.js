angular.module('jot')

.service('fetcher', ['$q', function($q){
  // It's common to ask for data while it's in the process
  // of being fetched, or before it's possible to fetch it (e.g.,
  // in the case that the user is not yet logged in).
  //
  // In either case, all we want is a promise that resolves when
  // the data is available.
  //
  // That's what fetcher gives us.
  //
  return function(fetch, shouldFetch, property){
    var willFetchDefer, isFetchingPromise;
    return function(){
      if(property !== undefined && this[property]){
        return $q.when(this[property]);

      } else if(willFetchDefer && isFetchingPromise){
        return willFetchDefer.promise;
      }

      willFetchDefer = willFetchDefer || $q.defer();

      if((shouldFetch && !shouldFetch.apply(this)) ||
          isFetchingPromise){
        return willFetchDefer.promise;
      }

      isFetchingPromise = fetch.apply(this, arguments)
      isFetchingPromise.then(willFetchDefer.resolve, willFetchDefer.reject);
      isFetchingPromise.finally(function(){
        willFetchDefer = isFetchingPromise = null;
      });
      return isFetchingPromise;
    }
  }
}]);
