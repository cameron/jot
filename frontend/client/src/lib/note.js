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
    }


    Note.prototype.ensureExists = function(){
      return $q.when(this.guid || this.create())
    }


    Note.prototype.save = function(){
      return this.ensureExists().then(function(){
        var lines = this.text.split('\n');
        return api('put', '/notes/' + this.id, {
          tags: this.tags,
          text: this.text,
        })
               .then((function(res){
                 this.setText(res.data);
               }).bind(this));
      }.bind(this));
    }


    Note.prototype.create = function(){
      return api('post', '/users/' + this.parent.guid + '/notes')
             .success((function(note){
               this.setJson(note);
             }).bind(this));
    };

    return Note;
  }])
