KeyboardLevel = function(query, config) {
  this.title = config.title || query;
  this.query = query;

  var config = config || {};
  this.isReview = config.isReview || config.isCumulative || false;
  this.isCumulative = config.isCumulative || false;
}

function KeyPos(row, col) {
  this.r = row;
  this.c = col;
}
KeyPos.prototype.toString = function() {
  return "(" + this.r + "," + this.c + ")";
};
KeyPos.prototype.eq = function(other) {
  return this.r == other.r && this.c == other.c;
};

function KeyRect(x1, y1, x2, y2) {
  this.x1 = Math.min(x1, x2);
  this.y1 = Math.min(y1, y2);
  this.x2 = Math.max(x1, x2);
  this.y2 = Math.max(y1, y2);
}
KeyRect.prototype.toString = function() {
  return "(" + this.x1 + "," + this.y1 + "; " + this.x2 + "," + this.y2 + ")";
};

KeyboardLayout = function(configuration) {
  if (!configuration) {
    configuration = KeyboardLayout.LAYOUT['ansi_qwerty'];
  }
  this._configuration = configuration;

  this.KEY_MARGIN = 0.1;
  this.KEY_RECT_WIDTH = 1.0;
  this.KEY_OFFSETS = [1.0, 1.5, 1.8, 1.3];

  // These are all of our query values for each class (row, hand, finger, mod).
  this.CLASS_ROW = "BHNT";
  this.CLASS_HAND = "LR";
  this.CLASS_FINGER = "123456";
  this.CLASS_MODIFIER = "-!@^#$%&";

  // Make them all sorted, easy to test for.
  this.CLASS_ROW = this.CLASS_ROW.split("").sort().join("");
  this.CLASS_HAND = this.CLASS_HAND.split("").sort().join("");
  this.CLASS_FINGER = this.CLASS_FINGER.split("").sort().join("");
  this.CLASS_MODIFIER = this.CLASS_MODIFIER.split("").sort().join("");

  this.MODIFIER_SYMBOLS = {
    none: "-",
    shift: "!",
    meta: "@",
    ctrl: "^",
    "meta-shift": "#",
    "ctrl-shift": "$",
    "ctrl-meta": "%",
    "ctrl-meta-shift": "&"
  };

  this.SYM_TO_MOD = {
    '-': 'none',
    '!': 'shift',
    '@': 'meta',
    '^': 'ctrl',
  };

  this.NON_CHARS = {
    'b': 'backspace',
    'e': 'enter',
    't': 'tab',
    'c': 'capslock',
    '_': 'space',
    '!': 'shift',
    '^': 'ctrl',
    '@': 'meta',
  }



  var strToSet = function(s) {
    var d = {};
    for (var i = 0; i < s.length; ++i) {
      d[s[i]] = true;
    }
    return d;
  }

  this._row_dict = strToSet(this.CLASS_ROW);
  this._hand_dict = strToSet(this.CLASS_HAND);
  this._finger_dict = strToSet(this.CLASS_FINGER);
  this._modifier_dict = strToSet(this.CLASS_MODIFIER);

  this._layout = this.parseConfiguration(this._configuration);

  // Note that <space> is a query that has to be used implicitly, pretty much all
  // the time.  It is treated specially.
  this.levels = this.defineLevels([
      ["Home Row",            ["H2-", "H3-", "H4-", "H5-", "H16-", "H!"]],
      ["Top Row",             ["T2-", "T3-", "T4-", "T5-", "T16-", "T!"]],
      ["Bottom Row",          ["B2-", "B3-", "B4-", "B5-", "B16-", "B!"]],
      ["Numbers Row",         ["N2-", "N3-", "N4-", "N5-", "N16-"]],
      ["Numbers Row Shifted", ["N2!", "N3!", "N4!", "N5!", "N16!"]]]);
};

KeyboardLayout.prototype.name = function() {
  return this._configuration.name;
};

KeyboardLayout.prototype.hardware = function() {
  return this._configuration.hardware;
};

