controllers.controller('domiciliosCtrl', ['$scope', '$state', 'DB', '$timeout', '$celkScroll',
    function ($scope, $state, DB, $timeout, $celkScroll) {

        $scope.verBotaoVoltar = true;

        $scope.bind = {};
        $scope.itens = [];
        $scope.canLoad = true;
        $scope.count = 0;
        $scope.filtroEndereco = '';
        $scope.bind.minhasFamilias = true;
        $scope.bind.codigoMicroArea = window.localStorage.getItem("microarea");
        window.localStorage.removeItem("tempDomicilio");
        $scope.tituloPrincipal = 'Lista de Domicílios';

        $scope.acaoVoltar = function ($event) {
            $state.go('menu');
        };

        $scope.limpar = function () {
            $scope.filtroFamilia = '';
            $scope.filtroEndereco = '';
            $scope.canLoad = true;
            $scope.itens = [];
            $scope.count = 0;
            $scope.loadMoreData();
        };

        $scope.buscar = function () {
            if(typeof $scope.time !== "undefined"){
                $timeout.cancel($scope.time);
            }
            $scope.time = $timeout(function(){$scope.newSearch();}, 600);
        };

        $scope.newSearch = function () {
            $scope.canLoad = true;
            $scope.itens = [];
            $scope.count = 0;

            $celkScroll.toTop();
        };

        $scope.loadMoreData = function () {
            var deep = 10;
            var i = $scope.count;
            $scope.count += deep;
            var filtroFamilia = $scope.filtroFamilia;
            var filtroEndereco = $scope.filtroEndereco;
            var parametros = [];

            var tags = filtroEndereco.split(" ");

            var sql = "SELECT d.id, d.codigoSistema, upper(e.logradouro) AS logradouro, upper(e.complementoLogradouro) AS complementoLogradouro, e.numeroLogradouro, upper(e.bairro) AS bairro, d.numeroFamilia"+
                    " FROM domicilio AS d "+
                    " LEFT JOIN endereco AS e ON d.codigoEndereco = e.id ";

            if(isValid(filtroFamilia)){
                sql += " WHERE (d.numeroFamilia = ? OR d.codigoSistema = ?) AND ";
                parametros.push(filtroFamilia, filtroFamilia);
            }else{
                sql += " WHERE ";
            }
            sql += " e.logradouro || ' ' || e.numeroLogradouro like ? ";

            parametros.push('%'+filtroEndereco+'%');
            if($scope.bind.minhasFamilias && $scope.bind.codigoMicroArea){
                sql += " AND d.codigoMicroArea = ?";
                parametros.push(parseInt($scope.bind.codigoMicroArea));
            }
            parametros.push(i);
            parametros.push(deep);

            sql += " ORDER BY e.logradouro LIMIT ?,?";

            DB.query(sql, parametros).then(function (result) {
                var usuarios = DB.fetchAll(result);
                if($scope.count === 50){
                    $scope.itens = [];
                }
                $scope.itens.extend(usuarios);

                if(usuarios.length < deep){
                    $scope.canLoad = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        };
    }]);
