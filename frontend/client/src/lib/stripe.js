angular.module('pixinote')

.run(['loadScript', 'stripeKey', function(loadScript, stripeKey){
  loadScript("https://js.stripe.com/v2/")
  .then(function(){ Stripe.setPublishableKey(stripeKey); })
}])
