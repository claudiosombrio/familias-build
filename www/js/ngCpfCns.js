/* global angular, CPF, CNS */
(function(window){

  'use strict';

  var module = angular.module('ngCpfCns', []);

  if( window.CPF ) {

    module.directive('ngCpf', function() {
      return {

        restrict: 'A',

        require: 'ngModel',

        link: function(scope, elm, attrs, ctrl) {
          scope.$watch(attrs.ngModel, function(newVal, oldVal) {
            ctrl.$setValidity( 'cpf', CPF.isValid(newVal) );
          });
        }

      };
    });
  }

  if( window.CNS ) {

    module.directive('ngCns', function() {
      return {

        restrict: 'A',

        require: 'ngModel',

        link: function(scope, elm, attrs, ctrl) {
          scope.$watch(attrs.ngModel, function(newVal, oldVal) {
            ctrl.$setValidity( 'cns', CNS.isValid(newVal) );
          });
        }

      };
    });
  }

})(this);