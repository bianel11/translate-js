import words from "./constants.js";
import { randomHash } from './utils.js';
import Chiffon from './chiffon.js'
const textbox = document.getElementById("textbox");
const textboxPhp = document.getElementById("textbox-php");
const textIntermedio = document.getElementById('textbox-intermedio');
let result = [];
let errorList = [];
const table = document.getElementById("table");
const tableSyntax = document.getElementById("table-syntax");
const tableSemantic = document.getElementById("table-semantic");
// var Chiffon = require('chiffon');
let isCorrect = true;


document.querySelector("#submmit").addEventListener("click", analize);
document.getElementById('button-ejecutar').addEventListener('click', callServer);

function resetAll() {
  result = [];
  errorList = [];
  table.innerHTML = `<thead class="animate__animated animate__fadeInUp">
                        <tr>
                        <th>Token</th>
                        <th>Lexema</th>
                        <th>Scope</th>
                        <th>Padre</th>
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
            textboxPhp.value = '';
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
  let tempString = "";
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
     
      if(text.split('"').length === 3) {
          result.push({
            text: text.replace(";", ""),
            type: "String",
          });
          result.push({
            text: ";",
            type: "Fin linea",
          });
      }

      else if(!tempString && text.includes('"')) {
        tempString+= text;
      }
      else if(tempString && !text.includes('"')) {
        tempString = " " + text;

      }

      else if(tempString && text.includes('"')){
        if(text.includes(';')) {
          tempString+= " " + text.replace(";", "");
          result.push({
            text: tempString,
            type: "String",
          });
          result.push({
            text: ";",
            type: "Fin linea",
          });
        }else {

          result.push({
            text: tempString,
            type: "String",
          });
        }
        tempString = '';
      }

    else if (
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
  

  parse(result);
}

// Syntax analyzer
function parse(result) {
  try {
    Chiffon.parse(textbox.value); // Verificamos que el código sea valido
  } catch (error) {
    isCorrect = false; // Si no es valido activamos los demás verificadores
  }
  
  // Validamos los indenfificadores
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

  // Validamos el conteo de parentesis y llaves
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

  document.getElementById('errorCount').innerText = 0;
  if (errorList.length && !isCorrect) { //mapeamos los erores si hay errores y el codigo no es valido
    document.getElementById('errorCount').innerText = errorList.length;
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
function scopeMapping(result) { // mapeamos el scope para verificar despues si hay declaraciones duplicadas
  let scope = '';
  let scopesList = [];
  result.map((element, pos) => {
    if(!element.scope) {
      element.scope = scope || 'GLOBAL';
    }
    if(element.type === "LlaveIzq"){
      let saltos = 0;
      scope = randomHash();
      element.scope = scope;
      scopesList.push(scope)
      for (let index = pos + 1; index < result.length; index++) {
        result[index].scope = scope;
        result[index].unique = randomHash();
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

// funcion para buscar asignaciones en scope superiores 
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
    const pos = result.findIndex(y => y.scope === x.scope && y.unique === x.unique);
    // console.log(result[pos -1])

    if(scope[x.text] && result[pos - 1].type === "Declaración") {
      console.log(scope , result[pos - 1])
      errorList.push(
        `Error ${x.text} está siendo redeclarada en el mismo scope`
      );
    }

    else if(result[pos - 1]?.type === "Declaración") {
      // console.log(x.text)
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
          `Error ${element.text} no está declarada 1`
        );
       };
      }
      else { 
        if(element.text !== '[' && !Array.from(element.text).findIndex(x => x === "[")) {
          errorList.push(
            `Error ${element.text} no está declarada 2`
            );
          }
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

  document.getElementById('errorCountSemantic').innerText = 0;
  if(errorList.length && !isCorrect) { // mapeamos los errores si hay errores y el codigo no es valido
    document.getElementById('errorCountSemantic').innerText = errorList.length;
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
  console.table(result)
  textIntermedio.value = JSON.stringify(result, null, 4);

// Recoremos el resultado y lo agregamos en la tabla
result.forEach((word, i) => {
  const row = document.createElement("tr");
  const token = document.createElement("td");
  const lexema = document.createElement("td");
  const scope = document.createElement("td");
  const number = document.createElement("td");
  const padre = document.createElement("td");
  
  token.classList.add("animate__animated");
  token.classList.add("animate__fadeInUp");
  lexema.classList.add("animate__animated");
  lexema.classList.add("animate__fadeInUp");
  number.classList.add("animate__animated");
  number.classList.add("animate__fadeInUp");
  
  scope.classList.add("animate__animated");
  scope.classList.add("animate__fadeInUp");
  padre.classList.add("animate__animated");
  padre.classList.add("animate__fadeInUp");
  

  token.innerText = word.type;
  lexema.innerText = word.text;
  number.innerText = i + 1;
  scope.innerText = word.scope;
  padre.innerText = word.father || "";

  row.appendChild(token);
  row.appendChild(lexema);
  row.appendChild(scope);
  row.appendChild(padre);
  row.appendChild(number);
  table.appendChild(row);
});
  // alert("pepe");
  translate(result);
  // printOnTablePHP(result);
}



// translate function: llama al server pasandole el código para traducirlo
async function translate(code) {
  try {
   const req = await fetch("/to-php", {method: "POST", body: JSON.stringify({code: textbox.value}),  headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },});
    const {result} = await req.json(); 

    textboxPhp.value = result;

  } catch (error) {
    console.log()
  } 

}

async function callServer() { // llama al server para escribir el .php y abrirlo en una nueva ventana
  try {
    let code = textboxPhp.value;
     await fetch("/write-php", {method: "POST", body: JSON.stringify({code, or: textbox.value}),  headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },});
    window.open('http://localhost:3001/', '__blank')
  } catch (error) {
    console.log(error)
  }
}