// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
// 


angular.module('tymy.cz', ['ngStorage', 'focus-if', 'monospaced.elastic', 'angular-md5', 'ionic', 'tymy.controllers', 'tymy.services'])
  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })
      .state('menu', {
        url: '/menu',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'MenuCtrl'
      })
      .state('menu.my-teams', {
        url: '/my-teams',
        views: {
          'menuContent': {
            templateUrl: 'templates/my-teams.html',
            controller: 'MyTeamsCtrl'
          }
        }
      })
      .state('menu.discussions', {
        url: '/discussions',
        views: {
          'menuContent': {
            templateUrl: 'templates/discussions.html',
            controller: 'DiscussionsCtrl'
          }
        }
      })
      .state('menu.discussion-detail', {
        url: '/discussions/:discussionId',
        views: {
          'menuContent': {
            templateUrl: 'templates/discussion-detail.html',
            controller: 'DiscussionDetailCtrl'
          }
        }
      })
      .state('menu.events', {
        url: '/events',
        views: {
          'menuContent': {
            templateUrl: 'templates/events.html',
            controller: 'EventsCtrl'
          }
        }
      })
      .state('menu.event-detail', {
        url: '/events/:eventId',
        views: {
          'menuContent': {
            templateUrl: 'templates/event-detail.html',
            controller: 'EventDetailCtrl'
          }
        }
      })
      .state('menu.dashboard', {
        url: '/dashboard',
        views: {
          'menuContent': {
            templateUrl: 'templates/dashboard.html',
            controller: 'DashboardCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });