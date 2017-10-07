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
  };

  // Sets or gets the current user.
  $scope.currentUser = function(_name) {
    if (typeof _name !== 'undefined') {
      stSet(KEY_CURRENT_USER, _name);
    }
    return readUser(stGet(KEY_CURRENT_USER));
  };

  // Get current user stats.
  $scope.currentStats = function() {
    return $scope.currentUser().stats($scope.layout.name());
  };

  // Get things that need work.
  $scope.getTroubleKeys = function() {
    var threshold = 0.8,
        stats = $scope.currentStats(),
        nw = [];
    for (var k in stats.keys) {
      var ks = stats.keys[k];
      if (ks.all() == 0) {
        continue;
      }
      var goodness = ks.good() / ks.all();
      if (goodness < threshold) {
        nw.push({
          rate: goodness,
          percent: Math.floor(goodness * 100),
          stat: ks,
        });
      }
    }
    nw.sort(function(a, b) { return a.rate - b.rate });
    return nw;
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

  $scope.isBeaten = function(groupOrLevel) {
    var user = $scope.currentUser();
    if (!user) {
      return false;
    }
    return user.beaten($scope.layout.name(), groupOrLevel.query());
  };

  $scope.isUnlocked = function(groupOrLevel) {
    // Levels don't determine unlockedness - go up a level and start the real algorithm.
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

  if ($scope.usernames.length == 0) {
    $state.go('users.new');
    return;
  }

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
    $state.go('users');
    return;
  }
  $scope.simpleName = function(name) {
    return name.replace(/^.*\./, '');
  };
}])
.controller('LevelsCtrl', ['$scope', '$state', function($scope, $state) {
  var trouble = $scope.getTroubleKeys(),
      needsWork = [];
  for (var i = 0; i < trouble.length; i++) {
    needsWork.push(trouble[i].stat.ch);
  }
  // Create a string with all of the characters that need work, sorted lexicographically.
  needsWork = needsWork.sort().join('');

  function intersectSortedStrings(s1, s2) {
    var i2 = 0,
        isect = [];
    for (var i1 = 0; i1 < s1.length; i1++) {
      while (s2[i2] < s1[i1]) {
        i2++;
      }
      if (s2[i2] === s1[i1]) {
        isect.push(s1[i1]);
      }
    }
    return isect.join('');
  }

  // Determine whether this level would be a good one to review based on what needs work.
  $scope.levelNeedsWork = function(level) {
    var keys = $scope.layout.query(level.query()).sort().join('');
    var intersection = intersectSortedStrings(keys, needsWork);
    return intersection.length > 0;
  };

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
  var layout = $scope.layout,
      stats = $scope.currentStats();

  $scope.needsWork = $scope.getTroubleKeys();

  draw_kb_stats($('#nomod-stats'), layout, stats, 'none');
  draw_kb_stats($('#shift-stats'), layout, stats, 'shift');
}])
.controller('GameCtrl', ['$scope', '$state', '$stateParams', '$timeout', function($scope, $state, $stateParams, $timeout) {
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
    var stats = $scope.currentStats(),
        sampler = stats.makeSampler(keySet);

    return new SkyFall(parent, sampler, config);
  }

  $scope.running = false;
  $scope.finished = false;
  $scope.paused = false;
  $scope.seconds = 0;

  var maxSuccessive = 0;
  var currSuccessive = 0;

  var maxSeconds = 1 * 60;
  var requiredSuccessive = 1.5*keySet.length;
  var requiredGood = 0.8*keySet.length;

  var gameParent = $('#game-container').empty();
  var gs = new SingleKeyGameScreen(gameParent, makeSkyFall, {
    num: 10000, // we'll stop at a certain time, rather than after a certain number.
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
        if ($scope.seconds > maxSeconds) {
          return false;
        }
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
          if (gs.stats.good() >= requiredGood
              && maxSuccessive >= requiredSuccessive) {
            user.beat(lname, $scope.query);
          }
        });
      });
    },
  });

  $scope.$on('$destroy', function() {
    console.log('game pause forced by blurred controller');
    // Async to match how pause is usually called, avoiding nested $apply.
    $timeout(function() { gs.pause() }, 0, false);
  });

  gs.start();
}]);
