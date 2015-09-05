global.process={argv:[],env:{}}
const {fromAst} = require('babel-core/lib/transformation')
const {generate} = require('escodegen')
const {parse} = require('espree')
const assert = require('assert')
const JSX = require('../index')

const opts = {nonStandard: false, code: false}
const parser_opts = {
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

const transpile = src => generate(fromAst(JSX(parse(src,parser_opts)), null, opts).ast.program)
const check = (a, b) => assert(transpile(a) == transpile(b))

it('out of scope nodes', () => {
  check('<div/>', 'JSX("div")')
  check('<a.b/>', 'JSX("a.b")')
  check('<a.b.c/>', 'JSX("a.b.c")')
})

it('in scope node', () => {
  const src = 'const link = () => JSX("a", {href:"a"});'
  check(`${src}<link/>`, `${src}JSX(link)`)
  check(`${src}<link.b/>`, `${src}JSX(link.b)`)
  check(`${src}<link.b.c/>`, `${src}JSX(link.b.c)`)
})

it('attributes', () => {
  check('<div class="a"/>', 'JSX("div", {class: "a"})')
  check('<div class="a" cursor={1}/>', 'JSX("div", {class: "a", cursor: 1})')
  check('<div class="a" cursor={1} onClick={()=>null}/>'
      , 'JSX("div", {class: "a", cursor: 1, onClick: ()=>null})')
  check('<div tip={<a/>}/>', 'JSX("div", {tip: JSX("a")})')
})

it('spread attributes', () => {
  check('<div {...rest}/>', 'JSX("div", rest)')
  check('<div a={1} {...rest}/>', 'JSX("div", Object.assign({a:1}, rest))')
  check('<div a={1} {...one} {...two}/>', 'JSX("div", Object.assign({a:1}, one, two))')
  check('<div a={1} {...one} b={2} {...two}/>'
      , 'JSX("div", Object.assign({a:1}, one, {b:2}, two))')
  check('<div {...one} b={2} {...two}/>'
      , 'JSX("div", Object.assign(Object.create(one), {b:2}, two))')
})

it('children', () => {
  check('<div onClick={()=>null}><a href="a">link</a></div>'
      , 'JSX("div", {onClick:()=>null}, [JSX("a", {href:"a"}, ["link"])])')
  check('<span>a</span>', 'JSX("span", null, ["a"])')
  check('<span>{1}</span>', 'JSX("span", null, [1])')
})

it('whitespace', () => {
  check('<a>\n  <b>1</b>\n</a>', 'JSX("a", null, [JSX("b", null, ["1"])])')
  check('<a>\n  <b>1</b>\n  <b>2</b>\n</a>'
      , 'JSX("a", null, [JSX("b", null, ["1"]), JSX("b", null, ["2"])])')
})

describe('With other ES6 features', () => {
  it('arrow functions', () => {
    check('()=> <a href="a"/>', '()=> JSX("a", {href:"a"})')
  })

  it('default parameters', () => {
    check('(a=<a/>)=>null', '(a=JSX("a"))=>null')
  })
})
