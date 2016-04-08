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
      curr = curr.child(0);
    }
    return curr.parent();
  }

  function userKey(name) {
    return "entrotype-user=" + name;
  }

  // TODO: make this selectable
  $scope.username = 'guest';

  var currUser = null;
  $scope.getCurrentUserOrGuest = function() {
    if (currUser != null && currUser.name() === $scope.username) {
      return currUser;
    }
    var userObj = stGet(userKey($scope.username));
    var user;
    if (userObj == null) {
      user = new User($scope.username);
    } else {
      user = User.fromObj(userObj);
    }
    currUser = user; // memoize
    return user;
  };

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
  $scope.withCurrentUser = function(f) {
    currUser = null; // ensure that next call to "get" will go out to storage.
    var user = $scope.getCurrentUserOrGuest();
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

  $scope.beatenLevels = function(user) {
    var lname = $scope.layout.name();
    var beaten = [];
    $scope.levels.eachPre(function(node) {
      if (user.beaten(lname, node.query())) {
        beaten.push(node.path());
      }
    });
    return beaten.sort();
  };

  $scope.setSub = function(l1, l2) {
    var sub = [];
    var i1=0, i2=0, len1=l1.length, len2=l2.length;
    while (i1<len1 && i2<len2) {
      while (i2<len2 && l2[i2] < l1[i1]) {
        i2++;
      }
      while (i1<len1 && l1[i1] < l2[i2]) {
        sub.push(l1[i1]);
        i1++;
      }
      while (i1<len1 && i2<len2 && l1[i1] === l2[i2]) {
        i1++;
        i2++;
      }
    }
    return sub.concat(l1.slice(i1));
  };

  $scope.isBeaten = function(groupOrLevel) {
    var user = $scope.getCurrentUserOrGuest();
    var lname = $scope.layout.name();
    return user.beaten($scope.layout.name(), groupOrLevel.query());
  };

  $scope.isUnlocked = function(groupOrLevel) {
    // Levels don't determine unlockedness - go up a level and start the rael algorithm.
    var g = groupOrLevel;
    if (!g.isGroup()) {
      g = g.parent();
    }

    // A group is unlocked if
    // 1. Its immediate (previous) sibling is beaten, or if it has no immediate sibling,
    // 2. The immediate sibling of its parent is beaten (recursively up the tree),
    // 3. There is no immediate sibling for it or any of its parents.
    while (g != null) {
      var s = g.prevSibling();
      if (s != null) {
        return $scope.isBeaten(s);
      }
      g = g.parent();
    }
    // Didn't find any parent siblings, so this is unlocked.
    if (g == null) {
      return true;
    }
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

          // TODO: if the user just unlocked a level, then should we reset the
          // statistics to reflect the new better state? We probably don't want
          // to make a user practice stuff forever just because there were a
          // lot of previous failures for a set of keys. That's making the user
          // a slave to the stats, and then they don't really reflect current
          // reality.
          $scope.withCurrentUser(function(user) {
            var beatenBefore = $scope.beatenLevels(user);
            var lname = $scope.layout.name();
            user.addStats(lname, gs.stats);
            // TODO: refine criteria for beating a level. Minimum number of attempts?
            if (gs.stats.good() >= requiredGood
                || maxSuccessive >= requiredSuccessive) {
              user.beat(lname, query);
            }
            var beatenAfter = $scope.beatenLevels(user);
            console.log(beatenBefore, beatenAfter, $scope.setSub(beatenAfter, beatenBefore));
            draw_kb_stats(gs.noneDiv, $scope.layout, user.stats(lname), 'none');
            draw_kb_stats(gs.shiftDiv, $scope.layout, user.stats(lname), 'shift');
          });
        });
      },
    });

    gs.start();
  }());
}]);
