angular.module('jot')

.view('addCreditCard', ['$scope', '$timeout', 'user', 'parseExpiry',
  function($scope, $timeout, user, parseExpiry){
    $scope.user = user;
    $scope.add = function(){
      var expiry = parseExpiry($scope.expiry);
      return user.setCreditCard({
        number: $scope.number,
        cvc: $scope.cvc,
        exp_month: expiry[0],
        exp_year: expiry[1]
      })
      .then($scope.modal.complete, function(error){
        $scope.stripeError = error;
      });
    }
  }
])


.directive('pxValidateCreditCardNum', function(){
  return {
    require: 'ngModel',
    link: function(scope, el, attrs, c){
      scope.$if('number', function(number){
        c.$setValidity('stripeValid', Stripe.card.validateCardNumber(number));
      })
    }
  }
})


.directive('pxValidateCVC', function(){
  return {
    require: 'ngModel',
    link: function(scope, el, attrs, c){
      scope.$if('securityCode', function(number){
        c.$setValidity('stripeValid', Stripe.card.validateCVC(number));
      })
    }
  }
})

.directive('pxValidateExpiry', ['parseExpiry', function(parseExpiry){
  return {
    require: 'ngModel',
    link: function(scope, el, attrs, c){
      scope.$if('expiry', function(expiry){
        expiry = parseExpiry(expiry);
        c.$setValidity('stripeValid', Stripe.card.validateExpiry(expiry[0], expiry[1]));
      })
    }
  }
}]);
