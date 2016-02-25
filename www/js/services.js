var TS = angular.module("tymy.services", ['ngResource']);
TS.Server = {
  fullUrl: function() {
    return "http://" + this.url;
  },

  setTeam: function(data) {
    for (var i in data)
      this[i] = data[i];
  }
};
TS.User = {};

TS.factory('ServerDiscussions', ['$resource', function($resource) {
  return $resource('http://:url/api/discussions/withNew');
}]);
TS.factory('ServerEvents', ['$resource', function($resource) {
  return $resource('http://:url/api/events/withMyAttendance', {
    "order": "startTime__desc",
    "limit": 50
  });
}]);
TS.factory('ServerDiscussionDetail', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/discussion/:discussionId/html/:page');
}]);
TS.factory('ServerEventDetail', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/event/:eventId');
}]);
TS.factory('ServerEventTypes', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/eventTypes/');
}]);
TS.factory('ServerUsers', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/users/');
}]);
TS.factory('ServerDiscussionPost', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/discussion/:discussionId/post');
}]);
TS.factory('ServerAttendance', ['$http', function($http, $stateParams) {
  return "api/attendance";
}]);
TS.factory('ServerLogin', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/login/:user/:password');
}]);



TS.factory('ServerAPI', function($ionicLoading, $state, $http, $filter, ServerLogin, $ionicPlatform, $ionicPopup) {
  var wrapperFunction = {
    get: function(connection, callback, params) {
      $ionicPlatform.ready(function() {
        if (window.Connection) {
          if (navigator.connection.type == Connection.NONE) {
            $ionicPopup.alert({
                title: "Internet Disconnected",
                content: "The internet is disconnected on your device."
              })
              .then(function(result) {
                if (!result) {
                  ionic.Platform.exitApp();
                }
              });
          }
        }
      });

      params = params || {};
      params.TSID = TS.Server.TSID;
      params.url = TS.Server.url;
      if (angular.isUndefined(TS.Server.url)) {
        $state.go('start.login');
        $ionicLoading.hide();
        return;
      }
      connection.get(params, function(data) {
          if (data.status == "OK") {
            callback(data);
          } else {
            if (data.statusMessage == "Not loggged in") {
              // pokusit se znovu prihlasit, pravdepodobne vyprselo TSID
              var loginData = {
                url: TS.Server.url,
                user: TS.Server.user,
                password: TS.Server.password,
              };
              ServerLogin.get(loginData, function(data) {
                if (data.status == "OK") {
                  // obnovene TSID
                  TS.Server.TSID = data.sessionKey;
                  wrapperFunction.get(connection, callback, params);
                } else {
                  // je to uplne spatny, zpet na login
                  $state.$go("login");
                }
              });
            } else {
              // neznama chyba, takze jdeme rovnou na prihlasovaci obrazovku
              $ionicLoading.hide();
              $state.$go("login");
            }
          }
        },
        function(error) {
          if (error.status == "404") {
            $ionicLoading.show({
              template: "Neznámá adresa " + TS.Server.url + "<br />Podporovány jsou zatím pouze týmy na placeném serveru.",
              duration: 3000
            });
          } else if (error.status == "0") {
            $ionicLoading.show({
              template: "Nezdařilo se připojení k internetu",
              duration: 3000
            });
          } else {
            $ionicLoading.show({
              template: error.statusText,
              duration: 3000
            });
          }
        }
      );
    },
    http: function(connection, callback, params) {
      var url = TS.Server.fullUrl() + "/" + connection + "?TSID=" + TS.Server.TSID;
      $ionicLoading.show({
        template: '<ion-spinner icon="circles"></ion-spinner>',
        hideOnStageChange: true
      });
      $http.post(url, params)
        .then(function(data) {
          callback(data);
        });
    },
    save: function(connection, callback, params) {
      params.TSID = TS.Server.TSID;
      params.url = TS.Server.url;
      var Request = new connection();

      if (angular.isDefined(params.post)) {
        for (var i in params.post) {
          Request[i] = params.post[i];
        }
        delete params.post;
      }

      Request.$save(params, function(data) {
        callback(data);
      });
    }
  };

  return {
    detectEventType: function(event) {
      EventType = $filter('filter')(TS.Server.EventTypes, {
        code: event.type
      }, true);
      if (angular.isUndefined(EventType)) return false;
      return EventType[0];
    },
    humanAttendance: function(event) {
      if (angular.isDefined(event.myAttendance)) {
        EventType = this.detectEventType(event);

        Caption = $filter('filter')(EventType.preStatusSet, {
          code: event.myAttendance.preStatus
        }, true);
        if (angular.isUndefined(Caption)) return false;
        return Caption[0].caption;
      }
    },
    userAttendanceOnEvent: function(event) {
      var attendance = $filter('filter')(event.attendance, {
        userId: TS.User.id
      }, true);
      if (angular.isUndefined(attendance[0].preDescription)) {
        attendance[0].preDescription = "";
      }
      return attendance[0];
    },
    http: wrapperFunction.http,
    get: wrapperFunction.get,
    save: wrapperFunction.save
  };
});



TS.factory("ListView", [function($resource) {
  var data = {};
  return {
    clearAll: function() {
      data = {};
    },
    clear: function(master) {
      data[master] = [];
    },
    add: function(master, value) {
      data[master].push(value);
    },
    all: function(master) {
      return data[master];
    },
    get: function(master, id) {
      if (typeof data[master] === "undefined") {
        return null;
      }
      var search = data[master];
      for (var i = 0; i < search.length; i++) {
        if (search[i].id === parseInt(id)) {
          return search[i];
        }
      }
      return null;
    }
  };
}]);