KeyboardLayout.prototype.defineLevels = function(levelSpec) {
  // levelSpec is a list of pairs, each of which is
  //  <title, [list of queries]>.
  // The queries, therefore, are grouped logically.  At the end of each
  // grouping, we insert a summary for that group, and after that a cumulative
  // review as needed.
  //
  // Returns a list of [<title, query> ...] pairs, one for each level,
  // including summaries, etc.
  var levels = [];
  var current_summary = null;
  for (var qgi = 0, qglen = levelSpec.length; qgi < qglen; ++qgi) {
    var qg = levelSpec[qgi];
    var qtitle = qg[0];
    var qgroup = qg[1];

    for (var qi = 0, qlen = qgroup.length; qi < qlen; ++qi) {
      var title = qtitle + " " + (Number(qi) + 1);
      var query = qgroup[qi];
      var chars = this.query(query);
      var clen = chars.length;
      if (clen > 0) {
        if (clen < 2) {
          console.warn("Boring level, num_chars " + clen, query);
        }
        levels.push(new KeyboardLevel(query, {
          title: title,
        }));
      }
    }
    // Add the review.
    if (qgroup.length > 1) {
      levels.push(new KeyboardLevel(this.simplifyQuery(qgroup), {
        title: qtitle + " - Review",
        isReview: true,
      }));
    }

    // Add a cumulative review if necessary.
    current_summary = (current_summary) ? current_summary.concat(qgroup) : qgroup;
    var review_title = "";
    if (qgi > 0) {
      if (qgi < (qglen-1)) {
        review_title = "Cumulative Review " + (Number(qgi) + 1);
      } else {
        review_title = "Final Review";
      }
      levels.push(new KeyboardLevel(this.simplifyQuery(current_summary), {
        title: review_title,
        isCumulative: true,
      }));
    }
  }
  return levels;
};

// Takes a list of queries (or a string), and produces a list of queries
// without any comma-delimited strings among them.
KeyboardLayout.prototype.flattenQuery = function(qlist) {
  if (typeof qlist == 'string' || qlist instanceof String) {
    qlist = qlist.split(/\s*,\s*/);
    if (qlist.length == 1) {
      return qlist[0];
    }
    return this.flattenQuery(qlist);
  }

  var flattened = [];
  for (var i = 0; i < qlist.length; i++) {
    flattened = flattened.concat(this.flattenQuery(qlist[i]));
  }
  return flattened;
};

// Given a list of queries, return a more minimal list if possible.
// It will favor readability over minimalism, grouping things by modifier, row,
// hand, and finger.
KeyboardLayout.prototype.simplifyQuery = function(qlist) {
  qlist = this.flattenQuery(qlist);
  var canonical = this.canonicalizedQuery(qlist);
  var specs = [];
  if (qlist.length == 1) {
    specs.push(this.splitSpecStr(canonical));
  } else {
    for (var qi in canonical) {
      specs.push(this.splitSpecStr(canonical[qi]));
    }
  }

  var that = this;

  // Takes out only the non-null specs, and canonicalizes their internals so
  // they are minimally represented.
  function filterAndCanonicalize(specs) {
    var good = [];
    for (var i = 0; i < specs.length; i++) {
      var s = specs[i];
      if (!s) {
        continue;
      }
      good.push(that.canonicalizedSpec(s));
    }
    return good;
  }

  // Looks for pairs of mergeable items, meaning that you can specify a single
  // field that can differ, and it will find all of the items that have all
  // other fields in common and produce a merged item from all of them.
  // For example, given "H3" and "H4" with "fingers" specified as the property
  // to merge, it will product "H34". The "fingers" property differs, but the
  // rest are the same.
  function mergeCommon(specs, propToMerge) {
    specs = specs.slice(0);
    for (var i = 0; i < specs.length; i++) {
      var a = specs[i];
      if (!a) continue;
      for (var j = i+1; j < specs.length; j++) {
        var b = specs[j];
        if (!b) continue;
        // Now check that all of the non-merging properties are the same.
        merge = true;
        for (var k in a) {
          if (k == propToMerge) continue;
          if (a[k] != b[k]) {
            merge = false;
            break;
          }
        }
        if (merge) {
          a[propToMerge] += b[propToMerge];
          specs[j] = null;
        }
      }
    }
    return filterAndCanonicalize(specs);
  }

  // Merge hierarchically. This won't necessarily produce a minimal
  // representation, but the representation it does produce will be easily
  // understood by a human.
  specs = mergeCommon(specs, 'fingers');
  specs = mergeCommon(specs, 'hands');
  specs = mergeCommon(specs, 'rows');
  specs = mergeCommon(specs, 'modifiers');

  // The queries we now have as specs are all as simple as they can get. Pass
  // out a list of appropriate strings.
  var queries = [];
  for (var i in specs) {
    queries.push(this.joinSpec(specs[i]));
  }
  return queries;
};

