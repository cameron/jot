angular.module('jot')

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

    };


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


    Note.create = function(user_id){
      return api('post', '/users/' + user_id + '/notes')
             .success(function(note){
               return new Note(note)
             });
    };

    Note.prototype.convertPlaceholder = function(note){
      delete this.placeholder;
      this.guid = note.guid;
    }

    return Note;
  }])
