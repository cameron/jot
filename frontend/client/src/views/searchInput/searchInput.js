angular.module('jot')

.view('searchInput', [
  '$scope',
  '$rootScope',
  '$element',
  function($scope, $rs, $element){
    $rs.$watch('editing', function(editing){
      $element[editing ? 'addClass' : 'removeClass']('hidden');
    });
  }]);
