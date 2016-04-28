angular.module('entrotypeApp', [
  'ui.router',
  'entrotypeControllers',
])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'partials/title.html',
    })
    .state('levels', {
      url: '/levels',
      templateUrl: 'partials/all-levels.html',
      controller: 'LevelsCtrl',
    })
    .state('title', {
      url: '/home',
      templateUrl: 'partials/title.html',
    })
    .state('game', {
      url: '/game/:level/:q/:n',
      templateUrl: 'partials/game.html',
      controller: 'GameCtrl',
    })
    .state('users', {
      url: '/users',
      templateUrl: 'partials/users.html',
      controller: 'UsersCtrl',
    })
    .state('newuser', {
      url: '/newuser/:o/:c',
      templateUrl: 'partials/new-user.html',
      controller: 'NewUserCtrl',
    });
  }]);
