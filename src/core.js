// core.js – AST node factories for Aniscript

// ── Program ──────────────────────────────────────────────────────────────
export function program(statements) {
    return { kind: "Program", statements };
  }
  
  // ── Statements ───────────────────────────────────────────────────────────
  export function creationStatement(expression) {
    return { kind: "CreationStatement", expression };
  }
  
  export function jutsuStatement(name, initializer) {
    return { kind: "JutsuStatement", name, initializer };
  }
  
  export function assignStatement(target, source) {
    return { kind: "AssignStatement", target, source };
  }
  
  export function geassStatement(test, consequent, alternate) {
    return { kind: "GeassStatement", test, consequent, alternate };
  }
  
  export function counterClause(body) {
    return { kind: "CounterClause", body };
  }
  
  export function tsukuyomiStatement(test, body) {
    return { kind: "TsukuyomiStatement", test, body };
  }
  
  // ── Class declarations ──────────────────────────────────────────────────
  export function worldDeclaration(name, parentName, methods) {
    return { kind: "WorldDeclaration", name, parentName, methods };
  }
  
  export function characterDeclaration(name, parentName, methods) {
    return { kind: "CharacterDeclaration", name, parentName, methods };
  }
  
  export function moveDeclaration(name, parentName, methods) {
    return { kind: "MoveDeclaration", name, parentName, methods };
  }
  
  export function methodDefinition(name, paramNames, body) {
    return { kind: "MethodDefinition", name, paramNames, body };
  }
  
  // ── OOP statements ──────────────────────────────────────────────────────
  export function thisFieldSetStatement(field, value) {
    return { kind: "ThisFieldSetStatement", field, value };
  }
  
  export function objFieldSetStatement(object, field, value) {
    return { kind: "ObjFieldSetStatement", object, field, value };
  }
  
  export function exprStatement(receiver, method, args) {
    return { kind: "ExprStatement", receiver, method, args };
  }
  
  export function channelStatement(args) {
    return { kind: "ChannelStatement", args };
  }
  
  export function returnStatement(value) {
    return { kind: "ReturnStatement", value };
  }
  
  // ── Expressions ─────────────────────────────────────────────────────────
  export function binaryExpression(op, left, right) {
    return { kind: "BinaryExpression", op, left, right };
  }
  
  export function unaryExpression(op, operand) {
    return { kind: "UnaryExpression", op, operand };
  }
  
  export function parenthesizedExpression(expression) {
    return { kind: "ParenthesizedExpression", expression };
  }
  
  export function identifier(name) {
    return { kind: "Identifier", name };
  }
  
  export function thisExpression() {
    return { kind: "ThisExpression" };
  }
  
  export function methodCallExpression(receiver, method, args) {
    return { kind: "MethodCallExpression", receiver, method, args };
  }
  
  export function memberAccessExpression(object, field) {
    return { kind: "MemberAccessExpression", object, field };
  }
  
  export function summonExpression(className, args) {
    return { kind: "SummonExpression", className, args };
  }
  
  // ── Literals ────────────────────────────────────────────────────────────
  export function numericLiteral(value) {
    return { kind: "NumericLiteral", value };
  }
  
  export function stringLiteral(value) {
    return { kind: "StringLiteral", value };
  }
  
  export function truthLiteral() {
    return { kind: "TruthLiteral", value: true };
  }
  
  export function illusionLiteral() {
    return { kind: "IllusionLiteral", value: false };
  }
  
  // ── Types (for completeness, though Aniscript is dynamically typed) ─────
  export const truthType = "truth";
  export const illusionType = "illusion";
  export const numberType = "number";
  export const stringType = "string";
  export const instanceType = "instance";
  export const anyType = "any";
  
  // ── Standard library (empty, but kept for consistency) ──────────────────
  export const standardLibrary = Object.freeze({});