(function () {

    'use strict';

    const pushButton = document.querySelector('.js-push-btn');
    const messaging = firebase.messaging();

    var app = {
        accessToken: {
            accessToken: '',
            validTill: 0
        }
    };

    app.getAccessToken = function()
    {
        return new Promise(function(resolve, reject)
        {
            var now = +new Date();
            if (app.accessToken.validTill > now) {
                console.log('has this');
                resolve(app.accessToken.accessToken);
            } else {
                var req = new XMLHttpRequest();
                var urlEncodedData = "";
                var urlEncodedDataPairs = [];
                var name;
                var data = {
                    'grant_type': 'client_credentials',
                    'client_id': '1_2ow9v1mswgowsw48sk4wwsk04s0c0sgs8os8ksc8wwsok08ccw',
                    'client_secret': '2dsk4j8lqbtwckc8gg88w88gss40o400kw4c40w88c4k8c0k4w'
                };
                for(name in data) {
                    urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
                }
                urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

                // Do the usual XHR stuff
                req.open('POST', 'http://auth.codecommerce.de/oauth/v2/token');
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

                req.onload = function() {
                    // This is called even on 404 etc
                    // so check the status
                    if (req.status == 200) {
                        // Resolve the promise with the response text
                        var response = JSON.parse(req.response);
                        app.accessToken.accessToken = response.access_token;
                        app.accessToken.validTill = +new Date() + response.expires_in;
                        resolve(app.accessToken.accessToken);
                    } else {
                        // Otherwise reject with the status text
                        // which will hopefully be a meaningful error
                        reject(Error(req.statusText));
                    }
                };

                // Handle network errors
                req.onerror = function() {
                    reject(Error("Network Error"));
                };

                console.log('need this');
                // Make the request
                req.send(urlEncodedData);
            }
        });
    };


    app.sendTokenToServer = function(token)
    {
        app.sendToServer(
            { 'token': token },
            'POST',
            'https://auth.codecommerce.de/api/fcm/token'
        );

    };

    app.sendToServer = function(data, method, url, success, error)
    {
        app.getAccessToken()
            .then(function(accessToken) {
                var XHR = new XMLHttpRequest();
                var urlEncodedData = "";
                var urlEncodedDataPairs = [];
                var name;
                for(name in data) {
                    urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
                }
                urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

                if (typeof success != 'undefined' && success) {
                    XHR.addEventListener('load', success);
                }

                if (typeof error != 'undefined' && error) {
                    XHR.addEventListener('error', error);
                }

                XHR.open(method, url);
                XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                XHR.setRequestHeader("Authorization", "Bearer " + accessToken);

                XHR.send(urlEncodedData);
            });

    };


    messaging.requestPermission()
        .then(function () {
            console.log('Notification permission granted.');
            // TODO(developer): Retrieve an Instance ID token for use with FCM.
            // ...
        })
        .catch(function (err) {
            console.log('Unable to get permission to notify.', err);
        });

    messaging.getToken()
        .then(function (currentToken) {
            if (currentToken) {
                isSubscribed = true;
                console.log(currentToken);
                app.sendTokenToServer(currentToken);
                //updateUIForPushEnabled(currentToken);
            } else {
                // Show permission request.
                console.log('No Instance ID token available. Request permission to generate one.');
                // Show permission UI.
                //updateUIForPushPermissionRequired();
                //setTokenSentToServer(false);
            }
        })
        .catch(function (err) {
            console.log('An error occurred while retrieving token. ', err);
            showToken('Error retrieving Instance ID token. ', err);
            setTokenSentToServer(false);
        });

    messaging.onTokenRefresh(function() {
        messaging.getToken()
            .then(function(refreshedToken) {
                console.log('Token refreshed.');
                // Indicate that the new Instance ID token has not yet been sent to the
                // app server.
                setTokenSentToServer(false);
                // Send Instance ID token to app server.
                sendTokenToServer(refreshedToken);
                // ...
            })
            .catch(function(err) {
                console.log('Unable to retrieve refreshed token ', err);
                showToken('Unable to retrieve refreshed token ', err);
            });
    });

    let isSubscribed = false;
    let swRegistration = null;



    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push is supported');

        navigator.serviceWorker.register('service-worker.js')
            .then(function (swReg) {
                console.log('Service Worker is registered', swReg);
                swRegistration = swReg;
                messaging.useServiceWorker(swRegistration);
                //initializeUI();
            })
            .catch(function (error) {
                console.error('Service Worker Error', error);
            });
    } else {
        console.warn('Push messaging is not supported');
        pushButton.textContent = 'Push Not Supported';
    }



})();
