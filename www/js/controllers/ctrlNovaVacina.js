controllers.controller('novaVacinaCtrl', ['$scope', '$state', 'DB', '$stateParams', '$ionicLoading', '$ionicModal', '$cordovaDatePicker', '$q', '$ionicPlatform', '$ionicPopup',
    function ($scope, $state, DB, $stateParams, $ionicLoading, $ionicModal, $cordovaDatePicker, $q, $ionicPlatform, $ionicPopup) {
        $ionicLoading.show({
            template: 'Carregando...'
        });

        $scope.bind = {};
        $scope.tituloPrincipal = 'Adicionar Vacinação';
        $scope.idIndividuo = $stateParams.idIndividuo;
        $scope.idDomicilio = $stateParams.idDomicilio;
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));

        $scope.acaoVoltar = function ($event) {
            $state.go('controleVacinas', {idIndividuo: $scope.idIndividuo, idDomicilio: $scope.bind.idDomicilio});
        };

        $scope.limparDataAplicacao = function(){
            $scope.bind.dataAplicacao = null;
        };
        
        $scope.changeDataAplicacao = function(){
            var options = {
                date: new Date(),
                mode: 'date'
              };
            
            $cordovaDatePicker.show(options).then(function (date) {
                if(date){
                    $scope.bind.dataAplicacao = date;
                }
            });
        };

        $scope.acaoSalvar = function(){
            $ionicLoading.show({
                template: 'Salvando...'
            });
            try{
                if(isInvalid($scope.bind.tipoVacina)){
                    throw "Infome a Vacina";
                }
                if(isInvalid($scope.bind.dataAplicacao)){
                    throw "Infome a Data de Aplicação";
                }
 
                var binding = [];
                binding.push($scope.idIndividuo);
                binding.push($scope.bind.tipoVacina.id);
                binding.push($scope.usuario.id);
                binding.push($scope.bind.dataAplicacao.getTime() / 1000);
                binding.push($scope.bind.lote);
                binding.push($scope.bind.observacao);
                
                DB.query("INSERT INTO registroVacinas (codigoPaciente, codigoTipoVacina, codigoUsuario, dataAplicacao, lote, observacao) " +
                        " VALUES (?,?,?,?,?,?)", binding).then(function (result) {
                            
                    $state.go('controleVacinas', {idIndividuo: $scope.idIndividuo, idDomicilio: $scope.bind.idDomicilio});        
                    
                }, $scope.err);
                
            }catch(err){
                $scope.messagePopup(err);
                return;
            }
        };
        
        $scope.err = function(err){
            $scope.messagePopup(err.message);
            return true;
        };

        $scope.messagePopup = function(msg) {
            $ionicLoading.hide();
            var deferred = $q.defer();
            
            //https://github.com/driftyco/ionic/blob/master/js/angular/service/platform.js  TO VIEW PRIORITY LIST
            var deregisterBackEvent = $ionicPlatform.registerBackButtonAction(function () {}, 501);

            $ionicPopup.alert({
             title: 'Atenção!',
             template: msg
           }).then(function(){
               deregisterBackEvent();
               deferred.resolve();
           });
           
           return deferred.promise;
        };

        //<editor-fold defaultstate="collapsed" desc="Modal Tipo Vacina">
        $ionicModal.fromTemplateUrl('templates/modals/tipoVacina.html', {
            scope: $scope,
            animation: 'slide-in-up',
            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalTipoVacina = modal;
        });
        $scope.limparTipoVacina = function () {
            $scope.bind.tipoVacina = null;
        };
        $scope.selecionarTipoVacina = function () {
            $scope.modalTipoVacina.show();
            $scope.bind.criterioTipoVacina = null;
        };
        $scope.tipoVacinaSelecionada = function (item) {
            $scope.bind.tipoVacina = item;
            $scope.closeModalTipoVacina();
        };
        $scope.closeModalTipoVacina = function () {
            $scope.modalTipoVacina.hide();
        };

        $scope.loadTipoVacina = function () {
            DB.query("SELECT t.id, t.descricao " +
                    " FROM tipoVacina AS t" +
                    " ORDER BY t.descricao", []).then(function (result) {
                $scope.bind.tiposVacina = DB.fetchAll(result);
            });
        };
        //</editor-fold>

        $scope.loadTipoVacina();

        $ionicLoading.hide();
        
    }]);

