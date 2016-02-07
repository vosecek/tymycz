String.prototype.stripSlashes = function() {
   return this.replace(/\\(.)/mg, "$1");
};
var TC = angular.module('tymy.controllers', []);

TC.controller('LoginCtrl', function($scope, md5, ServerDiscussions, $interval, $stateParams, $ionicLoading, ServerLogin, ServerAPI, $state, $localStorage, $filter, $timeout) {
   $scope.loadNews = function() {
      angular.forEach($scope.$storage, function(server) {
         ServerDiscussions.get({
            url: server.url,
            login: server.user,
            password: server.password
         }, function(data) {
            if (data.status == "OK") {
               server.newPosts = 0;
               angular.forEach(data.data, function(discussion) {
                  server.newPosts = server.newPosts + discussion.newPosts;
               });
            }
         });
      });
   };
   $scope.$on('$ionicView.loaded', function() {
      $scope.$storage = $localStorage.servers;
      var record = $filter('filter')($scope.$storage, {
         autoLogin: true
      }, true);
      if (record.length > 0) {
         $scope.send(record[0]);
      }
   });

   $scope.data = {
      server: "",
      user: "",
      password: "",
      saveAccess: false
   };

   $scope.switch = function(server) {
      $scope.send(server);
   };

   $scope.servers = $localStorage.servers;

   $scope.send = function(loginData) {
      loginData = loginData || false;
      var newTeam = false;
      $ionicLoading.show({
         template: "Login in progress ...",
      });

      TS.Server.TSID = false;

      if (loginData === false) {
         TS.Server.code = $scope.data.server;
         TS.Server.url = $scope.data.server + ".tymy.cz";
         TS.Server.user = $scope.data.user;
         TS.Server.password = md5.createHash($scope.data.password);

         loginData = {
            code: TS.Server.code,
            callName: TS.Server.url,
            url: TS.Server.url,
            user: TS.Server.user,
            password: TS.Server.password,
         };
      } else {
         TS.Server.setTeam(loginData);
      }

      ServerLogin.get(loginData, function(data) {
         // zaregistrovat refresh interval
         if (angular.isDefined($scope.refreshNews)) {
            $interval.cancel($scope.refreshNews);
         }

         // provadet nacteni novych prispevku ze vsech serveru kazdych X milisekund
         $scope.refreshNews = $interval(function() {
            $scope.loadNews();
         }, 60000);

         if (data.status == "OK") {
            $scope.loadNews();
            loginData.url = loginData.url;
            if ($scope.data.saveAccess === true) {
               $scope.$storage = $localStorage.servers;
               if (angular.isUndefined($scope.$storage)) {
                  $scope.$storage = [];
               }
               var record = $filter('filter')($scope.$storage, {
                  url: loginData.url
               }, true);

               if (record.length === 0) {
                  $scope.$storage.push(loginData);
                  $ionicLoading.show({
                     template: "Nový tým uložen, v nastavení týmů můžeš provést další úpravy"
                  });
                  newTeam = true;
               }
            }

            data.data.pictureUrl = TS.Server.fullUrl() + data.data.pictureUrl;
            TS.User = data.data;
            TS.Server.TSID = data.sessionKey;
            if (newTeam === true) {
               $timeout(function() {
                  $state.go('menu.dashboard');
                  $ionicLoading.hide();
               }, 3000);
            } else {
               $ionicLoading.hide();
               $state.go('menu.dashboard');
            }
         } else {
            $ionicLoading.show({
               template: data.statusMessage,
               duration: 2000
            });
         }
      }, function(error) {
         if (error.status == "404") {
            $ionicLoading.show({
               template: "Neznámá adresa " + TS.Server.url + "<br />Podporovány jsou zatím pouze týmy na placeném serveru.",
               duration: 3000
            });
         }
         if (error.status == "0") {
            $ionicLoading.show({
               template: "Nezdařilo se připojení k internetu",
               duration: 3000
            });
         }
      });
   };
});
TC.controller('MyTeamsCtrl', function(md5, $ionicLoading, $scope, $filter, $localStorage, $ionicModal) {
   $scope.$storage = $localStorage.servers;

   $scope.dropTeam = function(server) {
      var record = $filter('filter')($scope.$storage, {
         url: server.url
      }, true);
      var index = $scope.$storage.indexOf(record[0]);
      $scope.$storage.splice(index, 1);
      $scope.closeModal();
      $ionicLoading.show({
         template: "Team removed",
         duration: 2000
      });
   };

   $ionicModal.fromTemplateUrl('templates/team-configuration.html', {
         scope: $scope,
         animation: 'slide-in-up'
      })
      .then(function(modal) {
         $scope.modal = modal;
      });

   $scope.openModal = function() {
      $scope.modal.show();
   };

   $scope.closeModal = function() {
      $scope.modal.hide();
   };

   $scope.saveData = function() {
      $ionicLoading.show({
         template: "Data updated",
         duration: 2000
      });
      var record = $filter('filter')($scope.$storage, {
         url: $scope.data.url
      }, true);
      record[0].callName = $scope.data.callName;
      record[0].user = $scope.data.user;

      if ($scope.data.autoLogin === true) {
         angular.forEach($scope.$storage, function(obj) {
            if (obj.autoLogin === true) {
               $ionicLoading.show({
                  template: "Auto login zrusen u tymu: " + obj.callName,
                  duration: 2000
               });
            }
            obj.autoLogin = false;
         });
      }
      record[0].autoLogin = $scope.data.autoLogin;
      if ($scope.data.password.length > 0) {
         record[0].password = md5.createHash($scope.data.password);
      }
      $scope.closeModal();
   };

   $scope.$on('$destroy', function() {
      $scope.modal.remove();
   });
   $scope.configure = function(team) {
      var record = $filter('filter')($localStorage.servers, {
         url: team.url
      }, true);
      $scope.data = angular.copy(record[0]);
      $scope.data.password = "";
      $scope.openModal();
   };
});
TC.controller('MenuCtrl', function($scope, $timeout, ListView, $rootScope, $ionicLoading, ServerLogin, $localStorage, $state, $location, $ionicSideMenuDelegate, $ionicHistory, $ionicPlatform) {
   $scope.$on('$ionicView.beforeEnter', function() {
      $scope.servers = $localStorage.servers;
      $scope.data = TS.User;
      $scope.data.serverCallName = TS.Server.callName;
   });

   $scope.setIcon = function(server) {
      if (server.url == TS.Server.url) {
         return 'ion-ios-circle-filled';
      } else {
         return 'ion-ios-circle-outline';
      }
   };

   $scope.setClass = function(server) {
      if (server.url == TS.Server.url) {
         return "calm";
      }
      return false;
   };

   $scope.logout = function() {
      $ionicLoading.show({
         template: "Logging out"
      });
      $timeout(function() {
         $ionicHistory.clearCache();
         $ionicHistory.clearHistory();
         $state.go('login', {}, {
            reload: true
         });
         $ionicLoading.hide();
      }, 100);
   };

   $scope.switch = function(team) {
      TS.Server.setTeam(team);
      TS.Server.TSID = false;
      $scope.data.saveAccess = false;

      $ionicLoading.show({
         template: "Connecting to " + team.url
      });

      var loginData = {
         url: TS.Server.url,
         user: TS.Server.user,
         password: TS.Server.password
      };

      ServerLogin.get(loginData, function(data) {
            if (data.status == "OK") {
               data.data.pictureUrl = TS.Server.fullUrl() + data.data.pictureUrl;
               TS.User = data.data;
               TS.Server.TSID = data.sessionKey;
               ListView.clearAll();

               $timeout(function() {
                  $ionicHistory.clearCache();
                  $ionicHistory.nextViewOptions({
                     disableBack: true
                  });
                  $state.go('menu.dashboard', {}, {
                     reload: true
                  });
                  $ionicLoading.hide();

                  $ionicSideMenuDelegate.toggleRight();
               }, 500);
            } else {
               $ionicLoading.show({
                  template: data.statusMessage,
                  duration: 2000
               });
               $state.go('login');
            }
         },
         function(error) {
            $state.go('login');
            $ionicLoading.hide();
         });
   };
});
TC.controller('DashboardCtrl', function($scope, $ionicListDelegate, $filter, ServerAttendance, $ionicHistory, $state, ListView, ServerEventDetail, ServerAPI, ServerDiscussions, ServerEvents, $ionicLoading) {
   $scope.$on('$ionicView.beforeEnter', function() {
      $scope.doRefresh();
   });

   $scope.go = function(target) {
      $ionicHistory.nextViewOptions({
         disableBack: true
      });
      $state.go(target);
   };

   $scope.setAttendance = function(code, event) {
      var data = [{
         userId: TS.User.id,
         eventId: event.id,
         preStatus: code,
      }];

      ServerAPI.http(ServerAttendance, function(data) {
         ServerAPI.get(ServerEventDetail, function(data) {
            $ionicLoading.show({
               template: "Účast aktualizována",
               duration: 500
            });
            $ionicListDelegate.closeOptionButtons();
            var record = $filter('filter')($scope.events, {
               id: event.id
            }, true);
            record[0].userAttendance = ServerAPI.userAttendanceOnEvent(data.data);
            record[0].userAttendance = $scope.detectUserAttendance(record[0], record[0].userAttendance.preStatus);
         }, {
            eventId: event.id
         });
      }, angular.toJson(data));
   };

   $scope.newPosts = function(p) {
      return p.newPosts > 0;
   };
   $ionicLoading.show({
      template: 'Loading data ...'
   });
   $ionicLoading.counter = 2;
   var discussions = "discussions";

   $scope.$on("doRefresh", function() {
      $scope.doRefresh();
   });

   $scope.refreshDiscussions = function() {
      ServerAPI.get(ServerDiscussions, function(data) {
         ListView.clear(discussions);
         $ionicLoading.counter--;
         if ($ionicLoading.counter === 0) {
            $ionicLoading.hide();
         }
         for (var i in data.data) {
            ListView.add(discussions, data.data[i]);
         }
         $scope.discussions = ListView.all(discussions);
      });
   };

   var events = "events";
   $scope.refreshEvents = function() {
      $scope.events = [];
      var dashboardEvents = angular.element(document.getElementById('dashboardEvents'));
      dashboardEvents = $scope.$new(true);
      $ionicLoading.show({
         template: '<ion-spinner icon="circles"></ion-spinner>',
         scope: dashboardEvents
      });
      ServerAPI.get(ServerEvents, function(data) {
         ListView.clear(events);
         for (var i in data.data) {
            ListView.add(events, data.data[i]);
         }

         $scope.events = [];
         var inFuture = ListView.all(events)
            .filter(function(el) {
               if (el.inFuture === true) {
                  return true;
               }
            });
         data = inFuture.reverse();
         $scope.eventsLimit = 3;
         $scope.eventsLoaded = 0;
         for (i in inFuture) {
            if (i == $scope.eventsLimit) break;
            ServerAPI.get(ServerEventDetail, function(data) {
               $scope.eventsLoaded++;
               event = data.data;
               event.userAttendance = ServerAPI.userAttendanceOnEvent(event);
               event.userAttendance = $scope.detectUserAttendance(event, event.userAttendance.preStatus);

               $scope.events.push(event);
               $scope.events.sort(function(a, b) {
                  return (a.startTime < b.startTime ? 1 : -1);
               });
            }, {
               eventId: data[i].id
            });
         }
         $ionicLoading.hide();
      });
   };

   $scope.setAttendanceButton = function(status) {
      if (status.code == "YES") {
         return "ion-ios-checkmark button-balanced";
      }
      if (status.code == "NO") {
         return "ion-ios-close button-assertive";
      }
      if (status.code == "LAT") {
         return "ion-ios-timer button-royal";
      }
      if (status.code == "DKY") {
         return "ion-ios-help button-calm";
      }
   };

   $scope.setAttendanceBadge = function(status) {
      if (status.code == "YES") {
         return "badge-balanced";
      }
      if (status.code == "NO") {
         return "badge-assertive";
      }
      if (status.code == "LAT") {
         return "badge-royal";
      }
      if (status.code == "DKY") {
         return "badge-calm";
      }
   };

   $scope.detectUserAttendance = function(event, code) {
      var record = event.eventType.preStatusSet.filter(function(el) {
         if (el.code == code) return true;
      });
      return record[0];
   };

   $scope.doRefresh = function() {
      $scope.refreshEvents();
      $scope.refreshDiscussions();
      $scope.$broadcast('scroll.refreshComplete');
   };
});
TC.controller('DiscussionsCtrl', function($scope, ListView, ServerDiscussions, ServerAPI, $ionicLoading) {
   $scope.$on('$ionicView.beforeEnter', function() {
      $scope.refresh();
   });

   var master = "discussions";
   $ionicLoading.show({
      template: 'Nacitam diskuze ...'
   });

   $scope.$on("doRefresh", function() {
      $scope.doRefresh();
   });

   $scope.doRefresh = function() {
      $scope.refresh();
      $scope.$broadcast('scroll.refreshComplete');
   };

   $scope.refresh = function() {
      ServerAPI.get(ServerDiscussions, function(data) {
         ListView.clear(master);
         $ionicLoading.hide();
         for (var i in data.data) {
            if (data.data[i].status !== "DELETED") {
               ListView.add(master, data.data[i]);
            }
         }
         $scope.discussions = ListView.all(master);
      });
   };
});
TC.controller('EventsCtrl', function($scope, ListView, ServerEvents, ServerAPI, $ionicLoading) {
      $scope.$on('$ionicView.beforeEnter', function() {
         $scope.refresh();
      });
      $scope.switch = function(show, silent) {
         silent = silent || false;
         $scope.show = show;
         if (silent === false) {
            $ionicLoading.show({
               template: '<ion-spinner icon="circles"></ion-spinner>',
               duration: 250
            });
         }
         $scope.events = $scope[show];
      };

      $scope.$on("doRefresh", function() {
         $scope.doRefresh();
      });

      $scope.doRefresh = function() {
         $scope.refresh();
         $scope.$broadcast('scroll.refreshComplete');
      };

      var events = "events";
      $scope.refresh = function() {
         $ionicLoading.show({
            template: 'Nacitam udalosti ...'
         });
         ServerAPI.get(ServerEvents, function(data) {
            ListView.clear(events);
            $ionicLoading.hide();
            for (var i in data.data) {
               ListView.add(events, data.data[i]);
            }
            $scope.events = ListView.all(events);

            $scope.inFuture = $scope.events.filter(function(el) {
               if (el.inFuture === true) {
                  return true;
               }
            });
            $scope.inPast = $scope.events.filter(function(el) {
               if (el.inPast === true) {
                  return true;
               }
            });
            $scope.inFuture = $scope.inFuture.slice()
               .reverse();
            $scope.switch("inFuture", true);
         });
      };
   })
   .controller("EventDetailCtrl", function($scope, ServerAttendance, $filter, ServerAPI, $sce, ServerEventDetail, $stateParams, ListView, $ionicLoading) {
      $scope.$on('$ionicView.beforeEnter', function() {
         $scope.refresh();
      });

      $scope.buttonAttendance = function(status) {
         if (status == $scope.userAttendance.preStatus) {
            if (status == "YES") {
               return "button-balanced";
            }
            if (status == "NO") {
               return "button-assertive";
            }
            if (status == "LAT") {
               return "button-royal";
            }
            if (status == "DKY") {
               return "button-calm";
            }
         }
      };

      $scope.setAttendance = function(code) {
         var data = [{
            userId: TS.User.id,
            eventId: $stateParams.eventId,
            preStatus: code,
            preDescription: $scope.userAttendance.preDescription
         }];

         ServerAPI.http(ServerAttendance, function(data) {
            $ionicLoading.show({
               template: "Účast aktualizována",
               duration: 500
            });
            $scope.refresh();
         }, angular.toJson(data));
      };

      /**
       * sestavit celkovou dochazku na udalosti
       * @return {[type]} [description]
       */
      $scope.detectAttendance = function() {
         $scope.attendance = {};
         $scope.attendance.UNDECIDED = [];
         for (var i in $scope.event.attendance) {
            var attendance = $scope.event.attendance[i];
            if (angular.isUndefined(attendance.preStatus)) {
               $scope.attendance.UNDECIDED.push(attendance.user);
            } else {
               if (angular.isUndefined($scope.attendance[attendance.preStatus])) {
                  $scope.attendance[attendance.preStatus] = [];
               }
               var attd = {};
               attd.preDescription = attendance.preDescription;
               attd.callName = attendance.user.callName;
               attd.displayName = attendance.user.displayName;
               attd.preDatMod = attendance.preDatMod;
               attd.pictureUrl = TS.Server.fullUrl() + attendance.user.pictureUrl;
               $scope.attendance[attendance.preStatus].push(attd);
            }
         }
         var undecided = $scope.attendance.UNDECIDED;
         delete $scope.attendance.UNDECIDED;
         $scope.attendance.UNDECIDED = undecided;
         // $scope.event.eventType.preStatusSet.push({
         //   caption: "Undecided",
         //   code: "UNDECIDED"
         // });
      };
      $scope.refresh = function() {
         ServerAPI.get(ServerEventDetail, function(data) {
            $scope.event = data.data;
            $scope.detectAttendance();
            $scope.userAttendance = ServerAPI.userAttendanceOnEvent($scope.event);
         }, {
            eventId: $stateParams.eventId
         });
      };

      $scope.renderHtml = function(html_code) {
         return $sce.trustAsHtml(html_code);
      };
   })
   .controller("DiscussionDetailCtrl", function($scope, $filter, $localStorage, $ionicLoading, $resource, $stateParams, ListView, ServerDiscussionDetail, $sce, ServerAPI, ServerDiscussionPost) {
      $scope.$on('$ionicView.beforeEnter', function() {
         $scope.discussion = ListView.get("discussions", $stateParams.discussionId);
         $scope.refresh();
      });

      $scope.form = {};
      var master = "discussionDetail";
      $scope.renderHtml = function(html_code) {
         return $sce.trustAsHtml(html_code);
      };
      $scope.setClass = function(sticky) {
         if (sticky === true) {
            return "assertive";
         }
         /**
          * @todo  oznacovat autorovy prispevky necim
          */
      };
      $ionicLoading.show({
         template: 'Nacitam diskuzi ...'
      });

      $scope.$on("doRefresh", function() {
         $scope.doRefresh();
      });

      $scope.doRefresh = function() {
         $scope.refresh();
         $scope.$broadcast('scroll.refreshComplete');
      };
      $scope.post = function() {
         $ionicLoading.show({
            template: 'Odesílám komentář ...'
         });
         ServerAPI.save(ServerDiscussionPost, function(data) {
            $scope.posts = ListView.all(master);
            $scope.form.comment = "";
            $scope.refresh();
         }, {
            discussionId: $stateParams.discussionId,
            post: {
               post: $scope.form.comment
            },
         });
      };

      $scope.dirtyNews = function() {
         $scope.$storage = $localStorage.servers;
         var record = $filter('filter')($scope.$storage, {
            url: TS.Server.url
         }, true);
         if (record.length == 1) {
            record[0].newPosts = record[0].newPosts - $scope.data.newPosts;
         }
      };

      $scope.refresh = function() {
         ServerAPI.get(ServerDiscussionDetail, function(data) {
            ListView.clear(master);
            $ionicLoading.hide();
            $scope.data = data.data.discussion;
            $scope.dirtyNews();
            for (var i in data.data.posts) {
               data.data.posts[i].post = data.data.posts[i].post.stripSlashes();
               ListView.add(master, data.data.posts[i]);
            }
            $scope.posts = ListView.all(master);
         }, {
            discussionId: $stateParams.discussionId,
            page: 1
         });
      };
   });