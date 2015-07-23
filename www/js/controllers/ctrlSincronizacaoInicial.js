controllers.controller('sincronizacaoInicialCtrl', ['$q', '$scope', '$state', '$ionicPopup', '$http', 'DB', 'FS', '$ionicViewService', 'SERVER',
    function ($q, $scope, $state, $ionicPopup, $http, DB, FS, $ionicViewService, SERVER) {
        $scope.bind = {erros: []};
        $scope.log = [];
        $scope.url = window.localStorage.getItem("url");
        
        $scope.sincronizacaoFinalizada = window.localStorage.getItem("sincronizacaoFinalizada");
        $scope.sincronizacaoInicial = window.localStorage.getItem("sincronizacaoInicial");
        $scope.usuarioLogado = JSON.parse(window.localStorage.getItem('usuarioLogado'));
        $scope.usuarioComPermissao = false;
        
        if($scope.sincronizacaoFinalizada){
            if($scope.usuarioLogado && !isNaN($scope.usuarioLogado.id) && $scope.usuarioLogado.nivel !== 'N'){
                $scope.usuarioComPermissao = false;
                $scope.nova = true;
            }
            $scope.sincronizar = true;
        }else{
            $ionicViewService.clearHistory();
            if($scope.sincronizacaoInicial){
                $scope.nova = true;
                $scope.continuar = true;
            }else{
                $scope.sincronizar = true;
            }
        }
        
        $scope.versaoExistente = function (tabela) {
            var deferred = $q.defer();

            DB.session.transaction(function (tx) {
                var query = 'SELECT max(versao) AS versao FROM '+tabela;
                tx.executeSql(query, [], function (transaction, result) {
                    deferred.resolve(DB.fetch(result).versao);
                }, function (transaction, error) {
                    deferred.reject(error);
                    return true;
                });
            });

            return deferred.promise;
        };
        
        $scope.baixarArquivo = function(versao, nomeRecurso){
            var deferred = $q.defer();
            
            var ft = new FileTransfer();
            var uri = encodeURI($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                + 'nomeRecurso='+ nomeRecurso 
                + '&versao='+versao);
            var downloadPath = "cdvfile://localhost/persistent/celk/familias/tabelaTemp.txt";

            ft.download(uri, downloadPath, function(entry) {
                deferred.resolve();
            }, 
            function(error) {
                deferred.reject(error);
            });
            
            return deferred.promise;
        };

        $scope.actSincronizar = function () {
            $scope.sincronizar = false;
            $scope.nova = false;

            window.localStorage.setItem("sincronizacaoInicial", true);
            
            $scope.iniciarSincronizacao();
        };
        
        $scope.actAvancar = function () {
            if(window.localStorage.getItem('usuarioLogado') && $scope.usuarioLogado && !isNaN($scope.usuarioLogado.id)){
                $state.go('menu');
            }else{
                $state.go('login');
            }
        };
        
        $scope.actContinuar = function () {
            $scope.nova = false;
            $scope.continuar = false;
            $scope.log = [];
            
            $scope.iniciarSincronizacao();
        };
        
        $scope.actNova = function () {
            $scope.showConfirmation('Os dados sincronizados até o momento serão perdidos, e a sincronização começará do início. Deseja continuar?')
                .then(function(resposta){
                    if(resposta) {
                        $scope.novaSincronizacao();
                    }                
                });
        };
        
        $scope.erroNaImportacao = function(){
            DB.createVersionTriggers();
            
            if($scope.usuarioComPermissao){
                $scope.nova = true;
            }
            $scope.continuar = true;
        };
        
        $scope.sucessoNaImportacao = function(){
            DB.createVersionTriggers();
            
            $scope.log.unshift('PROCESSO DE SINCRONIZAÇÃO FINALIZADO');
            window.localStorage.setItem("sincronizacaoFinalizada", true);
            $scope.avancar = true;
            if($scope.bind.possuiErros){
                $scope.showConfirmation('A importação gerou algumas inconsistências. Deseja resolver agora?')
                    .then(function(resposta){
                        if(resposta){
                            $state.go('inconsistencias');
                        }
                    });
            }
        };
        
        $scope.problemaImportarArquivo = function(error){
            $scope.log.unshift('Erro ao importar arquivo. Verifique se o servidor está disponível');
            $scope.erroNaImportacao();
        };
        
        $scope.problemaParse = function(){
            $scope.erroNaImportacao();
        };
        
        $scope.problemaConexao = function(){
            $scope.log.unshift('Problemas na sincronização, verifique se o servidor está disponível.');
            $scope.erroNaImportacao();
        };
        
        $scope.failFile = function(error){
            alert('Erro: '+ error.code);
            $scope.log.unshift('Erro no arquivo');
            $scope.erroNaImportacao();
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

        $scope.novaSincronizacao = function(){
            $scope.nova = false;
            $scope.continuar = false;
            $scope.sincronizar = false;
            $scope.log = [];
            
            $scope.log.unshift('Iniciando processo de sincronização...');
            DB.delete();
            
            window.localStorage.removeItem("usuarioLogado");
            window.localStorage.removeItem("sincronizacaoInicial");
            window.localStorage.removeItem("sincronizacaoFinalizada");
            $ionicViewService.clearHistory();
            
            $scope.log.unshift('Recriando banco...');
            DB.init();

            window.localStorage.setItem("sincronizacaoInicial", true);
            DB.ready(function(){
                $scope.iniciarSincronizacao();
            });
        };
        
        $scope.resolverRetorno = function(entidade, retorno, atualizaVersaoMobile){
            var deferred = $q.defer();
            var self = this;
            var itens = [];
            var linha = retorno.split('\n');
            if(linha.length === 1){
                $scope.bind.erros.push(entidade + ': ' + retorno);
            }
            for (var i = 0; i < linha.length-1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    codigoMobile: parseInt(registro[0]),
                    codigoSistema: registro[1],
                    versaoSistema: parseInt(registro[2]),
                    status: parseInt(registro[3]),
                    mensagem: registro[4]
                };
            }
            
            self.updateRetorno = function(itens){
                if(itens.length === 0){
                    return deferred.resolve();
                }
                var obj = itens.shift();
                if(obj.status === 1){
                    var sql = "UPDATE " + entidade + " SET codigoSistema = ? ";
                    var params = [];
                    params.push(obj.codigoSistema);
                    
                    if(atualizaVersaoMobile){
                        params.push(0);
                        sql += ", versaoMobile = ? ";
                    }
                    params.push(obj.codigoMobile);
                    sql += " WHERE id = ? ";
                    
                    DB.query(sql, params).then(function(){
                        self.updateRetorno(itens);
                    });
                }else{

                    $scope.bind.possuiErros = true;
                    $scope.bind.erros.push(entidade + ': ' + obj.mensagem);
                    if(entidade === 'endereco'){
                    
                        DB.query("SELECT d.id FROM domicilio AS d WHERE d.codigoEndereco = ? LIMIT 1", [obj.codigoMobile]).then(function(result){
                            var domicilio = DB.fetch(result);
                            DB.query("INSERT OR IGNORE INTO erroDomicilio (codigoDomicilio, mensagem) VALUES (?, ?)", [domicilio.id, obj.mensagem]).then(function(){
                                self.updateRetorno(itens);
                            });
                        });
                    } else if(entidade === 'domicilio'){
                        
                        DB.query("INSERT OR IGNORE INTO erroDomicilio (codigoDomicilio, mensagem) VALUES (?, ?)", [obj.codigoMobile, obj.mensagem]).then(function(){
                            self.updateRetorno(itens);
                        });
                    } else if(entidade === 'domicilioEsus'){
                        
                        DB.query("SELECT d.id FROM domicilioEsus AS de LEFT JOIN domicilio AS d ON d.id = de.codigoDomicilio WHERE de.id = ? ", [obj.codigoMobile]).then(function(result){
                            var domicilio = DB.fetch(result);
                            DB.query("INSERT OR IGNORE INTO erroDomicilio (codigoDomicilio, mensagem) VALUES (?, ?)", [domicilio.id, obj.mensagem]).then(function(){
                                self.updateRetorno(itens);
                            });
                        });
                    } else if(entidade === 'paciente'){

                        DB.query("INSERT OR IGNORE INTO erroPaciente (codigoPaciente, mensagem) VALUES (?, ?)", [obj.codigoMobile, obj.mensagem]).then(function(){
                            self.updateRetorno(itens);
                        });
                        
                    } else if(entidade === 'pacienteEsus'){

                        DB.query("SELECT p.id FROM pacienteEsus AS pe LEFT JOIN paciente AS p ON p.id = pe.codigoPaciente WHERE pe.id = ? ", [obj.codigoMobile]).then(function(result){
                            var paciente = DB.fetch(result);
                            DB.query("INSERT OR IGNORE INTO erroPaciente (codigoPaciente, mensagem) VALUES (?, ?)", [paciente.id, obj.mensagem]).then(function(){
                                self.updateRetorno(itens);
                            });
                        });
                        
                    } else if(entidade === 'cns'){

                        DB.query("SELECT p.id FROM cns AS cns LEFT JOIN paciente AS p ON p.id = cns.codigoPaciente WHERE cns.id = ? ", [obj.codigoMobile]).then(function(result){
                            var paciente = DB.fetch(result);
                            DB.query("INSERT OR IGNORE INTO erroPaciente (codigoPaciente, mensagem) VALUES (?, ?)", [paciente.id, obj.mensagem]).then(function(){
                                self.updateRetorno(itens);
                            });
                        });
                        
                    } else if(entidade === 'documentos'){

                        DB.query("SELECT p.id FROM documentos AS doc LEFT JOIN paciente AS p ON p.id = doc.codigoPaciente WHERE doc.id = ? ", [obj.codigoMobile]).then(function(result){
                            var paciente = DB.fetch(result);
                            DB.query("INSERT OR IGNORE INTO erroPaciente (codigoPaciente, mensagem) VALUES (?, ?)", [paciente.id, obj.mensagem]).then(function(){
                                self.updateRetorno(itens);
                            });
                        });
                        
                    }
                }
            };
            
            self.updateRetorno(itens);
            return deferred.promise;
        };
        
        $scope.addProp = function(value){
            //Remove | do valor e adiciona um | no final do campo
            return invalidToEmpty(value).toString().split('|').join('') + '|';
        };
        
        $scope.deletarRegistrosInconsistentes = function(){
            var deferred = $q.defer();
            
            DB.query("DELETE FROM erroDomicilio;", []).then(function(){
                DB.query("DELETE FROM erroPaciente;", []).then(function(){
                    return deferred.resolve();
                });
            });
            
            return deferred.promise;
        };
        
        $scope.enviarRecursos = function(){
            var deferred = $q.defer();
            
            $scope.deletarRegistrosInconsistentes().then(function () {
                $scope.enviarEndereco().then(function () {
                    $scope.log.unshift('ENDERECO FINALIZADO');
                    $scope.enviarDomicilio().then(function () {
                        $scope.log.unshift('DOMICILIO FINALIZADO');
                        $scope.enviarDomicilioEsus().then(function () {
                            $scope.log.unshift('DOMICILIO ESUS FINALIZADO');
                            $scope.enviarResponsaveis().then(function () {
                                $scope.log.unshift('RESPONSAVEIS ENVIADOS');
                                $scope.enviarPacientes().then(function () {
                                    $scope.log.unshift('PACIENTES ENVIADOS');
                                    $scope.enviarPacienteEsus().then(function () {
                                        $scope.log.unshift('PACIENTES ESUS ENVIADOS');
                                        $scope.enviarCns().then(function () {
                                            $scope.log.unshift('CNS ENVIADOS');
                                            $scope.enviarDocumentos().then(function () {
                                                $scope.log.unshift('DOCUMENTOS ENVIADOS');
                                                $scope.enviarPacienteDado().then(function () {
                                                    $scope.log.unshift('PACIENTES DADO ENVIADOS');
                                                    $scope.enviarVisitas().then(function () {
                                                        $scope.log.unshift('VISITAS ENVIADAS');
                                                        $scope.enviarNotificacoesAgendamentos().then(function () {
                                                            $scope.log.unshift('NOTIFICACOES DE AGENDAMENTOS ENVIADAS');
                                                            $scope.enviarRegistroVacina().then(function () {
                                                                $scope.log.unshift('REGISTROS DE VACINAS ENVIADAS');
                                                                $scope.enviarImagensVacina().then(function () {
                                                                    $scope.log.unshift('IMAGENS DE VACINAS ENVIADAS');

                                                                    return deferred.resolve();
                                                                },function () {
                                                                        $scope.problemaConexao();
                                                                    });
                                                            },function () {
                                                                    $scope.problemaConexao();
                                                                });
                                                        },function () {
                                                                $scope.problemaConexao();
                                                            });
                                                    },function () {
                                                            $scope.problemaConexao();
                                                        });
                                                },function () {
                                                        $scope.problemaConexao();
                                                    });
                                            },function () {
                                                    $scope.problemaConexao();
                                                });
                                        },function () {
                                                $scope.problemaConexao();
                                            });
                                    },function () {
                                            $scope.problemaConexao();
                                        });
                                },function () {
                                        $scope.problemaConexao();
                                    });
                            },function () {
                                    $scope.problemaConexao();
                                });
                        },function () {
                                $scope.problemaConexao();
                            });
                    },function () {
                            $scope.problemaConexao();
                        });
                },function () {
                        $scope.problemaConexao();
                    });
            },function () {
                    $scope.problemaConexao();
                });


            return deferred.promise;
        };
        
        $scope.enviarVisitas = function(){
            var deferred = $q.defer();
            
            var montarVisitas = function(visita){
                var l = '';
                l += $scope.addProp(visita.codigoSistema);
                l += $scope.addProp(visita.id);
                l += $scope.addProp(visita.codigoSistemaUsuario);
                l += $scope.addProp(visita.codigoSistemaDomicilio);
                l += $scope.addProp(visita.dataVisitaFormatada);
                l += $scope.addProp(visita.horaVisitaFormatada);
                l += $scope.addProp(visita.compartilhada);
                l += $scope.addProp(visita.codigoSistemaPaciente);
                l += $scope.addProp(visita.desfecho);
                l += $scope.addProp(visita.motivoAtualizacao);
                l += $scope.addProp(visita.motivoVisitaPeriodica);
                l += $scope.addProp(visita.motivoBaConsulta);
                l += $scope.addProp(visita.motivoBaExame);
                l += $scope.addProp(visita.motivoBaVacina);
                l += $scope.addProp(visita.motivoBaCondicionalidadesBolsaFamilia);
                l += $scope.addProp(visita.motivoAcGestante);
                l += $scope.addProp(visita.motivoAcPuerpera);
                l += $scope.addProp(visita.motivoAcRecemNascido);
                l += $scope.addProp(visita.motivoAcCrianca);
                l += $scope.addProp(visita.motivoAcPessoaDesnutrida);
                l += $scope.addProp(visita.motivoAcPessoaDeficiente);
                l += $scope.addProp(visita.motivoAcPessoaHipertensa);
                l += $scope.addProp(visita.motivoAcPessoaDiabetes);
                l += $scope.addProp(visita.motivoAcPessoaAsmatica);
                l += $scope.addProp(visita.motivoAcPessoaEnfisema);
                l += $scope.addProp(visita.motivoAcPessoaCancer);
                l += $scope.addProp(visita.motivoAcPessoaDoencaCronica);
                l += $scope.addProp(visita.motivoAcPessoaHanseniase);
                l += $scope.addProp(visita.motivoAcPessoaTuberculose);
                l += $scope.addProp(visita.motivoAcAcamado);
                l += $scope.addProp(visita.motivoAcVulnerabilidadeSocial);
                l += $scope.addProp(visita.motivoAcCondicionalidadesBolsaFamilia);
                l += $scope.addProp(visita.motivoAcSaudeMental);
                l += $scope.addProp(visita.motivoAcUsuarioAlcool);
                l += $scope.addProp(visita.motivoAcUsuarioDroga);
                l += $scope.addProp(visita.motivoEgressoInternacao);
                l += $scope.addProp(visita.motivoControleAmbientesVetores);
                l += $scope.addProp(visita.motivoCampanhaSaude);
                l += $scope.addProp(visita.motivoPrevencao);
                l += $scope.addProp(visita.motivoOutros);
                l += $scope.addProp(visita.dataColetaGpsFormatada);
                l += $scope.addProp(visita.horaColetaGpsFormatada);
                l += $scope.addProp(visita.latitude);
                l += $scope.addProp(visita.longitude);
                
                
                return l.substring(0, l.length-1);
            };
            //VISITAS
            var sql = "SELECT v.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " p.codigoSistema AS codigoSistemaPaciente,"+
                    " dom.codigoSistema AS codigoSistemaDomicilio,"+
                    " strftime('%d-%m-%Y', v.dataVisita, 'unixepoch') AS dataVisitaFormatada,"+
                    " strftime('%H:%M:%S', v.dataVisita, 'unixepoch', 'localtime') AS horaVisitaFormatada,"+
                    " strftime('%d-%m-%Y', v.dataColetaGps, 'unixepoch') AS dataColetaGpsFormatada,"+
                    " strftime('%H:%M:%S', v.horaColetaGps, 'unixepoch', 'localtime') AS horaColetaGpsFormatada"+
                    " FROM visitaDomiciliar v"+
                    " LEFT JOIN usuarios AS u ON u.id = v.codigoUsuario "+
                    " LEFT JOIN paciente AS p ON p.id = v.codigoPaciente "+
                    " LEFT JOIN domicilio AS dom ON dom.id = v.codigoDomicilio ";
//                    " WHERE v.versaoMobile > ? AND doc.excluido = 'N' ";
            
            DB.query(sql, []).then(function(result){
                var visita = DB.fetchAll(result);
                if(visita.length > 0){
                    var layout = '';
                    for(var i = 0; i < visita.length; i++){
                        layout += montarVisitas(visita[i]) + '\n';
                    }
                    SERVER.post('visita_domiciliar', layout).then(function(data){
                        DB.query("DELETE FROM visitaDomiciliar ", []).then(function(result){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarNotificacoesAgendamentos = function(){
            var deferred = $q.defer();
            
            var montarNotificacoes = function(agenda){
                var l = '';
                l += $scope.addProp(agenda.codigoSistema);
                l += $scope.addProp(agenda.id);
                l += $scope.addProp(agenda.codigoSistemaUsuario);
                l += $scope.addProp(agenda.statusMobile);
                l += $scope.addProp(agenda.codigoSistemaMotivo);
                l += $scope.addProp(agenda.descricaoOutroMotivo);
                
                
                return l.substring(0, l.length-1);
            };

            var sql = "SELECT n.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " m.codigoSistema AS codigoSistemaMotivo"+
                    " FROM notificacaoAgendas n"+
                    " LEFT JOIN usuarios AS u ON u.id = n.codigoUsuario "+
                    " LEFT JOIN motivoNaoComparecimento AS m ON m.id = n.codigoMotivo "+
                    " WHERE n.versaoMobile > ? ";
            
            DB.query(sql, [0]).then(function(result){
                var notificacoes = DB.fetchAll(result);
                if(notificacoes.length > 0){
                    var layout = '';
                    for(var i = 0; i < notificacoes.length; i++){
                        layout += montarNotificacoes(notificacoes[i]) + '\n';
                    }
                    SERVER.post('NOTIFICACAO_AGENDAS', layout).then(function(data){
                        return deferred.resolve();
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarRegistroVacina = function(){
            var deferred = $q.defer();
            
            var montarRegistros = function(registro){
                var l = '';
                l += $scope.addProp(registro.codigoSistema);
                l += $scope.addProp(registro.id);
                l += $scope.addProp(registro.codigoSistemaUsuario);
                l += $scope.addProp(registro.codigoSistemaPaciente);
                l += $scope.addProp(registro.codigoSistemaVacina);
                l += $scope.addProp(registro.dataAplicacaoFormatada);
                l += $scope.addProp(registro.lote);
                l += $scope.addProp(registro.observacao);
                
                return l.substring(0, l.length-1);
            };

            var sql = "SELECT r.*, "+
                    " strftime('%d-%m-%Y', r.dataAplicacao, 'unixepoch') AS dataAplicacaoFormatada,"+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " p.codigoSistema AS codigoSistemaPaciente,"+
                    " t.codigoSistema AS codigoSistemaVacina"+
                    " FROM registroVacinas r"+
                    " LEFT JOIN usuarios AS u ON u.id = r.codigoUsuario "+
                    " LEFT JOIN tipoVacina AS t ON t.id = r.codigoTipoVacina "+
                    " LEFT JOIN paciente AS p ON p.id = r.codigoPaciente ";
            
            DB.query(sql, []).then(function(result){
                var registros = DB.fetchAll(result);
                if(registros.length > 0){
                    var layout = '';
                    for(var i = 0; i < registros.length; i++){
                        layout += montarRegistros(registros[i]) + '\n';
                    }
                    SERVER.post('REGISTRO_VACINAS', layout).then(function(data){
                        DB.query('DELETE FROM registroVacinas;', []);
                        
                        return deferred.resolve();
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarImagensVacina = function(){
            var deferred = $q.defer();
            
            var montarRegistros = function(registro){
                var l = '';
                l += $scope.addProp(registro.codigoSistema);
                l += $scope.addProp(registro.id);
                l += $scope.addProp(registro.codigoSistemaUsuario);
                l += $scope.addProp(registro.codigoSistemaPaciente);
                l += $scope.addProp(registro.imagem);
                
                return l.substring(0, l.length-1);
            };

            var sql = "SELECT v.*, "+
                " u.codigoSistema AS codigoSistemaUsuario,"+
                " p.codigoSistema AS codigoSistemaPaciente"+
                " FROM vacinasImagens v"+
                " LEFT JOIN usuarios AS u ON u.id = v.codigoUsuario "+
                " LEFT JOIN paciente AS p ON p.id = v.codigoPaciente ";
            
            DB.query(sql, []).then(function(result){
                var registros = DB.fetchAll(result);
                if(registros.length > 0){
                    var layout = '';
                    for(var i = 0; i < registros.length; i++){
                        layout += montarRegistros(registros[i]) + '\n';
                    }
                    SERVER.post('VACINAS_IMAGENS', layout).then(function(data){
                        DB.query('DELETE FROM vacinasImagens;', []);
                        
                        return deferred.resolve();
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarDocumentos = function(){
            var deferred = $q.defer();
            
            var montarDocumentos = function(documentos){
                var l = '';
                l += $scope.addProp(documentos.codigoSistema);
                l += $scope.addProp(documentos.id);
                l += $scope.addProp(documentos.codigoSistemaUsuario);
                l += $scope.addProp(documentos.tipoDocumento);
                l += $scope.addProp(documentos.numeroDocumento);
                l += $scope.addProp(documentos.complemento);
                l += $scope.addProp(documentos.codigoSistemaOrgaoEmissor);
                l += $scope.addProp(documentos.numeroCartorio);
                l += $scope.addProp(documentos.numeroLivro);
                l += $scope.addProp(documentos.numeroFolha);
                l += $scope.addProp(documentos.numeroTermo);
                l += $scope.addProp(documentos.numeroMatricula);
                l += $scope.addProp(documentos.dataEmissaoFormatada);
                l += $scope.addProp(documentos.siglaUf);
                l += $scope.addProp(documentos.codigoSistemaPaciente);
                l += $scope.addProp(documentos.excluido);
                
                return l.substring(0, l.length-1);
            };
            //DOCUMENTOS
            var sql = "SELECT doc.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " p.codigoSistema AS codigoSistemaPaciente,"+
                    " oe.codigoSistema AS codigoSistemaOrgaoEmissor,"+
                    " strftime('%d-%m-%Y', doc.dataEmissao, 'unixepoch') AS dataEmissaoFormatada"+
                    " FROM documentos doc"+
                    " LEFT JOIN paciente AS p ON p.id = doc.codigoPaciente "+
                    " LEFT JOIN usuarios AS u ON u.id = doc.codigoUsuario "+
                    " LEFT JOIN orgaoEmissor AS oe ON oe.id = doc.codigoOrgaoEmissor "+
                    " WHERE doc.versaoMobile > ? AND NOT EXISTS (SELECT * FROM erroPaciente AS ep WHERE ep.codigoPaciente = p.id)";
            
            DB.query(sql, [0]).then(function(result){
                var documentos = DB.fetchAll(result);
                if(documentos.length > 0){
                    var layout = '';
                    for(var i = 0; i < documentos.length; i++){
                        layout += montarDocumentos(documentos[i]) + '\n';
                    }
                    SERVER.post('documentos', layout).then(function(data){
                        $scope.resolverRetorno('documentos', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarCns = function(){
            var deferred = $q.defer();
            
            var montarCns = function(cns){
                var l = '';
                l += $scope.addProp(cns.codigoSistema);
                l += $scope.addProp(cns.id);
                l += $scope.addProp(cns.codigoSistemaUsuario);
                l += $scope.addProp(cns.numeroCartao);
                l += $scope.addProp(cns.codigoSistemaPaciente);
                l += $scope.addProp(cns.excluido);
                
                return l.substring(0, l.length-1);
            };
            //CNS
            var sql = "SELECT cns.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " p.codigoSistema AS codigoSistemaPaciente"+
                    " FROM Cns cns"+
                    " LEFT JOIN paciente AS p ON p.id = cns.codigoPaciente "+
                    " LEFT JOIN usuarios AS u ON u.id = cns.codigoUsuario "+
                    " WHERE cns.versaoMobile > ? AND NOT EXISTS (SELECT * FROM erroPaciente AS ep WHERE ep.codigoPaciente = p.id)";
            
            DB.query(sql, [0]).then(function(result){
                var cns = DB.fetchAll(result);
                if(cns.length > 0){
                    var layout = '';
                    for(var i = 0; i < cns.length; i++){
                        layout += montarCns(cns[i]) + '\n';
                    }
                    SERVER.post('cns', layout).then(function(data){
                        $scope.resolverRetorno('cns', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarPacienteDado = function(){
            var deferred = $q.defer();
            
            var montarPacienteDado = function(pacienteDado){
                var l = '';
                l += $scope.addProp(null);
                l += $scope.addProp(pacienteDado.codigoSistemaPaciente);
                l += $scope.addProp(pacienteDado.codigoSistemaUsuario);
                l += $scope.addProp(pacienteDado.dataColetaFormatada);
                l += $scope.addProp(pacienteDado.peso);
                l += $scope.addProp(pacienteDado.altura);
                
                return l.substring(0, l.length-1);
            };
            //PACIENTE DADO
            var sql = "SELECT pd.*, "+
                    " strftime('%d-%m-%Y %H:%M:%S', pd.dataColeta, 'unixepoch') AS dataColetaFormatada,"+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " p.codigoSistema AS codigoSistemaPaciente"+
                    " FROM PacienteDado pd"+
                    " LEFT JOIN paciente AS p ON p.id = pd.codigoPaciente "+
                    " LEFT JOIN usuarios AS u ON u.id = pd.codigoUsuario "+
                    " WHERE pd.versaoMobile > ? ";
            
            DB.query(sql, [0]).then(function(result){
                var pd = DB.fetchAll(result);
                if(pd.length > 0){
                    var layout = '';
                    for(var i = 0; i < pd.length; i++){
                        layout += montarPacienteDado(pd[i]) + '\n';
                    }
                    SERVER.post('paciente_dado', layout).then(function(data){
//                        $scope.resolverRetorno('pacienteDado', data, false).then(function(){
                            return deferred.resolve();
//                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarPacienteEsus = function(){
            var deferred = $q.defer();
            
            var montarPacienteEsus = function(pacienteEsus){
                var l = '';
                l += $scope.addProp(pacienteEsus.codigoSistema);
                l += $scope.addProp(pacienteEsus.id);
                l += $scope.addProp(pacienteEsus.codigoSistemaUsuario);
                l += $scope.addProp(pacienteEsus.codigoSistemaPaciente);
                l += $scope.addProp(pacienteEsus.dataCadastroFormatada);
                l += $scope.addProp(pacienteEsus.situacaoConjugal);
                l += $scope.addProp(pacienteEsus.codigoSistemaCbo);
                l += $scope.addProp(pacienteEsus.frequentaEscola);
                l += $scope.addProp(pacienteEsus.nivelEscolaridade);
                l += $scope.addProp(pacienteEsus.situacaoMercadoTrabalho);
                l += $scope.addProp(pacienteEsus.responsavelCrianca);
                l += $scope.addProp(pacienteEsus.frequentaCurandeira);
                l += $scope.addProp(pacienteEsus.participaGrupoComunitario);
                l += $scope.addProp(pacienteEsus.possuiPlanoSaude);
                l += $scope.addProp(pacienteEsus.membroComunidadeTradicional);
                l += $scope.addProp(pacienteEsus.comunidadeTradicional);
                l += $scope.addProp(pacienteEsus.orientacaoSexual);
                l += $scope.addProp(pacienteEsus.deficienciaAuditiva);
                l += $scope.addProp(pacienteEsus.deficienciaVisual);
                l += $scope.addProp(pacienteEsus.deficienciaFisica);
                l += $scope.addProp(pacienteEsus.deficienciaIntelectual);
                l += $scope.addProp(pacienteEsus.deficienciaOutra);
                l += $scope.addProp(pacienteEsus.situacaoRua);
                l += $scope.addProp(pacienteEsus.tempoRua);
                l += $scope.addProp(pacienteEsus.acompanhadoPorOutraInstituicao);
                l += $scope.addProp(pacienteEsus.nomeOutraInstituicao);
                l += $scope.addProp(pacienteEsus.recebeBeneficio);
                l += $scope.addProp(pacienteEsus.possuiReferenciaFamiliar);
                l += $scope.addProp(pacienteEsus.visitaFamiliarFrequentemente);
                l += $scope.addProp(pacienteEsus.grauParentesco);
                l += $scope.addProp(pacienteEsus.refeicoesDia);
                l += $scope.addProp(pacienteEsus.refeicaoRestaurantePopular);
                l += $scope.addProp(pacienteEsus.refeicaoDoacaoRestaurante);
                l += $scope.addProp(pacienteEsus.refeicaoDoacaoReligioso);
                l += $scope.addProp(pacienteEsus.refeicaoDoacaoPopular);
                l += $scope.addProp(pacienteEsus.refeicaoDoacaoOutros);
                l += $scope.addProp(pacienteEsus.acessoHigienePessoal);
                l += $scope.addProp(pacienteEsus.higieneBanho);
                l += $scope.addProp(pacienteEsus.higieneSanitario);
                l += $scope.addProp(pacienteEsus.higieneBucal);
                l += $scope.addProp(pacienteEsus.higieneOutros);
                l += $scope.addProp(pacienteEsus.estaGestante);
                l += $scope.addProp(pacienteEsus.maternidadeReferencia);
                l += $scope.addProp(pacienteEsus.pesoConsiderado);
                l += $scope.addProp(pacienteEsus.fumante);
                l += $scope.addProp(pacienteEsus.dependenteAlcool);
                l += $scope.addProp(pacienteEsus.dependenteDroga);
                l += $scope.addProp(pacienteEsus.temHipertensao);
                l += $scope.addProp(pacienteEsus.temDiabetes);
                l += $scope.addProp(pacienteEsus.teveAvc);
                l += $scope.addProp(pacienteEsus.teveInfarto);
                l += $scope.addProp(pacienteEsus.temHanseniase);
                l += $scope.addProp(pacienteEsus.temTuberculose);
                l += $scope.addProp(pacienteEsus.temTeveCancer);
                l += $scope.addProp(pacienteEsus.internacaoAno);
                l += $scope.addProp(pacienteEsus.causaInternacao);
                l += $scope.addProp(pacienteEsus.fezTratamentoPsiquiatrico);
                l += $scope.addProp(pacienteEsus.estaAcamado);
                l += $scope.addProp(pacienteEsus.estaDomiciliado);
                l += $scope.addProp(pacienteEsus.usaPlantasMedicinais);
                l += $scope.addProp(pacienteEsus.quaisPlantas);
                l += $scope.addProp(pacienteEsus.doencaCardiaca);
                l += $scope.addProp(pacienteEsus.cardiacaInsuficiencia);
                l += $scope.addProp(pacienteEsus.cardiacaOutros);
                l += $scope.addProp(pacienteEsus.cardiacaNaoSabe);
                l += $scope.addProp(pacienteEsus.doencaRins);
                l += $scope.addProp(pacienteEsus.rinsInsuficiencia);
                l += $scope.addProp(pacienteEsus.rinsOutros);
                l += $scope.addProp(pacienteEsus.rinsNaoSabe);
                l += $scope.addProp(pacienteEsus.doencaRespiratoria);
                l += $scope.addProp(pacienteEsus.respiratoriaAsma);
                l += $scope.addProp(pacienteEsus.respiratoriaEfisema);
                l += $scope.addProp(pacienteEsus.respiratoriaOutros);
                l += $scope.addProp(pacienteEsus.respiratoriaNaoSabe);
                l += $scope.addProp(pacienteEsus.outrasPraticasIntegrativas);
                l += $scope.addProp(pacienteEsus.condicaoSaude1);
                l += $scope.addProp(pacienteEsus.condicaoSaude2);
                l += $scope.addProp(pacienteEsus.condicaoSaude3);
                l += $scope.addProp(pacienteEsus.possuiDeficiencia);
                l += $scope.addProp(pacienteEsus.informaOrientacaoSexual);
                l += $scope.addProp(pacienteEsus.possuiSofrimentoPsiquicoGrave);
                l += $scope.addProp(pacienteEsus.utilizaProtese);
                l += $scope.addProp(pacienteEsus.proteseAuditiva);
                l += $scope.addProp(pacienteEsus.proteseMembrosSuperiores);
                l += $scope.addProp(pacienteEsus.proteseMembrosInferiores);
                l += $scope.addProp(pacienteEsus.proteseCadeiraRodas);
                l += $scope.addProp(pacienteEsus.proteseOutros);
                l += $scope.addProp(pacienteEsus.parentescoResponsavel);
                
                return l.substring(0, l.length-1);
            };
            //PacienteEsus
            var sql = "SELECT pe.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " p.codigoSistema AS codigoSistemaPaciente,"+
                    " strftime('%d-%m-%Y', pe.dataCadastro, 'unixepoch') AS dataCadastroFormatada,"+
                    " cbo.codigoSistema AS codigoSistemaCbo"+
                    " FROM pacienteEsus pe"+
                    " LEFT JOIN paciente AS p ON p.id = pe.codigoPaciente "+
                    " LEFT JOIN usuarios AS u ON u.id = pe.codigoUsuario "+
                    " LEFT JOIN cbo AS cbo ON cbo.id = pe.codigoCbo "+
                    " WHERE pe.versaoMobile > ? AND NOT EXISTS (SELECT * FROM erroPaciente AS ep WHERE ep.codigoPaciente = p.id)";
            
            DB.query(sql, [0]).then(function(result){
                var pacienteEsus = DB.fetchAll(result);
                if(pacienteEsus.length > 0){
                    var layout = '';
                    for(var i = 0; i < pacienteEsus.length; i++){
                        layout += montarPacienteEsus(pacienteEsus[i]) + '\n';
                    }
                    SERVER.post('paciente_esus', layout).then(function(data){
                        $scope.resolverRetorno('pacienteEsus', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarPacientes = function(){
            var deferred = $q.defer();
            
            var montarPacientes = function(paciente){
                var l = '';
                l += $scope.addProp(paciente.codigoSistema);
                l += $scope.addProp(paciente.id);
                if(isInvalid(paciente.codigoSistemaUsuario)){
                    l += $scope.addProp($scope.usuarioLogado.codigoSistema);
                }else{
                    l += $scope.addProp(paciente.codigoSistemaUsuario);
                }
                l += $scope.addProp(paciente.excluido);
                l += $scope.addProp(paciente.nome);
                l += $scope.addProp(paciente.dataNascimentoFormatada);
                l += $scope.addProp(paciente.sexo);
                l += $scope.addProp(paciente.nomeMae);
                l += $scope.addProp(paciente.codigoCidadeNascimentoSistema);
                l += $scope.addProp(paciente.cpf);
                l += $scope.addProp(paciente.rg);
                l += $scope.addProp(paciente.telefone);
                l += $scope.addProp(paciente.celular);
                l += $scope.addProp(paciente.codigoRacaSistema);
                l += $scope.addProp(paciente.codigoPaisNascimentoSistema);
                l += $scope.addProp(paciente.email);
                l += $scope.addProp(paciente.apelido);
                l += $scope.addProp(paciente.flagResponsavelFamiliar);
                l += $scope.addProp(paciente.codigoResponsavelSistema);
                l += $scope.addProp(paciente.nacionalidade);
                l += $scope.addProp(paciente.codigoDomicilioSistema);
                l += $scope.addProp(paciente.telefone2);
                l += $scope.addProp(paciente.telefone3);
                l += $scope.addProp(paciente.telefone4);
                l += $scope.addProp(paciente.religiao);
                l += $scope.addProp(paciente.localTrabalho);
                l += $scope.addProp(paciente.telefoneTrabalho);
                l += $scope.addProp(paciente.paciente);
                l += $scope.addProp(paciente.parentescoResponsavel);
                l += $scope.addProp(paciente.urgenciaNome);
                l += $scope.addProp(paciente.urgenciaTelefone);
                l += $scope.addProp(paciente.urgenciaParentesco);
                l += $scope.addProp(paciente.rendaFamiliar);
                if(invalidToEmpty(paciente.resideDesdeFormatado).length > 10){
                    l += $scope.addProp('');
                }else{
                    l += $scope.addProp(paciente.resideDesdeFormatado);
                }
                l += $scope.addProp(paciente.situacao);
                l += $scope.addProp(paciente.nis);
                l += $scope.addProp(paciente.prontuario);
                l += $scope.addProp(paciente.motivoExclusaoDomicilio);
                l += $scope.addProp(paciente.motivoExclusao);
                l += $scope.addProp(paciente.codigoEtniaIndigena);
                
                return l.substring(0, l.length-1);
            };
            //Pacientes
            var sql = "SELECT p.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " strftime('%d-%m-%Y', p.dataNascimento, 'unixepoch') AS dataNascimentoFormatada,"+
                    " strftime('%d-%m-%Y', p.resideDesde, 'unixepoch') AS resideDesdeFormatado,"+
                    " c.codigoSistema AS codigoCidadeNascimentoSistema,"+
                    " pais.codigoSistema AS codigoPaisNascimentoSistema,"+
                    " resp.codigoSistema AS codigoResponsavelSistema,"+
                    " raca.codigoSistema AS codigoRacaSistema,"+
                    " etniaIndigena.codigoSistema AS codigoEtniaIndigenaSistema,"+
                    " dom.codigoSistema AS codigoDomicilioSistema"+
                    " FROM paciente p"+
                    " LEFT JOIN usuarios AS u ON u.id = p.codigoUsuario "+
                    " LEFT JOIN cidade AS c ON c.id = p.codigoCidade "+
                    " LEFT JOIN pais AS pais ON pais.id = p.codigoPais "+
                    " LEFT JOIN raca AS raca ON raca.id = p.codigoRaca "+
                    " LEFT JOIN etniaIndigena AS etniaIndigena ON etniaIndigena.id = p.codigoEtniaIndigena "+
                    " LEFT JOIN domicilio AS dom ON dom.id = p.codigoDomicilio "+
                    " LEFT JOIN paciente AS resp ON resp.id = p.codigoResponsavelFamiliar "+
                    " WHERE p.versaoMobile > ? AND NOT EXISTS (SELECT * FROM erroPaciente AS ep WHERE ep.codigoPaciente = p.id)";
            
            DB.query(sql, [0]).then(function(result){
                var pacientes = DB.fetchAll(result);
                if(pacientes.length > 0){
                    var layout = '';
                    for(var i = 0; i < pacientes.length; i++){
                        layout += montarPacientes(pacientes[i]) + '\n';
                    }
                    SERVER.post('paciente', layout).then(function(data){
                        $scope.resolverRetorno('paciente', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarResponsaveis = function(){
            var deferred = $q.defer();
            
            var montarResponsaveis = function(responsavel){
                var l = '';
                l += $scope.addProp(responsavel.codigoSistema);
                l += $scope.addProp(responsavel.id);
                l += $scope.addProp(responsavel.codigoSistemaUsuario);
                l += $scope.addProp(responsavel.excluido);
                l += $scope.addProp(responsavel.nome);
                l += $scope.addProp(responsavel.dataNascimentoFormatada);
                l += $scope.addProp(responsavel.sexo);
                l += $scope.addProp(responsavel.nomeMae);
                l += $scope.addProp(responsavel.codigoCidadeNascimentoSistema);
                l += $scope.addProp(responsavel.cpf);
                l += $scope.addProp(responsavel.rg);
                l += $scope.addProp(responsavel.telefone);
                l += $scope.addProp(responsavel.celular);
                l += $scope.addProp(responsavel.codigoRacaSistema);
                l += $scope.addProp(responsavel.codigoPaisNascimentoSistema);
                l += $scope.addProp(responsavel.email);
                l += $scope.addProp(responsavel.apelido);
                l += $scope.addProp(responsavel.flagResponsavelFamiliar);
                l += $scope.addProp(null);
                l += $scope.addProp(responsavel.nacionalidade);
                l += $scope.addProp(responsavel.codigoDomicilioSistema);
                l += $scope.addProp(responsavel.telefone2);
                l += $scope.addProp(responsavel.telefone3);
                l += $scope.addProp(responsavel.telefone4);
                l += $scope.addProp(responsavel.religiao);
                l += $scope.addProp(responsavel.localTrabalho);
                l += $scope.addProp(responsavel.telefoneTrabalho);
                l += $scope.addProp(responsavel.responsavel);
                l += $scope.addProp(responsavel.parentescoResponsavel);
                l += $scope.addProp(responsavel.urgenciaNome);
                l += $scope.addProp(responsavel.urgenciaTelefone);
                l += $scope.addProp(responsavel.urgenciaParentesco);
                l += $scope.addProp(responsavel.rendaFamiliar);
                l += $scope.addProp(responsavel.resideDesdeFormatado);
                l += $scope.addProp(responsavel.situacao);
                l += $scope.addProp(responsavel.nis);
                l += $scope.addProp(responsavel.prontuario);
                l += $scope.addProp(responsavel.motivoExclusaoDomicilio);
                l += $scope.addProp(responsavel.motivoExclusao);
                l += $scope.addProp(responsavel.codigoEtniaIndigena);
                
                return l.substring(0, l.length-1);
            };
            //Responsaveis
            var sql = "SELECT DISTINCT p.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " strftime('%d-%m-%Y', p.dataNascimento, 'unixepoch') AS dataNascimentoFormatada,"+
                    " strftime('%d-%m-%Y', p.resideDesde, 'unixepoch') AS resideDesdeFormatado,"+
                    " c.codigoSistema AS codigoCidadeNascimentoSistema,"+
                    " pais.codigoSistema AS codigoPaisNascimentoSistema,"+
                    " p.codigoSistema AS codigoResponsavelSistema,"+
                    " raca.codigoSistema AS codigoRacaSistema,"+
                    " etniaIndigena.codigoSistema AS codigoEtniaIndigenaSistema,"+
                    " dom.codigoSistema AS codigoDomicilioSistema"+
                    " FROM paciente p"+
                    " LEFT JOIN usuarios AS u ON u.id = p.codigoUsuario "+
                    " LEFT JOIN cidade AS c ON c.id = p.codigoCidade "+
                    " LEFT JOIN pais AS pais ON pais.id = p.codigoPais "+
                    " LEFT JOIN raca AS raca ON raca.id = p.codigoRaca "+
                    " LEFT JOIN etniaIndigena AS etniaIndigena ON etniaIndigena.id = p.codigoEtniaIndigena "+
                    " LEFT JOIN domicilio AS dom ON dom.id = p.codigoDomicilio "+
                    " , paciente t2 "+
                    " WHERE p.versaoMobile > ? "+
                    " AND p.id = t2.codigoResponsavelFamiliar ORDER BY p.id";
            
            DB.query(sql, [0]).then(function(result){
                var responsaveis = DB.fetchAll(result);
                if(responsaveis.length > 0){
                    var layout = '';
                    for(var i = 0; i < responsaveis.length; i++){
                        layout += montarResponsaveis(responsaveis[i]) + '\n';
                    }
                    SERVER.post('paciente', layout).then(function(data){
                        $scope.resolverRetorno('paciente', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarDomicilioEsus = function(){
            var deferred = $q.defer();
            
            var montarDomicilioEsus = function(domicilioEsus){
                var l = '';
                l += $scope.addProp(domicilioEsus.codigoSistema);
                l += $scope.addProp(domicilioEsus.id);
                l += $scope.addProp(domicilioEsus.codigoSistemaUsuario);
                l += $scope.addProp(domicilioEsus.codigoDomicilioSistema);
                l += $scope.addProp(domicilioEsus.situacaoMoradia);
                l += $scope.addProp(domicilioEsus.localizacao);
                l += $scope.addProp(domicilioEsus.tipoDomicilio);
                l += $scope.addProp(domicilioEsus.numeroMoradores);
                l += $scope.addProp(domicilioEsus.numeroComodos);
                l += $scope.addProp(domicilioEsus.condicaoUsoTerra);
                l += $scope.addProp(domicilioEsus.tipoAcessoDomicilio);
                l += $scope.addProp(domicilioEsus.materialDominante);
                l += $scope.addProp(domicilioEsus.possuiEnergiaEletrica);
                l += $scope.addProp(domicilioEsus.abastecimentoAgua);
                l += $scope.addProp(domicilioEsus.tratamentoAgua);
                l += $scope.addProp(domicilioEsus.esgotamento);
                l += $scope.addProp(domicilioEsus.destinoLixo);
                l += $scope.addProp(domicilioEsus.gato);
                l += $scope.addProp(domicilioEsus.cachorro);
                l += $scope.addProp(domicilioEsus.passaro);
                l += $scope.addProp(domicilioEsus.criacao);
                l += $scope.addProp(domicilioEsus.outros);
                l += $scope.addProp(domicilioEsus.quantos);
                l += $scope.addProp(domicilioEsus.dataGpsFormatada);
                l += $scope.addProp(domicilioEsus.horaGpsFormatada);
                l += $scope.addProp(domicilioEsus.latitude);
                l += $scope.addProp(domicilioEsus.longitude);
                
                return l.substring(0, l.length-1);
            };
            //Domicilio Esus
            var sql = "SELECT de.*, "+
                    " strftime('%d-%m-%Y', de.dataColetaGps, 'unixepoch') AS dataGpsFormatada,"+
                    " strftime('%H:%M:%S', de.dataColetaGps, 'unixepoch', 'localtime') AS horaGpsFormatada,"+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " d.codigoSistema AS codigoDomicilioSistema"+
                    " FROM domicilioEsus de"+
                    " LEFT JOIN domicilio AS d ON d.id = de.codigoDomicilio "+
                    " LEFT JOIN usuarios AS u ON u.id = de.codigoUsuario "+
                    " WHERE de.versaoMobile > ? AND NOT EXISTS (SELECT * FROM erroDomicilio AS ed WHERE ed.codigoDomicilio = d.id)";
            
            DB.query(sql, [0]).then(function(result){
                var domiciliosEsus = DB.fetchAll(result);
                if(domiciliosEsus.length > 0){
                    var layout = '';
                    for(var i = 0; i < domiciliosEsus.length; i++){
                        layout += montarDomicilioEsus(domiciliosEsus[i]) + '\n';
                    }
                    SERVER.post('domicilio_esus', layout).then(function(data){
                        $scope.resolverRetorno('domicilioEsus', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarDomicilio = function(){
            var deferred = $q.defer();
            
            var montarDomicilio = function(domicilio){
                var l = '';
                l += $scope.addProp(domicilio.codigoSistema);
                l += $scope.addProp(domicilio.id);
                l += $scope.addProp(domicilio.codigoSistemaUsuario);
                l += $scope.addProp(domicilio.codigoEnderecoSistema);
                l += $scope.addProp(domicilio.numeroFamilia);
                l += $scope.addProp(domicilio.codigoMicroAreaSistema);
                
                return l.substring(0, l.length-1);
            };
            //Domicilio
            var sql = "SELECT d.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " e.codigoSistema AS codigoEnderecoSistema,"+
                    " ma.codigoSistema AS codigoMicroAreaSistema"+
                    " FROM domicilio d"+
                    " LEFT JOIN usuarios AS u ON u.id = d.codigoUsuario "+
                    " LEFT JOIN endereco AS e ON e.id = d.codigoEndereco "+
                    " LEFT JOIN microArea AS ma ON ma.id = d.codigoMicroArea "+
                    " WHERE d.versaoMobile > ? ";
            
            DB.query(sql, [0]).then(function(result){
                var domicilios = DB.fetchAll(result);
                if(domicilios.length > 0){
                    var layout = '';
                    for(var i = 0; i < domicilios.length; i++){
                        layout += montarDomicilio(domicilios[i]) + '\n';
                    }
                    SERVER.post('domicilio', layout).then(function(data){
                        $scope.resolverRetorno('domicilio', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.enviarEndereco = function(){
            var deferred = $q.defer();
            
            var montarEndereco = function(endereco){
                var l = '';
                l += $scope.addProp(endereco.codigoSistema);
                l += $scope.addProp(endereco.id);
                l += $scope.addProp(endereco.codigoSistemaUsuario);
                l += $scope.addProp(endereco.codigoCidadeSistema);
                l += $scope.addProp(endereco.cep);
                l += $scope.addProp(endereco.bairro);
                l += $scope.addProp(endereco.codigoTipoLogradouroSistema);
                l += $scope.addProp(endereco.logradouro);
                l += $scope.addProp(endereco.complementoLogradouro);
                l += $scope.addProp(endereco.numeroLogradouro);
                l += $scope.addProp(endereco.telefone);
                l += $scope.addProp(endereco.telefoneReferencia);
                l += $scope.addProp(endereco.pontoReferencia);
                
                return l.substring(0, l.length-1);
            };
            //Endereco
            var sql = "SELECT e.*, "+
                    " u.codigoSistema AS codigoSistemaUsuario,"+
                    " c.codigoSistema AS codigoCidadeSistema,"+
                    " tl.codigoSistema AS codigoTipoLogradouroSistema"+
                    " FROM endereco e"+
                    " LEFT JOIN usuarios AS u ON u.id = e.codigoUsuario "+
                    " LEFT JOIN cidade AS c ON c.id = e.codigoCidade "+
                    " LEFT JOIN tipoLogradouro AS tl ON tl.id = e.codigoTipoLogradouro "+
                    " WHERE e.versaoMobile > ? ";
            
            DB.query(sql, [0]).then(function(result){
                var enderecos = DB.fetchAll(result);
                if(enderecos.length > 0){
                    var layout = '';
                    for(var i = 0; i < enderecos.length; i++){
                        layout += montarEndereco(enderecos[i]) + '\n';
                    }
                    SERVER.post('endereco', layout).then(function(data){
                        $scope.resolverRetorno('endereco', data, true).then(function(){
                            return deferred.resolve();
                        });
                    }, function(){
                        return deferred.reject();
                    });
                }else{
                    return deferred.resolve();
                }
            });
            
            return deferred.promise;
        };
        
        $scope.iniciarSincronizacao = function(){
            $scope.log.unshift('Iniciando processo de sincronização...');
            
            DB.deleteVersionTriggers().then(function(){
                if(window.localStorage.getItem("sincronizacaoFinalizada")){
                    $scope.enviarRecursos().then(function(){
                        
                        $scope.importarCbo();
                    });
                }else{
                    //devido ao processo de importação ser assincrono, ao fim da importação de
                    //uma tabela a proxima é chamada.
                    $scope.importarCbo();
                }
            });
        };
        
        $scope.importarCbo = function(){
            $scope.versaoExistente('cbo').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=cbo'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseCbo(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarProfissional();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarProfissional = function(){
            $scope.versaoExistente('profissional').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=profissional'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseProfissional(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarUsuarios();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarUsuarios = function(){
            $scope.versaoExistente('usuarios').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=usuarios'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseUsuarios(data, versao === 0 )
                            .then(function(){
                        
                                $scope.importarOrgaoEmissor();

                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarOrgaoEmissor = function(){
            $scope.versaoExistente('orgaoEmissor').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=orgao_emissor'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseOrgaoEmissor(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarRaca();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarRaca = function(){
            $scope.versaoExistente('raca').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=raca'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseRaca(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarEtnia();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarEtnia = function(){
            $scope.versaoExistente('etniaIndigena').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=etnia_indigena'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseEtniaIndigena(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarTipoLogradouro();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarTipoLogradouro = function(){
            $scope.versaoExistente('tipoLogradouro').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=tipo_logradouro'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseTipoLogradouro(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarPais();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarPais = function(){
            $scope.versaoExistente('pais').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=pais'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parsePais(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarEstado();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarEstado = function(){
            $scope.versaoExistente('estado').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=estado'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseEstado(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarCidade();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarCidade = function(){
            $scope.versaoExistente('cidade').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=cidade'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseCidade(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarEquipe();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarEquipe = function(){
            $scope.versaoExistente('equipe').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=equipe'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseEquipe(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarMicroArea();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarMicroArea = function(){
            $scope.versaoExistente('microArea').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=micro_area'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseMicroArea(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarEquipeProfissional();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarEquipeProfissional = function(){
            $scope.versaoExistente('equipeProfissional').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=equipe_profissional'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseEquipeProfissional(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarEndereco();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };

        $scope.importarEndereco = function(){
            $scope.versaoExistente('endereco').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                $scope.baixarArquivo(versao, 'endereco').then(function(){
                    $scope.log.unshift('Importando endereços');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {

                                var reader = new FileReader();
                                reader.onloadend = function(e) {
                                    $scope.parseEndereco(this.result, versao === 0).then(function(){
                                        $scope.log.unshift('Enderecos importados com sucesso');
                                        $scope.finalizarEndereco();
                                    }, function(err){
                                        $scope.log.unshift('ERRO AO IMPORTAR ENDERECOS' + JSON.stringify(err));
                                    }); 
                                };

                                reader.readAsText(file);

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };

        $scope.finalizarEndereco = function() {
            $scope.log.unshift('Endereços importados com sucesso');
            $scope.importarDomicilio();
        };
        
        $scope.importarDomicilio = function(){
            $scope.versaoExistente('domicilio').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'domicilio').then(function(){
                    $scope.log.unshift('Importando domicílios');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {

                                var reader = new FileReader();
                                reader.onloadend = function(e) {
                                    $scope.parseDomicilio(this.result, versao === 0).then(function(){
                                        $scope.log.unshift('Domicilios importados com sucesso');
                                        $scope.finalizarDomicilio();
                                    }, function(err){
                                        $scope.log.unshift('ERRO AO IMPORTAR DOMICILIOS' + JSON.stringify(err));
                                    }); 
                                };

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };

        $scope.finalizarDomicilio = function() {
            $scope.log.unshift('Domicílios importados com sucesso');
            $scope.importarDomicilioEsus();
        };
        
        $scope.importarDomicilioEsus = function(){
            $scope.versaoExistente('domicilioEsus').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'domicilio_esus').then(function(){
                    $scope.log.unshift('Importando domicíliosEsus');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {
               
                                var reader = new FileReader();
                                reader.onloadend = function(e) {
                                    $scope.parseDomicilioEsus(this.result, versao === 0).then(function(){
                                        $scope.log.unshift('Domicilios Esus importados com sucesso');
                                        $scope.finalizarDomicilioEsus();
                                    }, function(err){
                                        $scope.log.unshift('ERRO AO IMPORTAR DOMICILIOS Esus ' + JSON.stringify(err));
                                    }); 
                                };
                                
                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };

        $scope.finalizarDomicilioEsus = function() {
            $scope.log.unshift('DomicíliosEsus importados com sucesso');
            $scope.importarPaciente();
        };
        
        $scope.importarPaciente = function(){
            $scope.versaoExistente('paciente').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'paciente').then(function(){
                    $scope.log.unshift('Importando pacientes');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var lr = new LineReader({
                                    chunkSize: 600
                                });
                                var totalCount = 0;
                                var lineGroup = '';
                                lr.on('line', function (line, next) {
                                    lineGroup += line + '\n';
                                    totalCount++;
                                    if(totalCount % 1000 === 0){
                                        $scope.parsePaciente(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('['+totalCount+'] Importados');
                                            lineGroup = '';
                                            next();
                                        }, function(){
                                            lr.abort();
                                        }); 
                                    }else{
                                        next();
                                    }
                                });
                                lr.on('error', function (err) {
                                    $scope.log.unshift('ERRO AO LER ARQUIVO: '+err);
                                });
                                lr.on('end', function() {
                                    if(lineGroup !== ''){
                                        $scope.parsePaciente(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('TOTAL DE REGISTROS: '+ totalCount);
                                            $scope.finalizarPaciente();
                                        }); 
                                    }else{
                                        $scope.finalizarPaciente();
                                        $scope.$apply();
                                    }
                                });
                                lr.read(file);                        

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };

        $scope.finalizarPaciente = function() {
            $scope.atualizarResponsavelPaciente().then(function(){
                $scope.log.unshift('Pacientes importados com sucesso');
                $scope.importarCns();
            });
        };
        
        $scope.atualizarResponsavelPaciente = function(){
            var deferred = $q.defer();
            $scope.log.unshift('Atualizando responsáveis');
            
            var errorMessage = '';
            DB.session.transaction(function (tx) {
                var sql = "UPDATE paciente"+
                " SET codigoResponsavelFamiliar = (SELECT p2.id FROM paciente AS p2 WHERE p2.codigoSistema = (SELECT pacienteResponsavelAux.codigoResponsavelSistema"+
                    " FROM pacienteResponsavelAux"+
                    " WHERE pacienteResponsavelAux.codigoPacienteSistema = paciente.codigoSistema ))"+
                " WHERE EXISTS (SELECT * FROM pacienteResponsavelAux"+
                    " WHERE pacienteResponsavelAux.codigoPacienteSistema = paciente.codigoSistema)";
                tx.executeSql(sql, [], function (transaction, result) {
                }, function (transaction, error) {
                    if(errorMessage === ''){
                        errorMessage = error.message;
                    }
                    return true;
                });

                tx.executeSql("DELETE FROM pacienteResponsavelAux", [], function (transaction, result) {
                }, function (transaction, error) {
                    if(errorMessage === ''){
                        errorMessage = error.message;
                    }
                    return true;
                });
            }, function(e){
                $scope.log.unshift('Erro ao atualizar responsáveis do paciente.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.importarCns = function(){
            $scope.versaoExistente('cns').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'cns').then(function(){
                    $scope.log.unshift('Importando CNS');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var lr = new LineReader({
                                    chunkSize: 600
                                });
                                var totalCount = 0;
                                var lineGroup = '';
                                lr.on('line', function (line, next) {
                                    lineGroup += line + '\n';
                                    totalCount++;
                                    if(totalCount % 2000 === 0){
                                        $scope.parseCns(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('['+totalCount+'] Importados');
                                            lineGroup = '';
                                            next();
                                        }, function(){
                                            lr.abort();
                                        }); 
                                    }else{
                                        next();
                                    }
                                });
                                lr.on('error', function (err) {
                                    $scope.log.unshift('ERRO AO LER ARQUIVO: '+err);
                                });
                                lr.on('end', function() {
                                    if(lineGroup !== ''){
                                        $scope.parseCns(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('TOTAL DE REGISTROS: '+ totalCount);
                                            $scope.finalizarCns();
                                        }); 
                                    }else{
                                        $scope.finalizarCns();
                                        $scope.$apply();
                                    }
                                });
                                lr.read(file);                        

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };
        
        $scope.finalizarCns = function() {
            $scope.importarDocumentos();
        };
        
        $scope.importarDocumentos = function(){
            $scope.versaoExistente('documentos').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'documentos').then(function(){
                    $scope.log.unshift('Importando Documentos');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var lr = new LineReader({
                                    chunkSize: 600
                                });
                                var totalCount = 0;
                                var lineGroup = '';
                                lr.on('line', function (line, next) {
                                    lineGroup += line + '\n';
                                    totalCount++;
                                    if(totalCount % 2000 === 0){
                                        $scope.parseDocumentos(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('['+totalCount+'] Importados');
                                            lineGroup = '';
                                            next();
                                        }, function(){
                                            lr.abort();
                                        }); 
                                    }else{
                                        next();
                                    }
                                });
                                lr.on('error', function (err) {
                                    $scope.log.unshift('ERRO AO LER ARQUIVO: '+err);
                                });
                                lr.on('end', function() {
                                    if(lineGroup !== ''){
                                        $scope.parseDocumentos(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('TOTAL DE REGISTROS: '+ totalCount);
                                            $scope.finalizarDocumentos();
                                        }); 
                                    }else{
                                        $scope.finalizarDocumentos();
                                        $scope.$apply();
                                    }
                                });
                                lr.read(file);                        

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };
        
        $scope.finalizarDocumentos = function() {
            $scope.log.unshift('Documentos importados com sucesso');
            $scope.importarPacienteEsus();
        };
        
        $scope.importarPacienteEsus = function(){
            $scope.versaoExistente('pacienteEsus').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'paciente_esus').then(function(){
                    $scope.log.unshift('Importando Paciente Esus');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var lr = new LineReader({
                                    chunkSize: 600
                                });
                                var totalCount = 0;
                                var lineGroup = '';
                                lr.on('line', function (line, next) {
                                    lineGroup += line + '\n';
                                    totalCount++;
                                    if(totalCount % 2000 === 0){
                                        $scope.parsePacienteEsus(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('['+totalCount+'] Importados');
                                            lineGroup = '';
                                            next();
                                        }, function(){
                                            lr.abort();
                                        }); 
                                    }else{
                                        next();
                                    }
                                });
                                lr.on('error', function (err) {
                                    $scope.log.unshift('ERRO AO LER ARQUIVO: '+err);
                                });
                                lr.on('end', function() {
                                    if(lineGroup !== ''){
                                        $scope.parsePacienteEsus(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('TOTAL DE REGISTROS: '+ totalCount);
                                            $scope.finalizarPacienteEsus();
                                        }); 
                                    }else{
                                        $scope.finalizarPacienteEsus();
                                        $scope.$apply();
                                    }
                                });
                                lr.read(file);                        

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };
        
        $scope.finalizarPacienteEsus = function() {
            $scope.importarPacienteDado();
        };
        
        $scope.importarPacienteDado = function(){
            $scope.versaoExistente('pacienteDado').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $scope.baixarArquivo(versao, 'paciente_dado').then(function(){
                    $scope.log.unshift('Importando Paciente Dado');
                    $scope.log.unshift('Importação por meio de arquivo');
                    
                        FS.fileSystem.root.getFile("celk/familias/tabelaTemp.txt", null, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var lr = new LineReader({
                                    chunkSize: 600
                                });
                                var totalCount = 0;
                                var lineGroup = '';
                                lr.on('line', function (line, next) {
                                    lineGroup += line + '\n';
                                    totalCount++;
                                    if(totalCount % 2000 === 0){
                                        $scope.parsePacienteDado(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('['+totalCount+'] Importados');
                                            lineGroup = '';
                                            next();
                                        }, function(){
                                            lr.abort();
                                        }); 
                                    }else{
                                        next();
                                    }
                                });
                                lr.on('error', function (err) {
                                    $scope.log.unshift('ERRO AO LER ARQUIVO: '+err);
                                });
                                lr.on('end', function() {
                                    if(lineGroup !== ''){
                                        $scope.parsePacienteDado(lineGroup, versao === 0).then(function(){
                                            $scope.log.unshift('TOTAL DE REGISTROS: '+ totalCount);
                                            $scope.finalizarPacienteDado();
                                        }); 
                                    }else{
                                        $scope.finalizarPacienteDado();
                                        $scope.$apply();
                                    }
                                });
                                lr.read(file);                        

                            }, $scope.failFile);
                        }, $scope.failFile);

                }, function(error){
                    $scope.problemaImportarArquivo(error);
                });                
            });
        };
        
        $scope.finalizarPacienteDado = function() {
            $scope.importarNotificacaoPaciente();
        };

        $scope.importarNotificacaoPaciente = function(){
            $scope.versaoExistente('notificacaoPaciente').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=notificacao_paciente'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseNotificacaoPaciente(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarNotificacaoAgendas();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };
        
        $scope.parseNotificacaoPaciente = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Notificações Paciente');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": registro[0],
                    "versao": parseInt(registro[1]),
                    "codigoPaciente": parseInt(registro[2]),
                    "vacinaAtrasada": parseInt(registro[3])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT OR REPLACE INTO notificacaoPaciente " +
                            "(id, codigoSistema, versao, codigoPaciente, vacinaAtrasada) " +
                            "VALUES (?, ?, ?,"+
                            "(SELECT id FROM paciente WHERE codigoSistema = ?), ?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoPaciente);
                        binding.push(u.vacinaAtrasada);
                        
                    }else{
                        sql = "INSERT OR REPLACE INTO notificacaoPaciente " +
                            "(id, codigoSistema, versao, codigoPaciente, vacinaAtrasada) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+","+
                                "(SELECT id FROM paciente WHERE codigoSistema = ?),"+
                                +u.vacinaAtrasada+" FROM notificacaoPaciente WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM notificacaoPaciente WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoPaciente);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Notificações Paciente.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Notificações Paciente importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.importarNotificacaoAgendas = function(){
            $scope.versaoExistente('notificacaoAgendas').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=notificacao_agenda'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseNotificacaoAgendas(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarMotivoNaoComparecimento();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };
        
        $scope.parseNotificacaoAgendas = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' NOTIFICACOES AGENDA');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": registro[0],
                    "versao": parseInt(registro[1]),
                    "codigoAgenda": parseInt(registro[2]),
                    "codigoPaciente": parseInt(registro[3]),
                    "status": parseInt(registro[4]),
                    "dataAgendamento": null,
                    "local": emptyToNull(registro[6]),
                    "tipoAgenda": emptyToNull(registro[7])
                };
                if(registro[5] !== ''){
                    var date = registro[5].substring(0, 10).split('-');
                    var hora = registro[5].substring(10).split(':');
                    itens[i].dataAgendamento = new Date(date[2], date[1] -1, date[0], hora[0], hora[1], hora[2], 0).getTime() / 1000;
                }
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT OR REPLACE INTO notificacaoAgendas " +
                            "(id, codigoSistema, versao, codigoAgenda, codigoPaciente, status, tipoAgenda, local, dataAgendamento) " +
                            "VALUES (?, ?, ?,?,"+
                            "(SELECT id FROM paciente WHERE codigoSistema = ?), ?,?,?,?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoAgenda);
                        binding.push(u.codigoPaciente);
                        binding.push(u.status);
                        binding.push(u.tipoAgenda);
                        binding.push(u.local);
                        binding.push(u.dataAgendamento);
                        
                    }else{
                        sql = "INSERT OR REPLACE INTO notificacaoAgendas " +
                            "(id, codigoSistema, versao, codigoAgenda, codigoPaciente, status, tipoAgenda, local, dataAgendamento) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+","+u.codigoAgenda+","+
                                "(SELECT id FROM paciente WHERE codigoSistema = ?),"+
                                +u.status+",'"+u.tipoAgenda+"','"+u.local+"', ? FROM notificacaoAgendas WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM notificacaoAgendas WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoPaciente);
                        binding.push(u.dataAgendamento);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar NOTIFICACOES AGENDA.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('NOTIFICACOES AGENDA importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.importarMotivoNaoComparecimento = function(){
            $scope.versaoExistente('motivoNaoComparecimento').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=motivo_nao_comparecimento'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseMotivoNaoComparecimento(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarTipoVacina();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };
        
        $scope.parseMotivoNaoComparecimento = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Motivo Não Comparecimento');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": registro[0],
                    "versao": parseInt(registro[1]),
                    "outros": parseInt(registro[2]),
                    "descricao": emptyToNull(registro[3])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT OR REPLACE INTO motivoNaoComparecimento " +
                            "(id, codigoSistema, versao, outros, descricao) " +
                            "VALUES (?, ?, ?, ?, ?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.outros);
                        binding.push(u.descricao);
                        
                    }else{
                        sql = "INSERT OR REPLACE INTO motivoNaoComparecimento " +
                            "(id, codigoSistema, versao, outros, descricao) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+","+u.outros+",'"+u.descricao+"'"+
                                " FROM motivoNaoComparecimento WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM motivoNaoComparecimento WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Motivos de Não Comparecimento.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Motivos de Não Comparecimento importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.importarTipoVacina = function(){
            $scope.versaoExistente('tipoVacina').then(function(versao){
                if(! versao){
                    versao = 0;
                }
                
                $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                    + 'nomeRecurso=tipo_vacina'
                    + '&versao='+versao)
                    .success(function (data, status, headers, config) {
                        $scope.parseTipoVacina(data, versao === 0 )
                            .then(function(){
                                
                                $scope.importarPacientesRegistroVacinaAberto();
                        
                            },function(){$scope.problemaParse();});
                    })
                    .error(function (data, status, headers, config) {
                        $scope.problemaConexao();
                    });
            });
        };
        
        $scope.parseTipoVacina = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Tipo Vacina');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT OR REPLACE INTO tipoVacina " +
                            "(id, codigoSistema, versao, descricao) " +
                            "VALUES (?, ?, ?, ?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.descricao);
                        
                    }else{
                        sql = "INSERT OR REPLACE INTO tipoVacina " +
                            "(id, codigoSistema, versao, descricao) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"'"+
                                " FROM tipoVacina WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM tipoVacina WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Tipo de Vacina.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Tipos de Vacina importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.importarPacientesRegistroVacinaAberto = function(){
            $http.get($scope.url + G_versao + '/' + G_id + '/registroVacinasAberto')
                .success(function (data, status, headers, config) {
                    if(data.length > 0){
                        var binding = [];
                        var sql = "update paciente set registroVacina = 1 where codigoSistema in ("; 
                        for(var i = 0; i < data.length; i++){
                            binding.push(data[i]);
                            sql += "?,";
                        }
                        sql = sql.substring(0, sql.length-1) + ")";
                        DB.query(sql, binding);

                        var binding = [];
                        var sql = "update paciente set registroVacina = 0 where registroVacina = 1 AND codigoSistema not in ("; 
                        for(var i = 0; i < data.length; i++){
                            binding.push(data[i]);
                            sql += "?,";
                        }
                        sql = sql.substring(0, sql.length-1) + ")";
                        DB.query(sql, binding);
                        
                        $scope.importarRegistrosExcluidos();
                    }
                })
                .error(function (data, status, headers, config) {
                    $scope.problemaConexao();
                });
        };

        $scope.importarRegistrosExcluidos = function() {
            var versao = window.localStorage.getItem("versaoExclusao");
            if(! versao){
                versao = 0;
            }
                
            $http.post($scope.url + G_versao + '/' + G_id + '/consultarRecurso?'
                + 'nomeRecurso=EXCLUSOES'
                + '&versao='+versao)
                .success(function (data, status, headers, config) {

                    $scope.parseExclusoes(data, versao === 0 );
                    $scope.sucessoNaImportacao();
                            
                })
                .error(function (data, status, headers, config) {
                    $scope.problemaConexao();
                });
        };

        $scope.parseExclusoes = function(data, novo) {
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Raças');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "tipoRegistro": emptyToNull(registro[2]).replace('_', ''),
                    "idRegistro": emptyToNull(registro[3])
                };
            }
            
            for (var i = 0; i < itens.length; i++) {
                var u = itens[i];
                var binding = [];
                var sql = "DELETE FROM " + u.tipoRegistro +
                    " WHERE codigoSistema = ? ";
                binding.push(u.idRegistro);

                DB.query(sql, binding, null, function(err){
                    $scope.bind.erros.push('Erro ao excluir '+u.tipoRegistro);
                    $scope.bind.erros.push(err.message);
                });
            }
            
            if(itens.length > 0){
                window.localStorage.setItem("versaoExclusao", itens[itens.length -1].versao);
            }
        };
        
        $scope.parseCbo = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' CBOs');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": registro[0],
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO cbo " +
                            "(id, codigoSistema, versao, descricao) " +
                            "VALUES (?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO cbo " +
                            "(id, codigoSistema, versao, descricao) " +
                            "SELECT CASE WHEN codigoSistema = '"+u.codigoSistema+"' THEN id ELSE null END ,'" +
                                u.codigoSistema+"',"+u.versao+",'"+u.descricao+"' FROM cbo WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM cbo WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar CBOs.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('CBOs importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.parseProfissional = function (data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Profissionais');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "nome": emptyToNull(registro[2])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO profissional " +
                            "(id, codigoSistema, versao, nome) " +
                            "VALUES (?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO profissional " +
                            "(id, codigoSistema, versao, nome) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.nome+"' FROM profissional WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM profissional WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar profissionais.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Profissionais importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.parseUsuarios = function (data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' usuários');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "nome": emptyToNull(registro[2]),
                    "login": emptyToNull(registro[3]),
                    "senha": emptyToNull(registro[4]),
                    "status": emptyToNull(registro[5]),
                    "codigoProfissional": parseInt(registro[6]),
                    "nivel": emptyToNull(registro[7])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    if(novo){
                        var sql = "INSERT INTO usuarios " +
                                "(id, codigoSistema, versao, nome, login, senha, status, codigoProfissional, nivel) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        if (!u.codigoProfissional) {
                            for (var key in u) {
                                if (u.hasOwnProperty(key)) {
                                    binding.push(u[key]);
                                }
                            }
                        } else {
                            sql = "INSERT INTO usuarios " +
                                    "(id, codigoSistema, versao, nome, login, senha, status, codigoProfissional, nivel) " +
                                    " SELECT " + u.id + "," + u.codigoSistema + "," + u.versao + ",'" + u.nome + "','" + u.login + "','" + u.senha + "','" + u.status + "', id,'" + u.nivel + "'" +
                                    " FROM profissional" +
                                    " WHERE codigoSistema = ?";
                            binding.push(u.codigoProfissional);
                        }
                    } else {
                        if(!u.codigoProfissional){
                            sql = "INSERT OR REPLACE INTO usuarios " +
                                "(id, codigoSistema, versao, nome, login, senha, status, codigoProfissional, nivel) " +
                                "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                    u.codigoSistema+","+u.versao+",'"+u.nome+"','"+u.login+"','"+u.senha+"','"+u.status+"', null ,'"+u.nivel+"'"+
                                    " FROM usuarios WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM usuarios WHERE codigoSistema = ?) LIMIT 1";
                        }else{
                            sql = "INSERT OR REPLACE INTO usuarios " +
                                "(id, codigoSistema, versao, nome, login, senha, status, codigoProfissional, nivel) " +
                                "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                    u.codigoSistema+","+u.versao+",'"+u.nome+"','"+u.login+"','"+u.senha+"','"+u.status+"', (SELECT id FROM profissional WHERE codigoSistema = "+u.codigoProfissional+") ,'"+u.nivel+"'"+
                                    " FROM usuarios WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM usuarios WHERE codigoSistema = ?) LIMIT 1";
                        }
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        if(result.rowsAffected !== 1){
                            errorMessage = 'Código do profissional não encontrado';
                            transaction.rollback();
                        }
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar usuários.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Usuários importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };

        $scope.parseOrgaoEmissor = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Orgãos de Emissão');
            for (var i = 0; i < linha.length-1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": registro[2],
                    "sigla": emptyToNull(registro[3])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO orgaoEmissor " +
                            "(id, codigoSistema, versao, descricao, sigla) " +
                            "VALUES (?, ?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO orgaoEmissor " +
                            "(id, codigoSistema, versao, descricao, sigla) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"','"+u.sigla+"' FROM orgaoEmissor WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM orgaoEmissor WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Orgãos de Emissão.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Orgãos de Emissão importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseRaca = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Raças');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO raca " +
                            "(id, codigoSistema, versao, descricao) " +
                            "VALUES (?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO raca " +
                            "(id, codigoSistema, versao, descricao) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"' FROM raca WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM raca WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Raças.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Raças importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseEtniaIndigena = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Etnias');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO etniaIndigena " +
                            "(id, codigoSistema, versao, descricao) " +
                            "VALUES (?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO etniaIndigena " +
                            "(id, codigoSistema, versao, descricao) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"' FROM etniaIndigena WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM etniaIndigena WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Etnias Indigenas.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Etnias Indigenas importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseTipoLogradouro = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Tipos de Logradouro');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2]),
                    "sigla": emptyToNull(registro[3]),
                    "ordem": 999
                };
                if(registro[2] == 'RUA' 
                        || registro[2] == 'TRAVESSA'
                        || registro[2] == 'AVENIDA'
                        || registro[2] == 'ESTRADA' ){
                    itens[i].ordem = 0;
                }
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO tipoLogradouro " +
                            "(id, codigoSistema, versao, descricao, sigla, ordem) " +
                            "VALUES (?, ?, ?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO tipoLogradouro " +
                            "(id, codigoSistema, versao, descricao, sigla, ordem) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"','"+u.sigla+"',"+u.ordem+" FROM tipoLogradouro WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM tipoLogradouro WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Tipos de Logradouro.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Tipos de Logradouro importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parsePais = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Países');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2]),
                    "ordem": 999
                };
                if(registro[0] == 10){
                    itens[i].ordem = 0;
                }
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO pais " +
                            "(id, codigoSistema, versao, descricao, ordem) " +
                            "VALUES (?, ?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO pais " +
                            "(id, codigoSistema, versao, descricao, ordem) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"',"+u.ordem+" FROM pais WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM pais WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Países.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Países importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseEstado = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Estados');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2]),
                    "sigla": emptyToNull(registro[3])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO estado " +
                            "(id, codigoSistema, versao, descricao, sigla) " +
                            "VALUES (?, ?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO estado " +
                            "(id, codigoSistema, versao, descricao, sigla) " +
                            "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                u.codigoSistema+","+u.versao+",'"+u.descricao+"','"+u.sigla+"' FROM estado WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM estado WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Estado.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Estados importados com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseCidade = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Cidades');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "descricao": emptyToNull(registro[2]),
                    "codigoEstado": emptyToNull(registro[3])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        var sql = "INSERT INTO cidade " +
                                "(id, codigoSistema, versao, descricao, codigoEstado) " +
                                "VALUES (?, ?, ?, ?, ?)";
                        if (!u.codigoEstado) {
                            for (var key in u) {
                                if (u.hasOwnProperty(key)) {
                                    binding.push(u[key]);
                                }
                            }
                        } else {
                            sql = "INSERT INTO cidade " +
                                    "(id, codigoSistema, versao, descricao, codigoEstado) " +
                                    " SELECT " + u.id + "," + u.codigoSistema + "," + u.versao + ",'" + u.descricao + "', id" +
                                    " FROM estado" +
                                    " WHERE codigoSistema = ?";
                            binding.push(u.codigoEstado);
                        }
                    } else {
                        if(!u.codigoEstado){
                            sql = "INSERT OR REPLACE INTO cidade " +
                                "(id, codigoSistema, versao, descricao, codigoEstado) " +
                                "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                    u.codigoSistema+","+u.versao+",'"+u.descricao+"', null"+
                                    " FROM cidade WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM cidade WHERE codigoSistema = ?) LIMIT 1";
                        }else{
                            sql = "INSERT OR REPLACE INTO cidade " +
                                "(id, codigoSistema, versao, descricao, codigoEstado) " +
                                "SELECT CASE WHEN codigoSistema = "+u.codigoSistema+" THEN id ELSE null END ," +
                                    u.codigoSistema+","+u.versao+",'"+u.descricao+"', (SELECT id FROM estado WHERE codigoSistema = "+u.codigoEstado+")"+
                                    " FROM cidade WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM cidade WHERE codigoSistema = ?) LIMIT 1";
                        }
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 1000 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Cidade.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Cidades importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseEquipe = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Equipes');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "codigoEmpresa": emptyToNull(registro[2]),
                    "descricao": emptyToNull(registro[3])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO equipe " +
                            "(id, codigoSistema, versao, codigoEmpresa, descricao) " +
                            "VALUES (?, ?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO equipe " +
                            "(id, codigoSistema, versao, codigoEmpresa, descricao) " +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,?,? FROM equipe WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM equipe WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoEmpresa);
                        binding.push(u.descricao);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Equipe.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Equipes importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseMicroArea = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Micro Áreas');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "microArea": parseInt(registro[2])
//                    "equipeProfissional": parseInt(registro[3])//campo não utilizado atualmente
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO microArea " +
                            "(id, codigoSistema, versao, microArea) " +
                            "VALUES (?, ?, ?, ?)";
                        for (var key in u) {
                            if (u.hasOwnProperty(key)) {
                                binding.push(u[key]);
                            }
                        } 
                    }else{
                        sql = "INSERT OR REPLACE INTO microArea " +
                            "(id, codigoSistema, versao, microArea) " +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,? FROM microArea WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM microArea WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.microArea);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Micro Área.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Micro áreas importadas com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseEquipeProfissional = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            linha = data.split('\n');
            $scope.log.unshift('Importando ' + (linha.length-1) + ' Equipe Profissional');
            for (var i = 0; i < linha.length-1; i++) {
                registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "codigoProfissional": parseInt(registro[2]),
                    "codigoMicroArea": parseInt(registro[3]),
                    "codigoEquipe": parseInt(registro[4]),
                    "status": parseInt(registro[5])
                };
            }

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO equipeProfissional " +
                                "(id, codigoSistema, versao, codigoProfissional, codigoMicroArea, codigoEquipe, status) " +
                                " VALUES (?, ?, ?," +
                                "(SELECT id FROM profissional WHERE codigoSistema = ?),"+
                                "(SELECT id FROM microArea WHERE codigoSistema = ?),"+
                                "(SELECT id FROM equipe WHERE codigoSistema = ?),"+
                                " ?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoProfissional);
                        binding.push(u.codigoMicroArea);
                        binding.push(u.codigoEquipe);
                        binding.push(u.status);
                    }else{
                        sql = "INSERT OR REPLACE INTO equipeProfissional " +
                            "(id, codigoSistema, versao, codigoProfissional, codigoMicroArea, codigoEquipe, status) " +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,"+
                                "(SELECT id FROM profissional WHERE codigoSistema = ?),"+
                                "(SELECT id FROM microArea WHERE codigoSistema = ?),"+
                                "(SELECT id FROM equipe WHERE codigoSistema = ?),"+
                                "?"+
                                " FROM equipeProfissional WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM equipeProfissional WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoProfissional);
                        binding.push(u.codigoMicroArea);
                        binding.push(u.codigoEquipe);
                        binding.push(u.status);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.log.unshift(count + ' de ' + itens.length + ' importados');
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Equipe Profissional.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                $scope.log.unshift('Equipe Profissional importado com sucesso!');
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseEndereco = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            alert('IMPORTANDO ' + linha.length);
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "codigoCidade": parseInt(registro[2]),
                    "cep": emptyToNull(registro[3]),
                    "bairro": emptyToNull(registro[4]),
                    "codigoTipoLogradouro": parseInt(registro[5]),
                    "logradouro": emptyToNull(registro[6]),
                    "complementoLogradouro": emptyToNull(registro[7]),
                    "numeroLogradouro": emptyToNull(registro[8]),
                    "telefone": emptyToNull(registro[9]),
                    "telefoneReferencia": emptyToNull(registro[10]),
                    "pontoReferencia": emptyToNull(registro[11])
                };
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO endereco " +
                                "(id, codigoSistema, versao, codigoCidade, cep, bairro, codigoTipoLogradouro, logradouro, complementoLogradouro, numeroLogradouro, telefone, telefoneReferencia, pontoReferencia) " +
                                " VALUES (?, ?, ?," +
                                "(SELECT id FROM cidade WHERE codigoSistema = ?),"+
                                "?,?,"+
                                "(SELECT id FROM tipoLogradouro WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoCidade);
                        binding.push(u.cep);
                        binding.push(u.bairro);
                        binding.push(u.codigoTipoLogradouro);
                        binding.push(u.logradouro);
                        binding.push(u.complementoLogradouro);
                        binding.push(u.numeroLogradouro);
                        binding.push(u.telefone);
                        binding.push(u.telefoneReferencia);
                        binding.push(u.pontoReferencia);
                    }else{
                        sql = "INSERT OR REPLACE INTO endereco " +
                            "(id, codigoSistema, versao, codigoCidade, cep, bairro, codigoTipoLogradouro, logradouro, complementoLogradouro, numeroLogradouro, telefone, telefoneReferencia, pontoReferencia) " +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,"+
                                "(SELECT id FROM cidade WHERE codigoSistema = ?),"+
                                "?,?,"+
                                "(SELECT id FROM tipoLogradouro WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?"+
                                " FROM endereco WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM endereco WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoCidade);
                        binding.push(u.cep);
                        binding.push(u.bairro);
                        binding.push(u.codigoTipoLogradouro);
                        binding.push(u.logradouro);
                        binding.push(u.complementoLogradouro);
                        binding.push(u.numeroLogradouro);
                        binding.push(u.telefone);
                        binding.push(u.telefoneReferencia);
                        binding.push(u.pontoReferencia);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Endereços.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseDomicilio = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "codigoEndereco": parseInt(registro[2]),
                    "numeroFamilia": parseInt(registro[3]),
                    "codigoMicroArea": parseInt(registro[4])
                };
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO domicilio " +
                                "(id, codigoSistema, versao, codigoEndereco, numeroFamilia, codigoMicroArea) " +
                                " VALUES (?, ?, ?," +
                                "(SELECT id FROM endereco WHERE codigoSistema = ?),"+
                                "?,"+
                                "(SELECT id FROM microArea WHERE codigoSistema = ?))";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoEndereco);
                        binding.push(u.numeroFamilia);
                        binding.push(u.codigoMicroArea);
                    }else{
                        sql = "INSERT OR REPLACE INTO domicilio " +
                            "(id, codigoSistema, versao, codigoEndereco, numeroFamilia, codigoMicroArea) " +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,"+
                                "(SELECT id FROM endereco WHERE codigoSistema = ?),"+
                                "?,"+
                                "(SELECT id FROM microArea WHERE codigoSistema = ?)"+
                                " FROM domicilio WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM domicilio WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoEndereco);
                        binding.push(u.numeroFamilia);
                        binding.push(u.codigoMicroArea);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Domicílios.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseDomicilioEsus = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "codigoDomicilio": parseInt(registro[2]),
                    "situacaoMoradia": parseInt(registro[3]),
                    "localizacao": parseInt(registro[4]),
                    "tipoDomicilio": parseInt(registro[5]),
                    "numeroMoradores": parseInt(registro[6]),
                    "numeroComodos": parseInt(registro[7]),
                    "condicaoUsoTerra": parseInt(registro[8]),
                    "tipoAcessoDomicilio": parseInt(registro[9]),
                    "materialDominante": parseInt(registro[10]),
                    "possuiEnergiaEletrica": parseInt(registro[11]),
                    "abastecimentoAgua": parseInt(registro[12]),
                    "tratamentoAgua": parseInt(registro[13]),
                    "esgotamento": parseInt(registro[14]),
                    "destinoLixo": parseInt(registro[15]),
                    "gato": parseInt(registro[16]),
                    "cachorro": parseInt(registro[17]),
                    "passaro": parseInt(registro[18]),
                    "criacao": parseInt(registro[19]),
                    "outros": parseInt(registro[20]),
                    "quantos": parseInt(registro[21]),
                    "dataColetaGps": null,
                    "latitude": emptyToNull(registro[24]),
                    "longitude": emptyToNull(registro[25])
                };
                
                if(registro[23] !== ''){
                    var date = registro[22].split('-');
                    var hora = registro[23].split(':');
                    itens[i].dataColetaGps = new Date(date[2], date[1] -1, date[0], hora[0], hora[1], hora[2], 0).getTime() / 1000;
                }
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO domicilioEsus " +
                                "(id, codigoSistema, versao, codigoDomicilio, situacaoMoradia, localizacao, tipoDomicilio, numeroMoradores, numeroComodos,"+
                                "condicaoUsoTerra, tipoAcessoDomicilio, materialDominante, possuiEnergiaEletrica, abastecimentoAgua, tratamentoAgua, esgotamento, destinoLixo,"+
                                "gato, cachorro, passaro, criacao, outros, quantos, dataColetaGps, latitude, longitude)" +
                                " VALUES (?, ?, ?," +
                                "(SELECT id FROM domicilio WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoDomicilio);
                        binding.push(u.situacaoMoradia);
                        binding.push(u.localizacao);
                        binding.push(u.tipoDomicilio);
                        binding.push(u.numeroMoradores);
                        binding.push(u.numeroComodos);
                        binding.push(u.condicaoUsoTerra);
                        binding.push(u.tipoAcessoDomicilio);
                        binding.push(u.materialDominante);
                        binding.push(u.possuiEnergiaEletrica);
                        binding.push(u.abastecimentoAgua);
                        binding.push(u.tratamentoAgua);
                        binding.push(u.esgotamento);
                        binding.push(u.destinoLixo);
                        binding.push(u.gato);
                        binding.push(u.cachorro);
                        binding.push(u.passaro);
                        binding.push(u.criacao);
                        binding.push(u.outros);
                        binding.push(u.quantos);
                        binding.push(u.dataColetaGps);
                        binding.push(u.latitude);
                        binding.push(u.longitude);
                    }else{
                        sql = "INSERT OR REPLACE INTO domicilioEsus " +
                                "(id, codigoSistema, versao, codigoDomicilio, situacaoMoradia, localizacao, tipoDomicilio, numeroMoradores, numeroComodos,"+
                                "condicaoUsoTerra, tipoAcessoDomicilio, materialDominante, possuiEnergiaEletrica, abastecimentoAgua, tratamentoAgua, esgotamento, destinoLixo,"+
                                "gato, cachorro, passaro, criacao, outros, quantos, dataColetaGps, latitude, longitude)" +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,"+
                                "(SELECT id FROM domicilio WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?"+
                                " FROM domicilioEsus WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM domicilioEsus WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoDomicilio);
                        binding.push(u.situacaoMoradia);
                        binding.push(u.localizacao);
                        binding.push(u.tipoDomicilio);
                        binding.push(u.numeroMoradores);
                        binding.push(u.numeroComodos);
                        binding.push(u.condicaoUsoTerra);
                        binding.push(u.tipoAcessoDomicilio);
                        binding.push(u.materialDominante);
                        binding.push(u.possuiEnergiaEletrica);
                        binding.push(u.abastecimentoAgua);
                        binding.push(u.tratamentoAgua);
                        binding.push(u.esgotamento);
                        binding.push(u.destinoLixo);
                        binding.push(u.gato);
                        binding.push(u.cachorro);
                        binding.push(u.passaro);
                        binding.push(u.criacao);
                        binding.push(u.outros);
                        binding.push(u.quantos);
                        binding.push(u.dataColetaGps);
                        binding.push(u.latitude);
                        binding.push(u.longitude);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar DomicíliosEsus.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parsePaciente = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "excluido": emptyToNull(registro[2]),
                    "nome": emptyToNull(registro[3]),
                    "dataNascimento": null,
                    "sexo": emptyToNull(registro[5]),
                    "nomeMae": emptyToNull(registro[6]),
                    "codigoCidade": parseInt(registro[7]),
                    "cpf": emptyToNull(registro[8]),
                    "rg": emptyToNull(registro[9]),
                    "telefone": emptyToNull(registro[10]),
                    "celular": emptyToNull(registro[11]),
                    "codigoRaca": parseInt(registro[12]),
                    "codigoPais": parseInt(registro[13]),
                    "email": emptyToNull(registro[14]),
                    "apelido": emptyToNull(registro[15]),
                    "flagResponsavelFamiliar": parseInt(registro[16]),
                    "codigoResponsavelFamiliar": parseInt(registro[17]),
                    "nacionalidade": parseInt(registro[18]),
                    "codigoDomicilio": parseInt(registro[19]),
                    "telefone2": emptyToNull(registro[20]),
                    "telefone3": emptyToNull(registro[21]),
                    "telefone4": emptyToNull(registro[22]),
                    "religiao": emptyToNull(registro[23]),
                    "localTrabalho": emptyToNull(registro[24]),
                    "telefoneTrabalho": emptyToNull(registro[25]),
                    "responsavel": emptyToNull(registro[26]),
                    "parentescoResponsavel": emptyToNull(registro[27]),
                    "urgenciaNome": emptyToNull(registro[28]),
                    "urgenciaTelefone": emptyToNull(registro[29]),
                    "urgenciaParentesco": emptyToNull(registro[30]),
                    "rendaFamiliar": parseInt(registro[31]),
                    "resideDesde": null,
                    "situacao": parseInt(registro[33]),
                    "nis": parseInt(registro[34]),
                    "prontuario": emptyToNull(registro[35]),
                    "motivoExclusao": emptyToNull(registro[36]),
                    "codigoEtniaIndigena": parseInt(registro[37]),
                    "keyword": registro[3] + ' ' + registro[6] + ' ' + registro[8] 
                };
                
                if(registro[4] !== ''){
                    var date = registro[4].split('-');
                    itens[i].dataNascimento = new Date(date[2], date[1] -1, date[0]).getTime() / 1000;
                }
                if(registro[32] !== ''){
                    var date = registro[32].split('-');
                    itens[i].resideDesde = new Date(date[2], date[1] -1, date[0]).getTime() / 1000;
                }
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT OR REPLACE INTO paciente " +
                                "(id, codigoSistema, versao, excluido, nome, dataNascimento, sexo, nomeMae, codigoCidade,"+
                                "cpf, rg, telefone, celular, codigoRaca, codigoPais, email, apelido,"+
                                "flagResponsavelFamiliar, nacionalidade, codigoDomicilio, telefone2,"+
                                "telefone3, telefone4, religiao, localTrabalho, telefoneTrabalho, responsavel, parentescoResponsavel,"+
                                "urgenciaNome, urgenciaTelefone, urgenciaParentesco, rendaFamiliar, resideDesde, situacao, nis, prontuario, motivoExclusao, codigoEtniaIndigena, keyword)" +
                                " VALUES (?, ?, ?," +
                                "?,?,?,?,?,"+
                                "(SELECT id FROM cidade WHERE codigoSistema = ?),"+
                                "?,?,?,?,"+
                                "(SELECT id FROM raca WHERE codigoSistema = ?),"+
                                "(SELECT id FROM pais WHERE codigoSistema = ?),"+
                                "?,?,?,?,"+
                                "(SELECT id FROM domicilio WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"+
                                "(SELECT id FROM etniaIndigena WHERE codigoSistema = ?),"+
                                "?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.extend($scope.setPropertiesPaciente(u));
                        
                        tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                        }, function (transaction, error) {
                            if(errorMessage === ''){
                                errorMessage = error.message;
                            }
                            return true;
                        });
                        
                    }else{
                        
                        $scope.updatePaciente(tx, u);
                        
                    }
                    
                    if(! isNaN(u.codigoResponsavelFamiliar)){
                        sql = "INSERT OR REPLACE INTO pacienteResponsavelAux " +
                                "(codigoPacienteSistema, codigoResponsavelSistema)" +
                            "VALUES (?,?)";
                        binding = [];
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoResponsavelFamiliar);

                        tx.executeSql(sql, binding, function (transaction, result) {
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Pacientes.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.updatePaciente = function(tx, pac){
            var binding = [];
            var sql = "UPDATE paciente  SET " +
                    " versao = ?, excluido = ?, nome = ?, dataNascimento = ?, sexo = ?, nomeMae = ?, " +
                    " codigoCidade = (SELECT id FROM cidade WHERE codigoSistema = ?),"+
                    " cpf = ?, rg = ?, telefone = ?, celular = ?, "+
                    " codigoRaca = (SELECT id FROM raca WHERE codigoSistema = ?),"+
                    " codigoPais = (SELECT id FROM pais WHERE codigoSistema = ?),"+
                    " email = ?, apelido = ?, flagResponsavelFamiliar = ?, nacionalidade = ?, "+
                    " codigoDomicilio = (SELECT id FROM domicilio WHERE codigoSistema = ?), "+
                    " telefone2 = ?,"+
                    " telefone3 = ?, telefone4 = ?, religiao = ?, localTrabalho = ?, telefoneTrabalho = ?, responsavel = ?, parentescoResponsavel = ?, "+
                    " urgenciaNome = ?, urgenciaTelefone = ?, urgenciaParentesco = ?, rendaFamiliar = ?, resideDesde = ?, situacao = ?, nis = ?, prontuario = ?, motivoExclusao = ?,"+
                    " codigoEtniaIndigena = (SELECT id FROM etniaIndigena WHERE codigoSistema = ?),"+
                    " keyword = ?, versaoMobile = 0 " +
                    " WHERE codigoSistema = ?;";

            binding.extend($scope.setPropertiesPaciente(pac));
            binding.push(pac.codigoSistema);

            tx.executeSql(sql, binding, function (transaction, result) {
                if(result.rowsAffected <= 0){
                    var sqlInsert = "INSERT INTO paciente " +
                            "(codigoSistema, versao, excluido, nome, dataNascimento, sexo, nomeMae, codigoCidade,"+
                            "cpf, rg, telefone, celular, codigoRaca, codigoPais, email, apelido,"+
                            "flagResponsavelFamiliar, nacionalidade, codigoDomicilio, telefone2,"+
                            "telefone3, telefone4, religiao, localTrabalho, telefoneTrabalho, responsavel, parentescoResponsavel,"+
                            "urgenciaNome, urgenciaTelefone, urgenciaParentesco, rendaFamiliar, resideDesde, situacao, nis, prontuario, motivoExclusao, codigoEtniaIndigena, keyword)" +
                        "SELECT ?,?,?,?,?,?,?,"+
                            "(SELECT id FROM cidade WHERE codigoSistema = ?),"+
                            "?,?,?,?,"+
                            "(SELECT id FROM raca WHERE codigoSistema = ?),"+
                            "(SELECT id FROM pais WHERE codigoSistema = ?),"+
                            "?,?,?,?,"+
                            "(SELECT id FROM domicilio WHERE codigoSistema = ?),"+
                            "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"+
                            "(SELECT id FROM etniaIndigena WHERE codigoSistema = ?),"+
                            "?"+
                            " FROM paciente LIMIT 1";

                    var bindingInsert = [];
                    bindingInsert.push(pac.codigoSistema);
                    bindingInsert.extend($scope.setPropertiesPaciente(pac));

                    tx.executeSql(sqlInsert, bindingInsert, function (transaction, result) {
                    }, function (transaction, error) {
                        $scope.log.unshift(error.message);
                        return true;
                    });
                }
            }, function (transaction, error) {
                $scope.log.unshift(error.message);
                return true;
            });
        };
        
        $scope.setPropertiesPaciente = function(paciente){
            var binding = [];
            
            binding.push(paciente.versao);
            binding.push(paciente.excluido);
            binding.push(paciente.nome);
            binding.push(paciente.dataNascimento);
            binding.push(paciente.sexo);
            binding.push(paciente.nomeMae);
            binding.push(paciente.codigoCidade);
            binding.push(paciente.cpf);
            binding.push(paciente.rg);
            binding.push(paciente.telefone);
            binding.push(paciente.celular);
            binding.push(paciente.codigoRaca);
            binding.push(paciente.codigoPais);
            binding.push(paciente.email);
            binding.push(paciente.apelido);
            binding.push(paciente.flagResponsavelFamiliar);
            binding.push(paciente.nacionalidade);
            binding.push(paciente.codigoDomicilio);
            binding.push(paciente.telefone2);
            binding.push(paciente.telefone3);
            binding.push(paciente.telefone4);
            binding.push(paciente.religiao);
            binding.push(paciente.localTrabalho);
            binding.push(paciente.telefoneTrabalho);
            binding.push(paciente.responsavel);
            binding.push(paciente.parentescoResponsavel);
            binding.push(paciente.urgenciaNome);
            binding.push(paciente.urgenciaTelefone);
            binding.push(paciente.urgenciaParentesco);
            binding.push(paciente.rendaFamiliar);
            binding.push(paciente.resideDesde);
            binding.push(paciente.situacao);
            binding.push(paciente.nis);
            binding.push(paciente.prontuario);
            binding.push(paciente.motivoExclusao);
            binding.push(paciente.codigoEtniaIndigena);
            binding.push(paciente.keyword);
            
            return binding;
        };
        
        $scope.parseCns = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "excluido": emptyToNull(registro[2]),
                    "numeroCartao": emptyToNull(registro[3]),
                    "codigoPaciente": parseInt(registro[4])
                };
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO cns " +
                                "(id, codigoSistema, versao, excluido, numeroCartao, codigoPaciente)" +
                                " VALUES (?, ?, ?, ?, ?," +
                                "(SELECT id FROM paciente WHERE codigoSistema = ?))";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.excluido);
                        binding.push(u.numeroCartao);
                        binding.push(u.codigoPaciente);
                    }else{
                        sql = "INSERT OR REPLACE INTO cns " +
                                "(id, codigoSistema, versao, excluido, numeroCartao, codigoPaciente)" +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                            "?,?,?,?,"+
                            "(SELECT id FROM paciente WHERE codigoSistema = ?)"+
                            " FROM cns WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM cns WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.excluido);
                        binding.push(u.numeroCartao);
                        binding.push(u.codigoPaciente);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar CNS.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parsePacienteDado = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "dataDados": null,
                    "peso": parseInt(registro[3]),
                    "altura": parseInt(registro[4])
                };
                if(registro[2] !== ''){
                    var date = registro[2].substring(0,10).split('-');
                    var hour = registro[2].substring(11).split(':');
                    itens[i].dataDados = new Date(date[2], date[1] -1, date[0], hour[0], hour[1], hour[2]).getTime() / 1000;
                }
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT OR REPLACE INTO pacienteDado " +
                                "(id, versao, dataColeta, peso, altura, codigoPaciente)" +
                                " VALUES (?, ?, ?, ?, ?," +
                                "(SELECT id FROM paciente WHERE codigoSistema = ?))";
                        binding.push(u.id);
                        binding.push(u.versao);
                        binding.push(u.dataDados);
                        binding.push(u.peso);
                        binding.push(u.altura);
                        binding.push(u.codigoSistema);
                    }else{
                        sql = "INSERT OR REPLACE INTO pacienteDado " +
                                "(id, versao, dataColeta, peso, altura, codigoPaciente)" +
                            "SELECT CASE WHEN p.codigoSistema = ? THEN pd.id ELSE null END ," +
                            "?,?,?,?,"+
                            "(SELECT id FROM paciente WHERE codigoSistema = ?)"+
                            " FROM pacienteDado pd LEFT JOIN paciente p ON pd.codigoPaciente = p.id WHERE p.codigoSistema = ? OR NOT EXISTS(SELECT pd2.id FROM pacienteDado pd2 LEFT JOIN paciente p2 WHERE p2.codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.dataDados);
                        binding.push(u.peso);
                        binding.push(u.altura);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Paciente Dado.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parseDocumentos = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "excluido": emptyToNull(registro[2]),
                    "tipoDocumento": parseInt(registro[3]),
                    "numeroDocumento": emptyToNull(registro[4]),
                    "complemento": emptyToNull(registro[5]),
                    "codigoOrgaoEmissor": parseInt(registro[6]),
                    "numeroCartorio": emptyToNull(registro[7]),
                    "numeroLivro": emptyToNull(registro[8]),
                    "numeroFolha": emptyToNull(registro[9]),
                    "numeroTermo": emptyToNull(registro[10]),
                    "numeroMatricula": emptyToNull(registro[11]),
                    "dataEmissao": null,
                    "siglaUf": emptyToNull(registro[13]),
                    "codigoPaciente": parseInt(registro[14])
                };
                if(registro[12] !== ''){
                    var date = registro[12].split('-');
                    itens[i].dataEmissao = new Date(date[2], date[1] -1, date[0]).getTime() / 1000;
                }
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO documentos " +
                                "(id, codigoSistema, versao, excluido, tipoDocumento, numeroDocumento, complemento, codigoOrgaoEmissor,"+
                                "numeroCartorio, numeroLivro, numeroFolha, numeroTermo, numeroMatricula, dataEmissao, siglaUf, codigoPaciente)" +
                                " VALUES (?, ?, ?, ?, ?,?,?," +
                                "(SELECT id FROM orgaoEmissor WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?,?,"+
                                "(SELECT id FROM paciente WHERE codigoSistema = ?))";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.excluido);
                        binding.push(u.tipoDocumento);
                        binding.push(u.numeroDocumento);
                        binding.push(u.complemento);
                        binding.push(u.codigoOrgaoEmissor);
                        binding.push(u.numeroCartorio);
                        binding.push(u.numeroLivro);
                        binding.push(u.numeroFolha);
                        binding.push(u.numeroTermo);
                        binding.push(u.numeroMatricula);
                        binding.push(u.dataEmissao);
                        binding.push(u.siglaUf);
                        binding.push(u.codigoPaciente);
                    }else{
                        sql = "INSERT OR REPLACE INTO documentos " +
                                "(id, codigoSistema, versao, excluido, tipoDocumento, numeroDocumento, complemento, codigoOrgaoEmissor,"+
                                "numeroCartorio, numeroLivro, numeroFolha, numeroTermo, numeroMatricula, dataEmissao, siglaUf, codigoPaciente)" +
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                            "?,?,?,?,?,?,"+
                            "(SELECT id FROM orgaoEmissor WHERE codigoSistema = ?),"+
                            "?,?,?,?,?,?,?,"+
                            "(SELECT id FROM paciente WHERE codigoSistema = ?)"+
                            " FROM documentos WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM documentos WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.excluido);
                        binding.push(u.tipoDocumento);
                        binding.push(u.numeroDocumento);
                        binding.push(u.complemento);
                        binding.push(u.codigoOrgaoEmissor);
                        binding.push(u.numeroCartorio);
                        binding.push(u.numeroLivro);
                        binding.push(u.numeroFolha);
                        binding.push(u.numeroTermo);
                        binding.push(u.numeroMatricula);
                        binding.push(u.dataEmissao);
                        binding.push(u.siglaUf);
                        binding.push(u.codigoPaciente);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar Documentos.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        $scope.parsePacienteEsus = function(data, novo) {
            var deferred = $q.defer();
            
            var itens = [];
            var linha = data.split('\n');
            for (var i = 0; i < linha.length -1; i++) {
                var registro = linha[i].split('|');

                itens[i] = {
                    "id": null,
                    "codigoSistema": parseInt(registro[0]),
                    "versao": parseInt(registro[1]),
                    "codigoPaciente": parseInt(registro[2]),
                    "dataCadastro": null,
                    "situacaoConjugal": parseInt(registro[4]),
                    "codigoCbo": parseInt(registro[5]),
                    "frequentaEscola": parseInt(registro[6]),
                    "nivelEscolaridade": parseInt(registro[7]),
                    "situacaoMercadoTrabalho": parseInt(registro[8]),
                    "responsavelCrianca": parseInt(registro[9]),
                    "frequentaCurandeira": parseInt(registro[10]),
                    "participaGrupoComunitario": parseInt(registro[11]),
                    "possuiPlanoSaude": parseInt(registro[12]),
                    "membroComunidadeTradicional": parseInt(registro[13]),
                    "comunidadeTradicional": emptyToNull(registro[14]),
                    "orientacaoSexual": parseInt(registro[15]),
                    "deficienciaAuditiva": parseInt(registro[16]),
                    "deficienciaVisual": parseInt(registro[17]),
                    "deficienciaFisica": parseInt(registro[18]),
                    "deficienciaIntelectual": parseInt(registro[19]),
                    "deficienciaOutra": parseInt(registro[20]),
                    "situacaoRua": parseInt(registro[21]),
                    "tempoRua": parseInt(registro[22]),
                    "acompanhadoPorOutraInstituicao": parseInt(registro[23]),
                    "nomeOutraInstituicao": emptyToNull(registro[24]),
                    "recebeBeneficio": parseInt(registro[25]),
                    "possuiReferenciaFamiliar": parseInt(registro[26]),
                    "visitaFamiliarFrequentemente": parseInt(registro[27]),
                    "grauParentesco": emptyToNull(registro[28]),
                    "refeicoesDia": parseInt(registro[29]),
                    "refeicaoRestaurantePopular": parseInt(registro[30]),
                    "refeicaoDoacaoRestaurante": parseInt(registro[31]),
                    "refeicaoDoacaoReligioso": parseInt(registro[32]),
                    "refeicaoDoacaoPopular": parseInt(registro[33]),
                    "refeicaoDoacaoOutros": parseInt(registro[34]),
                    "acessoHigienePessoal": parseInt(registro[35]),
                    "higieneBanho": parseInt(registro[36]),
                    "higieneSanitario": parseInt(registro[37]),
                    "higieneBucal": parseInt(registro[38]),
                    "higieneOutros": parseInt(registro[39]),
                    "estaGestante": parseInt(registro[40]),
                    "maternidadeReferencia": emptyToNull(registro[41]),
                    "pesoConsiderado": parseInt(registro[42]),
                    "fumante": parseInt(registro[43]),
                    "dependenteAlcool": parseInt(registro[44]),
                    "dependenteDroga": parseInt(registro[45]),
                    "temHipertensao": parseInt(registro[46]),
                    "temDiabetes": parseInt(registro[47]),
                    "teveAvc": parseInt(registro[48]),
                    "teveInfarto": parseInt(registro[49]),
                    "temHanseniase": parseInt(registro[50]),
                    "temTuberculose": parseInt(registro[51]),
                    "temTeveCancer": parseInt(registro[52]),
                    "internacaoAno": parseInt(registro[53]),
                    "causaInternacao": emptyToNull(registro[54]),
                    "fezTratamentoPsiquiatrico": parseInt(registro[55]),
                    "estaAcamado": parseInt(registro[56]),
                    "estaDomiciliado": parseInt(registro[57]),
                    "usaPlantasMedicinais": parseInt(registro[58]),
                    "quaisPlantas": emptyToNull(registro[59]),
                    "doencaCardiaca": parseInt(registro[60]),
                    "cardiacaInsuficiencia": parseInt(registro[61]),
                    "cardiacaOutros": parseInt(registro[62]),
                    "cardiacaNaoSabe": parseInt(registro[63]),
                    "doencaRins": parseInt(registro[64]),
                    "rinsInsuficiencia": parseInt(registro[65]),
                    "rinsOutros": parseInt(registro[66]),
                    "rinsNaoSabe": parseInt(registro[67]),
                    "doencaRespiratoria": parseInt(registro[68]),
                    "respiratoriaAsma": parseInt(registro[69]),
                    "respiratoriaEfisema": parseInt(registro[70]),
                    "respiratoriaOutros": parseInt(registro[71]),
                    "respiratoriaNaoSabe": parseInt(registro[72]),
                    "outrasPraticasIntegrativas": parseInt(registro[73]),
                    "condicaoSaude1": emptyToNull(registro[74]),
                    "condicaoSaude2": emptyToNull(registro[75]),
                    "condicaoSaude3": emptyToNull(registro[76]),
                    "possuiDeficiencia": parseInt(registro[77]),
                    "informaOrientacaoSexual": parseInt(registro[78]),
                    "possuiSofrimentoPsiquicoGrave": parseInt(registro[79]),
                    "utilizaProtese": parseInt(registro[80]),
                    "proteseAuditiva": parseInt(registro[81]),
                    "proteseMembrosSuperiores": parseInt(registro[82]),
                    "proteseMembrosInferiores": parseInt(registro[83]),
                    "proteseCadeiraRodas": parseInt(registro[84]),
                    "proteseOutros": parseInt(registro[85]),
                    "parentescoResponsavel": parseInt(registro[86])
                };
                if(registro[3] !== ''){
                    var date = registro[3].split('-');
                    itens[i].dataCadastro = new Date(date[2], date[1] -1, date[0]).getTime() / 1000;
                }
            }
            linha = null;

            var errorMessage = '';
            DB.session.transaction(function (tx) {
                for (var i = 0; i < itens.length; i++) {
                    var u = itens[i];
                    var count = 0;
                    var binding = [];
                    var sql;
                    if(novo){
                        sql = "INSERT INTO pacienteEsus " +
                               "(id, codigoSistema, versao, codigoPaciente, dataCadastro, situacaoConjugal, codigoCbo, frequentaEscola, nivelEscolaridade,"+
                               "situacaoMercadoTrabalho, responsavelCrianca, frequentaCurandeira, participaGrupoComunitario, possuiPlanoSaude, membroComunidadeTradicional,"+
                               "comunidadeTradicional, orientacaoSexual, deficienciaAuditiva, deficienciaVisual, deficienciaFisica, deficienciaIntelectual, deficienciaOutra,"+
                               "situacaoRua, tempoRua, acompanhadoPorOutraInstituicao, nomeOutraInstituicao, recebeBeneficio, possuiReferenciaFamiliar,"+
                               "visitaFamiliarFrequentemente, grauParentesco, refeicoesDia, refeicaoRestaurantePopular, refeicaoDoacaoRestaurante, refeicaoDoacaoReligioso,"+
                               "refeicaoDoacaoPopular, refeicaoDoacaoOutros, acessoHigienePessoal, higieneBanho, higieneSanitario, higieneBucal, higieneOutros, estaGestante,"+
                               "maternidadeReferencia, pesoConsiderado, fumante, dependenteAlcool, dependenteDroga, temHipertensao, temDiabetes, teveAvc, teveInfarto,"+
                               "temHanseniase, temTuberculose, temTeveCancer, internacaoAno, causaInternacao, fezTratamentoPsiquiatrico, estaAcamado, estaDomiciliado,"+
                               "usaPlantasMedicinais, quaisPlantas, doencaCardiaca, cardiacaInsuficiencia, cardiacaOutros, cardiacaNaoSabe, doencaRins, rinsInsuficiencia,"+
                               "rinsOutros, rinsNaoSabe, doencaRespiratoria, respiratoriaAsma, respiratoriaEfisema, respiratoriaOutros, respiratoriaNaoSabe,"+
                               "outrasPraticasIntegrativas, condicaoSaude1, condicaoSaude2, condicaoSaude3, possuiDeficiencia, informaOrientacaoSexual,"+
                               "possuiSofrimentoPsiquicoGrave, utilizaProtese, proteseAuditiva, proteseMembrosSuperiores, proteseMembrosInferiores, proteseCadeiraRodas, proteseOutros, parentescoResponsavel)"+
                                " VALUES (?,?,?,"+
                                "(SELECT id FROM paciente WHERE codigoSistema = ?),"+
                                "?,?," +
                                "(SELECT id FROM cbo WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,?)";
                        binding.push(u.id);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoPaciente);
                        binding.push(u.dataCadastro);
                        binding.push(u.situacaoConjugal);
                        binding.push(u.codigoCbo);
                        binding.push(u.frequentaEscola);
                        binding.push(u.nivelEscolaridade);
                        binding.push(u.situacaoMercadoTrabalho);
                        binding.push(u.responsavelCrianca);
                        binding.push(u.frequentaCurandeira);
                        binding.push(u.participaGrupoComunitario);
                        binding.push(u.possuiPlanoSaude);
                        binding.push(u.membroComunidadeTradicional);
                        binding.push(u.comunidadeTradicional);
                        binding.push(u.orientacaoSexual);
                        binding.push(u.deficienciaAuditiva);
                        binding.push(u.deficienciaVisual);
                        binding.push(u.deficienciaFisica);
                        binding.push(u.deficienciaIntelectual);
                        binding.push(u.deficienciaOutra);
                        binding.push(u.situacaoRua);
                        binding.push(u.tempoRua);
                        binding.push(u.acompanhadoPorOutraInstituicao);
                        binding.push(u.nomeOutraInstituicao);
                        binding.push(u.recebeBeneficio);
                        binding.push(u.possuiReferenciaFamiliar);
                        binding.push(u.visitaFamiliarFrequentemente);
                        binding.push(u.grauParentesco);
                        binding.push(u.refeicoesDia);
                        binding.push(u.refeicaoRestaurantePopular);
                        binding.push(u.refeicaoDoacaoRestaurante);
                        binding.push(u.refeicaoDoacaoReligioso);
                        binding.push(u.refeicaoDoacaoPopular);
                        binding.push(u.refeicaoDoacaoOutros);
                        binding.push(u.acessoHigienePessoal);
                        binding.push(u.higieneBanho);
                        binding.push(u.higieneSanitario);
                        binding.push(u.higieneBucal);
                        binding.push(u.higieneOutros);
                        binding.push(u.estaGestante);
                        binding.push(u.maternidadeReferencia);
                        binding.push(u.pesoConsiderado);
                        binding.push(u.fumante);
                        binding.push(u.dependenteAlcool);
                        binding.push(u.dependenteDroga);
                        binding.push(u.temHipertensao);
                        binding.push(u.temDiabetes);
                        binding.push(u.teveAvc);
                        binding.push(u.teveInfarto);
                        binding.push(u.temHanseniase);
                        binding.push(u.temTuberculose);
                        binding.push(u.temTeveCancer);
                        binding.push(u.internacaoAno);
                        binding.push(u.causaInternacao);
                        binding.push(u.fezTratamentoPsiquiatrico);
                        binding.push(u.estaAcamado);
                        binding.push(u.estaDomiciliado);
                        binding.push(u.usaPlantasMedicinais);
                        binding.push(u.quaisPlantas);
                        binding.push(u.doencaCardiaca);
                        binding.push(u.cardiacaInsuficiencia);
                        binding.push(u.cardiacaOutros);
                        binding.push(u.cardiacaNaoSabe);
                        binding.push(u.doencaRins);
                        binding.push(u.rinsInsuficiencia);
                        binding.push(u.rinsOutros);
                        binding.push(u.rinsNaoSabe);
                        binding.push(u.doencaRespiratoria);
                        binding.push(u.respiratoriaAsma);
                        binding.push(u.respiratoriaEfisema);
                        binding.push(u.respiratoriaOutros);
                        binding.push(u.respiratoriaNaoSabe);
                        binding.push(u.outrasPraticasIntegrativas);
                        binding.push(u.condicaoSaude1);
                        binding.push(u.condicaoSaude2);
                        binding.push(u.condicaoSaude3);
                        binding.push(u.possuiDeficiencia);
                        binding.push(u.informaOrientacaoSexual);
                        binding.push(u.possuiSofrimentoPsiquicoGrave);
                        binding.push(u.utilizaProtese);
                        binding.push(u.proteseAuditiva);
                        binding.push(u.proteseMembrosSuperiores);
                        binding.push(u.proteseMembrosInferiores);
                        binding.push(u.proteseCadeiraRodas);
                        binding.push(u.proteseOutros);
                        binding.push(u.parentescoResponsavel);
                    }else{
                        sql = "INSERT OR REPLACE INTO pacienteEsus " +
                               "(id, codigoSistema, versao, codigoPaciente, dataCadastro, situacaoConjugal, codigoCbo, frequentaEscola, nivelEscolaridade,"+
                               "situacaoMercadoTrabalho, responsavelCrianca, frequentaCurandeira, participaGrupoComunitario, possuiPlanoSaude, membroComunidadeTradicional,"+
                               "comunidadeTradicional, orientacaoSexual, deficienciaAuditiva, deficienciaVisual, deficienciaFisica, deficienciaIntelectual, deficienciaOutra,"+
                               "situacaoRua, tempoRua, acompanhadoPorOutraInstituicao, nomeOutraInstituicao, recebeBeneficio, possuiReferenciaFamiliar,"+
                               "visitaFamiliarFrequentemente, grauParentesco, refeicoesDia, refeicaoRestaurantePopular, refeicaoDoacaoRestaurante, refeicaoDoacaoReligioso,"+
                               "refeicaoDoacaoPopular, refeicaoDoacaoOutros, acessoHigienePessoal, higieneBanho, higieneSanitario, higieneBucal, higieneOutros, estaGestante,"+
                               "maternidadeReferencia, pesoConsiderado, fumante, dependenteAlcool, dependenteDroga, temHipertensao, temDiabetes, teveAvc, teveInfarto,"+
                               "temHanseniase, temTuberculose, temTeveCancer, internacaoAno, causaInternacao, fezTratamentoPsiquiatrico, estaAcamado, estaDomiciliado,"+
                               "usaPlantasMedicinais, quaisPlantas, doencaCardiaca, cardiacaInsuficiencia, cardiacaOutros, cardiacaNaoSabe, doencaRins, rinsInsuficiencia,"+
                               "rinsOutros, rinsNaoSabe, doencaRespiratoria, respiratoriaAsma, respiratoriaEfisema, respiratoriaOutros, respiratoriaNaoSabe,"+
                               "outrasPraticasIntegrativas, condicaoSaude1, condicaoSaude2, condicaoSaude3, possuiDeficiencia, informaOrientacaoSexual,"+
                               "possuiSofrimentoPsiquicoGrave, utilizaProtese, proteseAuditiva, proteseMembrosSuperiores, proteseMembrosInferiores, proteseCadeiraRodas, proteseOutros, parentescoResponsavel)"+
                            "SELECT CASE WHEN codigoSistema = ? THEN id ELSE null END ," +
                                "?,?,"+
                                "(SELECT id FROM paciente WHERE codigoSistema = ?),"+
                                "?,?," +
                                "(SELECT id FROM cbo WHERE codigoSistema = ?),"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,"+
                                "?,?,?,?,?,?,?,?,?,?,"+"?,?,?,?,?,?,?,?,?,?,?"+
                            " FROM pacienteEsus WHERE codigoSistema = ? OR NOT EXISTS(SELECT id FROM pacienteEsus WHERE codigoSistema = ?) LIMIT 1";
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                        binding.push(u.versao);
                        binding.push(u.codigoPaciente);
                        binding.push(u.dataCadastro);
                        binding.push(u.situacaoConjugal);
                        binding.push(u.codigoCbo);
                        binding.push(u.frequentaEscola);
                        binding.push(u.nivelEscolaridade);
                        binding.push(u.situacaoMercadoTrabalho);
                        binding.push(u.responsavelCrianca);
                        binding.push(u.frequentaCurandeira);
                        binding.push(u.participaGrupoComunitario);
                        binding.push(u.possuiPlanoSaude);
                        binding.push(u.membroComunidadeTradicional);
                        binding.push(u.comunidadeTradicional);
                        binding.push(u.orientacaoSexual);
                        binding.push(u.deficienciaAuditiva);
                        binding.push(u.deficienciaVisual);
                        binding.push(u.deficienciaFisica);
                        binding.push(u.deficienciaIntelectual);
                        binding.push(u.deficienciaOutra);
                        binding.push(u.situacaoRua);
                        binding.push(u.tempoRua);
                        binding.push(u.acompanhadoPorOutraInstituicao);
                        binding.push(u.nomeOutraInstituicao);
                        binding.push(u.recebeBeneficio);
                        binding.push(u.possuiReferenciaFamiliar);
                        binding.push(u.visitaFamiliarFrequentemente);
                        binding.push(u.grauParentesco);
                        binding.push(u.refeicoesDia);
                        binding.push(u.refeicaoRestaurantePopular);
                        binding.push(u.refeicaoDoacaoRestaurante);
                        binding.push(u.refeicaoDoacaoReligioso);
                        binding.push(u.refeicaoDoacaoPopular);
                        binding.push(u.refeicaoDoacaoOutros);
                        binding.push(u.acessoHigienePessoal);
                        binding.push(u.higieneBanho);
                        binding.push(u.higieneSanitario);
                        binding.push(u.higieneBucal);
                        binding.push(u.higieneOutros);
                        binding.push(u.estaGestante);
                        binding.push(u.maternidadeReferencia);
                        binding.push(u.pesoConsiderado);
                        binding.push(u.fumante);
                        binding.push(u.dependenteAlcool);
                        binding.push(u.dependenteDroga);
                        binding.push(u.temHipertensao);
                        binding.push(u.temDiabetes);
                        binding.push(u.teveAvc);
                        binding.push(u.teveInfarto);
                        binding.push(u.temHanseniase);
                        binding.push(u.temTuberculose);
                        binding.push(u.temTeveCancer);
                        binding.push(u.internacaoAno);
                        binding.push(u.causaInternacao);
                        binding.push(u.fezTratamentoPsiquiatrico);
                        binding.push(u.estaAcamado);
                        binding.push(u.estaDomiciliado);
                        binding.push(u.usaPlantasMedicinais);
                        binding.push(u.quaisPlantas);
                        binding.push(u.doencaCardiaca);
                        binding.push(u.cardiacaInsuficiencia);
                        binding.push(u.cardiacaOutros);
                        binding.push(u.cardiacaNaoSabe);
                        binding.push(u.doencaRins);
                        binding.push(u.rinsInsuficiencia);
                        binding.push(u.rinsOutros);
                        binding.push(u.rinsNaoSabe);
                        binding.push(u.doencaRespiratoria);
                        binding.push(u.respiratoriaAsma);
                        binding.push(u.respiratoriaEfisema);
                        binding.push(u.respiratoriaOutros);
                        binding.push(u.respiratoriaNaoSabe);
                        binding.push(u.outrasPraticasIntegrativas);
                        binding.push(u.condicaoSaude1);
                        binding.push(u.condicaoSaude2);
                        binding.push(u.condicaoSaude3);
                        binding.push(u.possuiDeficiencia);
                        binding.push(u.informaOrientacaoSexual);
                        binding.push(u.possuiSofrimentoPsiquicoGrave);
                        binding.push(u.utilizaProtese);
                        binding.push(u.proteseAuditiva);
                        binding.push(u.proteseMembrosSuperiores);
                        binding.push(u.proteseMembrosInferiores);
                        binding.push(u.proteseCadeiraRodas);
                        binding.push(u.proteseOutros);
                        binding.push(u.parentescoResponsavel);
                        binding.push(u.codigoSistema);
                        binding.push(u.codigoSistema);
                    }

                    tx.executeSql(sql, binding, function (transaction, result) {
                        count++;
                        if(count % 100 === 0 && errorMessage === ''){
                            $scope.$apply();
                        }
                    }, function (transaction, error) {
                        if(errorMessage === ''){
                            errorMessage = error.message;
                        }
                        return true;
                    });
                }
            }, function(e){
                $scope.log.unshift('Erro ao importar PacienteEsus.');
                $scope.log.unshift(errorMessage);
                deferred.reject(e);
            }, function(){
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
    }]);
