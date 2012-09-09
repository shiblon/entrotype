// Create a bounce game into a Raphael paper object.
// Arguments:
//  paper: Raphael paper object.
//  character_info: a character info object that contains the characters to
//    use in the game, and that can receive scoring information.
BounceGame = function(paper, character_info, difficulty) {
  difficulty = difficulty || 1;
  if (!character_info) {
    throw "Failed to pass character_info to new BounceGame(...).";
  }
  this.character_info = character_info;
  this.num_balls = 3;
  this.radius = 15;
  this.margin = 50;
  this.colors = ["red", "green", "blue", "orange", "pink", "purple"];
  this._difficulty = difficulty;

  // [simultaneous boundaries, seconds before vanishing, velocity multiplier]
  this.DIFFICULTIES = [
    [1,3,0.3],
    [2,3,0.3],
    [3,3,0.3],
    [4,3,0.3],
    [4,2.8,0.4],
    [4,2.6,0.5],
    [4,2.4,0.6],
    [4,2.0,0.7],
    [4,1.5,0.8],
    [4,1.0,0.9],
  ];

  this.BOUNDARY_DIFFICULTIES = [
    "bottom",
    "top",
    "left",
    "right",
  ];

  this.alarm = new Alarmer();
  this.paper = paper;
  this.boundary_rect = {
    x0: this.margin,
    x1: paper.width - this.margin,
    y0: this.margin,
    y1: paper.height - this.margin,
    w: paper.width - 2*this.margin,
    h: paper.height - 2*this.margin,
  };

  this.set_alarms();
  this.reset();
};

BounceGame.prototype.boundaries_in_play = function() {
  var d = this.DIFFICULTIES[this.difficulty()];
  return this.BOUNDARY_DIFFICULTIES.slice(0, d[0]);
};

BounceGame.prototype.vanishing_time = function() {
  return this.DIFFICULTIES[this.difficulty()][1] * 1000;
};

BounceGame.prototype.velocity_multiplier = function() {
  return this.DIFFICULTIES[this.difficulty()][2];
};

BounceGame.prototype.difficulty = function(difficulty) {
  if (difficulty != undefined) {
    this._difficulty = difficulty;
  }
  return this._difficulty;
};

BounceGame.prototype.on_keypress = function(keychar) {
  var possible_chars = [];
  for (var name in this.boundaries) {
    var boundary = this.boundaries[name];
    if (boundary.running()) {
      possible_chars.push([boundary.amount_complete(), boundary.char()]);
      if (boundary.char() == keychar) {
        boundary.reset();
        this.alarm.resurrect(name);
        this.character_info.report_correct(keychar);
        return;
      }
    }
  }
  // If we get this far, then the wrong character was pushed.  Penalize the one
  // with the most "time" on the clock (most near completion). Sometimes this
  // will be wrong, but probably moreso on harder levels where mistakes could
  // be for any of them anyway.
  possible_chars.sort(function(a,b){return b[0]-a[0]});
  console.log(possible_chars);
  var likely_target = possible_chars[0][1];
  this.character_info.report_incorrect(likely_target, keychar);
};

BounceGame.prototype.set_alarms = function() {
  var game = this;

  this.alarm.add("motion", function(name, elapsed_ms, dt_ms) {
    dt_ms = 50;  // ignore provided dt_ms
    for (var i=0, len=game.balls.length; i<len; ++i) {
      game.tick_ball(game.balls[i], dt_ms);
    }
    for (var bname in game.boundaries) {
      game.tick_boundary(game.boundaries[bname], dt_ms);
    }
    return true;
  }, 50, 50);

  var vanish_func = function(name, elapsed_ms, dt_ms) {
    var boundary = game.boundaries[name];
    boundary.start(game.character_info.next(),
                   function() {
                     game.character_info.report_timeout(boundary.char());
                     // Restart everything.
                     boundary.reset();
                     game.alarm.resurrect(name);
                   });
  };

  // These are one-shot alarms.  We resurrect them as needed.  They all start
  // off in the "dead" state, so they won't fire until first resurrected.
  var rand_ms = function() {
    var vt = game.vanishing_time() * 0.5;
    return Math.floor(random_deviate(vt, vt*0.3));
  };
  this.alarm.add("left", vanish_func, null, rand_ms(), true);
  this.alarm.add("right", vanish_func, null, rand_ms(), true);
  this.alarm.add("top", vanish_func, null, rand_ms(), true);
  this.alarm.add("bottom", vanish_func, null, rand_ms(), true);
};

