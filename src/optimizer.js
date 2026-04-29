// optimizer.js – Machine-independent optimizations for Aniscript AST

import * as core from "./core.js"

export default function optimize(node) {
  return optimizers?.[node.kind]?.(node) ?? node
}

// Helper to check if a node is a literal number or boolean
const isLiteralNumber = (n) => n?.kind === "NumericLiteral"
const getLiteralValue = (n) => {
  if (n?.kind === "NumericLiteral") return n.value
  if (n?.kind === "TruthLiteral") return true
  if (n?.kind === "IllusionLiteral") return false
  return undefined
}


const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize).filter(Boolean)
    return p
  },

  // --- Statements -------------------------------------------------
  CreationStatement(s) {
    s.expression = optimize(s.expression)
    return s
  },

  JutsuStatement(s) {
    s.initializer = optimize(s.initializer)
    return s
  },

  AssignStatement(s) {
  s.source = optimize(s.source)
  const targetName = typeof s.target === "string" ? s.target : s.target.name
  const sourceName = s.source?.kind === "Identifier" ? s.source.name : null
  if (targetName && targetName === sourceName) return []
  return s
},

  GeassStatement(s) {
    s.test = optimize(s.test)
    s.consequent = s.consequent.flatMap(optimize)
    if (s.alternate?.kind === "CounterClause") {
      s.alternate.body = s.alternate.body.flatMap(optimize)
    } else {
      s.alternate = s.alternate?.flatMap?.(optimize) ?? []
    }
    const testVal = getLiteralValue(s.test)
    if (testVal !== undefined) {
      if (testVal) return s.consequent
      return s.alternate?.kind === "CounterClause" ? s.alternate.body : s.alternate
    }
    return s
  },

  TsukuyomiStatement(s) {
    s.test = optimize(s.test)
    if (getLiteralValue(s.test) === false) {
      return [] // while false is never entered
    }
    s.body = s.body.flatMap(optimize)
    return s
  },

  // --- Class declarations -----------------------------------------
  WorldDeclaration(d) {
    d.methods = d.methods.map(optimize)
    return d
  },
  CharacterDeclaration(d) {
    d.methods = d.methods.map(optimize)
    return d
  },
  MoveDeclaration(d) {
    d.methods = d.methods.map(optimize)
    return d
  },
  MethodDefinition(m) {
    m.body = m.body.flatMap(optimize)
    return m
  },

  // --- OOP statements ---------------------------------------------
  ThisFieldSetStatement(s) {
    s.value = optimize(s.value)
    return s
  },
  ObjFieldSetStatement(s) {
    s.object = optimize(s.object)
    s.value = optimize(s.value)
    return s
  },
  ExprStatement(s) {
    s.receiver = optimize(s.receiver)
    s.args = s.args.map(optimize)
    return s
  },
  ChannelStatement(s) {
    s.args = s.args.map(optimize)
    return s
  },
  ReturnStatement(s) {
    s.value = optimize(s.value)
    return s
  },

  // --- Expressions ------------------------------------------------
  BinaryExpression(e) {
    e.left = optimize(e.left)
    e.right = optimize(e.right)

    const leftVal = getLiteralValue(e.left)
    const rightVal = getLiteralValue(e.right)

    // Constant folding for numbers and booleans
    if (leftVal !== undefined && rightVal !== undefined) {
      switch (e.op) {
        case "+": return core.numericLiteral(leftVal + rightVal)
        case "-": return core.numericLiteral(leftVal - rightVal)
        case "*": return core.numericLiteral(leftVal * rightVal)
        case "/": return core.numericLiteral(leftVal / rightVal)
        case "%": return core.numericLiteral(leftVal % rightVal)
        case "**": return core.numericLiteral(leftVal ** rightVal)
        case "<": return core[ leftVal < rightVal ? "truthLiteral" : "illusionLiteral" ]()
        case "<=": return core[ leftVal <= rightVal ? "truthLiteral" : "illusionLiteral" ]()
        case ">": return core[ leftVal > rightVal ? "truthLiteral" : "illusionLiteral" ]()
        case ">=": return core[ leftVal >= rightVal ? "truthLiteral" : "illusionLiteral" ]()
        case "==": return core[ leftVal === rightVal ? "truthLiteral" : "illusionLiteral" ]()
        case "!=": return core[ leftVal !== rightVal ? "truthLiteral" : "illusionLiteral" ]()
      }
    }

    // Strength reductions
    if (isLiteralNumber(e.left)) {
      const lv = e.left.value
      if (lv === 0) {
        if (e.op === "+") return e.right
        if (e.op === "-") return core.unaryExpression("-", e.right)
        if (e.op === "*") return e.left
        if (e.op === "/") return e.left
      }
      if (lv === 1 && e.op === "*") return e.right
      if (lv === 1 && e.op === "**") return e.left
    }
    if (isLiteralNumber(e.right)) {
      const rv = e.right.value
      if (rv === 0 && (e.op === "+" || e.op === "-")) return e.left
      if (rv === 1 && (e.op === "*" || e.op === "/")) return e.left
      if (rv === 0 && e.op === "*") return e.right
      if (rv === 0 && e.op === "**") return core.numericLiteral(1)
    }

    // Boolean shortcuts (short-circuit style simplification)
    if (e.op === "&&") {
      if (leftVal === false) return e.left
      if (leftVal === true) return e.right
      if (rightVal === true) return e.left
    }
    if (e.op === "||") {
      if (leftVal === true) return e.left
      if (leftVal === false) return e.right
      if (rightVal === false) return e.left
    }

    return e
  },

  UnaryExpression(e) {
    e.operand = optimize(e.operand)
    const val = getLiteralValue(e.operand)
    if (val !== undefined && e.op === "-") {
      return core.numericLiteral(-val)
    }
    return e
  },

  ParenthesizedExpression(e) {
    return optimize(e.expression)
  },

  Identifier(i) {
    return i
  },

  ThisExpression(t) {
    return t
  },

  MethodCallExpression(c) {
    c.receiver = optimize(c.receiver)
    c.args = c.args.map(optimize)
    return c
  },

  MemberAccessExpression(m) {
    m.object = optimize(m.object)
    return m
  },

  SummonExpression(s) {
    s.args = s.args.map(optimize)
    return s
  },

  // --- Literals (no further optimization) ------------------------
  NumericLiteral(n) { return n },
  StringLiteral(s) { return s },
  TruthLiteral(t) { return t },
  IllusionLiteral(i) { return i },
}

export { optimizers }