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
      .state('start', {
        url: '/start',
        abstract: true,
        templateUrl: 'templates/start.html'
      })
      .state('start.login', {
        url: '/login',
        views: {
          "start-login": {
            templateUrl: 'templates/login.html',
            controller: 'LoginCtrl'
          }
        }
      })
      .state('start.about', {
        url: '/about',
        views: {
          "start-about": {
            templateUrl: 'templates/about.html',
            controller: 'AboutCtrl'
          }
        }
      })
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'TabCtrl'
      })
      .state('tab.discussions', {
        url: '/discussions',
        views: {
          'tab-discussions': {
            templateUrl: 'templates/discussions.html',
            controller: 'DiscussionsCtrl'
          }
        }
      })
      .state('tab.discussion-detail', {
        url: '/discussions/:discussionId',
        views: {
          'tab-discussions': {
            templateUrl: 'templates/discussion-detail.html',
            controller: 'DiscussionDetailCtrl'
          }
        }
      })
      .state('tab.events', {
        url: '/events',
        views: {
          'tab-events': {
            templateUrl: 'templates/events.html',
            controller: 'EventsCtrl'
          }
        }
      })
      .state('tab.event-detail', {
        url: '/events/:eventId',
        views: {
          'tab-events': {
            templateUrl: 'templates/event-detail.html',
            controller: 'EventDetailCtrl'
          }
        }
      })
      .state('tab.dashboard', {
        url: '/dashboard',
        views: {
          'tab-dashboard': {
            templateUrl: 'templates/dashboard.html',
            controller: 'DashboardCtrl'
          }
        }
      })
      .state('tab.user', {
        url: '/user',
        views: {
          'tab-user': {
            templateUrl: 'templates/user.html',
            controller: 'UserCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/start/login');
  });