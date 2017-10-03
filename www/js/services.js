var TS = angular.module("tymy.services", ['ngResource']);

function parseHtmlEnteties(str) {
    if (str.length > 0) {
        return str.replace(/&#([0-9]{1,3});/gi, function(match, numStr) {
            var num = parseInt(numStr, 10); // read num as normal number
            return String.fromCharCode(num);
        });
    } else {
        return str;
    }
}

function deBB(post) {
    post = post.replace(/\[url(=(.*?))?\](.*?)\[\/url\]/gi, function (match, _, url, text) {
        url = (typeof url === "undefined") ? text : url;
        return '<a href="' + url + '">' + text + '</a>';
    });
    post = post.replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, function (match, color, text) {
        return '<span style="color:' + color + ';">' + text + '</a>';
    });
    post = post.replace(/\[size=(.*?)\](.*?)\[\/size\]/gi, function (match, size, text) {
        return '<span style="size:' + size + 'px;">' + text + '</a>';
    });
    post = post.replace(/\[b\](.*?)\[\/b\]/gi, function (match, text) {
        return '<b>' + text + '</b>';
    });
    return post;
}

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
    return $resource('http://:url/api/discussion/:discussionId/html/:page?search=:search');
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
TS.factory('ServerUserDetail', ['$resource', function($resource, $stateParams) {
    return $resource('http://:url/api/user/:userId');
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

TS.factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork, $translate, Toast) {
    return {
        isOnline: function() {
            if (ionic.Platform.isWebView()) {
                return $cordovaNetwork.isOnline();
            } else {
                return navigator.onLine;
            }
        },
        ifOffline: function() {
            if (ionic.Platform.isWebView()) {
                return !$cordovaNetwork.isOnline();
            } else {
                return !navigator.onLine;
            }
        },
        isOffline: function() {
            $translate("error.offline").then(function(string) {
                Toast.show(string);
            });
        }
    }
});


TS.factory('ServerAPI', function($ionicLoading, $translate, Toast, $state, $http, $filter, ServerLogin, $ionicPlatform, $ionicPopup) {
    var wrapperFunction = {
        get: function(connection, callback, params) {
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
                        // neznama chyba, takze jdeme rovnou na prihlasovaci obrazovku
                        $ionicLoading.hide();
                        $state.$go("login");
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
                    } else if (error.status == "401") {
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
                }, function(response) {
                    $ionicLoading.hide();
                    $translate("attendance.error").then(function(string) {
                        Toast.show(string);
                    });
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
            if (angular.isUndefined(data[master])) {
                data[master] = [];
            }
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

TS.factory('Toast', function($sce, $rootScope, $ionicLoading, $timeout, $ionicPopup, $cordovaToast) {
    return {
        show: function(message, duration, position) {
            message = message || "Connection error";
            duration = duration || 'short';
            position = position || 'bottom';

            message = parseHtmlEnteties(message);
            $ionicLoading.hide();

            if (!!window.cordova) {
                $cordovaToast.show(message, duration, position);
            } else {
                if (duration == 'short') {
                    duration = 2000;
                } else {
                    duration = 5000;
                }

                var myPopup = $ionicPopup.show({
                    template: "<div class='toast'>" + message + "</div>",
                    scope: $rootScope,
                    buttons: []
                });

                $timeout(function() {
                    myPopup.close();
                }, duration);
            }
        }
    };
})
