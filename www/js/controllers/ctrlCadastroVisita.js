var motivosAc = [];
var loaded = false;
controllers.controller('cadastroVisitaCtrl', ['$scope', '$state', 'DB', '$stateParams', '$ionicLoading', '$ionicPopup', '$q', '$ionicPlatform', 'temporario', '$cordovaGeolocation',
    function($scope, $state, DB, $stateParams, $ionicLoading, $ionicPopup, $q, $ionicPlatform, temporario, $cordovaGeolocation) {
        $scope.verBotaoVoltar = true;
        $scope.verBotaoSalvar = true;

        $ionicLoading.show({
            template: 'Carregando...'
        });
        $scope.bind = {
            notificacoes: ""
        };

        $scope.tituloPrincipal = 'Cadastro de Visita';
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));
        $scope.bind.idDomicilio = $stateParams.idDomicilio;

        $scope.domicilio = {};

        $scope.limpar = function() {
            $scope.bind.codigoPesquisa = null;
            $scope.bind.perguntas = null;
            $scope.visita = {
                compartilhada: 0,
                motivoAtualizacao: 0,
                motivoVisitaPeriodica: 0,
                motivoBaConsulta: 0,
                motivoBaExame: 0,
                motivoBaVacina: 0,
                motivoBaCondicionalidadesBolsaFamilia: 0,
                motivoAcGestante: 0,
                motivoAcPuerpera: 0,
                motivoAcRecemNascido: 0,
                motivoAcCrianca: 0,
                motivoAcPessoaDesnutrida: 0,
                motivoAcPessoaDeficiente: 0,
                motivoAcPessoaHipertensa: 0,
                motivoAcPessoaDiabetes: 0,
                motivoAcPessoaAsmatica: 0,
                motivoAcPessoaEnfisema: 0,
                motivoAcPessoaCancer: 0,
                motivoAcPessoaDoencaCronica: 0,
                motivoAcPessoaHanseniase: 0,
                motivoAcPessoaTuberculose: 0,
                motivoAcAcamado: 0,
                motivoAcVulnerabilidadeSocial: 0,
                motivoAcCondicionalidadesBolsaFamilia: 0,
                motivoAcSaudeMental: 0,
                motivoAcUsuarioAlcool: 0,
                motivoAcUsuarioDroga: 0,
                motivoEgressoInternacao: 0,
                motivoControleAmbientesVetores: 0,
                motivoCampanhaSaude: 0,
                motivoPrevencao: 0,
                motivoOutros: 0
            };
        };
        $scope.limpar();

        $scope.loadData = function() {
            if (!loaded) {
                $scope.visita.motivoAcGestante = motivosAc.motivoAcGestante;
                $scope.visita.motivoAcCrianca = motivosAc.motivoAcCrianca;
                $scope.visita.motivoAcPessoaDeficiente = motivosAc.motivoAcPessoaDeficiente;
                $scope.visita.motivoAcPessoaHipertensa = motivosAc.motivoAcPessoaHipertensao;
                $scope.visita.motivoAcPessoaDiabetes = motivosAc.motivoAcPessoaDiabetes;
                $scope.visita.motivoAcPessoaAsmatica = motivosAc.motivoAcPessoaAsmatica;
                $scope.visita.motivoAcPessoaEnfisema = motivosAc.motivoAcPessoaEnfisema;
                $scope.visita.motivoAcPessoaCancer = motivosAc.motivoAcPessoaCancer;
                $scope.visita.motivoAcPessoaHanseniase = motivosAc.motivoAcPessoaHanseniase;
                $scope.visita.motivoAcPessoaTuberculose = motivosAc.motivoAcPessoaTuberculose;
                $scope.visita.motivoAcAcamado = motivosAc.motivoAcAcamado;
                $scope.visita.motivoAcSaudeMental = motivosAc.motivoAcSaudeMental;
                $scope.visita.motivoAcUsuarioAlcool = motivosAc.motivoAcUsuarioAlcool;
                $scope.visita.motivoAcUsuarioDroga = motivosAc.motivoAcUsuarioDroga;
                loaded = true;
            }
        }



        //  $scope.loadData();

        $scope.salvarTemporario = function() {
            var temporario = {
                visita: $scope.visita,
                bind: $scope.bind,
                domicilio: $scope.domicilio
            };
            window.localStorage.setItem("tempVisita", JSON.stringify(temporario));
        };

        $scope.acaoVoltar = function() {
            $state.go('visitas');
        };

        $scope.carregarDomicilio = function() {
            DB.query("SELECT d.id," +
                " d.numeroFamilia, " +
                " d.codigoMicroArea, " +
                " tipLog.id AS codigoTipoLogradouro, " +
                " tipLog.descricao AS descricaoTipoLogradouro, " +
                " end.id AS codigoEndereco, " +
                " end.logradouro, " +
                " end.bairro, " +
                " end.numeroLogradouro, " +
                " end.codigoCidade, " +
                " end.complementoLogradouro, " +
                " end.pontoReferencia, " +
                " cast(end.cep as number) AS cep, " +
                " end.telefone, " +
                " end.telefoneReferencia " +
                " FROM domicilio AS d " +
                "  left outer join endereco AS end ON d.codigoEndereco = end.id " +
                "  left outer join tipoLogradouro AS tipLog ON end.codigoTipoLogradouro = tipLog.id " +
                " WHERE d.id = ?", [$scope.bind.idDomicilio]).then(function(result) {

                var domicilio = DB.fetch(result);
                $scope.domicilio = domicilio;

                $scope.carregarIndividuos();
            }, function(err) {
                console.error(err.message);
            });
        };

        $scope.carregarIndividuos = function() {
            DB.query("SELECT p.id," +
                " p.nome, " +
                " p.sexo, " +
                " p.nomeMae, " +
                " (strftime('%Y', 'now') - strftime('%Y', dataNascimento, 'unixepoch')) - (strftime('%m-%d', 'now') < strftime('%m-%d', dataNascimento, 'unixepoch')) AS idadeAnos, " +
                " pd.id AS idPacienteDado, " +
                " pd.peso, " +
                " pd.altura, " +
                " pd.peso AS pesoOriginal, " +
                " pd.altura AS alturaOriginal, " +
                " strftime('%d/%m/%Y',p.dataNascimento, 'unixepoch') AS dataNascimento, " +
                " (select cns.id from cns AS cns where cns.codigoPaciente = p.id and cns.excluido = 'N' order by cns.numeroCartao limit 1) AS cnsId " +
                " FROM paciente AS p " +
                " LEFT JOIN pacienteDado pd ON p.id = pd.codigoPaciente " +
                " WHERE p.codigoDomicilio = ?", [$scope.bind.idDomicilio]).then(function(result) {

                var individuos = DB.fetchAll(result);
                $scope.domicilio.individuos = individuos;

                if (individuos.length > 0) {
                    $scope.carregarNotificacoes(individuos);
                } else {
                    $ionicLoading.hide();
                }
            }, function(err) {
                console.error(err.message);
            });
        };

        $scope.carregarNotificacoes = function(individuos) {
            var binding = [];
            var sql = "SELECT p.id AS codigoPaciente, n.vacinaAtrasada, p.registroVacina " +
                " FROM paciente AS p LEFT JOIN notificacaoPaciente AS n ON p.id = n.codigoPaciente " +
                " WHERE p.id in (";
            for (var i = 0; i < individuos.length; i++) {
                binding.push(individuos[i].id);
                sql += "?,";
            }
            sql = sql.substring(0, sql.length - 1) + ")";

            DB.query(sql, binding).then(function(result) {

                var notificaveis = DB.fetchAll(result);
                var nNotificaveis = 0;
                for (var j = 0; j < $scope.domicilio.individuos.length; j++) {
                    for (var i = 0; i < notificaveis.length; i++) {
                        if (notificaveis[i].codigoPaciente == $scope.domicilio.individuos[j].id) {
                            if (notificaveis[i].registroVacina != 1) {
                                if (isValid(notificaveis[i].vacinaAtrasada)) {
                                    $scope.domicilio.individuos[j].vacinaAtrasada = notificaveis[i].vacinaAtrasada;
                                    if (notificaveis[i].vacinaAtrasada != 0) {
                                        nNotificaveis++;
                                    }
                                } else {
                                    nNotificaveis++;
                                    $scope.domicilio.individuos[j].vacinaAtrasada = -1;
                                }
                            }
                            break;
                        }
                    }
                }
                $scope.carregarNotificacoesAgenda(individuos, nNotificaveis);
            }, function(err) {
                console.error(err.message);
            });
        };

        $scope.carregarNotificacoesAgenda = function(individuos, nNotificaveis) {
            var binding = [];
            var sql = "SELECT n.codigoPaciente FROM notificacaoAgendas AS n WHERE n.status = 1 AND n.codigoPaciente in (";
            for (var i = 0; i < individuos.length; i++) {
                binding.push(individuos[i].id);
                sql += "?,";
            }
            sql = sql.substring(0, sql.length - 1) + ") group by n.codigoPaciente";

            DB.query(sql, binding).then(function(result) {

                var notificaveis = DB.fetchAll(result);
                if (notificaveis) {
                    for (var i = 0; i < notificaveis.length; i++) {
                        for (var j = 0; j < $scope.domicilio.individuos.length; j++) {
                            if (notificaveis[i].codigoPaciente == $scope.domicilio.individuos[j].id) {
                                $scope.domicilio.individuos[j].naoComparecimento = 1;
                                nNotificaveis++;
                            }
                        }
                    }
                }
                if (nNotificaveis > 0) {
                    $scope.bind.notificacoes = nNotificaveis;
                }

                $ionicLoading.hide();
            }, function(err) {
                console.error(err.message);
            });
        };

        $scope.showConfirmation = function(mensagem) {
            var deferred = $q.defer();
            var alertPopup = $ionicPopup.confirm({
                title: 'Atenção!',
                template: mensagem,
                buttons: [{
                    text: 'Não'
                }, {
                    text: '<b>Sim</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        return true;
                    }
                }]
            });
            alertPopup.then(function(resposta) {
                return deferred.resolve(resposta);
            });

            return deferred.promise;
        };

        $scope.messagePopup = function(msg) {
            $ionicLoading.hide();
            var deferred = $q.defer();

            //https://github.com/driftyco/ionic/blob/master/js/angular/service/platform.js  TO VIEW PRIORITY LIST
            var deregisterBackEvent = $ionicPlatform.registerBackButtonAction(function() {}, 501);

            $ionicPopup.alert({
                title: 'Atenção!',
                template: msg
            }).then(function() {
                deregisterBackEvent();
                deferred.resolve();
            });

            return deferred.promise;
        };

        $scope.acaoSalvar = function() {
            $ionicLoading.show({
                template: 'Salvando...'
            });
            try {
                if (isInvalid($scope.visita.codigoIndividuo)) {
                    throw "Informe o Indivíduo";
                }

                if ($scope.visita.motivoAtualizacao === 0 && $scope.visita.motivoVisitaPeriodica === 0 && $scope.visita.motivoBaConsulta === 0 && $scope.visita.motivoBaExame === 0 && $scope.visita.motivoBaVacina === 0 && $scope.visita.motivoBaCondicionalidadesBolsaFamilia === 0 && $scope.visita.motivoAcGestante === 0 && $scope.visita.motivoAcPuerpera === 0 && $scope.visita.motivoAcRecemNascido === 0 && $scope.visita.motivoAcCrianca === 0 && $scope.visita.motivoAcPessoaDesnutrida === 0 && $scope.visita.motivoAcPessoaDeficiente === 0 && $scope.visita.motivoAcPessoaHipertensa === 0 && $scope.visita.motivoAcPessoaDiabetes === 0 && $scope.visita.motivoAcPessoaAsmatica === 0 && $scope.visita.motivoAcPessoaEnfisema === 0 && $scope.visita.motivoAcPessoaCancer === 0 && $scope.visita.motivoAcPessoaDoencaCronica === 0 && $scope.visita.motivoAcPessoaHanseniase === 0 && $scope.visita.motivoAcPessoaTuberculose === 0 && $scope.visita.motivoAcAcamado === 0 && $scope.visita.motivoAcVulnerabilidadeSocial === 0 && $scope.visita.motivoAcCondicionalidadesBolsaFamilia === 0 && $scope.visita.motivoAcSaudeMental === 0 && $scope.visita.motivoAcUsuarioAlcool === 0 && $scope.visita.motivoAcUsuarioDroga === 0 && $scope.visita.motivoEgressoInternacao === 0 && $scope.visita.motivoControleAmbientesVetores === 0 && $scope.visita.motivoCampanhaSaude === 0 && $scope.visita.motivoPrevencao === 0 && $scope.visita.motivoOutros === 0) {

                    throw "Informe pelo menos um Motivo";
                }

                if (isInvalid($scope.visita.desfecho)) {
                    throw "Informe o Desfecho";
                }
            } catch (err) {
                $scope.messagePopup(err);
                return;
            }

            DB.session.transaction(function(tx) {

                if (isValid($scope.domicilio.individuos) && $scope.domicilio.individuos.length > 0) {
                    for (var i = 0; i < $scope.domicilio.individuos.length; i++) {
                        var individuo = $scope.domicilio.individuos[i];
                        if (individuo.pesoOriginal !== individuo.peso || individuo.alturaOriginal !== individuo.altura) {
                            $scope.atualizarPacienteDado(individuo, tx);
                        }
                    }
                }

                $scope.salvarVisita(tx);

            }, function(err) {
                $scope.messagePopup(err.message);
            }, function() { //Transaction success
                $scope.continuarVoltar('Continuar registrando a visita da mesma família?').then(function(resposta) {
                    if (resposta) {
                        $scope.limpar();
                        $state.go('cadastroVisitas.tabVisita');
                    } else {
                        $state.go('visitas');
                    }
                });
            });
        };

        $scope.atualizarPacienteDado = function(individuo, tx) {
            var sql = "SELECT id from pacienteDado WHERE codigoPaciente = ?";
            var param1 = [];
            param1.push(individuo.id);
            tx.executeSql(sql, param1, function(tx, result) {
                // var pacienteDado DB.fetch(result);
                individuo.idPacienteDado = result;
            });

            if (isValid(individuo.idPacienteDado)) {
                var sql = "UPDATE pacienteDado SET peso = ?, altura = ?, dataColeta = ?, codigoUsuario = ? WHERE id = ?";
                var param = [];
                param.push(individuo.peso);
                param.push(individuo.altura);
                param.push(new Date().getTime() / 1000);
                param.push($scope.usuario.id);
                param.push(individuo.idPacienteDado);
                tx.executeSql(sql, param);
            } else {
                var sql = "INSERT INTO pacienteDado (peso, altura, dataColeta, codigoPaciente, codigoUsuario) VALUES (?,?,?,?,?)";
                var param = [];
                param.push(individuo.peso);
                param.push(individuo.altura);
                param.push(new Date().getTime() / 1000);
                param.push(individuo.id);
                param.push($scope.usuario.id);
                tx.executeSql(sql, param);
            }
        };

        $scope.salvarVisita = function(tx) {
            var binding = [];
            var registroVisita = "INSERT INTO visitaDomiciliar " +
                " (codigoUsuario, codigoDomicilio, dataVisita, compartilhada, codigoPaciente," +
                " desfecho, motivoAtualizacao, motivoVisitaPeriodica, motivoBaConsulta, motivoBaExame," +
                " motivoBaVacina, motivoBaCondicionalidadesBolsaFamilia, motivoAcGestante, motivoAcPuerpera," +
                " motivoAcRecemNascido, motivoAcCrianca, motivoAcPessoaDesnutrida, motivoAcPessoaDeficiente," +
                " motivoAcPessoaHipertensa, motivoAcPessoaDiabetes, motivoAcPessoaAsmatica, motivoAcPessoaEnfisema," +
                " motivoAcPessoaCancer, motivoAcPessoaDoencaCronica, motivoAcPessoaHanseniase, motivoAcPessoaTuberculose," +
                " motivoAcAcamado, motivoAcVulnerabilidadeSocial, motivoAcCondicionalidadesBolsaFamilia, motivoAcSaudeMental," +
                " motivoAcUsuarioAlcool, motivoAcUsuarioDroga, motivoEgressoInternacao, motivoControleAmbientesVetores," +
                " motivoCampanhaSaude, motivoPrevencao, motivoOutros, latitude, longitude)" +
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?); SELECT last_insert_rowid() FROM pesquisaVisita";

            binding.push($scope.usuario.id);
            binding.push($scope.bind.idDomicilio);
            binding.push(new Date().getTime() / 1000);
            binding.push($scope.visita.compartilhada);
            binding.push($scope.visita.codigoIndividuo);
            binding.push($scope.visita.desfecho);
            binding.push($scope.visita.motivoAtualizacao);
            binding.push($scope.visita.motivoVisitaPeriodica);
            binding.push($scope.visita.motivoBaConsulta);
            binding.push($scope.visita.motivoBaExame);
            binding.push($scope.visita.motivoBaVacina);
            binding.push($scope.visita.motivoBaCondicionalidadesBolsaFamilia);
            binding.push($scope.visita.motivoAcGestante);
            binding.push($scope.visita.motivoAcPuerpera);
            binding.push($scope.visita.motivoAcRecemNascido);
            binding.push($scope.visita.motivoAcCrianca);
            binding.push($scope.visita.motivoAcPessoaDesnutrida);
            binding.push($scope.visita.motivoAcPessoaDeficiente);
            binding.push($scope.visita.motivoAcPessoaHipertensa);
            binding.push($scope.visita.motivoAcPessoaDiabetes);
            binding.push($scope.visita.motivoAcPessoaAsmatica);
            binding.push($scope.visita.motivoAcPessoaEnfisema);
            binding.push($scope.visita.motivoAcPessoaCancer);
            binding.push($scope.visita.motivoAcPessoaDoencaCronica);
            binding.push($scope.visita.motivoAcPessoaHanseniase);
            binding.push($scope.visita.motivoAcPessoaTuberculose);
            binding.push($scope.visita.motivoAcAcamado);
            binding.push($scope.visita.motivoAcVulnerabilidadeSocial);
            binding.push($scope.visita.motivoAcCondicionalidadesBolsaFamilia);
            binding.push($scope.visita.motivoAcSaudeMental);
            binding.push($scope.visita.motivoAcUsuarioAlcool);
            binding.push($scope.visita.motivoAcUsuarioDroga);
            binding.push($scope.visita.motivoEgressoInternacao);
            binding.push($scope.visita.motivoControleAmbientesVetores);
            binding.push($scope.visita.motivoCampanhaSaude);
            binding.push($scope.visita.motivoPrevencao);
            binding.push($scope.visita.motivoOutros);
            binding.push($scope.visita.latitude);
            binding.push($scope.visita.longitude);

            tx.executeSql(registroVisita, binding, function(tx, result) {
                $scope.salvarPesquisa(tx, result.insertId);
            });
        };

        $scope.salvarPesquisa = function(tx, codigoVisita) {
            if (isValid($scope.bind.codigoPesquisa)) {
                for (var i = 0; i < $scope.bind.perguntas.length; i++) {
                    if (isValid($scope.bind.perguntas[i].checked)) {
                        var binding = [];
                        var registroVisita = "INSERT INTO pesquisaVisita " +
                            " (codigoResposta, codigoVisita, codigoPesquisaPergunta, codigoUsuario)" +
                            " VALUES (?,?,?,?); ";

                        binding.push($scope.bind.perguntas[i].checked);
                        binding.push(codigoVisita);
                        binding.push($scope.bind.perguntas[i].codigoPesquisaPergunta);
                        binding.push($scope.usuario.id);

                        tx.executeSql(registroVisita, binding);
                    }
                }
            }
        };

        $scope.continuarVoltar = function(mensagem) {
            var deferred = $q.defer();
            //https://github.com/driftyco/ionic/blob/master/js/angular/service/platform.js  TO VIEW PRIORITY LIST
            var deregisterBackEvent = $ionicPlatform.registerBackButtonAction(function() {}, 501);
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.confirm({
                title: 'Registro Salvo com Sucesso!',
                template: mensagem,
                buttons: [{
                    text: 'Voltar'
                }, {
                    text: '<b>Continuar</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        return true;
                    }
                }]
            });
            alertPopup.then(function(resposta) {
                deregisterBackEvent();
                return deferred.resolve(resposta);
            });

            return deferred.promise;
        };

        $scope.pesquisarGps = function() {
            $scope.bind.gpsMsg = 'Procurando Localização...';
            $scope.bind.iconeLocalizacao = 'icon ion-looping';
            $scope.bind.gpsParado = false;
            var posOptions = {
                timeout: 60000,
                enableHighAccuracy: true
            };
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function(position) {
                    $scope.bind.gpsParado = false;
                    $scope.visita.latitude = position.coords.latitude;
                    $scope.visita.longitude = position.coords.longitude;
                    $scope.bind.gpsMsg = 'Localização encontrada';
                    $scope.bind.iconeLocalizacao = 'icon ion-earth';
                    console.log('LATITUDE: ' + $scope.visita.latitude);
                    console.log('LONGITUDE: ' + $scope.visita.longitude);
                }, function(err) {
                    $scope.bind.iconeLocalizacao = 'icon ion-eye-disabled';
                    $scope.bind.gpsMsg = 'Não foi possível determinar a localização, verifique se o GPS está ativo.';
                    console.log('CELK: ' + err.message);
                    $scope.bind.gpsParado = true;
                });
        };

        $scope.exibePerguntas = function() {
            var sql = " SELECT count(*) AS count FROM perguntaResposta t1, pesquisaPergunta t2 " +
                " left join perguntaPesquisa t3 on t2.codigoPergunta = t3.id" +
                " left join pesquisa t4 on t2.codigoPesquisa = t4.id" +
                " where t1.codigoPergunta = t2.codigoPergunta" +
                " and t4.status = 0" +
                " and strftime('%s','now', 'localtime') between t4.inicio and t4.fim";

            DB.query(sql).then(function(result) {
                result = DB.fetch(result);
                if (result.count > 0) {
                    $scope.bind.exibePerguntas = true;
                }
            });
        };

        if (temporario) {
            $scope.bind = temporario.bind;
            $scope.visita = temporario.visita;
            $scope.domicilio = temporario.domicilio;
            $scope.carregarIndividuos();
        } else {
            $scope.carregarDomicilio();
            $scope.pesquisarGps();
            $scope.exibePerguntas();
        }

    }
]);

