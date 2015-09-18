/* TODO
 * - scale from pinch center
 */
angular.module('pixinote')

.directive('pxPinchAndDragMask', function(){
  return {
    controller: ['$element', '$scope', function($element, $scope){
      this.element = $element[0];
    }],
  }
})

.directive('pxPinchAndDrag', function(){
  return {
    require: '^pxPinchAndDragMask',
    restrict: 'A',
    scope: {
      cropRect: '=pxPinchAndDrag',
      scrollZoom: '=pxScrollZoom'
    },
    link: function(scope, ngEl, attrs, maskCtrl){
      var imgEl = ngEl[0];
      var parent = maskCtrl.element;

      /*
       * Compute min and max scale values for the image.
       *
       * 1. The image bleeds on three sides (top, left, and bottom).
       * 2. Valid images are printable at 300 DPI within a 2.16" square.
       * 3. A scale factor greater than the ratio of the mask's px height
       *    to the printed image's px height would result in a DPI less than
       *    300.
       * 4. bleedPx is the thickness of the bleed in mask coordinate space,
       *    not image coordinate space.
       * */
      var x, y, scale, minScale, maxScale;
      var DPI = 300;
      var bleed = .125; // 1.
      var maskDim = 2.16; // 2.
      var maxScale = parent.offsetHeight / (maskDim * DPI); // 3.
      var bleedToDimRatio = bleed / maskDim;

      var bleedPx = bleedToDimRatio * parent.offsetHeight; // 4.
      var maskWHRatio = (maskDim + bleed) / (maskDim + (2*bleed));

      // 1. This seems to reduce the frequency
      // of rendering glitches where the image fails to reflect the transform
      // but will disappear in chunks as if the x/y/scale transform were
      // affecting a clipping mask but not the image data itself.
      // Seems likely related to an odd interaction between transition
      // and transforms. Only visible in mobile safari.
      var updateTransform = function(x, y, scale, animate){
        !animate && imgEl.classList.remove('animate');
        var s = 'translate3d(' +
          x + "px" + ',' +
          y + "px" + ',0) ' +
          'scale(' + scale + ',' + scale + ')';
        var transform = function(){
          imgEl.style.webkitTransform = imgEl.style.MozTransform = s;
        }
        animate ? window.requestAnimationFrame(transform) : transform(); // 1.
      };

      // Animate the photo back to within printable scale and positioning
      // constraints after touch/mouse events.
      var parentWidth = parent.offsetWidth;
      var parentHeight = parent.offsetHeight;
      var constrainTransform = function(doNotAnimate){
        doNotAnimate !== true && imgEl.classList.add('animate');
        scale = Math.min(maxScale, Math.max(minScale, scale));

        var currentW = scale * imgEl.naturalWidth;
        var currentH = scale * imgEl.naturalHeight;
        var wd = (currentW - imgEl.naturalWidth);
        var hd = (currentH - imgEl.naturalHeight);
        var halfWidthDiff = wd / 2;
        var halfHeightDiff = hd / 2;

        var maxX = function(){
          return halfWidthDiff - bleedPx;
        }
        var minX = function(){
          return parentWidth - currentW + halfWidthDiff;
        }
        var maxY = function(){
          return halfHeightDiff - bleedPx;
        }
        var minY = function(){
          return parentHeight - currentH + halfHeightDiff + bleedPx;
        }

        x = Math.min(maxX(), Math.max(minX(), x))
        y = Math.min(maxY(), Math.max(minY(), y));
        updateTransform(x, y, scale, doNotAnimate !== true);

        scope.$apply(function(){
          var scaledMaskH = parentHeight / scale;
          var scaledMaskW = parentWidth / scale;

          if(!scope.cropRect){ scope.cropRect = {}};
          scope.cropRect.left = ~~(((-(x - halfWidthDiff)) / currentW) * imgEl.naturalWidth);
          scope.cropRect.top = ~~(((-(y - halfHeightDiff)) / currentH) * imgEl.naturalHeight);
          scope.cropRect.right = ~~(scope.cropRect.left + scaledMaskW);
          scope.cropRect.bottom = ~~(scope.cropRect.top + scaledMaskH);
        });
      }


      ngEl.bind('load', function initializeMinScaleAndCropRect(){
        x = y = scale = 0;

        if((imgEl.naturalWidth / imgEl.naturalHeight) < maskWHRatio){
          minScale = (parent.offsetWidth + bleedPx) / imgEl.naturalWidth;
        } else {
          minScale = (parent.offsetHeight + (2 * bleedPx)) / imgEl.naturalHeight;
        }

        // use existing crop rect as a starting point
        if(scope.cropRect && scope.cropRect.top){
          var w = scope.cropRect.right - scope.cropRect.left;
          var h = scope.cropRect.bottom - scope.cropRect.top;
          var halfWidthDiff = (w - imgEl.naturalWidth) / 2;
          var halfHeightDiff = (h - imgEl.naturalHeight) / 2;

          scale = parent.offsetHeight / h;
          x = -((scope.cropRect.left / imgEl.naturalWidth) * w) + halfWidthDiff;
          y = -((scope.cropRect.top / imgEl.naturalHeight) * h) + halfHeightDiff;
          updateTransform(x, y, scale);
        }

        constrainTransform(true);
      });

      var mc = new Hammer.Manager(imgEl);
      var pan = new Hammer.Pan({
        threshold: 0,
        direction: Hammer.DIRECTION_ALL});
      mc.add(pan);
      var pinch = new Hammer.Pinch();
      mc.add(pinch).recognizeWith(pan);
      mc.on('panstart pinchstart pinchmove panmove pinchend panend', function(ev){
        if(scope.disablePinchAndDrag) return;
        updateTransform(x + ev.deltaX, y + ev.deltaY, scale * ev.scale);
        switch(ev.type){
          case 'pinchend':
          scale *= ev.scale;
          case 'panend':
          x += ev.deltaX;
          y += ev.deltaY;
          constrainTransform();
        }
      });

      var outOfBoundsBy;
      var outOfBoundsModifier;
      document.addEventListener('wheel', function(e){
        if(scope.scrollZoom){
          scale += e.deltaY / 5000;
          updateTransform(x, y, scale);
          constrainTransform();
        }
      });

    }
  }
});
