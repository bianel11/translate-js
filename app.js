import words from "./constants.js";

const textbox = document.getElementById("textbox");
const textboxPhp = document.getElementById("textbox-php");
let result = [];
let errorList = [];
const table = document.getElementById("table");
const tableSyntax = document.getElementById("table-syntax");
const tableSemantic = document.getElementById("table-semantic")
;
document.querySelector("#submmit").addEventListener("click", analize);

function resetAll() {
  result = [];
  errorList = [];
  table.innerHTML = `<thead class="animate__animated animate__fadeInUp">
                        <tr>
                        <th>Token</th>
                        <th>Lexema</th>
                        <th>#</th>
                        </tr>
                    </thead>
                    <tbody id="table-body">
                    </tbody>`;
  tableSyntax.innerHTML = `<thead class="animate__animated animate__fadeInUp">
                    <tr>
                    <th>Mensaje</th>
                    <th>Posicion</th>
                    <th>#</th>
                    </tr>
                </thead>
                <tbody id="table-body">
                </tbody>`;
tableSemantic.innerHTML = `<thead class="animate__animated animate__fadeInUp">
                <tr>
                <th>Mensaje</th>
                <th>#</th>
                </tr>
            </thead>
            <tbody id="table-body">
            </tbody>`;
}

// Lexical analyzer
function analize() {
  const text = textbox.value;
  if (!text) return;
  resetAll();

  // Removemos todos los saltos de linea y dividimos el texto en palabras
  const formattedText = text
    .replace(/(\r\n|\n|\r)/gm, " ") /* Removemos saltos de linea */
    .split(" ") /* Dividemos el texto en palabras */
    .filter((word) => word !== ""); /* Filtramos los espacios en blanco */

  // Recorremos el texto
  for (let i = 0; i < formattedText.length; i++) {
    const text = formattedText[i];

    // Comprobamos si es una palabra reservada
    if (words.reservedWords.includes(text)) {
      result.push({
        text: text,
        type: "Reservada",
      });
    }
    // Comprobamos si es un operador
    else if (words.operators.includes(text)) {
      result.push({
        text: text,
        type: "Operador",
      });
    }

    // Comprobamos si es una comparacion
    else if (words.comparations.includes(text)) {
      result.push({
        text: text,
        type: "Comparación/igualación",
      });
    }
    // Comprobamos si es una declaracion de funcion
    else if(words.functions.includes(text)) {
      result.push({
        text,
        type: "Función"
      })
    }

    // Comprobamos si es una declaracion
    else if (words.declarations.includes(text)) {
      result.push({
        text: text,
        type: "Declaración",
      });

      // comprobamos si es un numero
    } else if (words.numbers.test(text)) {
      result.push({
        text: text,
        type: "Número",
      });
    } else {
      const { endline, parenthesesL, parenthesesR, keysL, keysR } = words.separators;
      let sub = "";
      const types = {
        [endline]: "Fin linea",
        [parenthesesL]: "ParentesisIq",
        [parenthesesR]: "ParentesisDer",
        [keysL]: "LlaveIzq",
        [keysR]: "LlaveDer",
      };

      if (
        text.includes(endline) ||
        text.includes(parenthesesL) ||
        text.includes(parenthesesR) || 
        text.includes(keysL) ||
        text.includes(keysR)
      ) {
        Array.from(text).forEach((el) => {
          if ([endline, parenthesesL, parenthesesR, keysL, keysR].includes(el)) {
            if (sub) {
              if (words.numbers.test(text) && isNaN(text)) {
                result.push({
                  text: sub,
                  type: "Número",
                });
              } else {
                if(isNaN(sub)){
                  result.push({
                    text: sub,
                    type: Array.from(sub).includes('"') ? "String" : "Identificador",
                  });
                } else {
                  result.push({
                    text: sub,
                    type: "Número",
                  });
                }
              }
            }

            result.push({
              text: el,
              type: types[el],
            });
            sub = "";
          } else {
            sub += el;
            // console.log(sub);
          }
        });
      } else {
        result.push({
          text: text,
          type: "Identificador",
        });
      }
    }
  }
  // Recoremos el resultado y lo agregamos en la tabla
  result.forEach((word, i) => {
    const row = document.createElement("tr");
    const token = document.createElement("td");
    const lexema = document.createElement("td");
    const number = document.createElement("td");

    token.classList.add("animate__animated");
    token.classList.add("animate__fadeInUp");
    lexema.classList.add("animate__animated");
    lexema.classList.add("animate__fadeInUp");
    number.classList.add("animate__animated");
    number.classList.add("animate__fadeInUp");

    token.innerText = word.type;
    lexema.innerText = word.text;
    number.innerText = i + 1;
    row.appendChild(token);
    row.appendChild(lexema);
    row.appendChild(number);
    table.appendChild(row);
  });

  parse(result);
}

