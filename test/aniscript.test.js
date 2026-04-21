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

test("parses a creation statement", () => {
  assert.doesNotThrow(() => parse('creation("Dattebayo!")'))
})

test("parses a jutsu declaration", () => {
  assert.doesNotThrow(() => parse("jutsu x = 42"))
})

test("parses a geass statement", () => {
  assert.doesNotThrow(() => parse("jutsu x = 5\ngeass x > 3 { creation(x) }"))
})

test("parses a geass/masaka statement", () => {
  assert.doesNotThrow(() =>
    parse("jutsu x = 1\ngeass x == 1 { creation(x) } masaka { creation(x) }")
  )
})

test("parses a tsukuyomi loop", () => {
  assert.doesNotThrow(() =>
    parse("jutsu i = 0\ntsukuyomi i < 3 { i = i + 1 }")
  )
})

test("parses float numbers", () => {
  assert.doesNotThrow(() => parse("jutsu pi = 3.14"))
})

test("parses string literals", () => {
  assert.doesNotThrow(() => parse('jutsu s = "Senpai noticed me!"'))
})

test("parses string escape sequences", () => {
  assert.doesNotThrow(() => parse('creation("Line 1\\nLine 2")'))
})

test("parses truth and dame", () => {
  assert.doesNotThrow(() => parse("jutsu win = truth\njutsu lose = dame"))
})

test("parses all relational operators", () => {
  for (const op of ["<", ">", "<=", ">=", "==", "!="]) {
    assert.doesNotThrow(() => parse(`jutsu x = 1\ngeass x ${op} 0 { creation(x) }`))
  }
})

test("rejects unknown syntax", () => {
  assert.throws(() => parse("???"))
})

// ── Runtime errors ─────────────────────────────────────────────────────────

test("throws on undeclared variable read", () => {
  const match = parse("creation(ghost)")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on double declaration", () => {
  const match = parse("jutsu x = 1\njutsu x = 2")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on assignment to undeclared variable", () => {
  const match = parse("ghost = 5")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when geass condition is not boolean", () => {
  const match = parse("jutsu x = 5\ngeass x { creation(x) }")
  assert.throws(() => interpret(match), /NANI/)
})

// ── Correct execution (stdout capture via mock) ────────────────────────────

test("arithmetic: addition", () => {
  assert.doesNotThrow(() => run("jutsu x = 3 + 4\ncreation(x)"))
})

test("arithmetic: subtraction", () => {
  assert.doesNotThrow(() => run("jutsu x = 10 - 3\ncreation(x)"))
})

test("arithmetic: multiplication", () => {
  assert.doesNotThrow(() => run("jutsu x = 6 * 7\ncreation(x)"))
})

test("arithmetic: division", () => {
  assert.doesNotThrow(() => run("jutsu x = 10 / 2\ncreation(x)"))
})

test("arithmetic: modulo", () => {
  assert.doesNotThrow(() => run("jutsu x = 10 % 3\ncreation(x)"))
})

test("arithmetic: exponentiation", () => {
  assert.doesNotThrow(() => run("jutsu x = 2 ** 8\ncreation(x)"))
})

test("negation", () => {
  assert.doesNotThrow(() => run("jutsu x = -5\ncreation(x)"))
})

test("string concatenation with +", () => {
  assert.doesNotThrow(() => run('jutsu s = "Hello, " + "world!"\ncreation(s)'))
})

test("geass true branch", () => {
  assert.doesNotThrow(() => run('jutsu x = 10\ngeass x > 5 { creation("big") }'))
})

test("geass masaka branch", () => {
  assert.doesNotThrow(() =>
    run('jutsu x = 1\ngeass x > 5 { creation("big") } masaka { creation("small") }')
  )
})

test("tsukuyomi executes body", () => {
  assert.doesNotThrow(() =>
    run("jutsu i = 0\ntsukuyomi i < 3 { i = i + 1 }\ncreation(i)")
  )
})

test("creation prints truth for true", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run("creation(truth)")
  console.log = orig
  assert.equal(logs[0], "truth")
})

