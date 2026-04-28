import assert from "node:assert/strict";
import parse from "../src/parser.js";
import { describe, it } from "node:test";

// Grammar-driven positive cases (see src/aniscript.ohm). Character/move use
// MethodDef ids that are not reserved keywords (`awaken` is only valid on world via AwakenDef).
const syntaxChecks = [
  ["empty program", ""],
  ["whitespace only", "  \n\t  "],
  ["simplest non-empty program", "creation(0)"],
  [
    "multiple statements",
    'creation(1)\njutsu x = 2\njutsu y = x + 3\nx = 5\nkaeru 0',
  ],
  ["creation with string", 'creation("Hello, world!")'],
  ["jutsu declaration", "jutsu n = 42"],
  ["jutsu with summon rhs", 'jutsu w = summon World("here")'],
  ["reassignment", "jutsu a = 1\na = a + 9"],
  ["geass without masaka", "geass truth { creation(1) }"],
  [
    "geass with masaka",
    "geass dame { creation(0) } masaka { creation(1) }",
  ],
  ["geass with parenthesized condition", "geass (1 < 2) { creation(3) }"],
  ["tsukuyomi empty body", "tsukuyomi truth {}"],
  ["tsukuyomi with statements", "tsukuyomi dame { jutsu i = 1 creation(i) }"],
  ["world minimal", "world W { awaken() {} }"],
  [
    "world with inherit and awaken fields",
    "world Child from Parent { awaken(n) { this.n = n } }",
  ],
  [
    "world with awaken and method",
    "world W { awaken(x) { this.x = x } bump() { this.x = this.x + 1 } }",
  ],
  ["world awaken multiple params", "world W { awaken(a, b, c) { this.a = a } }"],
  ["character no inherit", "character C { init() { this.x = 1 } }"],
  [
    "character from parent with channel in method",
    "character C from P { init(n) { channel(n) this.k = 1 } }",
  ],
  [
    "character method with geass",
    "character C { init() {} train() { geass (1 > 0) { this.x = 1 } masaka { this.x = 0 } } }",
  ],
  [
    "move with methods and obj field set",
    "move M { init(p) { this.p = p } hit(t) { t.hp = t.hp - 1 creation(0) } }",
  ],
  ["move from parent", "move M from Base { init() { channel() } }"],
  ["kaeru expression", "world W { awaken() {} m() { kaeru 7 } }"],
  ["channel no args", "character C from P { init() { channel() } }"],
  ["channel one arg", "character C from P { init(x) { channel(x) } }"],
  [
    "channel multiple args",
    "character C from P { init(a, b) { channel(a, b) } }",
  ],
  ["this method call statement", "world W { awaken() {} m() { this.m() } }"],
  ["id method call statement", "world W { awaken() {} m() { x.foo() } }"],
  ["obj field assignment", "world W { awaken() {} m() { enemy.hp = 0 } }"],
  [
    "relational operators in expression",
    "creation(1 < 2)\ncreation(1 <= 2)\ncreation(1 == 2)\ncreation(1 != 2)\ncreation(1 >= 2)\ncreation(1 > 2)",
  ],
  ["chained addition subtraction", "creation(1 + 2 - 3 + 4)"],
  ["chained mul div mod", "creation(10 * 2 / 5 % 3)"],
  ["exponentiation right associative", "creation(2 ** 3 ** 2)"],
  ["unary negation", "creation(-5)"],
  ["negation of parenthesized expression", "creation(-(-5))"],
  ["parentheses override precedence", "creation((1 + 2) * 3)"],
  ["boolean truth literal", "jutsu t = truth"],
  ["boolean dame literal", "jutsu f = dame"],
  ["integer literal", "creation(42)"],
  ["float literal", "creation(3.14)"],
  ["string literal empty", 'creation("")'],
  ["string with escapes", String.raw`creation("a\n\t\\\"")`],
  ["this reference in expression", "world W { awaken() {} m() { creation(this) } }"],
  ["member access in expression", "jutsu x = a.b"],
  ["summon then member and method", "world W { awaken() {} m() { creation(x.y) } }"],
  [
    "complex primary chain in expression",
    'world W { awaken() {} m() { creation(foo.bar(1).z) } }',
  ],
  ["nested creation in geass", "geass truth { geass dame { creation(1) } }"],
  ["comment line end", "creation(0) // end"],
  ["comment only line between statements", "creation(1)//\ncreation(2)//"],
  ["identifier with digits", "jutsu x1 = 1"],
  ["non-Latin identifier", "jutsu コンパイラ = 100"],
];

const syntaxErrors = [
  [
    "missing closing brace in character",
    "character Shinobi from Narutoverse { init(name, rank) { channel(name) this.rank = rank this.hp = 100 this.chakra = 80 } train() { this.chakra = this.chakra + 15",
    "Expected \"}\"",
  ],
  [
    "awaken as method name on character (keyword)",
    "character C { awaken() {} }",
    "not a keyword",
  ],
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => parse(source), (err) => {
        assert.match(String(err.message), new RegExp(errorMessagePattern));
        return true;
      });
    });
  }
});
