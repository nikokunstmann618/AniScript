<img width="300" height="300" alt="ani_logo" src="https://github.com/user-attachments/assets/6f331cc7-e7d0-4c63-9082-f149a75d5684" />

# [AniScript](https://nikokunstmann618.github.io/AniScript/) 

> *"A programming language where every line of code is a battle cry."*

AniScript is a simple, anime-themed scripting language. It takes inspiration from [BabyJS](https://github.com/rtoal/babyjs) and replaces every keyword with a reference from your favorite shows.  
Files use the `.ani` extension.

---

## Keywords

| AniScript       | Meaning | Replaces |
|-------------------|---------|----------|
| `jutsu`           |  declaring a variable like making a new technique (ref: Naruto) | `let` |
| `creation`        | print to the console (ref: MHA) | `print` |
| `geass`           | binding condition (ref: CodeGeass) | `if` |
| `counter`         | the opposing else branch | `else` |
| `tsukuyomi`       | while the condition holds (ref: Naruto) | `while` |
| `truth`           | boolean true (ref: FMA) | `true` |
| `illusion`        | boolean false | `false` |

---

## Quick Start

```bash
npm install
node src/aniscript.js examples/hello.ani
```

Or install globally:

```bash
npm link
ani examples/power_level.ani
```

---

## Syntax

### Variables — `jutsu`

```aniscript
jutsu power = 9001
jutsu name = "Naruto"
jutsu isHokage = illusion
```

Reassign with `=`:

```aniscript
power = power + 1
```

### Print — `creation`

```aniscript
creation("Dattebayo!")
creation(power)
creation("Level: " + power)
```
### Boolean (true/false) -  `truth` / `illusion`
Booleans print as `truth` / `illusion`.

```aniscript
jutsu a = truth
jutsu b = illusion
creation(a)   
creation(b)   
```

### Conditionals — `geass` / `counter`

```aniscript
geass power > 9000 {
  creation("It's over 9000!!!")
} counter {
  creation("Keep training...")
}
```

### While loop — `tsukuyomi`

```aniscript
jutsu i = 1
tsukuyomi i <= 10 {
  creation(i)
  i = i + 1
}
```

### Operators

| Category | Symbols |
|----------|---------|
| Arithmetic | `+` `-` `*` `/` `%` `**` |
| Comparison | `<` `>` `<=` `>=` `==` `!=` |
| Unary | `-` (negation) |

### Strings

Double-quoted strings. Supports `\\`, `\"`, `\n`, `\t`.

```aniscript
jutsu greeting = "Konnichiwa, " + name + "!"
```

### Comments

```aniscript
// This is a comment
jutsu x = 5  // inline comment
```

---

## Examples

### Hello World

```aniscript
creation("Hello, world")
```

### GCD

```aniscript
world MathGcd {
  awaken() {}

  run(x, y) { kaeru this.gcd(x, y) }

  gcd(x, y) {
    geass y == 0 {
      kaeru x
    } counter {
      kaeru this.gcd(y, x % y)
    }
  }
}

jutsu m = summon MathGcd()
creation(m.run(5023427, 920311))
```

### Points

```aniscript

world Point {
  awaken(x, y) {
    this.x = x
    this.y = y
  }

  show() {
    creation("Point " + this.x + ", " + this.y)
  }
}

jutsu p0 = summon Point(1, 2)
jutsu p1 = summon Point(3, 5)
jutsu p2 = summon Point(-3, 8)

p0.show()
p1.show()
p2.show()

```

---

## Running Tests

```bash
npm test
```
---

## Project Structure

```
aniscript/
├── src/
│   ├── aniscript.ohm     ← Ohm grammar
│   ├── parser.js         ← Parses source into a match tree
│   ├── interpreter.js    ← Tree-walk interpreter
│   └── aniscript.js      ← CLI entry point
├── examples/
│   ├── hello.ani          … minimal print
│   ├── intro.ani          … strings + loop
│   ├── loops.ani          … counted loop
│   ├── ifs.ani            … nested conditions
│   ├── functions.ani      … method composition
│   ├── gcd.ani            … recursive method
│   ├── points.ani         … small “struct” via move
│   ├── scope.ani          … blocks and names
│   ├── any.ani            … one identity over values
│   ├── optionals.ani      … defaults + small box
│   ├── thirteen.ani       … numeric literals
│   ├── world_building.ani … OOP tiers
│   └── hunterx2.ani       … longer sample
└── test/
    └── aniscript.test.js
```

---

## License

MIT © 2026 nikokunstmann618