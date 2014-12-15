(function () {

    var app = angular.module('cityTweetApp', ['ui.bootstrap']);

    app.controller('MapCtrl', function ($log, $scope, TweetList) {

        // initialize
        var mapOptions = {
            zoom: 13,
            center: new google.maps.LatLng(13.7278956, 100.5241235),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        
        $scope.city    = null;
        $scope.map     = new google.maps.Map(document.getElementById('map'), mapOptions);
        $scope.markers = [];

        var infoWindow = new google.maps.InfoWindow();

        // create a marker from tweet
        var createTweetMarker = function (tweet) {
            var marker = new google.maps.Marker({
                map: $scope.map,
                position: new google.maps.LatLng(tweet.latitude, tweet.longitude),
                title: tweet.screen_name,
                icon: tweet.profile_image_url
            });
            marker.content = '<div class="infoWindowContent">' + 
                    '<p>' + tweet.text + '</p>' + 
                    '<p>' + tweet.created_at + '</p>' + 
                    '</div>';

            google.maps.event.addListener(marker, 'click', function () {
                infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
                infoWindow.open($scope.map, marker);
            });

            $scope.markers.push(marker);
        };
        
        // clear all markers
        var deleteMarkers = function () {
            for (i = 0; i < $scope.markers.length; i++) {
                $scope.markers[i].setMap(null);
            };
            $scope.markers = [];
        };

        // refresh map on user submit
        $scope.refreshMap = function () {
            
            var city      = null;
            var latitude  = null;
            var longitude = null;
            var tweets    = [];
            
            var promise = TweetList.get($scope.city);
            promise.then(
                function (data) {
                    tweetList = data.data;
                    // remove previous markers
                    deleteMarkers();
                    $scope.map.setCenter(new google.maps.LatLng(tweetList.latitude, tweetList.longitude));
                    // set new markers
                    tweets = tweetList.tweets;
                    for (i = 0; i < tweets.length; i++) {
                        createTweetMarker(tweets[i]);
                    };
                },
                function (error) {
                    tweets = [];
                });
        };

        // open tooltip window
        $scope.openInfoWindow = function (e, selectedMarker) {
            e.preventDefault();
            google.maps.event.trigger(selectedMarker, 'click');
        };
        
        // event listener when a history is chosen
        $scope.$on('historyChosen', function(event, city) {
            $scope.city = city;
            $scope.refreshMap();
        });
        
        
    });

    /*** History **********************************************************************/
    
    app.controller('HistoryModalCtrl', function ($scope, $modal, $log, History) {
        $scope.items = [];
        
        $scope.open = function (size) {

            var modalInstance = $modal.open({
              templateUrl: 'myModalContent.html',
              controller: 'ModalInstanceCtrl',
              size: size,
              resolve: {
                items: function () {
                    return $scope.items;
                }
              }
            });
            
        };
    });
    
    app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, $rootScope, items, History) {
        
        // initialize $scope.items
        $scope.items = [];
        var promise = History.get();
        promise.then(
            function (data) {
                var history = data.data;
                for(var key in history) {
                    if (history.hasOwnProperty(key)) {
                        $scope.items.push(history[key]);
                    }
                }
            }
        );
        
        $scope.selected = {
          item: $scope.items[0]
        };
        
        // close modal to search by city name
        $scope.gotoCity = function(item) {
            $rootScope.$broadcast('historyChosen', item);
            $modalInstance.close();
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
    });

    /*** Entities *********************************************************************************/
    
    // service to get tweetList
    app.factory('TweetList', function ($http) {
        
        var method = 'GET';
        var url = 'http://localhost/gomeeki/test/server/web/api/tweets';
        var params = {city: null};
        
        var setParam = function (city) {
            params = {city: city};
        };

        return {
            get: function (city) {
                setParam(city);
                return $http({method: method, url: url, params: params});
            }
        };
    });
    
    // service to get history
    app.factory('History', function ($http) {
        
        var method = 'GET';
        var url = 'http://localhost/gomeeki/test/server/web/api/histories';

        return {
            get: function () {
                return $http({method: method, url: url});
            }
        };
    });
    
})();


