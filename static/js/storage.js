(function(undefined) {

// Paths must be arrays of nonzero length with nonzero elements.
function consumePathArgs(args, needValue) {
  args = Array.prototype.slice.call(args, 0);
  var value = undefined;
  if (needValue) {
    if (args.length < 2) {
      throw new Error("too few path arguments; expected keys and value, got " +
                      JSON.stringify(args));
    }
    value = args[args.length-1];
    args = args.slice(0, args.length-1);
  }
  if (args.length === 0) {
    throw new Error("empty path not allowed");
  }

  for (var i=0, len=args.length; i<len; i++) {
    if (typeof args[i] !== "string" || args[i].length === 0) {
      throw new Error("empty element (" + i + ") in path: { " + args[i] + " }");
    }
  }

  return {
    keys: args,
    value: value,
  };
}

stListMatching = function(re) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't list keys.";
  }
  var keys = [];
  for (var i=0, len=localStorage.length; i<len; i++) {
    var k = localStorage.key(i);
    if (re.test(k)) {
      keys.push(k);
    }
  }
  return keys;
};

stListMatchGroups = function(re) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't list keys.";
  }
  var groups = [];
  for (var i=0, len=localStorage.length; i<len; i++) {
    var k = localStorage.key(i);
    var m = re.exec(k);
    if (m) {
      groups.push(m);
    }
  }
  return groups;
};

stSet = function(_path_keys_, _val_) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't set values.";
  }
  var args = consumePathArgs(arguments, true),
      mainKey = args.keys[0],
      subKeys = args.keys.slice(1),
      val = args.value;

  if (subKeys.length == 0) {
    localStorage[mainKey] = JSON.stringify(val);
    return;
  }

  if (localStorage[mainKey] === undefined) {
    localStorage[mainKey] = "{}";
  }

  var obj = JSON.parse(localStorage[mainKey]);
  var curr = obj;

  for (var i=0, len=subKeys.length; i<len-1; i++) {
    var k = subKeys[i];
    if (curr[k] === undefined) {
      curr = curr[k] = {};
    }
  }
  curr[subKeys[subKeys.length-1]] = val;

  localStorage.setItem(mainKey, JSON.stringify(obj));
};

stGet = function(_path_keys_) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't get values.";
  }
  var args = consumePathArgs(arguments),
      mainKey = args.keys[0],
      subKeys = args.keys.slice(1);

  var sval = localStorage.getItem(mainKey);
  if (sval == null) {
    return sval;
  }

  var obj = JSON.parse(sval);

  if (subKeys.length == 0) {
    return obj;
  }

  var curr = obj;
  for (var i=0, len=subKeys.length; i<len; i++) {
    curr = curr[subKeys[i]];
    if (curr == null) {
      return curr;
    }
  }
  return curr;
};

stRemove = function(path) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't get values.";
  }
  var args = consumePathArgs(arguments),
      mainKey = args.keys[0],
      subKeys = args.keys.slice(1);

  if (subKeys.length == 0) {
    localStorage.removeItem(mainKey);
    return;
  }

  var curr = obj;
  for (var i=0, len=subKeys.length; i<len-1; i++) {
    curr = curr[subKeys[i]];
    if (typeof curr !== "object") {
      return;
    }
  }
  curr[subKeys[subKeys.length-1]] = undefined;
};

}());
