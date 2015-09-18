angular.module('pixinote')

.service('localStorage', function(){
  var getterSetter = function(key){
    return function(value){
      if(arguments.length == 1){
        window.localStorage[key] = value === undefined ? '' : value;
      }
      return window.localStorage[key];
    }
  }

  var ls = {};
  ls.name = getterSetter('pxLastLoggedInPixi');
  ls.note = getterSetter('pxDraftNoteId');

  return ls;
});