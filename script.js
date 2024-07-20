const dropArea = document.getElementById('drop-area');
const fileTextElement = document.getElementById('file-text');
const fileTextNoRecursionElement = document.getElementById('file-text-no-recursion');
const vectorsContainer = document.getElementById('vectors-container');
const container = document.getElementById('content-file-no-recursion-container');
const prima = '1';
const simbolo = '=';

let variablesSinRecursividad = [];
let productionsSinRecursividad = {};
const funciones = {
    funcionPrimera: [],
    funcionSiguiente: [],
}

const matrizSimbolosSinRecursividad = {}

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];

    if (file) {
        readFile(file);
    }
});

function readFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const fileText = e.target.result;
        fileTextElement.textContent = fileText;
        const archivoOriginal = convertToNonRecursiveFormat(fileText);
        fileTextNoRecursionElement.textContent = archivoOriginal.replaceAll('\'e\'', 'e');
        document.getElementById('content-file').style.display = 'block';
        document.getElementById('content-file-no-recursion').style.display = 'block';

        processFileData(fileText);

        separateVariablesAndTerminals();
        processFileDataNoRecursion(archivoOriginal);
    };

    reader.readAsText(file);
}

function processFileData(fileText) {
    const lines = fileText.split('\n');
    const variables = [];
    const terminals = [];
    const productions = {};
    const expresionRegularMayusculas = /[A-Z][a-z]*/;

    lines.forEach(line => {
        const [variablePart, expressionsPart] = line.trim().split(simbolo);

        if (variablePart && expressionsPart) {
            const variable = variablePart.trim();
            const expressions = expressionsPart.trim().split('|').map(exp => exp.replace(/'/g, '').trim());

            if (!variables.includes(variable)) {
                variables.push(variable);
            }

            if (!productions[variable]) {
                productions[variable] = [];
            }

            expressions.forEach(expression => {
                productions[variable].push(expression);
                expression.split(expresionRegularMayusculas).forEach(symbol => {
                    const trimmedSymbol = symbol.trim();
                    if (trimmedSymbol && !expresionRegularMayusculas.test(trimmedSymbol) && !variables.includes(trimmedSymbol) && !terminals.includes(trimmedSymbol)) {
                        terminals.push(trimmedSymbol);
                    }
                });
            });
        }
    });

    displayVariablesAndTerminals(variables, terminals);
    displayProductions(productions);
}

function processFileDataNoRecursion(fileText) {
    const lines = fileText.split('\n');

    let terminalsSinRecursividad = [];

    const expresionRegularMayusculas = new RegExp(/^([A-Z])+([0-9])*/);

    lines.forEach((line) => {
        const parts = line.trim().split(simbolo);
        if (parts.length === 2) {
            const variable = parts[0].trim();
            const expressions = parts[1].trim().split('|');
            if (!variablesSinRecursividad.includes(variable)) {
                variablesSinRecursividad.push(variable);
            }
            productionsSinRecursividad[variable] = productionsSinRecursividad[variable] || [];
            expressions.forEach((exp) => {
                const symbols = exp.trim().split("'");
                let production = "";
                production = exp;
                symbols.forEach((symbol, index, array) => {
                    const trimmedSymbol = symbol.trim();

                    if (trimmedSymbol && trimmedSymbol !== '|' && !expresionRegularMayusculas.test(trimmedSymbol)) {
                        if (!variablesSinRecursividad.includes(trimmedSymbol) && !terminalsSinRecursividad.includes(trimmedSymbol)) {
                            terminalsSinRecursividad.push(trimmedSymbol);
                        }
                    }
                });
                productionsSinRecursividad[variable].push(production);
            });
        }
    });

    variablesSinRecursividad.forEach(row => {
        matrizSimbolosSinRecursividad[row] = {};
        terminalsSinRecursividad.forEach(column => {
            if (column != 'e') {
                matrizSimbolosSinRecursividad[row][column] = '';
            }
        });
        matrizSimbolosSinRecursividad[row]['$'] = '';
    });

    displayProductionsNoRecursion(productionsSinRecursividad);

    funcionPrimera(productionsSinRecursividad);
    displayFuncionPrimera(funciones);

    funcionSiguiente(productionsSinRecursividad);
    displayFuncionSiguiente(funciones);

    tablaSimbolos(productionsSinRecursividad);
    displayMatrizSimbolos(matrizSimbolosSinRecursividad);
}

const funcionPrimera = (productions) => {
    Object.keys(productions).forEach(variable => {
        if (productions.hasOwnProperty(variable)) {
            const productionList = productions[variable];
            const matrizFuncion = {
                variable: variable,
                terminales: []
            };

            if (/^([A-Z])+([0-9])*/.test(variable)) {
                funcionPl(matrizFuncion, variable);
                funciones.funcionPrimera.push(matrizFuncion);
            }
        }
    });
};

const funcionSiguiente = (productions) => {
    Object.entries(productions).forEach(([variable, productionList]) => {
        const matrizFuncion = {
            variable: variable,
            terminales: []
        };

        if (/^([A-Z])+([0-9])*/.test(variable)) {
            funcionSl(matrizFuncion, variable);
            matrizFuncion.terminales.push('$');

            funciones.funcionSiguiente.push(matrizFuncion);
        }
    });
};

const tablaSimbolos = (productions) => {
    for (const variable in productions) {
        if (productions.hasOwnProperty(variable)) {
            const productionList = productions[variable];

            if (RegExp(/^([A-Z])+([0-9])*/).test(variable)) {
                funcionMatrizSimbolosLogica(productionList, variable);
            }
        }
    }
}

const funcionPl = (matrizFuncion, variable) => {
    const producciones = productionsSinRecursividad[variable];

    producciones.forEach(produccionLinea => {
        const produccion = produccionLinea.trim();
        const produccionTexto = produccion.replace(/'/g, "");
        // Regla 1: Funcion Primera
        if (/^'([^']*)'/.test(produccion)) { // Si la variable está en la primera posición
            const variableTexto = produccion.match(/'([^']*)'/g) || [];
            // Regla 2: Funcion Primera
            if (variableTexto[0].replace(/'/g, "") === "e" && produccionTexto.length > 1) {
                return;
            }
            const terminal = variableTexto[0].replace(/'/g, "");
            if (!matrizFuncion.terminales.includes(terminal)) {
                matrizFuncion.terminales.push(terminal);
            }
        } else {
            rfprimera(produccion, matrizFuncion);
        }
    });
}

const funcionSl = (matrizFuncion, variableBuscar) => {
    Object.keys(productionsSinRecursividad).forEach(variableProduccion => {
        const producciones = productionsSinRecursividad[variableProduccion];

        producciones.forEach(produccionLinea => {
            const produccion = produccionLinea.replace(/ /g, "").trim();
            const indexVariableBuscar = produccion.indexOf(variableBuscar);

            if (indexVariableBuscar !== -1) {
                const siguienteCaracter = produccion.substring(indexVariableBuscar + variableBuscar.length).trim();

                if (siguienteCaracter.charAt(0) !== prima) {
                    // Regla 1: Validar si es terminal
                    const terminalMatch = siguienteCaracter.match(/'([^']*)'/);

                    if (terminalMatch && terminalMatch.index === 0) {
                        const terminal = terminalMatch[0].replace(/'/g, "");

                        if (!matrizFuncion.terminales.includes(terminal)) {
                            matrizFuncion.terminales.push(terminal);
                        }
                    } else if (siguienteCaracter === '') { // Regla 2: Validar si nada
                        if (variableBuscar !== variableProduccion) {
                            funcionSl(matrizFuncion, variableProduccion);
                        }
                    } else { // Regla 3: Validar si es una variable
                        rfsiguiente(siguienteCaracter, matrizFuncion);
                    }
                }
            }
        });
    });
}

const rfprimera = (produccionTexto, matrizFuncion) => {
    const vectorOrdenado = [...variablesSinRecursividad].sort((a, b) => b.length - a.length);

    vectorOrdenado.some(variableInicio => {
        if (produccionTexto.trim().startsWith(variableInicio)) {
            funcionPl(matrizFuncion, variableInicio);
            return true; // break the loop
        }
        return false; // continue the loop
    });
};

const rfsiguiente = (produccion, matrizFuncion) => {
    const vectorOrdenado = [...variablesSinRecursividad].sort((a, b) => b.length - a.length);

    vectorOrdenado.some(variableInicio => {
        if (produccion.trim().startsWith(variableInicio)) {
            funcionPl(matrizFuncion, variableInicio);
            if (matrizFuncion.terminales.includes('e')) {
                matrizFuncion.terminales.pop();
                funcionSl(matrizFuncion, variableInicio);
            }
            return true; // break the loop
        }
        return false; // continue the loop
    });
};

const funcionMatrizSimbolosLogica = (producciones, variableBuscar) => {
    producciones.forEach(produccion => {
        const produccionTexto = produccion.trim();
        //Regla 1: Validar si la primer posicion es terminal
        if (produccionTexto.search(RegExp(/'([^']*)'/, "g")) == 0) {
            const variableTexto = produccionTexto.match(RegExp(/'([^']*)'/, "g")) || '';
            const funcionPrimera = funciones.funcionPrimera.find(({ variable }) => variable === variableBuscar);
            funcionPrimera?.terminales.forEach(terminalesFuncionPrimea => {
                //Validamos si es terminal que esta en funcion primero es la mima que la primera posicion.
                if (variableTexto[0].replaceAll("'", "") === terminalesFuncionPrimea) {
                    if (terminalesFuncionPrimea != 'e') {
                        matrizSimbolosSinRecursividad[variableBuscar][terminalesFuncionPrimea] = produccionTexto.replaceAll("'", "");
                    } else {
                        const funcionSiguiente = funciones.funcionSiguiente.find(({ variable }) => variable === variableBuscar);
                        funcionSiguiente?.terminales.forEach(terminalesFuncionSiguiente => {
                            matrizSimbolosSinRecursividad[variableBuscar][terminalesFuncionSiguiente] = produccionTexto.replaceAll("'", "");
                        })
                    }
                }
            })
        } else { //Regla 2: Validar si la primer posicion es una Variable
            const funcionPrimera = funciones.funcionPrimera.find(({ variable }) => variable === variableBuscar);
            funcionPrimera?.terminales.forEach(terminalesFuncionPrimea => {
                matrizSimbolosSinRecursividad[variableBuscar][terminalesFuncionPrimea] = produccionTexto;
            })
        }
    })
}

function displayProductions(productions) {
    // Crear el título h4
    const titulo = document.createElement('h4');
    titulo.textContent = 'Matriz de Producciones';
    // Obtener el elemento contenedor
    const contenedor = document.getElementById('productions-container');
    // Añadir el título al contenedor
    contenedor.appendChild(titulo);
    // Crear y añadir los vectores al contenedor
    for (const variable in productions) {
      if (productions.hasOwnProperty(variable)) {
        const productionList = productions[variable];
        productionList.forEach((production) => {
          const vectorRow = document.createElement('div');
          vectorRow.className = 'vector-container';

          const variableItem = document.createElement('div');
          variableItem.className = 'vector-item';
          variableItem.textContent = `${variable}`;

          const productionItem = document.createElement('div');
          productionItem.className = 'vector-item';
          productionItem.textContent = `${production}`;

          vectorRow.appendChild(variableItem);
          vectorRow.appendChild(productionItem);
          contenedor.appendChild(vectorRow);
        });
      }
    }
  }

function displayProductionsNoRecursion(productions) {
    // Crear el título h4
    const titulo = document.createElement('h4');
    titulo.textContent = 'Matriz de Producciones';
    // Obtener el elemento contenedor
    const contenedor = document.getElementById('productions-container-no-recursion');
    // Añadir el título al contenedor
    contenedor.appendChild(titulo);
    // Crear y añadir los vectores al contenedor
    for (const variable in productions) {
      if (productions.hasOwnProperty(variable)) {
        const productionList = productions[variable];
        productionList.forEach((production) => {
          const vectorRow = document.createElement('div');
          vectorRow.className = 'vector-container';

          const variableItem = document.createElement('div');
          variableItem.className = 'vector-item';
          variableItem.textContent = `${variable}`;

          const productionItem = document.createElement('div');
          productionItem.className = 'vector-item';
          productionItem.textContent = `{ ${production.replaceAll("'", "").trim()} }`;

          vectorRow.appendChild(variableItem);
          vectorRow.appendChild(productionItem);
          contenedor.appendChild(vectorRow);
        });
      }
    }
  }

  function displayFuncionPrimera(data) {
    const funcionPrimera = data.funcionPrimera;
    // Crear el título h4
    const titulo = document.createElement('h4');
    titulo.textContent = 'Funcion Primera';
    // Obtener el elemento contenedor
    const contenedor = document.getElementById('funcion-primaria');
    // Añadir el título al contenedor
    contenedor.appendChild(titulo);
    // Crear y añadir los vectores al contenedor
    funcionPrimera.forEach(entry => {
      const vectorRow = document.createElement('div');
      vectorRow.className = 'vector-container';

      const variableItem = document.createElement('div');
      variableItem.className = 'vector-item';
      variableItem.textContent = `${entry.variable}`;

      const terminalesItem = document.createElement('div');
      terminalesItem.className = 'vector-item';
      terminalesItem.textContent = `{ ${entry.terminales.join(', ')} }`;

      vectorRow.appendChild(variableItem);
      vectorRow.appendChild(terminalesItem);
      contenedor.appendChild(vectorRow);
    });
  }

  function displayFuncionSiguiente(data) {
    const funcionSiguiente = data.funcionSiguiente;
    // Crear el título h4
    const titulo = document.createElement('h4');
    titulo.textContent = 'Funcion Siguiente';
    // Obtener el elemento contenedor
    const contenedor = document.getElementById('funcion-siguiente');
    // Añadir el título al contenedor
    contenedor.appendChild(titulo);
    // Crear y añadir los vectores al contenedor
    funcionSiguiente.forEach(entry => {
      const vectorRow = document.createElement('div');
      vectorRow.className = 'vector-container';

      const variableItem = document.createElement('div');
      variableItem.className = 'vector-item';
      variableItem.textContent = `${entry.variable}`;

      const terminalesItem = document.createElement('div');
      terminalesItem.className = 'vector-item';
      terminalesItem.textContent = `{ ${entry.terminales.join(', ')} }`;

      vectorRow.appendChild(variableItem);
      vectorRow.appendChild(terminalesItem);
      contenedor.appendChild(vectorRow);
    });
  }

  function displayMatrizSimbolos(matriz) {
    // Crear el título h4
    const titulo = document.createElement('h4');
    titulo.textContent = 'Tabla de Simbolos';
    // Obtener el elemento contenedor
    const contenedor = document.getElementById('matriz-simbolos');
    // Añadir el título al contenedor
    contenedor.appendChild(titulo);
    // Obtener los encabezados de columna de las keys del primer objeto en matriz
    const columnas = Object.keys(matriz[Object.keys(matriz)[0]]);
    // Crear la fila de encabezado
    const headerRow = document.createElement('div');
    headerRow.className = 'vector-container';

    const emptyHeader = document.createElement('div');
    emptyHeader.className = 'vector-item';
    emptyHeader.textContent = '';
    headerRow.appendChild(emptyHeader);

    columnas.forEach(col => {
      const th = document.createElement('div');
      th.className = 'vector-item';
      th.textContent = col;
      headerRow.appendChild(th);
    });

    contenedor.appendChild(headerRow);
    // Crear las filas de datos
    for (const fila in matriz) {
      if (matriz.hasOwnProperty(fila)) {
        const row = document.createElement('div');
        row.className = 'vector-container';

        const filaHeader = document.createElement('div');
        filaHeader.className = 'vector-item';
        filaHeader.textContent = fila;
        row.appendChild(filaHeader);

        columnas.forEach(col => {
          const cell = document.createElement('div');
          cell.className = 'vector-item';
          cell.textContent = matriz[fila][col];
          row.appendChild(cell);
        });

        contenedor.appendChild(row);
      }
    }
  }

function displayVariablesAndTerminals(variables, terminals) {
    // Crear el título h4
    const titulo = document.createElement('h4');
    titulo.textContent = 'Variables y Terminales';
    // Obtener el elemento contenedor
    const contenedor = document.getElementById('vectors-container');
    // Añadir el título al contenedor
    contenedor.appendChild(titulo);
    // Crear y añadir los vectores al contenedor
    const maxLength = Math.max(variables.length, terminals.length);
    for (let i = 0; i < maxLength; i++) {
      const variable = variables[i] || '';
      const terminal = terminals[i] || '';

      const vectorRow = document.createElement('div');
      vectorRow.className = 'vector-container';

      const variableItem = document.createElement('div');
      variableItem.className = 'vector-item';
      variableItem.textContent = variable;

      const terminalItem = document.createElement('div');
      terminalItem.className = 'vector-item';
      terminalItem.textContent = terminal;

      vectorRow.appendChild(variableItem);
      vectorRow.appendChild(terminalItem);
      contenedor.appendChild(vectorRow);
    }
  }

function convertToNonRecursiveFormat(fileText) {
    const lines = fileText.split('\n');
    let newLines = [];

    lines.forEach((line) => {
        const parts = line.trim().split(simbolo);
        if (parts.length === 2) {
            const variable = parts[0].trim();
            const expressions = parts[1].trim().split('|');

            console.log(expressions)

            const firstChar = expressions[0][0];
            if (firstChar === variable || firstChar === "'" + variable + "'") {

                let newProduction = variable + simbolo + ' ' + expressions[expressions.length - 1] + variable + prima;
                newLines.push(newProduction);

                newProduction = variable + prima + simbolo + ' '

                for (let index = 0; index < expressions.length - 1; index++) {
                    newProduction += expressions[index].substring(variable.length) + variable + prima + ' |';
                }

                newProduction += ' \'e\'';
                newLines.push(newProduction);
            } else {
                newLines.push(line);
            }
        }
    });

    return newLines.join('\n');
}

function separateVariablesAndTerminals() {
    let vectorsContainerNoRecursion = document.getElementById('vectors-container-no-recursion');

    if (!vectorsContainerNoRecursion) {
        vectorsContainerNoRecursion = document.createElement('div');
        vectorsContainerNoRecursion.id = 'vectors-container-no-recursion';
    } else {
        vectorsContainerNoRecursion.innerHTML = '';
    }

    const fileContentNoRecursion = document.getElementById('file-text-no-recursion');
    const fileContentText = fileContentNoRecursion.textContent.trim();

    const lines = fileContentText.split('\n');
    // Arrays para almacenar variables y terminales
    let variables = [];
    let terminals = [];

    const variableRegex = /[A-Z][a-z]*/;

    lines.forEach((line) => {
        const parts = line.trim().split(simbolo);
        if (parts.length === 2) {
            const variable = parts[0].trim();
            const expressions = parts[1].trim().split('|');

            if (!variables.includes(variable)) {
                variables.push(variable);
            }

            expressions.forEach((exp) => {
                const symbols = exp.trim().split("'");

                symbols.forEach((symbol) => {
                    const trimmedSymbol = symbol.trim();

                    if (trimmedSymbol && !variableRegex.test(trimmedSymbol) && !terminals.includes(trimmedSymbol)) {
                        terminals.push(trimmedSymbol);
                    }
                });
            });
        }
    });

    const titulo = document.createElement('h4');
      titulo.textContent = 'Variables y Terminales';
      // Obtener el elemento contenedor
      const contenedor = document.getElementById('vectors-container-no-recursion');
      // Añadir el título al contenedor
      contenedor.appendChild(titulo);
      // Crear y añadir los vectores al contenedor
      const maxLength = Math.max(variables.length, terminals.length);
      for (let i = 0; i < maxLength; i++) {
        const variable = variables[i] || '';
        const terminal = terminals[i] || '';

        const vectorRow = document.createElement('div');
        vectorRow.className = 'vector-container';

        const variableItem = document.createElement('div');
        variableItem.className = 'vector-item';
        variableItem.textContent = variable;

        const terminalItem = document.createElement('div');
        terminalItem.className = 'vector-item';
        terminalItem.textContent = terminal;

        vectorRow.appendChild(variableItem);
        vectorRow.appendChild(terminalItem);
        contenedor.appendChild(vectorRow);
      }
}