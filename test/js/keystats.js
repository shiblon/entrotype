// Requires: jquery

function KeyStats() {
  // Keyed by the correct character.
  this._hits = {};

  // Keyed by the missed character.
  this._lapses = {};

  // This is keyed by strings with character pairs: correct, incorrect
  this._misses = {};
}

KeyStats.prototype.recordHit = function(c) {
  this._hits[c] = (this._hits[c] || 0) + 1;
};

KeyStats.prototype.recordLapse = function(c) {
  this._lapses[c] = (this._lapses[c] || 0) + 1;
};

KeyStats.prototype.recordMiss = function(c, actual) {
  var key = "" + c + actual;
  this._misses[key] = (this._misses[key] || 0) + 1;
};

KeyStats.prototype.numHits = function() {
};
