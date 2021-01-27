var main_app = angular.module('OSNRegistrationApp', ['ngSocatelOAuth'])


main_app.config(function ($SocatelTwitterSettingsProvider) {
    $SocatelTwitterSettingsProvider.setRequestTokenURI('http://localhost:5000/twitter_oauth/request_token');
    $SocatelTwitterSettingsProvider.setConvertToAccessTokenURI('http://localhost:5000/twitter_oauth/convert_to_access_token/');
});

main_app.controller('MainController', ['$scope', 'SocatelOSNTwitter', function($scope, SocatelOSNTwitter){
    $scope.osnData = {
        TwitterAccountName : null,
        TwitterAccountDescription: null,
        TwitterOAuthData: null
    }

    $scope.submitFunc = function(){
        alert("Submit Function wil have to save data to the backend")
    }


    // or.....

    SocatelOSNTwitter
        .obtain_token()
        .then(function(resp){
            $scope.osnData['TwitterOAuthData'] = resp.data;
            $scope.osnData['TwitterAccountName'] = resp.data.screen_name;
        }, function(error){
            console.log(error)
        })        
}])