const children = require('ast-children')
const {parse} = require('espree')

const transforms = {
  JSXElement({openingElement:{name, attributes}, children}, env) {
    const expr = {
      type: 'CallExpression',
      callee: {type: 'Identifier', name: 'JSX'},
      arguments: [parseCallee(name, env)]
    }
    if (attributes.length) addArg(1, expr, parseAttrs(attributes, env))
    if (children.length)   addArg(2, expr, parseChildren(children, env))
    return expr
  }
}

const addArg = (index, call, arg) => {
  while (call.arguments.length < index) {
    call.arguments.push({type: 'Literal', value: null})
  }
  call.arguments.push(arg)
}

const parseAttrs = (attributes, env) => {
  var out = call('assign')
  var attrs = {type: 'ObjectExpression', properties: []}

  for (var attr of attributes) {
    if (attr.type == 'JSXSpreadAttribute') {
      if (attrs.properties.length) {
        out.arguments.push(attrs)
        attrs = {type: 'ObjectExpression', properties: []}
      }
      out.arguments.push(attr.argument)
      continue
    }
    var {name, value} = attr
    attrs.properties.push({
      type: 'Property',
      kind: 'init',
      key: reuse(name),
      value: value.type == 'JSXExpressionContainer'
        ? map(transforms, env, value.expression)
        : value
    })
  }

  if (attrs.properties.length) out.arguments.push(attrs)

  // was Object.assign necessary
  if (out.arguments.length == 1) out = out.arguments[0]

  // is the first attribute a spread
  else if (out.arguments[0] === attributes[0].argument) {
    // prevent mutation of potentially shared object
    out.arguments[0] = call('create', out.arguments[0])
  }

  return out
}

const call = (property, arg) => {
  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: {type: 'Identifier', name: 'Object'},
      property: {type: 'Identifier', name: property}
    },
    arguments: arg ? [arg] : []
  }
}

const parseChildren = (children, env) => {
  return {
    type: 'ArrayExpression',
    elements: children.map(child => map(transforms, env, child))
  }
}

const parseCallee = (node, env) =>
  getTarget(node) in env
    ? reuse(node)
    : {type: 'Literal', value: toString(node)}

const getTarget = node =>
  node.type == 'JSXMemberExpression'
    ? getTarget(node.object)
    : node.name

const reuse = node => {
  if (node.type == 'JSXMemberExpression') {
    node.type = 'MemberExpression'
    reuse(node.object)
    reuse(node.property)
  } else {
    node.type = 'Identifier'
  }
  return node
}

const toString = node =>
  node.type == 'JSXMemberExpression'
    ? toString(node.object) + '.' + toString(node.property)
    : node.name

/**
 * Get all declared variables within `node`'s scope
 *
 * @param {AST} node
 * @return {Array}
 */

const freshVars = node => {
  switch (node.type) {
    case 'VariableDeclaration':
      return node.declarations.map(d => d.id.name)
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': return [] // early exit
    case 'FunctionDeclaration': return [node.id.name]
    case 'CatchClause': return freshVars(node.body).concat(node.param.name)
  }
  return children(node).map(freshVars).reduce(concat, [])
}

const concat = (a, b) => a.concat(b)

const map = (transforms, env, node) => {
  if (node == null) return node
  if (node.type in transforms) {
    return transforms[node.type](node, env)
  }
  const fn = map[node.type]
  if (fn) fn(transforms, env, node)
  return node
}

map.VariableDeclaration = (transforms, env, node) => {
  node.declarations.forEach(d => d.init = map(transforms, env, d.init))
}

map.SequenceExpression = (transforms, env, node) => {
  node.expressions = node.expressions.map(e => map(transforms, env, e))
}

map.ArrayExpression = (transforms, env, node) => {
  node.elements = node.elements.map(e => map(transforms, env, e))
}

