BounceGame = function(paper) {
  // TODO: create wall objects that can respond to keyboard events, fade in and
  // out, and turn collisions on and off (will require some changes to the ball
  // collision routines - they'll have to ask an oracle, now).
  this.alarm = new Alarmer();
  this.paper = paper;
  this.colors = ["red", "green", "blue", "orange", "pink", "purple"];
  this.num_balls = 4;
  this.balls = [];
  this.radius = 15;
  var r = this.radius;
  for (var i=0; i<this.num_balls; ++i) {
    var vx = Math.random() * this.paper.width/4 + this.paper.width/4;
    var vy = Math.random() * this.paper.height/4 + this.paper.height/4;
    var ball = new BouncingBall(
      this.paper,
      Math.floor(Math.random() * (this.paper.width - 2*r) + r),
      Math.floor(Math.random() * (this.paper.height - 2*r) + r),
      r,
      vx * ((Math.random() > 0.5) ? 1 : -1),
      vy * ((Math.random() > 0.5) ? 1 : -1),
      {color: this.colors[Math.floor(Math.random() * this.colors.length)],
       yacc: 200});
    this.balls.push(ball);
  }

  var game = this;
  this.alarm.add("motion", function(name, elapsed_ms, dt_ms) {
    for (var i=0, len=game.balls.length; i<len; ++i) {
      game.balls[i].tick(dt_ms / 1000.0);
    }
    return true;
  }, 50, 50);
};

BounceGame.prototype.start = function() {
  return this.alarm.start();
};

BounceGame.prototype.pause = function() {
  return this.alarm.pause();
};

BounceGame.prototype.running = function() {
  return this.alarm.running();
};

BounceGame.prototype.reset = function() {
  // TODO: reset other game state, too?
  return this.alarm.reset();
};


// Takes a Raphael Paper object and draws a ball into it.
// Also keeps track of position and velocity, and allows the ball to be moved
// via a tick method. Handles wall collisions.
//
// Args:
//  paper: Raphael paper object
//  x: initial x position
//  y: initial y position
//  r: radius
//  vx: initial x velocity
//  vy: initial y velocity
BouncingBall = function(paper, x, y, r, vx, vy, options) {
  this.paper = paper;
  this.svg_circle = paper.circle(x, y, r);

  this.bound_w = this.paper.width;
  this.bound_h = this.paper.height;

  this.radius = r;
  this.color = options["color"] || "black";

  this.cx = x;
  this.cy = y;

  this.vx = vx;
  this.vy = vy;

  this.update_svg();
};

BouncingBall.prototype.update_svg = function() {
  var x = Math.floor(this.cx),
      y = Math.floor(this.cy),
      r = Math.floor(this.radius);
  this.svg_circle.attr("cx", x).
    attr("cy", y).
    attr("r", r).
    attr("fill", this.color);
};

BouncingBall.prototype.tick = function(dt) {
  var n_list = this.new_vals(this.cx, this.cy, this.vx, this.vy, dt);
  this.cx = n_list[0];
  this.cy = n_list[1];
  this.vx = n_list[2];
  this.vy = n_list[3];
  this.update_svg();
};

// Returns new x, y, vx, vy.
BouncingBall.prototype.new_vals = function(x, y, vx, vy, dt) {
  var n_x = x + vx * dt,
      n_y = y + vy * dt;
  // Detect boundary collisions.
  // These contain the amount we are past the boundary.
  var e_t_x = 0,
      e_t_y = 0;
  // Find out how much time we would travel out of bounds in either
  // dimension.
  if (n_x > this.bound_w - this.radius) {
    var e_x = n_x - (this.bound_w - this.radius);
    e_t_x = dt * Math.abs(e_x / (n_x - x));
  } else if (n_x < this.radius) {
    var e_x = n_x - this.radius;
    e_t_x = dt * Math.abs(e_x / (n_x - x));
  }
  if (n_y > this.bound_h - this.radius) {
    var e_y = n_y - (this.bound_h - this.radius);
    e_t_y = dt * Math.abs(e_y / (n_y - y));
  } else if (n_y < this.radius) {
    var e_y = n_y - this.radius;
    e_t_y = dt * Math.abs(e_y / (n_y - y));
  }
  if (e_t_y > 0 || e_t_x > 0) {
    // A collision occurred in at least one dimension.
    // We use the one that we hit first (the most time spent out of
    // bounds). Once we know that, we make a bounce happen by setting
    // the new dt to the time spent out of bounds, set the position to
    // the location of the collision, and reverse the appropriate
    // velocity. We then try again from this new point.
    if (e_t_x > e_t_y) {
      var n_dt = dt - e_t_x;
      return this.new_vals(
          x + vx * n_dt,
          y + vy * n_dt,
          -vx,
          vy,
          e_t_x);
    } else {
      var n_dt = dt - e_t_y;
      return this.new_vals(
          x + vx * n_dt,
          y + vy * n_dt,
          vx,
          -vy,
          e_t_y);
    }
  }
  return [n_x, n_y, vx, vy];
};

