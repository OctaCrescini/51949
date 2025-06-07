import antlr4 from "antlr4";
import fs from "fs";
import SwitchLexer from "./generated/SwitchLexer.js";
import SwitchParser from "./generated/SwitchParser.js";
import SwitchVisitor from "./generated/SwitchVisitor.js";

// Leer entrada
const input = fs.readFileSync("input.txt", "utf8");

// Crear input stream
const chars = new antlr4.InputStream(input);
const lexer = new SwitchLexer(chars);
const tokens = new antlr4.CommonTokenStream(lexer);

try {
  // Intentar crear el parser y el árbol de derivación
  const parser = new SwitchParser(tokens);
  parser.buildParseTrees = true;
  // Capturar errores de sintaxis del parser
  let syntaxError = false;
  let syntaxErrorMsg = "";
  parser.removeErrorListeners();
  parser.addErrorListener({
    syntaxError: function (recognizer, offendingSymbol, line, column, msg) {
      syntaxError = true;
      syntaxErrorMsg = `line ${line}:${column} ${msg}`;
    },
  });
  const tree = parser.program();

  // Si hubo error de sintaxis, lanzar y terminar
  if (syntaxError) {
    throw new Error(syntaxErrorMsg);
  }

  // Verificar si hay tokens sobrantes después del parseo (entrada inválida)
  tokens.fill();
  if (parser._input.LA(1) !== antlr4.Token.EOF) {
    throw new Error(
      "Error de sintaxis: hay tokens extra después del final del programa (posible doble punto y coma o entrada inválida)."
    );
  }

  // Si todo está bien, mostrar mensaje de entrada válida
  console.log("Entrada válida.\n");

  // Mostrar tabla de tokens
  console.log("Tabla de Tokens:\n");
  console.log("+----------------------+-------------------+");
  console.log("|        Token         |      Lexema       |");
  console.log("+----------------------+-------------------+");

  tokens.tokens.forEach((token) => {
    const type = token.type;
    const symbolicName =
      SwitchParser.symbolicNames?.[type] ||
      SwitchLexer.symbolicNames?.[type] ||
      token.text;
    if (symbolicName !== "EOF") {
      console.log(`| ${symbolicName.padEnd(20)} | ${token.text.padEnd(17)} |`);
    }
  });

  console.log("+----------------------+-------------------+\n");

  // Mostrar árbol de derivación
  console.log("Árbol de Derivación:\n");
  console.log(tree.toStringTree(parser.ruleNames) + "\n");

  // VISITOR personalizado
  class CustomVisitor extends SwitchVisitor {
    constructor() {
      super();
      this.output = "";
    }

    visitProgram(ctx) {
      for (let stmt of ctx.statement()) {
        this.output += this.visit(stmt);
      }
      return this.output;
    }

    visitAssignmentStatement(ctx) {
      const idNode = ctx.Identifier();
      if (!idNode) {
        throw new Error(
          "Error de sintaxis: se esperaba un identificador antes del '=' en la asignación."
        );
      }
      const id = idNode.getText();
      const value = this.visit(ctx.expression());
      return `let ${id} = ${value};\n`;
    }

    visitConsoleStatement(ctx) {
      const content = this.visit(ctx.expression());
      return `console.log(${content});\n`;
    }

    visitSwitchStatement(ctx) {
      const expression = this.visit(ctx.expression());
      let result = `switch(${expression}) {\n`;
      ctx.caseClause().forEach((cc) => (result += this.visit(cc)));
      if (ctx.defaultClause()) result += this.visit(ctx.defaultClause());
      result += "}\n";
      return result;
    }

    visitCaseClause(ctx) {
      const value = this.visit(ctx.expression());
      const stmt = this.visit(ctx.statement());
      return `case ${value}:\n${stmt}break;\n`;
    }

    visitDefaultClause(ctx) {
      const stmt = this.visit(ctx.statement());
      return `default:\n${stmt}break;\n`;
    }

    visitExpression(ctx) {
      if (ctx.getChildCount() === 3) {
        const left = this.visit(ctx.getChild(0));
        const op = ctx.getChild(1).getText();
        const right = this.visit(ctx.getChild(2));
        return `${left} ${op} ${right}`;
      } else {
        return this.visit(ctx.getChild(0));
      }
    }

    visitTerm(ctx) {
      // Identificador
      if (ctx.Identifier && typeof ctx.Identifier === "function") {
        const id = ctx.Identifier();
        if (id) return id.getText();
      }
      // Número
      if (ctx.Number && typeof ctx.Number === "function") {
        const num = ctx.Number();
        if (num) return num.getText();
      }
      // String
      if (ctx.StringLiteral && typeof ctx.StringLiteral === "function") {
        const str = ctx.StringLiteral();
        if (str) return str.getText();
      }
      // Paréntesis
      if (ctx.expression && typeof ctx.expression === "function") {
        const expr = ctx.expression();
        if (expr) return `(${this.visit(expr)})`;
      }
      // Si no es ninguno de los anteriores, error sintáctico claro
      throw new Error(
        "Error de sintaxis en término: se esperaba un identificador, número, string o expresión entre paréntesis."
      );
    }

    visitChildren(ctx) {
      return ctx.children?.map((child) => this.visit(child)).join("") || "";
    }
  }

  const visitor = new CustomVisitor();
  const jsCode = visitor.visit(tree);

  // Mostrar código generado limpio
  console.log("Código JavaScript generado:\n");
  console.log(jsCode);

  // Ejecutar código
  console.log("Resultado de la ejecución:\n");
  eval(jsCode);
} catch (err) {
  // Mostrar solo el error y no ejecutar nada más
  console.error("Error de sintaxis:\n" + err.message);
  process.exit(1);
}