// Syntax analyzer
function parse(result) {
  result.forEach((element, pos) => {
    switch (element.type) {
      case "Declaración":
        if (result[pos + 1].type !== "Identificador") {
          errorList.push({
            message: "Se esperaba un identificador",
            pos: pos + 1,
          });
        }
        break;
      case "Comparación/igualación":
        if (
          !["Identificador", "Número", "String"].includes(result[pos + 1]?.type) ||
          !["Identificador", "Número", "String"].includes(result[pos - 1]?.type)
        ) {
          errorList.push({
            message: "Se esperaba un identificador o un número",
            pos,
          });
        }
        break;
      case "Función":
        if (result[pos + 1]?.type !== "Identificador") {
          errorList.push({
            message: "Se esperaba un indentificador en la declaracion de la funcion",
            pos: pos + 1,
          });
        }
        break;
      case "Fin linea":
        if (result[pos - 1]?.type === "Fin linea") {
          errorList.push({
            message: "Error de sintaxis ;",
            pos,
          });
        }
        break;
    }
  });

  const parentesisIz = result.filter((el) => el.type === "ParentesisIq");
  const parentesisDer = result.filter((el) => el.type === "ParentesisDer");
  const llaveIz = result.filter((el) => el.type === "LlaveIzq");
  const llaveDer = result.filter((el) => el.type === "LlaveDer");

  if (parentesisIz.length !== parentesisDer.length) {
    errorList.push({
      message: "Se esperaba un parentesis de cierre",
    });
  }

  if (llaveIz.length !== llaveDer.length) {
    errorList.push({
      message: "Se esperaba una llave de cierre",
    });
  }

  document.getElementById('errorCount').innerText = errorList.length;
  if (errorList.length) {
    errorList.forEach((word, i) => {
      const row = document.createElement("tr");
      const message = document.createElement("td");
      const pos = document.createElement("td");
      const number = document.createElement("td");

      message.classList.add("animate__animated");
      message.classList.add("animate__fadeInUp");
      pos.classList.add("animate__animated");
      pos.classList.add("animate__fadeInUp");
      number.classList.add("animate__animated");
      number.classList.add("animate__fadeInUp");
      message.innerText = word.message;
      pos.innerText = word.pos || "No especificado";
      number.innerText = i + 1;
      row.appendChild(message);
      row.appendChild(pos);
      row.appendChild(number);
      tableSyntax.appendChild(row);
    });
  }
  scopeMapping(result)
}
// Scope mapping
function scopeMapping(result) {
  let scope = '';
  let scopesList = [];
  result.map((element, pos) => {
    if(!element.scope) {
      element.scope = scope || 'GLOBAL';
    }
    if(element.type === "LlaveIzq"){
      let saltos = 0;
      scope = (Math.random() + 1).toString(36).substring(7);
      element.scope = scope;
      scopesList.push(scope)
      for (let index = pos + 1; index < result.length; index++) {
        result[index].scope = scope;
        result[index].profundidad = result[index].profundidad || saltos;
        result[index].father =  result[index].type === "LlaveIzq"  ?  scopesList[result[index].profundidad] : scopesList[result[index].profundidad - 1]  || "GLOBAL";
        if(result[index].type === "LlaveIzq") {
          saltos++;
        }
        
        else if(result[index].type === "LlaveDer" && saltos > 0) {
          saltos--;
        }

        else if(result[index].type === "LlaveDer" && saltos === 0) {
          scope = ""; 
          break;
        }
      }
    }
  })
   
  semanticAnalizer(result)
}

