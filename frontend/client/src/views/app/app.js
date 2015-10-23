angular.module('jot')

.view('app',['$rootScope', '$scope', 'modals', 'user', '$element', 'finallyForget',
  function($rs, $scope, modals, user, $element, finallyForget){
    $scope.user = user;

    $scope.hideSidebar = function(e){
      $scope.$broadcast('hideSidebar', e);
    }

    $scope.leftBtnClick = function(){
      if($rs.editing){
        $rs.editing = false;
      } else if($rs.selectingTags){
        $rs.selectingTags = false;
        $scope.$broadcast('hideSidebar');
      } else {
        $rs.selectingTags = true;
        $scope.$broadcast('openSidebar');
      }
    }

    $rs.$expr("leftBtnOrientation = editing ? 'up' : (selectingTags ? 'down' : '')");
    $scope.page = 'notes';
    $scope.newNote = function(){
      modals.show('note', {note: user.newNote()});
    }

    $rs.isTouchScreen = 'ontouchstart' in document.documentElement ? 'tap' : 'click';

    user.ensureLoggedIn();
  }])
