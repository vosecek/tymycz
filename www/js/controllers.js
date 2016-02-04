String.prototype.stripSlashes = function() {
  return this.replace(/\\(.)/mg, "$1");
};
angular.module('tymy.controllers', [])
  .controller('LoginCtrl', function($scope, md5, $stateParams, $ionicLoading, ServerLogin, ServerAPI, $state, $localStorage, $filter, $timeout) {

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

      TS.Server.oldUrl = false;
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
        TS.Server.callName = loginData.callName;
        TS.Server.code = loginData.code;
        TS.Server.url = loginData.url;
        TS.Server.user = loginData.user;
        TS.Server.password = loginData.password;
      }

      ServerLogin.get(loginData, function(data) {
        if (data.status == "OK") {
          loginData.url = loginData.url;
          if ($scope.data.saveAccess === true) {
            $scope.$storage = $localStorage;
            if (angular.isUndefined($scope.$storage.servers)) {
              $scope.$storage.servers = [];
            }
            var record = $filter('filter')($scope.$storage.servers, {
              url: loginData.url
            }, true);

            if (record.length === 0) {
              $scope.$storage.servers.push(loginData);
              $ionicLoading.show({
                template: "Nový tým uložen, v nastavení týmů můžeš provést další úpravy"
              });
              newTeam = true;
            }
          }

          data.data.pictureUrl = "http://" + TS.Server.url + data.data.pictureUrl;
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
        $state.go('login');
        $ionicLoading.hide();
      });
    };
  })
  .controller('MyTeamsCtrl', function(md5, $ionicLoading, $scope, $filter, $localStorage, $ionicModal) {
    $scope.ServerUrl = TS.Server.url;
    $scope.$on('$ionicView.beforeEnter', function() {
      if (TS.Server.url != $scope.ServerUrl) {
        $scope.ServerUrl = TS.Server.url;
        $scope.doRefresh();
      }
    });

    $scope.dropTeam = function(server) {
      $scope.$storage = $localStorage;
      var record = $filter('filter')($scope.$storage.servers, {
        url: server.url
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
        template: "Data updated",
        duration: 2000
      });
      var record = $filter('filter')($localStorage.servers, {
        url: $scope.data.url
      }, true);
      record[0].callName = $scope.data.callName;
      record[0].user = $scope.data.user;
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
  })
  .controller('MenuCtrl', function($scope, $timeout, ListView, $rootScope, $ionicLoading, ServerLogin, $localStorage, $state, $location, $ionicSideMenuDelegate, $ionicHistory, $ionicPlatform) {
    $scope.$on('$ionicView.beforeEnter', function() {
      $scope.servers = $localStorage.servers;
      $scope.data = TS.User;
      $scope.data.serverCallName = TS.Server.callName;
    });

    $scope.setClass = function(server) {
      if (server.url == TS.Server.url) {
        return "balanced";
      }
      return false;
    };

    $scope.logout = function() {

      $ionicLoading.show({
        template: "Logging out"
      });
      $timeout(function() {
        $state.go('login');
        $ionicLoading.hide();
      }, 1000);
    };

    $scope.switch = function(team) {
      TS.Server.oldUrl = TS.Server.url;
      TS.Server.url = team.url;
      TS.Server.user = team.user;
      TS.Server.password = team.password;
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
          data.data.pictureUrl = "http://" + TS.Server.url + data.data.pictureUrl;
          TS.User = data.data;
          TS.Server.TSID = data.sessionKey;
          $ionicLoading.hide();
          ListView.clearAll();

          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go('menu.dashboard', {}, {
            reload: true
          });
          $ionicSideMenuDelegate.toggleRight();
          $ionicHistory.clearHistory();
          $ionicHistory.clearCache();
        } else {
          $ionicLoading.show({
            template: data.statusMessage,
            duration: 2000
          });
          $state.go('login');
        }
      }, function(error) {
        $state.go('login');
        $ionicLoading.hide();
      });
    };
  })
  .controller('DashboardCtrl', function($scope, $ionicHistory, $state, ListView, ServerAPI, ServerDiscussions, ServerEvents, $ionicLoading) {
    $scope.ServerUrl = TS.Server.url;

    $scope.$on('$ionicView.beforeEnter', function() {
      if (TS.Server.url != $scope.ServerUrl) {
        $scope.ServerUrl = TS.Server.url;
        $scope.doRefresh();
      }
    });

    $scope.go = function(target) {
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go(target);
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
      ServerAPI.get(ServerEvents, function(data) {
        ListView.clear(events);
        $ionicLoading.counter--;
        if ($ionicLoading.counter === 0) {
          $ionicLoading.hide();
        }
        for (var i in data.data) {
          ListView.add(events, data.data[i]);
        }

        $scope.events = ListView.all(events);
      });
    };

    $scope.doRefresh = function() {
      $scope.refreshEvents();
      $scope.refreshDiscussions();
      $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.doRefresh();
  })
  .controller('DiscussionsCtrl', function($scope, ListView, ServerDiscussions, ServerAPI, $ionicLoading) {
    $scope.ServerUrl = TS.Server.url;
    $scope.$on('$ionicView.beforeEnter', function() {
      if (TS.Server.url != $scope.ServerUrl) {
        $scope.ServerUrl = TS.Server.url;
        $scope.doRefresh();
      }
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
          ListView.add(master, data.data[i]);
        }
        $scope.discussions = ListView.all(master);
      });
    };

    $scope.refresh();


  })
  .controller('EventsCtrl', function($scope, ListView, ServerEvents, ServerAPI, $ionicLoading) {
    $scope.ServerUrl = TS.Server.url;
    $scope.switch = function(show) {
      $scope.show = show;
      var newData = [];
      $scope.backupEvents.filter(function(el) {
        if (el[show] === true) {
          newData.push(el);
        }
      });
      $ionicLoading.show({
        template: '<ion-spinner icon="circles"></ion-spinner>',
        duration: 250
      });
      $scope.events = newData;
    };
    $scope.$on('$ionicView.beforeEnter', function() {
      if (TS.Server.url != $scope.ServerUrl) {
        $scope.ServerUrl = TS.Server.url;
        $scope.doRefresh();
      }
    });

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
        $scope.backupEvents = $scope.events;
        $scope.switch("inFuture");
      });
    };

    $scope.doRefresh();
  })
  .controller("EventDetailCtrl", function($scope, ServerAttendance, $filter, ServerAPI, $sce, ServerEventDetail, $stateParams, ListView, $ionicLoading) {
    $scope.ServerUrl = TS.Server.url;
    $scope.$on('$ionicView.beforeEnter', function() {
      if (TS.Server.url != $scope.ServerUrl) {
        $scope.ServerUrl = TS.Server.url;
        $scope.refresh();
      }
    });

    $scope.buttonAttendance = function(status) {
      if (status == $scope.userAttendance.preStatus) {
        return "button-positive";
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
          attd.pictureUrl = "http://" + TS.Server.url + attendance.user.pictureUrl;
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
        $scope.userAttendance = $filter('filter')($scope.event.attendance, {
          userId: TS.User.id
        }, true);
        $scope.userAttendance = $scope.userAttendance[0];
      }, {
        eventId: $stateParams.eventId
      });
    };
    $scope.refresh();

    $scope.renderHtml = function(html_code) {
      return $sce.trustAsHtml(html_code);
    };
  })
  .controller("DiscussionDetailCtrl", function($scope, $ionicLoading, $resource, $stateParams, ListView, ServerDiscussionDetail, $sce, ServerAPI, ServerDiscussionPost) {
    $scope.ServerUrl = TS.Server.url;

    $scope.expandText = function() {
      var element = document.getElementById("comment");
      element.style.height = element.scrollHeight + "px";
    };

    $scope.$on('$ionicView.beforeEnter', function() {
      if (TS.Server.url != $scope.ServerUrl) {
        $scope.ServerUrl = TS.Server.url;
        $scope.doRefresh();
      }
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

    $scope.refresh = function() {
      ServerAPI.get(ServerDiscussionDetail, function(data) {
        ListView.clear(master);
        $ionicLoading.hide();
        $scope.data = data.data.discussion;
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
    $scope.refresh();
  });