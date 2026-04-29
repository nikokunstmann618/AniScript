import assert from "node:assert/strict";
import parse from "../src/parser.js";
import { describe, it } from "node:test";

// Grammar-driven positive cases (see src/aniscript.ohm). `id` excludes the
// `keyword` rule only; names like `awaken` are still valid MethodDef ids on any class.
const syntaxChecks = [
  ["empty program", ""],
  ["whitespace only", "  \n\t  "],
  ["simplest non-empty program", "creation(0)"],
  [
    "multiple statements",
    "creation(1)\njutsu x = 2\njutsu y = x + 3\nx = 5\nkaeru 0",
  ],
  ["creation with string", 'creation("Hello, world!")'],
  ["jutsu declaration", "jutsu n = 42"],
  ["jutsu with summon rhs", 'jutsu w = summon World("here")'],
  ["reassignment", "jutsu a = 1\na = a + 9"],
  ["geass without counter", "geass truth { creation(1) }"],
  ["geass with counter", "geass dame { creation(0) } counter { creation(1) }"],
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
  [
    "world awaken multiple params",
    "world W { awaken(a, b, c) { this.a = a } }",
  ],
  ["character no inherit", "character C { init() { this.x = 1 } }"],
  [
    "character from parent with channel in method",
    "character C from P { init(n) { channel(n) this.k = 1 } }",
  ],
  [
    "character method with geass",
    "character C { init() {} train() { geass (1 > 0) { this.x = 1 } counter { this.x = 0 } } }",
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
  [
    "this reference in expression",
    "world W { awaken() {} m() { creation(this) } }",
  ],
  ["member access in expression", "jutsu x = a.b"],
  [
    "summon then member and method",
    "world W { awaken() {} m() { creation(x.y) } }",
  ],
  [
    "complex primary chain in expression",
    "world W { awaken() {} m() { creation(foo.bar(1).z) } }",
  ],
  ["nested creation in geass", "geass truth { geass dame { creation(1) } }"],
  ["comment line end", "creation(0) // end"],
  ["comment only line between statements", "creation(1)//\ncreation(2)//"],
  ["identifier with digits", "jutsu x1 = 1"],
  ["non-Latin identifier", "jutsu コンパイラ = 100"],
];

// Ohm reports failures as a multi-line message; the first line is always
// "Line N, col M:" — we pin location like the reference-style parser tests.
const syntaxErrors = [
  ["non-letter in an identifier (emoji)", "jutsu ab😭c = 2", /Line 1, col 9:/],
  ["malformed number (trailing dot)", "jutsu x = 2.", /Line 1, col 13:/],
  ["a missing right operand", "creation(5 -)", /Line 1, col 13:/],
  [
    "a non-operator in an expression",
    "creation(7 * ((2 _ 3)))",
    /Line 1, col 18:/,
  ],
  ["an expression starting with a )", "creation())", /Line 1, col 10:/],
  ["a statement that is only a binary expression", "x * 5", /Line 1, col 3:/],
  ["an illegal statement on line 2", "creation(5)\nx * 5", /Line 2, col 3:/],
  ["a statement starting with a )", "creation(5)\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "jutsu x = * 71", /Line 1, col 11:/],
  [
    "negation directly before exponentiation",
    "creation(-2**2)",
    /Line 1, col 13:/,
  ],
  ["chained relational operators", "creation(1 < 2 < 3)", /Line 1, col 16:/],
  [
    "tsukuyomi without a brace block",
    "tsukuyomi truth\ncreation(1)",
    /Line 2, col 1:/,
  ],
  ["geass without a brace block", "geass truth\ncreation(1)", /Line 2, col 1:/],
  ["jutsu used like a variable name", "jutsu jutsu = 3", /Line 1, col 7:/],
  ["world used like a variable name", "jutsu world = 3", /Line 1, col 7:/],
  [
    "identifier starting with underscore only",
    "jutsu _x = 1",
    /Line 1, col 7:/,
  ],
  ["non-alphanumeric in an identifier", "jutsu x@y = 1", /Line 1, col 8:/],
  ["unterminated string literal", 'creation("abc)', /Line 1, col 15:/],
  ["missing closing paren on creation", "creation(1", /Line 1, col 11:/],
  [
    "trailing garbage after a valid statement",
    "creation(1) foo",
    /Line 1, col 16:/,
  ],
  ["truth is not assignable", "truth = 1", /Line 1, col 1:/],
  ["illusion is not assignable", "illusion = 1", /Line 1, col 1:/],
  [
    "shift operator not in grammar (looks like malformed expr)",
    "creation(1 << 2)",
    /Line 1, col 13:/,
  ],
  ["two adjacent dots in a number", "creation(1..2)", /Line 1, col 12:/],
  ["character body missing closing brace", "character C {", /Line 1, col 14:/],
  [
    "world body missing closing brace",
    "world W { awaken() {}",
    /Line 1, col 22:/,
  ],
  [
    "comma in jutsu declaration (single binding)",
    "jutsu x, y = 1",
    /Line 1, col 8:/,
  ],
  [
    "geass counter without { ... }",
    "geass truth { creation(1) } counter",
    /Line 1, col 36:/,
  ],
  [
    "geass condition not followed by {",
    "geass truth creation(1)",
    /Line 1, col 13:/,
  ],
  [
    "from without a parent world name",
    "character C from { init() {} }",
    /Line 1, col 18:/,
  ],
  [
    "summon missing closing paren",
    'jutsu w = summon World("here"',
    /Line 1, col 30:/,
  ],
  ["trailing comma in call arguments", "creation(1,)", /Line 1, col 11:/],
  [
    "missing closing brace in character (long method body)",
    "character Shinobi from Narutoverse { init(name, rank) { channel(name) this.rank = rank this.hp = 100 this.chakra = 80 } train() { this.chakra = this.chakra + 15",
    /Line 1, col 161:/,
  ],
  ["world without awaken method", "world X { foo() {} }", /Line 1, col 11:/],
  [
    "world with invalid this set assignment",
    "world X { awaken(health) { health = 1 } }",
    /Line 1, col 28:/,
  ],
  ["awaken used as variable name", "jutsu awaken = 5", /Line 1, col 7:/],
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(
        () => parse(source),
        (err) => {
          assert.match(String(err.message), new RegExp(errorMessagePattern));
          return true;
        },
      );
    });
  }
});
