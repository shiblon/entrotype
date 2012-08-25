KeyboardLayout = function(simplifiedLayout) {
  // Mapping from characters to finger and distance.
  // Pair: <chars, position> where position has three elements.
  //  For example, ["fF", "HL2-!"] means
  //  "f and F are located on the Home row, Left hand, 2nd finger."
  //  "-!" means the first character is unmodified, the second needs "Shift".
  //
  //  The second part of the pair is Row, Hand, Finger, and the values are
  //  Row: N=Number, T=Top, H=Home, B=Bottom, S=Space
  //  Hand: L=Left, R=Right
  //  Finger: 0=Thumb, 1=Index Reach, 2=Index,
  //          3=Middle, 4=Ring, 5=Small, 6=Small Reach
  //          where "Reach" means the finger moves left or right of neutral.
  //  Note that there is no overlap in these values, so you can also specify
  //  alternates (e.g., the space bar can be used with either hand, so it can
  //  have a mapping of "SLR0", meaning "space row, left, right, thumb").
  //
  //  Modifiers are defined as below:
  //    -=Empty (no modifier)
  //    !=Shift
  //    @=Meta
  //    ^=Control
  //    #=Shift-Meta
  //    $=Shift-Control
  //    %=Meta-Control
  //    &=Shift-Meta-Control
  //  Modifiers must appear in order, and there must be the same number as
  //  there are characters in the first part of the pair. They can be
  //  anywhere in the string, but their relative order matters.
  //
  //  The one exception to this is when the modifiers would simple be "-!".
  //  In this case the modifier string can simply be elided, so
  //  ["fF", "HL2"] is the same as ["fF", "HL2-!"].
  //

  // These are all of our values for each class (row, hand, finger, mod).
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

  // Now define a more complete (and verbose) layout from the simplified spec.
  // This is simply a dictionary, keyed on the character, whose value is the
  // complete map spec for that character, split into classes, in order of
  // row, hand, finger, and modifier.
  //
  // e.g., "f": ["H", "L", "2", "-"]
  this._layout = {};
  for (sli in simplifiedLayout) {
    var spec = simplifiedLayout[sli];
    var chars = spec[0];
    var classes = spec[1];

    // First find the modifiers, if any.  If none are specified, we use "-"
    // or "-!", depending on how many characters there are.  It is an error
    // to not specify modifiers for 3 or more characters.
    var split_spec = this.splitSpecStr(classes);
    if (split_spec.modifiers.length == 0) {
      if (chars.length == 1) {
        split_spec.modifiers = "-";
      } else if (chars.length == 2) {
        split_spec.modifiers = "-!";
      }
    }

    if (split_spec.modifiers.length != chars.length) {
      throw ("Invalid modifiers '" + split_spec.modiiers +
             "' for char spec '" + chars + "'");
    }

    char_mod_pairs = [];
    for (var i = 0; i < chars.length; ++i) {
      // Create a string with two characters: char and modifier
      char_mod_pairs.push(chars[i] + split_spec.modifiers[i]);
    }

    for (cmi in char_mod_pairs) {
      var cm = char_mod_pairs[cmi];
      var c = cm[0];
      var m = cm[1];
      if (this._layout[c] != undefined) {
        throw "Repeated character in layout: '" + c + "'";
      }
      this._layout[c] = [split_spec.rows,
                         split_spec.hands,
                         split_spec.fingers,
                         m];
    }
  }
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
  var split_spec = this.splitSpecStr(constraintStr);

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

KeyboardLayout.prototype.Spec = function(rows, hands, fingers, modifiers) {
  this.rows = rows;
  this.hands = hands;
  this.fingers = fingers;
  this.modifiers = modifiers;
};

// This is a simplified keyboard map using the approach described in
// KeyboardLayout constructor.
KeyboardLayout.ANSI_QWERTY = [
    ["`~", "NL6"],
    ["1!", "NL5"],
    ["2@", "NL4"],
    ["3#", "NL3"],
    ["4$", "NL2"],
    ["5%", "NL1"],
    ["6^", "NR1"],
    ["7&", "NR2"],
    ["8*", "NR3"],
    ["9(", "NR4"],
    ["0)", "NR5"],
    ["-_", "NR6"],
    ["=+", "NR6"],
    ["qQ", "TL5"],
    ["wW", "TL4"],
    ["eE", "TL3"],
    ["rR", "TL2"],
    ["tT", "TL1"],
    ["yY", "TR1"],
    ["uU", "TR2"],
    ["iI", "TR3"],
    ["oO", "TR4"],
    ["pP", "TR5"],
    ["[{", "TR6"],
    ["]}", "TR6"],
    ["\\|", "TR6"],
    ["aA", "HL5"],
    ["sS", "HL4"],
    ["dD", "HL3"],
    ["fF", "HL2"],
    ["gG", "HL1"],
    ["hH", "HR1"],
    ["jJ", "HR2"],
    ["kK", "HR3"],
    ["lL", "HR4"],
    [";:", "HR5"],
    ["'\"", "HR6"],
    ["zZ", "BL5"],
    ["xX", "BL4"],
    ["cC", "BL3"],
    ["vV", "BL2"],
    ["bB", "BL1"],
    ["nN", "BR1"],
    ["mM", "BR2"],
    [",<", "BR3"],
    [".>", "BR4"],
    ["/?", "BR5"],
    [" ", "SLR0"]];