map.ArrowFunctionExpression =
map.FunctionDeclaration =
map.FunctionExpression = (transforms, env, node) => {
  env = Object.create(env)
  freshVars(node.body).forEach(name => env[name] = undefined)
  node.params.forEach(p => env[p.name] = undefined)
  node.body = map(transforms, env, node.body)
}

map.BlockStatement = (transforms, env, node) => {
  node.body.forEach(node => map(transforms, env, node))
}

map.Program = (transforms, env, node) => {
  env = Object.create(env)
  freshVars(node).forEach(name => env[name] = undefined)
  node.body.forEach(node => map(transforms, env, node))
}

map.ExpressionStatement = (transforms, env, node) => {
  node.expression = map(transforms, env, node.expression)
}

map.IfStatement =
map.ConditionalExpression = (transforms, env, node) => {
  node.test = map(transforms, env, node.test)
  node.consequent = map(transforms, env, node.consequent)
  node.alternate = map(transforms, env, node.alternate)
}

map.WithStatement = (transforms, env, node) => {
  node.object = map(transforms, env, node.object)
  node.body = map(transforms, env, node.body)
}

map.SwitchStatement = (transforms, env, node) => {
  node.discriminant = map(transforms, env, node.discriminant)
  node.cases.forEach(c => {
    c.test = map(transforms, env, c.test)
    c.consequent = map(transforms, env, c.consequent)
  })
}

map.ThrowStatement =
map.UnaryExpression =
map.ReturnStatement =
map.UpdateExpression = (transforms, env, node) => {
  node.argument = map(transforms, env, node.argument)
}

map.TryStatement = (transforms, env, node) => {
  node.block = map(transforms, env, node.block)
  node.handler.body = map(transforms, env, node.handler.body)
  node.finalizer = map(transforms, env, node.finalizer)
}

map.WhileStatement =
map.DoWhileStatement = (transforms, env, node) => {
  node.test = map(transforms, env, node.test)
  node.body = map(transforms, env, node.body)
}

map.ForStatement = (transforms, env, node) => {
  node.init = map(transforms, env, node.init)
  node.test = map(transforms, env, node.test)
  node.body = map(transforms, env, node.body)
  node.update = map(transforms, env, node.update)
}

map.ForInStatement = (transforms, env, node) => {
  node.left = map(transforms, env, node.left)
  node.right = map(transforms, env, node.right)
  node.body = map(transforms, env, node.body)
}

map.ObjectExpression = (transforms, env, node) => {
  node.properties = node.properties.map(e => map(transforms, env, e))
}

map.BinaryExpression =
map.LogicalExpression =
map.AssignmentExpression = (transforms, env, node) => {
  node.left = map(transforms, env, node.left)
  node.right = map(transforms, env, node.right)
}

map.NewExpression =
map.CallExpression = (transforms, env, node) => {
  node.callee = map(transforms, env, node.callee)
  node.arguments = node.arguments.map(e => map(transforms, env, e))
}

map.MemberExpression = (transforms, env, node) => {
  node.object = map(transforms, env, node.object)
  if (node.computed) node.property = map(transforms, env, node.property)
}

const parser_opts = {
  loc: true,
  comments: true,
  ecmaFeatures: {
    arrowFunctions: true,
    blockBindings: true,
    destructuring: true,
    regexYFlag: true,
    regexUFlag: true,
    templateStrings: true,
    binaryLiterals: true,
    octalLiterals: true,
    unicodeCodePointEscapes: true,
    defaultParams: true,
    restParams: true,
    forOf: true,
    objectLiteralComputedProperties: true,
    objectLiteralShorthandMethods: true,
    objectLiteralShorthandProperties: true,
    objectLiteralDuplicateProperties: true,
    generators: true,
    spread: true,
    superInFunctions: true,
    classes: true,
    newTarget: false,
    modules: true,
    jsx: true,
    globalReturn: true,
    experimentalObjectRestSpread: true
  }
}

const JSX = ast => {
  if (typeof ast == 'string') ast = parse(ast, parser_opts)
  return map(transforms, null, ast)
}

export default JSX
