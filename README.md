# AnimeScript 🗡️

> *"A programming language where every line of code is a battle cry."*

AnimeScript is a simple, anime-themed scripting language. It takes inspiration from [BabyJS](https://github.com/rtoal/babyjs) and replaces every keyword with a reference from your favorite shows.  
Files use the `.ani` extension.

---

## Keywords

| AnimeScript | Meaning | Replaces |
|-------------|---------|----------|
| `nakama`    | "comrade" — declaring a variable is making a new friend | `let` |
| `shout`     | print to the console (anime characters love yelling) | `print` |
| `kakugo`    | "readiness/resolve" — prepare for battle | `if` |
| `masaka`    | "no way!" — the unexpected else branch | `else` |
| `tatakai`   | "battle" — keep fighting while the condition holds | `while` |
| `yatta`     | "I did it!" — boolean true | `true` |
| `dame`      | "no good" — boolean false | `false` |

---

## Quick Start

```bash
npm install
node src/animescript.js examples/hello.ani
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

### Print — `shout`

```animescript
shout("Dattebayo!")
shout(power)
shout("Level: " + power)
```

Booleans print as `yatta` / `dame`.

### Conditionals — `kakugo` / `masaka`

```animescript
kakugo power > 9000 {
  shout("It's over 9000!!!")
} masaka {
  shout("Keep training...")
}
```

### While loop — `tatakai`

```animescript
nakama i = 1
tatakai i <= 10 {
  shout(i)
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
shout(greeting)
```

### Fibonacci

```animescript
nakama a = 0
nakama b = 1
nakama count = 0

tatakai count < 10 {
  shout(a)
  nakama next = a + b
  a = b
  b = next
  count = count + 1
}
```

### Power Level Check

```animescript
nakama power = 9001

kakugo power > 9000 {
  shout("It's over 9000!!!")
} masaka {
  shout("Power level is within limits.")
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
