services.factory('$celkScroll', function($ionicScrollDelegate) {
    var self = this;
    
    self.toTop = function(handleName){
        if(handleName){
            $ionicScrollDelegate.$getByHandle(handleName).resize().then(function() {
              $ionicScrollDelegate.$getByHandle(handleName).getScrollView().scrollTo(0, 0, false);
            });
        }else{
            $ionicScrollDelegate.resize().then(function() {
              $ionicScrollDelegate.getScrollView().scrollTo(0, 0, false);
            });
        }
    };
    
    return self;
});

services.factory('SERVER', function($http, $q) {
    var self = this;
    
    self.post = function(recurso, objeto){
        var deferred = $q.defer();
        var url = window.localStorage.getItem("url");
        
        var req = {
            method: 'POST',
            url: url + G_versao + '/' + G_id + '/enviarRecurso?nomeRecurso='+recurso,
            headers: {
                'Content-Type': 'text/plain'
            },
            data: objeto
        };
        
        $http(req)
            .success(function (data, status, headers, config) {
                return deferred.resolve(data, status, headers, config);
            }).error(function (data, status, headers, config) {
                return deferred.reject(data, status, headers, config);
            });
    
        return deferred.promise;    
    };
    
    return self;
});

services.factory('FS', function() {
    var FS = this;
    FS.fileSystem = null;
    
    FS.init = function(){
        if (window.cordova) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                FS.fileSystem = fileSystem;
            }, function(){
                console.log('ERRO NO SERVICO DE ARQUIVOS');
            });
        }
    };
    
    return FS;
});

