;(function(commonjs){
  // Blacklist common values.
  var BLACKLIST = [
      "000000000000000"
  ];

  var CNS = {};

  CNS.format = function(number) {
    return this.strip(number).replace(/^(\d{3})(\d{4})(\d{4})(\d{4})$/, "$1.$2.$3.$4");
  };

  CNS.strip = function(number) {
    return (number || "").toString().replace(/[^\d]/g, "");
  };

  CNS.isValid = function(number) {
    var stripped = this.strip(number);

    // CNS must be defined
    if (!stripped) { return false; }

    // CNS must have 15 chars
    if (stripped.length !== 15) { return false; }

    // CNS can't be blacklisted
    if (BLACKLIST.indexOf(stripped) >= 0) { return false; }

    //Define se é definitivo ou provisório
    var definitivo = true;
    if (stripped.substring(0, 1) == "7" || stripped.substring(0, 1) == "8" || stripped.substring(0, 1) == "9") {
        definitivo = false;
    }
    
    if(definitivo){
        var soma;
        var resto, dv;

        var pis = "";
        var resultado = "";
        pis = stripped.substring(0, 11);

        soma = (parseInt(pis.substring(0, 1)) * 15)
                + (parseInt(pis.substring(1, 2)) * 14)
                + (parseInt(pis.substring(2, 3)) * 13)
                + (parseInt(pis.substring(3, 4)) * 12)
                + (parseInt(pis.substring(4, 5)) * 11)
                + (parseInt(pis.substring(5, 6)) * 10)
                + (parseInt(pis.substring(6, 7)) * 9)
                + (parseInt(pis.substring(7, 8)) * 8)
                + (parseInt(pis.substring(8, 9)) * 7)
                + (parseInt(pis.substring(9, 10)) * 6)
                + (parseInt(pis.substring(10, 11)) * 5);

        resto = soma % 11;
        dv = 11 - resto;

        if (dv == 11) {
            dv = 0;
        }

        if (dv == 10) {
            soma = (parseInt(pis.substring(0, 1)) * 15)
                    + (parseInt(pis.substring(1, 2)) * 14)
                    + (parseInt(pis.substring(2, 3)) * 13)
                    + (parseInt(pis.substring(3, 4)) * 12)
                    + (parseInt(pis.substring(4, 5)) * 11)
                    + (parseInt(pis.substring(5, 6)) * 10)
                    + (parseInt(pis.substring(6, 7)) * 9)
                    + (parseInt(pis.substring(7, 8)) * 8)
                    + (parseInt(pis.substring(8, 9)) * 7)
                    + (parseInt(pis.substring(9, 10)) * 6)
                    + (parseInt(pis.substring(10, 11)) * 5) + 2;
            resto = soma % 11;
            dv = 11 - resto;
            resultado = pis + "001" + dv;

        } else {
            resultado = pis + "000" + dv;
        }

        return stripped == resultado;
    }else{
        var dv;
        var resto, soma;

        soma = (parseInt(stripped.substring(0, 1)) * 15)
                + (parseInt(stripped.substring(1, 2)) * 14)
                + (parseInt(stripped.substring(2, 3)) * 13)
                + (parseInt(stripped.substring(3, 4)) * 12)
                + (parseInt(stripped.substring(4, 5)) * 11)
                + (parseInt(stripped.substring(5, 6)) * 10)
                + (parseInt(stripped.substring(6, 7)) * 9)
                + (parseInt(stripped.substring(7, 8)) * 8)
                + (parseInt(stripped.substring(8, 9)) * 7)
                + (parseInt(stripped.substring(9, 10)) * 6)
                + (parseInt(stripped.substring(10, 11)) * 5)
                + (parseInt(stripped.substring(11, 12)) * 4)
                + (parseInt(stripped.substring(12, 13)) * 3)
                + (parseInt(stripped.substring(13, 14)) * 2)
                + (parseInt(stripped.substring(14, 15)) * 1);

        resto = soma % 11;

        return resto == 0;
    }
  };

  if (commonjs) {
    module.exports = CNS;
  } else {
    window.CNS = CNS;
  }
})(typeof(exports) !== "undefined");