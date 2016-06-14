var app = angular.module('appointmentapp', ['ngRoute', 'ngMaterial', 'ngStorage']);

app.config(function($routeProvider) {
    $routeProvider
    
    .when('/', {
        templateUrl: 'templates/Login.html',
        controller: 'LoginCtrl'
    })
    
    .when('/forgot', {
        templateUrl: 'templates/Reset.html',
        controller: 'ResetCtrl'
    })
    
    .when('/home', {
        templateUrl: 'templates/Home.html',
        controller: 'HomeCtrl'
    })
    
    .when('/reserve', {
        templateUrl: 'templates/Reserve.html',
        controller: 'ReserveCtrl'
    })
    
    .when('/reserve/:rid', {
        templateUrl: 'templates/Schedules.html',
        controller: 'ScheduleCtrl'
    })
    
    .when('/logout', {
        templateUrl: 'templates/Logout.html',
        controller: 'LogoutCtrl'
    })
    
    .when('/video', {
        templateUrl: 'templates/Video.html',
        controller: 'VideoCtrl'
    })
    
    .when('/presentation', {
        templateUrl: 'templates/Presentation.html',
        controller: 'PresentationCtrl'
    })
    
});

app.factory('AuthService', function($localStorage, $sessionStorage, $location) {
    var UserDetails = {};
    
    function set(data) {
        $localStorage.UserDetails = data;
    }
    
    function get() {
        return $localStorage.UserDetails;
    }
    
    function checkUser() {
        if($localStorage.UserDetails) {
            return 1;
        } else {
            $location.path('/');
        }
    }
    
    function logout() {
        delete $localStorage.UserDetails;
    }
    
    return {
        set: set,
        get: get,
        checkUser: checkUser,
        logout: logout
    }
});

app.controller('LoginCtrl', function($scope, $rootScope, AuthService, $http, $location) {
    AuthService.checkUser();
    console.log($scope.user);
    $scope.validateLogin = function(credentials) {
        $scope.loading = true;
        $http({
            method: 'POST',
            url: 'backend-url/auth',
            data: JSON.stringify({
                email: credentials.username,
                password: credentials.password 
            }),
            contentType: "application/json"
        }).success(function(auth) {
            $scope.loading = false;
            if(auth.result=="OK") {
                var userDetails = {
                    email: credentials.username,
                    fullname: auth.fullname,
                    isAdmin: auth.isAdmin
                };
                
                AuthService.set(userDetails);
                $location.path('home');
                
            } else if(auth.result=="MAXIMUM") {
                //Maximum attempts exceeded
                $scope.maximumAttempts = true;
                $scope.credentials.username = "";
                $scope.credentials.password = "";
            } else {
                //Invalid Login Credentials
                $scope.invalid = true;
                $scope.credentials.password = "";
            }
        })
    }
});

app.controller('ResetCtrl', function($scope, $rootScope, AuthService, $http, $location) {
    
    
    $scope.forgotPass = function(credentials) {
        $scope.loading = true;
        $scope.invalid = false;
        $scope.email = credentials.username;
        $http({
            method: 'GET',
            url: 'backend-url/auth/reset?email='+credentials.username+"@mail.umkc.edu"
        }).success(function(response){
            $scope.loading = false;
            if(response.result=="OK") {
                $scope.showoptions = true;
                $scope.response = response;
            } else {
                $scope.invalid = true;
            }
        })
    }
    
    $scope.recoverAccount = function(answer) {
        $scope.loading = true;
        $http({
            method:'GET',
            url: 'backend-url/auth/sendPass?email='+$scope.email+'@mail.umkc.edu&answer='+answer
        }).success(function(response) {
            $scope.loading = false;
            if(response=="OK") {
                $scope.showoptions=false;
                $scope.showpassword=true;
                $scope.response = response;
            } else {
                $scope.invalid = true;
                $scope.showoptions = false;
            }
        })
    }
});

