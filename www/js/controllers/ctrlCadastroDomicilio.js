controllers.controller('cadastroDomicilioCtrl', ['$scope', '$state', 'DB', '$stateParams', '$ionicLoading', '$ionicPopup', '$q', '$ionicPlatform', 'temporario',
    function($scope, $state, DB, $stateParams, $ionicLoading, $ionicPopup, $q, $ionicPlatform, temporario) {
        $ionicLoading.show({
            template: 'Carregando...'
        });
        $scope.bind = {
            individuosExcluidos: []
        };

        $scope.verBotaoVoltar = true;

        $scope.tituloPrincipal = 'Cadastro de Domicílio';
        $scope.verBotaoSalvar = false;
        $scope.codigoMicroArea = window.localStorage.getItem("microarea");
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));
        $scope.bind.idDomicilio = $stateParams.idDomicilio;

        $scope.acaoVoltar = function() {
            if ($scope.verBotaoSalvar) {
                $scope.showConfirmation('Você perderá todas as informações não salvas. Deseja realmente voltar?').then(function(resp) {
                    if (resp) {
                        $state.go('domicilios');
                    }
                });
            } else {
                $state.go('domicilios');
            }
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

        $scope.carregarDomicilio = function() {
            if ($scope.bind.idDomicilio) {
                DB.query("SELECT d.id," +
                    " d.codigoSistema, " +
                    " d.numeroFamilia, " +
                    " d.codigoMicroArea, " +
                    " ma.microArea, " +
                    " p.nome AS nomeProfissional, " +
                    " e.descricao AS descricaoEquipe, " +
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
                    "  left outer join equipeProfissional AS ep ON d.codigoMicroArea = ep.codigoMicroArea AND ep.status = 0 " +
                    "  left outer join profissional AS p ON p.id = ep.codigoProfissional " +
                    "  left outer join equipe AS e ON e.id = ep.codigoEquipe " +
                    "  left outer join microArea AS ma ON ma.id = d.codigoMicroArea " +
                    " WHERE d.id = ?", [$scope.bind.idDomicilio]).then(function(result) {

                    var domicilio = DB.fetch(result);
                    if (isValid(domicilio.codigoMicroArea)) {
                        domicilio.descricaoArea = domicilio.descricaoEquipe + ' | ' + domicilio.microArea;
                    }

                    $scope.domicilio = domicilio;

                    if (isValid($scope.codigoMicroArea)) {
                        if (isValid(domicilio.codigoMicroArea)) {
                            if ($scope.codigoMicroArea == domicilio.codigoMicroArea) {
                                $scope.verBotaoSalvar = true;
                            }
                        } else {
                            $scope.verBotaoSalvar = true;
                        }
                    }

                    $scope.carregarDomicilioEsus();
                }, function(err) {
                    console.error(err.message);
                });
            } else {
                if (isValid($scope.codigoMicroArea)) {
                    $scope.verBotaoSalvar = true;
                }
                $ionicLoading.hide();
            }
        };

        $scope.carregarDomicilioEsus = function() {
            DB.query("SELECT d.id," +
                " d.codigoDomicilio, " +
                " d.situacaoMoradia, " +
                " d.localizacao, " +
                " d.tipoDomicilio, " +
                " d.numeroMoradores, " +
                " d.numeroComodos, " +
                " d.condicaoUsoTerra, " +
                " d.tipoAcessoDomicilio, " +
                " d.materialDominante, " +
                " d.abastecimentoAgua, " +
                " d.possuiEnergiaEletrica, " +
                " d.tratamentoAgua, " +
                " d.esgotamento, " +
                " d.destinoLixo, " +
                " d.gato, " +
                " d.cachorro, " +
                " d.passaro, " +
                " d.criacao, " +
                " d.outros, " +
                " d.quantos " +
                " FROM domicilioEsus AS d " +
                " WHERE d.codigoDomicilio = ?", [$scope.bind.idDomicilio]).then(function(result) {

                var domicilioEsus = DB.fetch(result);
                if (domicilioEsus) {
                    $scope.domicilioEsus = domicilioEsus;
                }

                $scope.carregarIndividuos();
            }, function(err) {
                console.error(err.message);
            });
        };

        $scope.carregarIndividuos = function() {
            DB.query("SELECT p.id," +
                " p.sexo, " +
                " p.nome, " +
                " p.nomeMae, " +
                " p.codigoDomicilio, " +
                " strftime('%d/%m/%Y',p.dataNascimento, 'unixepoch') AS dataNascimento " +
                " FROM paciente AS p " +
                " WHERE p.codigoDomicilio = ?", [$scope.bind.idDomicilio]).then(function(result) {

                var individuos = DB.fetchAll(result);
                if (individuos) {
                    $scope.domicilio.individuos = individuos;
                }

                $ionicLoading.hide();
            }, function(err) {
                console.error(err.message);
            });
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
                if (isInvalid($scope.domicilio.numeroFamilia)) {
                    throw "Informe o Número da Família";
                }
                if (isInvalid($scope.domicilio.codigoTipoLogradouro)) {
                    throw "Informe o Tipo de Logradouro";
                }
                if (isInvalid($scope.domicilio.logradouro)) {
                    throw "Informe o Logradouro";
                }
                if (isInvalid($scope.domicilio.numeroLogradouro)) {
                    throw "Informe o Número do Logradouro";
                }
                if (isInvalid($scope.domicilio.bairro)) {
                    throw "Informe o Bairro";
                }
                if (isInvalid($scope.domicilio.cep)) {
                    throw "Informe o CEP";
                }
                if (isInvalid($scope.domicilioEsus.situacaoMoradia)) {
                    throw "Informe a Situação de Moradia";
                }
                if (isInvalid($scope.domicilioEsus.localizacao)) {
                    throw "Informe a Localização";
                }
                if (isInvalid($scope.domicilioEsus.tipoDomicilio)) {
                    throw "Informe o Tipo de Domicílio";
                }
                for (var i = 0; i < $scope.domicilio.individuos.length; i++) {
                    if ($scope.domicilio.individuos[i].situacao == 3) {
                        throw 'O paciente ' + $scope.domicilio.individuos[i].nome + ' está com a situação inválida. Ajuste a situação ou remova o paciente da família.'
                    }
                }
            } catch (err) {
                $scope.messagePopup(err);
                return;
            }

            DB.session.transaction(function(tx) {
                if (isValid($scope.domicilio.id)) {
                    tx.executeSql("DELETE FROM erroDomicilio WHERE codigoDomicilio = ? ", [$scope.domicilio.id], function(tx, result) {
                        $scope.salvarEndereco(tx);
                    }, $scope.err);
                } else {
                    $scope.salvarEndereco(tx);
                }

            }, function(err) {
                $scope.messagePopup(err.message);
            });
        };

        $scope.err = function(tx, err) {
            $scope.messagePopup(err.message);
            return true;
        };

        $scope.salvarIndividuos = function(tx, idDomicilio) {
            //Setar motivo para individuos excluidos
            if ($scope.bind.individuosExcluidos.length > 0) {
                for (var i = 0; i < $scope.bind.individuosExcluidos.length; i++) {
                    var individuo = $scope.bind.individuosExcluidos[i];
                    tx.executeSql("UPDATE paciente SET codigoUsuario = ?, motivoExclusaoDomicilio = ? WHERE id = ?", [$scope.usuario.id, individuo.motivoExclusao, individuo.codigoInterno || individuo.idIndividuo], null, $scope.err);

                    var registroPaciente = "UPDATE dominioPaciente " +
                        " SET descricaoFamilia = null, codigoArea = null, codigoMicroArea = null WHERE codigoInterno = ?";
                    tx.executeSql(registroPaciente, [individuo.codigoInterno || individuo.idIndividuo], null, $scope.err);
                }
            }

            //Remover individuos salvos
            tx.executeSql("UPDATE paciente SET codigoDomicilio = null, codigoUsuario = ? WHERE codigoDomicilio = ?", [$scope.usuario.id, idDomicilio], function(tx, result) {
                //Salvar individuos novos
                if (isValid($scope.domicilio.individuos) && $scope.domicilio.individuos.length > 0) {
                    var param = [];
                    var sql = "UPDATE paciente SET codigoDomicilio = ?, codigoUsuario = ? WHERE id in ";

                    param.push(idDomicilio);
                    param.push($scope.usuario.id);


                    var individuosIN = "(";
                    var virgula = "";
                    for (var i = 0; i < $scope.domicilio.individuos.length; i++) {
                        if ($scope.domicilio.individuos[i].codigoInterno) {
                            individuosIN += virgula + $scope.domicilio.individuos[i].codigoInterno;
                        } else {
                            individuosIN += virgula + $scope.domicilio.individuos[i].id;
                        }

                        virgula = ",";
                    }
                    individuosIN += ")";
                    sql += individuosIN;

                    var registroPaciente = "UPDATE dominioPaciente " +
                        " SET descricaoFamilia = 'Paciente pertecente a área ' || ?  || ' microarea: ' || ?  || ' família:' || ? WHERE codigoInterno in ";
                    registroPaciente += individuosIN;
                    tx.executeSql(registroPaciente, [window.localStorage.getItem("descricaoarea"), window.localStorage.getItem("microarea1"), $scope.domicilio.numeroFamilia], null, $scope.err);


                    //Salvar novos individuos
                    tx.executeSql(sql, param, function(tx, result) {

                        $scope.messagePopup('Registro Salvo com Sucesso!').then(function() {
                            $state.go('domicilios');
                        });
                    }, $scope.err);
                } else {
                    $scope.messagePopup('Registro Salvo com Sucesso!').then(function() {
                        $state.go('domicilios');
                    });
                }
            }, $scope.err);
        };

        $scope.salvarDomicilioEsus = function(tx, idDomicilio) {
            var binding = [];
            var registroDomicilioEsus = '';
            if (isInvalid($scope.domicilioEsus.id)) {
                registroDomicilioEsus = "INSERT INTO domicilioEsus " +
                    " (codigoDomicilio, situacaoMoradia, localizacao, tipoDomicilio," +
                    " numeroMoradores, numeroComodos, condicaoUsoTerra, tipoAcessoDomicilio," +
                    " materialDominante, possuiEnergiaEletrica, abastecimentoAgua, tratamentoAgua," +
                    " esgotamento, destinoLixo, gato, cachorro, passaro, criacao, outros, quantos, codigoUsuario)" +
                    " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
            } else {
                registroDomicilioEsus = "UPDATE domicilioEsus SET" +
                    " codigoDomicilio = ?, situacaoMoradia = ?, localizacao = ?, tipoDomicilio = ?, numeroMoradores = ?," +
                    " numeroComodos = ?, condicaoUsoTerra = ?, tipoAcessoDomicilio = ?, materialDominante = ?," +
                    " possuiEnergiaEletrica = ?, abastecimentoAgua = ?, tratamentoAgua = ?," +
                    " esgotamento = ?, destinoLixo = ?, gato = ?, cachorro = ?, passaro = ?, criacao = ?, outros = ?, quantos = ?, codigoUsuario = ? " +
                    " WHERE id = ?";
            }
            binding.push(idDomicilio);
            binding.push($scope.domicilioEsus.situacaoMoradia);
            binding.push($scope.domicilioEsus.localizacao);
            binding.push($scope.domicilioEsus.tipoDomicilio);
            binding.push($scope.domicilioEsus.numeroMoradores);
            binding.push($scope.domicilioEsus.numeroComodos);
            binding.push($scope.domicilioEsus.condicaoUsoTerra);
            binding.push($scope.domicilioEsus.tipoAcessoDomicilio);
            binding.push($scope.domicilioEsus.materialDominante);
            binding.push($scope.domicilioEsus.possuiEnergiaEletrica);
            binding.push($scope.domicilioEsus.abastecimentoAgua);
            binding.push($scope.domicilioEsus.tratamentoAgua);
            binding.push($scope.domicilioEsus.esgotamento);
            binding.push($scope.domicilioEsus.destinoLixo);
            binding.push($scope.domicilioEsus.gato);
            binding.push($scope.domicilioEsus.cachorro);
            binding.push($scope.domicilioEsus.passaro);
            binding.push($scope.domicilioEsus.criacao);
            binding.push($scope.domicilioEsus.outros);
            binding.push($scope.domicilioEsus.quantos);
            binding.push($scope.usuario.id);

            if (!isInvalid($scope.domicilioEsus.id)) {
                binding.push($scope.domicilioEsus.id);
            }

            tx.executeSql(registroDomicilioEsus, binding, function(tx, result) {
                $scope.salvarIndividuos(tx, idDomicilio);
            }, $scope.err);
        };

        $scope.salvarDomicilio = function(tx, idEndereco) {
            var binding = [];
            var registroDomicilio = '';
            if (isInvalid($scope.domicilio.id)) {
                registroDomicilio = "INSERT INTO domicilio " +
                    " (codigoEndereco, numeroFamilia, codigoMicroArea, codigoUsuario)" +
                    " VALUES (?,?,?,?);";

            } else {
                registroDomicilio = "UPDATE domicilio SET" +
                    " codigoEndereco = ?, numeroFamilia = ?, codigoMicroArea = ?, codigoUsuario = ?" +
                    " WHERE id = ?";
            }

            binding.push(idEndereco);
            binding.push($scope.domicilio.numeroFamilia);
            var codigoMicroArea = $scope.domicilio.codigoMicroArea;
            if (isInvalid($scope.domicilio.codigoMicroArea)) {
                codigoMicroArea = $scope.codigoMicroArea;
            }
            binding.push(codigoMicroArea);
            binding.push($scope.usuario.id);

            if (!isInvalid($scope.domicilio.id)) {
                binding.push($scope.domicilio.id);
            }

            tx.executeSql(registroDomicilio, binding, function(tx, result) {
                var pkDomicilio = isInvalid($scope.domicilio.id) ? result.insertId : $scope.domicilio.id;
                $scope.salvarDomicilioEsus(tx, pkDomicilio);
            }, $scope.err);
        };

        $scope.salvarEndereco = function(tx) {
            var binding = [];
            var registroEndereco = '';
            if (isInvalid($scope.domicilio.codigoEndereco)) {
                registroEndereco = "INSERT INTO endereco " +
                    " (codigoCidade, cep, bairro, codigoTipoLogradouro, logradouro, complementoLogradouro," +
                    " numeroLogradouro, telefone, telefoneReferencia, pontoReferencia, codigoUsuario)" +
                    " VALUES (?,?,upper(?),?,upper(?),upper(?),upper(?),?,?,upper(?),?);";
            } else {
                registroEndereco = "UPDATE endereco SET" +
                    " codigoCidade = ?, cep = ?, bairro = upper(?), codigoTipoLogradouro = ?, logradouro = upper(?)," +
                    " complementoLogradouro = upper(?), numeroLogradouro = upper(?), telefone = ?, telefoneReferencia = ?, pontoReferencia = upper(?), codigoUsuario = ?" +
                    " WHERE id = ?";
            }

            binding.push($scope.domicilio.codigoCidade);
            binding.push($scope.domicilio.cep);
            binding.push($scope.domicilio.bairro);
            binding.push($scope.domicilio.codigoTipoLogradouro);
            binding.push($scope.domicilio.logradouro);
            binding.push($scope.domicilio.complementoLogradouro);
            binding.push($scope.domicilio.numeroLogradouro);
            binding.push($scope.domicilio.telefone);
            binding.push($scope.domicilio.telefoneReferencia);
            binding.push($scope.domicilio.pontoReferencia);
            binding.push($scope.usuario.id);
            if (!isInvalid($scope.domicilio.codigoEndereco)) {
                binding.push($scope.domicilio.codigoEndereco);
            }

            tx.executeSql(registroEndereco, binding, function(tx, result) {
                var pkEndereco = isInvalid($scope.domicilio.codigoEndereco) ? result.insertId : $scope.domicilio.codigoEndereco;

                $scope.salvarDomicilio(tx, pkEndereco);
            }, $scope.err);
        };

        if (temporario) {
            $scope.domicilio = temporario.domicilio;
            $scope.domicilioEsus = temporario.domicilioEsus;
            $scope.bind = temporario.bind;

            if (isValid($scope.codigoMicroArea)) {
                if (!$scope.bind.idDomicilio) {
                    $scope.verBotaoSalvar = true;
                } else {
                    if (isValid($scope.domicilio.codigoMicroArea)) {
                        if ($scope.codigoMicroArea == $scope.domicilio.codigoMicroArea) {
                            $scope.verBotaoSalvar = true;
                        }
                    } else {
                        $scope.verBotaoSalvar = true;
                    }
                }
            }
            $ionicLoading.hide();
        } else {
            $scope.domicilio = {
                individuos: []
            };
            $scope.domicilioEsus = {};
            $scope.carregarDomicilio();
        }

    }
]);

