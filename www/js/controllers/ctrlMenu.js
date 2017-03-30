controllers.controller('menuCtrl', ['$scope', '$state', '$ionicHistory', 'DB', '$ionicLoading', '$ionicPopup', '$q', '$http', '$cordovaFile', '$cordovaFileOpener2', '$cordovaAppVersion',
    function($scope, $state, $ionicHistory, DB, $ionicLoading, $ionicPopup, $q, $http, $cordovaFile, $cordovaFileOpener2, $cordovaAppVersion) {
        $ionicLoading.show({
            template: 'Carregando...'
        });

        $scope.verBotaoSair = true;

        window.localStorage.removeItem("microarea");
        window.localStorage.removeItem("tempDomicilio");
        window.localStorage.removeItem("tempVisita");
        $scope.usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));
        $ionicHistory.clearHistory();
        $scope.bind = {};
        $scope.isReady = false;

          $scope.diassinc = window.localStorage.diassinc;
    $scope.datasinc = window.localStorage.datasinc;

    if ($scope.datasinc == 1) {
      $ionicPopup.alert({
        title: 'Atenção',
        template: 'O tempo de sincronização está expirando, este dispositivo deve ser sincronizado ou os serviços serão bloqueados.'
      });
    }

    $scope.alerta = function() {
      $ionicPopup.alert({
        title: 'Atenção',
        template: 'Esta funcionalidade está bloqueada, por favor sincronize o seu dispositivo.'
      });
    }
    $scope.microAreaCarregada = function(msg) {
      if (msg) {
        $scope.alerta = msg;
      }
      $scope.verificarIncosistencias();
    };

    $scope.verificarIncosistencias = function() {
      DB.query("SELECT SUM(c) AS count FROM (SELECT COUNT(*) AS c FROM erroDomicilio UNION ALL SELECT COUNT(*) AS c FROM erroPaciente)", []).then(function(result) {
        var retorno = DB.fetch(result);
        $scope.bind.inconsistencias = retorno.count;
        if (retorno.count > 0) {
          $scope.verPendencias = true;
        }
        $ionicLoading.hide();
        $scope.verificarAtualizacao();
      });
    };
        $scope.microAreaCarregada = function(msg) {
            if (msg) {
                $scope.alerta = msg;
            }
            $scope.verificarIncosistencias();
        };

        $scope.verificarIncosistencias = function() {
            DB.query("SELECT SUM(c) AS count FROM (SELECT COUNT(*) AS c FROM erroDomicilio UNION ALL SELECT COUNT(*) AS c FROM erroPaciente)", []).then(function(result) {
                var retorno = DB.fetch(result);
                $scope.bind.inconsistencias = retorno.count;
                if (retorno.count > 0) {
                    $scope.verPendencias = true;
                }
                $ionicLoading.hide();
                $scope.verificarAtualizacao();
            });
        };

        $scope.verificarAtualizacao = function() {
            $http.get('versao.txt').success(function(versaoLocal) {
                $scope.bind.versaoLocal = versaoLocal;
                console.log('VERSAO LOCAL: ' + $scope.bind.versaoLocal);

                var url = 'https://s3-sa-east-1.amazonaws.com/celk/storage/aplicativos/familias2/versao.txt?' + new Date().getTime();
                console.log('URL REMOTA: ' + url);

                $http.get(url).success(function(versaoRemota) {
                    console.log('VERSAO REMOTA: ' + versaoRemota);
                    if (!isNaN(versaoRemota) && !isNaN(versaoLocal) && parseInt(versaoRemota) > parseInt(versaoLocal)) {
                        if ($state.current.name == 'menu') {
                            $scope.showConfirmation('Existe uma nova versão disponível que pode corrigir problemas no aplicativo. Deseja atualizar agora?').then(function(res) {
                                if (res) {
                                    $scope.bind.loading = 'Carregando...';
                                    $ionicLoading.show({
                                        template: '{{bind.loading}}',
                                        scope: $scope
                                    });

                                    $cordovaFile.downloadFile('https://s3-sa-east-1.amazonaws.com/celk/storage/aplicativos/familias2/familias.apk',
                                        'cdvfile://localhost/persistent/celk/familias/familias.apk').then(function(result) {

                                        $cordovaFileOpener2.open(
                                            'cdvfile://localhost/persistent/celk/familias/familias.apk',
                                            'application/vnd.android.package-archive'
                                        );

                    $ionicLoading.hide();

                                    }, function(err) {
                                        $ionicLoading.hide();
                                        $scope.showAlert('Não foi possível atualizar, verifique se você está conectado na internet e tente novamente.');
                                    }, function(progress) {
                                        if (progress.lengthComputable) {
                                            var perc = Math.floor(progress.loaded / progress.total * 100);
                                            $scope.bind.loading = 'Carregando... ' + perc + '%';
                                        } else {
                                            $scope.bind.loading = 'Carregando... ';
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            });
        };

        $scope.showConfirmation = function(mensagem) {
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
            alertPopup.then(function(resposta) {
                return deferred.resolve(resposta);
            });

            return deferred.promise;
        };

        $scope.acaoPendencias = function() {
            $state.go('inconsistencias');
        };

        $scope.goDomicilios = function() {
            $state.go('domicilios');
        };

        $scope.goIndividuos = function() {
            $state.go('individuos');
        };

        $scope.goSincronizacao = function() {
            window.localStorage.removeItem("ressincronizar");
            $state.go('sincronizacaoInicial');
        };

        $scope.goVisitas = function() {
            $state.go('visitas');
        };

        $scope.acaoSair = function() {
            $scope.showConfirmation('Deseja realmente sair do seu usuário?').then(function(resp) {
                if (resp) {
                    window.localStorage.removeItem('usuarioLogado');
                    $state.go('login');

                }
            });
        };

        DB.ready(function() {
            DB.session.transaction(function(tx) {

                tx.executeSql("SELECT codigoProfissional FROM usuarios where id = ?", [$scope.usuario.id], function(tx, result) {
                    var usuario = DB.fetch(result);
                    if (isValid(usuario.codigoProfissional)) {

                        tx.executeSql("SELECT ma.id, ma.microArea AS microArea, eq.descricao AS area, eq.codigoSistema AS codigoArea FROM equipeProfissional AS ep " +
                            " LEFT JOIN microArea AS ma ON ep.codigoMicroArea = ma.id " +
                            " LEFT JOIN equipe AS eq ON ep.codigoEquipe = eq.id " +
                            " WHERE ep.status = 0 " +
                            " AND ep.codigoProfissional = ?", [usuario.codigoProfissional],
                            function(tx, result) {
                                var equipeProfissional = DB.fetchAll(result);
                                if (equipeProfissional.length > 1) {
                                    $scope.microAreaCarregada('O Profissional está vinculado a mais de uma equipe');
                                } else if (equipeProfissional.length === 0) {
                                    $scope.microAreaCarregada('O Profissional não está vinculado a uma equipe');
                                } else {
                                    if (isValid(equipeProfissional[0].microArea)) {
                                        $scope.area = equipeProfissional[0].area;
                                        $scope.microArea = equipeProfissional[0].microArea;
                                        $scope.$apply();

                                        window.localStorage.setItem("microarea", equipeProfissional[0].id);
                                        window.localStorage.setItem("microarea1", equipeProfissional[0].microArea);
                                        window.localStorage.setItem("codigoarea", equipeProfissional[0].codigoArea);
                                        window.localStorage.setItem("descricaoarea", equipeProfissional[0].area);
                                        $scope.microAreaCarregada();
                                    } else {
                                        $scope.microAreaCarregada('O Profissional não está vinculado a uma microárea');
                                    }
                                }
                            });
                    } else {
                        $scope.microAreaCarregada('Não existe um profissional relacionado com o usuário autenticado');
                    }
                });
            }, function(err) {
                $scope.microAreaCarregada(err.message);
            });
        });

    }
]);
