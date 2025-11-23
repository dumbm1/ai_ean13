'use strict';

var csInterface = new CSInterface();
init();

function init() {

 themeManager.init();

 loadJSX('json2.js');

 var btnGen = document.getElementById('btn_gen'),
  btnSave = document.getElementById('btn_save'),
  btnDefaults = document.getElementById('btn_defaults'),
  btnRefresh = document.getElementById('btn_refresh');

 var digField = document.getElementById('code_val'),
  checkDigit = document.getElementById('check_digit'),
  chNewLay = document.getElementById('ch_new_lay'),
  layNameVal = document.getElementById('lay_name_val');

 var settingsTitleElem = document.getElementById('settings_title'),
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

 csInterface.evalScript(getFonts.toString() + ';getFonts()', function (result) {
  var opts = makeDefaultOpts();
  var fontList = JSON.parse(result);

  insertFontList(fontList);
  csInterface.evalScript(readIni.toString() + ';readIni()', function (result) {
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
   csInterface.evalScript(makeEan13.toString() + ';makeEan13(' + JSON.stringify(opts) + ')', function (result) {
    setTimeout(function () {

    }, 1000);
    opts.symbolName = result;

    csInterface.evalScript(postProcess.toString() + ';postProcess(' + JSON.stringify(opts) + ')');
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
   setIni(getPanOpts());
   _fitPanelToContent();
   return;
  }
  settingsContentElem.className = '';
  titleSpan.classList.remove('settings-title-span_close');
  titleSpan.classList.add('settings-title-span_open');
  setIni(getPanOpts());
  _fitPanelToContent();
 };

 btnDefaults.onclick = function () {
  csInterface.evalScript(delIni.toString() + ';delIni()', function (result) {
   var opts = makeDefaultOpts();
   localStorage.clear();
   document.getElementById('code_val').value = '';
   document.getElementById('check_digit').innerHTML = 'X';
   document.getElementById('sel_font').selectedIndex = 0;
   setPanOpts(opts);
   setIni(opts);
   _fitPanelToContent();
  });

 };

 btnSave.onclick = function () {
  setIni(getPanOpts());
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

function setIni(opts) {
 csInterface.evalScript(writeIni.toString() + ';writeIni(' + JSON.stringify(opts) + ')');
}

function _fitPanelToContent() {
 setTimeout(function () {
  csInterface.resizeContent(document.documentElement.offsetWidth, document.documentElement.offsetHeight);
 }, 500);
}

/////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/*
* JSX LIB
* */
//encoding table: L R G; R = _mirror ( L ); G = _reverse ( _mirror ( L ) )

function makeEan13(o) {

 var code       = o.str,
  led        = o.chLed,
  fntName    = o.fontName,
  ch_center  = o.chCenter,
  ch_select  = o.chSelect,
  chNewLay   = o.chNewLay,
  layNameVal = o.layNameVal,
  reduceVal  = o.reduceVal,
  chAddBg    = o.chAddBg;

 if (code.length < 13) return;
 if (activeDocument.activeLayer.visible == false) return;
 if (activeDocument.activeLayer.locked == true) return;
 if (documents.length == 0) return;

 activeDocument.rulerOrigin = [0, activeDocument.height]; // Set Zero point ruler on Document

 var encodeString,
  symbol,
  symbolName,
  col          = new CMYKColor(),
  MM_TO_PT     = 2.834645669,
  PT_TO_MM     = 0.352777778,
  structure    = [
   'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'],
  encodeDigits = [
   '0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111',
   '0001011'],
  BAR_H        = 22.85,
  BAR_SEP_H    = 24.5;

 reduceVal = parseFloat(reduceVal) * MM_TO_PT;

 col.black = 100;

 encodeString = _makeEncodeStr(code);
 symbol = _makeBars(encodeString);
 _makeDigits(code, symbol);

 if (chAddBg == true) {
  var rect = _makeRect(symbol.top, (-3.63) * MM_TO_PT, 37.29 * MM_TO_PT, 25.93 * MM_TO_PT/*symbol.height*/, symbol, 0, new CMYKColor());
  rect.move(symbol, ElementPlacement.PLACEATEND);
  // rect.resize(100, 101, true, true, true, true, undefined, Transformation.CENTER);
  rect.stroked = false;
 }

 symbolName = '__code#' + code + '@' + makeRandStr(6) + '__';
 symbol.name = symbolName;
 // return encodeString;
 return symbolName;

 /**
  * LIB
  * */

 function _makeDigits(code, digGroup) {
  var digGr = digGroup.groupItems.add();
  var startTop = -(BAR_H + 0.25) * MM_TO_PT /*-(BAR_H + (BAR_SEP_H - BAR_H) / 3) * MM_TO_PT*/,
   realTop  = startTop;
  var left_fr0 = -3 * MM_TO_PT;
  var startFntSize = 13,
   realFntSize  = startFntSize,
   fntH         = 7.8,
   middTxtW     = 38.211,
   left_fr1     = 3.74,
   left_fr2     = 46.772,
   left_fr3     = 89.924;

  // this function lounch (o.tune == true) is changing realTop and realFntSize values
  var digFr_1 = __addDig({
   cont: code.slice(1, 7), leftPnt: left_fr1, justify: 'center', tune: true
  });
  var digFr_2 = __addDig({
   cont: code.slice(7), leftPnt: left_fr2, justify: 'center', tune: false
  });
  var digFr_0 = __addDig({
   cont: code.slice(0, 1), leftPnt: left_fr0, justify: 'left', tune: false
  });
  if (led == true) {
   var digFr_3 = __addDig({
    cont: '>', leftPnt: left_fr3, justify: 'right', tune: false
   });
  }

  function __addDig(o /*o.cont, o.leftPnt, o.justify, o.tune*/) {
   var pntTxt = digGr.textFrames.add();

   pntTxt.textRange.size = realFntSize;
   pntTxt.contents = o.cont;
   pntTxt.textRange.characterAttributes.fillColor = col;
   pntTxt.textRange.characterAttributes.tracking = -50;

   try {
    pntTxt.textRange.characterAttributes.textFont = textFonts.getByName(fntName);
   } catch (e) {
    pntTxt.textRange.characterAttributes.textFont = textFonts[0];
   }

   switch (o.justify) {
    case 'left_fr0':
     // !!! Justification.LEFT is not working
     pntTxt.textRange.paragraphAttributes.justification = Justification.FULLJUSTIFYLASTLINELEFT;
     break;
    case 'right':
     pntTxt.textRange.paragraphAttributes.justification = Justification.RIGHT;
     break;
    case 'center':
     pntTxt.textRange.paragraphAttributes.justification = Justification.CENTER;
     break;
    default:
     break;
   }

   if (o.justify == 'center') {
    pntTxt.left = o.leftPnt + (middTxtW - pntTxt.width) / 2;
   } else {
    pntTxt.left = o.leftPnt;
   }

   if (o.tune == true) {
    while (_calcCharSize(pntTxt).h > fntH) {
     realFntSize -= 0.1;
     pntTxt.textRange.size = realFntSize;
    }
    realTop = startTop + _calcCharSize(pntTxt).top;
   }

   pntTxt.top = realTop;

   return pntTxt;

  }

 }

 function _makeBars(str) {
  var newLay,
   codeGroup,
   barsGroup;

  if (chNewLay == true) {
   newLay = activeDocument.layers.add();
   newLay.name = layNameVal;
   codeGroup = newLay.groupItems.add();
   barsGroup = codeGroup.groupItems.add();
  } else {
   codeGroup = activeDocument.activeLayer.groupItems.add();
   barsGroup = codeGroup.groupItems.add();
  }

  var x                                    = .33 * MM_TO_PT,
   top = 0, left = 0, width = 0, height = BAR_H * MM_TO_PT;
  for (var i = 0; i < str.length; i++) {
   if (str[i] == '0') {
    if (width) {
     str [i - 1] == '7' ? height = BAR_SEP_H * MM_TO_PT : height = BAR_H * MM_TO_PT;
     _makeRect(top, left, width, height, barsGroup, reduceVal, col);
     left += width + x;
     width = 0;
     continue;
    }
    left += x;
    continue;
   }
   if (str [i] == '1' || str [i] == '7') {
    width += x;
   }
  }
  if (width) {
   height = BAR_SEP_H * MM_TO_PT;
   _makeRect(top, left, width, height, barsGroup, reduceVal, col);
  }
  return codeGroup;
 }

 function _makeEncodeStr(code) {
  var resultStr = '707';
  var structStr = structure [+code [0]];
  var codeStart = code.slice(1, 7);
  for (var i = 0; i < codeStart.length; i++) {
   switch (structStr [i]) {
    case 'L':
     resultStr += encodeDigits [codeStart [i]];
     break;
    case 'G':
     resultStr += _reverse(_mirror(encodeDigits [codeStart [i]]));
     break;
    default:
     break;
   }
  }
  resultStr += '07070';
  var codeEnd = code.slice(7);
  for (var j = 0; j < codeEnd.length; j++) {
   resultStr += _mirror(encodeDigits[codeEnd[j]]);
  }
  resultStr += '707';
  return resultStr;
 }

 function _makeRect(top, left, width, height, container, reduce, col) {
  container = container || activeDocument.activeLayer;
  var rect = container.pathItems.rectangle(top, left, width + reduce, height);
  rect.stroked = false;
  rect.fillColor = col;
  rect.fillOverprint = false;
  return rect;
 }

 function _reverse(str) {
  return str.split('').reverse().join('');
 }

 function _mirror(str) {
  var mirStr = '';
  for (var i = 0; i < str.length; i++) {
   str[i] == '1' ? mirStr += '0' : mirStr += '1';
  }
  return mirStr;
 }

 /**
  * calculate top, bottom spasing and the real height of the capital characters
  *
  * @param {TextFrameItem} frame - object of the TextFrameItem class
  * @return {Object} fntMeas - result object {h, top, bot, w}
  */
 function _calcCharSize(frame) {
  var txt     = activeDocument.activeLayer.textFrames.add(),
   fullH,
   fntMeas = {};

  txt.contents = frame.contents;
  // txt.contents                               = 'C';
  txt.textRange.characterAttributes.textFont = frame.textRange.characterAttributes.textFont;
  txt.textRange.characterAttributes.size = frame.textRange.characterAttributes.size;

  var txtCurv = (txt.duplicate()).createOutline();

  fullH = txt.height;
  fntMeas.h = txtCurv.height;
  fntMeas.top = Math.abs(txt.position[1] - txtCurv.position[1]);
  fntMeas.bot = (fullH - fntMeas.h - fntMeas.top);
  fntMeas.w = txtCurv.w;

  txt.remove();
  txtCurv.remove();

  return fntMeas;
 }

}

function postProcess(o) {

 var ch_center  = o.chCenter,
  ch_select  = o.chSelect,
  symbolName = o.symbolName,
  symbol     = activeDocument.groupItems.getByName(symbolName);

 if (ch_center == true) {
  executeMenuCommand('deselectall');
  symbol.selected = true;
  cut();
  paste();
  if (ch_select == false) {
   executeMenuCommand('deselectall');
  }
 }

 if (ch_select == true && ch_center == false) {
  executeMenuCommand('deselectall');
  symbol.selected = true;
 }
}

function getFonts(chr) {
 var font = {};
 for (var i = 0; i < textFonts.length; i++) {
  font[i] = {
   family: textFonts[i].family,
   style: textFonts[i].style,
   name: textFonts[i].name
  };
 }
 return JSON.stringify(font);
}

function writeIni(jsonStr) {

 var iniFile = _addIni();
 var f = _writeIni(JSON.stringify(jsonStr));

 return f.fullName;

 function _addIni() {

  var iniName              = 'ean13_v2-6-0',
   localStoreFolderPath = Folder.userData + '/LocalStore/',
   iniFolder,
   iniFile;

  iniFolder = new Folder(localStoreFolderPath + iniName);
  iniFolder.exists == false ? iniFolder.create() : '';
  iniFile = new File(iniFolder + '/' + iniName + '.ini');

  return iniFile;
 }

 function _writeIni(str) {
  if (iniFile.exists) {
   var iniFullName = iniFile.fullName;
   iniFile.remove();
   iniFile = new File(iniFullName);
  }

  iniFile.open('e');
  iniFile.writeln(str);
  iniFile.close();

  return iniFile;
 }
}

function readIni() {
 var str = 'Ups...';
 var iniFile = _addIni();

 iniFile.open('r');
 str = iniFile.read();
 iniFile.close();

 return str /*JSON.stringify(str)*/;

 function _addIni() {

  var iniName              = 'ean13_v2-6-0',
   localStoreFolderPath = Folder.userData + '/LocalStore/',
   iniFolder,
   iniFile;

  iniFolder = new Folder(localStoreFolderPath + iniName);
  iniFolder.exists == false ? iniFolder.create() : '';
  iniFile = new File(iniFolder + '/' + iniName + '.ini');

  return iniFile;
 }
}

function delIni() {
 var iniName              = 'ean13_v2-6-0',
  localStoreFolderPath = Folder.userData + '/LocalStore/',
  iniFolder            = new Folder(localStoreFolderPath + iniName),
  iniFile;

 if (!iniFolder.exists) {
  return;
 }
 iniFile = new File(iniFolder + '/' + iniName + '.ini');
 if (!iniFile.exists) {
  return;
 }
 iniFile.remove();
 iniFolder.remove();

 return true;
}

function makeRandStr(len) {
 return ('1' + (new Date()) * Math.random() * 10000).slice(0, len);
}