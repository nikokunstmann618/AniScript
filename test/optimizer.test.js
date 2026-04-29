import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

// Helper factories to make test cases shorter
const x = core.identifier("x");
const y = core.identifier("y");
const obj = core.identifier("obj");
const field = "f";

const assign = (target, source) => core.assignStatement(target, source);
const jutsu = (name, init) => core.jutsuStatement(name, init);
const creation = (exp) => core.creationStatement(exp);
const geass = (test, cons, alt) => core.geassStatement(test, cons, alt);
const tsukuyomi = (test, body) => core.tsukuyomiStatement(test, body);
const methodDef = (name, params, body) => core.methodDefinition(name, params, body);
const world = (name, parent, methods) => core.worldDeclaration(name, parent, methods);
const character = (name, parent, methods) => core.characterDeclaration(name, parent, methods);
const move = (name, parent, methods) => core.moveDeclaration(name, parent, methods);
const thisFieldSet = (field, val) => core.thisFieldSetStatement(field, val);
const objFieldSet = (obj, field, val) => core.objFieldSetStatement(obj, field, val);
const exprStmt = (receiver, method, args) => core.exprStatement(receiver, method, args);
const channel = (args) => core.channelStatement(args);
const ret = (val) => core.returnStatement(val);
const summon = (name, args) => core.summonExpression(name, args);
const methodCall = (receiver, method, args) => core.methodCallExpression(receiver, method, args);
const member = (obj, field) => core.memberAccessExpression(obj, field);
const binary = (op, l, r) => core.binaryExpression(op, l, r);
const unary = (op, operand) => core.unaryExpression(op, operand);
const num = (n) => core.numericLiteral(n);
const truth = () => core.truthLiteral();
const illusion = () => core.illusionLiteral();
const str = (s) => core.stringLiteral(s);
const program = (stmts) => core.program(stmts);

// Helper for constant folding tests
const fold = (op, l, r, expected) => [binary(op, num(l), num(r)), num(expected)];
const cmp = (op, l, r, expected) => [binary(op, num(l), num(r)), expected ? truth() : illusion()];

