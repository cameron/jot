angular.module('pixinote')

.view('app',['$rootScope', '$scope', 'modals', 'user', '$element', 'finallyForget',
  function($rootScope, $scope, modals, user, $element, finallyForget){
    $scope.user = user;

    $rootScope.resetNoteInputs = function(){
      $rootScope.sent = false;
      $rootScope.$broadcast('resetNoteInputs');
    };

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

    $scope.help = function(){ window.location = '/'; }

    $scope.titleSrc = 'views/app/logo.png';
    $scope.page = 'compose';

    $rootScope.isTouchScreen = 'ontouchstart' in document.documentElement ? 'tap' : 'click';

    // routing!
    if(window.location.hash == '#login'){
      $scope.openSidebar();
    }

    user.ensureLoggedIn();
  }])
