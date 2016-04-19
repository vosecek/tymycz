angular.module('tymy.cz', ['ngStorage', 'ngCordova', 'focus-if', 'monospaced.elastic', 'angular-md5', 'ionic', 'tymy.controllers', 'tymy.services', 'jett.ionic.filter.bar', 'ion-alpha-scroll', 'angular.filter'])
  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {

      // if (device.platform === "iOS") {
      // window.plugin.notification.local.promptForPermission();
      // }

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
  .config(function($ionicFilterBarConfigProvider) {
    $ionicFilterBarConfigProvider.placeholder('Hledej');
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
        // cache: false,
        views: {
          'tab-dashboard': {
            templateUrl: 'templates/dashboard.html',
            controller: 'DashboardCtrl'
          }
        }
      })
      .state('tab.dashboard-event-detail', {
        url: '/dashboard/events/:eventId',
        cache: false,
        views: {
          'tab-dashboard': {
            templateUrl: 'templates/event-detail.html',
            controller: 'EventDetailCtrl'
          }
        }
      })
      .state('tab.dashboard-discussion-detail', {
        url: '/dashboard/discussions/:discussionId',
        views: {
          'tab-dashboard': {
            templateUrl: 'templates/discussion-detail.html',
            controller: 'DiscussionDetailCtrl'
          }
        }
      })
      .state('tab.team', {
        url: '/team',
        views: {
          'tab-team': {
            templateUrl: 'templates/team.html',
            controller: 'TeamCtrl'
          }
        }
      })
      .state('tab.account', {
        url: '/team/account',
        cache: false,
        views: {
          'tab-team': {
            templateUrl: 'templates/account.html',
            controller: 'AccountCtrl'
          }
        }
      })
      .state('tab.user', {
        url: '/team/user/:userId',
        cache: false,
        views: {
          'tab-team': {
            templateUrl: 'templates/user.html',
            controller: 'UserCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/start/login');
  });