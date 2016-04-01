var entrotypeControllers = angular.module('entrotypeControllers', []);

entrotypeControllers.controller('ParentCtrl', ['$scope', function($scope) {
  var query = null;

  $scope.levels = KB_LEVELS;
  $scope.layout = new KeyboardLayout('ansi-qwerty');
}]);

entrotypeControllers.controller('FreeplayListCtrl', ['$scope', '$location', '$route', function($scope, $location, $route) {
  $scope.levelSelect = function(groupOrLevel) {
    // A level will have a query parameter. A group contaning levels (or
    // other groups) will have a review parameter.
    var query = $scope.layout.simplifyQuery(groupOrLevel.query());
    $location.path('/game').search('q', query);
  };
}]);

entrotypeControllers.controller('GameCtrl', ['$scope', '$route', '$routeParams', '$location', function($scope, $route, $routeParams, $location) {
  console.log($scope);
  function startGame(query) {
    console.log("got query " + query);
    var keySet = $scope.layout.query(query);

    function makeSkyFall(parent, config) {
      return new SkyFall(parent, function() {
        var r = Math.floor(Math.random() * keySet.length);
        return keySet[r];
      }, config);
    }

    var gameParent = $('#game-container');

    gameParent.empty();
    var gs = new SingleKeyGameScreen(gameParent, makeSkyFall, {
      num: 1,
      countdownSeconds: 0,
      onstop: function() {
        $scope.nextPlaces = [
          { text: 'Again',
            click: function() { $route.reload() },
          },
          { text: 'Levels',
            click: function() { $location.path("/levels") },
          },
          { text: 'Home',
            click: function() { $location.path("/") },
          },
        ];
        draw_kb_stats(gs.noneDiv, $scope.layout, gs.stats, 'none');
        draw_kb_stats(gs.shiftDiv, $scope.layout, gs.stats, 'shift');
        $scope.$apply();
        gs.navDiv.append($('#game-done-nav').removeClass('no-display'));
      },
    });

    gs.start();
  }

  startGame($routeParams.q);
}]);
