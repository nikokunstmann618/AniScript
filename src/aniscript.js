#!/usr/bin/env node
import * as fs from "node:fs"
import parse from "./parser.js"
import interpret from "./interpreter.js"

const BANNER = `
  ░█████╗░███╗░░██╗██╗███╗░░░███╗███████╗
  ██╔══██╗████╗░██║██║████╗░████║██╔════╝
  ███████║██╔██╗██║██║██╔████╔██║█████╗░░
  ██╔══██║██║╚████║██║██║╚██╔╝██║██╔══╝░░
  ██║░░██║██║░╚███║██║██║░╚═╝░██║███████╗
  ╚═╝░░╚═╝╚═╝░░╚══╝╚═╝╚═╝░░░░╚═╝╚══════╝
  ░░░░░░░░░░░  SCRIPT  v0.1.0  ░░░░░░░░░░
`

if (process.argv.length < 3) {
  console.error(BANNER)
  console.error("Usage: ani <file.ani>")
  console.error("")
  console.error("Keywords:")
  console.error("  nakama x = 5          declare a variable (comrade)")
  console.error("  creation(x)              print a value")
  console.error("  judgementChain x > 3 { ... }  if statement (readiness)")
  console.error("  masaka { ... }        else clause (no way!)")
  console.error("  tsukuyomi x < 10 { ... } while loop (battle)")
  console.error("  yatta                 true")
  console.error("  dame                  false")
  process.exit(1)
}

try {
  const sourceCode = fs.readFileSync(process.argv[2], "utf-8")
  const match = parse(sourceCode)
  interpret(match)
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
