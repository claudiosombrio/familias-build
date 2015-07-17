directives.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                this.select();
            });
        }
    };
});

directives.directive('cAltura', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, ngModelCtrl) {
            elm.bind('blur', function () {
                scope.$apply(function () {
                    if (elm.val() != undefined) {
                        var number = elm.val().replace(/[^0-9]/g, '');
                        if(isValid(number)){
                            number = parseInt(number);
                            if(number < 10){
                                number = '00'+number;
                            }else if(number < 100){
                                number = '0'+number;
                            }
                        }
                        number = number.toString().replace(/(\d)(?=(\d{2})+(?!\d))/g, "$1,");

                        ngModelCtrl.$setViewValue(number);
                        ngModelCtrl.$render();
                    }
                });
            });

            if (ngModelCtrl) { // Don't do anything unless we have a model
                ngModelCtrl.$parsers.push(function (value) {
                    if (value != undefined) {
                        return value.toString().replace(/[^0-9]/g, '');
                    }
                    return value;
                });

                ngModelCtrl.$formatters.push(function (value) {
                    if (value != undefined) {
                        value = value.toString().replace(/[^0-9]/g, '');
                        if(isValid(value)){
                            value = parseInt(value);
                            if(value < 10){
                                value = '00'+value;
                            }else if(value < 100){
                                value = '0'+value;
                            }
                        }
                        value = value.toString().replace(/(\d)(?=(\d{2})+(?!\d))/g, "$1,");
                    }
                    return value;
                });
            }
        }
    };
}]);

directives.directive('cPeso', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, ngModelCtrl) {
            elm.bind('blur', function () {
                scope.$apply(function () {
                    if (elm.val() != undefined) {
                        var number = elm.val().toString().replace(/[^0-9]/g, '');
                        if(isValid(number)){
                            number = parseInt(number);
                            if(number < 10){
                                number = '000'+number;
                            }else if(number < 100){
                                number = '00'+number;
                            }else if(number < 1000){
                                number = '0'+number;
                            }
                        }
                        number = number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");

                        ngModelCtrl.$setViewValue(number);
                        ngModelCtrl.$render();
                    }
                });
            });

            if (ngModelCtrl) { // Don't do anything unless we have a model
                ngModelCtrl.$parsers.push(function (value) {
                    value = value.toString().replace(/[^0-9]/g, '');
                    return value;
                });

                ngModelCtrl.$formatters.push(function (value) {
                    if (value != undefined) {
                        value = value.toString().replace(/[^0-9]/g, '');
                        if(isValid(value)){
                            value = parseInt(value);
                            if(value < 10){
                                value = '000'+value;
                            }else if(value < 100){
                                value = '00'+value;
                            }else if(value < 1000){
                                value = '0'+value;
                            }
                        }
                        value = value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                    }
                    return value;
                });
            }
        }
    };
}]);

directives.directive('cTelefone', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, ngModelCtrl) {
            scope.$watch(attr.ngModel, function(newVal, oldVal) {
                var v = false;
                if(newVal && newVal.toString().length > 9 && newVal.toString().length < 12){
                    v = true;
                }
                ngModelCtrl.$setValidity( 'telefone', v);
            });
            
            //Usado somente no blur, pois quebra no Genesis-7301
//            elm.unbind('input').unbind('keydown').unbind('change');
            elm.bind('blur', function () {
                scope.$apply(function () {
                    if (elm.val() != undefined) {
                        var number = elm.val().replace(/[^0-9]/g, '');
                        if (number.length < 10 || number.length > 11) {
                            number = '';
                        } else {
                            number = number.replace(/^(\d{2})(\d{4})(\d{4,5})$/, "\($1\) $2-$3");
                        }

                        ngModelCtrl.$setViewValue(number);
                        ngModelCtrl.$render();
                    }
                });
            });

            if (ngModelCtrl) { // Don't do anything unless we have a model
                ngModelCtrl.$parsers.push(function (value) {
                    if (value != undefined) {
                        return value.replace(/[^0-9]/g, '');
                    }
                    return value;
                });

                ngModelCtrl.$formatters.push(function (value) {
                    if (value != undefined) {
                        value = value.replace(/[^0-9]/g, '');
                        if (value.length < 10 || value.length > 11) {
                            value = '';
                        } else {
                            value = value.replace(/^(\d{2})(\d{4})(\d{4,5})$/, "\($1\) $2-$3");
                        }
                    }
                    return value;
                });
            }
        }
    };
});

directives.directive('cMaxLength', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            var maxlength = Number(attrs.cMaxLength);
            function fromUser(text) {
                if (text && text.toString().length > maxlength) {
                    var transformedInput = text.toString().substring(0, maxlength);
                    ngModelCtrl.$setViewValue(transformedInput);
                    ngModelCtrl.$render();
                    return transformedInput;
                }
                return text;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});