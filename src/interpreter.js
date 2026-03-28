// Escape sequences supported inside string literals
const ESCAPES = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"' }

function animeError(message) {
  throw new Error(`NANI?! ${message}`)
}

function formatValue(value) {
  if (value === true) return "yatta"
  if (value === false) return "dame"
  if (value instanceof AnimeInstance) return `[${value.cls.name}]`
  return String(value)
}

// ── Lexical scope ──────────────────────────────────────────────────────────

class Scope {
  constructor(parent = null) {
    this.bindings = new Map()
    this.parent = parent
  }

  declare(name, value) {
    if (this.bindings.has(name)) {
      animeError(`Nakama '${name}' wa mou iru yo! (variable already declared in this scope)`)
    }
    this.bindings.set(name, value)
  }

  assign(name, value) {
    if (this.bindings.has(name)) {
      this.bindings.set(name, value)
      return
    }
    if (this.parent) {
      this.parent.assign(name, value)
      return
    }
    animeError(
      `Nakama '${name}' ga inai yo! Use 'nakama ${name} = ...' first. (undeclared variable)`
    )
  }

  lookup(name) {
    if (this.bindings.has(name)) return this.bindings.get(name)
    if (this.parent) return this.parent.lookup(name)
    animeError(
      `Nakama '${name}' ga inai yo! Use 'nakama ${name} = ...' first. (undeclared variable)`
    )
  }

  has(name) {
    return this.bindings.has(name) || (this.parent ? this.parent.has(name) : false)
  }
}

// ── OOP data structures ────────────────────────────────────────────────────

// Stores a class definition: its name, parent, and methods
class AnimeClass {
  constructor(name, parentName) {
    this.name = name
    this.parentName = parentName  // string or null
    this.parent = null            // resolved to AnimeClass after all classes are declared
    this.methods = new Map()      // methodName → { paramNames, bodyNode }
  }

  // Walk the class registry and link this.parent to the actual AnimeClass object
  resolve(classesMap) {
    if (this.parentName === null) return
    if (!classesMap.has(this.parentName)) {
      animeError(
        `Class '${this.name}' tries to extend '${this.parentName}', but that class doesn't exist yet`
      )
    }
    this.parent = classesMap.get(this.parentName)
  }

  // Find a method by name, walking up the inheritance chain
  findMethod(name) {
    if (this.methods.has(name)) return this.methods.get(name)
    if (this.parent) return this.parent.findMethod(name)
    return null
  }
}

// Represents a live instance of an AnimeClass
class AnimeInstance {
  constructor(cls) {
    this.cls = cls
    this.fields = new Map()
  }

  getField(name) {
    if (this.fields.has(name)) return this.fields.get(name)
    animeError(`Instance of '${this.cls.name}' has no field '${name}'`)
  }

  setField(name, value) {
    this.fields.set(name, value)
  }
}

// Thrown by kaeru statements to unwind the call stack back to callMethod
class ReturnSignal {
  constructor(value) {
    this.value = value
  }
}

// ── Main interpreter ───────────────────────────────────────────────────────

