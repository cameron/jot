
angular.module('jot')


.link('pxTransitionEnd', function(scope, element, attrs){
  element.bind('transitionend', function(e){
    if(e.target != element[0]) { return; }
    scope.$apply('transitioning = false; ' + attrs.pxTransitionEnd);
  });
})


.link('pxLoad', function(scope, element, attrs){
  element.on('load', function(evt){
    scope.$applyWithCare(function(){
      scope.$eval(attrs.pxLoad, {'$event': evt})
    });
  });
})


.link('pxLink', function(scope, element, attrs){
  scope.$applyWithCare(attrs.pxLink);
})


/* Evaluate an expression when backspace is pressed and
 * there is no text in the input.
 */
.link('pxEmptyBackspace', function(scope, element, attrs){
  element.bind('keyup', function(){
    element.val() == '' && scope.$apply(attrs.pxEmptyBackspace);
  });
})


.link('pxCaptureClick', function(scope, element, attrs){
  element[0].addEventListener('click', function(e){
    /* $eval doesn't initiate a digest cycle.
     * $apply doesn't accept locals.
     *
     * So we do both.
     */

    scope.$eval(attrs.pxCaptureClick, {$event: e});
    scope.$applyWithCare(function(){});
  }, true);
})


.link('pxClickToZAboveSibs', function(scope, element, attrs){

  element.on('zAboveSibs', function(){
    if(element.hasClass('above-sibs')){ return; }
    var existing = element[0].parentNode.querySelector('.above-sibs');
    existing && existing.classList.remove('above-sibs');
    element.addClass(' above-sibs');
  })

  // firing a custom event rather than relying solely on the click
  // enables other code to trigger this behavior
  element.bind('click', function(e){
    element[0].dispatchEvent(new Event('zAboveSibs'));
  });
})


// Re-implementation of ng-class (because ng-class can't be used inside another
// directive's link function).
.link('pxClass', function(scope, element, attrs){
  for(var k in attrs.pxClass){
    if(!attrs.pxClass.hasOwnProperty(k)) return;
    (function(cls){
      scope.$watch(attrs.pxClass[cls], function(val){
        element[val ? 'addClass' : 'removeClass'](cls);
      });
    })(k)
  }
})


.directive('pxEnsureUniquePixiname', ['api', '$q', function(api, $q){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, c){
      scope.$if(attrs.ngModel, function(pixiname){
        var pixinameFormStatus = scope.$eval(attrs.pxEnsureUniquePixiname);
        pixinameFormStatus.pending = true;
        pixinameFormStatus.$setValidity('unique', true);
        api('get', '/users/' + pixiname.toLowerCase())
        .error(function(res, code){})
        .success(function(){
          pixinameFormStatus.$setValidity('unique', false);
        })
        .finally(function(){
          pixinameFormStatus.pending = false;
        })
      });
    }
  }
}])


.directive('pxCanCaptureClicks', function(){
  return {
    link: function(scope, el){
      var clickableChild = null;

      var captureClick = function(evt){
        if(evt.target && (clickableChild == evt.target || clickableChild.contains(evt.target))){
          return;
        }
        evt.stopPropagation();
        evt.preventDefault();
        scope.$broadcast('capturedClick');
        scope.$apply();
        return false;
      }

      scope.$on('startCapturingClicks', function(evt, clickable){
        el[0].addEventListener('click', captureClick, true);
        clickableChild = clickable;
      });

      scope.$on('stopCapturingClicks', function(){
        el[0].removeEventListener('click', captureClick, true);
        clickableChild = null;
      });
    }
  }
})


.directive('pxMaxLines', function(){
  return {
    link: function(scope, el, attrs){
      el.on('keyup', function(){
        var lineHeight = Number(window.getComputedStyle(el[0])
                                .lineHeight.replace('px', ''));
        var lines = Math.round(el[0].offsetHeight / lineHeight);
        if(lines > Number(attrs.pxMaxLines)){
          el.addClass('max-lines-exceeded');
          scope.$apply(attrs.pxMaxLinesExceeded);
        } else {
          el.removeClass('max-lines-exceeded');
          scope.$apply(attrs.pxMaxLinesOkay);
        }
      })
    }
  }
})


// 1. Canvas will return empty data urls for images any larger on mobile
//    devices (due to system mem constraints?).
.directive('pxReadDataUrlInto', [
  '$parse',
  'dataUrlToBlob',
  'logger', function($parse, dataUrlToBlob, logger){
    return {
      link: function(scope, el, attrs){
        var log = logger('fileData', true);
        var setDataUrl = function(url){
          scope.$apply(function(){
            log('url', url.substr(0, 50) + '...');
            log('size', url.length / 1024 / 1024 / 8 + 'mb');
            scope.$eval(attrs.pxLoadingDataUrlFlag + ' = false');
            $parse(attrs.pxReadDataUrlInto).assign(scope, url);
          });
        }

        var reader = new FileReader();
        reader.onload = function(e){
          setDataUrl(e.target.result);
        };

        // model -> input (only if null)
        scope.$watch(attrs.pxReadFileDataInto, function(val){
          !val && el.val(null);
        });

        // input -> model
        el.on('change', function(){
          if(this.files.length < 1){ return };
          var file = this.files[0];
          log(file.name)
          loadImage.parseMetaData(file, function(data){
            if(!data.exif){
              log(file.name + ': no exif data');
              reader.readAsDataURL(file);
              return;
            }
            var orientation = data.exif.get('Orientation');
            log('orientation', orientation);
            loadImage(file, function(canvas){
              var dataUrl = canvas.toDataURL();
              setDataUrl(dataUrl);
            }, {
              maxHeight: 2000, // 1.
              maxWidth: 2000,
              orientation: orientation,
              canvas: true,
              noRevoke: true
            })
          });

          scope.$apply(attrs.pxLoadingDataUrlFlag + ' = true');
        });
      }
    }
  }])


.directive('pxReadFileInto', ['$parse', function($parse){
  return {
    link: function(scope, el, attrs){
      var model = $parse(attrs.pxReadFileInto);
      el.on('change', function(){
        if(el[0].files && el[0].files.length < 1) return;
        scope.$apply(function(){
          model.assign(scope, el[0].files[0]);
        })
      });
    }
  }
}])


/* contenteditable elements sometimes wrap their contents in inline-styled
 * spans... let's not.
 */
.directive('contenteditable', function(){
  return {
    link: function(scope, el, attrs){
      el.on('DOMNodeInserted', function(e){
        if(e.target.nodeName == "SPAN" && e.target.attributes.style){
          e.target.parentNode.replaceChild(e.target.childNodes[0], e.target);
        }
      });
    }
  }
})


.directive('pxVisible', function(){
  return {
    link: function(scope, el, attrs){
      scope.$watch(attrs.pxVisible, function(val){
        if(!val){
          el.addClass('invisible');
        } else {
          el.removeClass('invisible');
        }
      });
    }
  }
})


.directive('pxData', function(){
  return {
    link: function(scope, el, attrs){
      el.attr('data', attrs.pxData);
    }
  }
})


.directive('pxVisible', function(){
  return {
    link: function(scope, el, attrs){
      scope.$watch(attrs.pxVisible, function(v){
        el[!v ? 'addClass' : 'removeClass']('invisible')
      });
    }
  }
})
