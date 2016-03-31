var entrotypeApp = angular.module('entrotypeApp', [
  'ngRoute',
  'entrotypeControllers',
]);

entrotypeApp.config([
  '$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/levels', {
        templateUrl: 'partials/all-levels.html',
        controller: 'FreeplayListCtrl',
      })
      .when('/title', {
        templateUrl: 'partials/title.html',
      })
      .when('/difficulty', {
        templateUrl: 'partials/difficulty.html',
      })
      .when('/game/:query', {
        templateUrl: 'partials/game.html',
        controller: 'GameCtrl',
      })
      .otherwise({
        redirectTo: '/title',
      });
  }]);
