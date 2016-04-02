(function($, undefined) {
"strict";

function _el(el) {
  return (typeof el === 'string') ? $('#' + el) : $(el);
}

function Droplet(fontHeight, speed, c) {
  this.x = 0;
  this.y = 0;

  this.speed = speed;
  this.c = c;

  var lineWidth = 3;

  // Calculate sizes and create our own personal canvas for this to make
  // drawing efficient.

  var textProperties = {
    text: this.c,
    fillStyle: 'black',
    fontFamily: 'serif',
    fontSize: fontHeight + 'px',
    fontWeight: 'bold',
    x: 0, y: 0,
    fromCenter: false,
  };

  var w = this.textWidth(textProperties),
      h = fontHeight;
  var guideWidth = Math.ceil(w * 1.5);

  this.radius = 1.5 * Math.sqrt(w*w/4 + h*h/4);

  var cW = 2 * Math.ceil(this.radius + lineWidth);
  var cH = cW;

  var centerMassX = w / 2;
  var centerMassY = h / 3;

  // Using the width and height functions will just change styles, which
  // doesn't work properly. Therefore we do both.
  var cv = this.canvas = $('<canvas/>')
  .attr({width: cW, height: cH})
  .translateCanvas({
    translateX: cW / 2,
    translateY: cH / 2,
  })
  .drawArc({
    fillStyle: this.fillColor(),
    strokeStyle: this.strokeColor(),
    strokeWidth: lineWidth,
    x: 0, y: 0,
    radius: this.radius,
  })
  .drawLine({
    strokeStyle: '#99b',
    strokeWidth: 1,
    x1: -guideWidth / 2, y1: 0,
    x2: guideWidth / 2, y2: 0,
  })
  .drawLine({
    strokeStyle: '#99b',
    strokeWidth: 1,
    x1: -guideWidth / 2, y1: h / 2,
    x2: guideWidth / 2, y2: h / 2,
  })
  .saveCanvas()
  .translateCanvas({
    translateX: -centerMassX,
    translateY: -centerMassY,
  })
  .drawText(textProperties)
  .restoreCanvas();
}

Droplet.prototype.textWidth = function(textProperties) {
  return $('<canvas/>').measureText(textProperties).width;
};

Droplet.prototype.fillColor = function() {
  return "#add8e6";
};

Droplet.prototype.strokeColor = function() {
  return "#d3d3d3";
};

Droplet.prototype.draw = function(canvas) {
  canvas.drawImage({
    translateX: this.x,
    translateY: this.y,
    source: this.canvas[0],
    x: 0, y: 0,
    fromCenter: true,
  });
};

Droplet.prototype.tick = function(dt) {
  this.y += (dt/1000) * this.speed;
};

Droplet.prototype.toString = function() {
  return "Droplet(x=" + this.x + ", y=" + this.y + ")";
};


function Explosion(droplet, baseColor) {
  this.baseColor = baseColor || droplet.fillColor();
  this.x = droplet.x;
  this.y = droplet.y;
  this.droplet = droplet;

  this.frameInterval = 30;
  this.t = 0;
  this.frame = 0;
  this.maxFrames = 10;
  this.nextFrame = this.frameInterval;
}

Explosion.prototype.draw = function(canvas) {
  var progress = Math.sqrt(this.frame / this.maxFrames);
  var scale = progress + 1;
  canvas
  .saveCanvas()
  .translateCanvas({
    translateX: this.x,
    translateY: this.y,
  })
  .drawArc({
    fillStyle: this.baseColor,
    strokeStyle: this.droplet.strokeColor(),
    scaleX: scale, scaleY: scale,
    opacity: 1 - progress,
    radius: this.droplet.radius,
    x: 0, y: 0,
  })
  .restoreCanvas();
};

Explosion.prototype.tick = function(dt) {
  this.t += dt;
  if (this.t >= this.nextFrame) {
    this.frame++;
    if (this.frame >= this.maxFrames) {
      return false;
    }
    this.nextFrame += this.frameInterval;
  }
};

Explosion.prototype.toString = function() {
  return "Explosion(x=" + this.x + ", y=" + this.y + ")";
};


function skyFallBigBang(canvas, numDroplets, charGenerator, config) {
  width = canvas[0].width;
  height = canvas[0].height;

  var items = [];

  var missedIndices = {};

  var minDim = Math.min(width, height);
  var dropletFontHeight = minDim / 10;
  var dropletMinSpeed = height / 6;
  var dropletMaxSpeed = height / 4;

  onhit = config.onhit || function() {};
  onmiss = config.onmiss || function() {};
  onlapse = config.onlapse || function() {};
  onpause = config.onpause || function() {};
  onkey = config.onkey || function() {};
  onstart = config.onstart || function() {};
  onstop = config.onstop || function() {};
  ontick = config.ontick || function() {};

  var hits = 0,
      misses = 0,
      lapses = 0;

  function hit(c) {
    hits++;
    onhit(c);
  }

  function possibleMiss(c) {
    var lowestI = 0;
    var lowest = null;
    foreachDroplet(function(i, d) {
      if (lowest == null || lowest.y < d.y) {
        lowest = d;
        lowestI = i;
      }
    });
    // Only count a miss once per droplet.
    if (!lowest) {
      return;
    }

    // Keep track of which falling droplets are "missed"
    // and which key was hit instead.
    // They won't get counted as elapsed when they fall.
    // And we don't update any stats or call any callbacks here: the player
    // might rescue the droplet.
    missedIndices[lowestI] = c;

    // Set the speed of the lowest droplet to be very high.
    lowest.speed *= 10;
  }

  function miss(droplet, c) {
    misses++;
    onmiss(droplet.c, c);
  }

  function lapse(c) {
    lapses++;
    onlapse(c);
  }

  var nextDropTime = 0;
  var timeBetweenDrops = 1000;

  var keyPressed = null;

  function newDroplet() {
    var speedWeight = Math.random();
    var speed = (speedWeight * dropletMinSpeed) + ((1 - speedWeight) * dropletMaxSpeed);
    var droplet = new Droplet(dropletFontHeight, speed, charGenerator());
    var xMin = 2 * droplet.radius;
    var xMax = width - 2 * droplet.radius;
    var xWeight = Math.random();
    droplet.x = (xWeight * xMin) + ((1 - xWeight) * xMax);
    droplet.y = -droplet.radius;
    return droplet;
  }

  function foreachDroplet(ondroplet) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] instanceof Droplet) {
        if (ondroplet(i, items[i]) === false) {
          return;
        }
      }
    }
  }

  function mapDroplets(f) {
    var output = [];
    foreachDroplet(function(i, d) {
      var result = f(i, d);
      if (result != null) {
        output.push(result);
      }
    });
    return output;
  }

  function removeIndices(arr, idxs) {
    for (var i = idxs.length - 1; i >= 0; i--) {
      var idx = idxs[i];
      arr = arr.slice(0, idx).concat(arr.slice(idx + 1));
    }
    return arr;
  }

  function removeCrashedDroplets() {
    foreachDroplet(function(i, d) {
      if (d.y >= height) {
        var missedChar = missedIndices[i];
        if (missedChar !== undefined) {
          // Missed - plummeted for reasons other than to little time.
          miss(d, missedChar);
          delete missedIndices[i];
        } else {
          // Lapsed - just call it a lapse.
          lapse(d.c);
        }
        items[i] = new Explosion(d, "#a44");
      }
    });
  }

  function findLowestDroplet(c) {
    var visible = false;
    var result = mapDroplets(function(i, d) {
      // No sense in allowing invisible droplets to be hit.
      if (d.y > -d.radius/2) {
        visible = true;
        // Make sure it has the right characters.
        if (d.c === c) {
          return {i: i, d: d};
        }
      }
    });
    if (!visible) {
      return null;
    }
    if (result.length == 0) {
      return {i: -1, d: null};
    }
    var best = result[0];
    for (var i = 1; i < result.length; i++) {
      if (best.d.y < result[i].d.y) {
        best = result[i];
      }
    }
    return best;
  }

  var dropletsEmitted = 0;

  var bb = bigbang(window, {
    ontick: function(t, dt) {
      ontick(t, dt); // pass through to configured tick (for clocks, for example).
      if (keyPressed != null) {
        var c = String.fromCharCode(keyPressed);
        keyPressed = null;
        onkey(c);
        // If no droplets are on the screen, we don't need to do anything when
        // keys are pressed.
        var match = findLowestDroplet(c);
        if (match === null) {
          // No droplets visible on screen.
          return;
        }
        if (match.d === null) {
          // No droplets matched this character.
          // Make the droplet fall faster, more likely to be lost.
          // If it reaches the bottom, it turns into a real miss.
          possibleMiss(c);
          return;
        }
        hit(c);
        items[match.i] = new Explosion(match.d);
      }
      removeCrashedDroplets();
      // Always tick all items, always remove expired tickers.
      var toRemove = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].tick(dt) === false) {
          toRemove.push(i);
        }
      }
      items = removeIndices(items, toRemove);
      // Now we have to check whether we have emitted the right number of
      // droplets. If we have, we don't create any more of them.
      if (dropletsEmitted < numDroplets) {
        if (t >= nextDropTime) {
          nextDropTime += timeBetweenDrops;
          items.push(newDroplet());
          dropletsEmitted++;
        }
      } else if (items.length == 0) {
        bb.stop();
      }
    },
    ondraw: function() {
      canvas.clearCanvas();
      for (var i = 0; i < items.length; i++) {
        canvas.saveCanvas();
        items[i].draw(canvas);
        canvas.restoreCanvas();
      }
    },
    onkey: function(e) {
      if (bb.state() !== 'run' || e.type !== "keypress") {
        return;
      }
      if (keyPressed == null) {
        keyPressed = e.keyCode;
        return;
      }
    },
    onpause: function() {
      onpause();
    },
    onstart: function() {
      onstart();
    },
    onstop: function() {
      onstop();
    },
  });

  return bb;
}

