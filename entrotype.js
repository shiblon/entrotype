BasicGame = function(keyboardLayout) {
  // Difficulty, easy to hard.
  // The contents of this array are, for each difficulty level, a Keyboard
  // layout query that corresponds to it.
  //
  // Each level can be summarized by taking the union of the elements.
  // Each group can be summarized, then at each level, summarize all the
  // previous levels.
  //
  // At the end, we should have them all in the summary.
  this.keyboardLayout = keyboardLayout;
  // Note that "S0" is a query that has to be used implicitly, pretty much all
  // the time.  It is treated specially.
  this._level_queries = [
      ["Home Row",    ["H2-", "H3-", "H4-", "H56-", "H1-"]],
      ["Top Row",     ["T2-", "T3-", "T4-", "T5-", "T1-", "T6-"]],
      ["Bottom Row",  ["B2-", "B3-", "B4-", "B5-", "B1-", "B6-"]],
      ["Numbers Row", ["N2-", "N3-", "N4-", "N5-", "N1-", "N6-"]],
      ["Shift Key",   ["H123456!", "T123456!", "B123456!", "N123456!"]],
  ];

  // Levels: For each title and group:
  //  - Title is "Level " + (query_index + 1)
  //  - Then there's a level summary that is the union of the group.
  //  - Then there's a level that's the summary of the previous summaries.
  //  - TODO: We need to treat S0 specially, adding it in for particular
  //          kinds of play. It is not always appropriate to use it, so
  //          it is not included in the level definitions directly.
  this._levels = [];
  var current_summary = "";
  for (var qgi = 0, len = this._level_queries.length; qgi < len; ++qgi) {
    var qg = this._level_queries[qgi];
    var qtitle = qg[0];
    var qgroup = qg[1];
    var summary = this.keyboardLayout.queryUnion(qgroup);

    for (qi in qgroup) {
      var title = qtitle + " " + (Number(qi) + 1);
      this._levels.push({title: title, query: qgroup[qi]});
    }
    this._levels.push({title: qtitle + " - Review", query: summary});
    current_summary = this.keyboardLayout.queryUnion(
        [current_summary, summary]);
    var review_title = "";
    if (qgi > 0) {
      if (qgi < (len-1)) {
        review_title = "Cumulative Review " + (Number(qgi) + 1);
      } else {
        review_title = "Final Review";
      }
    this._levels.push({title: review_title, query: current_summary});
    }
  }

  this.curChar = null;
};

BasicGame.prototype.showRandomChar = function(level) {
  var possible_chars = this.keyboardLayout.query(level.query);
  var c = possible_chars[Math.floor(Math.random() * possible_chars.length)];
  console.log(c);
};
