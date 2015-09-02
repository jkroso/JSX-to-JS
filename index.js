const children = require('ast-children')
const {parse} = require('espree')

const transforms = {
  JSXElement(node, env) {
    const {name,attributes} = node.openingElement
    const [attrs,params,events,spreads] = parseAttrs(attributes)
    const expr = {
      type: 'CallExpression',
      callee: {type: 'Identifier', name: 'JSX'},
      arguments: [parseCallee(name, env)]
    }
    const children = {
      type: 'ArrayExpression',
      elements: node.children.map(c => map(transforms, env, c))
    }
    if (attrs.properties.length)  addArg(1, expr, attrs)
    if (children.elements.length) addArg(2, expr, children)
    if (params.properties.length) addArg(3, expr, params)
    if (events.properties.length) addArg(4, expr, events)
    if (spreads.elements.length)  addArg(5, expr, spreads)
    return expr
  }
}

const addArg = (index, call, arg) => {
  while (call.arguments.length < index) {
    call.arguments.push({type: 'Literal', value: null})
  }
  call.arguments.push(arg)
}

const standardAttrs = new Set([
  'align', 'alt', 'bgcolor', 'border', 'char', 'charoff', 'charset', 'cite', 'compact', 'disabled',
  'height', 'href', 'hspace', 'longdesc', 'name', 'size', 'src', 'target', 'type', 'valign',
  'value', 'vspace', 'width', 'abbr', 'axis', 'colspan', 'nowrap', 'rowspan', 'scope', 'label',
  'readonly', 'cols', 'rows', 'accept', 'span', 'accept-charset', 'action', 'enctype', 'method',
  'checked', 'maxlength', 'for', 'start', 'selected', 'multiple', 'cellpadding', 'cellspacing',
  'frame', 'rules', 'summary', 'headers', 'autofocus', 'id', "className", "placeholder",
  "accentHeight", "accumulate", "additive", "alphabetic", "amplitude", "arabicForm", "ascent",
  "attributeName", "attributeType", "azimuth", "baseFrequency", "baseProfile", "bbox", "begin",
  "bias", "by", "calcMode", "capHeight", "clipPathUnits", "contentScriptType", "contentStyleType",
  "cx", "cy", "d", "descent", "diffuseConstant", "divisor", "dur", "dx", "dy", "edgeMode",
  "elevation", "end", "exponent", "externalResourcesRequired", "fill", "filterRes", "filterUnits",
  "fontFamily", "fontSize", "fontStretch", "fontStyle", "format", "from", "fx", "fy", "g1", "g2",
  "glyphame", "glyphRef", "gradientTransform", "gradientUnits", "hanging", "horizAdvX",
  "horizOriginX", "horizOriginY", "ideographic", "in", "in2", "intercept", "k", "k1", "k2", "k3",
  "k4", "kernelMatrix", "kernelUnitLength", "keyPoints", "keySplines", "keyTimes", "lang",
  "lengthAdjust", "limitingConeAngle", "local", "markerHeight", "markerUnits", "markerWidth",
  "maskContentUnits", "maskUnits", "mathematical", "max", "media", "method", "min", "mode",
  "numOctaves", "offset", "operator", "order", "orient", "orientation", "origin",
  "overlinePosition", "overlineThickness", "panose1", "path", "pathLength", "patternContentUnits",
  "patternTransform", "patternUnits", "points", "pointsAtX", "pointsAtY", "pointsAtZ",
  "preserveAlpha", "preserveAspectRatio", "primitiveUnits", "r", "radius", "refX", "refY",
  "renderingIntent", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures",
  "restart", "result", "rotate", "rx", "ry", "scale", "seed", "slope", "spacing",
  "specularConstant", "specularExponent", "spreadMethod", "startOffset", "stdDeviation", "stemh",
  "stemv", "stitchTiles", "strikethroughPosition", "strikethroughThickness", "string", "style",
  "surfaceScale", "systemLanguage", "tableValues", "target", "targetX", "targetY", "textLength",
  "title", "to", "transform", "type", "u1", "u2", "underlinePosition", "underlineThickness",
  "unicode", "unicodeRange", "unitsPerEm", "vAlphabetic", "vHanging", "vIdeographic",
  "vMathematical", "values", "version", "vertAdvY", "vertOriginX", "vertOriginY", "viewBox",
  "viewTarget", "widths", "x", "xHeight", "x1", "x2", "xChannelSelector", "xlink", "xml", "y", "y1",
  "y2", "yChannelSelector", "z", "zoomAndPan", "alignmentBaseline", "baselineShift", "clipPath",
  "clipRule", "clip", "colorInterpolationFilters", "colorInterpolation", "colorProfile",
  "colorRendering", "color", "direction", "display", "dominantBaseline", "enableBackground",
  "fillOpacity", "fillRule", "filter", "floodColor", "floodOpacity", "fontSizeAdjust",
  "fontVariant", "fontWeight", "glyphOrientationHorizontal", "glyphOrientationVertical",
  "imageRendering", "kerning", "letterSpacing", "lightingColor", "markerEnd", "markerMid",
  "markerStart", "mask", "opacity", "overflow", "pointerEvents", "shapeRendering", "stopColor",
  "stopOpacity", "strokeDasharray", "strokeDashoffset", "strokeLinecap", "strokeLinejoin",
  "strokeMiterlimit", "strokeOpacity", "strokeWidth", "stroke", "textAnchor", "textDecoration",
  "textRendering", "unicodeBidi", "visibility", "wordSpacing", "writingMode", "viewBox", "class"
])

const parseAttrs = attributes => {
  const attrs = {type: 'ObjectExpression', properties: []}
  const params = {type: 'ObjectExpression', properties: []}
  const events = {type: 'ObjectExpression', properties: []}
  const spreads = {type: 'ArrayExpression', elements: []}
  for (var attr of attributes) {
    if (attr.type == 'JSXSpreadAttribute') {
      spreads.elements.push(attr.argument)
      continue
    }
    var {name, value} = attr
    var property = {
      type: 'Property',
      kind: 'init',
      key: {type: 'Identifier', name: name.name},
      value: value.type == 'JSXExpressionContainer' ? value.expression : value
    }
    if (standardAttrs.has(name.name)) {
      attrs.properties.push(property)
    } else if (/^on\w+$/.test(name.name)) {
      property.key.name = property.key.name.slice(2).toLowerCase()
      events.properties.push(property)
    } else {
      params.properties.push(property)
    }
  }
  return [attrs, params, events, spreads]
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
    case 'FunctionExpression': return [] // early exit
    case 'FunctionDeclaration': return [node.id.name]
    case 'CatchClause': return [node.param.name]
  }
  return children(node)
          .map(freshVars)
          .reduce(concat, [])
}

const concat = (a, b) => a.concat(b)

const map = (transforms, env, node) => {
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
