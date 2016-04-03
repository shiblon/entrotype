(function(undefined){
"strict";

function _isa(child, parent) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
}

function splitPath(path) {
  path = (path || "").replace(/\/+$/, '');
  nextSlash = path.indexOf('/');
  if (nextSlash < 0) {
    return [path, ""];
  }
  return [path.substr(0, nextSlash), path.substr(nextSlash+1)];
}

function LNode(name, title, description, queryOrChildren) {
  if (!name.match(/^[a-zA-Z\d]\w*$/)) {
    throw "invalid name for group";
  }
  this._name = name;
  this._title = title;
  this._description = description;
  if (typeof queryOrChildren === "string") {
    this._query = queryOrChildren;
  } else {
    this._children = queryOrChildren;
    for (var i=0, len=this._children.length; i<len; i++) {
      this._children[i].parent(this);
    }
  }
}

LNode.prototype.parent = function(parent) {
  if (parent !== undefined) {
    this._parent = parent;
  }
  return this._parent;
};
LNode.prototype.children = function() { return this._children || null };
LNode.prototype.isGroup = function() { return this.children() != null };
LNode.prototype.name = function() { return this._name };
LNode.prototype.title = function() { return this._title };
LNode.prototype.description = function() { return this._description };
LNode.prototype.query =  function() {
  if (this._query !== undefined) {
    return this._query;
  }
  var queries = [];
  var children = this.children();
  if (children == null) {
    throw "group with no children";
  }
  for (var i=0, len=children.length; i<len; i++) {
    queries.push(children[i].query());
  }
  return queries.join(",");
};
LNode.prototype.ls = function() {
  if (!this.isGroup()) {
    console.log('leaf', [this.path()]);
    return [this.path()];
  }
  var leaves = [];
  var children = this.children();
  for (var i=0, len=children.length; i<len; i++) {
    Array.prototype.push.apply(leaves, children[i].ls());
  }
  return leaves;
};
LNode.prototype.pathElements = function() {
  var parent = this.parent();
  if (!parent) {
    return [this];
  }
  return parent.pathElements().concat([this]);
};
LNode.prototype.path = function() {
  var parent = this.parent();
  if (parent == null) {
    return "/";
  }
  // Remove any trailing '/', then add this element.
  return parent.path().replace(/\/+$/, '') + '/' + this.name();
};
LNode.prototype.search = function(relPath) {
  var ps = splitPath(relPath);
  var lookFor = ps[0],
      subPath = ps[1];

  if (lookFor === "" && subPath != null && subPath !== "") {
    // Oops - absolute path specified.
    throw "invalid relative path: " + relPath;
  }

  // No more elements expected.
  if (lookFor === "") {
    return this;
  }

  if (!this.isGroup()) {
    // Leaf node, but more elements expected.
    return null;
  }

  var children = this.children();
  for (var i=0, len=children.length; i<len; i++) {
    var child = children[i];
    if (child.name() === lookFor) {
      // Found a matching child - recur into that node.
      return child.search(subPath);
    }
  }

  // No matches found.
  return null;
};

function Level(name, query, title, description) {
  LNode.call(this, name, title, description, query);
}
_isa(Level, LNode);

function Group(name, title, description, children) {
  LNode.call(this, name, title, description, children);
}
_isa(Group, LNode);

function KBLevels(layout) {
  this._root = new Group('all', 'All Skills', 'All characters on the keyboard.', [
    new Group('home', 'Home Row', 'All keys on the home row.', [
      new Group('basic', 'Basic', 'Keys on the home row without modifier keys like shift.', [
        new Level('index', 'H2-', 'Index', 'The home row: the keys under your index fingers.'),
        new Level('middle', 'H3-', 'Middle', 'The home row: the keys under your middle fingers.'),
        new Level('ring', 'H4-', 'Ring', 'The home row: the keys under your ring fingers.'),
        new Level('pinky', 'H5-', 'Pinky', 'The home row: the keys under your pinky fingers.'),
        new Level('reach', 'H16-', 'Reach', 'The home row: letters and symbols you need to reach for.'),
      ]),
      new Group('shift', 'Shifted', 'Keys on the home row with shift held down.', [
        new Level('letters', 'HL!,HR1234!', 'Letters', 'The home row: using the shift key to get capital letters.'),
        new Level('symbols', 'HR56!', 'Symbols', 'The home row: using the shift key to get new symbols.'),
      ]),
    ]),
    new Group('top', 'Top Row', 'All keys on the top row', [
      new Group('basic', 'Basic', 'Keys on the top row without modifiers.', [
        new Level('index', 'T2-', 'Index', 'The top row: index fingers.'),
        new Level('middle', 'T3-', 'Middle', 'The top row: middle fingers.'),
        new Level('ring', 'T4-', 'Ring', 'The top row: ring fingers.'),
        new Level('pinky', 'T5-', 'Pinky', 'The top row: pinky fingers.'),
        new Level('letter_reach', 'T1-', 'Letter Reach', 'The top row: letters to reach for.'),
        new Level('sym_reach', 'T6-', 'Symbol Reach', 'The top row: symbols to reach for.'),
      ]),
      new Group('shift', 'Shifted', 'Keys on the top row with shift held down.', [
        new Level('letters', 'TL!,TR12345!', 'Letters', 'The top row: using the shift key to get capital letters.'),
        new Level('symbols', 'TR6!', 'Symbols', 'The top row: using the shift key to get new symbols.'),
      ]),
    ]),
    new Group('bottomrow', 'Bottom Row', 'All keys on the bottom row.', [
      new Group('basic', 'Basic', 'Keys on the bottom row without modifiers.', [
        new Level('index', 'B2-', 'Index', 'The bottom row: index fingers.'),
        new Level('middle', 'B3-', 'Middle', 'The bottom row: middle fingers.'),
        new Level('ring', 'B4-', 'Ring', 'The bottom row: ring fingers.'),
        new Level('pinky', 'B5-', 'Pinky', 'The bottom row: pinky fingers.'),
        new Level('reach', 'B16-', 'Reach', 'The bottom row: letters to reach for.'),
      ]),
      new Group('shift', 'Shifted', 'Keys on the bottom row with shift held down.', [
        new Level('letters', 'BL!,BR12!', 'Letters', 'The bottom row: using the shift key to get capital letters.'),
        new Level('symbols', 'BR3456!', 'Symbols', 'The bottom row: using the shift key to get new symbols.'),
      ]),
    ]),
    new Group('numberrow', 'Number Row', 'Keys on the number row.', [
      new Group('basic', 'Basic', 'Keys on the number row without modifiers.', [
        new Level('index', 'N2-', 'Index', 'The number row: index fingers.'),
        new Level('middle', 'N3-', 'Middle', 'The number row: middle fingers.'),
        new Level('ring', 'N4-', 'Ring', 'The number row: ring fingers.'),
        new Level('pinky', 'N5-', 'Pinky', 'The number row: pinky fingers.'),
        new Level('num_reach', 'N1-', 'Number Reach', 'The number row: numbers to reach for.'),
        new Level('sym_reach', 'N6-', 'Symbol Reach', 'The number row: symbols to reach for.'),
      ]),
      new Group('shift', 'Shifted', 'Keys on the number row with shift held down.', [
        new Level('index', 'N2!', 'Index', 'The number row shifted: index fingers.'),
        new Level('middle', 'N3!', 'Middle', 'The number row shifted: middle fingers.'),
        new Level('ring', 'N4!', 'Ring', 'The number row shifted: ring fingers.'),
        new Level('pinky', 'N5!', 'Pinky', 'The number row shifted: pinky fingers.'),
        new Level('sym_reach1', 'N1!', 'Symbol Reach I', 'The number row shifted: symbols to reach for.'),
        new Level('sym_reach2', 'N6!', 'Symbol Reach II', 'The number row shifted: more symbols to reach for.'),
      ]),
    ]),
  ]);
}

KBLevels.prototype.root = function() {
  return this._root;
};

KBLevels.prototype.search = function(path) {
  var ps = splitPath(path);
  if (ps[0] == "") {
    path = ps[1];
  }
  return this.root().search(path);
};

KB_LEVELS = new KBLevels();

}());
