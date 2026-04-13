import { test } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import interpret from "../src/interpreter.js"

// Helper: parse and interpret a snippet, capturing stdout
function run(source) {
  const match = parse(source)
  interpret(match)
}

// ── Parsing ────────────────────────────────────────────────────────────────

test("parses an empty program", () => {
  assert.doesNotThrow(() => parse(""))
})

test("parses a shout statement", () => {
  assert.doesNotThrow(() => parse('shout("Dattebayo!")'))
})

test("parses a nakama declaration", () => {
  assert.doesNotThrow(() => parse("nakama x = 42"))
})

test("parses a kakugo statement", () => {
  assert.doesNotThrow(() => parse("nakama x = 5\nkakugo x > 3 { shout(x) }"))
})

test("parses a kakugo/masaka statement", () => {
  assert.doesNotThrow(() =>
    parse("nakama x = 1\nkakugo x == 1 { shout(x) } masaka { shout(x) }")
  )
})

test("parses a tatakai loop", () => {
  assert.doesNotThrow(() =>
    parse("nakama i = 0\ntatakai i < 3 { i = i + 1 }")
  )
})

test("parses float numbers", () => {
  assert.doesNotThrow(() => parse("nakama pi = 3.14"))
})

test("parses string literals", () => {
  assert.doesNotThrow(() => parse('nakama s = "Senpai noticed me!"'))
})

test("parses string escape sequences", () => {
  assert.doesNotThrow(() => parse('shout("Line 1\\nLine 2")'))
})

test("parses yatta and dame", () => {
  assert.doesNotThrow(() => parse("nakama win = yatta\nnakama lose = dame"))
})

test("parses all relational operators", () => {
  for (const op of ["<", ">", "<=", ">=", "==", "!="]) {
    assert.doesNotThrow(() => parse(`nakama x = 1\nkakugo x ${op} 0 { shout(x) }`))
  }
})

test("rejects unknown syntax", () => {
  assert.throws(() => parse("???"))
})

// ── Runtime errors ─────────────────────────────────────────────────────────

test("throws on undeclared variable read", () => {
  const match = parse("shout(ghost)")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on double declaration", () => {
  const match = parse("nakama x = 1\nnakama x = 2")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on assignment to undeclared variable", () => {
  const match = parse("ghost = 5")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when kakugo condition is not boolean", () => {
  const match = parse("nakama x = 5\nkakugo x { shout(x) }")
  assert.throws(() => interpret(match), /NANI/)
})

// ── Correct execution (stdout capture via mock) ────────────────────────────

test("arithmetic: addition", () => {
  // Just check it doesn't throw
  assert.doesNotThrow(() => run("nakama x = 3 + 4\nshout(x)"))
})

test("arithmetic: subtraction", () => {
  assert.doesNotThrow(() => run("nakama x = 10 - 3\nshout(x)"))
})

test("arithmetic: multiplication", () => {
  assert.doesNotThrow(() => run("nakama x = 6 * 7\nshout(x)"))
})

test("arithmetic: division", () => {
  assert.doesNotThrow(() => run("nakama x = 10 / 2\nshout(x)"))
})

test("arithmetic: modulo", () => {
  assert.doesNotThrow(() => run("nakama x = 10 % 3\nshout(x)"))
})

test("arithmetic: exponentiation", () => {
  assert.doesNotThrow(() => run("nakama x = 2 ** 8\nshout(x)"))
})

test("negation", () => {
  assert.doesNotThrow(() => run("nakama x = -5\nshout(x)"))
})

test("string concatenation with +", () => {
  assert.doesNotThrow(() => run('nakama s = "Hello, " + "world!"\nshout(s)'))
})

test("kakugo true branch", () => {
  assert.doesNotThrow(() => run('nakama x = 10\nkakugo x > 5 { shout("big") }'))
})

test("kakugo masaka branch", () => {
  assert.doesNotThrow(() =>
    run('nakama x = 1\nkakugo x > 5 { shout("big") } masaka { shout("small") }')
  )
})

test("tatakai executes body", () => {
  assert.doesNotThrow(() =>
    run("nakama i = 0\ntatakai i < 3 { i = i + 1 }\nshout(i)")
  )
})

test("shout prints yatta for true", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run("shout(yatta)")
  console.log = orig
  assert.equal(logs[0], "yatta")
})

test("shout prints dame for false", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run("shout(dame)")
  console.log = orig
  assert.equal(logs[0], "dame")
})

test("comments are ignored", () => {
  assert.doesNotThrow(() =>
    run("// This is a comment\nnakama x = 1 // inline comment\nshout(x)")
  )
})

test("parenthesised expressions", () => {
  assert.doesNotThrow(() => run("nakama x = (2 + 3) * 4\nshout(x)"))
})

