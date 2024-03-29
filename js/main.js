/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, window, location, CSInterface, SystemPath, themeManager*/

(function () {
  'use strict';

  var csInterface = new CSInterface();
  init();

  function init() {

    themeManager.init();

    loadJSX('json2.js');

    var btnGen      = document.getElementById('btn_gen'),
        btnSave     = document.getElementById('btn_save'),
        btnDefaults = document.getElementById('btn_defaults'),
        btnRefresh  = document.getElementById('btn_refresh');

    var digField   = document.getElementById('code_val'),
        checkDigit = document.getElementById('check_digit'),
        chNewLay   = document.getElementById('ch_new_lay'),
        layNameVal = document.getElementById('lay_name_val');

    var settingsTitleElem   = document.getElementById('settings_title'),
        settingsContentElem = document.getElementById('settings');

    function LastCode(digField = document.getElementById('code_val')) {
      let _key = 'lastCode';

      function setLastCode() {
        var digitsStore = localStorage.getItem(_key);

        if (!localStorage.getItem(_key)) return;
        digField.value = +digitsStore;

      }

      function storeCurrentCode() {
        if (!digField.value) {
          localStorage.clear();
          return;
        }
        localStorage.setItem(_key, digField.value);
      }

      this.setLastCode = setLastCode;
      this.storeCurrentCode = storeCurrentCode;
    }

    let lastCode = new LastCode(digField);

    (function showWaitMessage() {
      document.body.className = 'hostElt hostBody';
      document.getElementById('content').className = 'content-hide';
      document.getElementById('message_elt').className = 'message';
    }());

    csInterface.evalScript('getFonts()', function (result) {
      var opts = makeDefaultOpts();
      var fontList = JSON.parse(result);

      insertFontList(fontList);
      csInterface.evalScript('readIni()', function (result) {
        opts = JSON.parse(result);
        lastCode.setLastCode();
        setPanOpts(opts);
        {
          var digStr = document.getElementById('code_val').value;
          if (digStr.length == 12) {
            checkDigit.innerHTML = calcCheсkDigit(digStr);
          } else {
            checkDigit.innerHTML = 'X';
          }
        }
      });

      (function hideWaitMessage() {
        document.body.className = 'hostElt';
        document.getElementById('content').className = '';
        document.getElementById('message_elt').className = 'message message-hide';
      }());

      _fitPanelToContent();

    });

    /** * * * * * * * * *
     * * * HANDLERS * * *
     * * * * * * * * * **/

    digField.addEventListener('input', controlEnterDigits);
    digField.addEventListener('input', function (e) {
      lastCode.storeCurrentCode();
    });

    btnGen.onclick = function () {
      var opts;
      var digStr = document.getElementById('code_val').value;

      if (digStr.length == 12) {
        opts = getPanOpts();
        opts.str = digStr + checkDigit.innerHTML;
        csInterface.evalScript('makeEan13(' + JSON.stringify(opts) + ')', function (result) {
          setTimeout(function () {

          }, 1000);
          opts.symbolName = result;

          csInterface.evalScript('postProcess(' + JSON.stringify(opts) + ')');
        });
      }
    };

    digField.onkeyup = function (e) {
      var digStr = document.getElementById('code_val').value;
      if (digStr.length == 12) {
        checkDigit.innerHTML = calcCheсkDigit(digStr);
      } else {
        checkDigit.innerHTML = 'X';
      }
    };

    chNewLay.onclick = function () {
      if (layNameVal.disabled == false) {
        layNameVal.disabled = true;
        return;
      }
      layNameVal.disabled = false;
      return;
    };

    settingsTitleElem.onclick = function (e) {
      let titleSpan = document.querySelector('.settings-title-span');

      if (settingsContentElem.className != 'settings-close') {
        settingsContentElem.className = 'settings-close';
        titleSpan.classList.remove('settings-title-span_open');
        titleSpan.classList.add('settings-title-span_close');
        writeIni(getPanOpts());
        _fitPanelToContent();
        return;
      }
      settingsContentElem.className = '';
      titleSpan.classList.remove('settings-title-span_close');
      titleSpan.classList.add('settings-title-span_open');
      writeIni(getPanOpts());
      _fitPanelToContent();
    };

    btnDefaults.onclick = function () {
      csInterface.evalScript('delIni()', function (result) {
        var opts = makeDefaultOpts();
        localStorage.clear();
        document.getElementById('code_val').value = '';
        document.getElementById('check_digit').innerHTML = 'X';
        document.getElementById('sel_font').selectedIndex = 0;
        setPanOpts(opts);
        writeIni(opts);
        _fitPanelToContent();
      });

    };

    btnSave.onclick = function () {
      writeIni(getPanOpts());
    };

    btnRefresh.onclick = function () {
      reloadPanel();
    };

    /** * * * * * * * *
     * * * MY LIB * * *
     * * * * * * * * **/
    function controlEnterDigits() {
      var re = /[^\d]/gmi; // only digits
      digField.value = ((digField.value).replace(re, '')).slice(0, 12);
    }

    /**
     * расчёт контрольной цифры кода ean13
     *
     * @param {String} str 12 цифр кода
     * @return {Number} check_digit 13-я контрольная цифра
     * */
    function calcCheсkDigit(str) {
      var x = 0, y = 0, z = 0, checkDigit;
      for (var i = 0; i < str.length; i++) {
        (i % 2 != 0) ? x += +str.slice(i, i + 1) : y += +str.slice(i, i + 1);
      }
      z = 3 * x + y;
      (z % 10 == 0) ? checkDigit = 0 : checkDigit = (10 - (z + 10) % 10);
      return checkDigit;
    }

    function makeDefaultOpts() {
      var opts = {};

      opts.str = '';

      opts.chLed = false;
      opts.chCenter = false;
      opts.chSelect = false;
      opts.chAddBg = false;
      opts.chNewLay = false;

      opts.reduceVal = 0.00;
      opts.layNameVal = '';
      opts.layNameDisabled = true;
      opts.fontName = '';
      opts.settingsDisplayClass = '';
      opts.settingsTitleSpanClass = 'settings-title-span settings-title-span_open';

      return opts;
    }

    function getPanOpts() {
      var opts = {};
      opts.chLed = document.getElementById('ch_led').checked;
      opts.chCenter = document.getElementById('ch_center').checked;
      opts.chSelect = document.getElementById('ch_select').checked;
      opts.chNewLay = document.getElementById('ch_new_lay').checked;
      opts.chAddBg = document.getElementById('ch_add_bg').checked;
      opts.reduceVal = document.getElementById('reduce_val').value;
      opts.layNameVal = document.getElementById('lay_name_val').value;
      opts.layNameDisabled = document.getElementById('lay_name_val').disabled;

      var selFont = document.getElementById('sel_font');
      opts.fontName = selFont[selFont.selectedIndex].text;

      opts.settingsDisplayClass = document.getElementById('settings').className;
      opts.settingsTitleSpanClass = document.querySelector('.settings-title-span').className;

      return opts;
    }

    function setPanOpts(opts) {

      document.getElementById('ch_led').checked = opts.chLed;
      document.getElementById('ch_center').checked = opts.chCenter;
      document.getElementById('ch_select').checked = opts.chSelect;
      document.getElementById('ch_new_lay').checked = opts.chNewLay;
      document.getElementById('ch_add_bg').checked = opts.chAddBg;
      document.getElementById('reduce_val').value = opts.reduceVal;
      document.getElementById('lay_name_val').value = opts.layNameVal;
      document.getElementById('lay_name_val').disabled = opts.layNameDisabled;

      _selectOptByText(opts.fontName, 'sel_font');

      document.getElementById('settings').className = opts.settingsDisplayClass;
      document.querySelector('.settings-title-span').className = opts.settingsTitleSpanClass;

      function _selectOptByText(text, selectId) {
        var obj = document.getElementById(selectId).options;

        for (var key in obj) {

          if ((obj[key]).text == text) {
            (obj[key]).selected = true;
            return;
          }
        }
      }
    }

    function insertFontList(fontList) {
      for (var key in fontList) {
        var optFont = document.createElement('option');
        optFont.innerHTML = fontList[key].name;
        optFont.selected = false;
        document.getElementById('sel_font').appendChild(optFont);
      }
    }

  }

  /** * * * * * * * * * *
   * * * NATIVE LIB * * *
   * * * * * * * * * * **/
  // Reloads extension panel
  function reloadPanel() {
    location.reload();
  }

  function loadJSX(fileName) {
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + '/jsx/';
    csInterface.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
  }

  function writeIni(opts) {
    csInterface.evalScript('writeIni(' + JSON.stringify(opts) + ')');
  }

  function _fitPanelToContent() {
    setTimeout(function () {
      csInterface.resizeContent(document.documentElement.offsetWidth, document.documentElement.offsetHeight);
    }, 500);
  }

}());
