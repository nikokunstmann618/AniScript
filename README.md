<img width="300" height="300" alt="ani_logo" src="https://github.com/user-attachments/assets/6f331cc7-e7d0-4c63-9082-f149a75d5684" />

# AnimeScript 🗡️

> *"A programming language where every line of code is a battle cry."*

AnimeScript is a simple, anime-themed scripting language. It takes inspiration from [BabyJS](https://github.com/rtoal/babyjs) and replaces every keyword with a reference from your favorite shows.  
Files use the `.ani` extension.

---

## Keywords

| AnimeScript       | Meaning | Replaces |
|-------------------|---------|----------|
| `jutsu`           |  declaring a variable is making a new friend | `let` |
| `creation`        | print to the console (ref: MHA) | `print` |
| `judgementChain`  | binding condition (ref: HxH) | `if` |
| `masaka`          | "no way!" — the unexpected else branch | `else` |
| `tsukuyomi`       | while the condition holds (ref: Naruto) | `while` |
| `truth`           | boolean true (ref: FMA) | `true` |
| `dame`            | "no good" — boolean false | `false` |

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

```animescript
jutsu power = 9001
jutsu name = "Naruto"
jutsu isHokage = dame
```

Reassign with `=`:

```animescript
power = power + 1
```

### Print — `creation`

```animescript
creation("Dattebayo!")
creation(power)
creation("Level: " + power)
```

Booleans print as `truth` / `dame`.

### Conditionals — `judgementChain` / `masaka`

```animescript
judgementChain power > 9000 {
  creation("It's over 9000!!!")
} masaka {
  creation("Keep training...")
}
```

### While loop — `tsukuyomi`

```animescript
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

```animescript
jutsu greeting = "Konnichiwa, " + name + "!"
```

### Comments

```animescript
// This is a comment
jutsu x = 5  // inline comment
```

---

## Examples

### Hello World

```animescript
jutsu greeting = "Konnichiwa, Sekai!"
creation(greeting)
```

### Fibonacci

```animescript
jutsu a = 0
jutsu b = 1
jutsu count = 0

tsukuyomi count < 10 {
  creation(a)
  jutsu next = a + b
  a = b
  b = next
  count = count + 1
}
```

### Power Level Check

```animescript
jutsu power = 9001

judgementChain power > 9000 {
  creation("It's over 9000!!!")
} masaka {
  creation("Power level is within limits.")
}
```

---

## Running Tests

```bash
npm test
```

---

## Project Structure

```
animescript/
├── src/
│   ├── animescript.ohm   ← Ohm grammar
│   ├── parser.js         ← Parses source into a match tree
│   ├── interpreter.js    ← Tree-walk interpreter
│   └── animescript.js    ← CLI entry point
├── examples/
│   ├── hello.ani
│   ├── power_level.ani
│   ├── jutsu_bond.ani
│   └── fibonacci.ani
└── test/
    └── animescript.test.js
```

---

## License

MIT © 2026 nikokunstmann618