// - parent is the ID or actual element of the container for this canvas.
// - generator is a function that produces a character when asked.
// - config contains an event 'target', a 'num' of droplets to show, and
//     configuration for the bigbang (including things like 'onkey', 'onmouse',
//     etc.).
SkyFall = function(parent, generator, config) {
  config = config || {};
  this.parent = parent = _el(parent);

  var num = config.num || 10;
  var target = _el(config.target || window);

  var aspect = parent.height() / parent.width();
  var resWidth = window.screen.availWidth;
  var resHeight = resWidth * aspect;

  this.canvas = $('<canvas>')
  .addClass('skyfall-canvas')
  .attr({width: resWidth, height: resHeight})
  .width(parent.width())
  .height(parent.height())
  .appendTo(parent);


  var bb = skyFallBigBang(this.canvas, num, generator, config);

  this.start = bb.start;
  this.stop = bb.stop;
  this.pause = bb.pause;
  this.state = bb.state;
};

SkyFall.prototype.resize = function() {
  // This is a very simple, if naive, way of resizing an in-progress game.
  // Since we start at maximum resolution, this usually works fine scaling up
  // or down. It will look pixelated if moved to a larger screen and sized up,
  // though.
  this.canvas
  .width(this.parent.width())
  .height(this.parent.height());
};
}($));
