const map = require('map-ast')

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
  },
  JSXExpressionContainer(node, env) {
    return map(transforms, env, node.expression)
  },
  JSXText(node) {
    return literal(node.value)
  }
}

const addArg = (index, call, arg) => {
  while (call.arguments.length < index) {
    call.arguments.push(literal(null))
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
      type: 'ObjectProperty',
      kind: 'init',
      key: reuse(name),
      value: value == null
        ? {type: 'Identifier', name: name.name}
        : map(transforms, env, value)
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
  // remove whitespace between nodes
  children = children.filter(child =>
    child.type != 'JSXText' || !child.value.match(/^[ \t]*[\r\n][ \t\r\n]*$/))
  // remove leading and trailing new lines
  var end = children.length - 1
  children[0] = trim('left', children[0])
  children[end] = trim('right', children[end])
  return {
    type: 'ArrayExpression',
    elements: children.map(child => map(transforms, env, child))
  }
}

const trim = (side, child) => {
  if (child.type == 'JSXText')
    child.value = child.value.replace(trim[side], '')
  return child
}

trim.left  = /^(?:[\r\n]+\s*)+/
trim.right = /(?:\s*[\r\n]+)+$/

const parseCallee = (node, env) =>
  getTarget(node) in env
    ? reuse(node)
    : literal(toString(node))

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

const literal = value => {
  var type
  if (typeof value == 'number') type = 'NumberLiteral'
  else if (typeof value == 'string') type = 'StringLiteral'
  else if (typeof value == 'boolean') type = 'BooleanLiteral'
  else if (value === null) type = 'NullLiteral'
  else type = 'RegexLiteral'
  return {type, value}
}

const babel_plugin = () =>
  ({
    visitor: {
      Program(path) {
        path.node.body = map(transforms, null, path.node).body
      }
    }
  })

const JSX = ast => map(transforms, null, ast)

export default JSX
export {babel_plugin, JSX}
