(function(undefined) {
  function User(name) {
    this._name = name;
    this._overall_stats = new KeyStats();
    this._achievements = [];
  }

  User.prototype.name = function() {
    return this._name;
  };

  User.prototype.addStats = function(keystats) {
    this._overall_stats.mergeFrom(keystats);
  };
}());
