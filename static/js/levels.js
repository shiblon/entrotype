(function(undefined){
"strict";

function Level(title, query, description) {
  this._title = title;
  this._query = query;
  this._description = description;
  this._parent = null;
}

Level.prototype.title = function() { return this._title };
Level.prototype.query = function() { return this._query };
Level.prototype.description = function() { return this._description };
Level.prototype.parent = function(parent) {
  if (parent !== undefined) {
    this._parent = parent;
  }
  return this._parent;
};

function Group(name, title, children) {
  this._name = name;
  this._title = title;
  this._children = children;
  this._parent = null;

  for (var i in this._children) {
    var c = this._children[i];
    c.parent(this);
  }
}

Group.prototype.name = function() { return this._name };
Group.prototype.title = function() { return this._title };
Group.prototype.children = function() { return this._children };
Group.prototype.parent = function() {
  if (parent !== undefined) {
    this._parent = parent;
  }
  return this._parent;
};
Group.prototype.query = function() {
  // Recursively add all of the queries together.
  var queries = [];
  for (var i=0, len=this._children.length; i<len; i++) {
    queries.push(this._children[i].query());
  }
  return queries.join(",");
};
Group.prototype.path = function() {
  var path = [this];
  var parent = this.parent();
  while (parent != null) {
    path.push(parent);
    parent = parent.parent();
  }
  return path.reverse();
};

function KBLevels(layout) {
  this._root = new Group('all', 'All Skills', [
    new Group('homerow', 'Home Row', [
      new Group('basic', 'Basic', [
        new Level('Index', 'H2-', 'The home row: the keys under your index fingers.'),
        new Level('Middle', 'H3-', 'The home row: the keys under your middle fingers.'),
        new Level('Ring', 'H4-', 'The home row: the keys under your ring fingers.'),
        new Level('Pinky', 'H5-', 'The home row: the keys under your pinky fingers.'),
        new Level('Reach', 'H16-', 'The home row: letters and symbols you need to reach for.'),
      ]),
      new Group('shift', 'Shifted', [
        new Level('Letters', 'HL!,HR1234!', 'The home row: using the shift key to get capital letters.'),
        new Level('Symbols', 'HR56!', 'The home row: using the shift key to get new symbols.'),
      ]),
    ]),
    new Group('toprow', 'Top Row', [
      new Group('basic', 'Basic', [
        new Level('Index', 'T2-', 'The top row: index fingers.'),
        new Level('Middle', 'T3-', 'The top row: middle fingers.'),
        new Level('Ring', 'T4-', 'The top row: ring fingers.'),
        new Level('Pinky', 'T5-', 'The top row: pinky fingers.'),
        new Level('Letter Reach', 'T1-', 'The top row: letters to reach for.'),
        new Level('Symbol Reach', 'T6-', 'The top row: symbols to reach for.'),
      ]),
      new Group('shift', 'Shifted', [
        new Level('Letters', 'TL!,TR12345!', 'The top row: using the shift key to get capital letters.'),
        new Level('Symbols', 'TR6!', 'The top row: using the shift key to get new symbols.'),
      ]),
    ]),
    new Group('bottomrow', 'Bottom Row', [
      new Group('basic', 'Basic', [
        new Level('Index', 'B2-', 'The bottom row: index fingers.'),
        new Level('Middle', 'B3-', 'The bottom row: middle fingers.'),
        new Level('Ring', 'B4-', 'The bottom row: ring fingers.'),
        new Level('Pinky', 'B5-', 'The bottom row: pinky fingers.'),
        new Level('Reach', 'B16-', 'The bottom row: letters to reach for.'),
      ]),
      new Group('shift', 'Shifted', [
        new Level('Letters', 'BL!,BR12!', 'The bottom row: using the shift key to get capital letters.'),
        new Level('Symbols', 'BR3456!', 'The bottom row: using the shift key to get new symbols.'),
      ]),
    ]),
    new Group('numberrow', 'Number Row', [
      new Group('basic', 'Basic', [
        new Level('Index', 'N2-', 'The number row: index fingers.'),
        new Level('Middle', 'N3-', 'The number row: middle fingers.'),
        new Level('Ring', 'N4-', 'The number row: ring fingers.'),
        new Level('Pinky', 'N5-', 'The number row: pinky fingers.'),
        new Level('Number Reach', 'N1-', 'The number row: numbers to reach for.'),
        new Level('Symbol Reach', 'N6-', 'The number row: symbols to reach for.'),
      ]),
      new Group('shift', 'Shifted', [
        new Level('Index', 'N2!', 'The number row shifted: index fingers.'),
        new Level('Middle', 'N3!', 'The number row shifted: middle fingers.'),
        new Level('Ring', 'N4!', 'The number row shifted: ring fingers.'),
        new Level('Pinky', 'N5!', 'The number row shifted: pinky fingers.'),
        new Level('Symbol Reach I', 'N1!', 'The number row shifted: symbols to reach for.'),
        new Level('Symbol Reach II', 'N6!', 'The number row shifted: more symbols to reach for.'),
      ]),
    ]),
  ]);
}

KBLevels.prototype.root = function() {
  return this._root;
}

KB_LEVELS = new KBLevels();

}());
