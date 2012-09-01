Alarmer = function(granularity_millis) {
  this._heap = [];
  this._dead_actions = [];
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
  var heap = this._heap;

  this._interval = setInterval(function() {
    if (!alarmer._interval || in_interval) return;
    in_interval = true;

    var t = alarmer.elapsed();
    while (alarmer._interval && heap.length && heap[0][0] <= t) {
      var entry = Heap.pop(heap);
      var action = entry[1];
      // If false is returned, this is not added back into the heap.
      // Actions that want to continue receiving events must return true.
      // Similarly, if the interval is null, this is a one-shot action.
      var dt = t - action._last_time;
      action._last_time = t;
      if (action.callback(action.name, t, dt) && action.dt_ms != null) {
        Heap.push(heap, entry[0] + action.dt_ms, action);
      } else {
        // Save in case we reset later.
        alarmer._dead_actions.push(action);
      }
    }

    in_interval = false;
  }, this._granularity);

  return true;
};

Alarmer.prototype.running = function() {
  return Boolean(this._interval);
}

Alarmer.prototype.pause = function() {
  if (!this._interval) return false;
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
  var heap = this._heap;
  for (var i=0, len=heap.length; i<len; ++i) {
    heap[i][1]._last_time = 0;
    heap[i][0] = heap[i][1].t0_ms;
  }

  Heap.heapify(heap);

  // Add the dead actions back.
  var dead = this._dead_actions;
  var len = heap.length;
  for (var i=0, len=dead.length; i<len; ++i) {
    var action = dead[i];
    Heap.push(heap, action.t0_ms, action);
  }
  this._dead_actions = [];
};

// Add a new action to the alarmer.
// Args:
//  name: Name of the action.
//  callback: a function to call when the deadline is reached. Takes
//    arguments (name, alarm_time, time_since_last_callback) and returns
//    a bool indicating whether further events should be sent to this action.
//  dt_ms: number of milliseconds between calls (roughly). If
//    this is null, then it will call the callback exactly once and be done.
//  t0_ms: if specified, the first callback will be delayed by this amount.
Alarmer.prototype.add = function(name, callback, dt_ms, t0_ms) {
  t0_ms = t0_ms || 0;
  if (dt_ms == undefined) dt_ms = null;
  if (!dt_ms && !t0_ms) {
    throw "You must specify at least one of interval or delay.";
  }
  var deadline = this.elapsed() + t0_ms;
  Heap.push(this._heap, deadline, {
    name: name,
    callback: callback,
    dt_ms: dt_ms,
    t0_ms: t0_ms,
    _last_time: 0,
  });
  return true;
};

Alarmer.prototype.elapsed = function() {
  // If it's running, get the current time.
  // Otherwise, just what happened since the last pause.
  if (!this._interval) return this._elapsed;
  return this._elapsed + (new Date().getTime() - this._t0);
};
