(function($, undefined) {
"strict";

// A game screen for single-key drills. Keeps key stats and shows them when the
// game is finished.
SingleKeyGameScreen = function(parent, makeGame, gameConfig) {
  var stats = this.stats = new KeyStats();

  var config = GameScreen.mergeConfigs(gameConfig, {
    onhit: function(ch) {
      console.log('hit', ch);
      stats.addHit(ch);
    },
    onmiss: function(ch, actual) {
      console.log('miss', ch, actual);
      stats.addMiss(ch, actual);
    },
    onlapse: function(ch) {
      console.log('lapse', ch);
      stats.addLapse(ch);
    },
    onfinished: function() {
      console.log(stats);
      $('#s-done-summary')
      .append($('<div>')
              .text('hits: ' + stats.hits))
      .append($('<div>')
              .text('misses: ' + stats.misses))
      .append($('<div>')
              .text('lapses: ' + stats.lapses));

      var sample = stats.makeSampler();
      var samples = {};
      for (var i = 0; i < 20; i++) {
        var s = sample();
        samples[s] = (samples[s] || 0) + 1;
      }
      console.log('sample hist', samples);
    },
  });

  GameScreen.call(this, parent, makeGame, config);

  // Now we have divs we can manipulate. Add some sub-panels to the done div.
  var summaryDiv = this.summaryDiv = $('<div>')
  .attr('id', 's-done-summary')
  .css({
    position: 'absolute',
    fontSize: '3em',
    height: '50%',
    width: '100%',
    top: 0,
    left: 0,
  });

  var noneDiv = this.noneDiv = $('<div>')
  .attr('id', 's-done-kb-none')
  .css({
    position: 'absolute',
    height: '50%',
    width: '50%',
    bottom: 0,
    left: 0,
    boxSizing: 'border-box', // include margin/padding in width/height.
    padding: '2%',
  });

  var shiftDiv = this.shiftDiv = $('<div>')
  .attr('id', 's-done-kb-shift')
  .css({
    position: 'absolute',
    height: '50%',
    width: '50%',
    bottom: 0,
    right: 0,
    boxSizing: 'border-box', // include margin/padding in width/height.
    padding: '2%',
  });

  this._doneDiv
  .append(summaryDiv)
  .append(noneDiv)
  .append(shiftDiv);
};
SingleKeyGameScreen.prototype = Object.create(GameScreen.prototype);
SingleKeyGameScreen.prototype.constructor = SingleKeyGameScreen;

}($));