function buscarVariableScope(nombre =  '', scope = '', result = []) {
  const exits  = result.find(x => x.scope === scope && x.text === nombre && x.type === 'Identificador');
  const variables = result.filter(x => x.scope === scope && x.type === 'Identificador');
  const hasFather = variables[0].father;

  if(exits) {
    return true;
  }

  else if(hasFather) {
    return buscarVariableScope(nombre, hasFather, result)
  }

  else {
    return false;
  }
}

// Semantic analizer
function semanticAnalizer(result) {
  const errorList = [];
  const items = {};
  
  // Buscar redeclaraciones
  result.filter(x => x.type === 'Identificador').forEach(x => {
    const scope = items[x.scope] || {};
    if(scope[x.text]) {
      errorList.push(
        `Error ${x.text} está siendo redeclarada en el mismo scope`
      );
    }else {
      items[x.scope] = {
        ...items[x.scope],
        [x.text]: x.text
      }
    }
  });


  // Buscar declaracioens anteriores
  result.forEach((element, pos) => {
    if(result[pos - 1]?.type === "Comparación/igualación" && result[pos].type === "Identificador" && isNaN( result[pos].text)) {
      const variablesDelScope = result.filter(el => el.scope === element.scope && el.type === "Identificador") 
      const posicionActual = variablesDelScope.findIndex(x => x.text === element.text);
      const variablesAnterioresDelScope = variablesDelScope.slice(0, posicionActual - 1);
      
      if(variablesAnterioresDelScope.find(x => x.text === element.text)) {
        return;
      } 
      else if(element.father) {
       if(!buscarVariableScope(element.text, element.father, result)){
        errorList.push(
          `Error ${element.text} no está declarada`
        );
       };
      }
      else { 
      errorList.push(
        `Error ${element.text} no está declarada`
      );
      }
    }
  });  

  // asignar valores a variables 
  result =  result.map((element, pos) => {
    if(element.type === "Identificador" && result[pos + 1]?.type === "Comparación/igualación") {
      // evaluar valor 
      element.valores = []
      for (let index = pos + 2; index < result.length; index++) {
        if(result[index].type === 'Fin linea') {
          break;
        }else {
          // console.log(result[index])
          element.valores.push(result[index].value || result[index].text)
        }
      }
      element.value = element.valores.toString().replaceAll(",", " ");
    }
    else if(element.type === "Identificador" && result[pos - 1]?.type === "Función") {
      element.type = "Indentificador_de_función";
    }
    return element;
  }) 

  document.getElementById('errorCountSemantic').innerText = errorList.length;
  if(errorList.length) {
    errorList.forEach((word, i) => {
      const row = document.createElement("tr");
      const msg = document.createElement("td");
      const number = document.createElement("td");
  
      msg.classList.add("animate__animated");
      msg.classList.add("animate__fadeInUp");
      number.classList.add("animate__animated");
      number.classList.add("animate__fadeInUp");
  
      msg.innerText = word;
      number.innerText = i + 1; 
      row.appendChild(msg);
      row.appendChild(number);
      tableSemantic.appendChild(row);
    });
  }

  result = translate(result)
  printOnTablePHP(result);
}



// translate function
function translate(result) {
  // remove var, let and const 
  result = result.filter(x => !['var', 'let', 'const'].includes(x.text))
  
  // change variables declaration
  result = result.map(x => {
    if(x.type === 'Identificador' && x.text === "console.log") {
      x.text = "echo";
    }else if(x.type === 'Identificador') {
      x.text = "$" + x.text
    }
    return x;
  })

  return result;
}

function printOnTablePHP(result) {
  console.table(result)
  let spaces = [];
  let data = '<?php \n';
  
  result.forEach((x, po) => {
    data+= x.text;

    if(!["ParentesisIq", "ParentesisDer"].includes(x.type)){
      if(x.type === "LlaveIzq") {
        spaces.push(" ")
        data+= "\n" + spaces.toString().replaceAll(",", ""); 
      }
     else if(x.type === "LlaveDer") {
       spaces.pop()
        data+= "\n" + spaces.toString().replaceAll(",", ""); 
      }
      else if(x.type === "Fin linea") {
        data+= "\n" + spaces.toString().replaceAll(",", "");
      }else {
        if(result[po + 1].type !== "Fin linea") data+= " ";
      }
    }
  })

  data+= "\n ?>"
  
  textboxPhp.value = data;
}