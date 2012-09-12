KeyboardLevel = function(title, query) {
  this.title = title;
  this.query = query;
}

KeyboardLayout = function(configuration) {
  if (!configuration) {
    configuration = KeyboardLayout.LAYOUT['ansi_qwerty'];
  }
  this._configuration = configuration;

  // These are all of our query values for each class (row, hand, finger, mod).
  this.CLASS_ROW = "BHSNT";
  this.CLASS_HAND = "LR";
  this.CLASS_FINGER = "0123456";
  this.CLASS_MODIFIER = "-!@^#$%&";

  // Make them all sorted, easy to test for.
  this.CLASS_ROW = this.CLASS_ROW.split("").sort().join("");
  this.CLASS_HAND = this.CLASS_HAND.split("").sort().join("");
  this.CLASS_FINGER = this.CLASS_FINGER.split("").sort().join("");
  this.CLASS_MODIFIER = this.CLASS_MODIFIER.split("").sort().join("");

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
      ["Home Row",    ["H2-", "H3-", "H4-", "H56-", "H1-"]],
      ["Top Row",     ["T2-", "T3-", "T4-", "T5-", "T1-", "T6-"]],
      ["Bottom Row",  ["B2-", "B3-", "B4-", "B5-", "B1-", "B6-"]],
      ["Numbers Row", ["N2-", "N3-", "N4-", "N5-", "N1-", "N6-"]],
      ["Shift Key",   ["H!", "T!", "B!", "N!"]]]);
};

KeyboardLayout.prototype.name = function() {
  return this._configuration.name;
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
  var current_summary = "";
  for (var qgi = 0, qglen = levelSpec.length; qgi < qglen; ++qgi) {
    var qg = levelSpec[qgi];
    var qtitle = qg[0];
    var qgroup = qg[1];
    var summary = this.queryUnion(qgroup);

    for (var qi = 0, qlen = qgroup.length; qi < qlen; ++qi) {
      var title = qtitle + " " + (Number(qi) + 1);
      var query = qgroup[qi];
      var chars = this.query(query);
      var clen = chars.length;
      if (clen > 0) {
        if (clen < 2) {
          console.warn("Boring level, num_chars " + clen, query);
        }
        levels.push(new KeyboardLevel(title, query));
      }
    }
    // Add the review.
    levels.push(new KeyboardLevel(qtitle + " - Review", summary));

    // Add a cumulative review if necessary.
    current_summary = this.queryUnion([current_summary, summary]);
    var review_title = "";
    if (qgi > 0) {
      if (qgi < (qglen-1)) {
        review_title = "Cumulative Review " + (Number(qgi) + 1);
      } else {
        review_title = "Final Review";
      }
      levels.push(new KeyboardLevel(review_title, current_summary));
    }
  }
  return levels;
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
KeyboardLayout.prototype.query = function(constraintStr) {
  // Cache the query results so we can just rely on queries.
  if (this._query_cache == undefined) {
    this._query_cache = {};
  }
  var canonicalConstraintStr = this.queryUnion([constraintStr]);
  if (this._query_cache[canonicalConstraintStr] != undefined) {
    return this._query_cache[canonicalConstraintStr];
  }

  var split_spec = this.splitSpecStr(canonicalConstraintStr);

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
  this._query_cache[canonicalConstraintStr] = matching_chars;
  return matching_chars;
};

// Given two queries, return their union, in normal class order.
KeyboardLayout.prototype.queryUnion = function(queryList) {
  var full_query = queryList.join("").split("").sort();
  var copy = full_query.slice(0);
  full_query.length = 0;
  for (var i = 0, len = copy.length; i < len; ++i) {
    if (i == 0 || copy[i] != copy[i-1]) {
      full_query.push(copy[i]);
    }
  }
  full_query = full_query.join("");
  spec = this.splitSpecStr(full_query);
  if (spec.rows == this.CLASS_ROW) {
    spec.rows = "";
  }
  if (spec.hands == this.CLASS_HAND) {
    spec.hands = "";
  }
  if (spec.fingers == this.CLASS_FINGER) {
    spec.fingers = "";
  }
  if (spec.modifiers == this.CLASS_MODIFIER) {
    spec.modifiers = "";
  }
  return spec.rows + spec.hands + spec.fingers + spec.modifiers;
};

KeyboardLayout.prototype.getRandomChar = function(query) {
  var chars = this.query(query);
  return chars[Math.floor(Math.random() * chars.length)];
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

  var modifier_symbols = {
    none: "-",
    shift: "!",
    meta: "@",
    ctrl: "^",
    "meta-shift": "#",
    "ctrl-shift": "$",
    "ctrl-meta": "%",
    "ctrl-meta-shift": "&"
  };

  var row_symbols = "NTHBS";

  var all_characters = {};

  // Now we compute a long queryable set of characters.
  for (var mkey in configuration) {
    if (mkey == "hardware" || mkey == "name") continue;
    if (mkey.indexOf("-") != -1) {
      // Canonicalize the meta key spec.
      mkey = mkey.toLowerCase().split("-").sort().join("-");
    }
    var mod_sym = modifier_symbols[mkey];
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
  ansi: [
    "LLLLLLRRRRRRRb",
    "tLLLLLRRRRRRRR",
    "cLLLLLRRRRRRee",
    "sLLLLLRRRRRsss",
  ],
  iso: [
    "LLLLLLRRRRRRRb",
    "tLLLLLRRRRRRRe",
    "cLLLLLRRRRRRRe",
    "LLLLLLRRRRRsss", // shift also on the left
  ],
  jis: [
    "LLLLLLRRRRRRRb",
    "tLLLLLRRRRRRRe",
    "cLLLLLRRRRRRRe",
    "sLLLLLRRRRRRss",
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
      " zxcvbnm,./   ",
    ],
    shift: [
      "~!@#$%^&*()_+ ",
      " QWERTYUIOP{}|",
      " ASDFGHJKL:\"  ",
      " ZXCVBNM<>?   ",
    ],
  },
  ansi_dvorak: {
    name: "ANSI DVORAK",
    hardware: KeyboardLayout.HARDWARE['ansi'],
    none: [
      "`1234567890[] ",
      " ',.pyfgcrl/=\\",
      " aoeuidhtns-  ",
      " ;qjkxbmwvz   ",
    ],
    shift: [
      "~!@#$%^&*(){} ",
      " \"<>PYFGCRL?+|",
      " AOEUIDHTNS_  ",
      " :QJKXBMWVZ   ",
    ],
  },
};
