angular.module('entrotypeControllers', [])
.controller('ParentCtrl', ['$scope', '$location', function($scope, $location) {
  var query = null;

  $scope.levels = KB_LEVELS;
  $scope.layout = new KeyboardLayout('ansi-qwerty');
  $scope.go = function(path, search) {
    search = search || {};
    $location.path(path);
    $.each(search, function(k, v) {
      $location.search(k, v);
    });
  };
}])
.controller('FreeplayListCtrl', ['$scope', '$route', function($scope, $route) {
  $scope.levelSelect = function(groupOrLevel) {
    $scope.$parent.groupOrLevel = groupOrLevel;
    var query = $scope.layout.simplifyQuery(groupOrLevel.query());
    $scope.go('/game', {'q': query});
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

  if ($routeParams.q != null) {
    $scope.query = $routeParams.q;
  } else {
    throw "no query specified in URL search params";
  }

  (function() {
    var keySet = $scope.layout.query($scope.query);

    function makeSkyFall(parent, config) {
      return new SkyFall(parent, function() {
        var r = Math.floor(Math.random() * keySet.length);
        return keySet[r];
      }, config);
    }

    var gameParent = $('#game-container');

    var seconds = 0;

    $scope.running = false;
    $scope.finished = false;

    gameParent.empty();
    var gs = new SingleKeyGameScreen(gameParent, makeSkyFall, {
      num: 1,
      countdownSeconds: 0,
      onstart: function() {
        $scope.$apply(function() {
          $scope.clock = clockStr(seconds);
          $scope.running = true;
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
      onstop: function() {
        $scope.$apply(function() {
          $scope.finished = true;
          $scope.running = false;
        });
        draw_kb_stats(gs.noneDiv, $scope.layout, gs.stats, 'none');
        draw_kb_stats(gs.shiftDiv, $scope.layout, gs.stats, 'shift');
      },
    });

    gs.start();
  }());
}]);