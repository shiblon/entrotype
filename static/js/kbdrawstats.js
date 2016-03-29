(function(document, $, undefined) {
"strict";

draw_kb_stats = function(parent, layout, kbstats, modifier) {
  function formatRGB(rgb) {
    return 'rgb(' + rgb.join(',') + ')';
  }
  modifier = modifier || 'none';
  new KeyboardSVG(parent, layout, function(p) {
    var ch = p[modifier];
    var fontColor = 'black';
    var text = ch;
    if (text == null) {
      text = p.nonchar;
    }
    switch (text) {
      case 'tab': text = '\u21e5'; break;
      case 'enter': text = '\u23ce'; break;
      case 'backspace': text = '\u232b'; break;
      case 'capslock': text = '\u21ea'; break;
      case 'shift': text = '\u21e7'; break;
      case 'space': text = '\u2423'; break;
    }
    if (p.nonchar && p.nonchar === modifier) {
      p.path.attr('fill', 'gray');
      fontColor = 'white';
    } else if (ch in kbstats.keys) {
      p.path.attr('fill', formatRGB(kbstats.heatRGBForChar(ch)));
      fontColor = 'white';
    }

    if (text != null) {
      var bbox = p.path.getBBox();
      var text = p.path.paper.text(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, text)
      .attr({
        'font-size': '15pt',
        'fill': fontColor,
        'font-family': 'Arial,Helvetica,sans-serif',
        'font-weight': 'normal',
      });
    }
  });
};

}(document, $));
