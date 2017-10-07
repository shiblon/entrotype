(function(undefined) {

function mergeQueriesIgnoringEmpty(_) {
  console.log("merge queries:", Array.prototype.join.call(arguments, ", ");
  var usable = [];
  for (var i=0, len=arguments.length; i<len; i++) {
    var q = arguments[i];
    if (q != null && q !== "") {
      usable.push(q);
    }
  }
  return KeyboardLayout.simplify(usable);
};

function queryContainedIn(subQuery, superQuery) {
  if (superQuery == null) {
    return false;
  }
  var subset = KeyboardLayout.expand(subQuery),
      superset = KeyboardLayout.expand(superQuery);
  // These are already in sorted order and uniquified. Ensure that all elements
  // in subset are in superset.
  var isuper = 0;
  for (var isub = 0; isub < subset.length; isub++) {
    while (isuper < superset.length && superset[isuper] < subset[isub]) {
      isuper++;
    }
    // Element not found in superset.
    if (isuper === superset.length || superset[isuper] !== subset[isub]) {
      return false;
    }
  }
  return true;
};

function UserLayout(id) {
  this.id = id;
  this.stats = new KeyStats();
  this.query_beaten = null;
}

UserLayout.fromObj = function(obj) {
  var l = Object.create(UserLayout.prototype);
  l.id = obj.id;
  l.stats = KeyStats.fromObj(obj.stats);
  l.query_beaten = obj.query_beaten;
  return l;
};

UserLayout.prototype.toObj = function() {
  return {
    id: this.id,
    stats: this.stats.toObj(),
    query_beaten: this.query_beaten,
  };
};

UserLayout.prototype.beat = function(query) {
  this.query_beaten = mergeQueriesIgnoringEmpty(this.query_beaten, query);
};

UserLayout.prototype.beaten = function(query) {
  return queryContainedIn(query, this.query_beaten);
};

User = function(name) {
  this._name = name;
  this._layouts = {};
}

User.fromObj = function(obj) {
  var user = Object.create(User.prototype);
  user._name = obj.name;
  user._layouts = {};
  for (var k in obj.layouts) {
    if (!obj.layouts.hasOwnProperty(k)) continue;
    user._layouts[k] = UserLayout.fromObj(obj.layouts[k]);
  }
  return user;
};

User.prototype.toObj = function() {
  var layouts = {};
  for (var k in this._layouts) {
    if (!this._layouts.hasOwnProperty(k)) continue;
    layouts[k] = this._layouts[k].toObj();
  }
  return {
    name: this.name(),
    layouts: layouts,
  };
};

User.prototype.layout = function(layoutName) {
  if (this._layouts[layoutName] == null) {
    this._layouts[layoutName] = new UserLayout(layoutName);
  }
  return this._layouts[layoutName];
};

User.prototype.name = function(val) {
  if (typeof val !== "undefined") {
    this._name = val;
  }
  return this._name;
};

User.prototype.addStats = function(layoutName, keystats) {
  this.layout(layoutName).stats.mergeFrom(keystats);
};

User.prototype.stats = function(layoutName) {
  return this.layout(layoutName).stats;
};

User.prototype.beat = function(layoutName, query) {
  this.layout(layoutName).beat(query);
};

User.prototype.beaten = function(layoutName, query) {
  return this.layout(layoutName).beaten(query);
};

}());
