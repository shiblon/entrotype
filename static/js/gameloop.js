// Creates an animation loop that will call the given callback(dt) for
// every animation frame. Returns an object with a "start" and "stop"
// function used to control the loop.
function animloop(callback) {
  var last_ts = null;
  var repeat = true;
  function step(ts) {
    if (last_ts == null) {
      last_ts = ts;
    }
    if (!repeat) {
      return;
    }
    // Clamp time changes to 75 ms, since they should only ever be that long if
    // the tab disappears or the game is otherwise paused. We don't want
    // wormholes.
    var ret = callback(Math.min(ts - last_ts, 75));
    last_ts = ts;
    if (ret === false) {
      return;
    }
    requestAnimationFrame(step);
  }
  return {
    "start": function() {
      repeat = true;
      requestAnimationFrame(step);
    },
    "stop": function() {
      repeat = false;
    }
  };
}

// Sets up a complete game loop.
//
// Args:
//   target: a DOM object on which to register handlers.
//   config: an object that can contain the following fields:
//     ontick: a function(t_ms, dt_ms) to call for changing state.
//     ondraw: a function to call for every animation frame.
//     interval: minimum ms to pass between calls to "tick". Default = 0.
//     onkey: an event listener for all keyboard events.
//     onmouse: an event listener for all mouse events.
//     onstart: a function to call when starting (or continuing).
//     onpause: a function to call when pausing.
//     onstop: a function to call when stopping for good.
function bigbang(target, config) {
  var ontick = config.ontick || function() {};
  var ondraw = config.ondraw || function() {};
  var onstart = config.onstart || function() {};
  var onpause = config.onpause || function() {};
  var onstop = config.onstop || function() {};

  var interval = config.interval;
  if (!interval || interval < 0) {
    interval = 0;
  }

  if (target && config.onmouse) {
    target.addEventListener("mousedown", config.onmouse);
    target.addEventListener("mouseup", config.onmouse);
    target.addEventListener("mousemove", config.onmouse);
  }

  if (target && config.onkey) {
    target.addEventListener("keypress", config.onkey);
    target.addEventListener("keydown", config.onkey);
    target.addEventListener("keyup", config.onkey);
  }

  function removeListeners() {
    if (target && config.onmouse) {
      target.removeEventListener("mousedown", config.onmouse);
      target.removeEventListener("mouseup", config.onmouse);
      target.removeEventListener("mousemove", config.onmouse);
    }

    if (target && config.onkey) {
      target.removeEventListener("keypress", config.onkey);
      target.removeEventListener("keydown", config.onkey);
      target.removeEventListener("keyup", config.onkey);
    }
  }

  var tnext = 0;
  var t = 0;
  var aloop = animloop(function(dt) {
    t += dt;
    if (!tnext) {
      tnext = t;
    }
    if (!interval || t >= tnext) {
      tnext += interval;
      if (false === ontick(t, dt)) {
        stop();
        return false;
      }
    }
    if (false === ondraw()) {
      stop();
      return false;
    }
    return true;
  });

  var running = false;
  var paused = false;

  function start() {
    if (!aloop) {
      return false;
    }
    running = true;
    paused = false;
    onstart();
    aloop.start();
    return true;
  }

  function pause() {
    if (!aloop || !running || paused) {
      return false;
    }
    aloop.stop();
    running = true;
    paused = true;
    onpause();
    return true;
  }

  function stop() {
    if (!aloop) {
      return false;
    }
    aloop.stop();
    aloop = null;
    running = false;
    paused = false;
    removeListeners();
    onstop();
    return true;
  }

  function state() {
    if (!aloop) {
      return 'stop';
    }
    if (!running) {
      return 'init';
    }
    if (paused) {
      return 'pause';
    }
    return 'run';
  }

  return {'start': start, 'pause': pause, 'stop': stop, 'state': state};
}
