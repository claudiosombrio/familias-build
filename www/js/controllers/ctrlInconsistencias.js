controllers.controller('inconsistenciasCtrl', ['$scope', '$state', 'DB',
    function($scope, $state, DB) {

        $scope.verBotaoVoltar = true;
        $scope.bind = {};
        $scope.tituloPrincipal = 'Lista de Inconsistências';

        $scope.acaoVoltar = function($event) {
            $state.go('menu');
        };

        $scope.editarIndividuo = function(individuo) {
            window.localStorage.individuoToEdit = JSON.stringify(individuo)
            $state.go('cadastroIndividuos.tabIdentificacao', { idIndividuo: individuo.codigoInterno });
        };

        $scope.editarDomicilio = function(domicilio) {
            $state.go('cadastroDomicilios.tabEndereco', { idDomicilio: domicilio.id });
        };

        $scope.carregarIndividuos = function() {
            DB.query("SELECT p.codigoSistema as codigoSistema, ep.mensagem, p.id, upper(p.nome) AS nome, upper(p.nomeMae) AS nomeMae, strftime('%d/%m/%Y',p.dataNascimento, 'unixepoch') AS dataNascimento" +
                " FROM erroPaciente ep LEFT JOIN paciente AS p ON ep.codigoPaciente = p.id ORDER BY p.nome", []).then(function(result) {
                $scope.bind.individuos = DB.fetchAll(result);
            });
        };

        $scope.carregarDomicilios = function() {
            DB.query("SELECT p.codgoSistema as codigoSistema, ed.mensagem, d.id, d.codigoSistema, upper(e.logradouro) AS logradouro, upper(e.complementoLogradouro) AS complementoLogradouro, e.numeroLogradouro, upper(e.bairro) AS bairro, d.numeroFamilia" +
                " FROM erroDomicilio ed LEFT JOIN domicilio AS d ON ed.codigoDomicilio = d.id LEFT JOIN endereco AS e ON d.codigoEndereco = e.id ORDER BY e.logradouro", []).then(function(result) {

                $scope.bind.domicilios = DB.fetchAll(result);
            });
        };

        $scope.carregarIndividuos();
        $scope.carregarDomicilios();
    }
]);