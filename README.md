# AnimeScript 🗡️

> *"A programming language where every line of code is a battle cry."*

AnimeScript is a simple, anime-themed scripting language. It takes inspiration from [BabyJS](https://github.com/rtoal/babyjs) and replaces every keyword with a reference from your favorite shows.  
Files use the `.ani` extension.

---

## Keywords

| AnimeScript       | Meaning | Replaces |
|-------------------|---------|----------|
| `nakama`          | "comrade" — declaring a variable is making a new friend | `let` |
| `creation`        | print to the console (ref: MHA) | `print` |
| `judgementChain`  | binding condition (ref: HxH) | `if` |
| `masaka`          | "no way!" — the unexpected else branch | `else` |
| `tsukuyomi`       | while the condition holds (ref: Naruto) | `while` |
| `yatta`           | "I did it!" — boolean true | `true` |
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

### Variables — `nakama`

```animescript
nakama power = 9001
nakama name = "Naruto"
nakama isHokage = dame
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

Booleans print as `yatta` / `dame`.

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
nakama i = 1
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
nakama greeting = "Konnichiwa, " + name + "!"
```

### Comments

```animescript
// This is a comment
nakama x = 5  // inline comment
```

---

## Examples

### Hello World

```animescript
nakama greeting = "Konnichiwa, Sekai!"
creation(greeting)
```

### Fibonacci

```animescript
nakama a = 0
nakama b = 1
nakama count = 0

tsukuyomi count < 10 {
  creation(a)
  nakama next = a + b
  a = b
  b = next
  count = count + 1
}
```

### Power Level Check

```animescript
nakama power = 9001

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
│   ├── nakama_bond.ani
│   └── fibonacci.ani
└── test/
    └── animescript.test.js
```

---

## License

MIT © 2026 nikokunstmann618
