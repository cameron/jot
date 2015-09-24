angular.module('jot')

.service('htmlToNewlines', function(){
  /* A miserable hack for getting a string with newlines
   * out of a content editable element.
   */

  return function(el){
    var range, caretPos, caretNodeIdx;
    var clone = el.clone();
    clone.addClass('hidden');
    el.parent().append(clone);
    var originalHtml = clone[0].innerHTML;
    var inTag = false;
    var htmlWithCharsWrappedInSpans = '';

    // Wrapping each char in a span will let us query the position
    // of each character and discover where the line breaks go.
    for(var char, i = 0; i < originalHtml.length; i++){
      char = originalHtml[i];

      if(char == '<'){ inTag = true; }

      if(!inTag){ htmlWithCharsWrappedInSpans += '<span>' }
      htmlWithCharsWrappedInSpans += char;
      if(!inTag){ htmlWithCharsWrappedInSpans += '</span>' }

      if(char == '>'){ inTag = false; }
    };

    clone[0].style = 'line-height: inherit;'
    clone[0].innerHTML = htmlWithCharsWrappedInSpans;

    var lastTop;
    var hitBR = false;
    var withLineBreaks = '';
    var findLineBreaksInNode = function(node, idx){

      // text nodes, brs, empty spans/divs
      if(!node.children || node.children.length < 1){

        if(node.tagName == 'BR' && !hitBR){
          withLineBreaks += '\n';
          hitBR = true;
        }

        withLineBreaks += node.textContent;
        return;
      }

      // child-bearing nodes
      for(var child, i = 0 ; i < node.childNodes.length; i++){
        child = node.childNodes[i];

        if(child.tagName == 'SPAN' &&
            lastTop != undefined &&
            lastTop < child.offsetTop &&
            !hitBR){
          withLineBreaks += '\n';
        }

        // in the case that we encounter a DIV following a BR,
        // we want to preserve the hitBR flag to avoid appending
        // an extra newline
        hitBR = child.tagName != 'DIV' ? false : hitBR;

        findLineBreaksInNode(child, i);

        if(child.tagName == 'SPAN'){
          lastTop = child.offsetTop;
        }
      };
    };

    findLineBreaksInNode(clone[0], 0);
    clone.detach();

    var result = withLineBreaks.replace(/<\/?span>/g, '').replace('&nbsp;', ' ');
    return result.replace(/\n$/,'');
  };
})
