(function($, undefined) {
"strict";

function _el(el) {
  return (typeof el === 'string') ? $('#' + el) : $(el);
}

CountdownBanner = function(parent, config) {
  config = config || {};
  parent = _el(parent);
  this.parent = parent;

  var onFinished = config.onFinished || function() {};
  var target = _el(config.target || window);

  var aspect = parent.height() / parent.width();
  var resWidth = window.screen.availWidth;
  var resHeight = resWidth * aspect;

  var canvas = $('<canvas>')
  .addClass('countdown-canvas')
  .attr({width: resWidth, height: resHeight})
  .width(parent.width())
  .height(parent.height())
  .appendTo(parent);

  this.canvas = canvas;

  var remaining = config.seconds == null ? 3 : +config.seconds;
  var nextDecrement = 1000;
  this.text = remaining;

  var that = this;

  var bb = bigbang(target[0], {
    interval: 100,
    ontick: function(t, dt) {
      if (t >= nextDecrement) {
        nextDecrement += 1000;
        remaining--;
        if (remaining === -1) {
          return false;
        }
      }
      // We draw here because there's no reason to draw every animation frame.
      if (remaining === 0) {
        that.text = 'Go!';
      } else {
        that.text = remaining;
      }
      that.draw();
    },
    onstop: function() {
      onFinished();
    },
  });

  this.start = bb.start;
};

CountdownBanner.prototype.draw = function() {
  this.canvas
  .clearCanvas()
  .drawText({
    fontSize: (this.canvas[0].height / 4) + 'px',
    fontWeight: 'bold',
    fontFamily: 'serif',
    fillStyle: 'black',
    x: this.canvas[0].width / 2,
    y: this.canvas[0].height / 2,
    text: this.text,
  });
};

CountdownBanner.prototype.resize = function() {
  this.canvas
  .width(this.parent.width())
  .height(this.parent.height());
  this.draw();
};

}($));
