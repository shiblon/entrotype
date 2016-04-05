angular.module('entrotypeControllers', [])
.controller('ParentCtrl', ['$scope', '$location', function($scope, $location) {
  var query = null;

  $scope.levels = KB_LEVELS;
  $scope.layout = new KeyboardLayout('ansi-qwerty');
  $scope.go = function(path, search) {
    search = search || {};
    $location.path(path).search({}); // clear search terms, then add the new ones
    $.each(search, function(k, v) {
      $location.search(k, v);
    });
  };

  // TODO: Make this real.
  $scope.user = new User("Test User", $scope.levels);
  $scope.user.unlock("/home/basic");

  $scope.isBeaten = function(groupOrLevel) {
    var paths = groupOrLevel.ls();
    return $scope.user.beaten(paths);
  };

  $scope.isUnlocked = function(groupOrLevel) {
    var paths = groupOrLevel.ls();
    return $scope.user.beaten(paths) || $scope.user.unlocked(paths);
  };
}])
.controller('FreeplayListCtrl', ['$scope', function($scope) {
  $scope.levelSelect = function(groupOrLevel) {
    if (!groupOrLevel.isGroup() && !$scope.isUnlocked(groupOrLevel)) {
      return;
    }
    var query = KeyboardLayout.simplify(groupOrLevel.query());
    $scope.go('/game', {
      'l': groupOrLevel.path()
    });
  };
}])
.controller('GameCtrl', ['$scope', '$route', '$routeParams', function($scope, $route, $routeParams) {
  function tfmt(num) {
    var s = "" + num;
    if (s.length < 2) {
      return "0" + s;
    }
    return s;
  }

  function clockStr(seconds) {
    var s = seconds % 60;
    var minutes = Math.floor(seconds/60);
    if (minutes > 0) {
      return "" + minutes + ":" + tfmt(s);
    }
    return ":" + tfmt(seconds);
  }

  $scope.again = function() { $route.reload() };

  $scope.path = KBLevels.normPath($routeParams.l);
  if ($scope.path == null) {
    throw "no level specified in URL search params";
  }

  var level = $scope.levels.search($scope.path);
  var query = KeyboardLayout.simplify(level.query());

  (function() {
    console.log('query', query);
    var keySet = $scope.layout.query(query);

    function makeSkyFall(parent, config) {
      return new SkyFall(parent, function() {
        var r = Math.floor(Math.random() * keySet.length);
        return keySet[r];
      }, config);
    }

    $scope.running = false;
    $scope.finished = false;
    $scope.paused = false;

    var seconds = 0;
    var maxSuccessive = 0;
    var currSuccessive = 0;

    var gameParent = $('#game-container').empty();
    var gs = new SingleKeyGameScreen(gameParent, makeSkyFall, {
      num: 20,
      countdownSeconds: 0,
      onstart: function() {
        console.log('started');
        $scope.$apply(function() {
          $scope.clock = clockStr(seconds);
          $scope.running = true;
          $scope.paused = false;
        });
      },
      onpause: function() {
        $scope.$apply(function() {
          $scope.paused = true;
        });
      },
      ontick: function(t, dt) {
        var s = Math.floor(t/1000);
        if (s > seconds) {
          seconds = s;
          $scope.$apply(function() {
            $scope.clock = clockStr(seconds);
          });
        }
      },
      onhit: function() {
        currSuccessive++;
        maxSuccessive = Math.max(maxSuccessive, currSuccessive);
      },
      onmiss: function() {
        currSuccessive = 0;
      },
      onlapse: function() {
        currSuccessive = 0;
      },
      onstop: function() {
        $scope.$apply(function() {
          $scope.finished = true;
          $scope.running = false;
          $scope.user.addStats($scope.path, gs.stats);
          console.log("successive", maxSuccessive);
          // TODO: check whether this level was just beaten, and whether that
          // implies that something should be unlocked.
          // TODO: if the user just unlocked a level, then should we reset the
          // statistics to reflect the new better state? We probably don't want
          // to make a user practice stuff forever just because there were a
          // lot of previous failures for a set of keys. That's making the user
          // a slave to the stats, and then they don't really reflect current
          // reality.
        });
        draw_kb_stats(gs.noneDiv, $scope.layout, gs.stats, 'none');
        draw_kb_stats(gs.shiftDiv, $scope.layout, gs.stats, 'shift');
      },
    });

    gs.start();
  }());
}]);
