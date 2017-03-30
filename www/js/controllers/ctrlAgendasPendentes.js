controllers.controller('agendasPendentesCtrl', ['$scope', '$state', 'DB', '$stateParams', '$ionicLoading', '$ionicActionSheet', '$ionicModal', '$ionicPopup',
    function ($scope, $state, DB, $stateParams, $ionicLoading, $ionicActionSheet, $ionicModal, $ionicPopup) {
        $ionicLoading.show({
            template: 'Carregando...'
        });

        $scope.verBotaoVoltar = true;

        $scope.bind = {};
        $scope.tituloPrincipal = 'Agendas Pendentes';
        $scope.idIndividuo = $stateParams.idIndividuo;
        $scope.idDomicilio = $stateParams.idDomicilio;
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));

        $scope.acaoVoltar = function ($event) {
            $state.go('cadastroVisitas.tabIndividuos', {idDomicilio: $scope.idDomicilio});
        };

        $ionicModal.fromTemplateUrl('templates/modals/motivos.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.bind.modalMotivos = modal;
        });

        $scope.fecharMotivos = function(){
            $scope.bind.modalMotivos.hide();
        };

        $scope.escolherMotivo = function(agenda){
            $scope.bind.agendaSelecionada = agenda;
            DB.query("SELECT id, outros, descricao FROM motivoNaoComparecimento ORDER BY descricao ", []).then(function (result) {
                $scope.bind.motivos = DB.fetchAll(result);

                $scope.bind.modalMotivos.show();
            });
        };

        $scope.motivoSelecionado = function(item){
            if(item.outros == 1){
                $scope.popupMotivo(item);
                $scope.fecharMotivos();
            }else{
                $scope.naoCompareceuItem($scope.bind.agendaSelecionada, item.id, null);
                $scope.fecharMotivos();
            }
        };

        $scope.popupMotivo = function(item) {
            var popupOutroMotivo = $ionicPopup.show({
                template: '<input c-max-length="50" type="text" ng-model="bind.outroMotivo">',
                title: 'Informe o Motivo',
                scope: $scope,
                buttons: [
                { text: 'Cancelar' },
                {
                    text: '<b>OK</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (!$scope.bind.outroMotivo) {
                            e.preventDefault();
                        } else {
                            return $scope.bind.outroMotivo;
                        }
                    }
                }]
            });

            popupOutroMotivo.then(function(res) {
                if(res){
                    $scope.naoCompareceuItem($scope.bind.agendaSelecionada, item.id, $scope.bind.outroMotivo);
                }
            });
        };

        $scope.definirAvatar = function (individuo) {
            if(individuo.sexo == "F"){
                $scope.bind.avatar = "imagens/girl_96x96.png";
            }else {
                $scope.bind.avatar = "imagens/person_96x96.png";
            }
        };

        $scope.carregarIndividuos = function () {
            DB.query("SELECT p.id," +
                    " p.nome, " +
                    " p.sexo, " +
                    " p.nomeMae, " +
                    " (strftime('%Y', 'now') - strftime('%Y', dataNascimento, 'unixepoch')) - (strftime('%m-%d', 'now') < strftime('%m-%d', dataNascimento, 'unixepoch')) AS idadeAnos, " +
                    " strftime('%d/%m/%Y',p.dataNascimento, 'unixepoch') AS dataNascimento " +
                    " FROM paciente AS p " +
                    " WHERE p.id = ?", [$scope.idIndividuo]).then(function (result) {

                $scope.individuo = DB.fetch(result);
                $scope.definirAvatar($scope.individuo);

                $scope.carregarAgendas();
            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.carregarAgendas = function () {
            DB.query("SELECT n.id," +
                    " n.tipoAgenda, " +
                    " n.local, " +
                    " n.statusMobile, " +
                    " n.dataAgendamento, " +
                    " strftime('%d/%m/%Y %H:%M', n.dataAgendamento, 'unixepoch', 'localtime') AS dataAgendamento " +
                    " FROM notificacaoAgendas AS n " +
                    " WHERE n.codigoPaciente = ? AND n.status = 1" +
                    " ORDER BY N.dataAgendamento desc", [$scope.idIndividuo]).then(function (result) {

                $scope.bind.agendas = DB.fetchAll(result);

                $ionicLoading.hide();
            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.openItemOptions = function (item) {
            $scope.bind.agendaSelecionada = null;
            $scope.bind.outroMotivo = null;

            var buttons = [];
            if($scope.bind.agendas[item].statusMobile > 0){
                buttons.push({text: 'Limpar'});
            }
            buttons.push({text: 'Compareceu'});

            $scope.hideSheet = $ionicActionSheet.show({
                buttons: buttons,
                destructiveText: 'Não Compareceu',
                titleText: 'Escolha a Opção',
                cancelText: 'Fechar',
                destructiveButtonClicked: function () {
                    $scope.escolherMotivo($scope.bind.agendas[item]);
                    return true;
                },
                buttonClicked: function (index) {
                    var agenda = $scope.bind.agendas[item];
                    if(agenda.statusMobile > 0){
                        if(index == 0){
                            $scope.limparItem(agenda);
                        }else if(index == 1){
                            $scope.compareceuItem(agenda);
                        }
                    }else{
                        if(index == 0){
                            $scope.compareceuItem(agenda);
                        }
                    }
                    return true;
                }
            });
        };

        $scope.compareceuItem = function(agenda){
            DB.query("UPDATE notificacaoAgendas SET statusMobile = 1, codigoUsuario = ? "+
                    " WHERE  id = ? ", [$scope.usuario.id, agenda.id]).then(function (result) {
                agenda.statusMobile = 1;//Atualizar o registro atual
            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.naoCompareceuItem = function(agenda, motivoId, motivoDescricao){
            DB.query("UPDATE notificacaoAgendas SET statusMobile = 2, codigoMotivo = ?, descricaoOutroMotivo = ?, codigoUsuario = ? "+
                    " WHERE  id = ? ", [motivoId, emptyToNull(motivoDescricao), $scope.usuario.id, agenda.id]).then(function (result) {
                agenda.statusMobile = 2;//Atualizar o registro atual
            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.limparItem = function(agenda){
            DB.query("UPDATE notificacaoAgendas SET statusMobile = 0, codigoUsuario = null, versaoMobile = -1, codigoMotivo = null, descricaoOutroMotivo = null "+
                    " WHERE  id = ? ", [agenda.id]).then(function (result) {
                agenda.statusMobile = 0;//Atualizar o registro atual
            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.$on('$destroy', function () {
            $scope.bind.modalMotivos.remove();
        });

        $scope.carregarIndividuos();
    }]);
