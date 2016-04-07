(function(undefined) {

function mergeQueriesIgnoringEmpty(_args_) {
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
  // These are already in sorted order and uniquified. Compute the linear
  // intersection.
  for (var i=0, j=0; i<subset.length && j<superset.length; i++, j++) {
    for (; j<superset.length && superset[j] !== subset[i]; j++);
  }
  // If i makes it to the end before j, that means we ran out of matching
  // subset elements before running out of elements to check in the superset,
  // so it's a subset.
  return i === subset.length;
};

function UserLayout(id) {
  this.id = id;
  this.stats = new KeyStats();
  this.query_unlocked = null;
  this.query_beaten = null;
}

UserLayout.fromObj = function(obj) {
  var l = Object.create(UserLayout.prototype);
  l.id = obj.id;
  l.stats = obj.stats;
  l.query_unlocked = obj.query_unlocked;
  l.query_beaten = obj.query_beaten;
  return l;
};

UserLayout.prototype.toObj = function() {
  return {
    id: this.id,
    stats: this.stats,
    query_unlocked: this.query_unlocked,
    query_beaten: this.query_beaten,
  };
};

UserLayout.prototype.unlock = function(query) {
  this.query_unlocked = mergeQueriesIgnoringEmpty(this.query_unlocked, query);
};

UserLayout.prototype.beat = function(query) {
  this.query_beaten = mergeQueriesIgnoringEmpty(this.query_beaten, query);
};

UserLayout.prototype.unlocked = function(query) {
  console.debug('userlayout unlock query:', query, 'already unlocked:', this.query_unlocked);
  return queryContainedIn(query, this.query_unlocked);
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
    if (!obj.hasOwnProperty(k)) continue;
    user._layouts[k] = UserLayout.fromObj(obj[k]);
  }
  return user;
};

User.prototype.toObj = function() {
  // TODO: convert each layout to obj
  var layouts = {};
  for (var k in this._layouts) {
    if (!this._layouts.hasOwnProperty(k)) continue;
    layouts[k] = this._layouts[k];
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

User.prototype.unlock = function(layoutName, query) {
  this.layout(layoutName).unlock(query);
};

User.prototype.unlocked = function(layoutName, query) {
  return this.layout(layoutName).unlocked(query);
};

User.prototype.beat = function(layoutName, query) {
  this.layout(layoutName).beat(query);
};

User.prototype.beaten = function(layoutName, query) {
  return this.layout(layoutName).beaten(query);
};

}());