BounceGame.prototype.tick_ball = function(ball, dt_ms) {
  var dt = dt_ms / 1000.0;
  var state = {
    x: ball.x + (ball.vx * dt),
    y: ball.y + (ball.vy * dt),
    vx: ball.vx,
    vy: ball.vy,
  };

  // Now we have old state in ball and new state in state. With that,
  // we can detect collisions with boundaries.
  //
  // NOTE: we take several shortcuts, since we don't let balls collide with
  // each other, and we always have rectilinear boundaries.
  // 1) Collision order does not matter: it generates a reflection about the
  //    reflected point no matter what anyway.
  // 2) Balls are only tested against boundaries.
  // 3) Boundaries are only expected to have one important dimension at a time.

  // Now detect collisions with the various boundaries.
  // Assume some things:
  // 1) Balls always start completely inside the boundaries.
  // 2) Boundaries are one-way.

  var boundary = null;

  boundary = this.boundaries["left"];
  if (boundary.solid()) {
    var center_boundary = boundary.x1 + ball.r;
    if (state.x < center_boundary) {
      // Collision on left boundary. Reflect about boundary point.
      state.x = 2 * center_boundary - state.x;
      state.vx = -state.vx;
    }
  }

  boundary = this.boundaries["right"];
  if (boundary.solid()) {
    var center_boundary = boundary.x0 - ball.r;
    if (state.x > center_boundary) {
      state.x = 2 * center_boundary - state.x;
      state.vx = -state.vx;
    }
  }

  boundary = this.boundaries["top"];
  if (boundary.solid()) {
    var center_boundary = boundary.y1 + ball.r;
    if (state.y < center_boundary) {
      state.y = 2 * center_boundary - state.y;
      state.vy = -state.vy;
    }
  }

  boundary = this.boundaries["bottom"];
  if (boundary.solid()) {
    var center_boundary = boundary.y0 - ball.r;
    if (state.y > center_boundary) {
      state.y = 2 * center_boundary - state.y;
      state.vy = -state.vy;
    }
  }

  ball.x = state.x;
  ball.y = state.y;
  ball.vx = state.vx;
  ball.vy = state.vy;

  ball.update_svg();
};

BounceGame.prototype.tick_boundary = function(boundary, dt_ms) {
  boundary.tick(dt_ms);
};

BounceGame.prototype.start = function() {
  return this.alarm.start();
};

BounceGame.prototype.pause = function() {
  return this.alarm.pause();
};

BounceGame.prototype.reset = function() {
  // Clear off the paper:
  this.paper.clear();
  this.alarm.reset();

  // TODO: add a countdown and *then* resurrect these.
  var working_set = this.boundaries_in_play();
  for (var i=0, len=working_set.length; i<len; ++i) {
    this.alarm.resurrect(working_set[i]);
  }

  this.reset_balls(this.boundary_rect);
  this.reset_boundaries(this.boundary_rect);
};

BounceGame.prototype.running = function() {
  return this.alarm.running();
};

BounceGame.prototype.random_item = function(list) {
  return list[Math.floor(Math.random() * list.length)];
};

BounceGame.prototype.reset_balls = function(boundaryRect) {
  this.balls = [];
  this.balls.length = this.num_balls;
  var vm = this.velocity_multiplier();
  var r = this.radius;
  for (var i=0, len=this.num_balls; i<len; ++i) {
    var x = Math.random() * (boundaryRect.w - 2*r) + r + boundaryRect.x0;
    var y = Math.random() * (boundaryRect.h - 2*r) + r + boundaryRect.y0;
    var vx = ((Math.random() + 1) * boundaryRect.w * vm) * random_sign();
    var vy = ((Math.random() + 1) * boundaryRect.h * vm) * random_sign();
    var color = this.random_item(this.colors);
    var ball = new Ball(r, x, y, vx, vy, this.paper, {color: color});
    ball.update_svg();
    this.balls[i] = ball;
  }
};

BounceGame.prototype.reset_boundaries = function(rect) {
  var vanish_time = this.vanishing_time();
  var attrs = {
    color: "lightblue",
    input_duration_ms: vanish_time,
    vanish_duration_ms: 2000,
    random_ms: vanish_time * 0.20,  // +/- 20%
  };
  this.boundaries = {
    left: new Boundary(0, rect.y0, rect.x0, rect.h, this.paper, attrs),
    right: new Boundary(rect.x1, rect.y0, rect.x0, rect.h, this.paper, attrs),
    top: new Boundary(rect.x0, 0, rect.w, rect.y0, this.paper, attrs),
    bottom: new Boundary(rect.x0, rect.y1, rect.w, rect.y0, this.paper, attrs),
  };
  for (var bname in this.boundaries) {
    this.boundaries[bname].reset();
    this.boundaries[bname].update_svg();
  }
};


