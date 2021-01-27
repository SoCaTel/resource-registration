var socatel_osn_oauth = angular.module('ngSocatelOAuth', [])

socatel_osn_oauth.provider('$SocatelTwitterSettings', function () {
    var request_token_uri = 'http://localhost:5000/twitter_oauth/request_token';
    var twitter_oauth_authenticate = 'https://api.twitter.com/oauth/authenticate';
    var convert_to_access_token_uri = 'http://localhost:5000/twitter_oauth/convert_to_access_token/';

    this.setRequestTokenURI = function(v){
        request_token_uri = v;
    }

    this.setConvertToAccessTokenURI = function(v){
        convert_to_access_token_uri = v;
    }

    this.$get = function () {
        return {       
            request_token_uri: request_token_uri,
            twitter_oauth_authenticate: twitter_oauth_authenticate,
            convert_to_access_token_uri: convert_to_access_token_uri
        };       
    }   
});

socatel_osn_oauth.service('SocatelOSNPopup', ['$interval', '$window', '$q', function($interval, $window, $q) {
    // Minified Implementation of satellizer.js and customized to our needs
    // Initialization
    var SocatelOSNPopup = this;
    SocatelOSNPopup.$interval = $interval;
    SocatelOSNPopup.$window = $window;
    SocatelOSNPopup.$q = $q;
    SocatelOSNPopup.popup = null;

    SocatelOSNPopup.stringifyOptions = function (options) {
        var parts = [];
        angular.forEach(options, function (value, key) {
            parts.push(key + '=' + value);
        });
        return parts.join(',');
    };

    SocatelOSNPopup.open = function (url, name, popupOptions) {
        var width = popupOptions.width || 500;
        var height = popupOptions.height || 500;

        var options = this.stringifyOptions({
            width: width,
            height: height,
            top: this.$window.screenY + ((this.$window.outerHeight - height) / 2.5),
            left: this.$window.screenX + ((this.$window.outerWidth - width) / 2)
        });

        var popupName =  name;

        this.popup = this.$window.open(url, popupName, options);
        if (this.popup && this.popup.focus) {
            this.popup.focus();
        }
        return this.polling();
    };

    SocatelOSNPopup.polling = function () {
        var _this = this;

        return this.$q(function (resolve, reject) {
            var polling = _this.$interval(function () {
                if (!_this.popup || _this.popup.closed || _this.popup.closed === undefined) {
                    _this.$interval.cancel(polling);
                    resolve('Proceed');
                }
            }, 500);
        });
    };

    return SocatelOSNPopup;
}]);

socatel_osn_oauth.service('SocatelOSNTwitter', ['$http', '$SocatelTwitterSettings', 'SocatelOSNPopup', function($http, $SocatelTwitterSettings, SocatelOSNPopup){
    var SocatelOSNTwitter = this;
    SocatelOSNTwitter.request_token_uri = null;
    SocatelOSNTwitter.twitter_oauth_authenticate = null;
    SocatelOSNTwitter.convert_to_access_token_uri = null;
    SocatelOSNTwitter.oauth_token = null;

    /**
     * This is the first 
     */
    SocatelOSNTwitter.obtain_token = function() { // Step 1
        SocatelOSNTwitter.request_token_uri = $SocatelTwitterSettings.request_token_uri;
        SocatelOSNTwitter.twitter_oauth_authenticate = $SocatelTwitterSettings.twitter_oauth_authenticate;
        SocatelOSNTwitter.convert_to_access_token_uri = $SocatelTwitterSettings.convert_to_access_token_uri;
        
        return $http.get(SocatelOSNTwitter.request_token_uri)
            .then(request_token_success, request_failed);
    }

    var request_token_success = function(resp){ //Step 3
        SocatelOSNTwitter.oauth_token = resp.data.oauth_token;
        var url = SocatelOSNTwitter.twitter_oauth_authenticate + '?oauth_token=' + SocatelOSNTwitter.oauth_token;
        var name = 'Twitter OAuth Token';
        var popupOptions = { width: 400, height: 500, location: true };
        
        return SocatelOSNPopup
            .open(url, name, popupOptions)
            .then(convert_to_access_token_success, request_failed);
    }

    var convert_to_access_token_success = function(resp) {
        return $http.get(SocatelOSNTwitter.convert_to_access_token_uri + SocatelOSNTwitter.oauth_token);
    }

    // Promises that result to an error
    var request_failed = function(fail) {
        throw fail;
    }

    return SocatelOSNTwitter;
}]);

