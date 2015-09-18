describe('create account', function(){

  var gen = {
      username: function(){
        return 'user' + String(Date.now()).substring(4, 9);
      }
  }

  it('should show the profile after tapping the menu button and creating an account', function(){
    browser.get('http://coreos.local:8000');

    // attempt to open the sidebar
    $("left-btn").click();

    // login page
    expect($("form.login").isPresent()).toBe(true);
    $("create-account").click();

    // create account page
    var accountForm = $("form[name='account']");
    expect(accountForm.isPresent()).toBe(true);

    var username = gen.username();
    accountForm.element(by.model('pixiname')).sendKeys(username);
    accountForm.element(by.model('password')).sendKeys('aaaa');
    accountForm.element(by.model('name')).sendKeys('Ima Phake');
    accountForm.element(by.model('email')).sendKeys(username + "@gmail.com");
    accountForm.element(by.model('street1')).sendKeys('123 abc st');
    accountForm.element(by.model('zip')).sendKeys('12345');
    accountForm.element(by.css("input[type='submit']")).click();

    // add cc page
    var addCCForm = $("form[name='addCC']")
    expect(addCCForm.isPresent()).toBe(true);

    addCCForm.element(by.model('name')).sendKeys(username);
    addCCForm.element(by.model('number')).sendKeys('4242424242424242');
    addCCForm.element(by.model('expiry')).sendKeys('12/20');
    addCCForm.element(by.model('cvc')).sendKeys('123');
    addCCForm.element(by.model('zip')).sendKeys('12345');
    addCCForm.element(by.css('input[type="submit"]')).click();

    // the logout button in the profile sidebar is only visible
    // when the user is logged in
    expect($("logout").isPresent()).toBe(true);
  })
})