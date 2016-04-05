(function(undefined) {

function parsePath(ps) {
  if (!ps) {
    throw "invalid empty path " + JSON.stringify(ps);
  }
  if (!ps.match(/^\w+(\.\w+)*$/)) {
    throw "invalid path str " + JSON.stringify(ps);
  }
  return ps.split(/[.]/g);
}

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

  localStorage[mainKey] = JSON.stringify(obj);
};

stGet = function(path) {
  if (typeof Storage === "undefined") {
    throw "No local storage defined, can't get values.";
  }
  var keys = parsePath(path),
      mainKey = keys[0],
      subKeys = keys.slice(1);

  var sval = localStorage[mainKey];
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
  }
  return curr;
};

}());