controllers.controller('tabVisitaCtrl', ['$scope', '$ionicModal', '$state', 'DB',
    function($scope, $ionicModal, $state, DB) {

        //<editor-fold defaultstate="collapsed" desc="Modal Individuo">
        $ionicModal.fromTemplateUrl('templates/modals/individuoFamilia.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modalIndividuo = modal;
        });


        var marcarAcompanhamento = function(item) {
            var monthDiff = function monthDiff(d1, d2) {
                var months;
                months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth() + 1;
                months += d2.getMonth();
                return months <= 0 ? 0 : months;
            };


            var sql = "SELECT ifnull(estaGestante,0) as estaGestante, "+
                "ifnull(deficienciaAuditiva,0) as deficienciaAuditiva, "+
                "ifnull(deficienciaVisual,0) as deficienciaVisual,  "+
                "ifnull(deficienciaFisica,0) as deficienciaFisica,  "+
                "ifnull(deficienciaIntelectual,0) as deficienciaIntelectual,  "+
                "ifnull(deficienciaOutra,0) as deficienciaOutra,  "+
                "ifnull(temHipertensao,0) as temHipertensao,  "+
                "ifnull(temDiabetes,0) as temDiabetes,  "+
                "ifnull(respiratoriaAsma,0) as respiratoriaAsma,  "+
                "ifnull(respiratoriaEfisema,0) as respiratoriaEfisema,  "+
                "ifnull(temTeveCancer,0) as temTeveCancer,  "+
                "ifnull(temHanseniase,0) as temHanseniase,  "+
                "ifnull(temTuberculose,0) as temTuberculose,  "+
                "ifnull(estaAcamado,0) as estaAcamado,  "+
                "ifnull(estaDomiciliado,0) as estaDomiciliado,  "+
                "ifnull(possuiSofrimentoPsiquicoGrave,0) as possuiSofrimentoPsiquicoGrave,  "+
                "ifnull(fumante,0) as fumante,  "+
                "ifnull(dependenteAlcool,0) as dependenteAlcool,  "+
                "ifnull(dependenteDroga,0) as dependenteDroga "+
                   " FROM pacienteEsus WHERE codigoPaciente = ?";
            DB.query(sql, [item.id]).then(function(result) {
                var pacienteEsus = DB.fetch(result);
                if (pacienteEsus) {
                    motivosAc.motivoAcGestante = pacienteEsus.estaGestante;
                    var strDate = item.dataNascimento;
                    var dateParts = strDate.split("/");
                    var date = new Date(dateParts[2], (dateParts[0] - 1), dateParts[1]);
                    motivosAc.motivoAcCrianca = (monthDiff(date, new Date()) <= window.localStorage.idadeAcompanhamento) ? 1 : 0;
                    motivosAc.motivoAcPessoaDeficiente = (pacienteEsus.deficienciaAuditiva == 1 || pacienteEsus.deficienciaVisual == 1 || pacienteEsus.deficienciaFisica == 1 || pacienteEsus.deficienciaIntelectual == 1 || pacienteEsus.deficienciaOutra == 1) ? 1 : 0;
                    motivosAc.motivoAcPessoaHipertensao = pacienteEsus.temHipertensao;
                    motivosAc.motivoAcPessoaDiabetes = pacienteEsus.temDiabetes;
                    motivosAc.motivoAcPessoaAsmatica = pacienteEsus.respiratoriaAsma;
                    motivosAc.motivoAcPessoaEnfisema = pacienteEsus.respiratoriaEfisema;
                    motivosAc.motivoAcPessoaCancer = pacienteEsus.temTeveCancer;
                    motivosAc.motivoAcPessoaHanseniase = pacienteEsus.temHanseniase;
                    motivosAc.motivoAcPessoaTuberculose = pacienteEsus.temTuberculose;
                    motivosAc.motivoAcAcamado = (pacienteEsus.estaAcamado == 1 || pacienteEsus.estaDomiciliado == 1) ? 1 : 0;
                    motivosAc.motivoAcSaudeMental = pacienteEsus.possuiSofrimentoPsiquicoGrave;
                    //Nao possui se é fumante
                    motivosAc.motivoAcUsuarioAlcool = pacienteEsus.dependenteAlcool;
                    motivosAc.motivoAcUsuarioDroga = pacienteEsus.dependenteDroga;
                    loaded = false;
                }
            }, $scope.err);

        };

        $scope.individuoSelecionado = function(item) {
            $scope.$parent.visita.nomeIndividuo = item.nome;
            $scope.$parent.visita.codigoIndividuo = item.id;
            $scope.fecharIndividuo();
            if (isInvalid(item.cnsId)) {
                $scope.showConfirmation('O Indivíduo não possui CNS cadastrado. Deseja editar?')
                    .then(function(resp) {
                        if (resp) {
                            $scope.salvarTemporario();
                            $state.go('cadastroIndividuos.tabIdentificacao', {
                                idIndividuo: item.id
                            });
                        }
                    });
            }
            marcarAcompanhamento(item);
        };

        $scope.limparIndividuo = function() {
            $scope.$parent.visita.nomeIndividuo = '';
            $scope.$parent.visita.codigoIndividuo = '';
        };

        $scope.fecharIndividuo = function() {
            $scope.modalIndividuo.hide();
        };

        $scope.selecionarIndividuo = function() {
            $scope.modalIndividuo.show();
        };
        //</editor-fold>

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            if ($scope.modalIndividuo) {
                $scope.modalIndividuo.remove();
            }
        });
    }
]);

