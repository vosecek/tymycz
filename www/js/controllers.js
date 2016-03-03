String.prototype.stripSlashes = function() {
   return this.replace(/\\(.)/mg, "$1");
};
var TC = angular.module('tymy.controllers', []);
TC.keyboardOpen = false;

window.addEventListener('native.keyboardshow', function() {
   TC.keyboardOpen = true;
});

TC.controller('AboutCtrl', function($scope, $window) {
   $scope.$on('$ionicView.beforeEnter', function(event, viewData) {
      viewData.enableBack = true;
   });

   $scope.email = function(email) {
      var link = "mailto:" + email + "?subject=Tymy.cz aplikace";
      $window.location.href = link;
   };
});

TC.controller('LoginCtrl', function($scope, md5, ServerUsers, ServerEventTypes, $stateParams, $ionicLoading, ServerLogin, ServerAPI, $state, $localStorage, $filter, $timeout) {
   $scope.$storage = $localStorage;

   $scope.$on('$ionicView.loaded', function() {
      var record = $filter('filter')($scope.$storage.servers, {
         autoLogin: true
      }, true);

      if (record && record.length > 0) {
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
         template: "Přihlašuji ...",
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

         if (data.status == "OK") {
            loginData.url = loginData.url;
            if ($scope.data.saveAccess === true) {
               if (angular.isUndefined($scope.$storage.servers)) {
                  $scope.$storage.servers = [];
               }
               var record = $filter('filter')($scope.$storage.servers, {
                  url: loginData.url,
                  user: loginData.user
               }, true);

               if (record.length === 0) {
                  $scope.$storage.servers.push(loginData);
                  $ionicLoading.show({
                     template: "Nový tým uložen, v nastavení týmů můžeš provést další úpravy"
                  });
                  newTeam = true;
               }
            }

            data.data.pictureUrl = TS.Server.fullUrl() + data.data.pictureUrl;
            TS.User = data.data;
            TS.Server.TSID = data.sessionKey;

            ServerAPI.get(ServerUsers, function(data) {
               TS.Server.Users = data.data;
            });

            ServerAPI.get(ServerEventTypes, function(data) {
               TS.Server.EventTypes = data.data;

               if (newTeam === true) {
                  $timeout(function() {
                     $state.go('tab.dashboard');
                     $ionicLoading.hide();
                  }, 3000);
               } else {
                  $ionicLoading.hide();
                  $state.go('tab.dashboard');
               }
            });
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

TC.controller('TabCtrl', function($scope, $timeout, ListView, $rootScope, $ionicLoading, ServerLogin, $localStorage, $state, $location, $ionicSideMenuDelegate, $ionicHistory, $ionicPlatform) {
   $scope.$storage = $localStorage;
   $scope.data = {};

   $scope.$on('$ionicView.beforeEnter', function() {
      $scope.servers = $scope.$storage.servers;
      $scope.data = TS.User;
   });

   $scope.setIcon = function(server) {
      if (server.url == TS.Server.url && server.user == TS.Server.user) {
         return 'ion-ios-circle-filled';
      } else {
         return 'ion-ios-circle-outline';
      }
   };

   $scope.setClass = function(server) {
      if (server.url == TS.Server.url && server.user == TS.Server.user) {
         return "calm";
      }
      return false;
   };

   $scope.switch = function(team) {
      TS.Server.setTeam(team);
      TS.Server.TSID = false;
      $scope.data.saveAccess = false;

      $ionicLoading.show({
         template: "Připojuji k " + team.url
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
                  $state.go('tab.dashboard', {}, {
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
               $state.go('start.login');
            }
         },
         function(error) {
            $state.go('start.login');
            $ionicLoading.hide();
         });
   };
});
TC.controller('DashboardCtrl', function($scope, $localStorage, $interval, $rootScope, $ionicListDelegate, $filter, ServerAttendance, $ionicHistory, $state, ListView, ServerEventDetail, ServerAPI, ServerDiscussions, ServerEvents, $ionicLoading) {
   $scope.$storage = $localStorage;

   $scope.$on('$ionicView.beforeEnter', function() {
      $scope.data = {};
      $scope.data.serverCallName = TS.Server.callName;
      $scope.doRefresh();
   });

   $scope.$on("$ionicView.enter", function() {
      // provadet nacteni novych prispevku ze vsech serveru kazdych X milisekund
      if (angular.isDefined($scope.refreshNews)) {
         $interval.cancel($scope.refreshNews);
      }
      $scope.refreshNews = $interval(function() {
         $scope.loadNews();
      }, 60000);
   });

   $scope.loadNews = function() {
      $scope.$storage.totalNewPosts = 0;
      $scope.$storage.serverNewPosts = 0;
      angular.forEach($scope.$storage.servers, function(server) {
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
               if (server.url == TS.Server.url && server.user == TS.Server.user) {
                  $scope.$storage.serverNewPosts = server.newPosts;
               }
               $scope.$storage.totalNewPosts += server.newPosts;
            }
         });
      });
   };

   $scope.humanAttendance = function(event) {
      return ServerAPI.humanAttendance(event);
   };

   $scope.go = function(target) {
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
            record[0].myAttendance = {
               preStatus: code
            };
         }, {
            eventId: event.id
         });
      }, angular.toJson(data));
   };

   $scope.newPosts = function(p) {
      return p.newPosts > 0;
   };
   $ionicLoading.show({
      template: 'Načítání dat ...'
   });
   $ionicLoading.counter = 2;
   var discussions = "discussions";

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
         template: '<ion-spinner icon="circles"></ion-spinner>'
      });
      ServerAPI.get(ServerEvents, function(data) {
         ListView.clear(events);
         for (var i in data.data) {
            ListView.add(events, data.data[i]);
         }

         $scope.events = [];
         var inFuture = ListView.all(events).filter(function(el) {
            if (el.inFuture === true) {
               return true;
            }
         });
         data = inFuture.reverse();
         $scope.events = data.slice(0, 3);

         angular.forEach($scope.events, function(event) {
            event.eventType = ServerAPI.detectEventType(event);
         });
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
      if (status.preStatus == "YES") {
         return "badge-balanced";
      }
      if (status.preStatus == "NO") {
         return "badge-assertive";
      }
      if (status.preStatus == "LAT") {
         return "badge-royal";
      }
      if (status.preStatus == "DKY") {
         return "badge-calm";
      }
   };

   $scope.doRefresh = function() {
      $scope.loadNews();
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
TC.controller('UserCtrl', function($scope, $ionicModal, $localStorage, $filter, $ionicLoading, $timeout, $ionicHistory, $state) {
   $scope.$storage = $localStorage;

   $scope.$on('$ionicView.beforeEnter', function() {
      $scope.servers = $localStorage.servers;
      $scope.data = TS.User;
   });

   $scope.logout = function() {
      $ionicLoading.show({
         template: "Logging out"
      });
      $timeout(function() {
         $ionicHistory.clearCache();
         $ionicHistory.clearHistory();
         $state.go('start.login', {}, {
            reload: true
         });
         $ionicLoading.hide();
      }, 100);
   };

   $scope.dropTeam = function(server) {
      var record = $filter('filter')($scope.$storage.servers, {
         url: server.url,
         user: server.user
      }, true);
      var index = $scope.$storage.servers.indexOf(record[0]);
      $scope.$storage.servers.splice(index, 1);
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
         template: "Aktualizováno",
         duration: 2000
      });
      var record = $filter('filter')($scope.$storage.servers, {
         url: $scope.data.url,
         user: $scope.data.user
      }, true);
      record[0].callName = $scope.data.callName;
      record[0].user = $scope.data.user;

      if ($scope.data.autoLogin === true) {
         angular.forEach($scope.$storage.servers, function(obj) {
            if (obj.autoLogin === true && (obj.url !== record[0].url || obj.user !== record[0].user)) {
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
      var record = $filter('filter')($scope.$storage.servers, {
         url: team.url,
         user: team.user
      }, true);
      $scope.data = angular.copy(record[0]);
      $scope.data.password = "";
      $scope.openModal();
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

      $scope.doRefresh = function() {
         $scope.refresh();
         $scope.$broadcast('scroll.refreshComplete');
      };

      var events = "events";
      $scope.refresh = function() {
         $ionicLoading.show({
            template: 'Načítám události ...'
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
            $scope.inFuture = $scope.inFuture.slice().reverse();
            $scope.switch("inFuture", true);
         });
      };
   })
   .controller("EventDetailCtrl", function($ionicConfig, $state, $scope, ServerAttendance, $filter, ServerAPI, $sce, ServerEventDetail, $stateParams, ListView, $ionicLoading, $ionicHistory) {
      $scope.showDashboard = false;
      $scope.$on('$ionicView.beforeEnter', function(event, viewData) {
         var history = $ionicHistory.viewHistory();
         if (angular.isDefined(history.backView) && history.backView.stateId == "tab.dashboard") {
            $scope.showDashboard = true;
         } else {
            $scope.showDashboard = false;
         }
      });
      $scope.$on('$ionicView.enter', function(event, viewData) {
         $scope.$watch('myAttendance.preDescription', function(newValue, oldValue) {
            if (typeof oldValue != "undefined" && oldValue.length > 0 && newValue !== oldValue) {
               buttons = document.querySelector('.button-bar').getElementsByTagName('button');
               for (var i = 0; i < buttons.length; ++i) {
                  button = buttons[i];
                  angular.element(button).addClass("button-dark");
               }
            }
         });
      });

      $scope.go = function(target) {
         $ionicHistory.nextViewOptions({
            disableBack: true
         });
         $state.go(target);
      };

      $scope.genderAttendance = function(attendance) {
         var output = [];
         var male = [];
         var female = [];
         var unknown = [];
         angular.forEach(attendance, function(el) {
            user = $filter('filter')(TS.Server.Users, {
               callName: el.callName
            }, true);

            if (angular.isDefined(user) && user.length > 0) {
               user = user[0];
               if (user.gender == "MALE") {
                  male.push(user.callName);
               } else if (user.gender == "FEMALE") {
                  female.push(user.callName);
               } else {
                  unknown.push(user.callName);
               }
            } else {
               unknown.push(el.callName);
            }
         });

         output.push("<i class='icon ion-male'></i> " + male.length);
         output.push("<i class='icon ion-female'></i> " + female.length);
         if (unknown.length > 0) {
            output.push("<i class='icon ion-help'></i> " + unknown.length);
         }
         return "(" + output.join(", ") + ")";
      };

      $scope.$on('$ionicView.beforeEnter', function() {
         $scope.refresh();
      });

      $scope.buttonAttendance = function(status) {
         if (status == $scope.myAttendance.preStatus) {
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
            preDescription: $scope.myAttendance.preDescription
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
            $scope.myAttendance = ServerAPI.userAttendanceOnEvent($scope.event);
         }, {
            eventId: $stateParams.eventId
         });
      };

      $scope.renderHtml = function(html_code) {
         return $sce.trustAsHtml(html_code);
      };
   })
   .controller("DiscussionDetailCtrl", function($scope, $ionicHistory, $filter, $localStorage, $ionicLoading, $resource, $stateParams, ListView, ServerDiscussionDetail, $sce, ServerAPI, ServerDiscussionPost) {
      $scope.showDashboard = false;
      $scope.$on('$ionicView.beforeEnter', function() {
         var history = $ionicHistory.viewHistory();
         if (angular.isDefined(history.backView) && history.backView.stateId == "tab.dashboard") {
            $scope.showDashboard = true;
         } else {
            $scope.showDashboard = false;
         }
         $scope.discussion = ListView.get("discussions", $stateParams.discussionId);
         $scope.refresh();
      });

      $scope.textareaStyle = false;

      $scope.copy = function(post) {
         $ionicLoading.show({
            template: '<ion-spinner icon="lines"></ion-spinner>',
            duration: 200
         });
         var copied = post.post;
         copied = copied.replace(/<br\/> /mg, "\n");
         copied = copied.replace(/<br\/>/mg, "\n");
         $scope.form.comment = copied + "\n";
         $scope.commentFocus = true;
      };

      $scope.form = {};
      $scope.form.comment = "";
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
         template: 'Načítám diskuzi ...'
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
            $ionicLoading.show({
               template: "Příspěvek vložen",
               duration: 900
            });
            $scope.form.comment = "";
            $scope.refresh(true);
         }, {
            discussionId: $stateParams.discussionId,
            post: {
               post: $scope.form.comment
            },
         });
      };

      $scope.dirtyNews = function() {
         $scope.$storage = $localStorage;
         $scope.$storage.totalNewPosts -= $scope.data.newPosts;
         $scope.$storage.serverNewPosts -= $scope.data.newPosts;
         var record = $filter('filter')($scope.$storage.servers, {
            url: TS.Server.url,
            user: TS.Server.user,
         }, true);
         if (record.length == 1) {
            record[0].newPosts = record[0].newPosts - $scope.data.newPosts;
         }
      };

      $scope.refresh = function(supressHide) {
         supressHide = supressHide || false;
         ServerAPI.get(ServerDiscussionDetail, function(data) {
            ListView.clear(master);
            if (supressHide === false) $ionicLoading.hide();
            $scope.data = data.data.discussion;
            $scope.dirtyNews();
            for (var i in data.data.posts) {
               if (angular.isDefined(data.data.posts[i].post)) {
                  data.data.posts[i].post = data.data.posts[i].post.stripSlashes();
                  ListView.add(master, data.data.posts[i]);
               }
            }
            $scope.posts = ListView.all(master);
         }, {
            discussionId: $stateParams.discussionId,
            page: 1
         });
      };
   });