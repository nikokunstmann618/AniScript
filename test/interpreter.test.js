import { test } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import interpret from "../src/interpreter.js"

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse + interpret a snippet, capturing every console.log call. */
function runCapture(source) {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  try {
    interpret(parse(source))
  } finally {
    console.log = orig
  }
  return logs
}

/** Parse + interpret; just confirm it doesn't throw. */
function run(source) {
  interpret(parse(source))
}

// Keyword reference (updated):
//   nakama  → jutsu
//   shout   → creation
//   kakugo  → geass
//   tatakai → tsukuyomi
//   yatta   → truth
//   dame    → dame       (unchanged)
//   OOP keywords unchanged: world, character, move, summon, channel, this, kaeru, masaka


// ═══════════════════════════════════════════════════════════════════════════
// 1. ARITHMETIC — assert actual computed values, not just "no throw"
// ═══════════════════════════════════════════════════════════════════════════

test("arithmetic: addition produces correct value", () => {
  const [result] = runCapture("jutsu x = 3 + 4\ncreation(x)")
  assert.equal(result, "7")
})

test("arithmetic: subtraction produces correct value", () => {
  const [result] = runCapture("jutsu x = 10 - 3\ncreation(x)")
  assert.equal(result, "7")
})

test("arithmetic: multiplication produces correct value", () => {
  const [result] = runCapture("jutsu x = 6 * 7\ncreation(x)")
  assert.equal(result, "42")
})

test("arithmetic: division produces correct value", () => {
  const [result] = runCapture("jutsu x = 10 / 2\ncreation(x)")
  assert.equal(result, "5")
})

test("arithmetic: modulo produces correct value", () => {
  const [result] = runCapture("jutsu x = 10 % 3\ncreation(x)")
  assert.equal(result, "1")
})

test("arithmetic: exponentiation produces correct value", () => {
  // 2 ** 8 = 256
  const [result] = runCapture("jutsu x = 2 ** 8\ncreation(x)")
  assert.equal(result, "256")
})

test("arithmetic: unary negation produces correct value", () => {
  const [result] = runCapture("jutsu x = -5\ncreation(x)")
  assert.equal(result, "-5")
})

test("arithmetic: operator precedence (* before +)", () => {
  // 2 + 3 * 4 = 14, not 20
  const [result] = runCapture("jutsu x = 2 + 3 * 4\ncreation(x)")
  assert.equal(result, "14")
})

test("arithmetic: parentheses override precedence", () => {
  // (2 + 3) * 4 = 20
  const [result] = runCapture("jutsu x = (2 + 3) * 4\ncreation(x)")
  assert.equal(result, "20")
})

test("arithmetic: float values work at runtime", () => {
  const [result] = runCapture("jutsu x = 3.14\ncreation(x)")
  assert.equal(result, "3.14")
})

test("arithmetic: float addition", () => {
  const [result] = runCapture("jutsu x = 1.5 + 2.5\ncreation(x)")
  assert.equal(result, "4")
})


// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPARISON OPERATORS — check the boolean results, not just no-throw
// ═══════════════════════════════════════════════════════════════════════════

test("comparison: < returns truth when true", () => {
  const [result] = runCapture("creation(3 < 5)")
  assert.equal(result, "truth")
})

test("comparison: < returns dame when false", () => {
  const [result] = runCapture("creation(5 < 3)")
  assert.equal(result, "dame")
})

test("comparison: > returns truth when true", () => {
  const [result] = runCapture("creation(5 > 3)")
  assert.equal(result, "truth")
})

test("comparison: <= returns truth for equal values", () => {
  const [result] = runCapture("creation(5 <= 5)")
  assert.equal(result, "truth")
})

test("comparison: >= returns truth for greater value", () => {
  const [result] = runCapture("creation(6 >= 5)")
  assert.equal(result, "truth")
})

test("comparison: == returns truth for equal numbers", () => {
  const [result] = runCapture("creation(7 == 7)")
  assert.equal(result, "truth")
})

test("comparison: == returns dame for different values", () => {
  const [result] = runCapture("creation(7 == 8)")
  assert.equal(result, "dame")
})

test("comparison: != returns truth for different values", () => {
  const [result] = runCapture("creation(7 != 8)")
  assert.equal(result, "truth")
})

test("comparison: == works for string equality", () => {
  const [result] = runCapture('creation("abc" == "abc")')
  assert.equal(result, "truth")
})

test("comparison: == returns dame for different strings", () => {
  const [result] = runCapture('creation("abc" == "xyz")')
  assert.equal(result, "dame")
})

test("comparison: boolean equality — truth == truth", () => {
  const [result] = runCapture("creation(truth == truth)")
  assert.equal(result, "truth")
})

