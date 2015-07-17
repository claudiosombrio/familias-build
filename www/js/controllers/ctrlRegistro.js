controllers.controller('registroCtrl', ['$scope', '$ionicPopup', '$http', '$state',
    function ($scope, $ionicPopup, $http, $state) {
        $scope.showAlert = function (mensagem) {
            var alertPopup = $ionicPopup.alert({
                title: 'Atenção!',
                template: mensagem
            });
            alertPopup.then(function (res) {
                $scope.btnDisable(false);
            });
        };

        $scope.btnDisable = function (value) {
            $scope.btnDisabled = value;
        };

        $scope.actRegistrar = function () {
//            $state.go('sincronizacaoInicial');
//            return;

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
            if (url.substring(0, 4) !== 'http') {
                url = 'https://' + url;
            }
            url += '/rest/mobile/';

            $http.post(url + G_versao + '/' + G_id + '/registrarDispositivo?usuario='
                    + this.usuario + '&senha=' + SHA256(this.senha)).
                    success(function (data, status, headers, config) {
                        $scope.registro(url, data, status, headers, config);
                    })
                    .error(function (data, status, headers, config) {
                        $scope.error(data, status, headers, config);
                    });
        };

        $scope.error = function (data, status, headers, config) {
            $scope.showAlert('Não foi possível conectar ao servidor. Verifique se a URL informada está correta.');
        };

        $scope.registro = function (url, data, status, headers, config) {
            if (data === '105' || data === '200') {
                window.localStorage.setItem("url", url);

                $state.go('sincronizacaoInicial');
            } else {
                this.showAlert('(' + data + ') ' + headers('codeMessage'));
            }
        };
    }]);

