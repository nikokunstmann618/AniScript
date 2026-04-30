// test/compiler.test.js – end-to-end pipeline tests via compile().

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import compile from "../src/compiler.js"

// ── Helpers ───────────────────────────────────────────────────────────────

function jsOf(source) {
  return compile(source, "js")
}

// ── Output-type routing ───────────────────────────────────────────────────

describe("The compiler", () => {
  it("rejects an unknown output type", () => {
    assert.throws(() => compile("creation(1)", "bad"), /Unknown output type/)
  })

  it('returns "Syntax is ok" for --parse', () => {
    assert.equal(compile("creation(42)", "parsed"), "Syntax is ok")
  })

  it("returns a Program node for --analyze", () => {
    const result = compile("jutsu x = 42", "analyzed")
    assert.equal(result.kind, "Program")
    assert.equal(result.statements.length, 1)
    assert.equal(result.statements[0].kind, "JutsuStatement")
  })

  it("returns a constant-folded Program for --optimize", () => {
    const result = compile("jutsu x = 1 + 2", "optimized")
    assert.equal(result.kind, "Program")
    assert.equal(result.statements[0].initializer.value, 3)
  })

  it("returns a JavaScript string for --js", () => {
    const js = jsOf("creation(42)")
    assert.ok(typeof js === "string")
    assert.ok(js.includes("console.log"))
    assert.ok(js.includes("42"))
  })

  // ── Statement generation ──────────────────────────────────────────────

  it("compiles a jutsu declaration", () => {
    assert.ok(jsOf("jutsu x = 5").includes("let x = 5"))
  })

  it("compiles a reassignment", () => {
    const js = jsOf("jutsu x = 1 x = 2")
    assert.ok(js.includes("let x = 1"))
    assert.ok(js.includes("x = 2"))
  })

  it("compiles a geass without counter", () => {
  const js = jsOf("jutsu x = 1 geass x > 0 { creation(1) }")
  assert.ok(js.includes("if"))
  assert.ok(js.includes("console.log(1)"))
})

  it("compiles a geass with counter", () => {
  const js = jsOf("jutsu x = 1 geass x > 0 { creation(1) } counter { creation(0) }")
  assert.ok(js.includes("if"))
  assert.ok(js.includes("else"))
})

  it("compiles a tsukuyomi loop", () => {
    const js = jsOf("jutsu i = 0 tsukuyomi i < 3 { creation(i) i = i + 1 }")
    assert.ok(js.includes("while"))
    assert.ok(js.includes("console.log"))
  })

  // ── OOP generation ────────────────────────────────────────────────────

  it("compiles a world class", () => {
    const js = jsOf("world Hero { awaken(name) { this.name = name } }")
    assert.ok(js.includes("class Hero"))
    assert.ok(js.includes("awaken(name)"))
    assert.ok(js.includes("this.name = name"))
  })

  it("compiles a world with inheritance", () => {
    const js = jsOf(`
      world Animal { awaken(power) { this.power = power } }
      world Cat from Animal { awaken() { this.power = 9 } }
    `)
    assert.ok(js.includes("class Animal"))
    assert.ok(js.includes("class Cat extends Animal"))
  })

  it("compiles a character class", () => {
    const js = jsOf("character Ninja { init() { this.rank = 1 } }")
    assert.ok(js.includes("class Ninja"))
  })

  it("compiles a move class", () => {
    const js = jsOf("move Fireball { cast() { this.dmg = 50 } }")
    assert.ok(js.includes("class Fireball"))
  })

  it("compiles kaeru as return", () => {
    const js = jsOf("world Calc { awaken() { } add(a, b) { kaeru a + b } }")
    assert.ok(js.includes("return"))
  })

  it("compiles channel as super", () => {
    const js = jsOf(`
      world Animal { awaken(p) { this.p = p } }
      world Cat from Animal {
        awaken() { this.p = 9 }
        init() { channel(100) }
      }
    `)
    assert.ok(js.includes("super.awaken(100)"))
  })

  it("compiles summon as new", () => {
    const js = jsOf("world Box { awaken() { } } jutsu b = summon Box()")
    assert.ok(js.includes("new Box()"))
  })

  it("compiles method call on object", () => {
    const js = jsOf(
      "world Box { awaken() { } open() { } } jutsu b = summon Box() b.open()"
    )
    assert.ok(js.includes("b.open()"))
  })

  it("compiles member access", () => {
    const js = jsOf(
      "world Box { awaken() { this.size = 10 } } jutsu b = summon Box() creation(b.size)"
    )
    assert.ok(js.includes("b.size"))
  })

  it("compiles obj field set", () => {
    const js = jsOf(
      "world Box { awaken() { this.size = 0 } } jutsu b = summon Box() b.size = 99"
    )
    assert.ok(js.includes("b.size = 99"))
  })

  // ── Expression generation ─────────────────────────────────────────────

  it("compiles binary expressions", () => {
  const js = jsOf("jutsu a = 2 jutsu b = 3 creation(a + b)")
  assert.ok(js.includes("+"))
})

  it("compiles unary negation", () => {
    const js = jsOf("creation(-5)")
    assert.ok(js.includes("-"))
  })

  it("compiles boolean literals", () => {
    const js = jsOf("creation(truth) creation(illusion)")
    assert.ok(js.includes("true"))
    assert.ok(js.includes("false"))
  })

  it("compiles string literals", () => {
    const js = jsOf('creation("Dattebayo!")')
    assert.ok(js.includes('"Dattebayo!"'))
  })

  it("compiles float literals", () => {
    const js = jsOf("creation(3.14)")
    assert.ok(js.includes("3.14"))
  })

  it("compiles a this method call statement", () => {
  const js = jsOf("world Foo { awaken() { } bar() { this.bar() } }")
  assert.ok(js.includes("this.bar()"))
})

  // ── Optimizer integration ─────────────────────────────────────────────

  it("constant-folds arithmetic in generated JS", () => {
    const js = jsOf("creation(2 + 3)")
    assert.ok(js.includes("5"))
    assert.ok(!js.includes("+"))
  })

  it("eliminates a dead while(false)", () => {
    const js = jsOf("tsukuyomi illusion { creation(1) }")
    assert.ok(!js.includes("while"))
  })

  it("eliminates dead branch of geass(truth)", () => {
    const js = jsOf("geass truth { creation(1) } counter { creation(0) }")
    assert.ok(js.includes("1"))
    assert.ok(!js.includes("0"))
    assert.ok(!js.includes("if"))
  })

  it("removes a self-assignment in the full pipeline", () => {
  const js = jsOf("jutsu x = 5 x = x creation(x)")
  assert.ok(js.includes("let x = 5"))
  assert.ok(js.includes("console.log(x)"))
  assert.ok(!js.includes("x = x"))
})

  // ── Error propagation ─────────────────────────────────────────────────

  it("propagates a parse error", () => {
    assert.throws(() => compile("jutsu = 5", "js"), /Line/)
  })

  it("propagates a semantic error", () => {
    assert.throws(() => compile("creation(undeclaredVar)", "js"), /undeclared/)
  })
})