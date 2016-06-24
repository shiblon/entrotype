angular.module('entrotypeApp', [
  'ui.router',
  'entrotypeControllers',
])
.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams) {
  // Save things in the scope so they are visible in templates if needed.
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('home');

  $stateProvider
    .state('home', {
      controller: 'HomeCtrl',
      templateUrl: 'partials/home.html',
      url: '/home',
    })
    .state('home.levels', {
      templateUrl: 'partials/levels.html',
      controller: 'LevelsCtrl',
      url: '/levels',
    })
    .state('home.stats', {
      templateUrl: 'partials/stats.html',
      controller: 'StatsCtrl',
      url: '/stats',
    })
    .state('home.game', {
      templateUrl: 'partials/game.html',
      controller: 'GameCtrl',
      params: {
        'level': '',
      },
      url: '/game', // TODO: remove this when things are working properly.
    })
    .state('users', {
      templateUrl: 'partials/users.html',
      controller: 'UsersCtrl',
      url: '/users',
    })
    .state('users.new', {
      templateUrl: 'partials/new-user.html',
      controller: 'NewUserCtrl',
      url: '/new',
    });
  }]);