test("comparison: boolean equality — truth == dame", () => {
  const [result] = runCapture("creation(truth == dame)")
  assert.equal(result, "dame")
})


// ═══════════════════════════════════════════════════════════════════════════
// 3. STRINGS — escape sequences and coercion with formatValue
// ═══════════════════════════════════════════════════════════════════════════

test("string: newline escape sequence is interpreted", () => {
  const [result] = runCapture('creation("a\\nb")')
  assert.equal(result, "a\nb")
})

test("string: tab escape sequence is interpreted", () => {
  const [result] = runCapture('creation("a\\tb")')
  assert.equal(result, "a\tb")
})

test("string: backslash escape sequence is interpreted", () => {
  const [result] = runCapture('creation("a\\\\b")')
  assert.equal(result, "a\\b")
})

test("string: double-quote escape sequence is interpreted", () => {
  const [result] = runCapture('creation("say \\"hi\\"")')
  assert.equal(result, 'say "hi"')
})

test("string + number coerces number to string", () => {
  const [result] = runCapture('creation("level: " + 9001)')
  assert.equal(result, "level: 9001")
})

test("number + string coerces number to string", () => {
  const [result] = runCapture('creation(9001 + " power")')
  assert.equal(result, "9001 power")
})

test("string + truth coerces boolean to 'truth'", () => {
  const [result] = runCapture('creation("result: " + truth)')
  assert.equal(result, "result: truth")
})

test("string + dame coerces boolean to 'dame'", () => {
  const [result] = runCapture('creation("result: " + dame)')
  assert.equal(result, "result: dame")
})

test("string: carriage return escape sequence is interpreted", () => {
  const [result] = runCapture('jutsu s = "a\\rb"\ncreation(s)')
  assert.equal(result, "a\rb")
})

test("string: unrecognized escape sequence returns the character itself", () => {
  // \z is not a defined escape — the ?? fallback should return "z"
  const [result] = runCapture('jutsu s = "a\\zb"\ncreation(s)')
  assert.equal(result, "azb")
})


// ═══════════════════════════════════════════════════════════════════════════
// 4. SCOPE — block scoping, shadowing, variable lifetime
// ═══════════════════════════════════════════════════════════════════════════

test("scope: geass body cannot leak variable to outer scope", () => {
  const match = parse("geass truth { jutsu inner = 1 }\ncreation(inner)")
  assert.throws(() => interpret(match), /NANI/)
})

test("scope: tsukuyomi body cannot leak variable to outer scope", () => {
  const match = parse("jutsu i = 0\ntsukuyomi i < 1 { jutsu inner = 99\ni = i + 1 }\ncreation(inner)")
  assert.throws(() => interpret(match), /NANI/)
})

test("scope: outer variable is visible inside geass block", () => {
  const [result] = runCapture("jutsu x = 42\ngeass truth { creation(x) }")
  assert.equal(result, "42")
})

test("scope: assignment inside block updates outer variable", () => {
  const [result] = runCapture("jutsu x = 0\ngeass truth { x = x + 1 }\ncreation(x)")
  assert.equal(result, "1")
})

test("scope: re-declaring same var in same scope throws", () => {
  const match = parse("jutsu x = 1\njutsu x = 2")
  assert.throws(() => interpret(match), /NANI/)
})

test("scope: jutsu in nested scope is allowed (it's a new scope)", () => {
  assert.doesNotThrow(() => run("jutsu x = 1\ngeass truth { jutsu x = 2\ncreation(x) }"))
})

test("scope: inner jutsu does not clobber outer variable", () => {
  const logs = runCapture("jutsu x = 1\ngeass truth { jutsu x = 99 }\ncreation(x)")
  assert.equal(logs[0], "1")
})


// ═══════════════════════════════════════════════════════════════════════════
// 5. TSUKUYOMI (while loop) — correct iteration count
// ═══════════════════════════════════════════════════════════════════════════

test("tsukuyomi: runs exactly N times", () => {
  const logs = runCapture(
    "jutsu i = 0\ntsukuyomi i < 5 { creation(i)\ni = i + 1 }"
  )
  assert.equal(logs.length, 5)
  assert.deepEqual(logs, ["0", "1", "2", "3", "4"])
})

test("tsukuyomi: body never runs when condition is immediately false", () => {
  const logs = runCapture("jutsu i = 10\ntsukuyomi i < 5 { creation(i)\ni = i + 1 }")
  assert.equal(logs.length, 0)
})

test("tsukuyomi: throws when condition is not boolean", () => {
  const match = parse("jutsu i = 0\ntsukuyomi i { creation(i)\ni = i + 1 }")
  assert.throws(() => interpret(match), /NANI/)
})

