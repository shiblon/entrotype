(function(undefined) {

User = function(name) {
  this._name = name;
  this._overall_stats = new KeyStats();
  this._achievements = [];
  this._levels_unlocked = {};
}

User.prototype.name = function() {
  return this._name;
};

User.prototype.addStats = function(keystats) {
  this._overall_stats.mergeFrom(keystats);
};

User.prototype.unlockLevel = function(levelPath) {
  this._levels_unlocked[levelPath] = true;
};

User.prototype.isUnlockedLevel = function(levelPath) {
  return this._levels_unlocked[levelPath] || false;
};

}());