app.controller('HomeCtrl', function($scope, $http, AuthService) {
    AuthService.checkUser()
    $scope.user = AuthService.get();    
    console.log($scope.user);
    $scope.status = [];
    $scope.sclass = [];
    $scope.init = function() {
        $scope.loading = true;
        if($scope.user.isAdmin==1) {
            $scope.admin = true;
            $http({
                method: 'GET',
                url: 'backend-url/pending'
            }).success(function(response) {
                $scope.loading = false;
                $scope.response = response;
            })
        } else {
            $scope.normalUser = true;
            $http({
                method: 'GET',
                url: 'backend-url/reservations?email='+$scope.user.email
            }).success(function(response) {
                $scope.loading = false;
                $scope.response = response;
                for(i=0;i<response.length;i++) {
                    if(response[i].status=="1") {
                        $scope.status.push("Approved");
                        $scope.sclass.push("success");
                    } else if(response[i].status=="-1") {
                        $scope.status.push("Rejected");
                        $scope.sclass.push("danger");
                    } else {
                        $scope.status.push("Awaiting Approval");
                        $scope.sclass.push("info");
                    }
                }
            })
        }
    }
    
    if($scope.user.isAdmin==1) {
        $scope.approveReservation = function(id) {
            $http({
                method: 'GET',
                url: 'backend-url/approverequest?id='+id
            }).success(function(response) {
                $scope.showStatus = true;
                $scope.word = "approved";
                $scope.class = "info";
                $scope.curId = id;
                $scope.init();
            })
        }
        
        $scope.rejectReservation = function(id) {
            $http({
                method: 'GET',
                url: 'backend-url/rejectrequest?id='+id
            }).success(function(response) {
                $scope.showStatus = true;
                $scope.word = "rejected";
                $scope.class = "danger";
                $scope.curId = id;
                $scope.init();
            })
        }
    }
    
});

app.controller('ReserveCtrl', function($scope, $http, AuthService) {
    AuthService.checkUser()
    $scope.user = AuthService.get();
    
    $scope.init = function() {
        $scope.loading = true;
        $http({
            method: 'GET',
            url: 'backend-url/rooms'
        }).success(function(data) {
            $scope.response = data;
            $scope.loading = false;
        });
    };
});

app.controller('ScheduleCtrl', function($scope, $http, $routeParams, AuthService) {
    AuthService.checkUser()
    $scope.user = AuthService.get();

    $scope.rid = $routeParams.rid;
    
    $scope.myDate = new Date();
    $scope.minDate = new Date(
          $scope.myDate.getFullYear(),
          $scope.myDate.getMonth(),
          $scope.myDate.getDate());
      $scope.maxDate = new Date(
          $scope.myDate.getFullYear(),
          $scope.myDate.getMonth() + 1,
          $scope.myDate.getDate());    
    
    $scope.init = function() {
        $scope.notAvailable = false;
        $scope.availability = false;    
        
        $http({
            method: 'GET',
            url: 'backend-url/checkroom?rid='+$scope.rid
        }).success(function(data) {
            if(data=="OK") {
                
                //Show Schedules
                
            } else {
                $scope.showErr = true;
            }
        })
    };
    
    $scope.checkAvailability = function(time) {
        var appdate = $scope.myDate.toString();
        $scope.apptime = time;
        $scope.appdate = appdate.substr(0,15);
        $scope.appdetails = 'Room '+$scope.rid+' '+appdate.substr(0,15)+" "+time;
        $scope.notAvailable = false;
        $scope.availability = false;
        $scope.loading = true;
        $scope.appointmentConfirmation = false;
        
        $http({
            method: 'GET',
            url: 'backend-url/checkavailability?details='+$scope.appdetails
        }).success(function(data){
            $scope.loading = false;
            if(data.result=="OK") {
                $scope.showDetails = true;
                $scope.availability = true;
            } else {
                $scope.showDetails = true;
                $scope.notAvailable = true;
            }
        })
        
    };
    
    $scope.reserveAppointment = function() {
        $scope.loading = true;
        $scope.showDetails = false;
        $http({
            method: 'POST',
            url: 'backend-url/newreservation',
            data: JSON.stringify({
                appointment_details: $scope.appdetails,
                user: $scope.user.email,
                status: 0
            }),
            contentType: "application/json"
        }).success(function(data) {
            $scope.loading = false;
            if(data.result=="OK") {
                $scope.appointmentConfirmation = true;
            }
        }).error(function() {
            $scope.loading = false;
            console.log("Unknown error!!");
        })
    }
});

app.controller('LogoutCtrl', function($scope, AuthService, $location) {
    
        AuthService.logout();
        $location.path('/');
    
});