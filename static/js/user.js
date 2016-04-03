(function(undefined) {

User = function(name, levels) {
  this._name = name;
  this._levels = levels;
  this._overall_stats = new KeyStats();
  this._achievements = [];
  this._levels_unlocked = {};
  this._levels_beaten = {};
}

User.prototype.name = function() {
  return this._name;
};

User.prototype.addStats = function(keystats) {
  this._overall_stats.mergeFrom(keystats);
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
