var TS = angular.module("tymy.services", ['ngResource']);
TS.Server = {};
TS.User = {};

TS.factory('ServerDiscussions', ['$resource', function($resource) {
  return $resource('http://:url/api/discussions/withNew');
}]);
TS.factory('ServerEvents', ['$resource', function($resource) {
  return $resource('http://:url/api/events', {
    "order": "startTime__desc"
  });
}]);
TS.factory('ServerDiscussionDetail', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/discussion/:discussionId/html/:page');
}]);
TS.factory('ServerEventDetail', ['$resource', function($resource, $stateParams) {
  return $resource('http://:url/api/event/:eventId');
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


TS.factory('ServerAPI', function($ionicLoading, $state, $http) {
  return {
    http: function(connection, callback, params) {
      var url = "http://" + TS.Server.url + "/" + connection + "?TSID=" + TS.Server.TSID;
      $ionicLoading.show({
        template: '<ion-spinner icon="circles"></ion-spinner>',
        hideOnStageChange: true
      });
      $http.post(url, params)
        .then(function(data) {
          callback(data);
        });
    },
    get: function(connection, callback, params) {
      params = params || {};
      params.TSID = TS.Server.TSID;
      params.url = TS.Server.url;
      if (angular.isUndefined(TS.Server.url)) {
        $state.go('login');
        $ionicLoading.hide();
        return;
      }
      connection.get(params, function(data) {
          callback(data);
        }, function(error) {
          $ionicLoading.show({
            template: "Error during request",
            duration: 2000
          });
          $ionicLoading.hide();
        },
        function(error) {});
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
      $ionicLoading.hide();
    }
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