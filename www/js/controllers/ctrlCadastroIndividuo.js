controllers.controller('cadastroIndividuoCtrl', ['$scope', '$filter', 'DB', '$stateParams', '$ionicLoading', '$ionicPopup', '$q', '$ionicPlatform', '$state', 
    function ($scope, $filter, DB, $stateParams, $ionicLoading, $ionicPopup, $q, $ionicPlatform, $state) {
        $ionicLoading.show({
            template: 'Carregando...'
        });
        $scope.bind = {};
        $scope.verBotaoVoltar = true;

        $scope.tituloPrincipal = 'Cadastro de Indivíduo';
        $scope.verBotaoSalvar = false;
        $scope.codigoMicroArea = window.localStorage.getItem("microarea");
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));
        var tempDomicilio = JSON.parse(window.localStorage.getItem("tempDomicilio"));
        $scope.bind.idIndividuo = $stateParams.idIndividuo;
        
        $scope.paciente = {
            situacao: 0,
            nacionalidade: 1
        };
        $scope.pacienteEsus = {};
        $scope.documentosSalvos = {};
        $scope.documentosBind = {};

        $scope.avancar = function(idPaciente){
            var tempVisita = JSON.parse(window.localStorage.getItem("tempVisita"));
            if(tempDomicilio){
                var individuo = {
                    id: idPaciente,
                    nome: $scope.paciente.nome.toUpperCase(),
                    nomeMae: $scope.paciente.nomeMae,
                    situacao: $scope.paciente.situacao,
                    sexo: $scope.paciente.sexo,
                    codigoDomicilio: $scope.paciente.codigoDomicilio,
                    dataNascimento: $filter('date')($scope.paciente.dataNascimento, 'dd/MM/yyyy')
                };
                if(! tempDomicilio.domicilio.individuos){
                    tempDomicilio.domicilio.individuos = [];
                }
                for(var i = 0; i < tempDomicilio.domicilio.individuos.length; i++){
                    var ind = tempDomicilio.domicilio.individuos[i];
                    if(ind.id == individuo.id){
                        tempDomicilio.domicilio.individuos.splice(i, 1);
                        break;
                    }
                }
                tempDomicilio.domicilio.individuos.unshift(individuo);
                
                window.localStorage.setItem("tempDomicilio", JSON.stringify(tempDomicilio));
             
                $state.go('cadastroDomicilios.tabIndividuos');
            }else if(tempVisita){
                $state.go('cadastroVisitas.tabVisita');
            }else{
                $state.go('individuos');
            }
        };

        $scope.showConfirmation = function (mensagem) {
            var deferred = $q.defer();
            var alertPopup = $ionicPopup.confirm({
                title: 'Atenção!',
                template: mensagem,
                buttons: [
                      { text: 'Não' },
                      {
                        text: '<b>Sim</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            return true;
                        }
                      }
                    ]
            });
            alertPopup.then(function (resposta) {
                return deferred.resolve(resposta);
            });
            
            return deferred.promise;
        };

        $scope.voltar = function () {
            var tempVisita = JSON.parse(window.localStorage.getItem("tempVisita"));
            if(tempDomicilio){
                $state.go('cadastroDomicilios.tabIndividuos');
            }else if(tempVisita){
                $state.go('cadastroVisitas.tabVisita');
            }else{
                $state.go('individuos');
            }            
        };

        $scope.acaoVoltar = function () {
            if($scope.verBotaoSalvar){
                $scope.showConfirmation('Você perderá todas as informações não salvas. Deseja realmente voltar?').then(function(resp){
                    if(resp){
                        $scope.voltar();
                    }
                });
            }else{
                $scope.voltar();
            }
        };

        $scope.carregarRaca = function () {
            DB.query("SELECT id, descricao, codigoSistema " +
                    " FROM raca ORDER BY descricao", []).then(function (result) {
                $scope.racas = DB.fetchAll(result);
            });
        };

        $scope.carregarEtnias = function () {
            DB.query("SELECT id, descricao " +
                    " FROM etniaIndigena ORDER BY descricao", []).then(function (result) {
                $scope.etnias = DB.fetchAll(result);
            });
        };

        $scope.carregarPaciente = function () {
            if ($scope.bind.idIndividuo) {
                DB.query("SELECT p.id,"+
                        " upper(p.nome) AS nome," +
                        " p.apelido," +
                        " p.dataNascimento AS dataNascimento," +
                        " p.sexo," +
                        " p.codigoRaca," +
                        " p.codigoEtniaIndigena," +
                        " etnia.descricao AS descricaoEtniaIndigena," +
                        " p.codigoSistema," +
                        " upper(p.nomeMae) AS nomeMae," +
                        " p.nacionalidade," +
                        " p.celular," +
                        " p.telefone," +
                        " p.telefone2," +
                        " p.telefone3," +
                        " p.telefone4," +
                        " p.email," +
                        " p.flagResponsavelFamiliar," +
                        " p.codigoResponsavelFamiliar," +
                        " p.religiao," +
                        " p.localTrabalho," +
                        " p.telefoneTrabalho," +
                        " p.responsavel," +
                        " p.parentescoResponsavel," +
                        " p.urgenciaNome," +
                        " p.urgenciaTelefone," +
                        " p.urgenciaParentesco," +
                        " p.resideDesde," +
                        " p.rendaFamiliar," +
                        " p.situacao," +
                        " p.nis," +
                        " p.prontuario," +
                        " p.motivoExclusao," +
                        " upper(responsavel.nome) AS nomeResponsavel," +
                        " pais.id AS codigoPais," +
                        " pais.descricao AS descricaoPais," +
                        " cidade.id AS codigoCidade," +
                        " cidade.descricao || ' - ' || estado.sigla AS descricaoCidade," +
                        " pis.numeroDocumento AS numeroPis," +
                        " dom.codigoSistema AS numeroDomicilio," +
                        " dom.codigoMicroArea," +
                        " ma.microArea, " +
                        " pro.nome AS nomeProfissional, " +
                        " e.descricao AS descricaoEquipe, " +
                        " cns.numeroCartao AS numeroCartao," +
                        " cns.numeroCartao AS numeroCartaoAntigo," +
                        " cns.id AS cnsId" +
                        " FROM paciente AS p " +
                        "  left outer join domicilio AS dom ON p.codigoDomicilio = dom.id " +
                        "  left outer join cns AS cns ON p.id = cns.codigoPaciente AND cns.excluido = 'N' " +
                        "  left outer join documentos AS pis ON p.id = pis.codigoPaciente AND pis.excluido = 'N' AND pis.tipoDocumento = 9" +
                        "  left outer join pais AS pais ON p.codigoPais = pais.id" +
                        "  left outer join etniaIndigena AS etnia ON p.codigoEtniaIndigena = etnia.id" +
                        "  left outer join cidade AS cidade ON p.codigoCidade = cidade.id" +
                        "  left outer join estado AS estado ON cidade.codigoEstado = estado.id" +
                        "  left outer join paciente AS responsavel ON p.codigoResponsavelFamiliar = responsavel.id AND p.id <> p.codigoResponsavelFamiliar" +
                        "  left outer join equipeProfissional AS ep ON dom.codigoMicroArea = ep.codigoMicroArea AND ep.status = 0 " +
                        "  left outer join profissional AS pro ON pro.id = ep.codigoProfissional " +
                        "  left outer join equipe AS e ON e.id = ep.codigoEquipe " +
                        "  left outer join microArea AS ma ON ma.id = dom.codigoMicroArea " +
                        
                        " WHERE p.id = ?", [$scope.bind.idIndividuo]).then(function (result) {

                    var paciente = DB.fetch(result);
                    paciente.dataNascimento = new Date(paciente.dataNascimento * 1000);
                    if(isValid(paciente.resideDesde)){
                        paciente.resideDesde = new Date(paciente.resideDesde * 1000);
                    }else{
                        paciente.resideDesde = null;
                    }
                    if(isValid(paciente.codigoMicroArea)){
                        paciente.descricaoArea = paciente.descricaoEquipe + ' | ' + paciente.microArea;
                    }
                    if(paciente.situacao == 1){
                        paciente.situacao = 0;//torna o paciene ativo
                    }
                    
                    $scope.paciente = paciente;
                    $scope.habilitarEtnia();
                    
                    if(isValid($scope.codigoMicroArea)){
                        if(isValid(paciente.codigoMicroArea)){
                            if($scope.codigoMicroArea == paciente.codigoMicroArea){
                                $scope.verBotaoSalvar = true;
                            }
                        }else{
                            $scope.verBotaoSalvar = true;
                        }
                    }

                    $scope.carregarPacienteEsus();
                }, function (err) {
                    console.error(err.message);
                });
            }else{
                if(isValid($scope.codigoMicroArea)){
                    $scope.verBotaoSalvar = true;
                }
                
                $ionicLoading.hide();
            }
        };
        
        $scope.carregarPacienteEsus = function () {
            DB.query("SELECT p.id," +
                    " p.situacaoConjugal," +
                    " p.codigoCbo," +
                    " p.frequentaEscola," +
                    " p.nivelEscolaridade," +
                    " p.situacaoMercadoTrabalho," +
                    " p.responsavelCrianca," +
                    " p.frequentaCurandeira," +
                    " p.participaGrupoComunitario," +
                    " p.possuiPlanoSaude," +
                    " p.membroComunidadeTradicional," +
                    " p.comunidadeTradicional," +
                    " p.orientacaoSexual," +
                    " p.deficienciaAuditiva," +
                    " p.deficienciaVisual," +
                    " p.deficienciaFisica," +
                    " p.deficienciaIntelectual," +
                    " p.deficienciaOutra," +
                    " p.proteseAuditiva," +
                    " p.proteseMembrosSuperiores," +
                    " p.proteseMembrosInferiores," +
                    " p.proteseCadeiraRodas," +
                    " p.proteseOutros," +
                    " p.parentescoResponsavel," +
                    " p.situacaoRua," +
                    " p.tempoRua," +
                    " p.recebeBeneficio," +
                    " p.possuiReferenciaFamiliar," +
                    " p.acompanhadoPorOutraInstituicao," +
                    " p.nomeOutraInstituicao," +
                    " p.visitaFamiliarFrequentemente," +
                    " p.grauParentesco," +
                    " p.refeicoesDia," +
                    " p.refeicaoRestaurantePopular," +
                    " p.refeicaoDoacaoRestaurante," +
                    " p.refeicaoDoacaoReligioso," +
                    " p.refeicaoDoacaoPopular," +
                    " p.refeicaoDoacaoOutros," +
                    " p.acessoHigienePessoal," +
                    " p.higieneBanho," +
                    " p.higieneSanitario," +
                    " p.higieneBucal," +
                    " p.higieneOutros," +
                    " p.estaGestante," +
                    " p.maternidadeReferencia," +
                    " p.pesoConsiderado," +
                    " p.fumante," +
                    " p.dependenteAlcool," +
                    " p.dependenteDroga," +
                    " p.temHipertensao," +
                    " p.temDiabetes," +
                    " p.teveAvc," +
                    " p.teveInfarto," +
                    " p.temHanseniase," +
                    " p.temTuberculose," +
                    " p.temTeveCancer," +
                    " p.internacaoAno," +
                    " p.causaInternacao," +
                    " p.fezTratamentoPsiquiatrico," +
                    " p.possuiSofrimentoPsiquicoGrave," +
                    " p.estaAcamado," +
                    " p.estaDomiciliado," +
                    " p.usaPlantasMedicinais," +
                    " p.quaisPlantas," +
                    " p.doencaCardiaca," +
                    " p.cardiacaInsuficiencia," +
                    " p.cardiacaOutros," +
                    " p.cardiacaNaoSabe," +
                    " p.doencaRins," +
                    " p.rinsInsuficiencia," +
                    " p.rinsOutros," +
                    " p.rinsNaoSabe," +
                    " p.doencaRespiratoria," +
                    " p.respiratoriaAsma," +
                    " p.respiratoriaEfisema," +
                    " p.respiratoriaOutros," +
                    " p.respiratoriaNaoSabe," +
                    " p.outrasPraticasIntegrativas," +
                    " p.condicaoSaude1," +
                    " p.condicaoSaude2," +
                    " p.condicaoSaude3," +
                    " cbo.descricao AS descricaoCbo" +
                    " FROM pacienteEsus AS p " +
                    "  left outer join cbo AS cbo ON p.codigoCbo = cbo.id " +
                    " WHERE p.codigoPaciente = ?", [$scope.bind.idIndividuo]).then(function (result) {

                var pacienteEsus = DB.fetch(result);
                if(pacienteEsus){
                    $scope.pacienteEsus = pacienteEsus;
                }

                $scope.carregarDocumentos();
            }, function (err) {
                console.error(err.message);
            });
        };
        
        $scope.carregarDocumentos = function () {
            DB.query("SELECT d.id," +
                    " d.tipoDocumento," +
                    " d.numeroDocumento AS numeroDocumento," +
                    " d.complemento," +
                    " d.codigoOrgaoEmissor," +
                    " d.numeroCartorio," +
                    " d.numeroLivro," +
                    " d.numeroFolha," +
                    " d.numeroTermo," +
                    " d.numeroMatricula," +
                    " d.dataEmissao," +
                    " d.siglaUf," +
                    " oe.descricao AS descricaoOrgaoEmissor, " +
                    " oe.sigla AS siglaOrgaoEmissor" +
                    " FROM documentos AS d " +
                    "  left join orgaoEmissor AS oe ON d.codigoOrgaoEmissor = oe.id " +
                    " WHERE d.codigoPaciente = ? AND excluido = 'N'", [$scope.bind.idIndividuo]).then(function (result) {

                $scope.documentosSalvos = DB.fetchAll(result);
                for(var i = 0; i < $scope.documentosSalvos.length; i++){
                    var documento = $scope.documentosSalvos[i];
                    if(documento.tipoDocumento === 2){//CPF
                        $scope.documentosBind.numeroCpf = documento.numeroDocumento;
                    }else if(documento.tipoDocumento === 1){//RG
                        $scope.documentosBind.numeroRg = documento.numeroDocumento;
                        $scope.documentosBind.complementoRg = documento.complemento;
                        $scope.documentosBind.ufRg = documento.siglaUf;
                        $scope.documentosBind.dataEmissaoRg = new Date(documento.dataEmissao * 1000);
                        $scope.documentosBind.codigoOrgaoEmissorRg = documento.codigoOrgaoEmissor;
                        $scope.documentosBind.siglaOrgaoEmissorRg = documento.siglaOrgaoEmissor;
                        $scope.documentosBind.descricaoOrgaoEmissorRg = documento.descricaoOrgaoEmissor;
                    }else if (documento.tipoDocumento === 91 || documento.tipoDocumento === 92){//Certidoes
                        if(documento.tipoDocumento === 91){
                            $scope.documentosBind.descricaoTipoDocumento = "Certidão de Nascimento";
                        }else{
                            $scope.documentosBind.descricaoTipoDocumento = "Certidão de Casamento";
                        }
                        $scope.documentosBind.tipoDocumentoCertidao = documento.tipoDocumento;
                        $scope.documentosBind.numeroMatriculaCertidao = documento.numeroMatricula;
                        $scope.documentosBind.numeroFolhaCertidao = documento.numeroFolha;
                        $scope.documentosBind.numeroTermoCertidao = documento.numeroTermo;
                        $scope.documentosBind.numeroLivroCertidao = documento.numeroLivro;
                        $scope.documentosBind.dataEmissaoCertidao = new Date(documento.dataEmissao * 1000);
                        $scope.documentosBind.numeroCartorioCertidao = documento.numeroCartorio;
                    }
                }
                
                $ionicLoading.hide();
            }, function (err) {
                console.error(err.message);
            });
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

        $scope.acaoSalvar = function(){
            $ionicLoading.show({
                template: 'Salvando...'
            });
            try{
                if(isInvalid($scope.paciente.situacao)){
                    throw "Infome a Situação";
                }
                if($scope.paciente.situacao == 2 || $scope.paciente.situacao == 3){
                    if(isInvalid($scope.paciente.motivoExclusao)){
                        throw "Infome o Motivo da Inativação/Exclusão";
                    }
                }
                if(isInvalid($scope.paciente.nome)){
                    throw "Infome o Nome Completo";
                }
                if(isInvalid($scope.paciente.dataNascimento)){
                    throw "Infome a Data de Nascimento";
                }
                if(isInvalid($scope.paciente.sexo)){
                    throw "Infome o Sexo";
                }
                if(isInvalid($scope.paciente.codigoRaca)){
                    throw "Infome a Raça/Cor";
                }
                if($scope.bind.exibeEtnia){
                    if(isInvalid($scope.paciente.codigoEtniaIndigena)){
                        throw "Infome a Etnia Indígena";
                    }
                }else{
                    $scope.paciente.codigoEtniaIndigena = null;
                }
                if(isInvalid($scope.paciente.nomeMae)){
                    throw "Infome o Nome Completo da Mãe";
                }
                if(isInvalid($scope.paciente.nacionalidade)){
                    throw "Infome a Nacionalidade";
                }
                if(invalidToEmpty($scope.paciente.numeroCartao).length > 0 && !CNS.isValid($scope.paciente.numeroCartao)){
                    throw "Infome um Cartão SUS Válido";
                }
                if(invalidToEmpty($scope.documentosBind.numeroCpf).length > 0 && !CPF.isValid($scope.documentosBind.numeroCpf)){
                    throw "Infome um CPF Válido";
                }
                if(isValid($scope.documentosBind.numeroRg) ||
                    isValid($scope.documentosBind.complementoRg) ||
                    isValid($scope.documentosBind.ufRg) ||
                    isValid($scope.documentosBind.dataEmissaoRg) ||
                    isValid($scope.documentosBind.codigoOrgaoEmissorRg)){

                    if(isInvalid($scope.documentosBind.numeroRg) ||
//                        isInvalid($scope.documentosBind.complementoRg) ||
                        isInvalid($scope.documentosBind.ufRg) ||
                        isInvalid($scope.documentosBind.dataEmissaoRg) ||
                        isInvalid($scope.documentosBind.codigoOrgaoEmissorRg)){
                        
                        throw "Infome todos os campos da Identidade";
                    }
                }
                if(isValid($scope.documentosBind.tipoDocumentoCertidao) ||
                    isValid($scope.documentosBind.numeroFolhaCertidao) ||
                    isValid($scope.documentosBind.numeroTermoCertidao) ||
                    isValid($scope.documentosBind.numeroLivroCertidao) ||
                    isValid($scope.documentosBind.dataEmissaoCertidao) ||
                    isValid($scope.documentosBind.numeroCartorioCertidao)){

                    if(isInvalid($scope.documentosBind.tipoDocumentoCertidao) ||
                        isInvalid($scope.documentosBind.numeroFolhaCertidao) ||
                        isInvalid($scope.documentosBind.numeroTermoCertidao) ||
                        isInvalid($scope.documentosBind.numeroLivroCertidao) ||
                        isInvalid($scope.documentosBind.dataEmissaoCertidao) ||
                        isInvalid($scope.documentosBind.numeroCartorioCertidao)){
                        
                        throw "Infome todos os campos da Certidão";
                    }
                }
                if(invalidToEmpty($scope.documentosBind.numeroCpf).length === 0 
                        && isInvalid($scope.documentosBind.numeroRg)
                        && isInvalid($scope.documentosBind.numeroFolhaCertidao)
                        && $scope.paciente.situacao != 3){
                    throw "Infome o CPF, RG ou uma Certidão do indivíduo";
                }
                if(isInvalid($scope.paciente.celular) && isInvalid($scope.paciente.telefone) && $scope.paciente.situacao != 3){
                    throw "Infome o Celular ou Telefone para Contato";
                }
                if(!tempDomicilio && $scope.paciente.situacao == 3 && $scope.paciente.numeroDomicilio){
                    throw "Para excluir o indivíduo ele deve ser removido do Domicílio em que está.";
                }

                $scope.validarCpfExistente().then(function(){
                    $scope.validarCnsExistente().then(function(){
                        $scope.validarIdentidadeExistente().then(function(){
                            $scope.validarCertidaoExistente().then(function(){

                                $scope.processarSalvar();

                            }, function(err){
                                $scope.messagePopup(err);
                            });
                        }, function(err){
                            $scope.messagePopup(err);
                        });
                    }, function(err){
                        $scope.messagePopup(err);
                    });
                }, function(err){
                    $scope.messagePopup(err);
                });
                
            }catch(err){
                $scope.messagePopup(err);
                return;
            }
        };
        
        $scope.validarIdentidadeExistente = function(){
            var deferred = $q.defer();
            if(isValid($scope.documentosBind.numeroRg)){
                var sql = "SELECT p.nome FROM documentos doc LEFT OUTER JOIN paciente AS p ON p.id = doc.codigoPaciente "+
                        " WHERE doc.tipoDocumento = 1 AND doc.excluido = 'N' AND (p.situacao <> 3 OR (p.situacao = 3 AND p.motivoExclusao = 136)) "+
                        " AND doc.numeroDocumento = ? AND doc.codigoOrgaoEmissor = ? AND doc.siglaUf = ? AND doc.dataEmissao = ?";
                if(isValid($scope.paciente.id)){
                    sql += " AND doc.codigoPaciente <> "+$scope.paciente.id;
                }
                var param = [];
                param.push($scope.documentosBind.numeroRg);
                param.push($scope.documentosBind.codigoOrgaoEmissorRg);
                param.push($scope.documentosBind.ufRg);
                param.push($scope.documentosBind.dataEmissaoRg.getTime() / 1000);
                
                DB.query(sql, param).then(function(res){
                    var paciente = DB.fetch(res);
                    if(isValid(paciente)){
                        deferred.reject('Já existe um indivíduo cadastrado com essa Identidade. ('+paciente.nome+')')
                    }else{
                        deferred.resolve();
                    }
                });
            }else{
                deferred.resolve();
            }
            
            return deferred.promise;
        };
        
        $scope.validarCertidaoExistente = function(){
            var deferred = $q.defer();
            if(invalidToEmpty($scope.documentosBind.numeroFolhaCertidao).length > 0){
                var sql = "SELECT p.nome FROM documentos doc LEFT OUTER JOIN paciente AS p ON p.id = doc.codigoPaciente "+
                        " WHERE doc.tipoDocumento = ? AND doc.excluido = 'N' AND (p.situacao <> 3 OR (p.situacao = 3 AND p.motivoExclusao = 136)) "+
                        " AND doc.numeroCartorio = ? AND doc.numeroLivro = ? AND doc.numeroFolha = ? AND doc.numeroTermo = ? AND doc.dataEmissao = ?";
                if(isValid($scope.paciente.id)){
                    sql += " AND doc.codigoPaciente <> "+$scope.paciente.id;
                }
                var param = [];
                param.push($scope.documentosBind.tipoDocumentoCertidao);
                param.push($scope.documentosBind.numeroCartorioCertidao);
                param.push($scope.documentosBind.numeroLivroCertidao);
                param.push($scope.documentosBind.numeroFolhaCertidao);
                param.push($scope.documentosBind.numeroTermoCertidao);
                param.push($scope.documentosBind.dataEmissaoCertidao.getTime() / 1000);

                DB.query(sql, param).then(function(res){
                    var paciente = DB.fetch(res);
                    if(isValid(paciente)){
                        deferred.reject('Já existe um indivíduo cadastrado com essa Certidão. ('+paciente.nome+')')
                    }else{
                        deferred.resolve();
                    }
                });
            }else{
                deferred.resolve();
            }
            
            return deferred.promise;
        };
        
        $scope.validarCnsExistente = function(){
            var deferred = $q.defer();
            
            if(invalidToEmpty($scope.paciente.numeroCartao).length > 0 && CNS.isValid($scope.paciente.numeroCartao)){
                var sql = "SELECT p.nome FROM cns cns LEFT OUTER JOIN paciente AS p ON p.id = cns.codigoPaciente "+
                        " WHERE cns.excluido = 'N' AND cns.numeroCartao = ? ";
                if(isValid($scope.paciente.id)){
                    sql += " AND cns.codigoPaciente <> "+$scope.paciente.id;
                }

                DB.query(sql, [$scope.paciente.numeroCartao]).then(function(res){
                    var paciente = DB.fetch(res);
                    if(isValid(paciente)){
                        deferred.reject('Já existe um indivíduo cadastrado com esse Cartão do SUS. ('+paciente.nome+')');
                    }else{
                        deferred.resolve();
                    }
                });
            }else{
                deferred.resolve();
            }
            
            return deferred.promise;
        };
        
        $scope.validarCpfExistente = function(){
            var deferred = $q.defer();
            
            if(invalidToEmpty($scope.documentosBind.numeroCpf).length > 0 && CPF.isValid($scope.documentosBind.numeroCpf)){
                var sql = "SELECT p.nome FROM documentos doc LEFT OUTER JOIN paciente AS p ON p.id = doc.codigoPaciente "+
                        " WHERE doc.tipoDocumento = 2 AND doc.excluido = 'N' AND (p.situacao <> 3 OR (p.situacao = 3 AND p.motivoExclusao = 136)) AND doc.numeroDocumento = ? ";
                if(isValid($scope.paciente.id)){
                    sql += " AND doc.codigoPaciente <> "+$scope.paciente.id;
                }

                DB.query(sql, [$scope.documentosBind.numeroCpf]).then(function(res){
                    var paciente = DB.fetch(res);
                    if(isValid(paciente)){
                        deferred.reject('Já existe um indivíduo cadastrado com esse CPF. ('+paciente.nome+')')
                    }else{
                        deferred.resolve();
                    }
                });
            }else{
                deferred.resolve();
            }
            
            return deferred.promise;
        };
        
        $scope.processarSalvar = function(){
            DB.session.transaction(function(tx) {
                if(isValid($scope.paciente.id)){
                    tx.executeSql("DELETE FROM erroPaciente WHERE codigoPaciente = ? ", [$scope.paciente.id], function(tx, result){
                        $scope.salvarPaciente(tx);
                    }, $scope.err);
                }else{
                    $scope.salvarPaciente(tx);
                }

            }, function(err){
                $scope.messagePopup(err.message);
            });
        };
        
        $scope.err = function(err){
            $scope.messagePopup(err.message);
            return true;
        };
        
        $scope.desativarDocumentosExistentes = function(tx, idPaciente){
            tx.executeSql("UPDATE documentos SET excluido = 'S', codigoUsuario = ? WHERE codigoPaciente = ?", [$scope.usuario.id, idPaciente], function(tx, result){
                
                var sql = "UPDATE cns SET excluido = 'S', codigoUsuario = ? WHERE codigoPaciente = ? ";
                var p = [$scope.usuario.id, idPaciente];
                if(isValid($scope.paciente.cnsId) && isValid($scope.paciente.numeroCartao)){
                    sql += " AND numeroCartao <> ? ";
                    p.push($scope.paciente.numeroCartao);
                }
                
                tx.executeSql(sql, p, function(tx, result){
                    $scope.resolverCns(tx, idPaciente);
                }, $scope.err);
            }, $scope.err);
        };

        $scope.resolverCns = function(tx, idPaciente){
            if(isValid($scope.paciente.numeroCartao) && $scope.paciente.numeroCartao !== $scope.paciente.numeroCartaoAntigo){
                var parametros = [];
                var sql = "INSERT INTO cns "+
                        " (excluido, numeroCartao, codigoPaciente, codigoUsuario)"+
                        " VALUES (?,?,?,?)";
                parametros.push('N');
                parametros.push($scope.paciente.numeroCartao);
                parametros.push(idPaciente);
                parametros.push($scope.usuario.id);

                tx.executeSql(sql, parametros, function(tx, result){
                    $scope.resolverCpf(tx, idPaciente);
                }, $scope.err);
            }else{
                $scope.resolverCpf(tx, idPaciente);
            }
        };
        
        $scope.resolverCertidoes = function(tx, idPaciente){
            if(isValid($scope.documentosBind.tipoDocumentoCertidao)){
                var idDocumentoSalvo = null;
                var sql = null;
                var parametros = [];
                if($scope.documentosSalvos.length > 0){
                    for(var i = 0; i < $scope.documentosSalvos.length; i++){
                        if($scope.documentosSalvos[i].tipoDocumento === $scope.documentosBind.tipoDocumentoCertidao){
                            
                            idDocumentoSalvo = $scope.documentosSalvos[i].id;
                        }
                    }
                }
                
                if(idDocumentoSalvo){
                    sql = "UPDATE documentos SET"+
                        " numeroMatricula = upper(?), numeroFolha = upper(?), numeroTermo = upper(?), numeroLivro = upper(?), dataEmissao = ?, numeroCartorio = upper(?), excluido = ?, codigoUsuario = ?"+
                        " WHERE id = ?";
                    parametros.push($scope.documentosBind.numeroMatriculaCertidao);
                    parametros.push($scope.documentosBind.numeroFolhaCertidao);
                    parametros.push($scope.documentosBind.numeroTermoCertidao);
                    parametros.push($scope.documentosBind.numeroLivroCertidao);
                    parametros.push($scope.documentosBind.dataEmissaoCertidao.getTime() / 1000);
                    parametros.push($scope.documentosBind.numeroCartorioCertidao);
                    parametros.push('N');
                    parametros.push($scope.usuario.id);
                    parametros.push(idDocumentoSalvo);
                }else{
                    sql = "INSERT INTO documentos "+
                        " (excluido, tipoDocumento, codigoPaciente, numeroMatricula, numeroFolha, numeroTermo, numeroLivro, dataEmissao, numeroCartorio, codigoUsuario)"+
                        " VALUES (?,?,?,upper(?),upper(?),upper(?),upper(?),?,upper(?),?)";
                    parametros.push('N');
                    parametros.push($scope.documentosBind.tipoDocumentoCertidao);
                    parametros.push(idPaciente);
                    parametros.push($scope.documentosBind.numeroMatriculaCertidao);
                    parametros.push($scope.documentosBind.numeroFolhaCertidao);
                    parametros.push($scope.documentosBind.numeroTermoCertidao);
                    parametros.push($scope.documentosBind.numeroLivroCertidao);
                    parametros.push($scope.documentosBind.dataEmissaoCertidao.getTime() / 1000);
                    parametros.push($scope.documentosBind.numeroCartorioCertidao);
                    parametros.push($scope.usuario.id);
                }    

                tx.executeSql(sql, parametros, function(tx, result){
                    $scope.messagePopup('Registro Salvo com Sucesso!').then(function(){
                        $scope.avancar(idPaciente);
                    });
                }, $scope.err);
            }else{
                $scope.messagePopup('Registro Salvo com Sucesso!').then(function(){
                    $scope.avancar(idPaciente);
                });
            }
        };
        
        $scope.resolverIdentidade = function(tx, idPaciente){
            if(isValid($scope.documentosBind.numeroRg)){
                var idDocumentoSalvo = null;
                var sql = null;
                var parametros = [];
                if($scope.documentosSalvos.length > 0){
                    for(var i = 0; i < $scope.documentosSalvos.length; i++){
                        if($scope.documentosSalvos[i].tipoDocumento === 1){
                            
                            idDocumentoSalvo = $scope.documentosSalvos[i].id;
                        }
                    }
                }
                
                if(idDocumentoSalvo){
                    sql = "UPDATE documentos SET"+
                        " numeroDocumento = ?, complemento = upper(?), siglaUf = upper(?), dataEmissao = ?, codigoOrgaoEmissor = ?,  excluido = ?, codigoUsuario = ? "+
                        " WHERE id = ?";
                    parametros.push($scope.documentosBind.numeroRg);
                    parametros.push($scope.documentosBind.complementoRg);
                    parametros.push($scope.documentosBind.ufRg);
                    parametros.push($scope.documentosBind.dataEmissaoRg.getTime() / 1000);
                    parametros.push($scope.documentosBind.codigoOrgaoEmissorRg);
                    parametros.push('N');
                    parametros.push($scope.usuario.id);
                    parametros.push(idDocumentoSalvo);
                }else{
                    sql = "INSERT INTO documentos "+
                        " (excluido, tipoDocumento, codigoPaciente, numeroDocumento, complemento, siglaUf, dataEmissao, codigoOrgaoEmissor, codigoUsuario)"+
                        " VALUES (?,?,?,?,upper(?),upper(?),?,?,?)";
                    parametros.push('N');
                    parametros.push(1);
                    parametros.push(idPaciente);
                    parametros.push($scope.documentosBind.numeroRg);
                    parametros.push($scope.documentosBind.complementoRg);
                    parametros.push($scope.documentosBind.ufRg);
                    parametros.push($scope.documentosBind.dataEmissaoRg.getTime() / 1000);
                    parametros.push($scope.documentosBind.codigoOrgaoEmissorRg);
                    parametros.push($scope.usuario.id);
                }    

                tx.executeSql(sql, parametros, function(tx, result){
                    $scope.resolverCertidoes(tx, idPaciente);
                }, $scope.err);
            }else{
                $scope.resolverCertidoes(tx, idPaciente);
            }
        };
        
        $scope.resolverPis = function(tx, idPaciente){
            if(isValid($scope.paciente.numeroPis)){
                var idDocumentoSalvo = null;
                var sql = null;
                var parametros = [];
                if($scope.documentosSalvos.length > 0){
                    for(var i = 0; i < $scope.documentosSalvos.length; i++){
                        if($scope.documentosSalvos[i].tipoDocumento === 9){
                            
                            idDocumentoSalvo = $scope.documentosSalvos[i].id;
                        }
                    }
                }
                
                if(idDocumentoSalvo){
                    sql = "UPDATE documentos SET"+
                        " numeroDocumento = ?, excluido = ?, codigoUsuario = ?"+
                        " WHERE id = ?";
                    parametros.push($scope.paciente.numeroPis);
                    parametros.push('N');
                    parametros.push($scope.usuario.id);
                    parametros.push(idDocumentoSalvo);
                }else{
                    sql = "INSERT INTO documentos "+
                        " (excluido, tipoDocumento, numeroDocumento, codigoPaciente, codigoUsuario)"+
                        " VALUES (?,?,?,?,?)";
                    parametros.push('N');
                    parametros.push(9);
                    parametros.push($scope.paciente.numeroPis);
                    parametros.push(idPaciente);
                    parametros.push($scope.usuario.id);
                }    

                tx.executeSql(sql, parametros, function(tx, result){
                    $scope.resolverIdentidade(tx, idPaciente);
                }, $scope.err);
            }else{
                $scope.resolverIdentidade(tx, idPaciente);
            }
        };
        
        $scope.resolverCpf = function(tx, idPaciente){
            if(isValid($scope.documentosBind.numeroCpf)){
                var idDocumentoSalvo = null;
                var sql = null;
                var parametros = [];
                if($scope.documentosSalvos.length > 0){
                    for(var i = 0; i < $scope.documentosSalvos.length; i++){
                        if($scope.documentosSalvos[i].tipoDocumento === 2){
                            
                            idDocumentoSalvo = $scope.documentosSalvos[i].id;
                        }
                    }
                }
                
                if(idDocumentoSalvo){
                    sql = "UPDATE documentos SET"+
                        " numeroDocumento = ?, excluido = ?, codigoUsuario = ?"+
                        " WHERE id = ?";
                    parametros.push($scope.documentosBind.numeroCpf);
                    parametros.push('N');
                    parametros.push($scope.usuario.id);
                    parametros.push(idDocumentoSalvo);
                }else{
                    sql = "INSERT INTO documentos "+
                        " (excluido, tipoDocumento, numeroDocumento, codigoPaciente, codigoUsuario)"+
                        " VALUES (?,?,?,?,?)";
                    parametros.push('N');
                    parametros.push(2);
                    parametros.push($scope.documentosBind.numeroCpf);
                    parametros.push(idPaciente);
                    parametros.push($scope.usuario.id);
                }    

                tx.executeSql(sql, parametros, function(tx, result){
                    $scope.resolverPis(tx, idPaciente);
                }, $scope.err);
            }else{
                $scope.resolverPis(tx, idPaciente);
            }
        };
        
        $scope.salvarPacienteEsus = function(tx, idPaciente){
            var binding = [];
            var registroPacienteEsus = '';
            if(isInvalid($scope.pacienteEsus.id)){
                registroPacienteEsus = "INSERT INTO pacienteEsus " +
                        " (codigoPaciente, dataCadastro, situacaoConjugal, codigoCbo, frequentaEscola, nivelEscolaridade,"+
                        " situacaoMercadoTrabalho, responsavelCrianca, frequentaCurandeira, participaGrupoComunitario, possuiPlanoSaude, membroComunidadeTradicional,"+
                        " comunidadeTradicional, orientacaoSexual, deficienciaAuditiva, deficienciaVisual, deficienciaFisica, deficienciaIntelectual, deficienciaOutra,"+
                        " situacaoRua, tempoRua, acompanhadoPorOutraInstituicao, nomeOutraInstituicao, recebeBeneficio, possuiReferenciaFamiliar,"+
                        " visitaFamiliarFrequentemente, grauParentesco, refeicoesDia, refeicaoRestaurantePopular, refeicaoDoacaoRestaurante, refeicaoDoacaoReligioso,"+
                        " refeicaoDoacaoPopular, refeicaoDoacaoOutros, acessoHigienePessoal, higieneBanho, higieneSanitario, higieneBucal, higieneOutros, estaGestante,"+
                        " maternidadeReferencia, pesoConsiderado, fumante, dependenteAlcool, dependenteDroga, temHipertensao, temDiabetes, teveAvc, teveInfarto,"+
                        " temHanseniase, temTuberculose, temTeveCancer, internacaoAno, causaInternacao, fezTratamentoPsiquiatrico, estaAcamado, estaDomiciliado,"+
                        " usaPlantasMedicinais, quaisPlantas, doencaCardiaca, cardiacaInsuficiencia, cardiacaOutros, cardiacaNaoSabe, doencaRins, rinsInsuficiencia,"+
                        " rinsOutros, rinsNaoSabe, doencaRespiratoria, respiratoriaAsma, respiratoriaEfisema, respiratoriaOutros, respiratoriaNaoSabe,"+
                        " outrasPraticasIntegrativas, condicaoSaude1, condicaoSaude2, condicaoSaude3, possuiDeficiencia, informaOrientacaoSexual,"+
                        " possuiSofrimentoPsiquicoGrave, utilizaProtese, proteseAuditiva, proteseMembrosSuperiores, proteseMembrosInferiores, proteseCadeiraRodas, proteseOutros, parentescoResponsavel, codigoUsuario)"+
                    " VALUES (?, strftime('%s','now'),"+
                    "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"+
                    "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"+
                    "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"+
                    "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"+
                    "?,?,?,?);";
                
            }else{
                registroPacienteEsus = "UPDATE pacienteEsus SET" +
                        " codigoPaciente = ?, situacaoConjugal = ?, codigoCbo = ?, frequentaEscola = ?, nivelEscolaridade = ?,"+
                        " situacaoMercadoTrabalho = ?, responsavelCrianca = ?, frequentaCurandeira = ?, participaGrupoComunitario = ?, possuiPlanoSaude = ?, membroComunidadeTradicional = ?,"+
                        " comunidadeTradicional = ?, orientacaoSexual = ?, deficienciaAuditiva = ?, deficienciaVisual = ?, deficienciaFisica = ?, deficienciaIntelectual = ?, deficienciaOutra = ?,"+
                        " situacaoRua = ?, tempoRua = ?, acompanhadoPorOutraInstituicao = ?, nomeOutraInstituicao = ?, recebeBeneficio = ?, possuiReferenciaFamiliar = ?,"+
                        " visitaFamiliarFrequentemente = ?, grauParentesco = ?, refeicoesDia = ?, refeicaoRestaurantePopular = ?, refeicaoDoacaoRestaurante = ?, refeicaoDoacaoReligioso = ?,"+
                        " refeicaoDoacaoPopular = ?, refeicaoDoacaoOutros = ?, acessoHigienePessoal = ?, higieneBanho = ?, higieneSanitario = ?, higieneBucal = ?, higieneOutros = ?, estaGestante = ?,"+
                        " maternidadeReferencia = ?, pesoConsiderado = ?, fumante = ?, dependenteAlcool = ?, dependenteDroga = ?, temHipertensao = ?, temDiabetes = ?, teveAvc = ?, teveInfarto = ?,"+
                        " temHanseniase = ?, temTuberculose = ?, temTeveCancer = ?, internacaoAno = ?, causaInternacao = ?, fezTratamentoPsiquiatrico = ?, estaAcamado = ?, estaDomiciliado = ?,"+
                        " usaPlantasMedicinais = ?, quaisPlantas = ?, doencaCardiaca = ?, cardiacaInsuficiencia = ?, cardiacaOutros = ?, cardiacaNaoSabe = ?, doencaRins = ?, rinsInsuficiencia = ?,"+
                        " rinsOutros = ?, rinsNaoSabe = ?, doencaRespiratoria = ?, respiratoriaAsma = ?, respiratoriaEfisema = ?, respiratoriaOutros = ?, respiratoriaNaoSabe = ?,"+
                        " outrasPraticasIntegrativas = ?, condicaoSaude1 = ?, condicaoSaude2 = ?, condicaoSaude3 = ?, possuiDeficiencia = ?, informaOrientacaoSexual = ?,"+
                        " possuiSofrimentoPsiquicoGrave = ?, utilizaProtese = ?, proteseAuditiva = ?, proteseMembrosSuperiores = ?, proteseMembrosInferiores = ?, proteseCadeiraRodas = ?, proteseOutros = ?, parentescoResponsavel = ?, codigoUsuario = ? "+
                    " WHERE id = ?";
            }
            
            binding.push(idPaciente);
            binding.push($scope.pacienteEsus.situacaoConjugal);
            binding.push($scope.pacienteEsus.codigoCbo);
            binding.push($scope.pacienteEsus.frequentaEscola);
            binding.push($scope.pacienteEsus.nivelEscolaridade);
            binding.push($scope.pacienteEsus.situacaoMercadoTrabalho);
            binding.push($scope.pacienteEsus.responsavelCrianca);
            binding.push($scope.pacienteEsus.frequentaCurandeira);
            binding.push($scope.pacienteEsus.participaGrupoComunitario);
            binding.push($scope.pacienteEsus.possuiPlanoSaude);

            binding.push(isInvalid($scope.pacienteEsus.comunidadeTradicional) ? 0 : 1);
            binding.push($scope.pacienteEsus.comunidadeTradicional);
            
            binding.push($scope.pacienteEsus.orientacaoSexual);
            binding.push($scope.pacienteEsus.deficienciaAuditiva);
            binding.push($scope.pacienteEsus.deficienciaVisual);
            binding.push($scope.pacienteEsus.deficienciaFisica);
            binding.push($scope.pacienteEsus.deficienciaIntelectual);
            binding.push($scope.pacienteEsus.deficienciaOutra);
            binding.push($scope.pacienteEsus.situacaoRua);
            binding.push($scope.pacienteEsus.tempoRua);
            
            binding.push(isInvalid($scope.pacienteEsus.nomeOutraInstituicao) ? 0 : 1);
            binding.push($scope.pacienteEsus.nomeOutraInstituicao);
            
            binding.push($scope.pacienteEsus.recebeBeneficio);
            binding.push($scope.pacienteEsus.possuiReferenciaFamiliar);
            
            binding.push(isInvalid($scope.pacienteEsus.grauParentesco) ? 0 : 1);
            binding.push($scope.pacienteEsus.grauParentesco);
            
            binding.push($scope.pacienteEsus.refeicoesDia);
            binding.push($scope.pacienteEsus.refeicaoRestaurantePopular);
            binding.push($scope.pacienteEsus.refeicaoDoacaoRestaurante);
            binding.push($scope.pacienteEsus.refeicaoDoacaoReligioso);
            binding.push($scope.pacienteEsus.refeicaoDoacaoPopular);
            binding.push($scope.pacienteEsus.refeicaoDoacaoOutros);
            binding.push(isInvalid($scope.pacienteEsus.higieneBanho) &&
                    isInvalid($scope.pacienteEsus.higieneSanitario) &&
                    isInvalid($scope.pacienteEsus.higieneBucal) &&
                    isInvalid($scope.pacienteEsus.higieneOutros) ? 0 : 1);
            binding.push($scope.pacienteEsus.higieneBanho);
            binding.push($scope.pacienteEsus.higieneSanitario);
            binding.push($scope.pacienteEsus.higieneBucal);
            binding.push($scope.pacienteEsus.higieneOutros);
            binding.push($scope.pacienteEsus.estaGestante);
            binding.push($scope.pacienteEsus.maternidadeReferencia);
            binding.push($scope.pacienteEsus.pesoConsiderado);
            binding.push($scope.pacienteEsus.fumante);
            binding.push($scope.pacienteEsus.dependenteAlcool);
            binding.push($scope.pacienteEsus.dependenteDroga);
            binding.push($scope.pacienteEsus.temHipertensao);
            binding.push($scope.pacienteEsus.temDiabetes);
            binding.push($scope.pacienteEsus.teveAvc);
            binding.push($scope.pacienteEsus.teveInfarto);
            binding.push($scope.pacienteEsus.temHanseniase);
            binding.push($scope.pacienteEsus.temTuberculose);
            binding.push($scope.pacienteEsus.temTeveCancer);
            binding.push($scope.pacienteEsus.internacaoAno);
            binding.push($scope.pacienteEsus.causaInternacao);
            binding.push($scope.pacienteEsus.fezTratamentoPsiquiatrico);
            binding.push($scope.pacienteEsus.estaAcamado);
            binding.push($scope.pacienteEsus.estaDomiciliado);
            binding.push($scope.pacienteEsus.usaPlantasMedicinais);
            binding.push($scope.pacienteEsus.quaisPlantas);

            binding.push(isInvalid($scope.pacienteEsus.cardiacaInsuficiencia) &&
                isInvalid($scope.pacienteEsus.cardiacaNaoSabe) &&
                isInvalid($scope.pacienteEsus.cardiacaOutros) ? 0 : 1);
            binding.push($scope.pacienteEsus.cardiacaInsuficiencia);
            binding.push($scope.pacienteEsus.cardiacaOutros);
            binding.push($scope.pacienteEsus.cardiacaNaoSabe);

            binding.push(isInvalid($scope.pacienteEsus.rinsInsuficiencia) &&
                isInvalid($scope.pacienteEsus.rinsOutros) &&
                isInvalid($scope.pacienteEsus.rinsNaoSabe) ? 0 : 1);
            binding.push($scope.pacienteEsus.rinsInsuficiencia);
            binding.push($scope.pacienteEsus.rinsOutros);
            binding.push($scope.pacienteEsus.rinsNaoSabe);

            binding.push(isInvalid($scope.pacienteEsus.respiratoriaAsma) &&
                isInvalid($scope.pacienteEsus.respiratoriaEfisema) &&
                isInvalid($scope.pacienteEsus.respiratoriaOutros) &&
                isInvalid($scope.pacienteEsus.respiratoriaNaoSabe) ? 0 : 1);
            binding.push($scope.pacienteEsus.respiratoriaAsma);
            binding.push($scope.pacienteEsus.respiratoriaEfisema);
            binding.push($scope.pacienteEsus.respiratoriaOutros);
            binding.push($scope.pacienteEsus.respiratoriaNaoSabe);
            
            binding.push($scope.pacienteEsus.outrasPraticasIntegrativas);
            binding.push($scope.pacienteEsus.condicaoSaude1);
            binding.push($scope.pacienteEsus.condicaoSaude2);
            binding.push($scope.pacienteEsus.condicaoSaude3);

            binding.push(isInvalid($scope.pacienteEsus.deficienciaAuditiva) &&
                isInvalid($scope.pacienteEsus.deficienciaVisual) &&
                isInvalid($scope.pacienteEsus.deficienciaFisica) &&
                isInvalid($scope.pacienteEsus.deficienciaIntelectual) &&
                isInvalid($scope.pacienteEsus.deficienciaOutra) ? 0 : 1);

            binding.push(isInvalid($scope.pacienteEsus.orientacaoSexual) ? 0 : 1);
            binding.push($scope.pacienteEsus.possuiSofrimentoPsiquicoGrave);
            
            binding.push(isInvalid($scope.pacienteEsus.proteseAuditiva) &&
                isInvalid($scope.pacienteEsus.proteseMembrosSuperiores) &&
                isInvalid($scope.pacienteEsus.proteseMembrosInferiores) &&
                isInvalid($scope.pacienteEsus.proteseCadeiraRodas) &&
                isInvalid($scope.pacienteEsus.proteseOutros) ? 0 : 1);
            binding.push($scope.pacienteEsus.proteseAuditiva);
            binding.push($scope.pacienteEsus.proteseMembrosSuperiores);
            binding.push($scope.pacienteEsus.proteseMembrosInferiores);
            binding.push($scope.pacienteEsus.proteseCadeiraRodas);
            binding.push($scope.pacienteEsus.proteseOutros);
            binding.push($scope.pacienteEsus.parentescoResponsavel);
            binding.push($scope.usuario.id);

            if(! isInvalid($scope.pacienteEsus.id)){
                binding.push($scope.pacienteEsus.id);    
            }

            tx.executeSql(registroPacienteEsus, binding, function(tx, result){
                $scope.desativarDocumentosExistentes(tx, idPaciente);
            }, $scope.err);
        };
        
        $scope.salvarPaciente = function(tx){
            var binding = [];
            var registroPaciente = '';
            if(isInvalid($scope.paciente.id)){
                registroPaciente = "INSERT INTO paciente " +
                        " (excluido, nome, apelido, dataNascimento, sexo, codigoRaca, nomeMae, nacionalidade,"+
                        " celular, telefone, telefone2, telefone3, telefone4, email, "+
                        " flagResponsavelFamiliar, codigoResponsavelFamiliar, religiao, "+
                        " localTrabalho, telefoneTrabalho, responsavel, parentescoResponsavel,"+
                        " urgenciaNome, urgenciaTelefone, urgenciaParentesco, "+
                        " codigoPais, codigoCidade, resideDesde, rendaFamiliar, codigoUsuario, rg, cpf, situacao, nis, prontuario, motivoExclusao, codigoEtniaIndigena, keyword)" +
                    " VALUES (?,upper(?),upper(?),?,?,?,upper(?),?,?,?,?,?,?,?,?,?,upper(?),upper(?),?,upper(?),upper(?),upper(?),?,upper(?),?,?,?,?,?,?,?,?,?,?,?,?,?);";
                
                binding.push('N');
            }else{
                registroPaciente = "UPDATE paciente SET" +
                        " nome = upper(?), apelido = upper(?), dataNascimento = ?, sexo = ?, codigoRaca = ?,"+
                        " nomeMae = upper(?), nacionalidade = ?, celular = ?, telefone = ?, telefone2 = ?,"+
                        " telefone3 = ?, telefone4 = ?, email = ?, flagResponsavelFamiliar = ?,"+
                        " codigoResponsavelFamiliar = ?, religiao = upper(?), localTrabalho = upper(?),"+
                        " telefoneTrabalho = ?, responsavel = upper(?), parentescoResponsavel = upper(?),"+
                        " urgenciaNome = upper(?), urgenciaTelefone = ?, urgenciaParentesco = upper(?), "+
                        " codigoPais = ?, codigoCidade = ?, resideDesde = ?, rendaFamiliar = ?, codigoUsuario = ?, rg = ?, cpf = ?, situacao = ?, nis = ?, prontuario = ?, motivoExclusao = ?, codigoEtniaIndigena = ?, keyword = ?" +
                    " WHERE id = ?";
            }
            
            binding.push($scope.paciente.nome);
            binding.push($scope.paciente.apelido);
            binding.push($scope.paciente.dataNascimento.getTime() / 1000);
            binding.push($scope.paciente.sexo);
            binding.push($scope.paciente.codigoRaca);
            binding.push($scope.paciente.nomeMae);
            binding.push($scope.paciente.nacionalidade);
            binding.push($scope.paciente.celular);
            binding.push($scope.paciente.telefone);
            binding.push($scope.paciente.telefone2);
            binding.push($scope.paciente.telefone3);
            binding.push($scope.paciente.telefone4);
            binding.push($scope.paciente.email);
            binding.push($scope.paciente.flagResponsavelFamiliar);
            binding.push($scope.paciente.codigoResponsavelFamiliar);
            binding.push($scope.paciente.religiao);
            binding.push($scope.paciente.localTrabalho);
            binding.push($scope.paciente.telefoneTrabalho);
            binding.push($scope.paciente.responsavel);
            binding.push($scope.paciente.parentescoResponsavel);
            binding.push($scope.paciente.urgenciaNome);
            binding.push($scope.paciente.urgenciaTelefone);
            binding.push($scope.paciente.urgenciaParentesco);
            binding.push($scope.paciente.codigoPais);
            binding.push($scope.paciente.codigoCidade);
            if(isValid($scope.paciente.resideDesde)){
                binding.push($scope.paciente.resideDesde.getTime() / 1000);
            }else{
                binding.push(null);
            }
            binding.push($scope.paciente.rendaFamiliar);
            binding.push($scope.usuario.id);
            binding.push($scope.documentosBind.numeroRg);
            binding.push($scope.documentosBind.numeroCpf);
            binding.push($scope.paciente.situacao);
            binding.push($scope.paciente.nis);
            binding.push($scope.paciente.prontuario);
            binding.push($scope.paciente.motivoExclusao);
            binding.push($scope.paciente.codigoEtniaIndigena);
            binding.push($scope.paciente.nome + ' ' + $scope.paciente.nomeMae + ' ' + $scope.documentosBind.numeroCpf);
            if(! isInvalid($scope.paciente.id)){
                binding.push($scope.paciente.id);    
            }

            tx.executeSql(registroPaciente, binding, function(tx, result){
                var pkPaciente = isInvalid($scope.paciente.id) ? result.insertId : $scope.paciente.id;
                
                $scope.salvarPacienteEsus(tx, pkPaciente);
            }, $scope.err);
        };

        $scope.habilitarEtnia = function(){
            for(var i = 0; i < $scope.racas.length; i++){
                $scope.bind.exibeEtnia = false;
                if($scope.racas[i].id == $scope.paciente.codigoRaca){
                    if($scope.racas[i].codigoSistema == 5){
                        $scope.bind.exibeEtnia = true;
                        break;
                    }
                }
            }
        };

        $scope.carregarRaca();
        $scope.carregarEtnias();
        $scope.carregarPaciente();

    }]);

