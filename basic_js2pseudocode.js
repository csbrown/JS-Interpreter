
var myInterpreter;
function initAlert(interpreter, scope) {
  var wrapper = function(text) {
    return alert(arguments.length ? text : '');
  };
  interpreter.setProperty(scope, 'alert',
      interpreter.createNativeFunction(wrapper));
}

function output(something) {
    document.querySelector("#outputarea").value = JSON.stringify(something);
}
function initOutput(interpreter, scope) {
  document.querySelector("#outputarea").value = '';
  var wrapper = function(something) {
    return output(something);
  };
  interpreter.setProperty(scope, 'output',
      interpreter.createNativeFunction(wrapper));
}

function init(interpreter, scope) {
    initAlert(interpreter, scope);
    initOutput(interpreter, scope);
}

function parseButton() {
  var code = document.getElementById('code').value;
  myInterpreter = new Interpreter(code, init);
  disable('');
  lineButtonStart = 999999999999999;
  lastNode = null;
  updateVariablesList();
  variables = {};
  myInterpreter = new Interpreter(code, init);
}

function updateVariablesList() {
    for (const name in variables) {
        var value;
        try {
            value = myInterpreter.getValueFromScope(name);
        } catch (e) {
            try {
                var variable_table = document.querySelector('#variablelist')
                var variable_cell = variable_table.querySelector('#variable_'.concat(name));
                var variable_row = variable_cell.parentNode;
                variable_row.remove();
            } catch(e) {console.log(e);}
            delete variables[name];
            continue;
        }
        if (typeof value == 'undefined') {
            //value = 'undefined';
        }
        else if (value.class == "Array") {
            var newVal = [];
            for (var i = 0; i < value.properties.length; i++) {
                newVal.push(value.properties[i]);
            }
            value = newVal;
        }
        var variable_table = document.querySelector('#variablelist')
        var variable_cell = variable_table.querySelector('#variable_'.concat(name));
        if (variable_cell === null) {
            var new_row = document.createElement('tr');
            variable_cell = document.createElement('td');
            variable_cell.setAttribute('id', 'variable_'.concat(name))
            variable_cell.innerHTML = name;
            new_row.appendChild(variable_cell);
            new_row.appendChild(document.createElement('td'));
            variable_table.appendChild(new_row);
        }
        var variable_row = variable_cell.parentNode;
        var variable_value_cell = variable_row.children[1];
        variable_value_cell.innerHTML = JSON.stringify(value);
    }
}

var variables = {};
function stepButton() {
  if (myInterpreter.stateStack.length) {
    var node =
        myInterpreter.stateStack[myInterpreter.stateStack.length - 1].node;
    console.log(node);
    if (node.type == "VariableDeclaration") {
        for (declaration in node.declarations) {
            variables[node.declarations[declaration].id.name] = 1;
        }
    }
    var start = node.start;
    var end = node.end;
  } else {
    var start = 0;
    var end = 0;
  }
  createSelection(start, end);
  try {
    var ok = myInterpreter.step();
    if (ok) {
      updateVariablesList();
      return node;
    } else { console.log("badstep"); return null; }
  } finally {
    if (!ok) {
      disable('disabled');
    }
  }
}

var lineButtonStart = 999999999999999;
var lastNode = null;
function lineButton() {
  var lineEnds = [0];
  var re = /\n/g;
  var code = document.getElementById('code').value;
  while ((match = re.exec(code)) != null) {
    lineEnds.push(match.index);
  }
  lineEnds.push(code.length);
  var pseudocodelineEnds = [0];
  var pseudocode = document.getElementById('pseudocode').value;
  if (typeof pseudocode == "undefined") {
    pseudocode = document.getElementById('pseudocode').innerHTML;
  }
  while ((match = re.exec(pseudocode)) != null) {
    pseudocodelineEnds.push(match.index);
  }
  pseudocodelineEnds.push(pseudocode.length);
  function lineEndFinder(i) {
    function findLineEnd(j) {
        return j > i;
    }
    return findLineEnd;
  }
  
  if (lastNode === null) { lastNode = stepButton(); }
  var i = 0;
  while ((
            lineEnds.findIndex(lineEndFinder(lineButtonStart)) == lineEnds.findIndex(lineEndFinder(lastNode.start))
        ) || (lastNode.type == "BlockStatement") || (lastNode.type == "Program")
    ) {
    lastNode = stepButton();
    i += 1;
    if ((i >= 100) || lastNode === null) { break; }
  }
  var end = lineEnds.findIndex(lineEndFinder(lastNode.start));
  var start = end - 1;
  console.log(start); console.log(end);
  //createSelection(lineEnds[start], lineEnds[end]);
  console.log(pseudocodelineEnds);
  createPseudoCodeSelection(pseudocodelineEnds[start], pseudocodelineEnds[end]);
  lineButtonStart = lastNode.start;
}

function runButton() {
  disable('disabled');
  if (myInterpreter.run()) {
    // Async function hit.  There's more code to run.
    disable('');
  }
}

function disable(disabled) {
  //document.getElementById('stepButton').disabled = disabled;
  document.getElementById('lineButton').disabled = disabled;
  //document.getElementById('runButton').disabled = disabled;
}

function hideJS() {
  var x = document.getElementById('code');
  if (x.style.display === "none") {
    x.style.display = "inline-block";
  } else {
    x.style.display = "none";
  }
}

function createTextSelection(field, start, end) {
  if (field.createTextRange) {
    var selRange = field.createTextRange();
    selRange.collapse(true);
    selRange.moveStart('character', start);
    selRange.moveEnd('character', end);
    selRange.select();
  } else if (field.setSelectionRange) {
    field.setSelectionRange(start, end);
  } else if (field.selectionStart) {
    field.selectionStart = start;
    field.selectionEnd = end;
  }
}

function createPseudoCodeSelection(start, end) {
  var field = document.getElementById('pseudocode');
  createTextSelection(field, start, end);
  field.focus();
}

function createSelection(start, end) {
  var field = document.getElementById('code');
  createTextSelection(field, start, end);
  field.focus();
}
