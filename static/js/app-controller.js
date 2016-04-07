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

  function findBeginningGroup(levels) {
    var curr = levels.root();
    while (curr != null && curr.isGroup()) {
      curr = curr.children()[0];
    }
    return curr.parent();
  }

  function userKey(name) {
    return "entrotype-user=" + name;
  }

  // TODO: make this selectable
  $scope.username = 'guest';

  var currUser = null;

  function getCurrentUserOrGuest() {
    if (currUser != null && currUser.name() === $scope.username) {
      return currUser;
    }
    var userObj = stGet(userKey($scope.username));
    var user;
    if (userObj == null) {
      user = new User("guest");
    } else {
      user = User.fromObj(userObj);
    }
    // TODO: do this elsewhere, perhaps?
    var beginningQuery = findBeginningGroup($scope.levels).query();
    console.log("beginning query", beginningQuery);
    if (!user.unlocked($scope.layout.name(), beginningQuery)) {
      user.unlock($scope.layout.name(), beginningQuery);
    }
    currUser = user;
    return user;
  }

  $scope.userExists = function(name) {
    return stListMatching(new RexExp("^" + userKey(name) + "$")).length > 0;
  };
  $scope.userList = function() {
    var matches = stListMatchGroups(/^entrotype-user=(.*)$/);
    if (matches.length == 0) {
      return ["guest"];
    }
    var users = [];
    for (var i=0, len=matches.length; i<len; i++) {
      var groups = matches[i];
      users.push(groups[1]);
    }
    return users;
  };
  $scope.getCurrentUser = getCurrentUserOrGuest;
  $scope.withCurrentUser = function(f) {
    var user = getCurrentUserOrGuest();
    try {
      var oldName = user.name();
      if (f(user) === false) {
        return false;
      }
      // If renamed, ensure that the new name doesn't have collisions before blindly updating.
      if (oldName !== user.name()) {
        if ($scope.userExists(user.name())) {
          console.error("failed user rename to exising user:", user.name());
          return;
        }
      }
      stSet(userKey(user.name()), user.toObj());
      // If the user got renamed, then we need to delete the old one and
      // remember the new one as the current username.
      if (oldName !== user.name()) {
        stRemove(userKey(oldName));
        $scope.username = user.name();
      }
    } catch(err) {
      console.error("error executing " + f + " or updating user:", err)
    }
  };

  $scope.isBeaten = function(groupOrLevel) {
    return getCurrentUserOrGuest().beaten($scope.layout.name(), groupOrLevel.query());
  };

  $scope.isUnlocked = function(groupOrLevel) {
    var user = getCurrentUserOrGuest();
    var query = groupOrLevel.query();
    var ln = $scope.layout.name();
    return user.beaten(ln, query) || user.unlocked(ln, query);
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

    var maxAttempts = $routeParams.n || 3*keySet.length;
    var requiredSuccessive = 1.5*keySet.length;
    var requiredGood = 0.8*keySet.length;

    var gameParent = $('#game-container').empty();
    var gs = new SingleKeyGameScreen(gameParent, makeSkyFall, {
      num: maxAttempts,
      countdownSeconds: 0,
      onstart: function() {
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
          console.log("successive", maxSuccessive);

          // TODO: check whether this level was just beaten, and whether that
          // implies that something should be unlocked.
          if (gs.stats.good() >= requiredGood
              || maxSuccessive >= requiredSuccessive) {
            console.log('beaten');
          }
          // TODO: if the user just unlocked a level, then should we reset the
          // statistics to reflect the new better state? We probably don't want
          // to make a user practice stuff forever just because there were a
          // lot of previous failures for a set of keys. That's making the user
          // a slave to the stats, and then they don't really reflect current
          // reality.
          $scope.withCurrentUser(function(user) {
            user.addStats($scope.layout.name(), gs.stats);
            var userStats = user.stats($scope.layout.name());
            draw_kb_stats(gs.noneDiv, $scope.layout, userStats, 'none');
            draw_kb_stats(gs.shiftDiv, $scope.layout, userStats, 'shift');
          });
        });
      },
    });

    gs.start();
  }());
}]);
