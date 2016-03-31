var entrotypeControllers = angular.module('entrotypeControllers', []);

entrotypeControllers.controller('FreeplayListCtrl', ['$scope', '$location', function($scope, $location) {
  // Deep copy.
  $scope.levelConfig = JSON.parse(JSON.stringify(LEVEL_GROUPS));

  $scope.levelSelect = function(level) {
    $location.path('/game/' + level.query);
  };

  $scope.reviewSelect = function(group) {
    $location.path('/game/' + group.review);
  };
}]);

entrotypeControllers.controller('GameCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {
  var layout = new KeyboardLayout(KeyboardLayout.LAYOUT.ansi_qwerty);

  function startGame(query) {
    var keySet = layout.query(query);

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
        draw_kb_stats(gs.noneDiv, layout, gs.stats, 'none');
        draw_kb_stats(gs.shiftDiv, layout, gs.stats, 'shift');
      },
    });

    gs.start();
  }

  console.log("hey there " + $routeParams.query);
  startGame($routeParams.query);
}]);
