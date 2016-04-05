(function(undefined) {

User = function(name) {
  this._name = name;
  this._stats = new KeyStats();
  this._levels_unlocked = {};
  this._levels_beaten = {};
}

User.prototype.name = function() {
  return this._name;
};

User.prototype.addStats = function(path, keystats) {
  path = KBLevels.normPath(path);
  this._stats.mergeFrom(keystats);
};

User.prototype.stats = function() {
  return this._stats;
};

function mapPaths(f, pathOrPaths) {
  var paths = pathOrPaths;
  if (typeof pathOrPaths === "string") {
    paths = [pathOrPaths];
  }
  for (var i=0, len=paths.length; i<len; i++) {
    f(paths[i]);
  }
};

function reducePaths(f, initial, pathOrPaths) {
  var paths = pathOrPaths;
  if (typeof pathOrPaths === "string") {
    paths = [pathOrPaths];
  }
  var curr = initial;
  for (var i=0, len=paths.length; i<len; i++) {
    curr = f(curr, paths[i]);
  }
  return curr;
};

User.prototype.unlock = function(pathOrPaths) {
  var that = this;
  mapPaths(function(path) {
    that._levels_unlocked[path] = true;
  }, pathOrPaths);
};

User.prototype.unlocked = function(pathOrPaths) {
  var that = this;
  return reducePaths(function(prev, path) {
    return prev && that._levels_unlocked[path];
  }, pathOrPaths);
};

User.prototype.beat = function(pathOrPaths) {
  var that = this;
  mapPaths(function(path) {
    that._levels_beaten[path] = true;
  }, pathOrPaths);
};

User.prototype.beaten = function(pathOrPaths) {
  var that = this;
  return reducePaths(function(prev, path) {
    return prev && that._levels_beaten[path];
  }, pathOrPaths);
};

}());