controllers.controller('tabMotivoCtrl', ['$scope',
    function($scope) {}
]);

controllers.controller('tabDesfechoCtrl', ['$scope',
    function($scope) {}
]);

controllers.controller('tabPesquisaCtrl', ['$scope', 'DB',
    function($scope, DB) {
        $scope.carregarPerguntas = function() {
            if (isInvalid($scope.bind.codigoPesquisa)) {
                $scope.bind.perguntas = [];
                var sql = " SELECT t2.id AS codigoPesquisaPergunta, t2.codigoPesquisa, t2.codigoPergunta, t1.id AS codigoResposta, t3.descricao AS pergunta, t1.descricao AS resposta FROM perguntaResposta t1, pesquisaPergunta t2 " +
                    " left join perguntaPesquisa t3 on t2.codigoPergunta = t3.id" +
                    " left join pesquisa t4 on t2.codigoPesquisa = t4.id" +
                    " where t1.codigoPergunta = t2.codigoPergunta" +
                    " and t4.status = 0" +
                    " and strftime('%s','now', 'localtime') between t4.inicio and t4.fim" +
                    " order by t2.codigoPesquisa, t2.codigoPergunta, t1.id";

                DB.query(sql).then(function(result) {
                    result = DB.fetchAll(result);
                    if (result.length > 0) {
                        $scope.bind.codigoPesquisa = result[0].codigoPesquisa;
                        var pergunta;
                        for (var i = 0; i < result.length; i++) {
                            if (result[i].codigoPesquisa == $scope.bind.codigoPesquisa) {
                                if (isInvalid(pergunta) || result[i].codigoPergunta != pergunta.codigo) {
                                    pergunta = {
                                        respostas: []
                                    };
                                    pergunta.codigo = result[i].codigoPergunta;
                                    pergunta.descricao = result[i].pergunta;
                                    pergunta.codigoPesquisaPergunta = result[i].codigoPesquisaPergunta;
                                    $scope.bind.perguntas.push(pergunta);
                                }
                                var resposta = {};
                                resposta.codigo = result[i].codigoResposta;
                                resposta.descricao = result[i].resposta;
                                pergunta.respostas.push(resposta);
                            } else {
                                break;
                            }
                        }
                    }
                });
            }
        };

        $scope.uncheck = function(event, pergunta, resposta) {
            if (pergunta.checkedOld == event.target.value) {
                pergunta.checkedOld = null;
                pergunta.checked = null;
            } else {
                pergunta.checkedOld = event.target.value;
            }
        };

        $scope.carregarPerguntas();
    }
]);

controllers.controller('tabIndividuosCtrl', ['$scope', '$state',
    function($scope, $state) {

        $scope.editarVacinas = function(index) {
            var item = $scope.$parent.domicilio.individuos[index];

            $scope.salvarTemporario();
            $state.go('controleVacinas', {
                idIndividuo: item.id,
                idDomicilio: $scope.bind.idDomicilio
            });
        };

        $scope.editarAgendamentos = function(index) {
            var item = $scope.$parent.domicilio.individuos[index];

            $scope.salvarTemporario();
            $state.go('agendasPendentes', {
                idIndividuo: item.id,
                idDomicilio: $scope.bind.idDomicilio
            });
        };

        $scope.definirAvatar = function(item) {
            if (item.sexo == "F") {
                return "imagens/girl_96x96.png";
            } else {
                return "imagens/person_96x96.png";
            }
        };
    }
]);