controllers.controller('tabDomEnderecoCtrl', ['$scope', '$ionicModal', 'DB', '$timeout', '$celkScroll',
    function($scope, $ionicModal, DB, $timeout, $celkScroll) {
        //        $scope.enderecoBind = {};

        //<editor-fold defaultstate="collapsed" desc="Modal Tipo Logradouro">
        $ionicModal.fromTemplateUrl('templates/modals/tipoLogradouro.html', {
            scope: $scope,
            animation: 'slide-in-up'
                //            focusFirstInput: true
        }).then(function(modal) {
            $scope.modalTipoLogradouro = modal;
        });
        $scope.limparTipoLogradouro = function() {
            $scope.$parent.domicilio.codigoTipoLogradouro = null;
            $scope.$parent.domicilio.descricaoTipoLogradouro = null;
        };
        $scope.selecionarTipoLogradouro = function() {
            $scope.modalTipoLogradouro.show();
            $scope.bindTipoLogradouro = {
                criterioTipoLogradouro: ''
            };
            $scope.novaBuscaTipoLogradouro();
        };
        $scope.tipoLogradouroSelecionado = function(item) {
            $scope.$parent.domicilio.codigoTipoLogradouro = item.id;
            $scope.$parent.domicilio.descricaoTipoLogradouro = item.descricao;
            $scope.closeModalTipoLogradouro();
        };
        $scope.closeModalTipoLogradouro = function() {
            $scope.modalTipoLogradouro.hide();
            $scope.bindTipoLogradouro = {};
        };
        $scope.buscarTipoLogradouro = function() {
            if (typeof $scope.timeTipoLogradouro !== "undefined") {
                $timeout.cancel($scope.timeTipoLogradouro);
            }
            $scope.timeTipoLogradouro = $timeout(function() {
                $scope.novaBuscaTipoLogradouro();
            }, 600);
        };

        $scope.novaBuscaTipoLogradouro = function() {
            $scope.bindTipoLogradouro.canLoadTipoLogradouro = true;
            $scope.bindTipoLogradouro.TipoLogradouros = [];
            $scope.bindTipoLogradouro.countTipoLogradouro = 0;
            $celkScroll.toTop('contentTipoLogradouro');
        };

        $scope.loadTipoLogradouro = function() {
            var deep = 20;
            var i = $scope.bindTipoLogradouro.countTipoLogradouro;
            $scope.bindTipoLogradouro.countTipoLogradouro += deep;
            var filtro = '%' + $scope.bindTipoLogradouro.criterioTipoLogradouro + '%';
            DB.query("SELECT id, descricao" +
                " FROM tipoLogradouro" +
                " WHERE descricao like ? ORDER BY ordem, descricao LIMIT ?,?", [filtro, i, deep]).then(function(result) {
                var paises = DB.fetchAll(result);
                if ($scope.bindTipoLogradouro.countTipoLogradouro === 20) {
                    $scope.bindTipoLogradouro.TipoLogradouros = [];
                }
                $scope.bindTipoLogradouro.TipoLogradouros.extend(paises);

                if (paises.length < deep) {
                    $scope.bindTipoLogradouro.canLoadTipoLogradouro = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function(err) {
                console.error(err.message);
            });
        };
        //</editor-fold>

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            if ($scope.modalTipoLogradouro) {
                $scope.modalTipoLogradouro.remove();
            }
        });
    }
]);

