// Requires jQuery

RunRunGame = function(parentContainer, randomCharFunc, options) {
  options = options || {};

  this._parent = $(parentContainer);
  this._char_func = randomCharFunc;

  this.init();
};

RunRunGame.prototype.init = function() {
  this._parent.empty();
  this._svg = this._parent.svg({onLoad: $.proxy(this.drawIntro, this)});
};

RunRunGame.prototype.drawIntro = function(svg) {
  var circle = svg.circle(75, 75, 50,
      {fill: "none", stroke: "red", strokeWidth: "3"});
  console.log(circle);
  setTimeout(function() { circle.setAttribute("cx", 200); }, 2000);
};
