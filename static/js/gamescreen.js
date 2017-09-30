(function(window, $, undefined) {
"strict";

function _mergeFunctions(f1, f2) {
  if (f1 == null) {
    return f2 || function() {};
  }
  if (f2 == null) {
    return f1;
  }
  return function() {
    f1.apply(null, arguments);
    f2.apply(null, arguments);
  };
}

function _makeSubScreenDiv(parent, name) {
  return $('<div>')
  .attr('id', 's-' + name)
  .addClass('subscreen')
  .width('100%')
  .height('100%')
  .appendTo(parent);
}

// GameScreen is a self-contained div that handles countdown, game screen, and
// pause screens in the same space. It registers events in its own container,
// so they do not leak memory when the parent is cleared of children.
//
// Args:
//   parent: the container in which to put this game screen.
//   makeGame: a function(parent, config) that creates a bigbang object.
//      The config parameter will receive gameConfig with event receivers
//      needed to make the screen work merged in (not overwritten, and existing
//      receivers will all be called). The target parameter will be overwritten
//      with this object's own.
//   gameConfig: a config object passed to makeGame, will be merged with needed
//      event receivers.
GameScreen = function(parent, makeGame, gameConfig) {
  var that = this;
  gameConfig = gameConfig || {};
  parent = this.parent = $(parent);

  var mainDiv = this.mainDiv = $('<div>')
  .attr('id', 's-main')
  .attr('tabindex', 0) // allow to receive focus
  .width('100%')
  .height('100%')
  .css({
    'text-align': 'center',
    'position': 'relative',
    'display': 'inline-block',
    'margin': '0',
    'outline': 'none',
  })
  .on('keydown', function(e) {
    if (e.keyCode === 13 || e.keyCode === 32) {
      e.preventDefault();
      that.togglePaused();
    }
  })
  .on('mousedown', function(e) {
    e.preventDefault();
    that.togglePaused();
  })
  .blur(function() {
    mainDiv.focus();
  })
  .appendTo(parent);

  var pauseDiv = this._pauseDiv = _makeSubScreenDiv(mainDiv, 'pause');
  var countDiv = this._countDiv = _makeSubScreenDiv(mainDiv, 'count');
  var gameDiv = this._gameDiv = _makeSubScreenDiv(mainDiv, 'game');
  var doneDiv = this._doneDiv = _makeSubScreenDiv(mainDiv, 'done');

  var pause = this._pause = new PauseBanner(pauseDiv);

  var count = this._count = new CountdownBanner(countDiv, {
    seconds: gameConfig.countdownSeconds,
    onFinished: function() {
      game.start();
    },
  });

  var game = this._game = makeGame(
    gameDiv,
    GameScreen.mergeConfigs(gameConfig, {
      target: mainDiv,
      onpause: function() {
        that._showSub('pause');
      },
      onstart: function() {
        that._showSub('game');
      },
      onstop: function() {
        (gameConfig.onfinished || function() {})();
        that._showSub('done');
      },
    }));

  $(window).on('resize', function(e) {
    game.resize();
    pause.resize();
    count.resize();
  });

  // Hide all sub windows, and start the game.
  this._showSub('count');
  mainDiv.focus();

  this.started = false;
};

GameScreen.prototype.start = function() {
  if (!this.started) {
    this.started = true;
    this._count.start();
  }
};

GameScreen.prototype.stop = function() {
  if (this.started) {
    this.started = false;
    this._game.stop();
  }
};

GameScreen.prototype.pause = function() {
  this._game.pause();
};

GameScreen.mergeConfigs = function(mainConfig, toMerge) {
  mainConfig = mainConfig || {};
  toMerge = toMerge || {};
  var config = {};
  for (var k in mainConfig) {
    if (Object.hasOwnProperty.call(mainConfig, k)) {
      config[k] = mainConfig[k];
    }
  }

  for (var k in toMerge) {
    if (!Object.hasOwnProperty.call(toMerge, k) || toMerge[k] == null) {
      continue;
    }
    if (k.substr(0, 2) === 'on') {
      config[k] = _mergeFunctions(mainConfig[k], toMerge[k]);
    } else if (k === 'target') {
      config[k] = toMerge.target;
    } else {
      config[k] = mainConfig[k] || toMerge[k];
    }
  }
  return config;
};

GameScreen.prototype.togglePaused = function() {
  switch(this._game.state()) {
    case 'run':
      this._game.pause();
      return true;
    case 'pause':
      this._game.start();
      return false;
  }
  return null;
};

GameScreen.prototype._showSub = function(s) {
  $('.subscreen', this._mainDiv).hide();
  if (s != null) {
    $('#s-' + s, this._mainDiv).show();
  }
};

}(window, $));