export default function interpret(match) {
  const grammar = match.matcher.grammar

  let scope = new Scope()
  const classes = new Map()    // name → AnimeClass
  let currentClass = null      // the AnimeClass whose method is currently executing

  // Execute a method on an instance, with args bound as params.
  // cls is the AnimeClass the method was found on (for channel() lookups).
  function callMethod(instance, method, argValues, cls) {
    const outerScope = scope
    const outerClass = currentClass
    scope = new Scope(outerScope)
    currentClass = cls
    scope.declare("this", instance)
    method.paramNames.forEach((name, i) => {
      scope.declare(name, argValues[i] ?? null)
    })
    try {
      for (const s of method.bodyNode.children) {
        s.interpret()
      }
      return null
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value
      throw e
    } finally {
      scope = outerScope
      currentClass = outerClass
    }
  }

  const actions = {
    // ── Program ─────────────────────────────────────────────────────────────

    Program(statements) {
      for (const stmt of statements.children) {
        stmt.interpret()
      }
    },

    // ── Existing statements ─────────────────────────────────────────────────

    ShoutStmt(_shout, _open, exp, _close) {
      console.log(formatValue(exp.interpret()))
    },

    NakamaStmt(_nakama, id, _eq, exp) {
      scope.declare(id.sourceString, exp.interpret())
    },

    AssignStmt(primary_id, _eq, exp) {
      scope.assign(primary_id.sourceString, exp.interpret())
    },

    KakugoStmt(_kakugo, exp, _open, stmts, _close, elseClause) {
      const condition = exp.interpret()
      if (typeof condition !== "boolean") {
        animeError(`Kakugo needs a yatta/dame condition, but got '${typeof condition}'`)
      }
      if (condition) {
        const outer = scope
        scope = new Scope(outer)
        try {
          for (const s of stmts.children) s.interpret()
        } finally {
          scope = outer
        }
      } else if (elseClause.children.length > 0) {
        elseClause.children[0].interpret()
      }
    },

    TatakaiStmt(_tatakai, exp, _open, stmts, _close) {
      if (typeof exp.interpret() !== "boolean") {
        animeError(`Tatakai needs a yatta/dame condition, but got '${typeof exp.interpret()}'`)
      }
      while (exp.interpret()) {
        const outer = scope
        scope = new Scope(outer)
        try {
          for (const s of stmts.children) s.interpret()
        } finally {
          scope = outer
        }
      }
    },

    MasakaClause(_masaka, _open, stmts, _close) {
      const outer = scope
      scope = new Scope(outer)
      try {
        for (const s of stmts.children) s.interpret()
      } finally {
        scope = outer
      }
    },

    // ── OOP class declarations ───────────────────────────────────────────────

    // All three tiers share the same logic via _registerClass
    WorldDecl(_kw, nameId, fromKw, parentIds, _open, members, _close) {
      _registerClass(nameId, parentIds, members)
    },

    CharacterDecl(_kw, nameId, fromKw, parentIds, _open, members, _close) {
      _registerClass(nameId, parentIds, members)
    },

    MoveDecl(_kw, nameId, fromKw, parentIds, _open, members, _close) {
      _registerClass(nameId, parentIds, members)
    },

    // MethodDef returns a method descriptor — called when registering the class
    MethodDef(nameId, _open, params, _close, _brace, stmts, _rbrace) {
      const paramNodes = params.asIteration().children
      return {
        name: nameId.sourceString,
        paramNames: paramNodes.map(p => p.sourceString),
        bodyNode: stmts,
      }
    },

    // ── OOP statements ──────────────────────────────────────────────────────

    // this.field = val
    ThisFieldSetStmt(_this, _dot, fieldId, _eq, exp) {
      const instance = scope.lookup("this")
      if (!(instance instanceof AnimeInstance)) {
        animeError("'this' is not an instance — are you outside a method?")
      }
      instance.setField(fieldId.sourceString, exp.interpret())
    },

    // obj.field = val
    ObjFieldSetStmt(objId, _dot, fieldId, _eq, exp) {
      const instance = scope.lookup(objId.sourceString)
      if (!(instance instanceof AnimeInstance)) {
        animeError(`'${objId.sourceString}' is not an instance`)
      }
      instance.setField(fieldId.sourceString, exp.interpret())
    },

    // (thisKw | id).method(args)  — method call as a statement
    ExprStmt(receiver, _dot, methodId, _open, args, _close) {
      const instance = scope.lookup(receiver.sourceString)
      if (!(instance instanceof AnimeInstance)) {
        animeError(`'${receiver.sourceString}' is not an instance`)
      }
      const method = instance.cls.findMethod(methodId.sourceString)
      if (!method) {
        animeError(`No method '${methodId.sourceString}' on '${instance.cls.name}'`)
      }
      const argValues = args.asIteration().children.map(a => a.interpret())
      callMethod(instance, method, argValues, instance.cls)
    },

    // channel(args) — call the parent's awaken constructor
    ChannelStmt(_channel, _open, args, _close) {
      if (!currentClass) {
        animeError("channel() can only be used inside a method")
      }
      const parentCls = currentClass.parent
      if (!parentCls) {
        animeError(`Class '${currentClass.name}' has no parent to channel`)
      }
      const awaken = parentCls.findMethod("awaken")
      if (!awaken) {
        animeError(`Parent class '${parentCls.name}' has no 'awaken' to channel`)
      }
      const instance = scope.lookup("this")
      const argValues = args.asIteration().children.map(a => a.interpret())
      callMethod(instance, awaken, argValues, parentCls)
    },

    // kaeru expr — return a value from a method
    ReturnStmt(_kaeru, exp) {
      throw new ReturnSignal(exp.interpret())
    },

    // ── Expressions ─────────────────────────────────────────────────────────

    Exp_binary(left, op, right) {
      const x = left.interpret()
      const y = right.interpret()
      switch (op.sourceString) {
        case "<":  return x < y
        case ">":  return x > y
        case "<=": return x <= y
        case ">=": return x >= y
        case "==": return x === y
        case "!=": return x !== y
      }
    },

    Condition_binary(left, op, right) {
      const x = left.interpret()
      const y = right.interpret()
      if (op.sourceString === "+") {
        if (typeof x === "string" || typeof y === "string") {
          return formatValue(x) + formatValue(y)
        }
        return x + y
      }
      return x - y
    },

    Term_binary(left, op, right) {
      const x = left.interpret()
      const y = right.interpret()
      switch (op.sourceString) {
        case "*": return x * y
        case "/": return x / y
        case "%": return x % y
      }
    },

    Factor_exponentiation(base, _starStar, exponent) {
      return base.interpret() ** exponent.interpret()
    },

    Factor_negation(_minus, primary) {
      return -(primary.interpret())
    },

    // ── Primary expressions ──────────────────────────────────────────────────

    Primary_parens(_open, exp, _close) {
      return exp.interpret()
    },

    Primary_id(id) {
      return scope.lookup(id.sourceString)
    },

    // obj.method(args) — method call expression
    Primary_methodCall(primary, _dot, methodId, _open, args, _close) {
      const instance = primary.interpret()
      if (!(instance instanceof AnimeInstance)) {
        animeError(
          `Cannot call method '${methodId.sourceString}' on a non-instance value`
        )
      }
      const method = instance.cls.findMethod(methodId.sourceString)
      if (!method) {
        animeError(`No method '${methodId.sourceString}' on '${instance.cls.name}'`)
      }
      const argValues = args.asIteration().children.map(a => a.interpret())
      return callMethod(instance, method, argValues, instance.cls)
    },

    // obj.field — field access expression
    Primary_memberAccess(primary, _dot, fieldId) {
      const instance = primary.interpret()
      if (!(instance instanceof AnimeInstance)) {
        animeError(
          `Cannot access field '${fieldId.sourceString}' on a non-instance value`
        )
      }
      return instance.getField(fieldId.sourceString)
    },

    // summon ClassName(args) — instantiate a class
    Primary_summon(_summon, classId, _open, args, _close) {
      const name = classId.sourceString
      if (!classes.has(name)) {
        animeError(`No class named '${name}' — did you define it?`)
      }
      const cls = classes.get(name)
      const instance = new AnimeInstance(cls)
      const awaken = cls.findMethod("awaken")
      if (awaken) {
        const argValues = args.asIteration().children.map(a => a.interpret())
        callMethod(instance, awaken, argValues, cls)
      }
      return instance
    },

    // this — self reference
    Primary_thisRef(_this) {
      return scope.lookup("this")
    },

    // ── Literal values ───────────────────────────────────────────────────────

    num_float(_intDigits, _dot, _fracDigits) {
      return Number(this.sourceString)
    },

    num_int(_digits) {
      return Number(this.sourceString)
    },

    strlit(_openQuote, chars, _closeQuote) {
      return chars.children.map(c => c.interpret()).join("")
    },

    strchar_escape(_backslash, char) {
      return ESCAPES[char.sourceString] ?? char.sourceString
    },

    strchar_normal(char) {
      return char.sourceString
    },

    yatta(_) {
      return true
    },

    dame(_) {
      return false
    },
  }

  // Internal helper: build and register an AnimeClass from a declaration node.
  // parentIds is an Ohm iter node (0 or 1 items) for the optional "from id" part.
  function _registerClass(nameId, parentIds, members) {
    const name = nameId.sourceString
    const parentName =
      parentIds.children.length > 0 ? parentIds.children[0].sourceString : null
    const cls = new AnimeClass(name, parentName)
    cls.resolve(classes)
    for (const member of members.children) {
      const method = member.interpret()
      cls.methods.set(method.name, method)
    }
    classes.set(name, cls)
  }

  const semantics = grammar.createSemantics().addOperation("interpret", actions)
  return semantics(match).interpret()
}