test("tsukuyomi: accumulates a sum correctly", () => {
  // sum = 0+1+2+3+4 = 10
  const logs = runCapture(
    "jutsu i = 0\njutsu sum = 0\ntsukuyomi i < 5 { sum = sum + i\ni = i + 1 }\ncreation(sum)"
  )
  assert.equal(logs[0], "10")
})


// ═══════════════════════════════════════════════════════════════════════════
// 6. GEASS (if/else) — branch correctness
// ═══════════════════════════════════════════════════════════════════════════

test("geass: true branch runs, masaka branch does not", () => {
  const logs = runCapture(
    'jutsu x = 10\ngeass x > 5 { creation("big") } masaka { creation("small") }'
  )
  assert.deepEqual(logs, ["big"])
})

test("geass: masaka branch runs when condition is false", () => {
  const logs = runCapture(
    'jutsu x = 1\ngeass x > 5 { creation("big") } masaka { creation("small") }'
  )
  assert.deepEqual(logs, ["small"])
})

test("geass: no masaka, false condition — nothing runs", () => {
  const logs = runCapture('jutsu x = 1\ngeass x > 5 { creation("big") }')
  assert.equal(logs.length, 0)
})


// ═══════════════════════════════════════════════════════════════════════════
// 7. OOP — method with multiple parameters
// ═══════════════════════════════════════════════════════════════════════════

test("method with multiple parameters receives all arguments", () => {
  const logs = runCapture(`
world Calculator {
  awaken() { this.result = 0 }
  add(a, b) { this.result = a + b }
}
jutsu c = summon Calculator()
c.add(3, 4)
creation(c.result)
`)
  assert.equal(logs[0], "7")
})

test("method parameter is local — does not affect outer scope", () => {
  const logs = runCapture(`
jutsu x = 99
world Box {
  awaken() { this.v = 0 }
  set(x) { this.v = x }
}
jutsu b = summon Box()
b.set(1)
creation(x)
`)
  assert.equal(logs[0], "99")
})

test("kaeru with no explicit value returns null (method result is null)", () => {
  const logs = runCapture(`
world Noop {
  awaken() { this.x = 0 }
  doNothing() { this.x = 1 }
}
jutsu n = summon Noop()
jutsu result = n.doNothing()
creation(result)
`)
  assert.equal(logs[0], "null")
})


// ═══════════════════════════════════════════════════════════════════════════
// 8. OOP — error cases
// ═══════════════════════════════════════════════════════════════════════════

test("throws on accessing non-existent field on a valid instance", () => {
  const match = parse(`
world Leaf { awaken() { this.x = 1 } }
jutsu w = summon Leaf()
creation(w.missingField)
`)
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when calling channel() outside any method", () => {
  const match = parse("channel()")
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when channel() is used in a class with no parent", () => {
  const match = parse(`
world Lone { awaken() { channel() } }
jutsu x = summon Lone()
`)
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when parent class has no awaken to channel", () => {
  const match = parse(`
world Base { greet() { creation("hi") } }
character Child from Base { awaken() { channel() } }
jutsu c = summon Child()
`)
  assert.throws(() => interpret(match), /NANI/)
})

test("throws when calling a non-existent method on an instance", () => {
  const match = parse(`
world Leaf { awaken() { this.x = 1 } }
jutsu w = summon Leaf()
w.vanish()
`)
  assert.throws(() => interpret(match), /NANI/)
})

test("throws on method call expression on a non-instance", () => {
  const match = parse('jutsu x = "hello"\njutsu y = x.toUpper()')
  assert.throws(() => interpret(match), /NANI/)
})


// ═══════════════════════════════════════════════════════════════════════════
// 9. MOVE class used standalone (not just in three-tier)
// ═══════════════════════════════════════════════════════════════════════════

test("move class can be summoned and used independently", () => {
  const logs = runCapture(`
move Fireball {
  awaken(dmg) { this.dmg = dmg }
  describe() { creation("Damage: " + this.dmg) }
}
jutsu fb = summon Fireball(50)
fb.describe()
`)
  assert.equal(logs[0], "Damage: 50")
})


// ═══════════════════════════════════════════════════════════════════════════
// 10. MISC — edge cases worth pinning down
// ═══════════════════════════════════════════════════════════════════════════

test("creation prints the number 0 correctly", () => {
  const [result] = runCapture("creation(0)")
  assert.equal(result, "0")
})

test("creation prints negative number correctly", () => {
  const [result] = runCapture("creation(-42)")
  assert.equal(result, "-42")
})

test("empty string is valid and prints as empty", () => {
  const [result] = runCapture('creation("")')
  assert.equal(result, "")
})

test("variable reassignment works correctly", () => {
  const [result] = runCapture("jutsu x = 1\nx = 2\nx = 3\ncreation(x)")
  assert.equal(result, "3")
})

