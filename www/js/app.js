var G_versao = '3.0';
var G_id = 'definirID';
var G_DB_ready = false;

var app = angular.module('starter', ['ui.mask', 'ngCpfCns', 'ionic', 'starter.controllers', 'starter.services', 'pasvaz.bindonce', 'starter.filters', 'starter.directives', 'ngCordova']);
var services = angular.module('starter.services', []);
var controllers = angular.module('starter.controllers', ['ionic']);
var filters = angular.module('starter.filters', []);
var directives = angular.module('starter.directives', []);

app.run(function ($ionicPlatform, DB, FS, $rootScope, $ionicConfig, $cordovaDevice, $cordovaSplashscreen, $cordovaFile, $cordovaGeolocation) {
    $ionicPlatform.ready(function () {
        G_id = $cordovaDevice.getUUID();
        console.log('GID: '+ $cordovaDevice.getUUID());
        
        DB.init();
        FS.init();
        $rootScope.tituloPrincipal = 'GEM Famílias';
        $ionicConfig.views.maxCache(0);
        
        DB.ready(function(){
            $cordovaSplashscreen.hide();

//            cordova.plugins.diagnostic.isLocationEnabled(function(result){
//                if(result == 0){
//                    cordova.plugins.diagnostic.switchToLocationSettings();
//                }
//            }, function(error){
//                console.log("ERRO!!!!!!!!!!"+ error);
//            });
//
            //Usado para pegar a primeira posicao do GPS, que é mais demorada
            var posOptions = {timeout: 120000, enableHighAccuracy: true};
            console.log('GPS Iniciando');
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
//                    tempo = new Date().getTime() - tempo;
//                    console.log('GPS posicao recuperada TEMPO: '+ tempo +
//                    'Latitude: '          +position.coords.latitude          + '\n' +
//                    'Longitude: '         + position.coords.longitude         + '\n' +
//                    'Altitude: '          + position.coords.altitude          + '\n' +
//                    'Accuracy: '          + position.coords.accuracy          + '\n' +
//                    'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
//                    'Heading: '           + position.coords.heading           + '\n' +
//                    'Speed: '             + position.coords.speed             + '\n' +
//                    'Timestamp: '         + position.timestamp);
                }, function (err) {
                    console.log('GPS erro: (' + err.code + ') ' + err.message);
                });
                
//                function checkConnection() {
//                    var networkState = navigator.connection.type;
//
//                    var states = {};
//                    states[Connection.UNKNOWN]  = 'Unknown connection';
//                    states[Connection.ETHERNET] = 'Ethernet connection';
//                    states[Connection.WIFI]     = 'WiFi connection';
//                    states[Connection.CELL_2G]  = 'Cell 2G connection';
//                    states[Connection.CELL_3G]  = 'Cell 3G connection';
//                    states[Connection.CELL_4G]  = 'Cell 4G connection';
//                    states[Connection.CELL]     = 'Cell generic connection';
//                    states[Connection.NONE]     = 'No network connection';
//
//                    alert('#### CELK Connection type: ' + states[networkState]);
//                }
//
//                checkConnection();                
        });
            
        $cordovaFile.removeFile('celk/familias/familias.apk').then(function(){
        }, function(err){
            console.log('ERRO AO DELETAR APK DE ATUALIZACAO! Code: ' + err.code);
        });    
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
//        if (window.cordova && window.cordova.plugins.Keyboard) {
//            console.log('CELK: KEYBOARD');
//            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
//        }
        if (window.StatusBar) {
//             org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
    
//    $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
//        //Restart header bar 
//        $rootScope.tituloPrincipal = 'GEM Famílias';
//    });    
});

app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('inconsistencias', {
            url: "/inconsistencias",
            templateUrl: "templates/inconsistencias.html"
        })
        .state('registro', {
            url: "/registrar",
            templateUrl: "templates/registro.html"
        })
        .state('menu', {
            url: "/menu",
            templateUrl: "templates/menu.html"
        })
        .state('login', {
            url: "/login",
            templateUrl: "templates/login.html"
        })
        .state('individuos', {
            url: "/individuos",
            templateUrl: "templates/individuos.html"
        })
        .state('visitas', {
            url: "/visitas",
            templateUrl: "templates/visitas.html"
        })
        .state('agendasPendentes', {
            url: "/agendasPendentes/{idIndividuo}/{idDomicilio}",
            templateUrl: "templates/agendasPendentes.html"
        })
        .state('controleVacinas', {
            url: "/controleVacinas/{idIndividuo}/{idDomicilio}",
            templateUrl: "templates/controleVacinas.html"
        })
        .state('novaVacina', {
            url: "/novaVacina/{idIndividuo}/{idDomicilio}",
            templateUrl: "templates/novaVacina.html"
        })
        .state('cadastroVisitas', {
            abstract: true,
            url: "/cadastroVisitas/{idDomicilio}",
            controller: 'cadastroVisitaCtrl',
            templateUrl: "templates/cadastroVisita.html",
            resolve: {
                temporario: function() {
                    return JSON.parse(window.localStorage.getItem("tempVisita"));
                }
            }
        })
        .state('cadastroVisitas.tabVisita', {
          url: '/cadastroVisitaTabs/tabVisita',
          views: {
            'tab-Visita': {
              templateUrl: 'templates/cadastroVisitaTabs/tabVisita.html',
              controller: 'tabVisitaCtrl'
            }
          }
        })
        .state('cadastroVisitas.tabMotivo', {
          url: '/cadastroVisitaTabs/tabMotivo',
          views: {
            'tab-Motivo': {
              templateUrl: 'templates/cadastroVisitaTabs/tabMotivo.html',
              controller: 'tabMotivoCtrl'
            }
          }
        })
        .state('cadastroVisitas.tabDesfecho', {
          url: '/cadastroVisitaTabs/tabDesfecho',
          views: {
            'tab-Desfecho': {
              templateUrl: 'templates/cadastroVisitaTabs/tabDesfecho.html',
              controller: 'tabDesfechoCtrl'
            }
          }
        })
        .state('cadastroVisitas.tabIndividuos', {
          url: '/cadastroVisitaTabs/tabIndividuos',
          views: {
            'tab-Individuos': {
              templateUrl: 'templates/cadastroVisitaTabs/tabIndividuos.html',
              controller: 'tabIndividuosCtrl'
            }
          }
        })
        .state('domicilios', {
            url: "/domicilios",
            templateUrl: "templates/domicilios.html"
        })
        .state('cadastroDomicilios', {
            abstract: true,
            url: "/cadastroDomicilios/{idDomicilio}",
            controller: 'cadastroDomicilioCtrl',
            templateUrl: "templates/cadastroDomicilio.html",
            resolve: {
                temporario: function() {
                    return JSON.parse(window.localStorage.getItem("tempDomicilio"));
                }
            }
        })
        .state('cadastroDomicilios.tabEndereco', {
          url: '/cadastroDomicilioTabs/tabEndereco',
          views: {
            'tab-Endereco': {
              templateUrl: 'templates/cadastroDomicilioTabs/tabEndereco.html',
              controller: 'tabDomEnderecoCtrl'
            }
          }
        })
        .state('cadastroDomicilios.tabCondMoradia', {
          url: '/cadastroDomicilioTabs/tabCondMoradia',
          views: {
            'tab-CondMoradia': {
              templateUrl: 'templates/cadastroDomicilioTabs/tabCondMoradia.html',
              controller: 'tabDomCondMoradiaCtrl'
            }
          }
        })
        .state('cadastroDomicilios.tabAnimais', {
          url: '/cadastroDomicilioTabs/tabAnimais',
          views: {
            'tab-Animais': {
              templateUrl: 'templates/cadastroDomicilioTabs/tabAnimais.html',
              controller: 'tabDomAnimaisCtrl'
            }
          }
        })
        .state('cadastroDomicilios.tabIndividuos', {
          url: '/cadastroDomicilioTabs/tabIndividuos',
          views: {
            'tab-Individuos': {
              templateUrl: 'templates/cadastroDomicilioTabs/tabIndividuos.html',
              controller: 'tabDomIndividuosCtrl'
            }
          }
        })
        .state('cadastroIndividuos', {
            abstract: true,
            url: "/cadastroIndividuos/{idIndividuo}",
            templateUrl: "templates/cadastroIndividuo.html"
        })
        .state('cadastroIndividuos.tabIdentificacao', {
          url: '/cadastroIndividuoTabs/tabIdentificacao',
          views: {
            'tab-Identificacao': {
              templateUrl: 'templates/cadastroIndividuoTabs/tabIdentificacao.html',
              controller: 'tabIndIdentificacaoCtrl'
            }
          }
        })
        .state('cadastroIndividuos.tabInfoSocio', {
          url: '/cadastroIndividuoTabs/tabInfoSocio',
          views: {
            'tab-InfoSocio': {
              templateUrl: 'templates/cadastroIndividuoTabs/tabInfoSocio.html',
              controller: 'tabInfoSocioCtrl'
            }
          }
        })
        .state('cadastroIndividuos.tabSituacaoRua', {
          url: '/cadastroIndividuoTabs/tabSituacaoRua',
          views: {
            'tab-SituacaoRua': {
              templateUrl: 'templates/cadastroIndividuoTabs/tabSituacaoRua.html',
              controller: 'tabSituacaoRuaCtrl'
            }
          }
        })
        .state('cadastroIndividuos.tabCondicoesSaude', {
          url: '/cadastroIndividuoTabs/tabCondicoesSaude',
          views: {
            'tab-CondicoesSaude': {
              templateUrl: 'templates/cadastroIndividuoTabs/tabCondicoesSaude.html',
              controller: 'tabCondicoesSaudeCtrl'
            }
          }
        })
        .state('cadastroIndividuos.tabDocumentos', {
          url: '/cadastroIndividuoTabs/tabDocumentos',
          views: {
            'tab-Documentos': {
              templateUrl: 'templates/cadastroIndividuoTabs/tabDocumentos.html',
              controller: 'tabDocumentosCtrl'
            }
          }
        })
        .state('sincronizacaoInicial', {
            url: "/sincronizacaoInicial",
            templateUrl: "templates/sincronizacaoInicial.html"
        });

    var url = window.localStorage.getItem("url");
    console.log("URL: "+ url);
    if(url === null ){
        $urlRouterProvider.otherwise('/registrar');
    }else{
        if(window.localStorage.getItem('sincronizacaoFinalizada')){
            var usuario = JSON.parse(window.localStorage.getItem('usuarioLogado'));

            if(usuario && !isNaN(usuario.id)){
                $urlRouterProvider.otherwise('/menu');
            }else{
                $urlRouterProvider.otherwise('/login');
            }
        }else{
            $urlRouterProvider.otherwise('/sincronizacaoInicial');
        }
    }
});

Array.prototype.extend = function (other_array) {                
    other_array.forEach(function(v) {this.push(v);}, this);
};

function emptyToNull(value){
    if(value === ''){
        return null;
    }else{
        return value;
    }
};

function invalidToEmpty(value){
    if(isInvalid(value)){
        return '';
    }else{
        return value;
    }
};

function isValid(value){
    return !isInvalid(value);
}

function isInvalid(value){
    if(typeof value === "string"){
        return value.length === 0;
    }
    if(typeof value === "undefined"){
        return true;
    }
    if(typeof value === "null"){
        return true;
    }
    if(typeof value === "number"){
        return false;
    }
    if(typeof value === "object" && value !== null){
        return false;
    }
    return true;
};
