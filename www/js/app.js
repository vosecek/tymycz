var app = angular.module('tymy.cz', ['ngStorage', 'ngCordova', 'focus-if', 'monospaced.elastic', 'angular-md5', 'ionic', 'tymy.controllers', 'tymy.services', 'jett.ionic.filter.bar', 'ion-alpha-scroll', 'angular.filter', 'pascalprecht.translate'])

.constant('AppConfig', {
    version: '0.9.5',
    lang: "cs",
    changelog: {
        "0.9.5": {
            date: "24.1.2017",
            items: {
                cs: ["Ikonky hráčů v docházce a v diskuzi", "Místo a odkaz v detailu události, pokud jsou zadané."]
            }
        },
        "0.9.4": {
            date: "20.1.2017",
            items: {
                cs: ["V seznamu nerozhodnutých uživatelů na události se vypisují pouze Hráči (zadaná docházka Maroda či Člena zobrazena je)"]
            }
        },
        "0.9.3": {
            date: "11.12.2016",
            items: {
                cs: ["Seznam nerozhodnutých uživatelů na detailu události", "Oprava chyby - už nelze změnit účast na akci po uzávěrce"]
            }
        },
        "0.9.2": {
            date: "1.11.2016",
            items: {
                cs: ["Oprava chyby - nezobrazování poznámky k účasti v docházce na události"]
            }
        },
        "0.9.1": {
            date: "18.9.2016",
            items: {
                cs: ["Oprava chyby v Androidu - nabízení akce pro otevření diskuze", "Opravená chyba s názvem aktuálního týmu na Dashboardu při přepnutí týmu"]
            }
        },
        "0.9.0": {
            date: "15.9.2016",
            items: {
                cs: ["Lze otevírat (do systémového prohlížeče) html odkazy v diskuzi či popisu události", "V docházce na události je účast setříděna dle pohlaví do dvou sloupců", "Aktuálně probíhající událost je viditelná jako budoucí", "Při rozkliknutí účasti na události se dá scrollovat snadno dolů"]
            }
        },
        "0.5.0": {
            date: "5.6.2016",
            items: {
                cs: ["Vyhledávání v diskuzi", "Příprava pro multijazyčnost v další verzi", "Toast notifikace namísto celoobrazovkových", "Oprava chyby záporných příspěvků po vložení nového příspěvku"]
            }
        },
        "0.4.5": {
            date: "12.5.2016",
            items: {
                cs: ["Označování nových příspěvků v diskuzi", "Při přepnutí serveru se přehled vyroluje nahoru, aby byly vidět diskuze", "Správný počet nových příspěvků celkem po prvním přihášení"]
            }
        },
        "0.4.3": {
            date: "19.4.2016",
            items: {
                cs: ["Opravené datum konce události", "Načítání starších příspěvků v diskuzi nekonečným scrollováním", "Menší odsazení a menší font v diskuzi pro úsporu místa"]
            }
        },
        "0.4.2": {
            date: "16.3.2016",
            items: {
                cs: ["Vylepšený seznam uživatelů, doplněný o index bar"]
            }
        },
        "0.4.1": {
            date: "15.3.2016",
            items: {
                cs: ["Přehled uživatelů s vyhledáváním"]
            }
        },
        "0.4.0": {
            date: "3.3.2016",
            items: {
                cs: ["Přepracování ovládání na záložky namísto menu"]
            }
        },
        "0.3.4": {
            date: "25.2.2016",
            items: {
                cs: ["Beta verze aplikace, určena pro uživatelské testování v rámci frisbee komunity."]
            }
        }
    }
})

.run(function($ionicPlatform, $localStorage) {
        $localStorage.$default({
            servers: []
        });
        $ionicPlatform.ready(function() {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })
    .config(function($translateProvider, AppConfig) {
        $translateProvider.useSanitizeValueStrategy('sanitize');
        $translateProvider.useStaticFilesLoader({
            prefix: "locale-",
            suffix: ".json"
        });

        $translateProvider.preferredLanguage(AppConfig.lang);
        $translateProvider.fallbackLanguage(AppConfig.lang);
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
        $urlRouterProvider.otherwise('/start/login');
    });
