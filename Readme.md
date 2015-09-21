# JSX-to-JS

Transpiles JSX to JS

## Differences from the standard JSX syntax

1. Ignores capitalization of tag names

  Instead it tracks variables and uses them to determine output

  ```js
  const component = () => <div/>
  <component/> == JSX(component)
  ```
  A Standard JSX transpiler would produce:

  ```js
  JSX('component')
  ```

2. Provides ES6 style parameter shorthand

  If you don't provide a value to a parameter it will provide a default one by looking into the variable environment for a variable with the same name. If it doesn't find one it will default to `true` as per standard JSX

  ```js
  const onMousedown = e => console.log(e)
  <component onMousedown isfocused/> == JSX(component, {onMousedown: onMousedown, isfocused: true})
  ```

  A Standard JSX transpiler would produce:

  ```js
  JSX('component', {onMousedown: true, isfocused: true})
  ```

## Installation

`npm install jsx-to-js`

then in your app:

```js
const JSX = require('jsx-to-js')
```

## API

It takes a JSX AST node and returns a JS AST node. Simple as

```js
JSX(parse('<div/>')) // => parse('JSX("div")')
```
