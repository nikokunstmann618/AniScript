// generator.js – Walks the AniScript AST and emits JavaScript source code.

export default function generate(node) {
  return generators[node.kind](node)
}

function indent(code) {
  return code
    .split("\n")
    .map(line => `  ${line}`)
    .join("\n")
}

function generateClass(d) {
  const ext = d.parentName ? ` extends ${d.parentName}` : "";
  const awakenMethod = d.methods.find(m => m.name === "awaken");
  let constructorCode = "";
  if (awakenMethod) {
    const params = awakenMethod.paramNames.join(", ");
    if (d.parentName) {
      // Call super first, then this.awaken
      constructorCode = `constructor(${params}) {\n  super(${params});\n  this.awaken(${params});\n}\n\n`;
    } else {
      constructorCode = `constructor(${params}) {\n  this.awaken(${params});\n}\n\n`;
    }
  } else if (d.parentName) {
    constructorCode = `constructor(...args) {\n  super(...args);\n}\n\n`;
  }
  // Keep all methods, including awaken
  const methods = d.methods.map(generate).join("\n\n");
  return `class ${d.name}${ext} {\n${indent(constructorCode + methods)}\n}`;
}

const generators = {
  Program(p) {
    return p.statements.map(generate).join("\n")
  },

  CreationStatement(s) {
    return `console.log(${generate(s.expression)})`
  },

  JutsuStatement(s) {
    return `let ${s.name} = ${generate(s.initializer)}`
  },

  AssignStatement(s) {
    const target = typeof s.target === "string" ? s.target : generate(s.target)
    return `${target} = ${generate(s.source)}`
  },

  GeassStatement(s) {
    const test = generate(s.test)
    const body = s.consequent.map(generate).join("\n")
    let result = `if (${test}) {\n${indent(body)}\n}`
    if (s.alternate?.kind === "CounterClause") {
      const elseBody = s.alternate.body.map(generate).join("\n")
      result += ` else {\n${indent(elseBody)}\n}`
    } else if (Array.isArray(s.alternate) && s.alternate.length > 0) {
      const elseBody = s.alternate.map(generate).join("\n")
      result += ` else {\n${indent(elseBody)}\n}`
    }
    return result
  },

  CounterClause(s) {
    const body = s.body.map(generate).join("\n")
    return `else {\n${indent(body)}\n}`
  },

  TsukuyomiStatement(s) {
    const test = generate(s.test)
    const body = s.body.map(generate).join("\n")
    return `while (${test}) {\n${indent(body)}\n}`
  },

  WorldDeclaration: generateClass,
  CharacterDeclaration: generateClass,
  MoveDeclaration: generateClass,

  MethodDefinition(m) {
    const params = m.paramNames.join(", ")
    const body = m.body.map(generate).join("\n")
    return `${m.name}(${params}) {\n${indent(body)}\n}`
  },

  ThisFieldSetStatement(s) {
    return `this.${s.field} = ${generate(s.value)}`
  },

  ObjFieldSetStatement(s) {
    const obj = typeof s.object === "string" ? s.object : generate(s.object)
    return `${obj}.${s.field} = ${generate(s.value)}`
  },

  ExprStatement(s) {
    const receiver = typeof s.receiver === "string" ? s.receiver : generate(s.receiver)
    const args = s.args.map(generate).join(", ")
    return `${receiver}.${s.method}(${args})`
  },

  ChannelStatement(s) {
    const args = s.args.map(generate).join(", ")
    return `super(${args})`
  },

  ReturnStatement(s) {
    return `return ${generate(s.value)}`
  },

  BinaryExpression(e) {
    return `(${generate(e.left)} ${e.op} ${generate(e.right)})`
  },

  UnaryExpression(e) {
    return `${e.op}(${generate(e.operand)})`
  },

  MethodCallExpression(e) {
    const args = e.args.map(generate).join(", ")
    return `${generate(e.receiver)}.${e.method}(${args})`
  },

  MemberAccessExpression(e) {
    return `${generate(e.object)}.${e.field}`
  },

  SummonExpression(e) {
    const args = e.args.map(generate).join(", ")
    return `new ${e.className}(${args})`;
  },

  ThisExpression() {
    return "this"
  },

  Identifier(i) {
    return i.name
  },

  NumericLiteral(n) {
    return String(n.value)
  },

  StringLiteral(s) {
    return JSON.stringify(s.value)
  },

  TruthLiteral() {
    return "true"
  },

  IllusionLiteral() {
    return "false"
  },
}