KeyboardLayout.prototype.uniquifiedArray = function(arr) {
  arr = arr.slice(0).sort();
  var unique = [];
  var last = null;
  for (var i in arr) {
    if (last != arr[i]) {
      last = arr[i];
      unique.push(last);
    }
  }
  return unique;
};

KeyboardLayout.prototype.uniquifiedString = function(s) {
  return this.uniquifiedArray(s.split('')).join('');
};

KeyboardLayout.prototype.joinSpec = function(spec) {
  return spec.rows + spec.hands + spec.fingers + spec.modifiers;
};

KeyboardLayout.prototype.canonicalizedSpec = function(spec) {
  // If all members of a class are represented, we omit that class.
  var s = {};
  s.rows = this.uniquifiedString(spec.rows);
  s.hands = this.uniquifiedString(spec.hands);
  s.fingers = this.uniquifiedString(spec.fingers);
  s.modifiers = this.uniquifiedString(spec.modifiers);

  if (s.rows == this.CLASS_ROW) {
    s.rows = "";
  }
  if (s.hands == this.CLASS_HAND) {
    s.hands = "";
  }
  if (s.fingers == this.CLASS_FINGER) {
    s.fingers = "";
  }
  if (s.modifiers == this.CLASS_MODIFIER) {
    s.modifiers = "";
  }

  return s;
};

KeyboardLayout.prototype.splitSpecStr = function(specStr) {
  var spec = {rows: "", hands: "", fingers: "", modifiers: ""};
  for (var i = 0, len = specStr.length; i < len; ++i) {
    var c = specStr[i];
    if (this._row_dict[c]) {
      spec.rows += c;
    } else if (this._hand_dict[c]) {
      spec.hands += c;
    } else if (this._finger_dict[c]) {
      spec.fingers += c;
    } else if (this._modifier_dict[c]) {
      spec.modifiers += c;
    } else {
      console.error("Unknown mapping spec: " + c);
      return null;
    }
  }
  spec.rows = this.uniquifiedString(spec.rows);
  spec.hands = this.uniquifiedString(spec.hands);
  spec.fingers = this.uniquifiedString(spec.fingers);
  spec.modifiers = this.uniquifiedString(spec.modifiers);
  return spec;
};

KeyboardLayout.prototype.nonEmptyIntersection = function(arr1, arr2) {
  for (a1 in arr1) {
    for (a2 in arr2) {
      if (arr1[a1] == arr2[a2]) {
        return true;
      }
    }
  }
};

