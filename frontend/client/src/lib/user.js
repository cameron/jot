angular.module('jot')

.run(['user',
  'facebookAppId',
  'loadScript',
  '$q',
  function(user, fbAppId, loadScript, $q){

    loadScript("//connect.facebook.net/en_US/sdk.js");

    // FB SDK loads and calls async init
    window.fbAsyncInit = function() {
      FB.init({
        appId      : fbAppId,
        cookie     : true,
        xfbml      : true,
        version    : 'v2.4'
      });

      var fbLogin = FB.login.bind(FB);
      FB.login = function(opts){
        var def = $q.defer();
        fbLogin(function(res){
          def.resolve(res);
        }, opts);
        return def.promise;
      }

      var getStatus = FB.getLoginStatus.bind(FB);
      FB.getLoginStatus = function(){
        var def = $q.defer();
        getStatus(function(res){
          def.resolve(res);
        });
        return def.promise;
      }

      user._getFbToken();
    };
}])


.service('user',[
  'api',
  'modals',
  '$q',
  '$http',
  'Note',
  'facebookAppId',
  'logger',
  'localStorage',
  'fetcher',
  function(
    api,
    modals,
    $q,
    $http,
    Note,
    fbAppId,
    logger,
    localStorage,
    fetcher){

    var log = logger('fb', true);

    var User = function(){
      // try local storage to check for logged in status first
      // (in case there is no network connectivity)
      localStorage.guid() && this._didLogIn(localStorage.guid());
    };


    /* account */

    User.prototype.createAccount = function(){
      return api('post', '/users', {
        password: this.password,
        fb_id: this.fbId,
        fb_token: this.fbToken,
        email: this.email,
      }).success((function(guid){
        this._didLogIn(guid)
      }).bind(this));
    };

    /* login */

    User.prototype.pxLogin = function(email, password){
      log('login to jot');

      return api('post', '/session', {
        email: email,
        password: password || '',
        fb_id: this.fbId,
        fb_token: this.fbToken
      })
             .success((function(res){
               this._didLogIn(res);
             }).bind(this));
    };


    User.prototype._didLogInToFb = function(){
      log('logged in')
      return this.pxLogin()
             .error((function(){
               return this._getFbProfile().then($q.reject);
             }).bind(this))
    }


    User.prototype.fbLogin = function(){
      log('login')

      return this._getFbToken()
             .then(this._didLogInToFb.bind(this),
               this._fbAuth.bind(this));
    }


    User.prototype._fbAuth = function(){
      log('auth');

      var scope = 'public_profile,email,user_friends,email,user_birthday';

      // iOS Chrome is pretty handicapped thanks to being a UIWebView,
      // can't handle the fb auth popup so we have to do an oauth redirect.
      if(navigator.userAgent.indexOf('CriOS') != -1){

        log('FB.login via window.open');

        window.open('https://www.facebook.com/dialog/oauth?client_id='+fbAppId+'&redirect_uri='+ document.location.href +'&scope=' + scope, '', null);

      } else {

        return FB.login({ scope: scope })
               .then(this._gotFbToken.bind(this))
               .then(this._didLogInToFb.bind(this));
      }
    };


    User.prototype._getFbToken = function(){
      log('get token')

      return this._getStatusPromise = (this._getStatusPromise ?
        this._getStatusPromise :
        (FB.getLoginStatus()
         .then(this._gotFbToken.bind(this))));
    }


    // Relevant facebook docs:
    // - https://developers.facebook.com/docs/facebook-login/login-flow-for-web/v2.3
    User.prototype._gotFbToken = function(statusRes){
      log('got token', statusRes);

      if(statusRes.status == 'connected'){
        this.fbId =  statusRes.authResponse.userID;
        this.fbToken = statusRes.authResponse.accessToken;
        this._getFbProfile();
        return;
      }
      return $q.reject();
    }


    User.prototype._getFbProfile = function(){
      if(this._getFbProfileDef){
        return this._getFbProfileDef.promise;
      }
      this._getFbProfileDef = $q.defer();

      FB.api('/me', (function(profileRes){
        // don't *overwrite* with values from facebook,
        // anything already here came from the
        // server and should take precedence
        _.defaults(this, {
          realname: profileRes.name,
          birthday: profileRes.birthday,
          email: profileRes.email,
        });

        // handle the redirect from fb (ios chrome)
        if(document.location.search.indexOf('code') != -1){
          window.history.pushState(null, document.title, '/');
          modals.show('createAccount');
        }

        this._getFbProfileDef.resolve(true);
      }).bind(this));
      return this._getFbProfileDef.promise;
    }


    User.prototype._didLogIn = function(guid){
      delete this.password;
      this.loggedIn = true;
      this.setGuid(guid);
      this.getNotes();
      this.getTags();
    }


    User.prototype.logout = function(){
      this.setGuid();
      if(this.loggedIn){
        this.loggedIn = false;
        return api("delete", "/session")
               .finally(window.location.reload.bind(window.location));
      }
    };


    User.prototype.ensureLoggedIn = function(){
      return this.getSessionGuid().then((function(){
        $q.when(this.loggedIn || modals.show('login'))
      }).bind(this));
    };


    User.prototype.getSessionGuid = fetcher(function getSessionGuid(){
      return api('get', '/session')
             .success((function(guid){
               if(!this.loggedIn){
                 this._didLogIn(guid)
               }
             }).bind(this))
             .error(function(){
               this.logout();
             }.bind(this));
    });


    User.prototype.setGuid = function(guid){
      this.guid = guid;
      localStorage.guid(guid);
    }

    /* notes */

    User.prototype.newNote = function(){
      var note = new Note(null, this);
      this.notes.shift(note);
      return note;
    };


    User.prototype.getNotes = fetcher(function getNotes(){
      return api('get', '/users/' + this.guid + '/notes')
             .success((function(notes){
               this.notes = notes.map((function(json){
                 return new Note(json, this);
               }).bind(this));
             }).bind(this));
    }, function shouldFetch(){
      return !!this.guid
    });

    User.prototype.getTags = fetcher(function getTags(){
      return api('get', '/users/' + this.guid + '/tags')
      .success((function(tags){
        this.tags = tags;
      }).bind(this));
    });

    return new User();
  }])
