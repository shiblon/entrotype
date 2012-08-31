// Requires jQuery

Heap = function() {
  this.clear();
};

Heap.prototype.push = function(key, value) {
  this._heap.push([key, value]);
  this._bubble_up(this._heap.length - 1);
};

Heap.prototype.pop = function() {
  var top_entry = this.peek();
  this._heap[0] = this._heap[this._heap.length - 1];
  this._heap.pop();
  this._bubble_down(0);
  return top_entry;
};

Heap.prototype.heapify = function() {
  this._heap.sort(function(a,b) {return a-b;});
};

Heap.prototype.each = function(callback) {
  for (var i=0, len=this._heap.length; i<len; ++i) {
    // Entry is a pair - this gives callers the opportunity to change the key.
    callback(this._heap[i]);
  }
};

Heap.prototype.size = function() {
  return this._heap.length;
};

Heap.prototype.empty = function() {
  return this._heap.length == 0;
};

Heap.prototype.clear = function() {
  this._heap = [];
};

Heap.prototype.peek = function() {
  if (this._heap.length == 0) {
    throw "Can't peek/pop an empty heap.";
  }
  return this._heap[0];
};

Heap.prototype._bubble_down = function(topIndex) {
  var b = (topIndex + 1) * 2 - 1;
  if (b >= this._heap.length) {
    return;
  }
  if (b+1 < this._heap.length && this._heap[b][0] > this._heap[b+1][0]) {
    b = b+1;
  }
  if (this._heap[topIndex][0] > this._heap[b][0]) {
    var tmp = this._heap[b];
    this._heap[b] = this._heap[topIndex];
    this._heap[topIndex] = tmp;
    this._bubble_down(b);
  }
};

Heap.prototype._bubble_up = function(bottomIndex) {
  if (bottomIndex <= 0) {
    return;
  }
  var b = Math.floor((bottomIndex + 1) / 2) - 1;
  if (this._heap[b][0] > this._heap[bottomIndex][0]) {
    var tmp = this._heap[b];
    this._heap[b] = this._heap[bottomIndex];
    this._heap[bottomIndex] = tmp;
    this._bubble_up(b);
  }
};


Alarmer = function(granularity_millis) {
  this._interval_heap = new Heap();
  this._interval = null;
  if (!granularity_millis) {
    granularity_millis = 10;
  }
  this._granularity = granularity_millis;
  this.reset();
};

Alarmer.prototype.start = function() {
  if (this._interval) {
    return false;
  }

  this._t0 = new Date().getTime();

  var in_interval = false;
  var alarmer = this;
  var heap = this._interval_heap;

  this._interval = setInterval(function() {
    if (!alarmer._interval || in_interval) {
      return;
    }
    in_interval = true;

    var t = alarmer.elapsed();
    while (alarmer._interval && !heap.empty() && heap.peek()[0] <= t) {
      var target = heap.pop();
      target[1].callback(target[1].name, t);
      var new_time = target[0] + target[1].interval_millis;
      // TODO: is this right?  It means that we won't fire on exact intervals
      // when there is jitter.  Instead we just sort of cut our losses, but only
      // if we cross a threshold, and that may mean some weirdness.
      if (new_time < t) {
        new_time = t;
      }
      heap.push(new_time, target[1]);
    }

    in_interval = false;
  }, this._granularity);

  return true;
};

Alarmer.prototype.pause = function() {
  if (!this._interval) {
    return false;
  }
  clearInterval(this._interval);
  this._elapsed = this.elapsed();
  this._t0 = 0;
  this._interval = null;
  return true;
};

Alarmer.prototype.reset = function() {
  this.pause();
  this._elapsed = 0;

  // Set all of the intervals up to be their initial state.
  this._interval_heap.each(function(heap_entry) {
    var target = heap_entry[1];
    heap_entry[0] = 0;  // Everything should start right away.
  });
  this._interval_heap.heapify();
};

Alarmer.prototype.add = function(name, callback, interval_millis) {
  if (this._interval) {
    return false;
  }
  var target = {};
  target.interval_millis = interval_millis;
  target.callback = callback;
  target.name = name;

  this._interval_heap.push(this.elapsed(), target);
  return true;
};

Alarmer.prototype.elapsed = function() {
  // If it's running, get the current time.
    // Otherwise, just what happened since the last pause.
  if (this._interval) {
    return this._elapsed + (new Date().getTime() - this._t0);
  } else {
    return this._elapsed;
  }
}


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
