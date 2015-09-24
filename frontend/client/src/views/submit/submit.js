angular.module('jot')

.view('submit', ['$parse', '$q', '$timeout', function($parse, $q, $timeout){
  return {
    require: ['^form'],

    link: function(scope, el, attrs){
      var parentForm = el.parent();
      while(parentForm[0].tagName != 'FORM'){
        parentForm = parentForm.parent();
      }

      scope.form = $parse(parentForm.attr('name'))(scope);
      scope.click = $parse(el.attr('click')).bind(null, scope);
      scope.value = $parse(el.attr('value'))(scope);
      scope.$expr('disabled = ' + el.attr('disabled-if'));
    },

    controller:[
      '$scope',
      'finallyForget',
      function($scope, finallyForget){
        $scope.pxSubmit = function(){
          finallyForget($scope, 'submitPromise', $scope.click());
        }

        // ngClass doesn't like !!submitting for some reason
        $scope.$expr('isSubmitting = !!submitPromise');
      }],

    replace: true,

  }
}], true);
