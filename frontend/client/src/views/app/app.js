angular.module('pixinote')

.view('app',['$rootScope', '$scope', 'modals', 'user', '$element', 'finallyForget',
  function($rootScope, $scope, modals, user, $element, finallyForget){
    $scope.user = user;

    $scope.hideSidebar = function(e){
      $scope.$broadcast('hideSidebar', e);
    }

    $scope.openSidebar = function(){
      if($scope.loggingIn){ return $scope.loggingIn };
      finallyForget($scope, 'loggingIn',
        user.ensureLoggedIn()
        .then(function(){
          $scope.$broadcast('openSidebar');
        }));
    }

    $scope.newNote = function(){
      modals.show('note', {note: user.newNote()});
    }

    $scope.titleSrc = 'views/app/logo.png';
    $scope.page = 'notes';

    $rootScope.isTouchScreen = 'ontouchstart' in document.documentElement ? 'tap' : 'click';

    // routing!
    if(window.location.hash == '#login'){
      $scope.openSidebar();
    }

    user.ensureLoggedIn();
  }])