// Query the keyboard layout for all keys that fit a set of specified
// constraints. Different constraint classes are ANDed, and within a class
// values are ORed. For example, to specify all characters on the home,
// bottom, or top rows, you could say "HBT".  To specify only those
// on the home row that are in easy reach, you would specify
// "H2345". To specify only the left hand in that case, add "L": "HL2345".
// Any constraint class that is not mentioned is assumed to be "don't care".
//
// Modifiers are handled differently (since they aren't specified in the
// mapping explicitly).  They are assigned the following values:
// C=Ctrl
// M=Meta
// U=shift (Upper)
//
// NOTE: there is currently no way to specify that you *must* combine
// two meta keys (e.g., for Ctrl-Shift combinations).
KeyboardLayout.prototype.query = function() {
  if (arguments.length == 0) {
    throw "No query specified";
  }

  // Get valid arguments into a list, then flatten it.
  var query = [];
  for (var ai in arguments) {
    query.push(arguments[ai]);
  }
  query = this.flattenQuery(query);

  // If we have a list, process each value in it.
  if (query.length > 1) {
    var keys = [];
    for (var qi in query) {
      Array.prototype.push.apply(keys, this.query(query[qi]));
    }
    return this.uniquifiedArray(keys);
  }

  var queryStr = query[0];

  // Finally handle single constraint string queries.

  // Cache the query results so we can just rely on queries.
  if (this._query_cache == undefined) {
    this._query_cache = {};
  }
  var canonicalQueryStr = this.canonicalizedQuery(queryStr);
  if (this._query_cache[canonicalQueryStr] != undefined) {
    return this._query_cache[canonicalQueryStr];
  }

  var split_spec = this.splitSpecStr(canonicalQueryStr);

  // Search for all keys that satisfy these constraints.  That means that
  // all specified query classes have a matching element in each key.
  var matching_chars = [];

  for (c in this._layout) {
    var spec = this._layout[c];
    var rows = spec[0];
    var hands = spec[1];
    var fingers = spec[2];
    var modifiers = spec[3];

    if ((split_spec.rows.length == 0 ||
         this.nonEmptyIntersection(split_spec.rows, rows)) &&
        (split_spec.hands.length == 0 ||
         this.nonEmptyIntersection(split_spec.hands, hands)) &&
        (split_spec.fingers.length == 0 ||
         this.nonEmptyIntersection(split_spec.fingers, fingers)) &&
        (split_spec.modifiers.length == 0 ||
         this.nonEmptyIntersection(split_spec.modifiers, modifiers))) {
      matching_chars.push(c);
    }
  }
  this._query_cache[canonicalQueryStr] = matching_chars;
  return matching_chars;
};

// Simplify the query as much as possible.
KeyboardLayout.prototype.canonicalizedQuery = function(query) {
  if (query instanceof Array) {
    var canonicalized = [];
    for (var i in query) {
      canonicalized.push(this.canonicalizedQuery(query[i]));
    }
    return canonicalized;
  }

  var arrSplit = query.split(/\s*,\s*/);
  if (arrSplit.length > 1) {
    return this.canonicalizedQuery(arrSplit);
  }

  var spec = this.canonicalizedSpec(this.splitSpecStr(query));
  return this.joinSpec(spec);
};

KeyboardLayout.prototype.getRandomChar = function(query) {
  var chars = this.query(query);
  return chars[Math.floor(Math.random() * chars.length)];
};

// Returns a mapping from key type to position(s) on the keyboard.
// All key types are three-character strings: "<type>-<side>", e.g.,
// "cl": [(2,0)] is "left caps lock at position 2, 0".
// Similarly, "sl": [(3,0), (3,1)] is the left shift key, which occupies two
// positions in an ANSI layout (but only one in an ISO layout).
KeyboardLayout.prototype.specialKeyPositions = function() {
  var hw = this.hardware();
  var group_keys = {}; // key-type: [coord, coord, ...]
  for (var r=0, rlen=hw.length; r<rlen; ++r) {
    var row = hw[r];
    for (var c=0, clen=row.length; c<clen; ++c) {
      var k = row[c];
      if (k != "L" && k != "R") {
        if (!group_keys[k]) group_keys[k] = [];
        group_keys[k].push(new KeyPos(r, c));
      }
    }
  }

  // Split groups into two if they contain non-adjacent items.
  // After this, all groups will get a new determiner in their name, indicating
  // right or left hand, e.g., {'sl': ..., 'sr': ..., 'er': ...}
  // Note that we don't apply a fully general adjacency algorithm here, as that
  // is overkill. We can just test for left or right sides.
  for (var k in group_keys) {
    var positions = group_keys[k];
    for (var pi in positions) {
      var pos = positions[pi];
      var rowLen = hw[pos.r].length;

      var fullKey = k + '-' + ((pos.c < rowLen / 2) ? 'l' : 'r');
      if (!group_keys[fullKey]) group_keys[fullKey] = [];
      group_keys[fullKey].push(pos);
    }
    // Remove this one-character key. We're done with it.
    delete group_keys[k];
  }

  return group_keys;
};

