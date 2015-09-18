angular.module('pixinote')

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
        version    : 'v2.1'
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
  'dataUrlToBlob',
  function(
    api,
    modals,
    $q,
    $http,
    Note,
    fbAppId,
    logger,
    localStorage,
    dataUrlToBlob){

    var User = function(){
      localStorage.name() && this._didLogIn(localStorage.name(), true);
      this.avatarRect = {};
      var match = document.cookie.match(/inviter=([^;]*)/);
      this.referrer = (match && match.length > 1) ? match[1] : undefined;
    };

    var log = logger('fb', true);

    /* account */

    User.prototype.createAccount = function(){
      return api('post', '/users', {
        password: this.password,
        fb_id: this.fbId,
        fb_token: this.fbToken,
        email: this.email,
      })
             .success((function(){
               this._didLogIn(this.name, false)
             }).bind(this));
    };


    User.prototype.setCreditCard = function(card){
      var def = $q.defer()
      Stripe.card.createToken(card, (function(code, res){
        if(res.error){
          def.reject(res.error.message);
        } else {
          api("post", '/users/' + this.name + '/cards', {
            token: res.id
          })
          .success((function(card){

            this.card = card;
            def.resolve();
          }).bind(this))
          .error(def.reject);
        }
      }).bind(this))
      return def.promise;
    };


    /* login */

    User.prototype.pxLogin = function(name, password){
      log('login to pixinote');

      return api('post', '/tokens', {
        name: name,
        password: password || '',
        fb_id: this.fbId,
        fb_token: this.fbToken
      })
             .success((function(res){
               this._didLogIn(res, true);
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
        // anything already here came from the pixinote
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


    User.prototype._didLogIn = function(name, fetchCard){
      delete this.password;
      this.loggedIn = true;
      this.setName(name);
      this.getDetails(fetchCard);
    }


    User.prototype.logout = function(){
      this.setName();
      localStorage.note('');
      return api("delete", "/tokens/current")
             .finally(window.location.reload.bind(window.location));
    };


    User.prototype.ensureLoggedIn = function(){
      return $q.when(this.loggedIn || modals.show('login'))
    };


    User.prototype.setName = function(name){
      this.name = name;
      localStorage.name(name);
      this.updateAvatarSrc();
    }

    User.prototype.updateAvatarSrc = function(){
      this.avatarSrc = '/api/users/' + this.name + '/avatar?' + Date.now();
      this.fullAvatarSrc = '/api/users/' + this.name + '/avatar/full?' + Date.now();
    }


    // It's common to ask for data while it's in the process
    // of being fetched, or before it's possible to fetch it (e.g.,
    // in the case that the user is not yet logged in).
    //
    // In either case, all we want is a promise that resolves when
    // the data is available.
    //
    // That's what fetcher gives us.
    //
    var fetcher = function(fetch, shouldFetch, property){
      var willFetchDefer, isFetchingPromise;
      return function(){
        if(property !== undefined && this[property]){
          return $q.when(this[property]);

        } else if(willFetchDefer && isFetchingPromise){
          return willFetchDefer.promise;
        }

        willFetchDefer = willFetchDefer || $q.defer();

        if(shouldFetch && !shouldFetch.apply(this) || isFetchingPromise){
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

    User.prototype.getDetails = fetcher(function getDetails(alsoGetCard){
      var usersUrl = '/users/' + this.name;
      var reqs = [
        api('get', usersUrl)

        .success((function(user, code){
          if(code == 204){ // means i'm not authd
            this.logout();
            return;
          }
          _.extend(this, user);
        }).bind(this))

        .error((function(res, code){
          if(code == 403 || code == 404){
            this.logout();
          } else {
            console.error(res, code);
          }
        }).bind(this)),

        this.getContacts(),
        this.getNote(),
        this.getNotes()
      ];

      if(alsoGetCard){
        reqs.push(api('get', usersUrl + '/cards/default')
                  .success((function(card){
                    this.card = card;
                  }).bind(this)));
      }

      return $q.all(reqs)
             .then(function(){

             }, (function(res){
               if(res.status == 403){
                 this.logout();
               }
             }).bind(this));
    }, function shouldFetch(){
      return !!this.name;
    });


    /* notes */

    User.prototype._getFreshNote = function(){
      return this.getNote(true);
    }

    User.prototype.getNote = fetcher(function getNote(fresh){
      // a placeholder so that the interface is not blocked
      var oldNote = this.note;
      this.note = new Note();

      return Note.get(fresh ? null : localStorage.note())
             .then((function(note){

               if(!note.placeholder){
                 localStorage.note(note.id);
               }

               if(oldNote && oldNote.placeholder){
                 note.imageData = oldNote.imageData;
                 note.imageCropRect = oldNote.imageCropRect;
                 note.text = oldNote.text;
                 note.recipients = oldNote.recipients;
               }

               this.note = note;
             }).bind(this));
    });


    User.prototype.sendNote = function(){
      var note = this.note;
      var promise = note.send();
      promise.catch(function(){
        this.note = note;
      });
      return promise;
    }


    User.prototype.getNotes = fetcher(function getNotes(){
      return api('get', '/users/' + this.name + '/notes')
             .success(function(notes){
               this.notes = notes;
             });
    }, function shouldFetch(){
      return !!this.name;
    });

    /* contacts */

    User.prototype.deleteContact = function(nameOrId, nonMember){
      _.remove(this.contacts, function(contact){
        return contact[nonMember ? 'id' : 'name'] == nameOrId;
      });
      return api('delete', '/users/' + this.name + '/contacts' +
          (nonMember ? '/mailbox/' : '/member/') + nameOrId)
             .then(function(){},
               function(res){
                 if(res.status != 404){
                   console.warn('unable to remove contact');
                 }
               });
    }


    User.prototype.updateContact = function(contact){
      return api('post', '/users/' + this.name + '/contacts' +
          '/mailbox/' + contact.id, contact);
    }


    User.prototype.addContact = function(nameOrAddress){
      var contact;

      if(typeof nameOrAddress == 'string'){
        contact = {
          name: nameOrAddress,
          member: true
        };
      } else {
        contact = nameOrAddress;
        contact.member = false;
      }

      return api('post', '/users/' + this.name + '/contacts', contact)
             .success((function(contact){
               (this.contacts = this.contacts || []).push(contact);
             }).bind(this));
    };


    User.prototype.getContacts = fetcher(function getContacts(){
      return api('get', '/users/' + this.name + '/contacts')
             .success((function(res){
               this.contacts = res.contacts;
             }).bind(this));
    }, function shouldFetch(){
      return !!this.name;
    }, 'contacts');


    return new User();
  }])
