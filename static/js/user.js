(function(undefined) {

User = function(name, levels) {
  this._name = name;
  this._levels = levels;
  this._level_stats = {};
  this._overall_stats = new KeyStats();
  this._levels_unlocked = {};
  this._levels_beaten = {};
}

User.prototype.name = function() {
  return this._name;
};

User.prototype.addStats = function(path, keystats) {
  if (this._level_stats[path] == null) {
    this._level_stats[path] = new KeyStats();
  }
  this._level_stats[path].mergeFrom(keyStats);
  this._overall_stats.mergeFrom(keystats);
};

User.prototype.levelStats = function(path) {
  return this._level_stats[path] || null;
};

User.prototype.overallStats = function() {
  return this._overall_stats;
};

User.prototype.unlock = function(path) {
  var paths = this._levels.ls(path);
  for (var i=0, len=paths.length; i<len; i++) {
    this._levels_unlocked[paths[i]] = true;
  }
};

User.prototype.isUnlocked = function(path) {
  var paths = this._levels.ls(path);
  for (var i=0, len=paths.length; i<len; i++) {
    if (!this._levels_unlocked[paths[i]]) {
      return false;
    }
  }
  return true;
};

User.prototype.beat = function(path) {
  var paths = this._levels.ls(path);
  for (var i=0, len=paths.length; i<len; i++) {
    this._levels_beaten[paths[i]] = true;
  }
};

User.prototype.isBeaten = function(path) {
  var paths = this._levels.ls(path);
  for (var i=0, len=paths.length; i<len; i++) {
    if (!this._levels_beaten[paths[i]]) {
      return false;
    }
  }
  return true;
};

}());