KeyboardLayout.prototype.rectangles = function() {
  var hw = this.hardware();

  // Find the largest number of keys per row.
  var max_keys = 0;
  for (var r=0; r<hw.length; ++r) {
    if (hw[r].length > max_keys) {
      max_keys = hw[r].length;
    }
  }

  // Determine actual rectangle coordinates. Keyboards have things shifted
  // around, so we have to create odd-sized rectangles at the boundaries.
  // The coordinate system dictates that basic square keys are 1x1 in size,
  // making the computation pretty trivial in most places.
  var rectangles = [];
  var topEdge = 0.0;
  for (var r = 0; r < hw.length; r++) {
    var bottomEdge = topEdge + this.KEY_RECT_WIDTH;
    var row = hw[r];
    rectangles[r] = [];
    var off = this.KEY_OFFSETS[r];
    rectangles[r][0] = new KeyRect(0, topEdge, this.KEY_OFFSETS[r], bottomEdge);
    var prevEdge = this.KEY_OFFSETS[r];
    for (var c = 1; c < max_keys - 1; c++) {
      var nextEdge = prevEdge + this.KEY_RECT_WIDTH;
      rectangles[r][c] = new KeyRect(prevEdge, topEdge, nextEdge, bottomEdge);
      prevEdge = nextEdge;
    }
    rectangles[r][max_keys-1] = new KeyRect(
      prevEdge, topEdge,
      (max_keys + 0.5) * this.KEY_RECT_WIDTH, bottomEdge);
    topEdge = bottomEdge;
  }
  return rectangles;
};