Boundary = function(x0, y0, w, h, paper, attrs) {
  attrs = attrs || {};

  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x0 + w;
  this.y1 = y0 + h;
  this.w = w;
  this.h = h;

  this.font_size = Math.min(this.w * 0.9, this.h * 0.9);

  this.cx = this.x0 + this.w/2;
  this.cy = this.y0 + this.h/2;

  this.color = attrs["color"] || "black";

  this.svg_rect = paper.rect(this.x0, this.y0, this.w, this.h, 5);
  this.svg_text = paper.text(this.cx, this.cy, "");

  this.random_ms = attrs["random_ms"] || 1000;  // +/- this much to vanish

  this.STATE_IDLE = 0;
  this.STATE_TICKING = 1;
  this.STATE_VANISHED = 2;
  this.STATE_DONE = 3;

  this.BASE_DURATIONS = [
    null, // idle
    attrs["input_duration_ms"] || 3000,
    attrs["vanish_duration_ms"] || 3000,
    null, // done
  ];

  this.reset();
};

Boundary.prototype.char = function() {
  return this.cur_char;
};

Boundary.prototype.reset = function() {
  this.state = this.STATE_IDLE;
  this.cur_char = "";
  this.cur_duration = null;
  this.elapsed_ms_in_state = 0;
  this.update_svg();
};

Boundary.prototype.update_svg = function() {
  this.svg_rect.attr("fill", this.color).
                attr("fill-opacity", this.opacity()).
                attr("stroke-opacity", this.opacity()).
                attr("text", this.cur_char);
  this.svg_text.attr("font-size", this.font_size).
                attr("text", this.cur_char);
};

// Display the given char and start vanishing until told to stop.
Boundary.prototype.start = function(char, callback, callback_params) {
  this.cur_char = char;
  this.callback = callback || null;
  this.callback_params = callback_params;
  if (this.state != this.STATE_IDLE) {
    throw "Tried to start vanishing from non-idle state " + this.state;
  }
  this.state = this.STATE_TICKING;
  this.update_svg();
};

Boundary.prototype.amount_complete = function() {
  return Math.min(this.elapsed_ms_in_state, this.cur_duration) /
    this.cur_duration;
};

Boundary.prototype.solid = function() {
  return this.state < this.STATE_VANISHED;
};

Boundary.prototype.running = function() {
  return this.state != this.STATE_DONE && this.state != this.STATE_IDLE;
};

Boundary.prototype.opacity = function() {
  if (this.state == this.STATE_IDLE) return 1.0;

  if (this.state == this.STATE_TICKING) {
    return 1 - this.amount_complete();
  } else {
    return 0.0;
  }
}

Boundary.prototype.tick = function(dt_ms) {
  if (!this.running()) {
    this.cur_duration = null;
    return;
  }

  if (!this.cur_duration) {
    this.cur_duration = Math.floor(
      random_deviate(this.BASE_DURATIONS[this.state], this.random_ms));
  }

  this.elapsed_ms_in_state += dt_ms;

  if (this.amount_complete() >= 1.0) {
    ++this.state;
    this.elapsed_ms_in_state = 0;
    this.cur_duration = null;
    if (this.state == this.STATE_DONE) {
      if (this.callback) {
        this.callback(this.callback_params);
      }
    }
  }

  this.update_svg();
};


// Keeps track of position and velocity.
//
// Args:
//  x: initial x position
//  y: initial y position
//  r: radius
//  vx: initial x velocity
//  vy: initial y velocity
//  paper: Raphael paper object
//  attrs: a dictionary of optional attributes
Ball = function(r, x, y, vx, vy, paper, attrs) {
  attrs = attrs || {};

  this.r = r;
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;

  this.color = attrs["color"] || "black";

  this.svg = paper.circle(x, y, r);
  this.svg.attr("fill", this.color);

};

Ball.prototype.update_svg = function() {
  this.svg.attr("cx", Math.floor(this.x)).
           attr("cy", Math.floor(this.y)).
           attr("r", Math.floor(this.r)).
           attr("fill", this.color);
};

random_deviate = function(base, deviate) {
  deviate = deviate || 0;
  return base + (Math.random() * 2 - 1) * deviate;
};

random_sign = function() {
  return (Math.random() > 0.5) ? 1 : -1;
};

