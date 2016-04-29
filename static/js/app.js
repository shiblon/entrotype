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
  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('users', {
      url: '/users',
      params: {
        'returnToState': '',
      },
      templateUrl: 'partials/users.html',
      controller: 'UsersCtrl',
    })
    .state('users.newuser', {
      views: {
        '@': { // render in the root unnamed view
          templateUrl: 'partials/new-user.html',
          controller: 'NewUserCtrl',
        },
      },
      params: {
        'okState': '',
        'cancelState': '',
      },
    })
    .state('learn', {
      url: '/learn',
      template: '<ui-view/>',
      controller: 'LearnCtrl',
    })
    .state('learn.levels', {
      templateUrl: 'partials/levels.html',
      controller: 'LevelsCtrl',
    })
    .state('learn.game', {
      templateUrl: 'partials/game.html',
      controller: 'GameCtrl',
      params: {
        'level': '',
        'n': 0,
      },
    })
    .state('home', {
      url: '/home',
      templateUrl: 'partials/title.html',
    });
  }]);
