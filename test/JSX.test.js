if (typeof window != 'undefined') global.process={argv:[],env:{}} // browser hack
const {transform} = require('babel-core')
const {babel_plugin} = require('../index')
const assert = require('assert')

const opts = {
  presets: [require('babel-preset-es2015')],
  plugins: [require('babel-plugin-syntax-jsx'), babel_plugin]
}

const transpile = src => transform(src, opts).code.replace(/[\s\n\r]+/g, ' ')
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
  check('<div a-b={<a/>}/>', 'JSX("div", {"a-b": JSX("a")})')
})

it('attribute shorthand', () => {
  check('<input isfocused/>', 'JSX("input", {isfocused: isfocused})')
  check('var a;<b a/>', 'var a;JSX("b", {a: a})')
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
  check('<a>\n  {1}\n</a>', 'JSX("a", null, [1])')
  check('<a>\n  1\n</a>', 'JSX("a", null, ["1"])')
  check('<a> 1 </a>', 'JSX("a", null, [" 1 "])')
})

describe('With other ES6 features', () => {
  it('arrow functions', () => {
    check('()=> <a href="a"/>', '()=> JSX("a", {href:"a"})')
  })

  it('default parameters', () => {
    check('(a=<a/>)=>null', '(a=JSX("a"))=>null')
  })
})
