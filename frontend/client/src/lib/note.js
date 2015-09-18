angular.module('pixinote')

.service('Note', [
  'api',
  '$q',
  '$rootScope',
  'dataUrlToBlob',
  'strToHash',
  'localStorage',
  'logger',
  function(api, $q, $rootScope, dataUrlToBlob, strToHash, localStorage, logger){
    var log = logger('note', true);

    var Note = function(json){
      log('instantiating note', json);
      this.placeholder = !json;
      json = json || {};
      this.id = json.id;

      this.recipients = [];
      this.imageCropRect = {};
      this.imageSrc = '/api/notes/' + this.id + '/image';
      this.fullImageSrc = '/api/notes/' + this.id + '/image/full';
      this.hasImage = json.has_image;
      this.id && this.hasImage && api('get', '/notes/' + this.id + '/image/crop')
      .success((function(crop){
        this.imageCropRect = crop || {};
        this.savedCropRect = _.assign({}, this.imageCropRect);
      }).bind(this));

      // UI state
      this.sealed = false;
      this.focus = false;

      this.setText(json)
    };

    Note.prototype.setText = function(json){
      this.text = '';
      if(!json){
        return
      }

      // identify the last line that has text
      var lastContentLine = 0;
      for(var i = 1; i < 4; i++){
        if(json["line" + i]){
          lastContentLine = i;
        }
      }

      // and only add newlines if there is text on subsequent lines
      [json.line1, json.line2, json.line3].map((function(line, index){
        this.text += (line ? line : '') + ((index < lastContentLine) ? '\n' : '');
      }).bind(this));
    }


    Note.prototype.send = function(){
      localStorage.note('');
      var send = (function(){

        api('post', '/notes/' + this.id + '/send', {
          recipients: this.recipients
        })

        .then(this.sendDef.resolve.bind(this.sendDef),
          (function(){
            localStorage.note(this.id);
            this.sendDef.reject()
          }).bind(this))

        .finally(function(){
          delete this.sendDef;
        });
      }).bind(this);

      this.sendDef = $q.defer();

      if(this.saveImagePromise){
        this.saveImagePromise.then(send, this.sendDef.reject)
        .finally(function(){
          delete this.sendDef;
        });
      } else {
        send();
      }
      return this.sendDef.promise;
    }


    // TODO merge with user.saveAvatar
    Note.prototype.saveImage = function(){
      // Don't save unless the note has a saved image
      // or image data and has a crop rect with properties.
      if(!(this.imageData || this.hasImage) ||
          !this.imageCropRect ||
          !this.imageCropRect.top ||
          this.placeholder){ return }

      var formData = new FormData();

      // Don't send the same image twice.
      var imageDataHash;
      var sendingImage = false;
      if(this.imageData){
        imageDataHash = this.imageData.substr(100, 200);
        if(!this.savedImageDataHash ||
            this.savedImageDataHash != imageDataHash){
          formData.append("image", dataUrlToBlob(this.imageData));
          sendingImage = true;
        }
      }

      // only send dirty crop rects
      var cropRect = this.imageCropRect;
      var sendingRect = false;
      if(!this.savedCropRect ||
          sendingImage ||
         !(cropRect.top == this.savedCropRect.top &&
          cropRect.left == this.savedCropRect.left &&
          cropRect.bottom == this.savedCropRect.bottom &&
          cropRect.right == this.savedCropRect.right)){
        formData.append("info", JSON.stringify(cropRect));
        sendingRect = true;
      }

      if(!sendingRect){
        return;
      }

      // 1. So that angular will generate the multipart type + boundary.
      return this.saveImagePromise = api('put', {
        headers: {
          'Content-Type': undefined // 1.
        },
        transformRequest: angular.identity
      }, '/notes/' + this.id + '/image', formData)
      .then((function(){
        this.savedImageDataHash = imageDataHash;
        this.hasImage = this.hasImage || sendingImage;
        this.savedCropRect = cropRect;
      }).bind(this))
      .finally((function(){
        delete this.saveImagePromise;
      }).bind(this));

    }


    Note.prototype.save = function(){
      if(this.placeholder) return;

      var lines = this.text.split('\n');
      return api('put', '/notes/' + this.id, {
        line1: lines[0],
        line2: lines[1],
        line3: lines[2],
        image_from: this.imageFrom
      })
      .then((function(res){
        this.setText(res.data);
      }).bind(this));
    }


    Note.get = function(id){
      var def = $q.defer();
      var gotNote = function(note){
        log('got note', note);
        def.resolve(new Note(note));
      }

      var newNote = function(){
        return api('post', '/notes', {})
               .success(gotNote)
               .error(function(res, code){
                 code == 403 && gotNote();
               });
      }

      if(id){
        log('getting an existing note');
        api('get', '/notes/' + id)
        .success(gotNote)
        .error(newNote);
      } else {
        log('getting a new note');
        newNote();
      }

      return def.promise;
    };

    return Note;
  }])
