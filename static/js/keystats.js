(function(undefined) {
function heatColorAt(level) {
  var r1 = 255, g1 = 0, b1 = 0;
  var r2 = 0, g2 = 0, b2 = 255;

  var amt = (level - 0.5) * 2;

  if (amt < 0) {
    amt = -amt;
    return [
      Math.floor(amt * r1 + (1-amt) * 255),
      Math.floor(amt * g1 + (1-amt) * 255),
      Math.floor(amt * b1 + (1-amt) * 255),
    ];
  } else {
    return [
      Math.floor(amt * r2 + (1-amt) * 255),
      Math.floor(amt * g2 + (1-amt) * 255),
      Math.floor(amt * b2 + (1-amt) * 255),
    ];
  }
}

function Stat(ch) {
  this.ch = ch;
  this.hits = 0;
  this.misses = 0;
  this.lapses = 0;
  this.missesPerActual = {};
}

Stat.prototype.copy = function() {
  var s = new Stat(this.ch);
  s.hits = this.hits;
  s.misses = this.misses;
  s.lapses = this.lapses;
  for (var k in this.missesPerAcutal) {
    if (!this.missesPerActual.hasOwnProperty(k)) continue;
    s.missesPerActual[k] = this.missesPerActual[k];
  }
  return s;
};

Stat.prototype.good = function() {
  return this.hits;
};

Stat.prototype.all = function() {
  return this.hits + this.lapses + this.misses;
};

Stat.prototype.bad = function() {
  return this.lapses + this.misses;
};

Stat.prototype.heatRGB = function() {
  if (this.all() === 0) {
    return heatColorAt(0.5);
  }
  return heatColorAt(this.good() / this.all());
};

Stat.prototype.mergeFrom = function(stat) {
  if (stat.ch !== this.ch) {
    throw "can't merge stats for different keys: " + this.ch + " != " + stat.ch;
  }
  this.hits += stat.hits;
  this.misses += stat.misses;
  this.lapses += stat.lapses;
  for (var k in stat.missesPerActual) {
    if (!Object.hasOwnProperty.call(stat.missesPerActual, k)) continue;
    this.missesPerActual[k] = +this.missesPerActual[k] + stat.missesPerActual[k];
  }
};

Stat.fromObj = function(obj) {
  var s = new Stat();
  s.ch = obj.ch;
  s.hits = obj.hits;
  s.misses = obj.misses;
  s.lapses = obj.lapses;
  s.missesPerActual = obj.missesPerActual;
  return s;
};

KeyStats = function() {
  this.keys = {};
  this.hits = 0;
  this.misses = 0;
  this.lapses = 0;
};

KeyStats.prototype.good = function() {
  return this.hits;
};

KeyStats.prototype.all = function() {
  return this.hits + this.lapses + this.misses;
};

KeyStats.prototype.bad = function() {
  return this.lapses + this.misses;
};

// Create a new KeyStats object taking statistics only for the given characters.
// This is useful if you have, say, a query and a set of overall statistics.
// You can calculate just the portion of those stats that apply to the query.
KeyStats.prototype.subStats = function(chars) {
  var ks = new KeyStats();
  for (var i=0, len=chars.length; i<len; i++) {
    var ch = chars[i];
    var stat = this.keys[ch];
    if (stat === undefined) continue;
    ks.keys[ch] = stat.copy();
    ks.hits += stat.hits || 0;
    ks.misses += stat.misses || 0;
    ks.lapses += stat.lapses || 0;
  }
  return ks;
};

KeyStats.prototype.keyStats = function(ch) {
  if (!(ch in this.keys)) {
    this.keys[ch] = new Stat(ch);
  }
  return this.keys[ch];
};

KeyStats.prototype.addHit = function(ch, num) {
  num = (num != null) ? num : 1;
  var ks = this.keyStats(ch);
  ks.hits += num;
  this.hits += num;
};

KeyStats.prototype.addMiss = function(ch, actual, num) {
  num = (num != null) ? num : 1;
  var ks = this.keyStats(ch);
  ks.misses += num;
  ks.missesPerActual[actual] = (ks.missesPerActual[actual] || 0) + num;
  this.misses += num;
};

KeyStats.prototype.addLapse = function(ch, num) {
  num = (num != null) ? num : 1;
  var ks = this.keyStats(ch);
  ks.lapses += num;
  this.lapses += num;
};

KeyStats.prototype.mergeFrom = function(stats) {
  this.hits += stats.hits;
  this.misses += stats.misses;
  this.lapses += stats.lapses;
  for (var k in stats.keys) {
    var ks = this.keyStats(k);
    ks.mergeFrom(stats.keys[k]);
  }
};

function _makeSampler(cumulativeDist) {
  return function() {
    var r = Math.random();
    for (var i in cumulativeDist) {
      var val = cumulativeDist[i][0],
          weight = cumulativeDist[i][1];
      if (weight >= r) {
        return val;
      }
    }
    throw "impossible situation: no value chosen from cumulative distribution";
  };
}

// Create a sampling function that pulls from the given universe of
// keys. If universe == null or empty, then pulls from all of the keys it
// knows about.
KeyStats.prototype.makeSampler = function(universe) {
  if (universe == null || universe.length === 0) {
    universe = [];
    for (var k in this.keys) {
      universe.push(k);
    }
  }

  // To create a distribution, we use the ratio of misses+lapses to total
  // times seen. A key is more likely to be seen again if the ratio is high,
  // less likely if it is low. The ratio should never be zero - a key should
  // always have some likelihood of being seen again.
  // The progression is not linear. A lot of misses should cap out at some
  // point. Generally, if something is missed more than some fixed default
  // ratio, it is the same as if it were missed by exactly that default
  // ratio. The likelihood for that ratio is the same as if the key has never
  // been seen.
  var MAX_RATIO = 0.3;
  var MIN_RATIO = 0.02;
  var SQRT_MAX = Math.sqrt(MAX_RATIO);
  var SQRT_MIN = Math.sqrt(MIN_RATIO);
  var MIN_LIKELIHOOD = 0.05;
  var dist = {};
  for (var i in universe) {
    var k = universe[i];
    if (!(k in this.keys)) {
      dist[k] = 1.0;
    } else {
      var ks = this.keyStats(k);
      var r = MIN_RATIO;
      if (ks.all() !== 0) {
        r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ks.bad() / ks.all()));
      }
      // Now delinearize it and stretch it between 0 and 1.
      dist[k] = (Math.sqrt(r) - SQRT_MIN) / (SQRT_MAX - SQRT_MIN);
      // Finally stretch it between MIN_LIKELIHOOD and 1.
      dist[k] = dist[k] * (1 - MIN_LIKELIHOOD) + MIN_LIKELIHOOD;
    }
  }

  // There is no need to normalize the distribution any further, since we are
  // just sampling. We can recover the total weight by looking at the last
  // member of the cumulative distribution, after it is computed.

  var ordered = [];
  for (var k in dist) {
    ordered.push([k, dist[k]]);
  }
  // Order descending, then compute cumulative distribution.
  ordered.sort(function(a, b) { return b[1] - a[1]; });
  var prevWeight = 0;
  for (var i in ordered) {
    var k = ordered[i][0];
    var w = ordered[i][1];
    prevWeight += w;
    ordered[i] = [k, prevWeight];
  }

  // Normalize the cumulative distribution.
  var normConst = ordered[ordered.length - 1][1];
  for (var i in ordered) {
    ordered[i][1] /= normConst;
  }

  // Provide a sampling function that takes these stats into account.
  // Note that we use a level of indirection to avoid packaging up too much
  // cruft into the closure.
  return _makeSampler(ordered);
};

KeyStats.prototype.heatRGBForChar = function(ch) {
  return this.keyStats(ch).heatRGB();
};

KeyStats.prototype.toObj = function() {
  return {
    hits: this.hits,
    misses: this.misses,
    lapses: this.lapses,
    keys: this.keys,
  };
};

KeyStats.prototype.toJSON = function(jfunc, jsep) {
  return JSON.stringify(this.toObj(), jfunc, jsep);
};

KeyStats.fromObj = function(obj) {
  var ks = new KeyStats();
  ks.hits = obj.hits;
  ks.misses = obj.misses;
  ks.lapses = obj.lapses;
  for (var k in obj.keys) {
    ks.keys[k] = Stat.fromObj(obj.keys[k]);
  }
  return ks;
};

KeyStats.fromJSON = function(json) {
  return KeyStats.fromObj(JSON.parse(json));
};
}());
