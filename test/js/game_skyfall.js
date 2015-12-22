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

  // Using the width and height functions will just change styles, which
  // doesn't work properly.
  var cW = 2 * Math.ceil(this.radius + lineWidth);
  var cH = 2 * Math.ceil(this.radius + lineWidth);

  var centerMassX = w / 2;
  var centerMassY = h / 3;

  var cv = this.canvas = $('<canvas/>').attr({width: cW, height: cH})
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


function CountdownBanner(count, oncomplete) {
  this.oncomplete = oncomplete || function() {};
  this.count = count;

  this.elapsed = 0;
  this.nextTrigger = 1000;
}

CountdownBanner.prototype.draw = function(canvas) {
  canvas.clearCanvas()
  .drawText({
    fontSize: (canvas[0].height / 4) + 'px',
    fontWeight: 'bold',
    fontFamily: 'serif',
    fillStyle: 'black',
    x: canvas[0].width / 2,
    y: canvas[0].height / 2,
    text: "" + this.count,
  });
};

CountdownBanner.prototype.tick = function(dt) {
  if (this.count <= 0) {
    return false;
  }

  this.elapsed += dt;
  if (this.elapsed >= this.nextTrigger) {
    this.count--;
    if (this.count <= 0) {
      return false;
    }
    this.nextTrigger += 1000;
  }
  return true;
};


function PauseBanner(w, h) {
  this.w = w;
  this.h = h;

  var fh = Math.ceil(h / 2);

  this.canvas = $('<canvas/>').attr({width: w, height: h})
  .translateCanvas({
    translateX: w/2,
    translateY: h/2,
  })
  .drawRect({
    fillStyle: '#add8e6',
    opacity: 0.9,
    x: 0, y: 0,
    width: w, height: h,
  })
  .drawLine({
    strokeStyle: 'black',
    strokeWidth: 2,
    opacity: 0.9,
    x1: 0, y1: 0,
    x2: w, y1: 0,
  })
  .drawLine({
    strokeStyle: 'black',
    strokeWidth: 2,
    opacity: 0.9,
    x1: 0, y1: h,
    x2: w, y1: h,
  })
  .drawText({
    text: 'Paused',
    fillStyle: 'black',
    fontSize: fh,
    fontFamily: 'serif',
    fontWeight: 'bold',
  });
}

PauseBanner.prototype.draw = function(canvas) {
  var w = canvas[0].width;
  var h = canvas[0].height;
  canvas.drawImage({
    source: this.canvas[0],
    x: w / 2, y: h / 2,
  })
};

PauseBanner.prototype.tick = function(dt) {
};

PauseBanner.prototype.toString = function() {
  return "PauseBanner(x=", + this.x + ", y=" + this.y + ", w=", + this.w + ", h=" + this.h + ")";
};


function countdownBigBang(canvasId, counts, config) {
  canvas = $('#' + canvasId);

  var countdownBanner = new CountdownBanner(counts);

  return bigbang(window, {
    ontick: function(t, dt) {
      if (countdownBanner.tick(dt) === false) {
        return false;
      }
    },
    ondraw: function() {
      countdownBanner.draw(canvas);
    },
    onstop: config.onstop || function() {},
  });
};


function skyFallBigBang(canvasId, numDroplets, charGenerator, config) {
  canvas = $('#' + canvasId);
  width = canvas[0].width;
  height = canvas[0].height;

  var pause_banner = new PauseBanner(width, Math.ceil(height / 3));
  var paused = false;

  var items = [];

  var missedIndices = {};

  var minDim = Math.min(width, height);
  var dropletFontHeight = minDim / 10;
  var dropletMinSpeed = height / 6;
  var dropletMaxSpeed = height / 4;

  onhit = config.onhit || function() {};
  onmiss = config.onmiss || function() {};
  onlapse = config.onlapse || function() {};
  onstop = config.onstop || function() {};
  onkey = config.onkey || function() {};

  var hits = 0,
      misses = 0,
      lapses = 0;

  function hit(c) {
    hits++;
    console.debug("hit", c);
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
    console.debug("miss", droplet.c, "!=", c);
    onmiss(droplet.c, c);
  }

  function lapse(c) {
    lapses++;
    console.debug("lapse", c);
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
        ondroplet(i, items[i]);
      }
    }
  }

  function mapDroplets(f) {
    var output = [];
    foreachDroplet(function(i, d) {
      var result = f(i, d);
      if (result !== undefined) {
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
    var result = mapDroplets(function(i, d) {
      // Make sure it has the right characters and is at least partially visible.
      // No sense in allowing invisible droplets to be hit.
      if (d.c == c && d.y > -d.radius/2) {
        return {i: i, d: d};
      }
    });
    if (result.length == 0) {
      return null;
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
      if (keyPressed != null) {
        var c = String.fromCharCode(keyPressed);
        onkey(c);
        keyPressed = null;
        var match = findLowestDroplet(c);
        if (match == null) {
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
      if (e.type != "keypress") {
        return;
      }
      e.preventDefault();
      if (e.keyCode == 13 || e.keyCode == 32) { // hit Return or Space
        if (paused) {
          bb.start();
        } else {
          bb.pause();
        }
        return;
      }
      if (paused) {
        return;
      }
      if (keyPressed == null) {
        keyPressed = e.keyCode;
        return;
      }
      console.log("key pressed, but one is still in the queue");
    },
    onstart: function() {
      paused = false;
    },
    onpause: function() {
      paused = true;
      pause_banner.draw(canvas);
    },
    onstop: function() {
      console.log("stopped");
      onstop();
    },
  });
  return bb;
}