controllers.controller('tabIndIdentificacaoCtrl', ['$scope', '$ionicModal', 'DB', '$timeout', '$celkScroll', '$cordovaDatePicker', 
    function ($scope, $ionicModal, DB, $timeout, $celkScroll, $cordovaDatePicker) {
        $scope.B = {};
        $scope.responsavelBind = {};

        //<editor-fold defaultstate="collapsed" desc="Modal Responsavel">
        $ionicModal.fromTemplateUrl('templates/modals/responsavel.html', {
            scope: $scope,
            animation: 'slide-in-up'
            //            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalResponsavel = modal;
        });
        $scope.selecionarResponsavel = function () {
            if($scope.$parent.paciente.flagResponsavelFamiliar !== 1){
                $scope.modalResponsavel.show();
                $scope.bindResponsavel = {criterioResponsavel: ''};
                $scope.novaBuscaResponsavel();
            }
        };
        $scope.responsavelSelecionado = function (item) {
            $scope.$parent.paciente.codigoResponsavelFamiliar = item.id;
            $scope.$parent.paciente.nomeResponsavel = item.nome;
            $scope.closeModalResponsavel();
        };
        $scope.closeModalResponsavel = function () {
            $scope.modalResponsavel.hide();
            $scope.bindResponsavel = {};
        };
        $scope.buscarResponsavel = function () {
            if (typeof $scope.timeResponsavel !== "undefined") {
                $timeout.cancel($scope.timeResponsavel);
            }
            $scope.timeResponsavel = $timeout(function () {
                $scope.novaBuscaResponsavel();
            }, 600);
        };

        $scope.novaBuscaResponsavel = function () {
            $scope.bindResponsavel.canLoadResponsavel = true;
            $scope.bindResponsavel.responsaveis = [];
            $scope.bindResponsavel.countResponsavel = 0;
            $celkScroll.toTop('contentResponsavel');
        };

        $scope.loadResponsavel = function () {
            var deep = 20;
            var i = $scope.bindResponsavel.countResponsavel;
            $scope.bindResponsavel.countResponsavel += deep;
            var filtro = '%' + $scope.bindResponsavel.criterioResponsavel + '%';
            DB.query("SELECT id, nome" +
                    " FROM paciente" +
                    " WHERE flagResponsavelFamiliar = 1 AND nome like ? ORDER BY nome LIMIT ?,?", [filtro, i, deep]).then(function (result) {
                var responsaveis = DB.fetchAll(result);
                if ($scope.bindResponsavel.countResponsavel === 20) {
                    $scope.bindResponsavel.responsaveis = [];
                }
                $scope.bindResponsavel.responsaveis.extend(responsaveis);

                if (responsaveis.length < deep) {
                    $scope.bindResponsavel.canLoadResponsavel = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (err) {
                console.error(err.message);
            });
        };
        //</editor-fold>

        //<editor-fold defaultstate="collapsed" desc="Modal EtniaIndigena">
        $ionicModal.fromTemplateUrl('templates/modals/etniaIndigena.html', {
            scope: $scope,
            animation: 'slide-in-up'
            //            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalEtniaIndigena = modal;
        });
        $scope.limparEtniaIndigena = function () {
            $scope.$parent.paciente.codigoEtniaIndigena = null;
            $scope.$parent.paciente.descricaoEtniaIndigena = null;
        };
        $scope.selecionarEtniaIndigena = function () {
            $scope.modalEtniaIndigena.show();
            $scope.bindEtniaIndigena = {criterioEtniaIndigena: ''};
            $scope.novaBuscaEtniaIndigena();
        };
        $scope.EtniaIndigenaSelecionada = function (item) {
            $scope.$parent.paciente.codigoEtniaIndigena = item.id;
            $scope.$parent.paciente.descricaoEtniaIndigena = item.descricao;
            $scope.closeModalEtniaIndigena();
        };
        $scope.closeModalEtniaIndigena = function () {
            $scope.modalEtniaIndigena.hide();
            $scope.bindEtniaIndigena = {};
        };
        $scope.buscarEtniaIndigena = function () {
            if (typeof $scope.timeEtniaIndigena !== "undefined") {
                $timeout.cancel($scope.timeEtniaIndigena);
            }
            $scope.timeEtniaIndigena = $timeout(function () {
                $scope.novaBuscaEtniaIndigena();
            }, 600);
        };

        $scope.novaBuscaEtniaIndigena = function () {
            $scope.bindEtniaIndigena.canLoadEtniaIndigena = true;
            $scope.bindEtniaIndigena.etnias = [];
            $scope.bindEtniaIndigena.countEtniaIndigena = 0;
            $celkScroll.toTop('contentEtniaIndigena');
        };

        $scope.loadEtniaIndigena = function () {
            var deep = 20;
            var i = $scope.bindEtniaIndigena.countEtniaIndigena;
            $scope.bindEtniaIndigena.countEtniaIndigena += deep;
            var filtro = '%' + $scope.bindEtniaIndigena.criterioEtniaIndigena + '%';
            DB.query("SELECT id, descricao" +
                    " FROM etniaIndigena" +
                    " WHERE descricao like ? ORDER BY descricao LIMIT ?,?", [filtro, i, deep]).then(function (result) {
                var etnias = DB.fetchAll(result);
                if ($scope.bindEtniaIndigena.countEtniaIndigena === 20) {
                    $scope.bindEtniaIndigena.etnias = [];
                }
                $scope.bindEtniaIndigena.etnias.extend(etnias);

                if (etnias.length < deep) {
                    $scope.bindEtniaIndigena.canLoadEtniaIndigena = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (err) {
                console.error(err.message);
            });
        };
        //</editor-fold>
        
        //<editor-fold defaultstate="collapsed" desc="Modal Pais">
        $ionicModal.fromTemplateUrl('templates/modals/pais.html', {
            scope: $scope,
            animation: 'slide-in-up'
            //            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalPais = modal;
        });
        $scope.limparPais = function () {
            $scope.$parent.paciente.codigoPais = null;
            $scope.$parent.paciente.descricaoPais = null;
        };
        $scope.selecionarPais = function () {
            $scope.modalPais.show();
            $scope.bindPais = {criterioPais: ''};
            $scope.novaBuscaPais();
        };
        $scope.paisSelecionado = function (item) {
            $scope.$parent.paciente.codigoPais = item.id;
            $scope.$parent.paciente.descricaoPais = item.descricao;
            $scope.closeModalPais();
        };
        $scope.closeModalPais = function () {
            $scope.modalPais.hide();
            $scope.bindPais = {};
        };
        $scope.buscarPais = function () {
            if (typeof $scope.timePais !== "undefined") {
                $timeout.cancel($scope.timePais);
            }
            $scope.timePais = $timeout(function () {
                $scope.novaBuscaPais();
            }, 600);
        };

        $scope.novaBuscaPais = function () {
            $scope.bindPais.canLoadPais = true;
            $scope.bindPais.paises = [];
            $scope.bindPais.countPais = 0;
            $celkScroll.toTop('contentPais');
        };

        $scope.loadPais = function () {
            var deep = 20;
            var i = $scope.bindPais.countPais;
            $scope.bindPais.countPais += deep;
            var filtro = '%' + $scope.bindPais.criterioPais + '%';
            DB.query("SELECT id, descricao" +
                    " FROM pais" +
                    " WHERE descricao like ? ORDER BY ordem, descricao LIMIT ?,?", [filtro, i, deep]).then(function (result) {
                var paises = DB.fetchAll(result);
                if ($scope.bindPais.countPais === 20) {
                    $scope.bindPais.paises = [];
                }
                $scope.bindPais.paises.extend(paises);

                if (paises.length < deep) {
                    $scope.bindPais.canLoadPais = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (err) {
                console.error(err.message);
            });
        };
        //</editor-fold>

        //<editor-fold defaultstate="collapsed" desc="Modal Cidade">
        $ionicModal.fromTemplateUrl('templates/modals/cidade.html', {
            scope: $scope,
            animation: 'slide-in-up',
            //            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalCidade = modal;
        });
        $scope.limparCidade = function () {
            $scope.$parent.paciente.codigoCidade = null;
            $scope.$parent.paciente.descricaoCidade = null;
        };
        $scope.selecionarCidade = function () {
            $scope.modalCidade.show();
            $scope.bindCidade = {criterioCidade: ''};
            $scope.novaBuscaCidade();
        };
        $scope.cidadeSelecionada = function (item) {
            $scope.$parent.paciente.codigoCidade = item.id;
            $scope.$parent.paciente.descricaoCidade = item.descricao + ' - ' + item.siglaEstado;
            $scope.closeModalCidade();
        };
        $scope.closeModalCidade = function () {
            $scope.modalCidade.hide();
            $scope.bindCidade = {};
        };
        $scope.buscarCidade = function () {
            if (typeof $scope.timeCidade !== "undefined") {
                $timeout.cancel($scope.timeCidade);
            }
            $scope.timeCidade = $timeout(function () {
                $scope.novaBuscaCidade();
            }, 600);
        };

        $scope.novaBuscaCidade = function () {
            $scope.bindCidade.canLoadCidade = true;
            $scope.bindCidade.cidades = [];
            $scope.bindCidade.countCidade = 0;
            $celkScroll.toTop('contentCidade');
        };

        $scope.loadCidade = function () {
            var deep = 20;
            var i = $scope.bindCidade.countCidade;
            $scope.bindCidade.countCidade += deep;
            var filtro = '%' + $scope.bindCidade.criterioCidade + '%';
            DB.query("SELECT c.id, c.descricao, e.sigla AS siglaEstado" +
                    " FROM cidade AS c" +
                    " LEFT JOIN estado AS e ON c.codigoEstado = e.id" +
                    " WHERE c.descricao like ? ORDER BY c.descricao LIMIT ?,?", [filtro, i, deep]).then(function (result) {
                var cidades = DB.fetchAll(result);
                if ($scope.bindCidade.countCidade === 20) {
                    $scope.bindCidade.cidades = [];
                }
                $scope.bindCidade.cidades.extend(cidades);

                if (cidades.length < deep) {
                    $scope.bindCidade.canLoadCidade = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (err) {
                console.error(err.message);
            });
        };
        //</editor-fold>

        $scope.B.watchRemover = $scope.$watch(function(scope) { return scope.$parent.paciente.flagResponsavelFamiliar; },
            function(newValue, oldValue, scope) {
                if(newValue === 1){
                    scope.$parent.paciente.codigoResponsavelFamiliar = null;
                    scope.$parent.paciente.nomeResponsavel = '';
                    scope.$parent.pacienteEsus.parentescoResponsavel = null;
                }
            }
        );

        $scope.B.watchRemoverSituacao = $scope.$watch(function(scope) { return scope.$parent.paciente.situacao; },
            function(newValue, oldValue, scope) {
                if(newValue == 0){
                    scope.$parent.paciente.motivoExclusao = '';
                }
            }
        );

        $scope.limparResideDesde = function(){
            $scope.paciente.resideDesde = null;
        };
        
        $scope.changeResideDesde = function(){
            var options = {
                date: new Date(),
                mode: 'date'
              };            
            
            $cordovaDatePicker.show(options).then(function (date) {
                if(date){
                    $scope.paciente.resideDesde = date;
                }
            });
        };
        
        $scope.limparDataNascimento = function(){
            $scope.paciente.dataNascimento = null;
        };
        
        $scope.changeDataNascimento = function(){
            var options = {
                date: new Date(),
                mode: 'date'
              };
            
            $cordovaDatePicker.show(options).then(function (date) {
                if(date){
                    $scope.paciente.dataNascimento = date;
                }
            });
        };
        
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            if($scope.modalResponsavel){
                $scope.modalResponsavel.remove();
            }
            if($scope.modalEtniaIndigena){
                $scope.modalEtniaIndigena.remove();
            }
            if($scope.modalPais){
                $scope.modalPais.remove();
            }
            if($scope.modalCidade){
                $scope.modalCidade.remove();
            }
            $scope.B.watchRemover();
            $scope.B.watchRemoverSituacao();
        });
    }]);

controllers.controller('tabInfoSocioCtrl', ['$scope', '$ionicModal', 'DB', '$timeout', '$celkScroll', 
    function ($scope, $ionicModal, DB, $timeout, $celkScroll) {
        $scope.infoSocioBind = {};

        //<editor-fold defaultstate="collapsed" desc="Modal CBO">
        $ionicModal.fromTemplateUrl('templates/modals/cbo.html', {
            scope: $scope,
            animation: 'slide-in-up'
            //            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalCbo = modal;
        });
        $scope.limparCbo = function () {
            $scope.$parent.pacienteEsus.codigoCbo = null;
            $scope.$parent.pacienteEsus.descricaoCbo = null;
        };
        $scope.selecionarCbo = function () {
            $scope.modalCbo.show();
            $scope.bindCbo = {criterioCbo: ''};
            $scope.novaBuscaCbo();
        };
        $scope.cboSelecionado = function (item) {
            $scope.$parent.pacienteEsus.codigoCbo = item.id;
            $scope.$parent.pacienteEsus.descricaoCbo = item.descricao;
            $scope.closeModalCbo();
        };
        $scope.closeModalCbo = function () {
            $scope.modalCbo.hide();
            $scope.bindCbo = {};
        };
        $scope.buscarCbo = function () {
            if (typeof $scope.timeCbo !== "undefined") {
                $timeout.cancel($scope.timeCbo);
            }
            $scope.timeCbo = $timeout(function () {
                $scope.novaBuscaCbo();
            }, 600);
        };

        $scope.novaBuscaCbo = function () {
            $scope.bindCbo.canLoadCbo = true;
            $scope.bindCbo.cbos = [];
            $scope.bindCbo.countCbo = 0;
            $celkScroll.toTop('contentCbo');
        };

        $scope.loadCbo = function () {
            var deep = 20;
            var i = $scope.bindCbo.countCbo;
            $scope.bindCbo.countCbo += deep;
            var filtro = '%' + $scope.bindCbo.criterioCbo + '%';
            DB.query("SELECT id, descricao" +
                    " FROM cbo" +
                    " WHERE descricao like ? ORDER BY descricao LIMIT ?,?", [filtro, i, deep]).then(function (result) {
                var paises = DB.fetchAll(result);
                if ($scope.bindCbo.countCbo === 20) {
                    $scope.bindCbo.cbos = [];
                }
                $scope.bindCbo.cbos.extend(paises);

                if (paises.length < deep) {
                    $scope.bindCbo.canLoadCbo = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (err) {
                console.error(err.message);
            });
        };
        //</editor-fold>

        //<editor-fold defaultstate="collapsed" desc="Modal Deficiencias">
        $ionicModal.fromTemplateUrl('templates/modals/deficiencias.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalDeficiencias = modal;
        });
        
        $scope.$on('modal.hidden', function() {
            $scope.descricaoDeficiencias();
           });   
           
        $scope.fecharDeficiencias = function(){
            $scope.modalDeficiencias.hide();
        };
        
        $scope.escolherDeficiencias = function(){
            $scope.modalDeficiencias.show();
        };
        
        $scope.descricaoDeficiencias = function(){
            $scope.infoSocioBind.descricaoDeficiencias = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.deficienciaAuditiva === 1){
                $scope.infoSocioBind.descricaoDeficiencias = 'Auditiva';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.deficienciaVisual === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoDeficiencias += ', ';
                }
                $scope.infoSocioBind.descricaoDeficiencias += 'Visual';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.deficienciaFisica === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoDeficiencias += ', ';
                }
                $scope.infoSocioBind.descricaoDeficiencias += 'Física';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.deficienciaIntelectual === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoDeficiencias += ', ';
                }
                $scope.infoSocioBind.descricaoDeficiencias += 'Intelectual/Cognitiva';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.deficienciaOutra === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoDeficiencias += ', ';
                }
                $scope.infoSocioBind.descricaoDeficiencias += 'Outra';
            }
        };
        //</editor-fold>

        //<editor-fold defaultstate="collapsed" desc="Modal Proteses">
        $ionicModal.fromTemplateUrl('templates/modals/proteses.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalProteses = modal;
        });
        
        $scope.$on('modal.hidden', function() {
            $scope.descricaoProteses();
           });   
           
        $scope.fecharProteses = function(){
            $scope.modalProteses.hide();
        };
        
        $scope.escolherProteses = function(){
            $scope.modalProteses.show();
        };
        
        $scope.descricaoProteses = function(){
            $scope.infoSocioBind.descricaoProteses = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.proteseAuditiva === 1){
                $scope.infoSocioBind.descricaoProteses = 'Auditiva';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.proteseMembrosSuperiores === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoProteses += ', ';
                }
                $scope.infoSocioBind.descricaoProteses += 'Membros Superiores';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.proteseMembrosInferiores === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoProteses += ', ';
                }
                $scope.infoSocioBind.descricaoProteses += 'Membros Inferiores';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.proteseCadeiraRodas === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoProteses += ', ';
                }
                $scope.infoSocioBind.descricaoProteses += 'Cadeira de Rodas';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.proteseOutros === 1){
                if(addComma){
                    $scope.infoSocioBind.descricaoProteses += ', ';
                }
                $scope.infoSocioBind.descricaoProteses += 'Outra';
            }
        };
        //</editor-fold>

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modalCbo.remove();
            $scope.modalDeficiencias.remove();
            $scope.modalProteses.remove();
        });

        if($scope.$parent.pacienteEsus){
            $scope.descricaoDeficiencias();
            $scope.descricaoProteses();
        }

    }]);

