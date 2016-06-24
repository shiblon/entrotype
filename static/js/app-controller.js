angular.module('entrotypeControllers', [])
.controller('ParentCtrl', ['$scope', '$state', '$location', function($scope, $state, $location) {
  $scope.levels = KB_LEVELS;
  $scope.layout = new KeyboardLayout('ansi-qwerty');

  $scope.back = function() {
    window.history.back();
  };

  function findBeginningGroup(levels) {
    var curr = levels.root();
    while (curr != null && curr.isGroup()) {
      curr = curr.child(0);
    }
    return curr.parent();
  }

  var KEY_CURRENT_USER = "entrotype-current-user";
  var KEY_USER_PREFIX = "entrotype-user=";
  var KEY_USER_REGEX = /^entrotype-user=(.*)$/;

  function userKey(name) {
    if (name == null) {
      return null;
    }
    return KEY_USER_PREFIX + (name || "");
  }

  function normalizeUsername(name) {
    name = (name || "").trim();
    if (name.length < 3) {
      throw new Error("username too short, must have at least 3 characters");
    }
    if (name.length > 15) {
      throw new Error("username too long, must have no more than 15 characters");
    }
    return name;
  }

  function removeUser(name) {
    if (name == null) {
      return null;
    }
    stRemove(userKey(name));
  }

  function writeUser(user) {
    stSet(userKey(user.name()), user.toObj());
    return user;
  }

  function readUser(name) {
    if (name == null) {
      return null;
    }
    var uobj = stGet(userKey(name));
    if (uobj == null) {
      return null;
    }
    return User.fromObj(uobj);
  }

  $scope.listUsernames = function() {
    var keys = stListMatching(KEY_USER_REGEX);
    $.each(keys, function(i, v) {
      keys[i] = v.replace(KEY_USER_REGEX, "$1");
    });
    return keys;
  }

  // Sets or gets the current user.
  $scope.currentUser = function(_name) {
    if (typeof _name !== 'undefined') {
      stSet(KEY_CURRENT_USER, _name);
    }
    return readUser(stGet(KEY_CURRENT_USER));
  };

  // Switches away from any user.
  $scope.logout = function() {
    stRemove(KEY_CURRENT_USER);
    $state.go('users');
  };

  $scope.createUser = function(name) {
    name = normalizeUsername(name);
    if ($scope.userExists(name)) {
      throw new Error("user name already exists: " + name);
    }
    return writeUser(new User(name));
  };

  $scope.removeUser = function(name) {
    name = normalizeUsername(name);
    if (!$scope.userExists(name)) {
      throw new Error("user name does not exist: " + name);
    }
    return removeUser(name);
  };

  // Creates a new user and, if successful, switches to it.
  $scope.createAndSwitchToUser = function(name) {
    $scope.createUser(name);
    return $scope.currentUser(name);
  };

  $scope.userExists = function(name) {
    return !!readUser(name);
  };

  $scope.userList = function() {
    var matches = stListMatchGroups(/^entrotype-user=(.*)$/);
    var users = [];
    for (var i=0, len=matches.length; i<len; i++) {
      var groups = matches[i];
      users.push(groups[1]);
    }
    return users;
  };

  $scope.withCurrentUser = function(f) {
    var user = $scope.currentUser();
    if (user == null) {
      return false;
    }
    try {
      var oldName = user.name();
      if (f(user) === false) {
        return false;
      }
      // If renamed, ensure that the new name doesn't have collisions before blindly updating.
      if (oldName !== user.name()) {
        if ($scope.userExists(user.name())) {
          console.error("failed user rename to exising user:", user.name());
          return false;
        }
      }
      writeUser(user);
      // If the user got renamed, then we need to delete the old one and
      // remember the new one as the current username.
      if (oldName !== user.name()) {
        stRemove(userKey(oldName));
        $scope.currentUser(user.name());
      }
      return true;
    } catch(err) {
      console.error("error executing " + f + " or updating user:", err)
      return false;
    }
  };

  // TODO: remove or fix this. Currently unused.
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

  // TODO: remove unless we're sure we need it.
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
    var user = $scope.currentUser();
    if (!user) {
      return false;
    }
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
.controller('UsersCtrl', ['$scope', '$state', function($scope, $state) {
  if ($scope.currentUser()) {
    $scope.logout();
  }

  function refreshUsernames() {
    $scope.usernames = $scope.listUsernames();
  }

  refreshUsernames();

  $scope.selectUser = function(name) {
    $scope.currentUser(name);
    $state.go('home');
  };

  $scope.removeUser = function(name) {
    $scope.$parent.removeUser(name);
    refreshUsernames();
  };
}])
.controller('NewUserCtrl', ['$scope', '$state', function($scope, $state) {
  $scope.cancel = function() {
    $state.go('users');
  };

  $scope.tryCreateUser = function() {
    $scope.error = '';
    try {
      $scope.createAndSwitchToUser($scope.proposedUsername);
      $state.go('home');
    } catch (e) {
      $scope.error = e.message;
      return;
    }
  };
}])
.controller('HomeCtrl', ['$scope', '$state', function($scope, $state) {
  if (!$scope.currentUser()) {
    console.log('oops - no logged-in users');
    $state.go('users');
    return;
  }
  $scope.simpleName = function(name) {
    return name.replace(/^.*\./, '');
  };
}])
.controller('LevelsCtrl', ['$scope', '$state', function($scope, $state) {
  $scope.levelSelect = function(groupOrLevel) {
    if (!groupOrLevel.isGroup() && !$scope.isUnlocked(groupOrLevel)) {
      return;
    }
    var query = KeyboardLayout.simplify(groupOrLevel.query());
    $state.go('home.game', {
      'level': groupOrLevel.path(),
      'q': query,
    });
  };
}])
.controller('StatsCtrl', ['$scope', '$state', function($scope, $state) {
  var user = $scope.currentUser(),
      layout = $scope.layout,
      lname = layout.name(),
      stats = user.stats(lname);

  var threshold = 0.8;
  var needsWork = [];
  for (var k in stats.keys) {
    var ks = stats.keys[k];
    if (ks.all() == 0) {
      continue;
    }
    var goodness = ks.good() / ks.all();
    if (goodness < threshold) {
      needsWork.push({
        rate: goodness,
        stat: ks,
      });
    }
  }
  needsWork.sort(function(a, b) { return a.rate - b.rate });
  $scope.needsWork = needsWork;

  draw_kb_stats($('#nomod-stats'), layout, stats, 'none');
  draw_kb_stats($('#shift-stats'), layout, stats, 'shift');
}])
.controller('GameCtrl', ['$scope', '$state', '$stateParams', function($scope, $state, $stateParams) {
  // TODO: reset all state on this when we enter this route!
  // There are weird cases where the game appears to have *continued*, even
  // after a user switch, etc. Ensure that that can't happen.

  $scope.path = KBLevels.normPath($stateParams.level);
  if (!$scope.path) {
    $state.go('home.levels');
    return;
  }

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

  $scope.level = $scope.levels.search($scope.path);
  $scope.query = KeyboardLayout.simplify($scope.level.query());

  var keySet = $scope.layout.query($scope.query);

  function makeSkyFall(parent, config) {
    return new SkyFall(parent, function() {
      var r = Math.floor(Math.random() * keySet.length);
      return keySet[r];
    }, config);
  }

  $scope.running = false;
  $scope.finished = false;
  $scope.paused = false;
  $scope.seconds = 0;

  var maxSuccessive = 0;
  var currSuccessive = 0;

  var maxAttempts = 3*keySet.length;
  var requiredSuccessive = 1.5*keySet.length;
  var requiredGood = 0.8*keySet.length;

  var gameParent = $('#game-container').empty();
  var gs = new SingleKeyGameScreen(gameParent, makeSkyFall, {
    num: maxAttempts,
    countdownSeconds: 0,
    onstart: function() {
      $scope.$apply(function() {
        $scope.clock = clockStr($scope.seconds);
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
      if (s > $scope.seconds) {
        $scope.seconds = s;
        $scope.$apply(function() {
          $scope.clock = clockStr($scope.seconds);
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
          var lname = $scope.layout.name();
          user.addStats(lname, gs.stats);
          // TODO: refine criteria for beating a level. Minimum number of attempts?
          if (gs.stats.good() >= requiredGood
              || maxSuccessive >= requiredSuccessive) {
            user.beat(lname, $scope.query);
          }
        });
      });
    },
  });

  gs.start();
}]);
