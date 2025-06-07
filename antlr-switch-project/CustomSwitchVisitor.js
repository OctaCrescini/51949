import SwitchVisitor from "./generated/SwitchVisitor.js";

export default class CustomVisitor extends SwitchVisitor {
  constructor() {
    super();
    this.variables = {};
    this.output = [];
  }

  visitProgram(ctx) {
    return ctx
      .statement()
      .map((s) => this.visit(s))
      .join("\n");
  }

  visitAssignmentStatement(ctx) {
    // Validar que haya un identificador y una expresión
    if (!ctx.Identifier() || !ctx.expression()) {
      throw new Error(
        "Error de sintaxis en la asignación: se esperaba 'identificador = expresión;'"
      );
    }
    const id = ctx.Identifier().getText();
    const value = this.visit(ctx.expression());
    this.variables[id] = value;
    return `let ${id} = ${value};`;
  }

  visitConsoleStatement(ctx) {
    const value = this.visit(ctx.expression());
    return `console.log(${value});`;
  }

  visitSwitchStatement(ctx) {
    const expression = this.visit(ctx.expression());
    let code = `switch(${expression}) {\n`;
    ctx.caseClause().forEach((caseNode) => {
      code += this.visit(caseNode);
    });
    if (ctx.defaultClause()) {
      code += this.visit(ctx.defaultClause());
    }
    code += "}\n";
    return code;
  }

  visitCaseClause(ctx) {
    const expr = this.visit(ctx.expression());
    const body = ctx
      .statement()
      .map((s) => this.visit(s))
      .join("\n");
    // No break automático, pero si el usuario pone break; en el input, se respeta
    return `case ${expr}:\n${body}`;
  }

  visitDefaultClause(ctx) {
    const body = ctx
      .statement()
      .map((s) => this.visit(s))
      .join("\n");
    // No break automático
    return `default:\n${body}`;
  }

  visitExpression(ctx) {
    const terms = ctx.term().map((t) => this.visit(t));
    const ops = ctx.children.filter(
      (c) => c.getText() === "+" || c.getText() === "-"
    );
    let expr = terms[0];
    for (let i = 0; i < ops.length; i++) {
      expr += ` ${ops[i].getText()} ${terms[i + 1]}`;
    }
    return expr;
  }

  visitTerm(ctx) {
    if (ctx.Identifier()) return ctx.Identifier().getText();
    if (ctx.Number()) return ctx.Number().getText();
    if (ctx.StringLiteral()) return ctx.StringLiteral().getText();
    if (ctx.expression()) return `(${this.visit(ctx.expression())})`;
  }
}
