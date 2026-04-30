// test/generator.test.js – unit tests for the AniScript code generator.

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import generate from "../src/generator.js"
import * as core from "../src/core.js"

// ── Shorthand factories ───────────────────────────────────────────────────

const num = n => core.numericLiteral(n)
const str = s => core.stringLiteral(s)
const truth = () => core.truthLiteral()
const illusion = () => core.illusionLiteral()
const id = name => core.identifier(name)
const binary = (op, l, r) => core.binaryExpression(op, l, r)
const unary = (op, operand) => core.unaryExpression(op, operand)
const creation = exp => core.creationStatement(exp)
const jutsu = (name, init) => core.jutsuStatement(name, init)
const assign = (target, source) => core.assignStatement(target, source)
const ret = val => core.returnStatement(val)

describe("The generator", () => {
  // ── Literals ────────────────────────────────────────────────────────────

  it("generates a numeric integer", () => {
    assert.equal(generate(num(42)), "42")
  })

  it("generates a numeric float", () => {
    assert.equal(generate(num(3.14)), "3.14")
  })

  it("generates a string literal", () => {
    assert.equal(generate(str("hello")), '"hello"')
  })

  it("generates a string with special characters", () => {
    assert.equal(generate(str("a\nb")), '"a\\nb"')
  })

  it("generates truth as true", () => {
    assert.equal(generate(truth()), "true")
  })

  it("generates illusion as false", () => {
    assert.equal(generate(illusion()), "false")
  })

  it("generates an identifier", () => {
    assert.equal(generate(id("power")), "power")
  })

  it("generates this", () => {
    assert.equal(generate(core.thisExpression()), "this")
  })

  // ── Expressions ─────────────────────────────────────────────────────────

  it("generates a binary expression", () => {
    assert.equal(generate(binary("+", num(2), num(3))), "(2 + 3)")
  })

  it("generates a comparison expression", () => {
    assert.equal(generate(binary(">", id("x"), num(0))), "(x > 0)")
  })

  it("generates a unary negation", () => {
    assert.equal(generate(unary("-", num(5))), "-(5)")
  })

  it("generates nested binary expressions", () => {
    const node = binary("*", binary("+", num(1), num(2)), num(3))
    assert.equal(generate(node), "((1 + 2) * 3)")
  })

  it("generates a method call expression", () => {
    const node = core.methodCallExpression(id("obj"), "doThing", [num(1), num(2)])
    assert.equal(generate(node), "obj.doThing(1, 2)")
  })

  it("generates a method call with no args", () => {
    const node = core.methodCallExpression(id("hero"), "power", [])
    assert.equal(generate(node), "hero.power()")
  })

  it("generates a member access expression", () => {
    const node = core.memberAccessExpression(id("hero"), "hp")
    assert.equal(generate(node), "hero.hp")
  })

  it("generates a chained member access", () => {
    const inner = core.memberAccessExpression(id("a"), "b")
    const outer = core.memberAccessExpression(inner, "c")
    assert.equal(generate(outer), "a.b.c")
  })

  it("generates a summon expression with no args", () => {
    const node = core.summonExpression("Hero", [])
    assert.equal(generate(node), "new Hero()")
  })

  it("generates a summon expression with args", () => {
    const node = core.summonExpression("Hero", [str("Naruto"), num(9)])
    assert.equal(generate(node), 'new Hero("Naruto", 9)')
  })

  // ── Simple statements ────────────────────────────────────────────────────

  it("generates a creation statement", () => {
    assert.equal(generate(creation(num(1))), "console.log(1)")
  })

  it("generates a jutsu statement", () => {
    assert.equal(generate(jutsu("x", num(5))), "let x = 5")
  })

  it("generates an assign statement with string target", () => {
    assert.equal(generate(assign("x", num(10))), "x = 10")
  })

  it("generates an assign statement with identifier node target", () => {
    assert.equal(generate(assign(id("y"), num(7))), "y = 7")
  })

  it("generates a return statement", () => {
    assert.equal(generate(ret(num(42))), "return 42")
  })

  it("generates a return statement with expression", () => {
    assert.equal(generate(ret(binary("+", id("a"), id("b")))), "return (a + b)")
  })

  it("generates a this field set", () => {
    const node = core.thisFieldSetStatement("hp", num(100))
    assert.equal(generate(node), "this.hp = 100")
  })

  it("generates an obj field set with string object", () => {
    const node = core.objFieldSetStatement("enemy", "hp", num(0))
    assert.equal(generate(node), "enemy.hp = 0")
  })

  it("generates an obj field set with identifier node object", () => {
    const node = core.objFieldSetStatement(id("enemy"), "hp", num(0))
    assert.equal(generate(node), "enemy.hp = 0")
  })

  it("generates an expr statement with string receiver", () => {
    const node = core.exprStatement("hero", "attack", [num(10)])
    assert.equal(generate(node), "hero.attack(10)")
  })

  it("generates an expr statement with no args", () => {
    const node = core.exprStatement("hero", "flee", [])
    assert.equal(generate(node), "hero.flee()")
  })

  it("generates an expr statement with identifier node receiver", () => {
  const node = core.exprStatement(id("hero"), "attack", [num(10)])
  assert.equal(generate(node), "hero.attack(10)")
})


  it("generates a channel statement with no args", () => {
  const node = core.channelStatement([])
  assert.equal(generate(node), "super.awaken()")
})

  it("generates a channel statement with args", () => {
  const node = core.channelStatement([num(1), str("hi")])
  assert.equal(generate(node), 'super.awaken(1, "hi")')
})

  // ── Control flow ─────────────────────────────────────────────────────────

  it("generates a geass with no alternate", () => {
    const node = core.geassStatement(truth(), [creation(num(1))], null)
    const js = generate(node)
    assert.ok(js.includes("if (true)"))
    assert.ok(js.includes("console.log(1)"))
    assert.ok(!js.includes("else"))
  })

  it("generates a geass with empty array alternate", () => {
    const node = core.geassStatement(id("x"), [creation(num(1))], [])
    const js = generate(node)
    assert.ok(!js.includes("else"))
  })

  it("generates a geass with CounterClause alternate", () => {
    const counter = core.counterClause([creation(num(0))])
    const node = core.geassStatement(id("x"), [creation(num(1))], counter)
    const js = generate(node)
    assert.ok(js.includes("if (x)"))
    assert.ok(js.includes("else"))
    assert.ok(js.includes("console.log(0)"))
  })

  it("generates a geass with array alternate (post-optimizer)", () => {
    const node = core.geassStatement(id("x"), [creation(num(1))], [creation(num(0))])
    const js = generate(node)
    assert.ok(js.includes("else"))
    assert.ok(js.includes("console.log(0)"))
  })

  it("generates a CounterClause node directly", () => {
    const node = core.counterClause([creation(num(99))])
    const js = generate(node)
    assert.ok(js.includes("else"))
    assert.ok(js.includes("console.log(99)"))
  })

  it("generates a tsukuyomi statement", () => {
    const node = core.tsukuyomiStatement(
      binary("<", id("i"), num(10)),
      [creation(id("i"))]
    )
    const js = generate(node)
    assert.ok(js.includes("while ((i < 10))"))
    assert.ok(js.includes("console.log(i)"))
  })

  it("generates a tsukuyomi with empty body", () => {
    const node = core.tsukuyomiStatement(truth(), [])
    const js = generate(node)
    assert.ok(js.includes("while (true)"))
  })

  // ── Class declarations ───────────────────────────────────────────────────

  it("generates a world class with no parent", () => {
    const method = core.methodDefinition("awaken", [], [])
    const node = core.worldDeclaration("Hero", null, [method])
    const js = generate(node)
    assert.ok(js.includes("class Hero {"))
    assert.ok(!js.includes("extends"))
    assert.ok(js.includes("awaken()"))
  })

  it("generates a world class with a parent", () => {
    const method = core.methodDefinition("awaken", [], [])
    const node = core.worldDeclaration("Cat", "Animal", [method])
    const js = generate(node)
    assert.ok(js.includes("class Cat extends Animal"))
  })

  it("generates a character class with parent and no awaken", () => {
    const node = core.characterDeclaration("Child", "Parent", [
      core.methodDefinition("foo", [], [core.creationStatement(core.stringLiteral("hi"))])
    ])
    const js = generate(node)
    assert.match(js, /class Child extends Parent \{/)
    assert.match(js, /constructor\(\.\.\.args\)/)
    assert.match(js, /foo\(\) \{/)
    assert.match(js, /console\.log\("hi"\)/)
  })

  it("generates a character class", () => {
    const method = core.methodDefinition("init", [], [])
    const node = core.characterDeclaration("Ninja", null, [method])
    assert.ok(generate(node).includes("class Ninja"))
  })

  it("generates a move class", () => {
    const method = core.methodDefinition("cast", [], [])
    const node = core.moveDeclaration("Fireball", null, [method])
    assert.ok(generate(node).includes("class Fireball"))
  })

  it("generates a method with params and body", () => {
    const method = core.methodDefinition(
      "add",
      ["a", "b"],
      [ret(binary("+", id("a"), id("b")))]
    )
    const js = generate(method)
    assert.ok(js.includes("add(a, b)"))
    assert.ok(js.includes("return (a + b)"))
  })

  it("generates a method with no params and empty body", () => {
    const method = core.methodDefinition("reset", [], [])
    const js = generate(method)
    assert.ok(js.includes("reset()"))
  })

  // ── Program ──────────────────────────────────────────────────────────────

  it("generates a full program", () => {
    const node = core.program([
      jutsu("x", num(10)),
      assign("x", num(20)),
      creation(id("x")),
    ])
    const js = generate(node)
    assert.ok(js.includes("let x = 10"))
    assert.ok(js.includes("x = 20"))
    assert.ok(js.includes("console.log(x)"))
  })

  it("generates an empty program", () => {
    assert.equal(generate(core.program([])), "")
  })

  // ── Indentation ──────────────────────────────────────────────────────────

  it("indents method bodies inside a class", () => {
    const method = core.methodDefinition("greet", [], [creation(str("hi"))])
    const node = core.worldDeclaration("Greeter", null, [method])
    const js = generate(node)
    // The method body line should be indented twice (class body + method body)
    assert.ok(js.includes('    console.log("hi")'))
  })

  it("indents if-body", () => {
    const node = core.geassStatement(truth(), [creation(num(1))], null)
    const js = generate(node)
    assert.ok(js.includes("  console.log(1)"))
  })

  it("indents while-body", () => {
    const node = core.tsukuyomiStatement(truth(), [creation(num(1))])
    const js = generate(node)
    assert.ok(js.includes("  console.log(1)"))
  })
})