controllers.controller('tabSituacaoRuaCtrl', ['$scope', '$ionicModal', 
    function ($scope, $ionicModal) {
        $scope.situacaoRuaBind = {};

        //<editor-fold defaultstate="collapsed" desc="Modal Origem Alimentacao">
        $ionicModal.fromTemplateUrl('templates/modals/origemAlimentacao.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalOrigemAlimentacao = modal;
        });
        
        $scope.$on('modal.hidden', function() {
            $scope.descricaoOrigemAlimentacao();
           });   
           
        $scope.fecharOrigemAlimentacao = function(){
            $scope.modalOrigemAlimentacao.hide();
        };
        
        $scope.escolherOrigemAlimentacao = function(){
            $scope.modalOrigemAlimentacao.show();
        };
        
        $scope.descricaoOrigemAlimentacao = function(){
            $scope.situacaoRuaBind.descricaoOrigemAlimentacao = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.refeicaoRestaurantePopular === 1){
                $scope.situacaoRuaBind.descricaoOrigemAlimentacao = 'Restaurante Popular';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.refeicaoDoacaoReligioso === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoOrigemAlimentacao += ', ';
                }
                $scope.situacaoRuaBind.descricaoOrigemAlimentacao += 'Doação de Grupo Religioso';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.refeicaoDoacaoRestaurante === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoOrigemAlimentacao += ', ';
                }
                $scope.situacaoRuaBind.descricaoOrigemAlimentacao += 'Doação de Restaurante';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.refeicaoDoacaoPopular === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoOrigemAlimentacao += ', ';
                }
                $scope.situacaoRuaBind.descricaoOrigemAlimentacao += 'Doação de Popular';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.refeicaoDoacaoOutros === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoOrigemAlimentacao += ', ';
                }
                $scope.situacaoRuaBind.descricaoOrigemAlimentacao += 'Outros';
            }
        };
        //</editor-fold>

        //<editor-fold defaultstate="collapsed" desc="Modal Higiene Pessoal">
        $ionicModal.fromTemplateUrl('templates/modals/higienePessoal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalHigienePessoal = modal;
        });
        
        $scope.$on('modal.hidden', function() {
            $scope.descricaoHigienePessoal();
           });   
           
        $scope.fecharHigienePessoal = function(){
            $scope.modalHigienePessoal.hide();
        };
        
        $scope.escolherHigienePessoal = function(){
            $scope.modalHigienePessoal.show();
        };
        
        $scope.descricaoHigienePessoal = function(){
            $scope.situacaoRuaBind.descricaoHigienePessoal = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.higieneBanho === 1){
                $scope.situacaoRuaBind.descricaoHigienePessoal = 'Banho';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.higieneSanitario === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoHigienePessoal += ', ';
                }
                $scope.situacaoRuaBind.descricaoHigienePessoal += 'Acesso ao Sanitário';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.higieneBucal === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoHigienePessoal += ', ';
                }
                $scope.situacaoRuaBind.descricaoHigienePessoal += 'Higiene Bucal';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.higieneOutros === 1){
                if(addComma){
                    $scope.situacaoRuaBind.descricaoHigienePessoal += ', ';
                }
                $scope.situacaoRuaBind.descricaoHigienePessoal += 'Outros';
            }
        };
        //</editor-fold>

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modalOrigemAlimentacao.remove();
            $scope.modalHigienePessoal.remove();
        });

        if($scope.$parent.pacienteEsus){
            $scope.descricaoOrigemAlimentacao();
            $scope.descricaoHigienePessoal();
        }
    }]);

