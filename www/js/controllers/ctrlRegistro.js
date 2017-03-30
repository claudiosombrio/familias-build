controllers.controller('registroCtrl', ['$scope', '$ionicPopup', '$http', '$state',
    function($scope, $ionicPopup, $http, $state) {

        if (window.localStorage.principal) {
            var principal = atob(window.localStorage.principal);
            $scope.usuario = principal.split(':')[0];
            $scope.senha = principal.split(':')[1];
            $scope.url = window.localStorage.getItem("lastUrl");
            $scope.ressincronia = true;
        }

        $scope.showAlert = function(mensagem) {
            var alertPopup = $ionicPopup.alert({
                title: 'Atenção!',
                template: mensagem
            });
            alertPopup.then(function(res) {
                $scope.btnDisable(false);
            });
        };

        $scope.btnDisable = function(value) {
            $scope.btnDisabled = value;
        };

        $scope.actRegistrar = function(isSync) {

            $scope.btnDisable(true);
            if (!this.url || this.url === '') {
                $scope.showAlert('Informe a URL');
                return;
            }
            if (!this.usuario || this.usuario === '') {
                $scope.showAlert('Informe o Usuário');
                return;
            }
            if (!this.senha || this.senha === '') {
                $scope.showAlert('Informe a Senha');
                return;
            }

            var url = this.url;
            window.localStorage.setItem("lastUrl", this.url);
            if (url.substring(0, 4) !== 'http') {
                url = 'https://' + url;
            }
            url += '/rest/mobile/';
            window.localStorage.setItem('isSync', isSync);

            $http.post(url + G_versao + '/' + G_id + '/registrarDispositivo?usuario=' + this.usuario + '&senha=' + SHA256(this.senha)).
            success(function(data, status, headers, config) {
                    $scope.registro(url, data, status, headers, config);
                    window.localStorage.codigoProfissional = headers('codigoProfissional');
                    if (headers('params')) {
                        window.localStorage.filtrarPor = headers('params');
                    }
                })
                .error(function(data, status, headers, config) {
                    $scope.error(data, status, headers, config);
                });
        };

        $scope.error = function(data, status, headers, config) {
            $scope.showAlert('Não foi possível conectar ao servidor. Verifique se a URL informada está correta.');
        };

        $scope.registro = function(url, data, status, headers, config) {
            if (data === '105' || data === '200') {
                window.localStorage.setItem("url", url);

                $state.go('sincronizacaoInicial');
            } else {
                this.showAlert('(' + data + ') ' + headers('codeMessage'));
            }
        };
    }
]);