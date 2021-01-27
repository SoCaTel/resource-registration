# **socatel-oauth AngularJS Module**

This is the socatel-oauth AngularJS module. It is written in AngularJS v1.7 and it is a pure AngularJS module with no dependencies at all except AngularJS. It is used for performing requests on `oauth_server` and `Twitter`, it is able to parse responses and most importantly, it implements the SignInWith Twitter functionality from a Front-End's perspective. The various components are explained next and various examples on how to use the module is provided.
  
## **Components**

### **$SocatelTwitterSettings Provider**
The $SocatelTwitterSettings provider is a very helpful provider which is preconfigured with the following parameters, which are used throughout the SignInWithTwitter process. 
```javascript
var request_token_uri = 'http://localhost:5000/twitter_oauth/request_token';
var convert_to_access_token_uri = 'http://localhost:5000/twitter_oauth/convert_to_access_token/';
```

Developers may use the following block of code for altering  the `$SocatelTwitterSettings` settings using the following. Assuming that 1) Server Address is 194.34.56.7 and the port instead of `5000` is now `5050` then the following initialization block may be used
```javascript
var my_app = angular.module('my_app', ['SocatelOSNOAuth'])
main_app.config(function ($SocatelTwitterSettingsProvider) {
    $SocatelTwitterSettingsProvider.setRequestTokenURI('http://194.34.56.7:5050/twitter_oauth/request_token');
    $SocatelTwitterSettingsProvider.setConvertToAccessTokenURI('http://194.34.56.7:5050/twitter_oauth/convert_to_access_token/');
});
```

### **SocatelOSNTwitter AngularJS Service**
Core Service of `socatel-oauth` module. Using the `obtain _token()` method, the promise created will follow the exact process defined so far (3 steps for SignInWithTwitter) and it will return all information described on oath_server
```
 * user_id
 * screen_name 
 * oauth_token
 * oauth_token_secret
```

Service can be run as a standalone request (on-demand, e.g. on-submit, ng-click, etc.) using the following block of code:

```javascript
    ...
    $scope.osnData = {
        TwitterAccountName : null,
        TwitterAccountDescription: null,
        TwitterOAuthData: null
    }

    SocatelOSNTwitter
        .obtain_token()
        .then(function(resp){
            $scope.osnData['TwitterOAuthData'] = resp.data;
            $scope.osnData['TwitterAccountName'] = resp.data.screen_name;
        }, function(error){
            //error handling
            console.log(error)
        })    
```

Developers can then handle the osnData object as desired.

### **twitterForm AngularJS Directive** 
twitterForm directive encapsulates the SocatelOSNTwitter Service and it also provides a form in which the information is
 shown upon. A button initiates the procedure and when the process is completed, the resulted information is being shown
 on the screen. Using the `submitFun` method the returned osnData can be then stored in the backend.
 The angular directive is initialized and used as follows:
```javascript
    `my_controller.js`
    ...
    $scope.osnData = {
        TwitterAccountName : null,
        TwitterAccountDescription: null,
        TwitterOAuthData: null
    }

    $scope.submitFunc = function(){
        alert("Submit Function wil have to save data to the backend")
    }
```

```html
    my_html.html
    ...
    <twitter-form form-title="OSN Entry Form" osn-data="osnData" submit-func="submitFunc()"></twitter-form>
```    
At the end of the process the `$scope.osnData` will contain all information described above

## **Contact**
If you encounter any problems, please contact the following:

[<img src="https://www.cyric.eu/wp-content/uploads/2017/04/cyric_logo_2017.svg" alt="CyRIC | Cyprus Research and Innovation Centre" width="150" />](mailto:info@cyric.eu)

## License

[Apache-2.0](../../LICENSE)
