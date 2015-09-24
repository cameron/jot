angular.module('jot')

.service('parseExpiry', function(){
  return function(expiry){
    expiry = expiry.trim().replace('/', ' ').split(' ');
    expiry[1] = '20' + expiry[1];
    return expiry;
  }
})
