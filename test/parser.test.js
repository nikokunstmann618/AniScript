import { describe, it, expect } from "node:test";
import parse from "../src/parser.js";
import assert from "node:assert/strict";

const syntaxChecks = [
  ["hello world", "shout('Hello, world!')"],
  ["declare object", "world Narutoverse { awaken(name) {this.name = name;} }"],
  [
    "intialize obejct",
    'nakama world1 = summon Narutoverse("Hidden Leaf Village")',
  ],













  
  ["check attributes", "shout(world1.name)"],
  ["world declaration", "world Narutoverse { awaken(name) { this.name = name } addCitizen() { this.population = this.population + 1 } status() { shout(\"[ \" + this.name + \" ] Population: \" + this.population) } }"],
  ["character declaration with inheritance", "character Shinobi from Narutoverse { awaken(name, rank) { channel(name) this.rank = rank this.hp = 100 this.chakra = 80 } train() { this.chakra = this.chakra + 15 shout(this.name + \" trains hard! Chakra: \" + this.chakra) } info() { shout(\"-- \" + this.name + \" [\" + this.rank + \"] HP:\" + this.hp + \" CK:\" + this.chakra) } isAlive() { kaeru this.hp > 0 } }"],
  ["character override method", "character Hokage from Shinobi { awaken(name) { channel(name, \"Kage\") this.title = \"Hokage\" } train() { this.chakra = this.chakra + 30 shout(this.name + \" (Hokage) trains with full power! Chakra: \" + this.chakra) } proclamation() { shout(\"I, \" + this.name + \", will protect this village with my life! Dattebayo!\") } }"],
  ["move declaration", "move Rasengan { awaken(power) { this.power = power this.name = \"Rasengan\" this.type = \"wind\" } unleash(attacker, target) { shout(attacker.name + \" unleashes \" + this.name + \"!\") target.hp = target.hp - this.power shout(target.name + \" takes \" + this.power + \" damage. HP: \" + target.hp) } describe() { shout(this.name + \" [\" + this.type + \"] Power: \" + this.power) } }"],
  ["move declaration heal", "move Heal { awaken(amount) { this.amount = amount this.name = \"Mystical Palm\" } unleash(attacker, target) { target.hp = target.hp + this.amount shout(attacker.name + \" heals \" + target.name + \" for \" + this.amount + \". HP: \" + target.hp) } }"],
  ["summon world object", "nakama world1 = summon Narutoverse(\"Hidden Leaf Village\")"],
  ["add citizens and status", "world1.addCitizen() world1.status()"],
  ["summon character object", "nakama naruto = summon Hokage(\"Naruto\")"],
  ["summon more characters", "nakama sakura = summon Shinobi(\"Sakura\", \"Jonin\") nakama sasuke = summon Shinobi(\"Sasuke\", \"Jonin\")"],
  ["character info call", "naruto.info() sakura.info() sasuke.info()"],
  ["training arc", "naruto.train() sakura.train() sasuke.train() naruto.proclamation()"],
  ["move instances", "nakama rasengan = summon Rasengan(45) nakama healPalm = summon Heal(30)"],
  ["move describe", "rasengan.describe()"],
  ["battle unleash and heal", "rasengan.unleash(naruto, sasuke) healPalm.unleash(sakura, sasuke)"],
  ["kakugo conditional", "kakugo sasuke.isAlive() { shout(\"Sasuke is still in the fight!\") } masaka { shout(\"Sasuke has been defeated...\") }"],
  ["end world status", "world1.status()"],
  // ["nakama greeting = 'Konnichiwa, Sekai!'", "nakama greeting = 'Konnichiwa, Sekai!'"],
  // ["nakama x = 5", "nakama x = 5"],
  // ["x = x + 1", "x = x + 1"],
  // ["kakugo x > 3 { shout(x) }", "kakugo x > 3 { shout(x) }"],
  // ["masaka { shout('No way!') }", "masaka { shout('No way!') }"],
  // ["tatakai x < 10 { shout(x) }", "tatakai x < 10 { shout(x) }"],
  // ["yatta", "yatta"],
  // ["dame", "dame"],
  // ["world Leaf { awaken(n) { this.n = n } }", "world Leaf { awaken(n) { this.n = n } }"],
  // ["character Naruto { attack() { shout('Rasengan!') } }", "character Naruto { attack() { shout('Rasengan!') } }"],
  // ["move Rasengan { target.health -= 10 }", "move Rasengan { target.health -= 10 }"],
];
