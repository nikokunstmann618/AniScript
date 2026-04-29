#!/usr/bin/env node
// aniscript.js – CLI entry point for the AniScript compiler.

import * as fs from "node:fs"
import compile from "./compiler.js"

const BANNER = `
  ░█████╗░███╗░░██╗██╗███╗░░░███╗███████╗
  ██╔══██╗████╗░██║██║████╗░████║██╔════╝
  ███████║██╔██╗██║██║██╔████╔██║█████╗░░
  ██╔══██║██║╚████║██║██║╚██╔╝██║██╔══╝░░
  ██║░░██║██║░╚███║██║██║░╚═╝░██║███████╗
  ╚═╝░░╚═╝╚═╝░░╚══╝╚═╝╚═╝░░░░╚═╝╚══════╝
  ░░░░░░░░░░░  SCRIPT  v0.1.0  ░░░░░░░░░░
`

const USAGE = `Usage: ani [--parse|--analyze|--optimize|--js] <file.ani>

Flags:
  (none)      compile and run the program
  --parse     check syntax only
  --analyze   print the analyzed AST as JSON
  --optimize  print the optimized AST as JSON
  --js        print the generated JavaScript

Keywords:
  jutsu x = 5               declare a variable
  creation(x)               print a value
  geass x > 3 { ... }       if statement
  counter { ... }           else clause
  tsukuyomi x < 10 { ... }  while loop
  truth / illusion          boolean literals
`

const flag = process.argv.find(a => a.startsWith("--"))
const filename = process.argv.slice(2).find(a => !a.startsWith("--"))

if (!filename) {
  console.error(BANNER)
  console.error(USAGE)
  process.exit(1)
}

const outputType = flag ? flag.slice(2) : "js"

try {
  const source = fs.readFileSync(filename, "utf-8")
  const output = compile(source, outputType)
  if (outputType === "parsed") {
    console.log(output)
  } else if (outputType === "js") {
    // Execute the generated JavaScript directly
    // eslint-disable-next-line no-eval
    eval(output)
  } else {
    console.log(JSON.stringify(output, null, 2))
  }
} catch (e) {
  console.error(e.message)
  process.exit(1)
}