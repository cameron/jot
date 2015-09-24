angular.module('jot')

// two-way binding for a contenteditable div
.directive('pxTextContent', [
  'htmlToNewlines',
  'replaceNthMatch',
  function(htmlToNewlines, replaceNthMatch){
    return {
      link: function(scope, el, attrs){
        var textFromView;

        // model -> view
        scope.$watch(attrs.pxTextContent, function(text, old){
          if(text === undefined || text == textFromView) {
            // The guard above catches a case where the underlying model
            // is removed (nulled) and replaced with the same value.
            //
            // The null value makes it into the DOM, clearing the text input,
            // but the subsequent (repeated) value does not, because it is
            // caught by `text == textFromView`, and thus the DOM appears
            // empty while the model has a real value.
            //
            // To avoid this, we null the textFromView value here:
            textFromView = null;
            return;
          }
          el.html(text.replace(/\n/g, '<br>'));

        });

        // view -> model
        el.on('keyup change', _.debounce(function(){
          textFromView = htmlToNewlines(el)
          scope.$apply(attrs.pxTextContent + ' = "' + textFromView + '"');
        }, 200));

        // prevent return if there are already 3 lines
        el.on('keydown', function(e){
          var content = scope.$eval(attrs.pxTextContent);
          var match = content.match(/\n/g);
          if(match && match.length > 1 && e.keyCode == 13){
            e.preventDefault();
          }
        });
      }
    }
  }])
