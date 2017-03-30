controllers.controller('individuosCtrl', ['$scope', '$state', 'DB', '$timeout', '$celkScroll', '$cordovaDatePicker',
    function ($scope, $state, DB, $timeout, $celkScroll, $cordovaDatePicker) {

        $scope.verBotaoVoltar = true;

        $scope.dataNascimento = null;
        $scope.itens = [];
        $scope.canLoad = false;
        $scope.count = 0;
        $scope.filtro = '';
        $scope.tituloPrincipal = 'Lista de Indivíduos';

        $scope.acaoVoltar = function ($event) {
            $state.go('menu');
        };

        $scope.limpar = function () {
            $scope.filtro = '';
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

        $scope.limparDataNascimento = function(){
            $scope.dataNascimento = null;
            $scope.newSearch();
        };

        $scope.changeDataNascimento = function(){
            var options = {
                date: new Date(),
                mode: 'date'
              };

            $cordovaDatePicker.show(options).then(function (date) {
                if(date){
                    $scope.dataNascimento = date;
                }else{
                    $scope.dataNascimento = null;
                }
                $scope.newSearch();
            });
        };

        $scope.descricaoSituacao = function(item){
            if(item.situacao == 0){
                return "Ativo";
            }else if(item.situacao == 1){
                return "Provisório";
            }
            else if(item.situacao == 2){
                return "Inativo";
            }else if(item.situacao == 3){
                return "Excluído";
            }
            return "";
        };

        $scope.definirAvatar = function (item) {
            if(item.sexo == "F"){
                return "imagens/girl_96x96.png";
            }else {
                return "imagens/person_96x96.png";
            }
        };

        $scope.itemToEdit = function (item){
          window.localStorage.individuoToEdit = JSON.stringify(item);
        }

        $scope.loadMoreData = function () {
            var deep = 10;
            var i = $scope.count;
            $scope.count += deep;
            var filtro = '%'+ $scope.filtro +'%';
            var filtroCodigo = $scope.filtroCodigo;
            var params = [];
            var sql = "SELECT u.ativo as situacao, u.sexo AS sexo, u.id, upper(u.nome) AS nome, upper(u.nomeMae) AS nomeMae, strftime('%d/%m/%Y',u.dataNascimento, 'unixepoch') AS dataNascimento, u.descricaoFamilia as descricaoFamilia, u.codigoSistema as codigoSistema, u.codigoInterno as codigoInterno"+
                    " FROM dominioPaciente u";
            if(isValid(filtroCodigo)){
                sql += " WHERE u.codigoSistema = ? ";
                params.push(filtroCodigo);
            }else{
                sql += " WHERE (u.keyword like ?)";
                params.push(filtro);
            }

            if($scope.dataNascimento){
                sql += " AND u.dataNascimento = ? ";
                params.push($scope.dataNascimento.getTime() / 1000);
            }
            sql += " GROUP BY u.sexo, u.id, u.nome, u.nomeMae, u.dataNascimento "+
                   " ORDER BY u.nome LIMIT ?,?";
            params.push(i);
            params.push(deep);

            DB.query(sql, params).then(function (result) {
                var usuarios = DB.fetchAll(result);
                if($scope.count === 50){
                    $scope.itens = [];
                }
                usuarios.forEach(function(item){
                  if (item.cns === 'undefined'){
                    item.cns = null;
                  }
                  if (item.cpf === 'undefined'){
                    item.cpf = null;
                  }
                })
                $scope.itens.extend(usuarios);

                if(usuarios.length < deep){
                    $scope.canLoad = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function(e){
              console.log(e);
            });
        };
    }]);
