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
      if (action.callback(action.name, t) && action.interval_millis != null) {
        Heap.push(heap, entry[0] + action.interval_millis, action);
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
    // Set the schedule to "immediately":
    heap[i][0] = heap[i][1].initial_delay;
  }

  Heap.heapify(heap);

  // Add the dead actions back.
  var dead = this._dead_actions;
  var len = heap.length;
  for (var i=0, len=dead.length; i<len; ++i) {
    var action = dead[i];
    Heap.push(heap, action.initial_delay, action);
  }
  this._dead_actions = [];
};

// Add a new action to the alarmer.
// Args:
//  name: Name of the action.
//  callback: a function to call when the deadline is reached. Takes
//    arguments (name, time) and returns a bool indicating whether further
//    events should be sent to this action.
//  interval_millis: number of milliseconds between calls (roughly). If
//    this is null, then it will call the callback exactly once and be done.
//  initial_delay: if specified, the callback will not be called immediately
//    when the alarmer is started - the first call will be after an initial
//    delay of interval_millis.  This can be useful for building one-shot
//    actions, which would set the delay and return "false" on their first
//    invocation.
Alarmer.prototype.add = function(
    name, callback, interval_millis, initial_delay) {
  initial_delay = initial_delay || 0;
  if (interval_millis == undefined) interval_millis = null;
  if (!interval_millis && !initial_delay) {
    throw "You must specify at least one of interval or delay.";
  }
  var deadline = this.elapsed() + initial_delay;
  Heap.push(this._heap, deadline, {
    name: name,
    callback: callback,
    interval_millis: interval_millis,
    initial_delay: initial_delay,
  });
  return true;
};

Alarmer.prototype.elapsed = function() {
  // If it's running, get the current time.
  // Otherwise, just what happened since the last pause.
  if (!this._interval) return this._elapsed;
  return this._elapsed + (new Date().getTime() - this._t0);
};