KeyboardLayout.prototype.mergeRectangles = function(rects) {
  // This algorithm is due to O'Rourke, and the implementation is taken from here:
  // http://stackoverflow.com/questions/13746284/merging-multiple-adjacent-rectangles-into-one-polygon
  var points = {};
  for (var ri in rects) {
    var rect = rects[ri];
    var verts = [
        [rect.x1, rect.y1],
        [rect.x2, rect.y1],
        [rect.x2, rect.y2],
        [rect.x1, rect.y2],
    ];
    for (var vi in verts) {
      var vt = verts[vi];
      // Remove *paired* shared vertices.
      if (points.hasOwnProperty(vt)) {
        delete points[vt];
      } else {
        points[vt] = vt;
      }
    }
  }

  // Now sort points by x and y.
  var x_sort_points = [];
  var y_sort_points = [];
  for (var pk in points) {
    var pt = points[pk];
    x_sort_points.push(pt);
    y_sort_points.push(pt);
  }
  x_sort_points.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1] });
  y_sort_points.sort(function(a, b) { return a[1] - b[1] || a[0] - b[0] });

  // Given a sorted array of points and a function that extracts the right
  // dimension given an vertex, returns edges map, "vertex-str": [vert,
  // next-vert-str].
  // We store the next vertex *string* instead of the next vertex because
  // this allows us to have stable identifiers if we decide to jiggle the
  // actual points around (e.g., to shrink the boundaries).
  function makeEdges(sortedPoints, extractFn) {
    var edges = {};
    for (var i = 0, j = 1; i < sortedPoints.length; i += 2, j += 2) {
      // An edge is a pair of vertices. We map each vertex of that pair to the
      // pair itself.
      var vi = sortedPoints[i];
      var vj = sortedPoints[j];
      if (extractFn(vi) != extractFn(vj)) {
        console.error(vi, vj);
        throw "Points should be paired: " + vi + ", " + vj;
      }
      // See above: store the actual vertex, and the next *key*.
      edges[vi] = [vi, "" + vj];
      edges[vj] = [vj, "" + vi];
    }
    return edges;
  }

  edges_h = makeEdges(y_sort_points, function(pt) { return pt[1] });
  edges_v = makeEdges(x_sort_points, function(pt) { return pt[0] });

  function getPointAndNeighbors(pk) {
    return {
      p: points[pk],
      h: edges_h[edges_h[pk][1]][0],
      v: edges_v[edges_v[pk][1]][0],
    }
  }

  // Shorten the edges by moving all of the points toward their neighbors.
  for (var pk in points) {
    var pts = getPointAndNeighbors(pk);

    if (pts.p[0] < pts.h[0]) {
      pts.p[0] += 0.1;
    } else {
      pts.p[0] -= 0.1;
    }
    if (pts.p[1] < pts.v[1]) {
      pts.p[1] += 0.1;
    } else {
      pts.p[1] -= 0.1;
    }
  }

  // Now go through and find the inner corners, since those need special
  // treatment. If we find that any point has moved so that it shares neither
  // an x coordinate with its vertical neighbor nor a y coordinate with its
  // horizontal neighbor, we change it to share appropriately.
  for (var pk in points) {
    var pts = getPointAndNeighbors(pk);
    if (pts.p[1] != pts.h[1] && pts.p[0] != pts.v[0]) {
      // inner corner - it got munged. Fix it.
      pts.p[0] = pts.v[0];
      pts.p[1] = pts.h[1];
    }
  }

  // Pick a random point from horizontal edges.
  var first_k;
  for (first_k in edges_h) {
    break;
  }
  var first_pt = edges_h[first_k][0];


  // Take a point from h, then the next from v, then repeat until we hit first.
  var cur_k = null;
  var cur_pt = null;
  var finalVertices = [];
  while (cur_k != first_k) {
    if (cur_k == null) {
      cur_k = first_k;
      cur_pt = first_pt;
    }

    var hcur = edges_h[cur_k];
    finalVertices.push(hcur[0]);
    cur_k = "" + hcur[1];

    var vcur = edges_v[cur_k];
    finalVertices.push(vcur[0]);
    cur_k = "" + vcur[1];
  }
  return finalVertices;
};

// Produces a list of polygons, associated with their (modified) keys.
//
// Returns:
//   List of {
//     'vertices': [vertex, vertex, ...],
//     'none': key,
//     'shift': key,
//     ...
//   }
KeyboardLayout.prototype.polygons = function() {
  var that = this;
  // The special keys often take up more than one rectangle.
  // The positions in the values of this structure are row, col, and directly
  // correspond to the rows and columns in the rectangles array.
  var specials = this.specialKeyPositions();
  var hw = this.hardware();

  // Generate a mapping from positions to special keys so we can create special
  // polygons for the grouped keys (and avoid doing so for non-grouped keys).
  var posToSpecial = {};
  for (var kt in specials) {
    var positions = specials[kt];
    for (var pi in positions) {
      var p = positions[pi];
      posToSpecial[p] = kt;
    }
  }

  var polygons = [];

  var rectangleRows = this.rectangles();

  // Make shrunken rectangles.
  var rectVertices = function(rect) {
    var x1 = rect.x1 + that.KEY_MARGIN, y1 = rect.y1 + that.KEY_MARGIN,
        x2 = rect.x2 - that.KEY_MARGIN, y2 = rect.y2 - that.KEY_MARGIN;
    return [
        [x1, y1], [x2, y1],
        [x2, y2], [x1, y2],
    ];
  }

  function makePolygon(r, c, verts, nonCharName) {
    var poly = {
      vertices: verts,
    };
    if (nonCharName) {
      var mod = that.SYM_TO_MOD[nonCharName];
      if (mod) {
        poly.mod = mod;
      }
      poly.nonchar = that.NON_CHARS[nonCharName];
      return poly;
    }
    var isAChar = false;
    for (var mod in that.MODIFIER_SYMBOLS) {
      if (that._configuration[mod]) {
        var key = that._configuration[mod][r][c];
        if (key != ' ') {
          isAChar = true;
          poly[mod] = key;
        }
      }
    }
    return poly;
  }

  // Plain old non-specials first. They're all just rectangles.
  for (var ri in rectangleRows) {
    var row = rectangleRows[ri];
    for (var ci in row) {
      var rect = row[ci];
      var pos = new KeyPos(ri, ci);
      if (posToSpecial.hasOwnProperty(pos)) {
        continue;
      }
      var verts = rectVertices(rect);
      polygons.push(makePolygon(ri, ci, verts));
    }
  }

  // Now do the specials.
  for (var k in specials) {
    var positions = specials[k];
    var rects = [];
    for (pi in positions) {
      var pos = positions[pi];
      rects.push(rectangleRows[pos.r][pos.c]);
    }
    var verts;
    if (rects.length == 1) {
      verts = rectVertices(rects[0]);
    } else {
      verts = this.mergeRectangles(rects);
    }
    var pos = positions[0];
    polygons.push(makePolygon(pos.r, pos.c, verts, k[0]));
  }

  return polygons;
};