controllers.controller('tabDomCondMoradiaCtrl', ['$scope',
    function($scope) {}
]);

controllers.controller('tabDomAnimaisCtrl', ['$scope',
    function($scope) {}
]);

controllers.controller('tabDomIndividuosCtrl', ['$scope', '$ionicModal', 'DB', '$timeout', '$celkScroll', '$state', '$ionicActionSheet', '$ionicPopup',
    function($scope, $ionicModal, DB, $timeout, $celkScroll, $state, $ionicActionSheet, $ionicPopup) {

        $scope.salvarTemporario = function() {
            var temporario = {
                domicilio: $scope.domicilio,
                domicilioEsus: $scope.domicilioEsus,
                bind: $scope.bind
            };
            window.localStorage.setItem("tempDomicilio", JSON.stringify(temporario));
        };

        $scope.cadastrarIndividuo = function() {
            $scope.salvarTemporario();
            $state.go('cadastroIndividuos.tabIdentificacao');
        };

        $scope.removerIndividuo = function(index, motivo) {
            var i = $scope.$parent.domicilio.individuos[index];

            $scope.$parent.bind.individuosExcluidos.unshift({
                idIndividuo: i.id,
                motivoExclusao: motivo
            });
            $scope.$parent.domicilio.individuos.splice(index, 1);
        };

        //<editor-fold defaultstate="collapsed" desc="Modal Individuo">
        $ionicModal.fromTemplateUrl('templates/modals/individuo.html', {
            scope: $scope,
            animation: 'slide-in-up'
                //            focusFirstInput: true
        }).then(function(modal) {
            $scope.modalIndividuo = modal;
        });
        $scope.selecionarIndividuo = function() {
            $scope.modalIndividuo.show();
            $scope.bindIndividuo = {
                criterioIndividuo: ''
            };
            $scope.novaBuscaIndividuo();
        };

        $scope.adicionarIndividuo = function(item) {
            if ($scope.$parent.domicilio.individuos) {
                for (var i = 0; i < $scope.$parent.domicilio.individuos.length; i++) {
                    var ind = $scope.$parent.domicilio.individuos[i];
                    //Deve efetuar a validacao pois o individuo da lista do dominio poder ser um paciente ou dominio
                    if (ind.codigoInterno) {
                        if (ind.codigoInterno == item.codigoInterno) {
                            $scope.$parent.domicilio.individuos.splice(i, 1);
                            break;
                        }
                    } else {
                        if (ind.id == item.codigoInterno) {
                            $scope.$parent.domicilio.individuos.splice(i, 1);
                            break;
                        }
                    }

                }
            }
            $scope.$parent.domicilio.individuos.unshift(item);
        };

        $scope.individuoSelecionado = function(item) {
            if (item.descricaoFamilia) {
                $scope.showConfirmation(item.descricaoFamilia + ', Deseja remover do domicílio atual?')
                    .then(function(resposta) {
                        if (resposta) {
                            // DB.query("UPDATE paciente SET codigoDomicilio = null, motivoExclusaoDomicilio = 1, codigoUsuario = ? WHERE id = ?", [$scope.usuario.id, item.id]);
                            $scope.salvarTemporario();

                            DB.query("SELECT 1 from paciente where id = ?", [item.codigoInterno]).then(function(result) {
                                var interno = DB.fetchAll(result);
                                if (interno.length === 0) {
                                    window.localStorage.individuoToEdit = JSON.stringify(item)
                                    $state.go('cadastroIndividuos.tabIdentificacao', {
                                        idIndividuo: item.idIndividuo
                                    });
                                };
                                $scope.adicionarIndividuo(item);
                                $scope.closeModalIndividuo();
                            });
                        };
                    });
            } else {
                $scope.salvarTemporario();

                DB.query("SELECT 1 from paciente where id = ?", [item.codigoInterno]).then(function(result) {
                    var interno = DB.fetchAll(result);
                    if (interno.length === 0) {
                        window.localStorage.individuoToEdit = JSON.stringify(item)
                        $state.go('cadastroIndividuos.tabIdentificacao', {
                            idIndividuo: item.idIndividuo
                        });
                    };
                    $scope.adicionarIndividuo(item);
                    $scope.closeModalIndividuo();
                });
            };
        }

        $scope.closeModalIndividuo = function() {
            $scope.modalIndividuo.hide();
            $scope.bindIndividuo = {};
        };
        $scope.buscarIndividuo = function() {
            if (typeof $scope.timeIndividuo !== "undefined") {
                $timeout.cancel($scope.timeIndividuo);
            }
            $scope.timeIndividuo = $timeout(function() {
                $scope.novaBuscaIndividuo();
            }, 600);
        };

        $scope.novaBuscaIndividuo = function() {
            $scope.bindIndividuo.canLoadIndividuo = true;
            $scope.bindIndividuo.individuos = [];
            $scope.bindIndividuo.countIndividuo = 0;
            $celkScroll.toTop('contentIndividuo');
        };

        $scope.loadIndividuo = function() {
            var deep = 20;
            var i = $scope.bindIndividuo.countIndividuo;
            $scope.bindIndividuo.countIndividuo += deep;
            var filtro = '%' + $scope.bindIndividuo.criterioIndividuo + '%';
            var sql = "SELECT ativo as situacao, " +
                "sexo AS sexo, " +
                "id, upper(nome) AS nome, " +
                "upper(nomeMae) AS nomeMae, " +
                "strftime('%d/%m/%Y',dataNascimento, 'unixepoch') AS dataNascimento, " +
                "codigoSistema AS codigoSistema," +
                "codigoInterno AS codigoInterno, " +
                "cns AS numeroCartao, " +
                "cns AS numeroCartaoAntigo, " +
                "descricaoFamilia AS descricaoFamilia, " +
                "codigoMicroArea AS codigoMicroArea, " +
                "cpf AS cpf," +
                "codigoInterno AS codigoInterno " +
                "FROM dominioPaciente " +
                "WHERE nome like ? " +
                "ORDER BY nome LIMIT ?,?";
            DB.query(sql, [filtro, i, deep]).then(function(result) {
                var individuos = DB.fetchAll(result);
                if ($scope.bindIndividuo.countIndividuo === 20) {
                    $scope.bindIndividuo.individuos = [];
                }
                // $scope.dataNascimento =  $scope.dataNascimento.getTime() / 1000;
                $scope.bindIndividuo.individuos.extend(individuos);

                if (individuos.length < deep) {
                    $scope.bindIndividuo.canLoadIndividuo = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function(err) {
                console.error(err.message);
            });
        };

        $scope.descricaoSituacao = function(item) {
            if (item.situacao == 0) {
                return "Ativo";
            } else if (item.situacao == 1) {
                return "Provisório";
            } else if (item.situacao == 2) {
                return "Inativo";
            } else if (item.situacao == 3) {
                return "Excluído";
            }
            return "";
        };
        //</editor-fold>

        $scope.definirAvatar = function(item) {
            if (item.sexo == "F") {
                return "imagens/girl_96x96.png";
            } else {
                return "imagens/person_96x96.png";
            }
        };

        $scope.openItemOptions = function(itemIndex, item) {
            if ($scope.verBotaoSalvar) {
                $scope.hideSheet = $ionicActionSheet.show({
                    buttons: [{
                        text: 'Editar'
                    }],
                    destructiveText: 'Remover',
                    titleText: 'Escolha a Opção',
                    cancelText: 'Cancelar',
                    destructiveButtonClicked: function() {
                        if ($scope.bind.idDomicilio && isValid($scope.$parent.domicilio.individuos[itemIndex].codigoDomicilio)) {
                            $scope.showPopupRemover(itemIndex);
                        } else {
                            $scope.showConfirmation('Deseja Remover o Indivíduo?').then(function(resp) {
                                if (resp) {
                                    $scope.removerIndividuo(itemIndex);
                                }
                            });
                        }
                        return true;
                    },
                    buttonClicked: function(index) {
                        $scope.salvarTemporario();
                        window.localStorage.individuoToEdit = JSON.stringify(item)
                        $state.go('cadastroIndividuos.tabIdentificacao', {
                            idIndividuo: item.id
                        });
                        return true;
                    }
                });
            }
        };

        $scope.opcoesRemover = function(opcao) {
            if (opcao == 'mudouse') {
                $scope.data.morreu = false;
                $scope.data.outros = false;
            } else if (opcao == 'morreu') {
                $scope.data.mudouse = false;
                $scope.data.outros = false;
            } else if (opcao == 'outros') {
                $scope.data.mudouse = false;
                $scope.data.morreu = false;
            }
        };

        $scope.showPopupRemover = function(itemIndex) {
            $scope.data = {
                mudouse: false,
                morreu: false,
                outros: false
            };
            var popupRemover = $ionicPopup.show({
                template: '<li class="item item-checkbox"><label class="checkbox"><input type="checkbox" ng-change="opcoesRemover(\'mudouse\')" ng-model="data.mudouse"></label>Mudou-se</li>' + '<li class="item item-checkbox"><label class="checkbox"><input type="checkbox" ng-change="opcoesRemover(\'morreu\')" ng-model="data.morreu"></label>Morreu</li>' + '<li class="item item-checkbox"><label class="checkbox"><input type="checkbox" ng-change="opcoesRemover(\'outros\')" ng-model="data.outros"></label>Outros</li>',
                title: 'Informe o Motivo da Remoção.',
                scope: $scope,
                buttons: [{
                    text: 'Cancelar'
                }, {
                    text: '<b>Remover</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if ($scope.data.mudouse) {
                            return 1;
                        } else if ($scope.data.outros) {
                            return 2;
                        } else if ($scope.data.morreu) {
                            return 3;
                        } else {
                            e.preventDefault();
                        }
                    }
                }]
            });
            popupRemover.then(function(res) {
                if (isValid(res)) {
                    $scope.removerIndividuo(itemIndex, res);
                }
            });
        };

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            if ($scope.modalIndividuo) {
                $scope.modalIndividuo.remove();
            }
        });
    }
]);