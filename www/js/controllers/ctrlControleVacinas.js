controllers.controller('controleVacinasCtrl', ['$scope', '$state', 'DB', '$stateParams', '$ionicLoading', '$cordovaCamera', '$ionicActionSheet',
    function ($scope, $state, DB, $stateParams, $ionicLoading, $cordovaCamera, $ionicActionSheet) {
        $ionicLoading.show({
            template: 'Carregando...'
        });

        $scope.verBotaoVoltar = true;

        $scope.bind = {imagens: [], vacinas: []};
        $scope.tituloPrincipal = 'Vacinas';
        $scope.idIndividuo = $stateParams.idIndividuo;
        $scope.idDomicilio = $stateParams.idDomicilio;
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));

        $scope.acaoVoltar = function ($event) {
            $state.go('cadastroVisitas.tabIndividuos', {idDomicilio: $scope.idDomicilio});
        };

        $scope.capturarImagem = function ($event) {
            var options = {
                quality: 100,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: false,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 500,
                targetHeight: 500,
                correctOrientation: true,   
                saveToPhotoAlbum: false
            };

            $cordovaCamera.getPicture(options).then(function (imageData) {
                var sql = "INSERT INTO vacinasImagens (codigoPaciente, codigoUsuario, imagem) VALUES (?,?,?); SELECT last_insert_rowid() FROM vacinasImagens";
                
                DB.query(sql, [$scope.idIndividuo, $scope.usuario.id, imageData]).then(function(res){
                    var K = {id: res.insertId, imagem: imageData};
                    $scope.bind.imagens.push(K);
                    $scope.bind.recuo = "c-padding-images";
                });
            }, function (err) {
                console.log(err);
            });
        };

        $scope.carregarImagens = function(){
            var sql = "SELECT id, imagem FROM vacinasImagens WHERE codigoPaciente = ? ORDER BY id";
            DB.query(sql, [$scope.idIndividuo]).then(function(result){
                result = DB.fetchAll(result);
                if(result.length > 0){
                    $scope.bind.recuo = "c-padding-images";
                    $scope.bind.imagens = result;
                }else{
                    $scope.bind.recuo = "c-padding-sub-header-info";
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

            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.carregarVacinas = function () {
            DB.query("SELECT r.*, " +
                    " t.descricao, " +
                    " strftime('%d/%m/%Y',r.dataAplicacao, 'unixepoch') AS dataAplicacaoFormatado " +
                    " FROM registroVacinas AS r " +
                    " LEFT JOIN tipoVacina AS t on r.codigoTipoVacina = t.id " +
                    " WHERE r.codigoPaciente = ?", [$scope.idIndividuo]).then(function (result) {

                $scope.bind.vacinas = DB.fetchAll(result);
                $ionicLoading.hide();

            }, function (err) {
                console.error(err.message);
            });
        };

        $scope.adicionarVacina = function(){
            $state.go('novaVacina', {idIndividuo: $scope.idIndividuo, idDomicilio: $scope.bind.idDomicilio});
        };
        
        $scope.excluirRegistroVacina = function(index){
            DB.query("DELETE FROM registroVacinas WHERE id = ?", [$scope.bind.vacinas[index].id]).then(function (result) {
                $scope.bind.vacinas.splice(index, 1);
            }, function (err) {
                console.error(err.message);
            });
        };
        
        $scope.excluirRegistroImagem = function(index){
            DB.query("DELETE FROM vacinasImagens WHERE id = ?", [$scope.bind.imagens[index].id]).then(function (result) {
                $scope.bind.imagens.splice(index, 1);
                if($scope.bind.imagens.length > 0){
                    $scope.bind.recuo = "c-padding-images";
                }else{
                    $scope.bind.recuo = "c-padding-sub-header-info";
                }
            }, function (err) {
                console.error(err.message);
            });
        };
        
        $scope.optionsVacinas = function (item) {
            $scope.hideSheet = $ionicActionSheet.show({
                destructiveText: 'Excluir',
                titleText: 'Escolha a Opção',
                cancelText: 'Fechar',
                destructiveButtonClicked: function () {
                    $scope.excluirRegistroVacina(item);
                    return true;
                }
            });
        };

        $scope.optionsImagem = function (index) {
            $scope.hideSheet = $ionicActionSheet.show({
                destructiveText: 'Excluir',
                titleText: 'Escolha a Opção',
                cancelText: 'Fechar',
                destructiveButtonClicked: function () {
                    $scope.excluirRegistroImagem(index);
                    return true;
                }
            });
        };

        $scope.carregarImagens();
        $scope.carregarIndividuos();
        $scope.carregarVacinas();
    }]);

