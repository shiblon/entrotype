// Requires jQuery

RunRunGame = function(parentContainer, randomCharFunc, options) {
  options = options || {};

  this._parent = $(parentContainer);
  this._char_func = randomCharFunc;
  this._running = false;

  this._tickers = [];

  this.reset();
};

RunRunGame.prototype.reset = function() {
  this._parent.empty();
  this._svg = this._parent.svg({onLoad: $.proxy(this.drawIntro, this)});
};

RunRunGame.prototype.drawIntro = function(svg) {
  var circle = svg.circle(75, 75, 50,
      {fill: "none", stroke: "red", strokeWidth: "3"});
  console.log(circle);
  setTimeout(function() { circle.setAttribute("cx", 200); }, 2000);
};

RunRunGame.prototype.addTicker = function(ticker) {
  this._tickers.push(ticker);
};

RunRunGame.prototype._start = function() {
  if (this._running) {
    return;
  }
  $.each(this._tickers, function(i, ticker) {
    ticker.reset();
  });
  this._running = true;
  this._start_time = new Date().getTime();
  this._interval_timer = setInterval($.proxy(this._tick, this), 50);
};

RunRunGame.prototype._tick = function() {
  var elapsed = new Date().getTime() - this._start_time;
  $.each(this._tickers, function(i, ticker) {
    ticker.tick(this, this._start_time, elapsed);
  });
};

RunRunGame.prototype._stop = function() {
  if (!this._running) {
    return;
  }
  this._running = false;
  clearInterval(this._interval_timer);
  this._interval_timer = null;
};