KeyboardLayout.prototype.parseConfiguration = function(configuration) {
  // A configuration is a dictionary that specified how the keys are
  // configured on the hardware. There is a key labeled "hardware" that points
  // to a hard layout.
  //
  // Each row of the layout is a list of either . or L or R (for left and right
  // hands).  It is assumed that the innermost L and R are "1", with numbers
  // incrementing going outward as described below.
  //
  // Numbers represent fingers:
  // 0   = thumb (currently not used)
  // 1-2 = index finger (1 is a longer reach)
  // 3   = middle finger
  // 4   = ring finger
  // 5-? = small finger (larger numbers are further away from resting position)
  // Currently we only go to 6 - reach is reach is reach.
  //
  // The numbers always start with the left hand, going down, and progress
  // to the right hand, going up.
  //
  // There are always 5 rows:
  // - Numbers
  // - Top
  // - Home
  // - Bottom
  //
  // The row with the space bar is omitted.
  //
  // The rest of the keys in the configuration are named after modifier keys:
  // none: no modifiers
  // shift: shift key pressed
  // meta: meta key pressed
  // ctrl: control key pressed
  // Also ctrl-meta, ctrl-shift, meta-shift, ctrl-meta-shift.
  // Only "none" and "shift" are required.

  var min = function(a, b) {return (a>b) ? b : a;};
  var max_finger = 6;

  var hardware = configuration["hardware"];
  var fingers = [];
  for (var r=0, rlen=hardware.length; r<rlen; ++r) {
    var hand_row = hardware[r];
    var ri = hand_row.indexOf("R");
    if (ri < 0) {
      throw "Missing R in hardware layout spec: " + hand_row;
    }
    var finger_row = [];
    finger_row.length = hand_row.length;
    for (var c=0, clen=hand_row.length; c<clen; ++c) {
      if (hand_row[c].toUpperCase() == "L") {
        finger_row[c] = min(max_finger, ri - c);
      } else if (hand_row[c].toUpperCase() == "R") {
        finger_row[c] = min(max_finger, c - ri + 1);
      } else {
        finger_row[c] = null;
      }
    }
    fingers[r] = finger_row;
  }

  var row_symbols = "NTHB";

  var all_characters = {};

  // Now we compute a long queryable set of characters.
  for (var mkey in configuration) {
    if (mkey == "hardware" || mkey == "name") continue;
    if (mkey.indexOf("-") != -1) {
      // Canonicalize the meta key spec.
      mkey = mkey.toLowerCase().split("-").sort().join("-");
    }
    var mod_sym = this.MODIFIER_SYMBOLS[mkey];
    if (mod_sym == undefined) {
      throw "Bad modifier key specified: " + mkey;
    }
    var config = configuration[mkey];
    // Go over every character, assigning a row, hand, finger, and meta.
    for (var ri=0, rlen=config.length; ri<rlen; ++ri) {
      var row_sym = row_symbols[ri];
      var hand_row = hardware[ri];
      var finger_row = fingers[ri];
      var char_row = config[ri];
      for (var ci=0, clen=char_row.length; ci<clen; ++ci) {
        var c = char_row[ci];
        if (finger_row[ci] == undefined || finger_row[ci] == null) {
          if (c != " ") {
            throw "Character '" + c + "' would be ignore by hardware";
          }
          continue;
        }
        if (all_characters[c] != undefined) {
          throw "Repeated character '" + c + "' in configuration.";
        }
        all_characters[c] = row_sym + hand_row[ci] + finger_row[ci] + mod_sym;
      }
    }
  }
  return all_characters;
};

