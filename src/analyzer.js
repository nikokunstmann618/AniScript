import * as core from "./core.js"

function error(message) {
  throw new Error(`NANI?! ${message}`)
}

export default function analyze(match) {
  const grammar = match.matcher.grammar

  let scopeStack = [new Set()]

  function pushScope() {
    scopeStack.push(new Set())
  }
  function popScope() {
    scopeStack.pop()
  }
  function currentScope() {
    return scopeStack[scopeStack.length - 1]
  }
  function declare(name) {
    if (currentScope().has(name)) {
      error(`Jutsu '${name}' wa mou iru yo! (variable already declared in this scope)`)
    }
    currentScope().add(name)
  }
  function mustBeDeclared(name) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i].has(name)) return
    }
    error(
      `Jutsu '${name}' ga inai yo! Use 'jutsu ${name} = ...' first. (undeclared variable)`
    )
  }

  
  const declaredClasses = new Map()
  let inMethod = false
  let currentClassName = null
  let currentParentName = null

  const ESCAPES = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"' }

  // Shared class-declaration logic
  function analyzeClass(nameId, parentIds, members, factory) {
    const name = nameId.sourceString
    const parentName =
      parentIds.children.length > 0 ? parentIds.children[0].sourceString : null

    if (declaredClasses.has(name)) {
        error(`Class '${name}' already declared`)
      }
    
    if (parentName && !declaredClasses.has(parentName)) {
      error(
        `Class '${name}' tries to extend '${parentName}', but that class doesn't exist yet`
      )
    }
    declaredClasses.set(name, { parentName })

    const outerClass = currentClassName
    const outerParent = currentParentName
    currentClassName = name
    currentParentName = parentName

    const methods = members.children.map(m => m.analyze())

    currentClassName = outerClass
    currentParentName = outerParent

    return factory(name, parentName, methods)
  }

  // Semantics actions
  const actions = {
    Program(statements) {
      return core.program(statements.children.map(s => s.analyze()))
    },

    // Statements 

    CreationStmt(_kw, _lp, exp, _rp) {
      return core.creationStatement(exp.analyze())
    },

    JutsuStmt(_kw, id, _eq, exp) {
      const initializer = exp.analyze()
      declare(id.sourceString)
      return core.jutsuStatement(id.sourceString, initializer)
    },

    AssignStmt(id, _eq, exp) {
      mustBeDeclared(id.sourceString)
      return core.assignStatement(id.sourceString, exp.analyze())
    },

    GeassStmt(_kw, exp, _lbrace, stmts, _rbrace, elseClause) {
      const test = exp.analyze()
      pushScope()
      const consequent = stmts.children.map(s => s.analyze())
      popScope()
      const alternate =
        elseClause.children.length > 0 ? elseClause.children[0].analyze() : null
      return core.geassStatement(test, consequent, alternate)
    },

    CounterClause(_kw, _lbrace, stmts, _rbrace) {
      pushScope()
      const body = stmts.children.map(s => s.analyze())
      popScope()
      return core.counterClause(body)
    },

    TsukuyomiStmt(_kw, exp, _lbrace, stmts, _rbrace) {
      const test = exp.analyze()
      pushScope()
      const body = stmts.children.map(s => s.analyze())
      popScope()
      return core.tsukuyomiStatement(test, body)
    },

    // Class declarations

    AwakenDef(_kw, _lp, params, _rp, _lbrace, fieldSetStmts, _rbrace) {
      const paramNames = params.asIteration().children.map(p => p.sourceString);
      const outerInMethod = inMethod;
      inMethod = true;
      pushScope();
      declare("this");
      for (const p of paramNames) declare(p);
      const body = fieldSetStmts.children.map(s => s.analyze());
      popScope();
      inMethod = outerInMethod;
      return { kind: "AwakenDef", paramNames, body };
    },
    
    WorldDecl(_kw, nameId, _fromKw, parentIds, _lbrace, awakenDef, methodMembers, _rbrace) {
      const name = nameId.sourceString;
      const parentName = parentIds.children.length > 0 ? parentIds.children[0].sourceString : null;
    
      if (parentName && !declaredClasses.has(parentName)) {
        error(`Class '${name}' tries to extend '${parentName}', but that class doesn't exist yet`);
      }
      
    
      declaredClasses.set(name, { parentName });
    
      const outerClass = currentClassName;
      const outerParent = currentParentName;
      currentClassName = name;
      currentParentName = parentName;
    
      const awaken = awakenDef.analyze();
      const methodNodes = methodMembers.children.map(m => m.analyze());
      const awakenMethod = core.methodDefinition("awaken", awaken.paramNames, awaken.body);
      const allMethods = [awakenMethod, ...methodNodes];
    
      currentClassName = outerClass;
      currentParentName = outerParent;
    
      return core.worldDeclaration(name, parentName, allMethods);
    },

    

    CharacterDecl(_kw, nameId, _fromKw, parentIds, _lbrace, members, _rbrace) {
      return analyzeClass(nameId, parentIds, members, core.characterDeclaration)
    },

    MoveDecl(_kw, nameId, _fromKw, parentIds, _lbrace, members, _rbrace) {
      return analyzeClass(nameId, parentIds, members, core.moveDeclaration)
    },

    MethodDef(nameId, _lp, params, _rp, _lbrace, stmts, _rbrace) {
      const paramNames = params.asIteration().children.map(p => p.sourceString)
      const outerMethod = inMethod
      inMethod = true
      pushScope()
      declare("this")
      for (const p of paramNames) declare(p)
      const body = stmts.children.map(s => s.analyze())
      popScope()
      inMethod = outerMethod
      return core.methodDefinition(nameId.sourceString, paramNames, body)
    },

    // OOP statements

    ThisFieldSetStmt(_this, _dot, fieldId, _eq, exp) {
      if (!inMethod) error("'this' can only be used inside a method")
      return core.thisFieldSetStatement(fieldId.sourceString, exp.analyze())
    },

    ObjFieldSetStmt(objId, _dot, fieldId, _eq, exp) {
      mustBeDeclared(objId.sourceString)
      return core.objFieldSetStatement(
        objId.sourceString,
        fieldId.sourceString,
        exp.analyze()
      )
    },

    ExprStmt(receiver, _dot, methodId, _lp, args, _rp) {
      if (receiver.sourceString === "this") {
        if (!inMethod) error("'this' can only be used inside a method")
      } else {
        mustBeDeclared(receiver.sourceString)
      }
      return core.exprStatement(
        receiver.sourceString,
        methodId.sourceString,
        args.asIteration().children.map(a => a.analyze())
      )
    },

    ChannelStmt(_kw, _lp, args, _rp) {
      if (!inMethod) error("channel() can only be used inside a method")
      if (!currentParentName) {
        error(`Class '${currentClassName}' has no parent to channel`)
      }
      return core.channelStatement(args.asIteration().children.map(a => a.analyze()))
    },

    ReturnStmt(_kw, exp) {
      if (!inMethod) error("kaeru can only be used inside a method")
      return core.returnStatement(exp.analyze())
    },

    // Expressions 

    Exp_binary(left, op, right) {
      return core.binaryExpression(op.sourceString, left.analyze(), right.analyze())
    },

    Condition_binary(left, op, right) {
      return core.binaryExpression(op.sourceString, left.analyze(), right.analyze())
    },

    Term_binary(left, op, right) {
      return core.binaryExpression(op.sourceString, left.analyze(), right.analyze())
    },

    Factor_exponentiation(base, _op, exp) {
      return core.binaryExpression("**", base.analyze(), exp.analyze())
    },

    Factor_negation(_minus, primary) {
      return core.unaryExpression("-", primary.analyze())
    },

    Primary_methodCall(primary, _dot, methodId, _lp, args, _rp) {
      return core.methodCallExpression(
        primary.analyze(),
        methodId.sourceString,
        args.asIteration().children.map(a => a.analyze())
      )
    },

    Primary_memberAccess(primary, _dot, fieldId) {
      return core.memberAccessExpression(primary.analyze(), fieldId.sourceString)
    },

    Primary_summon(_kw, classId, _lp, args, _rp) {
      const name = classId.sourceString
      if (!declaredClasses.has(name)) {
        error(`No class named '${name}' — did you define it?`)
      }
      return core.summonExpression(
        name,
        args.asIteration().children.map(a => a.analyze())
      )
    },

    Primary_thisRef(_this) {
      if (!inMethod) error("'this' can only be used inside a method")
      return core.thisExpression()
    },

    Primary_id(id) {
      mustBeDeclared(id.sourceString)
      return core.identifier(id.sourceString)
    },

    Primary_parens(_lp, exp, _rp) {
      return exp.analyze()
    },

    // Literals

    num_float(_int, _dot, _frac) {
      return core.numericLiteral(Number(this.sourceString))
    },

    num_int(_digits) {
      return core.numericLiteral(Number(this.sourceString))
    },

    str(_) {
      const full = this.sourceString;           
      const content = full.slice(1, -1);        
      const startPos = this.source.getLineAndColumnMessage();
      let result = "";
      for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (ch === "\\" && i + 1 < content.length) {
          const next = content[i + 1];
          if (next === "u") {
            const hex = content.slice(i + 2, i + 6);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              result += String.fromCodePoint(parseInt(hex, 16));
              i += 5;
              continue;
            } else {
              result += "\\u" + hex;
              i += 5;
              continue;
            }
          }
          const escapes = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"' };
          result += escapes[next] ?? next;
          i++;
        } else {
          result += ch;
        }
      }
      return core.stringLiteral(result);
    },

    truth(_) {
      return core.truthLiteral()
    },

    illusion(_) {
      return core.illusionLiteral()
    },
  }

  const semantics = grammar.createSemantics().addOperation("analyze", actions)
  return semantics(match).analyze()
}