socatel_osn_oauth.directive('twitterForm', ['SocatelOSNTwitter', function(SocatelOSNTwitter){
    return {
        restrict: 'E',
        replace : true,
        //templateUrl : "../socatel-oauth/form.html",
        template: 
                    '<div class="wrapper wrapper--w680">' + 
                        '<div class="card card-4"> ' +
                            '<div class="card-body"> '+
                                '<h2 class="title">Twitter Authorization</h2> ' + 
                                '<form>' +
                                    '<div class="input-group">' +
                                        '<label class="label">Twitter Screen Name</label>' +
                                        '<div class="input-group-icon">' +
                                            '<input ng-model="osnData.TwitterAccountName" class="input--style-4"  name="account_name">' +
                                        '</div>' +
                                    '</div>'+
                                    '<div class="input-group">' +
                                        '<label class="label">Twitter Account Description</label>'+
                                        '<div class="input-group-icon">' +
                                            '<input ng-model="osnData.TwitterAccountDescription" class="input--style-4"  name="account_description">'+
                                        '</div>' +
                                    '</div> ' +
                                    '<div ng-if="osnData.TwitterOAuthData != undefined">' + 
                                        '<div  class="input-group">' + 
                                                '<label class="label">User Id</label>' + 
                                                '<div class="input-group-icon">' +
                                                    '<input ng-model="osnData.TwitterOAuthData.user_id" class="input--style-4"  name="user_id">' +
                                                '</div>' +
                                        '</div>' +
                                        '<div  class="input-group">' +
                                                '<label class="label">OAuth Token</label>' + 
                                                '<div class="input-group-icon">' +
                                                    '<input ng-model="osnData.TwitterOAuthData.oauth_token" class="input--style-4"  name="oauth_token">' +
                                                '</div>' +
                                        '</div> ' +
                                        '<div class="input-group">' +
                                                '<label class="label">OAuth Token Secret</label>' +
                                                '<div class="input-group-icon">' +
                                                    '<input ng-model="osnData.TwitterOAuthData.oauth_token_secret" class="input--style-4"  name="oauth_token_secret">' +
                                                '</div>'+
                                        '</div>' +
                                    '</div>'+
                                    '<div class="p-t-15">' +
                                        '<button class="btn btn--radius-2 btn--blue" type="submit" ng-click="submitFunc()">Submit</button>' +
                                    '</div>' +
                                    '<div class="p-t-15">' +
                                            '<button class="btn btn--radius-2 btn--blue" type="submit" ng-enabled="buttonEnabled" ng-click="SignInWithTwitter()">SignIn with Twitter</button>' +
                                    '</div>' +
                                '</form>' +
                            '</div>' +
                        '</div>' +
                    '</div>' + 
        '',
        scope: {           
            osnData: "=",
            submitFunc: "&"
        },
        controller : ['$scope', 'SocatelOSNTwitter', function($scope, SocatelOSNTwitter) {            
            $scope.SignInWithTwitter = function() {                                     
                SocatelOSNTwitter
                    .obtain_token()
                    .then(function(resp){
                        $scope.osnData['TwitterOAuthData'] = resp.data;
                        $scope.osnData['TwitterAccountName'] = resp.data.screen_name;
                        $scope.buttonEnabled = true;
                    }, function(error){
                        $scope.data = error;
                        console.log(error);
                        $scope.buttonEnabled = true;
                    })
            }
        }]
    }
}]);

 