KeyboardLayout.HARDWARE = {
  // Not that all layouts have the bottom row shifted right by one space. This
  // allows for the common (e.g., not Kinesis) layouts to have their typical
  // shifting in place and still have room for modifier keys.
  // If you are specifying a keyboard whose keys are not shifted, that is also
  // fine. The important thing is that the hardware match with the soft layout.
  ansi: [
    "LLLLLLRRRRRRRb",
    "tLLLLLRRRRRRRR",
    "cLLLLLRRRRRRee",
    "!!LLLLLRRRRR!!",
  ],
  iso: [
    "LLLLLLRRRRRRRb",
    "tLLLLLRRRRRRRe",
    "cLLLLLRRRRRRRe",
    "!LLLLLLRRRRR!!",
  ],
  jis: [
    "LLLLLLRRRRRRRb",
    "tLLLLLRRRRRRRe",
    "cLLLLLRRRRRRRe",
    "!!LLLLLRRRRRR!",
  ],
};

KeyboardLayout.LAYOUT = {
  ansi_qwerty: {
    name: "ANSI QWERTY",
    hardware: KeyboardLayout.HARDWARE['ansi'],
    none: [
      "`1234567890-= ",
      " qwertyuiop[]\\",
      " asdfghjkl;'  ",
      "  zxcvbnm,./  ",
    ],
    shift: [
      "~!@#$%^&*()_+ ",
      " QWERTYUIOP{}|",
      " ASDFGHJKL:\"  ",
      "  ZXCVBNM<>?  ",
    ],
  },
  iso_qwerty: {
    name: "ISO QWERTY",
    hardware: KeyboardLayout.HARDWARE['iso'],
    none: [
      "`1234567890-= ",
      " qwertyuiop[] ",
      " asdfghjkl;'# ",
      " \\zxcvbnm,./  ",
    ],
    shift: [
      "\xac!\"\xa3$%^&*()_+ ",
      " QWERTYUIOP{} ",
      " ASDFGHJKL:@~ ",
      " |ZXCVBNM<>?  ",
    ],
  },
  ansi_dvorak: {
    name: "ANSI DVORAK",
    hardware: KeyboardLayout.HARDWARE['ansi'],
    none: [
      "`1234567890[] ",
      " ',.pyfgcrl/=\\",
      " aoeuidhtns-  ",
      "  ;qjkxbmwvz  ",
    ],
    shift: [
      "~!@#$%^&*(){} ",
      " \"<>PYFGCRL?+|",
      " AOEUIDHTNS_  ",
      "  :QJKXBMWVZ  ",
    ],
  },
  iso_dvorak: {
    name: "ISO DVORAK",
    hardware: KeyboardLayout.HARDWARE['iso'],
    none: [
      "`1234567890[] ",
      " ',.pyfgcrl/= ",
      " aoeuidhtns-# ",
      " \\;qjkxbmwvz  ",
    ],
    shift: [
      "\xac!\"\xa3$%^&*(){} ",
      " @<>PYFGCRL?+ ",
      " AOEUIDHTNS_~ ",
      " |:QJKXBMWVZ  ",
    ],
  },
};
