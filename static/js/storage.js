(function(undefined) {

function parsePath(ps) {
  if (!ps) {
    throw "invalid empty path " + JSON.stringify(ps);
  }
  if (!ps.match(/^[\w=_-]+(\.[\w=_-]+)*$/)) {
    throw "invalid path str " + JSON.stringify(ps);
  }
  return ps.split(/[.]/g);
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

stSet = function(path, val) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't set values.";
  }
  var keys = parsePath(path),
      mainKey = keys[0],
      subKeys = keys.slice(1);

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

stGet = function(path) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't get values.";
  }
  var keys = parsePath(path),
      mainKey = keys[0],
      subKeys = keys.slice(1);

  console.log('stget keys', keys, mainKey, subKeys);

  var sval = localStorage.getItem(mainKey);
  if (sval == null) {
    return sval;
  }

  var obj = JSON.parse(sval);
  console.log('stget obj', obj);

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
  var keys = parsePath(path),
      mainKey = keys[0],
      subKeys = keys.slice(1);

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
