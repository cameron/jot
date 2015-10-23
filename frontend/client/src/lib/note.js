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

    var Note = function(json, parent){
      log('instantiating note', json);
      this.setJson(json);
      this.parent = parent;
    };


    Note.prototype.setJson = function(json){
      json = json || {};
      this.guid = json.guid;
      this.text = json.value || 'some\nstuff';
    }


    Note.prototype.ensureExists = function(){
      return $q.when(this.guid || this.create())
    }


    Note.prototype.save = function(){
      return this.ensureExists().then((function(){
        return api('post', '/users/' + this.parent.guid + '/notes/' + this.guid, {
          tags: this.tags,
          text: this.text,
        });
      }).bind(this));
    }


    Note.prototype.create = function(){
      return api('post', '/users/' + this.parent.guid + '/notes')
             .success((function(note){
               this.setJson(note);
             }).bind(this));
    };

    return Note;
  }])