controllers.controller('tabCondicoesSaudeCtrl', ['$scope', '$ionicModal',
    function ($scope, $ionicModal) {
        $scope.condicoesSaudeBind = {};

        //<editor-fold defaultstate="collapsed" desc="Modal Doenca Cardiaca">
        $ionicModal.fromTemplateUrl('templates/modals/doencaCardiaca.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalDoencaCardiaca = modal;
        });
        
        $scope.fecharDoencaCardiaca = function(){
            $scope.modalDoencaCardiaca.hide();
        };
        
        $scope.escolherDoencaCardiaca = function(){
            $scope.modalDoencaCardiaca.show();
        };
        
        $scope.descricaoDoencaCardiaca = function(){
            $scope.condicoesSaudeBind.descricaoDoencaCardiaca = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.cardiacaInsuficiencia === 1){
                $scope.condicoesSaudeBind.descricaoDoencaCardiaca = 'Insufuciência Cardíaca';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.cardiacaOutros === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaCardiaca += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaCardiaca += 'Outra';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.cardiacaNaoSabe === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaCardiaca += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaCardiaca += 'Não Sabe';
            }
        };
        //</editor-fold>
        
        //<editor-fold defaultstate="collapsed" desc="Modal Doenca Rins">
        $ionicModal.fromTemplateUrl('templates/modals/doencaRins.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalDoencaRins = modal;
        });
           
        $scope.fecharDoencaRins = function(){
            $scope.modalDoencaRins.hide();
        };
        
        $scope.escolherDoencaRins = function(){
            $scope.modalDoencaRins.show();
        };
        
        $scope.descricaoDoencaRins = function(){
            $scope.condicoesSaudeBind.descricaoDoencaRins = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.rinsInsuficiencia === 1){
                $scope.condicoesSaudeBind.descricaoDoencaRins = 'Insuficiência Cardíaca';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.rinsOutros === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaRins += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaRins += 'Outra';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.rinsNaoSabe === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaRins += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaRins += 'Não Sabe';
            }
        };
        //</editor-fold>
        
        //<editor-fold defaultstate="collapsed" desc="Modal Doenca Respiratoria">
        $ionicModal.fromTemplateUrl('templates/modals/doencaRespiratoria.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalDoencaRespiratoria = modal;
        });
           
        $scope.fecharDoencaRespiratoria = function(){
            $scope.modalDoencaRespiratoria.hide();
        };
        
        $scope.escolherDoencaRespiratoria = function(){
            $scope.modalDoencaRespiratoria.show();
        };
        
        $scope.descricaoDoencaRespiratoria = function(){
            $scope.condicoesSaudeBind.descricaoDoencaRespiratoria = '';
            var addComma = false;
            if($scope.$parent.pacienteEsus.respiratoriaAsma === 1){
                $scope.condicoesSaudeBind.descricaoDoencaRespiratoria = 'Asma';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.respiratoriaEfisema === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaRespiratoria += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaRespiratoria += 'DPOC/Efisema';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.respiratoriaOutros === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaRespiratoria += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaRespiratoria += 'Outra';
                addComma = true;
            }
            if($scope.$parent.pacienteEsus.respiratoriaNaoSabe === 1){
                if(addComma){
                    $scope.condicoesSaudeBind.descricaoDoencaRespiratoria += ', ';
                }
                $scope.condicoesSaudeBind.descricaoDoencaRespiratoria += 'Não Sabe';
            }
        };
        //</editor-fold>

        $scope.$on('modal.hidden', function() {
            $scope.descricaoDoencaCardiaca();
            $scope.descricaoDoencaRins();
            $scope.descricaoDoencaRespiratoria();
           });   

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modalDoencaCardiaca.remove();
            $scope.modalDoencaRins.remove();
            $scope.modalDoencaRespiratoria.remove();
        });

        if($scope.$parent.pacienteEsus){
            $scope.descricaoDoencaCardiaca();
            $scope.descricaoDoencaRins();
            $scope.descricaoDoencaRespiratoria();
        }
    }]);