// ── OOP: Parsing ───────────────────────────────────────────────────────────

test("parses a world declaration", () => {
  assert.doesNotThrow(() => parse('world Leaf { awaken(n) { this.n = n } }'))
})

test("parses a character declaration", () => {
  assert.doesNotThrow(() => parse('character Hero { awaken(n) { this.n = n } }'))
})

test("parses a move declaration", () => {
  assert.doesNotThrow(() => parse('move Slash { awaken(p) { this.p = p } }'))
})

test("parses inheritance with from", () => {
  assert.doesNotThrow(() =>
    parse('world Base { awaken() { this.x = 1 } }\ncharacter Sub from Base { awaken() { channel() } }')
  )
})

test("parses summon expression", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken(n) { this.n = n } }\nnakama w = summon Leaf("hi")')
  )
})

test("parses field access in expression", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken(n) { this.n = n } }\nnakama w = summon Leaf("hi")\nshout(w.n)')
  )
})

test("parses method call as statement", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } greet() { shout("hi") } }\nnakama w = summon Leaf()\nw.greet()')
  )
})

test("parses method call in expression (return value)", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 5 } get() { kaeru this.x } }\nnakama w = summon Leaf()\nnakama v = w.get()')
  )
})

test("parses this field set", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } bump() { this.x = this.x + 1 } }')
  )
})

test("parses obj field set", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } }\nnakama w = summon Leaf()\nw.x = 99')
  )
})

test("parses kaeru statement", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } val() { kaeru this.x } }')
  )
})

// ── OOP: Runtime ───────────────────────────────────────────────────────────

test("summon creates an instance", () => {
  assert.doesNotThrow(() => run('world Leaf { awaken(n) { this.n = n } }\nnakama w = summon Leaf("test")'))
})

test("field set and get work", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken(v) { this.v = v } }\nnakama w = summon Leaf(42)\nshout(w.v)')
  console.log = orig
  assert.equal(logs[0], "42")
})

test("method call produces side effect", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken() { this.x = 1 } greet() { shout("hi") } }\nnakama w = summon Leaf()\nw.greet()')
  console.log = orig
  assert.equal(logs[0], "hi")
})

test("method can return a value with kaeru", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken() { this.x = 7 } get() { kaeru this.x } }\nnakama w = summon Leaf()\nnakama v = w.get()\nshout(v)')
  console.log = orig
  assert.equal(logs[0], "7")
})

test("obj field set updates instance field", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken() { this.x = 1 } }\nnakama w = summon Leaf()\nw.x = 99\nshout(w.x)')
  console.log = orig
  assert.equal(logs[0], "99")
})

test("inheritance: child gets parent fields via channel", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run(`
world Base { awaken(n) { this.n = n } }
character Child from Base { awaken(n) { channel(n) } }
nakama c = summon Child("hello")
shout(c.n)
`)
  console.log = orig
  assert.equal(logs[0], "hello")
})

test("inheritance: child inherits parent method", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run(`
world Base { awaken(n) { this.n = n } greet() { shout("Base: " + this.n) } }
character Child from Base { awaken(n) { channel(n) } }
nakama c = summon Child("world")
c.greet()
`)
  console.log = orig
  assert.equal(logs[0], "Base: world")
})

test("method overriding: child method takes precedence", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run(`
world Base { awaken() { this.x = 1 } greet() { shout("base") } }
character Child from Base { awaken() { channel() } greet() { shout("child") } }
nakama c = summon Child()
c.greet()
`)
  console.log = orig
  assert.equal(logs[0], "child")
})

test("three-tier hierarchy works end-to-end", () => {
  assert.doesNotThrow(() => run(`
world Narutoverse { awaken(n) { this.name = n } }
character Shinobi from Narutoverse {
  awaken(n, r) { channel(n) this.rank = r this.hp = 100 }
  isAlive() { kaeru this.hp > 0 }
}
move Rasengan {
  awaken(p) { this.power = p }
  unleash(target) { target.hp = target.hp - this.power }
}
nakama s = summon Shinobi("Naruto", "Genin")
nakama r = summon Rasengan(30)
r.unleash(s)
shout(s.hp)
`))
})

test("throws when summoning an unknown class", () => {
  const match = parse('nakama x = summon Ghost()')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on field access of non-instance", () => {
  const match = parse('nakama x = 5\nshout(x.field)')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on method call on non-instance", () => {
  const match = parse('nakama x = 5\nx.greet()')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when extending unknown class", () => {
  const match = parse('character Hero from Ghost { awaken() { this.x = 1 } }')
  assert.throws(() => interpret(match), /NANI/)
})