const tests = [
  // Constant folding
  ["folds +", ...fold("+", 5, 8, 13)],
  ["folds -", ...fold("-", 5n, 8n, -3n)],
  ["folds *", ...fold("*", 5, 8, 40)],
  ["folds /", ...fold("/", 5, 8, 0.625)],
  ["folds %", ...fold("%", 10, 3, 1)],
  ["folds **", ...fold("**", 5, 8, 390625)],
  // both ternary branches for each comparison operator
  ["folds < true",  ...cmp("<",  5, 8, true)],
  ["folds < false", ...cmp("<",  8, 5, false)],
  ["folds <= true",  ...cmp("<=", 5, 8, true)],
  ["folds <= false", ...cmp("<=", 8, 5, false)],
  ["folds == false", ...cmp("==", 5, 8, false)],
  ["folds == true",  ...cmp("==", 5, 5, true)],
  ["folds != true",  ...cmp("!=", 5, 8, true)],
  ["folds != false", ...cmp("!=", 5, 5, false)],
  ["folds >= false", ...cmp(">=", 5, 8, false)],
  ["folds >= true",  ...cmp(">=", 8, 5, true)],
  ["folds > false", ...cmp(">", 5, 8, false)],
  ["folds > true",  ...cmp(">", 8, 5, true)],

  // Strength reductions
  ["optimizes +0", binary("+", x, num(0)), x],
  ["optimizes -0", binary("-", x, num(0)), x],
  ["optimizes *1", binary("*", x, num(1)), x],
  ["optimizes /1", binary("/", x, num(1)), x],
  ["optimizes *0", binary("*", x, num(0)), num(0)],
  ["optimizes 0*", binary("*", num(0), x), num(0)],
  ["optimizes 0/", binary("/", num(0), x), num(0)],
  ["optimizes 0+", binary("+", num(0), x), x],
  ["optimizes 0-", binary("-", num(0), x), unary("-", x)],
  ["optimizes 1* left", binary("*", num(1), x), x],
  ["optimizes 1**", binary("**", num(1), x), num(1)],
  ["optimizes **0", binary("**", x, num(0)), num(1)],

  // Unary negation folding
  ["folds negation", unary("-", num(8)), num(-8)],
  [
    "keeps unary - on non-literal operand",
    unary("-", x),
    unary("-", x),
  ],

  // Geass: non-constant test keeps statement (consequent / alternate still optimized)
  [
    "geass with dynamic test",
    geass(
      x,
      [creation(binary("+", num(1), num(2)))],
      [creation(num(1))]
    ),
    geass(x, [creation(num(3))], [creation(num(1))]),
  ],

  // Boolean shortcuts — all six short-circuit rules
  ["removes left false from &&",  binary("&&", illusion(), binary("<", x, num(1))), illusion()],
  ["removes left true from &&",   binary("&&", truth(),    binary("<", x, num(1))), binary("<", x, num(1))],
  ["removes right true from &&",  binary("&&", binary("<", x, num(1)), truth()),    binary("<", x, num(1))],
  ["removes left true from ||",   binary("||", truth(),    binary("<", x, num(1))), truth()],
  ["removes left false from ||",  binary("||", illusion(), binary("<", x, num(1))), binary("<", x, num(1))],
  ["removes right false from ||", binary("||", binary("<", x, num(1)), illusion()), binary("<", x, num(1))],

  // Self-assignment removal
  ["removes x=x", assign(x, x), []],
  ["keeps x=y", assign(x, y), assign(x, y)],


  // CounterClause (else block of geass)
["geass with counter clause", 
    geass(illusion(), [], [creation(num(99))]), 
    [creation(num(99))]
  ],
  
  // thisExpression (should pass through untouched)
  ["this expression", 
    core.thisExpression(), 
    core.thisExpression()
  ],
  
  // parenthesizedExpression (should be removed)
  ["parenthesized expression removal", 
    core.parenthesizedExpression(binary("+", num(1), num(2))), 
    num(3)
  ],
  
  // Geass constant condition
  ["geass with true", geass(truth(), [creation(num(42))], []), [creation(num(42))]],
  ["geass with false", geass(illusion(), [], [creation(num(99))]), [creation(num(99))]],
  ["geass with true and alternate", geass(truth(), [creation(num(42))], [creation(num(99))]), [creation(num(42))]],
  ["geass with false and alternate", geass(illusion(), [creation(num(42))], [creation(num(99))]), [creation(num(99))]],

  [
  "geass with false and CounterClause alternate",
  geass(illusion(), [creation(num(1))], core.counterClause([creation(num(99))])),
  [creation(num(99))],
],

  // Tsukuyomi with constant false
  ["tsukuyomi false", tsukuyomi(illusion(), [creation(num(1))]), []],

  // No-op elimination
  ["jutsu with literal", jutsu("a", num(5)), core.jutsuStatement("a", num(5))], // not eliminated
  ["assign to self in program", program([assign(x, x), creation(x)]), program([creation(x)])],

  // Expression simplification in context
  ["simplifies inside creation", creation(binary("+", num(1), num(2))), creation(num(3))],
  ["simplifies inside jutsu", jutsu("z", binary("*", num(5), num(6))), jutsu("z", num(30))],
  ["simplifies inside geass test", geass(binary("==", num(3), num(3)), [creation(num(1))], []), [creation(num(1))]],
  ["simplifies inside tsukuyomi test", tsukuyomi(binary(">", num(5), num(3)), []), tsukuyomi(truth(), [])],

  // Method definitions and class declarations
  ["optimizes inside method body", methodDef("test", [], [assign(x, x), ret(num(42))]), methodDef("test", [], [ret(num(42))])],
  ["optimizes world methods", world("Test", null, [methodDef("m", [], [assign(x, x), ret(num(3))])]), world("Test", null, [methodDef("m", [], [ret(num(3))])])],
  ["optimizes character methods", character("Test", null, [methodDef("m", [], [assign(x, x)])]), character("Test", null, [methodDef("m", [], [])])],
  ["optimizes move methods", move("Test", null, [methodDef("m", [], [ret(binary("+", num(1), num(2)))])]), move("Test", null, [methodDef("m", [], [ret(num(3))])])],

  // Field access and method call simplification
  ["simplifies this field set", thisFieldSet("f", binary("+", num(2), num(3))), thisFieldSet("f", num(5))],
  ["simplifies obj field set", objFieldSet(obj, "f", binary("*", num(4), num(5))), objFieldSet(obj, "f", num(20))],
  ["simplifies expr statement args", exprStmt(obj, "doIt", [binary("-", num(10), num(4))]), exprStmt(obj, "doIt", [num(6)])],
  ["simplifies channel args", channel([binary("/", num(15), num(3))]), channel([num(5)])],
  ["simplifies return value", ret(binary("**", num(2), num(3))), ret(num(8))],

  // Expression nesting
  ["simplifies inside method call expr", methodCall(obj, "foo", [binary("+", num(1), num(2))]), methodCall(obj, "foo", [num(3)])],
  ["simplifies inside member access", member(binary("+", num(1), num(2)), "field"), member(num(3), "field")],
  ["simplifies inside summon", summon("Test", [binary("*", num(3), num(4))]), summon("Test", [num(12)])],

  // Parentheses elimination
  ["removes parentheses", core.parenthesizedExpression(binary("+", num(1), num(2))), num(3)],

  // Unknown node kind falls through unchanged (covers the ?? node fallback in optimize())
  // CounterClause has no optimizer entry, so it also exercises core.counterClause
  ["unknown kind passes through", core.counterClause([]), core.counterClause([])],

  // String literal passes through (covers core.stringLiteral and optimizer.StringLiteral)
  ["string literal passes through", str("hello"), str("hello")],

  // Geass with null alternate: ?? [] branch fires, then dynamic test returns node
  [
    "geass null alternate becomes empty array",
    core.geassStatement(x, [creation(num(1))], null),
    geass(x, [creation(num(1))], []),
  ],

  // Complex program
  [
    "optimizes entire program",
    program([
      assign(x, binary("+", num(1), num(2))),
      geass(truth(), [creation(x)], [creation(num(0))]),
      tsukuyomi(illusion(), [assign(x, num(99))]),
      jutsu("y", binary("*", num(5), num(6))),
      world("A", null, [methodDef("init", [], [assign(x, x)])]),
      ret(binary("/", num(10), num(2))),
    ]),
    program([
      assign(x, num(3)),
      creation(x),
      jutsu("y", num(30)),
      world("A", null, [methodDef("init", [], [])]),
      ret(num(5)),
    ]),
  ],
];

describe("The Aniscript optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(scenario, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});