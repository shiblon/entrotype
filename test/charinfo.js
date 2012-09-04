// Keeps track of the characters in play, and accepts information about
// right and wrong answers (to allow for interesting score keeping) as well
// as providing a way to get "random" characters in a meaningful way.
CharacterInfo = function(chars) {
  this.characters = chars;
  this.num_chars = chars.length;
};

CharacterInfo.prototype.nextChar() {
  // TODO: Currently just a uniform random draw. This could be improved. Here
  // are a few ideas:
  // - weight mistaken characters more heavily
  // - remember last character and downweight it based on recentness
  // - remember last bigram and weight based on bigram accuracy
  // - allow most recent failure to be tried again.
  return this.characters[Math.floor(Math.random() * this.num_chars)];
};

CharacterInfo.prototype.reportCorrect(char) {
  // TODO: implement this
};

CharacterInfo.prototype.reportIncorrect(char) {
  // TODO: implement this
};

CharacterInfo.prototype.reportTimeout(char) {
  // TODO: implement this
};
