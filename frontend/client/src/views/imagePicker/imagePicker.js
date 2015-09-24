angular.module('jot')

.view('imagePicker', {
  controller: ['$scope', '$element', function($scope, $element){
    $scope.$on('pickImage', $scope.pickImage = function(evt){
      if(!evt.elementClick || $scope.shouldPick()){
        $element.find('input')[0]
        .dispatchEvent(new MouseEvent('click'));
      }
    });

    $scope.$watch('loadingImage', function(val){
      // clear the dimension error when a new image finishes loading
      $scope.dimensionError = !val ? undefined : $scope.dimensionError;
    })

    $scope.imageLoaded = function(evt){
      var img = evt.srcElement || evt.target;
      $scope.dimensionError = (img.naturalWidth < 686) ||
        (img.naturalHeight < 723);
    };

    $scope.$on('resetNoteInputs', function(){
      $scope.file = $scope.dataUrl = $scope.rect = null;
    });

    // render the full image and draw a crop rect inside of it
    $scope.debugRect = false;
    if($scope.debugRect){
      var canvas = document.querySelector('canvas');
      canvas.width = $element[0].offsetWidth;
      canvas.height = $element[0].offsetHeight;
      var ctx = canvas.getContext('2d');
      var orig = document.querySelector('img.picked');
      var rawImg = new Image();// bcuz orig gets scaled by the picker
      orig.onload = function(){
        rawImg.src = orig.src;
        var scale = $element[0].offsetHeight / orig.naturalHeight;
        $scope.$watchCollection('rect', function(rect){
          if(!rect || !rect.top) return;
          var args = [rawImg, 0, 0, orig.naturalWidth, orig.naturalHeight, 0, 0,
            $element[0].offsetWidth * (orig.naturalHeight/orig.naturalWidth),
            $element[0].offsetHeight];
          ctx.drawImage.apply(ctx, args);
          ctx.rect(rect.left * scale, rect.top * scale, (rect.right - rect.left) * scale, (rect.bottom - rect.top) * scale);
          ctx.stroke();
        });
      }
    }
  }],
  scope: {
    shouldPick: '&pickerShouldPick',
    initialSrc: '@pickerInitialSrc',
    file: '=?pickerFile',
    dataUrl: '=?pickerData',
    rect: '=pickerRect',
    scrollZoom: '=?pickerEnableScrollZoom'
  }
});