test("chained arithmetic stays correct", () => {
  const [result] = runCapture("jutsu x = 1 + 2 + 3 + 4\ncreation(x)")
  assert.equal(result, "10")
})

test("formatValue: instance prints as [ClassName]", () => {
  const logs = runCapture(`
world Hero { awaken() { this.x = 1 } }
jutsu h = summon Hero()
creation(h)
`)
  assert.equal(logs[0], "[Hero]")
})

// ═══════════════════════════════════════════════════════════════════════════
// 11. COVERAGE — branches not yet exercised
// ═══════════════════════════════════════════════════════════════════════════

// Covers _registerClass with no parent (parentIds.children.length === 0 branch)
// Previously all class tests used inheritance; this pins the parentless path.
test("coverage: class with no parent registers correctly", () => {
  const logs = runCapture(`
world Solo {
  awaken() { this.x = 7 }
  val() { kaeru this.x }
}
jutsu s = summon Solo()
creation(s.val())
`)
  assert.equal(logs[0], "7")
})

// Covers Primary_thisRef returning `this` from a method (the failing test fixed)
test("coverage: this can be returned directly from a method", () => {
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

// Covers the Condition_binary subtraction branch (only + was tested before)
test("coverage: Condition_binary subtraction branch", () => {
  const [result] = runCapture("creation(10 - 3)")
  assert.equal(result, "7")
})

// Covers TsukuyomiStmt's initial boolean check on a non-boolean (redundant throw path)
// This specifically exercises the first exp.interpret() call before the while loop
test("coverage: tsukuyomi initial check throws on non-boolean", () => {
  const match = parse('jutsu s = "nope"\ntsukuyomi s { s = s }')
  assert.throws(() => interpret(match), /NANI/)
})

// Covers ExprStmt where receiver is `this` (method call statement on this inside a method)
test("coverage: method call statement using this as receiver inside a method", () => {
  const logs = runCapture(`
world Chain {
  awaken() { this.x = 0 }
  inc() { this.x = this.x + 1 }
  run() { this.inc() }
}
jutsu c = summon Chain()
c.run()
creation(c.x)
`)
  assert.equal(logs[0], "1")
})

// Covers kaeru with explicit null-like return from a void method used in expression
test("coverage: method with no kaeru returns null when used in expression", () => {
  const logs = runCapture(`
world Void {
  awaken() { this.v = 0 }
  noop() { this.v = 1 }
}
jutsu o = summon Void()
jutsu r = o.noop()
creation(r)
`)
  assert.equal(logs[0], "null")
})

// Covers formatValue for null explicitly
test("coverage: formatValue handles null (from void method result)", () => {
  const logs = runCapture(`
world Nully {
  awaken() { this.x = 0 }
  nothing() { this.x = 0 }
}
jutsu n = summon Nully()
jutsu res = n.nothing()
creation(res)
`)
  assert.equal(logs[0], "null")
})

// ═══════════════════════════════════════════════════════════════════════════
// 12. COVERAGE — hit the remaining two branch gaps (lines 242-243, 358-359)
// ═══════════════════════════════════════════════════════════════════════════

// Covers the `?? null` branch in callMethod (argValues[i] ?? null)
// — call a method with fewer arguments than declared parameters
test("coverage: calling method with fewer args than params fills missing with null", () => {
  const logs = []
  const orig = console.log
  console.log = v => logs.push(v)
  run(`
world Box {
  awaken() { this.v = 0 }
  set(a, b) { this.v = a this.missing = b }
}
jutsu b = summon Box()
b.set(99, 42)
creation(b.v)
b.set(10)
creation(b.missing)
`)
  console.log = orig
  assert.equal(logs[0], "99")
  assert.equal(logs[1], "null")
})

// Covers the `?? char.sourceString` fallback in strchar_escape
// — already tested as "unrecognized escape sequence" in interpreter.test.js,
// but if c8 still shows it uncovered, add a direct targeted version:
test("coverage: strchar_escape fallback for unrecognized escape char", () => {
  const [result] = runCapture('creation("\\q")')
  assert.equal(result, "q")
})

// Covers the parentName ternary null branch in _registerClass
// — a world/character/move declared WITHOUT `from` sets parentName = null
// The ternary `parentIds.children.length > 0 ? ... : null` null-branch
test("coverage: _registerClass sets parentName null when no from clause", () => {
  const logs = runCapture(`
world Standalone {
  awaken() { this.v = 99 }
}
jutsu s = summon Standalone()
creation(s.v)
`)
  assert.equal(logs[0], "99")
})

test("throws when calling non-existent method on instance in expression position", () => {
  const match = parse(`
world Leaf { awaken() { this.x = 1 } }
jutsu w = summon Leaf()
jutsu v = w.vanish()
`)
  assert.throws(() => interpret(match), /NANI/)
})