controllers.controller('tabDocumentosCtrl', ['$scope', '$ionicModal', 'DB', '$timeout', '$celkScroll', '$cordovaDatePicker',
    function ($scope, $ionicModal, DB, $timeout, $celkScroll, $cordovaDatePicker) {
        
        //<editor-fold defaultstate="collapsed" desc="Modal Orgao Emissor">
        $ionicModal.fromTemplateUrl('templates/modals/orgaoEmissor.html', {
            scope: $scope,
            animation: 'slide-in-up'
            //            focusFirstInput: true
        }).then(function (modal) {
            $scope.modalOrgaoEmissor = modal;
        });
        $scope.limparOrgaoEmissor = function () {
            $scope.$parent.documentosBind.codigoOrgaoEmissorRg = null;
            $scope.$parent.documentosBind.siglaOrgaoEmissorRg = null;
            $scope.$parent.documentosBind.descricaoOrgaoEmissorRg = null;
        };
        $scope.selecionarOrgaoEmissor = function () {
            $scope.modalOrgaoEmissor.show();
            $scope.bindOrgaoEmissor = {criterioOrgaoEmissor: ''};
            $scope.novaBuscaOrgaoEmissor();
        };
        $scope.orgaoEmissorSelecionado = function (item) {
            $scope.$parent.documentosBind.codigoOrgaoEmissorRg = item.id;
            $scope.$parent.documentosBind.siglaOrgaoEmissorRg = item.sigla;
            $scope.$parent.documentosBind.descricaoOrgaoEmissorRg = item.descricao;
            $scope.closeModalOrgaoEmissor();
        };
        $scope.closeModalOrgaoEmissor = function () {
            $scope.modalOrgaoEmissor.hide();
            $scope.bindOrgaoEmissor = {};
        };
        $scope.buscarOrgaoEmissor = function () {
            if (typeof $scope.timeOrgaoEmissor !== "undefined") {
                $timeout.cancel($scope.timeOrgaoEmissor);
            }
            $scope.timeOrgaoEmissor = $timeout(function () {
                $scope.novaBuscaOrgaoEmissor();
            }, 600);
        };

        $scope.novaBuscaOrgaoEmissor = function () {
            $scope.bindOrgaoEmissor.canLoadOrgaoEmissor = true;
            $scope.bindOrgaoEmissor.orgaos = [];
            $scope.bindOrgaoEmissor.countOrgaoEmissor = 0;
            $celkScroll.toTop('contentOrgaoEmissor');
        };

        $scope.loadOrgaoEmissor = function () {
            var deep = 20;
            var i = $scope.bindOrgaoEmissor.countOrgaoEmissor;
            $scope.bindOrgaoEmissor.countOrgaoEmissor += deep;
            var filtro = '%' + $scope.bindOrgaoEmissor.criterioOrgaoEmissor + '%';
            DB.query("SELECT id, descricao, sigla" +
                    " FROM orgaoEmissor" +
                    " WHERE descricao like ? ORDER BY descricao LIMIT ?,?", [filtro, i, deep]).then(function (result) {
                var orgaos = DB.fetchAll(result);
                if ($scope.bindOrgaoEmissor.countOrgaoEmissor === 20) {
                    $scope.bindOrgaoEmissor.orgaos = [];
                }
                $scope.bindOrgaoEmissor.orgaos.extend(orgaos);

                if (orgaos.length < deep) {
                    $scope.bindOrgaoEmissor.canLoadOrgaoEmissor = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (err) {
                console.error(err.message);
            });
        };
        //</editor-fold>
        
        $scope.descricaoTipoCertidao = function(){
            if($scope.$parent.documentosBind.tipoDocumentoCertidao === 91){
                $scope.documentosBind.descricaoTipoDocumento = "Certidão de Nascimento";
            }else{
                $scope.documentosBind.descricaoTipoDocumento = "Certidão de Casamento";
            }
        };

        $scope.limparDataEmissaoRg = function(){
            $scope.documentosBind.dataEmissaoRg = null;
        };
        
        $scope.changeDataEmissaoRg = function(){
            var options = {
                date: new Date(),
                mode: 'date'
              };
            
            $cordovaDatePicker.show(options).then(function (date) {
                if(date){
                    $scope.documentosBind.dataEmissaoRg = date;
                }
            });
        };

        $scope.watchRemover = $scope.$watch(function(scope) { return scope.$parent.documentosBind.numeroMatriculaCertidao; },
            function(newValue, oldValue, scope) {
                if(isValid(newValue)){
                    var numero = newValue.replace('[^0-9]', '');
                    if(numero.length === 32){
                        var tipoCertidao = numero.substring(14, 15);
                        if (tipoCertidao == '1') {
                            scope.documentosBind.tipoDocumentoCertidao = 91;
                        } else if (tipoCertidao == '2') {
                            scope.documentosBind.tipoDocumentoCertidao = 92;
                        }
                        scope.documentosBind.numeroFolhaCertidao = numero.substring(20, 23);
                        scope.documentosBind.numeroTermoCertidao = numero.substring(23, 30);
                        scope.documentosBind.numeroLivroCertidao = numero.substring(15, 20);
                        scope.documentosBind.numeroCartorioCertidao = numero.substring(0, 6);
                    }
                }
            }
        );

        $scope.limparDataEmissaoCertidao = function(){
            $scope.documentosBind.dataEmissaoCertidao = null;
        };
        
        $scope.changeDataEmissaoCertidao = function(){
            var options = {
                date: new Date(),
                mode: 'date'
              };
            
            $cordovaDatePicker.show(options).then(function (date) {
                if(date){
                    $scope.documentosBind.dataEmissaoCertidao = date;
                }
            });
        };

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modalOrgaoEmissor.remove();
            $scope.watchRemover();
        });

    }]);

