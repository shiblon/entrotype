// Requires jQuery

Heap = function() {
  this._heap = [];
};

Heap.prototype.push = function(key, value) {
  value.__heap_key = key;
  this._heap.push(value);
  this._bubble_up(this._heap.length - 1);
};

Heap.prototype.pop = function() {
  var top_val = this._heap[0];
  this._heap[0] = this._heap.pop();
  this._bubble_down(0);
  return [top_val.__heap_key, top_val];
};

Heap.prototype.peek = function() {
  var val = this._heap[0];
  return [val.__heap_key, val];
};

Heap.prototype._bubble_down = function(topIndex) {
  if (topIndex >= this._heap.length) {
    return;
  }
  var b = (topIndex + 1) * 2 - 1;
  if (this._heap[b] > this._heap[b+1]) {
    b = b+1;
  }
  if (this._heap[topIndex].__heap_key > this._heap[b].__heap_key) {
    var tmp = this._heap[b];
    this._heap[b] = this._heap[topIndex];
    this._heap[topIndex] = this._heap[b];
    this._bubble_down(b);
  }
};

Heap.prototype._bubble_up = function(bottomIndex) {
  if (bottomIndex == 0) {
    return;
  }
  var b = Math.floor((bottomIndex + 1) / 2) - 1;
  if (this._heap[b].__heap_key > this._heap[a].__heap_key) {
    var tmp = this._heap[b];
    this._heap[b] = this._heap[bottomIndex];
    this._heap[bottomIndex] = this._heap[b];
    this._bubble_up(b);
  }
};

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
