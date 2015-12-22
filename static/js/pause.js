(function($, undefined) {
"strict";

function _el(el) {
  return (typeof el === 'string') ? $('#' + el) : $(el);
}

PauseBanner = function(parent) {
  this.parent = _el(parent);
  this.draw();
};

PauseBanner.prototype.draw = function() {
  this.parent.empty();

  var w = this.parent.innerWidth();
  var h = this.parent.innerHeight();

  var fh = Math.ceil(h / 5);

  var canvas = $('<canvas>')
  .attr({width: w, height: h})
  .translateCanvas({
    translateX: w/2,
    translateY: h/2,
  })
  .drawRect({
    fillStyle: '#add8e6',
    opacity: 0.9,
    x: 0, y: 0,
    width: w, height: h,
  })
  .drawText({
    text: 'Paused',
    fillStyle: 'black',
    fontSize: fh,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
  })
  .drawLine({
    strokeStyle: 'black',
    strokeWidth: 2,
    opacity: 0.9,
    x1: -w/2, y1: -fh/2,
    x2: w/2, y2: -fh/2,
  })
  .drawLine({
    strokeStyle: 'black',
    strokeWidth: 2,
    opacity: 0.9,
    x1: -w/2, y1: fh/2,
    x2: w/2, y2: fh/2,
  })
  .appendTo(this.parent);
};

PauseBanner.prototype.resize = function() {
  this.draw();
}
}($));