test("creation prints dame for false", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run("creation(dame)")
  console.log = orig
  assert.equal(logs[0], "dame")
})

test("comments are ignored", () => {
  assert.doesNotThrow(() =>
    run("// This is a comment\njutsu x = 1 // inline comment\ncreation(x)")
  )
})

test("parenthesised expressions", () => {
  assert.doesNotThrow(() => run("jutsu x = (2 + 3) * 4\ncreation(x)"))
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
    parse('world Leaf { awaken(n) { this.n = n } }\njutsu w = summon Leaf("hi")')
  )
})

test("parses field access in expression", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken(n) { this.n = n } }\njutsu w = summon Leaf("hi")\ncreation(w.n)')
  )
})

test("parses method call as statement", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } greet() { creation("hi") } }\njutsu w = summon Leaf()\nw.greet()')
  )
})

test("parses method call in expression (return value)", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 5 } get() { kaeru this.x } }\njutsu w = summon Leaf()\njutsu v = w.get()')
  )
})

test("parses this field set", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } bump() { this.x = this.x + 1 } }')
  )
})

test("parses obj field set", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } }\njutsu w = summon Leaf()\nw.x = 99')
  )
})

test("parses kaeru statement", () => {
  assert.doesNotThrow(() =>
    parse('world Leaf { awaken() { this.x = 1 } val() { kaeru this.x } }')
  )
})

// ── OOP: Runtime ───────────────────────────────────────────────────────────

test("summon creates an instance", () => {
  assert.doesNotThrow(() => run('world Leaf { awaken(n) { this.n = n } }\njutsu w = summon Leaf("test")'))
})

test("field set and get work", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken(v) { this.v = v } }\njutsu w = summon Leaf(42)\ncreation(w.v)')
  console.log = orig
  assert.equal(logs[0], "42")
})

test("method call produces side effect", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken() { this.x = 1 } greet() { creation("hi") } }\njutsu w = summon Leaf()\nw.greet()')
  console.log = orig
  assert.equal(logs[0], "hi")
})

test("method can return a value with kaeru", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken() { this.x = 7 } get() { kaeru this.x } }\njutsu w = summon Leaf()\njutsu v = w.get()\ncreation(v)')
  console.log = orig
  assert.equal(logs[0], "7")
})

test("obj field set updates instance field", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run('world Leaf { awaken() { this.x = 1 } }\njutsu w = summon Leaf()\nw.x = 99\ncreation(w.x)')
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
jutsu c = summon Child("hello")
creation(c.n)
`)
  console.log = orig
  assert.equal(logs[0], "hello")
})

test("inheritance: child inherits parent method", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run(`
world Base { awaken(n) { this.n = n } greet() { creation("Base: " + this.n) } }
character Child from Base { awaken(n) { channel(n) } }
jutsu c = summon Child("world")
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
world Base { awaken() { this.x = 1 } greet() { creation("base") } }
character Child from Base { awaken() { channel() } greet() { creation("child") } }
jutsu c = summon Child()
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
jutsu s = summon Shinobi("Naruto", "Genin")
jutsu r = summon Rasengan(30)
r.unleash(s)
creation(s.hp)
`))
})

test("throws when summoning an unknown class", () => {
  const match = parse('jutsu x = summon Ghost()')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on field access of non-instance", () => {
  const match = parse('jutsu x = 5\ncreation(x.field)')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on method call on non-instance", () => {
  const match = parse('jutsu x = 5\nx.greet()')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when extending unknown class", () => {
  const match = parse('character Hero from Ghost { awaken() { this.x = 1 } }')
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when setting field on a non-instance via obj syntax", () => {
  const match = parse('jutsu x = 5\nx.field = 99')
  assert.throws(() => interpret(match), /NANI/)
})

test("Primary_thisRef: this can be returned directly from a method", () => {
  const logs = runCapture(`
world Leaf {
  awaken() { this.x = 42 }
  getSelf() { kaeru this }
}
jutsu w = summon Leaf()
jutsu self = w.getSelf()
creation(self.x)
`)
  assert.equal(logs[0], "42")
})