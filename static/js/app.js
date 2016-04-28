angular.module('entrotypeApp', [
  'ngRoute', // TODO: remove this (and the angular-route.min.js dependency)?
  'ui.router',
  'entrotypeControllers',
])
.config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/levels', {
        templateUrl: 'partials/all-levels.html',
        controller: 'LevelsCtrl',
      })
      .when('/title', {
        templateUrl: 'partials/title.html',
      })
      .when('/difficulty', {
        templateUrl: 'partials/difficulty.html',
      })
      .when('/game', {
        templateUrl: 'partials/game.html',
        controller: 'GameCtrl',
      })
      .when('/users', {
        templateUrl: 'partials/users.html',
        controller: 'UsersCtrl',
      })
      .when('/newuser', {
        templateUrl: 'partials/new-user.html',
        controller: 'NewUserCtrl',
      })
      .otherwise({
        redirectTo: '/title',
      });
  }]);
