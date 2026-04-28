// test/analyzer.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import * as core from "../src/core.js";

// ──────────────────────────── Valid programs (semantically correct) ────────────────────────────
const semanticChecks = [
  ["variable declaration", `jutsu x = 42`],
  ["print (creation)", `creation(3.14)`],
  ["assignment", `jutsu x = 5 x = 10`],
  ["unary negation of variable", `jutsu a = 10 jutsu b = -a`],
  ["binary expression with relop", `jutsu b = 5 > 3`],
  ["geass if‑else", `geass truth { creation(1) } counter { creation(2) }`],
  ["geass without else", `geass illusion { creation(0) }`],
  ["tsukuyomi while loop", `tsukuyomi truth { creation(1) }`],
  ["nested scope", `jutsu a = 1 geass truth { jutsu a = 2 creation(a) } creation(a)`],
  ["this.field assignment", `world Box { awaken() { this.size = 10 } }`],
  [
    "obj.field assignment",
    `world Box { awaken() { this.size = 0 } } jutsu b = summon Box() b.size = 20`,
  ],
  ["ExprStmt with identifier receiver", `world Foo { awaken() { } bar() { } } jutsu f = summon Foo() f.bar()`],
  ["ExprStmt with this receiver", `world Foo { awaken() { } bar() { this.bar() } }`],
  ["method call with arguments", `world Calc { awaken() { } add(x,y) { } } jutsu c = summon Calc() c.add(3,4)`],
  [
    "channel to parent",
    `world Animal { awaken(power) { this.power = power } }
     world Cat from Animal { awaken() { this.power = 9 } }`,
  ],
  ["kaeru return", `world Calc { awaken() { } add(x,y) { kaeru x + y } }`],
  ["parenthesized expression", `jutsu x = (2 + 3) * 4`],
  [
    "summon with arguments",
    `world Calc { awaken() { } add(x,y) { kaeru x + y } } jutsu c = summon Calc() jutsu result = c.add(3,4) creation(result)`,
  ],
  ["member access (.field)", `world Calc { awaken() { this.power = 0 } } jutsu c = summon Calc() creation(c.power)`],
  ["binary expressions", `jutsu x = 2 + 3 * 4 ** 2`],
  ["recognizes boolean literals", `geass truth { creation(truth) } counter { creation(illusion) }`],
  [
    "this in method",
    `world Person { awaken(name) { this.name = name } greet() { creation(this.name) } }`,
  ],
  ["string literal with escape", `creation("Hello\\nworld")`],
  [
    "variable shadowing in block",
    `jutsu x = 1 geass truth { jutsu x = 2 creation(x) } creation(x)`,
  ],
  ["this reference in method", `world Foo { awaken() { } bar() { kaeru this } }`],
  ["string with escapes", `creation("Hello\\nworld\\t\\"\\\\")`],
  ["string with unknown escape", `creation("\\q")`],  
  ["string with valid Unicode escape", `creation("\\u0041")`],
  ["string with invalid Unicode escape", `creation("\\u123X")`],
  [
    "channel with arguments match parent awaken",
    `world Parent { awaken(a,b) { this.a=a this.b=b } }
     world Child from Parent {
       awaken() { this.x = 0 }
       foo() { channel(10,20) }
     }`,
  ],
];

// ──────────────────────────── Syntactically correct but semantic errors ────────────────────────────
const semanticErrors = [
  ["redeclare variable", `jutsu x = 1 jutsu x = 2`, /already declared/],
  ["use undeclared variable", `creation(y)`, /undeclared variable/],
  ["assign to undeclared variable", `x = 5`, /undeclared variable/],
  ["this outside method", `this.field = 1`, /only be used inside a method/],
  ["channel outside method", `channel()`, /only be used inside a method/],
  ["channel in class without parent", `world Root { awaken() { } foo() { channel() } }`, /no parent to channel/],
  ["kaeru outside method", `kaeru 5`, /only be used inside a method/],
  ["attempt to summon undeclared class", `jutsu x = summon Ghost()`, /No class named 'Ghost'/],
  ["field assignment on undeclared variable", `obj.field = 10`, /undeclared variable/],
  ["extend non-existent parent (character)", `character Ninja from Nonexistent { }`, /class doesn't exist yet/],
  ["extend non-existent parent (move)", `move Fireball from Missing { }`, /class doesn't exist yet/],
  ["this used outside method", `this.bar()`, /'this' can only be used inside a method/],
  ["method call on undeclared variable", `obj.method()`, /undeclared variable/],  
  ["extend non‑existent parent (world)", `world Box from Missing { awaken() { } }`, /class doesn't exist yet/],
  ["duplicate character declaration", `character Samurai { } character Samurai { }`, /already declared/],
  ["duplicate move declaration", `move Punch { } move Punch { }`, /already declared/],
  ["this as value outside method", `jutsu x = this`, /'this' can only be used inside a method/],
  

];

// ──────────────────────────── AST output test for a trivial program ────────────────────────────
describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      const ast = analyze(parse(source));
      assert.ok(ast);
      assert.equal(ast.kind, "Program");
    });
  }

  for (const [scenario, source, pattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), pattern);
    });
  }

  it("produces the expected AST for a trivial program", () => {
    const source = `jutsu x = 42 creation(x)`;
    const expected = core.program([
      core.jutsuStatement("x", core.numericLiteral(42)),
      core.creationStatement(core.identifier("x")),
    ]);
    const actual = analyze(parse(source));
    assert.deepEqual(actual, expected);
  });

  it("handles geass with counter", () => {
    const source = `geass truth { creation(1) } counter { creation(0) }`;
    const ast = analyze(parse(source));
    assert.equal(ast.kind, "Program");
    assert.equal(ast.statements.length, 1);
    const stmt = ast.statements[0];
    assert.equal(stmt.kind, "GeassStatement");
    assert.equal(stmt.test.kind, "TruthLiteral");
    assert.equal(stmt.consequent[0].kind, "CreationStatement");
    assert.equal(stmt.alternate.kind, "CounterClause");   // ← Fixed line
  });

  it("detects duplicate variable declaration in same scope", () => {
    const source = `jutsu a = 1 jutsu a = 2`;
    assert.throws(() => analyze(parse(source)), /already declared/);
  });

  it("allows variable shadowing in inner block", () => {
    const source = `jutsu x = 1 geass truth { jutsu x = 2 }`;
    assert.doesNotThrow(() => analyze(parse(source)));
  });
});