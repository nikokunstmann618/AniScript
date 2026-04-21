import { test } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"

const syntaxChecks = [
  ["hello world", 'creation("Hello, world!")'],
  ["declare object", "world Narutoverse { awaken(name) { this.name = name } }"],
  ["initialize object", 'jutsu world1 = summon Narutoverse("Hidden Leaf Village")'],
  ["check attributes", "creation(world1.name)"],
  ["world declaration",
    'world Narutoverse { awaken(name) { this.name = name } addCitizen() { this.population = this.population + 1 } status() { creation("[ " + this.name + " ] Population: " + this.population) } }'],
  ["character declaration with inheritance",
    'character Shinobi from Narutoverse { awaken(name, rank) { channel(name) this.rank = rank this.hp = 100 this.chakra = 80 } train() { this.chakra = this.chakra + 15 creation(this.name + " trains hard! Chakra: " + this.chakra) } info() { creation("-- " + this.name + " [" + this.rank + "] HP:" + this.hp + " CK:" + this.chakra) } isAlive() { kaeru this.hp > 0 } }'],
  ["character override method",
    'character Hokage from Shinobi { awaken(name) { channel(name, "Kage") this.title = "Hokage" } train() { this.chakra = this.chakra + 30 creation(this.name + " (Hokage) trains with full power! Chakra: " + this.chakra) } proclamation() { creation("I, " + this.name + ", will protect this village with my life! Dattebayo!") } }'],
  ["move declaration",
    'move Rasengan { awaken(power) { this.power = power this.name = "Rasengan" this.type = "wind" } unleash(attacker, target) { creation(attacker.name + " unleashes " + this.name + "!") target.hp = target.hp - this.power creation(target.name + " takes " + this.power + " damage. HP: " + target.hp) } describe() { creation(this.name + " [" + this.type + "] Power: " + this.power) } }'],
  ["move declaration heal",
    'move Heal { awaken(amount) { this.amount = amount this.name = "Mystical Palm" } unleash(attacker, target) { target.hp = target.hp + this.amount creation(attacker.name + " heals " + target.name + " for " + this.amount + ". HP: " + target.hp) } }'],
  ["summon world object",
    'jutsu world1 = summon Narutoverse("Hidden Leaf Village")'],
  ["summon character object",
    'jutsu naruto = summon Hokage("Naruto")'],
  ["summon more characters",
    'jutsu sakura = summon Shinobi("Sakura", "Jonin") jutsu sasuke = summon Shinobi("Sasuke", "Jonin")'],
  ["move instances",
    "jutsu rasengan = summon Rasengan(45) jutsu healPalm = summon Heal(30)"],
  ["geass conditional",
    'geass sasuke.isAlive() { creation("Sasuke is still in the fight!") } masaka { creation("Sasuke has been defeated...") }'],
]

for (const [label, src] of syntaxChecks) {
  test(`parses: ${label}`, () => {
    assert.doesNotThrow(() => parse(src))
  })
}