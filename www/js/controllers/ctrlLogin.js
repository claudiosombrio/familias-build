controllers.controller('loginCtrl', ['$scope', '$ionicPopup', '$state', 'DB', '$ionicViewService',
    function ($scope, $ionicPopup, $state, DB, $ionicViewService) {
        
        window.localStorage.removeItem("usuarioLogado");
        $ionicViewService.clearHistory();
        
        $scope.showAlert = function (mensagem) {
            var alertPopup = $ionicPopup.alert({
                title: 'Atenção!',
                template: mensagem
            });
            alertPopup.then(function (res) {
            });
        };

        $scope.actAutenticar = function(){
            if (!this.usuario || this.usuario === '') {
                $scope.showAlert('Informe o Usuário');
                return;
            }
            if (!this.senha || this.senha === '') {
                $scope.showAlert('Informe a Senha');
                return;
            }
            DB.query("SELECT u.codigoSistema, u.id, u.nome, u.nivel FROM usuarios u WHERE status = ? AND login = ? AND senha = ?", ["A",this.usuario, SHA256(this.senha)])
                .then(function(result){
                    var usuario = DB.fetch(result);
                    if(usuario && !isNaN(usuario.id)){
                        window.localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
                        
                        $state.go('menu');
                    }else{
                        $scope.showAlert('Usuário ou Senha inválidos.');
                    }
                }, function(error){
                    $scope.showAlert('Erro: '+error.message);
                });
        };
        
    }]);