readyCallbacks = [];
services.factory('DB', function($q) {
    var self = this;
    self.session = null;
    
    self.ready = function(callback){
        if(G_DB_ready){
            callback();
        }else{
            readyCallbacks.push(callback);
        }
    };
    
    self.DBready = function(){
        G_DB_ready = true;
        for(var i = 0; i < readyCallbacks.length; i++){
            readyCallbacks[i]();
        }
    };
 
    self.delete = function() {
        window.sqlitePlugin.deleteDatabase("familia.db");
    };
    
    self.init = function() {
        G_DB_ready = false;
        if(window.cordova){
            self.session = window.sqlitePlugin.openDatabase({name: 'familia.db', location: 'default'});
            console.log('BANCO SQLITE');

            self.session.executeSql("PRAGMA foreign_keys = ON;", [],function (res) {
                console.log('CELK FOREIGN KEYS habilitadas: '+ JSON.stringify(res));
            });
        }else{
            self.session = window.openDatabase("familia.db", "1.0", "database", -1);
            console.log('BANCO WEBSQL');
        }
        console.log('CELK BANCO INICIADO');

        self.query("PRAGMA user_version;", []).then(function(result){
            var versaoAtual = parseInt(self.fetch(result).user_version); 
            
            console.log('VERSAO ATUAL '+ versaoAtual);
            switch(versaoAtual + 1){
                case 1: migracaoInicial();
                case 2: migracao2();
                case 3: migracao3();
                case 4: migracao4();
                case 5: migracao5();
                case 6: migracao6();
                case 7: migracao7();
                        versaoAtual = 7;//Deve receber o valor do ultimo case
            };

            self.createVersionTriggers();

            self.session.executeSql("PRAGMA user_version = '"+versaoAtual+"';", [],function (res) {
                //Chamar ready apos a ultima execucao
                console.log('TERMINOU DE EXECUTAR OS SQLS');
                self.DBready();
            });
        });
    };
    
    migracao7 = function(){
        console.log('MIGRACAO DE SQL 7');

        var sql = "ALTER TABLE paciente ADD registroVacina INTEGER;";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao adicionar registroVacina na tabela paciente: '+ error.message);
        });
        
        var sql = "CREATE TABLE IF NOT EXISTS vacinasImagens ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoPaciente INTEGER NOT NULL, " +
                "codigoUsuario INTEGER NOT NULL, " +
                "imagem VARCHAR NOT NULL, "+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id)"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela vacinasImagens: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_vac_imagens ON vacinasImagens(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_vac_imagens: '+ error.message);
        });
        
        var sql = "CREATE TABLE IF NOT EXISTS tipoVacina ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela tipoVacina: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_tipo_vacina ON tipoVacina(descricao)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_tipo_vacina: '+ error.message);
        });

        var sql = "CREATE TABLE IF NOT EXISTS registroVacinas ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoPaciente INTEGER NOT NULL, " +
                "codigoTipoVacina INTEGER NOT NULL, "+
                "codigoUsuario INTEGER NOT NULL, "+
                "dataAplicacao INTEGER NOT NULL, "+
                "lote VARCHAR, "+
                "observacao VARCHAR, "+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id), "+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id), "+
                "FOREIGN KEY(codigoTipoVacina) REFERENCES tipoVacina(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela registroVacinas: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_reg_vac ON registroVacinas(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_reg_vac: '+ error.message);
        });
    };
    
    migracao6 = function(){
        console.log('MIGRACAO DE SQL 6');

        var sql = "CREATE TABLE IF NOT EXISTS motivoNaoComparecimento ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "outros INTEGER NOT NULL, " +
                "descricao VARCHAR(50) NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela motivoNaoComparecimento: '+ error.message);
        });
        
        var sql = "CREATE TABLE IF NOT EXISTS notificacaoAgendas ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "codigoPaciente INTEGER NOT NULL, " +
                "codigoAgenda INTEGER NOT NULL, " +
                "tipoAgenda VARCHAR, " +
                "local VARCHAR, " +
                "dataAgendamento INTEGER, " +
                "status INTEGER NULL,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "statusMobile INTEGER NOT NULL DEFAULT 0, "+//0-ABERTO 1-COMPARECEU 2-NAO_COMPARECEU
                "codigoMotivo INTEGER, "+
                "descricaoOutroMotivo VARCHAR(50), "+
                "codigoUsuario INTEGER, "+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id),"+
                "FOREIGN KEY(codigoMotivo) REFERENCES motivoNaoComparecimento(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela notificacaoAgendas: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_not_agendas_1 ON notificacaoAgendas(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_not_agendas_1: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_not_agendas_2 ON notificacaoAgendas(codigoAgenda)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_not_agendas_2: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_not_agendas_3 ON notificacaoAgendas(versaoMobile)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_not_agendas_3: '+ error.message);
        });
    };
    
    migracao5 = function(){
        console.log('MIGRACAO DE SQL 5');
        
        var sql = "CREATE TABLE IF NOT EXISTS notificacaoPaciente ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "codigoPaciente INTEGER NOT NULL, " +
                "vacinaAtrasada INTEGER NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela notificacaoPaciente: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_not_paciente_1 ON notificacaoPaciente(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_not_paciente_1: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_not_paciente_2 ON notificacaoPaciente(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_not_paciente_2: '+ error.message);
        });
    };
    
    migracao4 = function(){
        console.log('MIGRACAO DE SQL 4');
        
        var sql = "CREATE TABLE IF NOT EXISTS etniaIndigena ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "descricao VARCHAR)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela etniaIndigena: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_etnia_indigena ON etniaIndigena(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_etnia_indigena: '+ error.message);
        });

        self.query("ALTER TABLE paciente ADD COLUMN codigoEtniaIndigena INTEGER;").then(null, function(error){
            console.error('CELK Erro ao criar coluna codigoEtniaIndigena: '+ error.message);
        });
    };
    
    migracao3 = function(){
        console.log('MIGRACAO DE SQL 3');
        
        var sql = "CREATE TABLE IF NOT EXISTS pacienteDado ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "versao INTEGER NULL, " +
                "dataColeta INTEGER NOT NULL, " +
                "peso INTEGER,"+
                "altura INTEGER,"+
                "codigoPaciente INTEGER NOT NULL,"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela pacienteDado: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_paciente_dado ON pacienteDado(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente_dado: '+ error.message);
        });
    };
    
    migracao2 = function(){
        console.log('MIGRACAO DE SQL 2');
        
        self.query("ALTER TABLE paciente ADD COLUMN prontuario varchar(30);").then(null, function(error){
            console.error('CELK Erro ao criar coluna prontuario: '+ error.message);
        });        
        self.query("ALTER TABLE paciente ADD COLUMN motivoExclusaoDomicilio INTEGER;").then(null, function(error){
            console.error('CELK Erro ao criar coluna motivoExclusaoDomicilio: '+ error.message);
        });        
        self.query("ALTER TABLE paciente ADD COLUMN motivoExclusao INTEGER;").then(null, function(error){
            console.error('CELK Erro ao criar coluna motivoExclusao: '+ error.message);
        });        

        self.query("ALTER TABLE pacienteEsus ADD COLUMN parentescoResponsavel INTEGER;").then(null, function(error){
            console.error('CELK Erro ao criar coluna parentescoResponsavel: '+ error.message);
        });        
    };
    
    migracaoInicial = function(){
        self.tabelaCbo();
        self.tabelaProfissional();
        self.tabelaUsuarios();
        self.tabelaOrgaoEmissor();
        self.tabelaRaca();
        self.tabelaTipoLogradouro();
        self.tabelaPais();
        self.tabelaEstado();
        self.tabelaCidade();
        self.tabelaEquipe();
        self.tabelaMicroArea();
        self.tabelaEquipeProfissional();
        self.tabelaEndereco();
        self.tabelaDomicilio();
        self.tabelaDomicilioEsus();
        self.tabelaPaciente();
        self.tabelaPacienteResponsavelAux();
        self.tabelaCns();
        self.tabelaDocumentos();
        self.tabelaPacienteEsus();
        self.tabelaVisitaDomiciliar();
        self.tabelaErroDomicilio();
        self.tabelaErroPaciente();
    };
 
    self.deleteVersionTriggers = function(){
        var deferred = $q.defer();
        
        self.session.transaction(function(transaction) {
            transaction.executeSql("DROP TRIGGER IF EXISTS v_paciente_U;",[], function(transaction, result) {
                transaction.executeSql("DROP TRIGGER IF EXISTS v_paciente_I;",[], function(transaction, result) {

                    transaction.executeSql("DROP TRIGGER IF EXISTS v_pacienteEsus_U;",[], function(transaction, result) {
                        transaction.executeSql("DROP TRIGGER IF EXISTS v_pacienteEsus_I;",[], function(transaction, result) {

                            transaction.executeSql("DROP TRIGGER IF EXISTS v_documentos_U;",[], function(transaction, result) {
                                transaction.executeSql("DROP TRIGGER IF EXISTS v_documentos_I;",[], function(transaction, result) {

                                    transaction.executeSql("DROP TRIGGER IF EXISTS v_cns_U;",[], function(transaction, result) {
                                        transaction.executeSql("DROP TRIGGER IF EXISTS v_cns_I;",[], function(transaction, result) {

                                            transaction.executeSql("DROP TRIGGER IF EXISTS v_domicilio_U;",[], function(transaction, result) {
                                                transaction.executeSql("DROP TRIGGER IF EXISTS v_domicilio_I;",[], function(transaction, result) {

                                                    transaction.executeSql("DROP TRIGGER IF EXISTS v_domicilioEsus_U;",[], function(transaction, result) {
                                                        transaction.executeSql("DROP TRIGGER IF EXISTS v_domicilioEsus_I;",[], function(transaction, result) {

                                                            transaction.executeSql("DROP TRIGGER IF EXISTS v_endereco_U;",[], function(transaction, result) {
                                                                transaction.executeSql("DROP TRIGGER IF EXISTS v_endereco_I;",[], function(transaction, result) {

                                                                    transaction.executeSql("DROP TRIGGER IF EXISTS v_pacienteDado_U;",[], function(transaction, result) {
                                                                        transaction.executeSql("DROP TRIGGER IF EXISTS v_pacienteDado_I;",[], function(transaction, result) {

                                                                            transaction.executeSql("DROP TRIGGER IF EXISTS v_notificacaoAgendas_U;",[], function(transaction, result) {
                                                                                console.log('CELK Triggers deletadas');
                                                                                return deferred.resolve();
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        return deferred.promise;
    };
    
    self.createVersionTriggers = function(){
        var deferred = $q.defer();

        self.session.transaction(function(tx) {
            tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_paciente_U AFTER UPDATE ON paciente BEGIN UPDATE paciente SET versaoMobile = (SELECT MAX(versaoMobile) FROM paciente)+1 WHERE id = NEW.id; END;",
                [], function(tx, result) {
                tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_paciente_I AFTER INSERT ON paciente BEGIN UPDATE paciente SET versaoMobile = (SELECT MAX(versaoMobile) FROM paciente)+1 WHERE id = NEW.id; END;",
                    [], function(tx, result) {

                        tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_pacienteEsus_U AFTER UPDATE ON pacienteEsus BEGIN UPDATE pacienteEsus SET versaoMobile = (SELECT MAX(versaoMobile) FROM pacienteEsus)+1 WHERE id = NEW.id; END;",
                            [], function(tx, result) {
                            tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_pacienteEsus_I AFTER INSERT ON pacienteEsus BEGIN UPDATE pacienteEsus SET versaoMobile = (SELECT MAX(versaoMobile) FROM pacienteEsus)+1 WHERE id = NEW.id; END;",
                                [], function(tx, result) {

                                    tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_documentos_U AFTER UPDATE ON documentos BEGIN UPDATE documentos SET versaoMobile = (SELECT MAX(versaoMobile) FROM documentos)+1 WHERE id = NEW.id; END;",
                                        [], function(tx, result) {
                                        tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_documentos_I AFTER INSERT ON documentos BEGIN UPDATE documentos SET versaoMobile = (SELECT MAX(versaoMobile) FROM documentos)+1 WHERE id = NEW.id; END;",
                                            [], function(tx, result) {

                                                tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_cns_U AFTER UPDATE ON cns BEGIN UPDATE cns SET versaoMobile = (SELECT MAX(versaoMobile) FROM cns)+1 WHERE id = NEW.id; END;",
                                                    [], function(tx, result) {
                                                    tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_cns_I AFTER INSERT ON cns BEGIN UPDATE cns SET versaoMobile = (SELECT MAX(versaoMobile) FROM cns)+1 WHERE id = NEW.id; END;",
                                                        [], function(tx, result) {

                                                            tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_domicilio_U AFTER UPDATE ON domicilio BEGIN UPDATE domicilio SET versaoMobile = (SELECT MAX(versaoMobile) FROM domicilio)+1 WHERE id = NEW.id; END;",
                                                                [], function(tx, result) {
                                                                tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_domicilio_I AFTER INSERT ON domicilio BEGIN UPDATE domicilio SET versaoMobile = (SELECT MAX(versaoMobile) FROM domicilio)+1 WHERE id = NEW.id; END;",
                                                                    [], function(tx, result) {

                                                                        tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_domicilioEsus_U AFTER UPDATE ON domicilioEsus BEGIN UPDATE domicilioEsus SET versaoMobile = (SELECT MAX(versaoMobile) FROM domicilioEsus)+1 WHERE id = NEW.id; END;",
                                                                            [], function(tx, result) {
                                                                            tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_domicilioEsus_I AFTER INSERT ON domicilioEsus BEGIN UPDATE domicilioEsus SET versaoMobile = (SELECT MAX(versaoMobile) FROM domicilioEsus)+1 WHERE id = NEW.id; END;",
                                                                                [], function(tx, result) {

                                                                                    tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_endereco_U AFTER UPDATE ON endereco BEGIN UPDATE endereco SET versaoMobile = (SELECT MAX(versaoMobile) FROM endereco)+1 WHERE id = NEW.id; END;",
                                                                                        [], function(tx, result) {
                                                                                        tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_endereco_I AFTER INSERT ON endereco BEGIN UPDATE endereco SET versaoMobile = (SELECT MAX(versaoMobile) FROM endereco)+1 WHERE id = NEW.id; END;",
                                                                                            [], function(tx, result) {

                                                                                                tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_pacienteDado_U AFTER UPDATE ON pacienteDado BEGIN UPDATE pacienteDado SET versaoMobile = (SELECT MAX(versaoMobile) FROM pacienteDado)+1 WHERE id = NEW.id; END;",
                                                                                                    [], function(tx, result) {
                                                                                                    tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_pacienteDado_I AFTER INSERT ON pacienteDado BEGIN UPDATE pacienteDado SET versaoMobile = (SELECT MAX(versaoMobile) FROM pacienteDado)+1 WHERE id = NEW.id; END;",
                                                                                                        [], function(tx, result) {

                                                                                                            tx.executeSql("CREATE TRIGGER IF NOT EXISTS v_notificacaoAgendas_U AFTER UPDATE ON notificacaoAgendas BEGIN UPDATE notificacaoAgendas SET versaoMobile = NEW.versaoMobile +1 WHERE id = NEW.id; END;",
                                                                                                                [], function(tx, result) {
                                                                                                                    console.log('CELK Triggers criada');
                                                                                                                    return deferred.resolve();
                                                                                                            });
                                                                                                    });
                                                                                                });
                                                                                        });
                                                                                    });
                                                                            });
                                                                        });
                                                                });
                                                            });
                                                    });
                                                });
                                        });
                                    });
                            });
                        });
                });
            });
        });

        return deferred.promise;
    };
    
    self.tabelaProfissional = function(){
        var sql = "CREATE TABLE IF NOT EXISTS profissional ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "nome VARCHAR(60) NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela profissional: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_profissional ON profissional(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_profissional: '+ error.message);
        });
    };
 
    self.tabelaCbo = function(){
        var sql = "CREATE TABLE IF NOT EXISTS cbo ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema VARCHAR(10) NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR(150) NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela cbo: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_cbo ON cbo(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_cbo: '+ error.message);
        });
    };
 
    self.tabelaOrgaoEmissor = function(){
        var sql = "CREATE TABLE IF NOT EXISTS orgaoEmissor ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR(60) NOT NULL, "+
                "sigla VARCHAR(6))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela orgaoEmissor: '+ error.message);
        });

        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_orgaoEmissor ON orgaoEmissor(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_orgaoEmissor: '+ error.message);
        });
        
    };
 
    self.tabelaRaca = function(){
        var sql = "CREATE TABLE IF NOT EXISTS raca ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR(30) NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela raca: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_raca ON raca(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_raca: '+ error.message);
        });
    };
 
    self.tabelaTipoLogradouro = function(){
        var sql = "CREATE TABLE IF NOT EXISTS tipoLogradouro ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR(72) NOT NULL, "+
                "ordem INTEGER NOT NULL DEFAULT 999, "+
                "sigla VARCHAR(15))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela tipoLogradouro: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_tipoLogradouro ON tipoLogradouro(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_tipoLogradouro: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_tipoLogradouro_2 ON tipoLogradouro(ordem,descricao)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_tipoLogradouro_2: '+ error.message);
        });
    };
 
    self.tabelaPais = function(){
        var sql = "CREATE TABLE IF NOT EXISTS pais ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "ordem INTEGER NOT NULL DEFAULT 999, " +
                "descricao VARCHAR(50) NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela pais: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pais ON pais(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pais: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_pais_2 ON pais(descricao)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pais_2: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_pais_3 ON pais(ordem, descricao)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pais_3: '+ error.message);
        });
        
    };
 
    self.tabelaEstado = function(){
        var sql = "CREATE TABLE IF NOT EXISTS estado ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR(40) NOT NULL, " +
                "sigla VARCHAR(2) NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela estado: '+ error.message);
        });

        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_estado ON estado(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_estado: '+ error.message);
        });
        
    };
 
    self.tabelaCidade = function(){
        var sql = "CREATE TABLE IF NOT EXISTS cidade ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "descricao VARCHAR(50) NOT NULL, " +
                "codigoEstado INTEGER NOT NULL, " +
                "FOREIGN KEY(codigoEstado) REFERENCES estado(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela cidade: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_cidade ON cidade(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_cidade: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_cidade_2 ON cidade(descricao)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_cidade_2: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_cidade_3 ON cidade(codigoEstado)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_cidade_3: '+ error.message);
        });
        
    };
 
    self.tabelaUsuarios = function(){
        var sql = "CREATE TABLE IF NOT EXISTS usuarios ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "nome VARCHAR(50) NOT NULL, " +
                "login VARCHAR(20) NOT NULL, " +
                "senha VARCHAR(200) NOT NULL, " +
                "status VARCHAR(1) NOT NULL, " +
                "codigoProfissional INTEGER, " +
                "nivel VARCHAR(1), "+
                "FOREIGN KEY(codigoProfissional) REFERENCES profissional(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela usuarios: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios ON usuarios(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_usuarios: '+ error.message);
        });
    };
 
    self.tabelaEquipe = function(){
        var sql = "CREATE TABLE IF NOT EXISTS equipe ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "codigoEmpresa INTEGER, " +
                "descricao VARCHAR(60))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela usuarios: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_equipe ON equipe(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_equipe: '+ error.message);
        });
    };
 
    self.tabelaMicroArea = function(){
        var sql = "CREATE TABLE IF NOT EXISTS microArea ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "microArea INTEGER)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela microArea: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_microArea ON microArea(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_microArea: '+ error.message);
        });
    };
 
    self.tabelaEquipeProfissional = function(){
        var sql = "CREATE TABLE IF NOT EXISTS equipeProfissional ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NOT NULL, " +
                "versao INTEGER NOT NULL, " +
                "codigoProfissional INTEGER,"+
                "codigoMicroArea INTEGER,"+
                "codigoEquipe INTEGER,"+
                "status INTEGER,"+
                "FOREIGN KEY(codigoProfissional) REFERENCES profissional(id),"+
                "FOREIGN KEY(codigoMicroArea) REFERENCES microArea(id),"+
                "FOREIGN KEY(codigoEquipe) REFERENCES equipe(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela equipeProfissional: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_equipeProfissional ON equipeProfissional(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_equipeProfissional: '+ error.message);
        });
    };
 
    self.tabelaEndereco = function(){
        var sql = "CREATE TABLE IF NOT EXISTS endereco ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "codigoCidade INTEGER,"+
                "cep VARCHAR(10),"+
                "bairro VARCHAR(30),"+
                "codigoTipoLogradouro INTEGER,"+
                "logradouro VARCHAR(50),"+
                "complementoLogradouro VARCHAR(50),"+
                "numeroLogradouro VARCHAR(7),"+
                "telefone VARCHAR(15),"+
                "telefoneReferencia VARCHAR(15),"+
                "pontoReferencia VARCHAR(60),"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoCidade) REFERENCES cidade(id),"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoTipoLogradouro) REFERENCES tipoLogradouro(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela endereco: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_endereco ON endereco(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_endereco: '+ error.message);
        });

        self.query('CREATE INDEX IF NOT EXISTS idx_endereco_2 ON endereco(logradouro)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_endereco_2: '+ error.message);
        });
    };
 
    self.tabelaDomicilio = function(){
        var sql = "CREATE TABLE IF NOT EXISTS domicilio ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "codigoEndereco INTEGER,"+
                "numeroFamilia INTEGER,"+
                "codigoMicroArea INTEGER,"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoEndereco) REFERENCES endereco(id),"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoMicroArea) REFERENCES microArea(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela domicilio: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_domicilio ON domicilio(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_domicilio: '+ error.message);
        });
    };
 
    self.tabelaDomicilioEsus = function(){
        var sql = "CREATE TABLE IF NOT EXISTS domicilioEsus ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "codigoDomicilio INTEGER NOT NULL,"+
                "situacaoMoradia INTEGER,"+
                "localizacao INTEGER,"+
                "tipoDomicilio INTEGER,"+
                "numeroMoradores INTEGER,"+
                "numeroComodos INTEGER,"+
                "condicaoUsoTerra INTEGER,"+
                "tipoAcessoDomicilio INTEGER,"+
                "materialDominante INTEGER,"+
                "possuiEnergiaEletrica INTEGER,"+
                "abastecimentoAgua INTEGER,"+
                "tratamentoAgua INTEGER,"+
                "esgotamento INTEGER,"+
                "destinoLixo INTEGER,"+
                "gato INTEGER,"+
                "cachorro INTEGER,"+
                "passaro INTEGER,"+
                "criacao INTEGER,"+
                "outros INTEGER,"+
                "quantos INTEGER,"+
                "dataColetaGps INTEGER,"+
                "latitude VARCHAR(50),"+
                "longitude VARCHAR(50),"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoDomicilio) REFERENCES domicilio(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela domicilioEsus: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_domicilioesus ON domicilioEsus(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_domicilioesus: '+ error.message);
        });
    };
 
    self.tabelaPaciente = function(){
        var sql = "CREATE TABLE IF NOT EXISTS paciente ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "excluido VARCHAR(1) NOT NULL,"+
                "nome VARCHAR(70) NOT NULL,"+
                "dataNascimento INTEGER NOT NULL,"+
                "sexo VARCHAR(1) NOT NULL,"+
                "nomeMae VARCHAR(70),"+
                "codigoCidade INTEGER,"+
                "cpf VARCHAR(14),"+
                "rg VARCHAR(20),"+
                "telefone VARCHAR(15),"+
                "celular VARCHAR(15),"+
                "codigoRaca INTEGER,"+
                "codigoPais INTEGER,"+
                "email VARCHAR(100),"+
                "apelido VARCHAR(50),"+
                "flagResponsavelFamiliar INTEGER,"+
                "codigoResponsavelFamiliar INTEGER,"+
                "nacionalidade INTEGER,"+
                "codigoDomicilio INTEGER,"+
                "telefone2 VARCHAR(15),"+
                "telefone3 VARCHAR(15),"+
                "telefone4 VARCHAR(15),"+
                "religiao VARCHAR(50),"+
                "localTrabalho VARCHAR(50),"+
                "telefoneTrabalho VARCHAR(15),"+
                "responsavel VARCHAR(70),"+
                "parentescoResponsavel VARCHAR(20),"+
                "urgenciaNome VARCHAR(70),"+
                "urgenciaTelefone VARCHAR(15),"+
                "urgenciaParentesco VARCHAR(20),"+
                "rendaFamiliar INTEGER,"+
                "resideDesde INTEGER,"+
                "situacao INTEGER,"+
                "nis VARCHAR,"+
                "keyword VARCHAR(200),"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoCidade) REFERENCES cidade(id),"+
                "FOREIGN KEY(codigoRaca) REFERENCES raca(id),"+
                "FOREIGN KEY(codigoPais) REFERENCES pais(id),"+
                "FOREIGN KEY(codigoResponsavelFamiliar) REFERENCES paciente(id),"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoDomicilio) REFERENCES domicilio(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela paciente: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_paciente ON paciente(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente: '+ error.message);
        });

        self.query('CREATE INDEX IF NOT EXISTS idx_paciente_cs ON paciente(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente_cs: '+ error.message);
        });

        self.query('CREATE INDEX IF NOT EXISTS idx_paciente_nm ON paciente(nome)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente_nm: '+ error.message);
        });

        self.query('CREATE INDEX IF NOT EXISTS idx_paciente_keyword ON paciente(keyword)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente_keyword: '+ error.message);
        });

        self.query('CREATE INDEX IF NOT EXISTS idx_paciente_dom ON paciente(codigoDomicilio)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente_dom: '+ error.message);
        });

        self.query('CREATE INDEX IF NOT EXISTS idx_paciente_versao ON paciente(versaoMobile)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_paciente_versao: '+ error.message);
        });
    };
 
    self.tabelaPacienteResponsavelAux = function(){
        var sql = "CREATE TABLE IF NOT EXISTS pacienteResponsavelAux ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoPacienteSistema INTEGER NOT NULL, " +
                "codigoResponsavelSistema INTEGER NOT NULL)";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela pacienteResponsavelAux: '+ error.message);
        });

        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pacienteResponsavelAux ON pacienteResponsavelAux(codigoPacienteSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pacienteResponsavelAux: '+ error.message);
        });
};
 
    self.tabelaCns = function(){
        var sql = "CREATE TABLE IF NOT EXISTS cns ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "excluido VARCHAR(1) NOT NULL,"+
                "numeroCartao VARCHAR(70) NOT NULL,"+
                "codigoPaciente INTEGER NOT NULL,"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela CNS: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_cns ON cns(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_cns: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_cns_2 ON cns(versaoMobile)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_cns_2: '+ error.message);
        });
    };
 
    self.tabelaDocumentos = function(){
        var sql = "CREATE TABLE IF NOT EXISTS documentos ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "excluido VARCHAR(1) NOT NULL,"+
                "tipoDocumento INTEGER NOT NULL,"+
                "numeroDocumento VARCHAR(13),"+
                "complemento VARCHAR(4),"+
                "codigoOrgaoEmissor INTEGER,"+
                "numeroCartorio VARCHAR(20),"+
                "numeroLivro VARCHAR(8),"+
                "numeroFolha VARCHAR(4),"+
                "numeroTermo VARCHAR(8),"+
                "numeroMatricula VARCHAR(50),"+
                "dataEmissao INTEGER,"+
                "siglaUf VARCHAR(2),"+
                "codigoPaciente INTEGER NOT NULL,"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoOrgaoEmissor) REFERENCES orgaoEmissor(id),"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela documentos: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_documentos ON documentos(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_documentos: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_documentos_2 ON documentos(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_documentos_2: '+ error.message);
        });
    };
 
    self.tabelaPacienteEsus = function(){
        var sql = "CREATE TABLE IF NOT EXISTS pacienteEsus ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoSistema INTEGER NULL, " +
                "versao INTEGER NULL, " +
                "codigoPaciente INTEGER NOT NULL,"+
                "dataCadastro INTEGER NOT NULL,"+
                "situacaoConjugal INTEGER,"+
                "codigoCbo INTEGER,"+
                "frequentaEscola INTEGER,"+
                "nivelEscolaridade INTEGER,"+
                "situacaoMercadoTrabalho INTEGER,"+
                "responsavelCrianca INTEGER,"+
                "frequentaCurandeira INTEGER,"+
                "participaGrupoComunitario INTEGER,"+
                "possuiPlanoSaude INTEGER,"+
                "membroComunidadeTradicional INTEGER,"+
                "comunidadeTradicional VARCHAR(50),"+
                "orientacaoSexual INTEGER,"+
                "deficienciaAuditiva INTEGER,"+
                "deficienciaVisual INTEGER,"+
                "deficienciaFisica INTEGER,"+
                "deficienciaIntelectual INTEGER,"+
                "deficienciaOutra INTEGER,"+
                "situacaoRua INTEGER,"+
                "tempoRua INTEGER,"+
                "acompanhadoPorOutraInstituicao INTEGER,"+
                "nomeOutraInstituicao VARCHAR(150),"+
                "recebeBeneficio INTEGER,"+
                "possuiReferenciaFamiliar INTEGER,"+
                "visitaFamiliarFrequentemente INTEGER,"+
                "grauParentesco VARCHAR(50),"+
                "refeicoesDia INTEGER,"+
                "refeicaoRestaurantePopular INTEGER,"+
                "refeicaoDoacaoRestaurante INTEGER,"+
                "refeicaoDoacaoReligioso INTEGER,"+
                "refeicaoDoacaoPopular INTEGER,"+
                "refeicaoDoacaoOutros INTEGER,"+
                "acessoHigienePessoal INTEGER,"+
                "higieneBanho INTEGER,"+
                "higieneSanitario INTEGER,"+
                "higieneBucal INTEGER,"+
                "higieneOutros INTEGER,"+
                "estaGestante INTEGER,"+
                "maternidadeReferencia VARCHAR(150),"+
                "pesoConsiderado INTEGER,"+
                "fumante INTEGER,"+
                "dependenteAlcool INTEGER,"+
                "dependenteDroga INTEGER,"+
                "temHipertensao INTEGER,"+
                "temDiabetes INTEGER,"+
                "teveAvc INTEGER,"+
                "teveInfarto INTEGER,"+
                "temHanseniase INTEGER,"+
                "temTuberculose INTEGER,"+
                "temTeveCancer INTEGER,"+
                "internacaoAno INTEGER,"+
                "causaInternacao VARCHAR(150),"+
                "fezTratamentoPsiquiatrico INTEGER,"+
                "estaAcamado INTEGER,"+
                "estaDomiciliado INTEGER,"+
                "usaPlantasMedicinais INTEGER,"+
                "quaisPlantas VARCHAR(150),"+
                "doencaCardiaca INTEGER,"+
                "cardiacaInsuficiencia INTEGER,"+
                "cardiacaOutros INTEGER,"+
                "cardiacaNaoSabe INTEGER,"+
                "doencaRins INTEGER,"+
                "rinsInsuficiencia INTEGER,"+
                "rinsOutros INTEGER,"+
                "rinsNaoSabe INTEGER,"+
                "doencaRespiratoria INTEGER,"+
                "respiratoriaAsma INTEGER,"+
                "respiratoriaEfisema INTEGER,"+
                "respiratoriaOutros INTEGER,"+
                "respiratoriaNaoSabe INTEGER,"+
                "outrasPraticasIntegrativas INTEGER,"+
                "condicaoSaude1 VARCHAR(100),"+
                "condicaoSaude2 VARCHAR(100),"+
                "condicaoSaude3 VARCHAR(100),"+
                "possuiDeficiencia INTEGER,"+
                "informaOrientacaoSexual INTEGER,"+
                "possuiSofrimentoPsiquicoGrave INTEGER,"+
                "utilizaProtese INTEGER,"+
                "proteseAuditiva INTEGER,"+
                "proteseMembrosSuperiores INTEGER,"+
                "proteseMembrosInferiores INTEGER,"+
                "proteseCadeiraRodas INTEGER,"+
                "proteseOutros INTEGER,"+
                "codigoUsuario INTEGER,"+
                "versaoMobile INTEGER DEFAULT 0,"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id),"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id),"+
                "FOREIGN KEY(codigoCbo) REFERENCES paciente(id))";
        self.query(sql).then(null, function(error){
            console.error('CELK Erro ao criar tabela pacienteEsus: '+ error.message);
        });
      
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pacienteEsus ON pacienteEsus(codigoSistema)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pacienteEsus: '+ error.message);
        });
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pacienteEsus_2 ON pacienteEsus(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pacienteEsus_2: '+ error.message);
        });
        self.query('CREATE INDEX IF NOT EXISTS idx_pacienteEsus_3 ON pacienteEsus(versaoMobile)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_pacienteEsus_3: '+ error.message);
        });
    };
 
    self.tabelaVisitaDomiciliar = function(){
        var sql = "CREATE TABLE IF NOT EXISTS visitaDomiciliar ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoUsuario INTEGER NOT NULL, " +
                "codigoDomicilio INTEGER NOT NULL, " +
                "dataVisita INTEGER NOT NULL,"+
                "compartilhada INTEGER NOT NULL,"+
                "codigoPaciente INTEGER NOT NULL,"+
                "desfecho INTEGER NOT NULL,"+
                "motivoAtualizacao INTEGER,"+
                "motivoVisitaPeriodica INTEGER,"+
                "motivoBaConsulta INTEGER,"+
                "motivoBaExame INTEGER,"+
                "motivoBaVacina INTEGER,"+
                "motivoBaCondicionalidadesBolsaFamilia INTEGER,"+
                "motivoAcGestante INTEGER,"+
                "motivoAcPuerpera INTEGER,"+
                "motivoAcRecemNascido INTEGER,"+
                "motivoAcCrianca INTEGER,"+
                "motivoAcPessoaDesnutrida INTEGER,"+
                "motivoAcPessoaDeficiente INTEGER,"+
                "motivoAcPessoaHipertensa INTEGER,"+
                "motivoAcPessoaDiabetes INTEGER,"+
                "motivoAcPessoaAsmatica INTEGER,"+
                "motivoAcPessoaEnfisema INTEGER,"+
                "motivoAcPessoaCancer INTEGER,"+
                "motivoAcPessoaDoencaCronica INTEGER,"+
                "motivoAcPessoaHanseniase INTEGER,"+
                "motivoAcPessoaTuberculose INTEGER,"+
                "motivoAcAcamado INTEGER,"+
                "motivoAcVulnerabilidadeSocial INTEGER,"+
                "motivoAcCondicionalidadesBolsaFamilia INTEGER,"+
                "motivoAcSaudeMental INTEGER,"+
                "motivoAcUsuarioAlcool INTEGER,"+
                "motivoAcUsuarioDroga INTEGER,"+
                "motivoEgressoInternacao INTEGER,"+
                "motivoControleAmbientesVetores INTEGER,"+
                "motivoCampanhaSaude INTEGER,"+
                "motivoPrevencao INTEGER,"+
                "motivoOutros INTEGER,"+
                "dataColetaGps INTEGER,"+
                "horaColetaGps INTEGER,"+
                "latitude VARCHAR(50),"+
                "longitude VARCHAR(50),"+
                "FOREIGN KEY(codigoUsuario) REFERENCES usuarios(id)"+
                "FOREIGN KEY(codigoDomicilio) REFERENCES domicilio(id)"+
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id))";
        self.query(sql).then(function(){
            
        }, function(error){
            console.error('CELK Erro ao criar tabela visitaDomiciliar: '+ error.message);
        });
    };
 
    self.tabelaErroDomicilio = function(){
        var sql = "CREATE TABLE IF NOT EXISTS erroDomicilio ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoDomicilio INTEGER NOT NULL, " +
                "mensagem VARCHAR, " +
                "FOREIGN KEY(codigoDomicilio) REFERENCES domicilio(id))";
        self.query(sql).then(function(){
            
        }, function(error){
            console.error('CELK Erro ao criar tabela erroDomicilio: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_erroDomicilio ON erroDomicilio(codigoDomicilio)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_erroDomicilio: '+ error.message);
        });
    };
 
    self.tabelaErroPaciente = function(){
        var sql = "CREATE TABLE IF NOT EXISTS erroPaciente ( " +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "codigoPaciente INTEGER NOT NULL, " +
                "mensagem VARCHAR, " +
                "FOREIGN KEY(codigoPaciente) REFERENCES paciente(id))";
        self.query(sql).then(function(){
            
        }, function(error){
            console.error('CELK Erro ao criar tabela erroPaciente: '+ error.message);
        });
        
        self.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_erroPaciente ON erroPaciente(codigoPaciente)').then(null, function(error){
            console.error('CELK Erro ao criar indice idx_erroPaciente: '+ error.message);
        });
    };
 
    self.executeTransaction = function(tx, query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();
        
        tx.executeSql(query, bindings, function(transaction, result) {
            deferred.resolve(transaction, result);
        }, function(transaction, error) {
            deferred.reject(error);
            return true;
        });
        
        return deferred.promise;
    };
    
    self.query = function(query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();
        
        self.session.transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
                deferred.resolve(result);
            }, function(transaction, error) {
                deferred.reject(error);
            });
        }, function(err){
            deferred.reject(err);
        });
 
        return deferred.promise;
    };
 
    self.fetchAll = function(result) {
        var output = [];
 
        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }
        
        return output;
    };
 
    self.fetch = function(result) {
        if(result.rows.length > 0){
            return result.rows.item(0);
        }else {
            return null;
        }
    };
 
    return self;
});
