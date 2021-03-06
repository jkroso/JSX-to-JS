# JSX-to-JS

Transpiles JSX to JS but tries to be a more JavaScripty than the standard JSX transpiler from Facebook. Not that I am a big fan of JS, but JSX is only supposed to be syntax sugar for defining tree structures in JS. And in this case making it more JavaScripty actually made it sweeter.

## Differences from the standard JSX syntax

1. __Ignores capitalization of tag names__

  Instead it tracks variables and uses them to determine output. So with:

  ```js
  const component = () => <div/>
  <component/>
  ```

  This module produces

  ```js
  JSX(component)
  ```

  While a Standard JSX transpiler would produce

  ```js
  JSX('component')
  ```

2. __Provides ES6 style parameter shorthand__

  If you don't provide a value to a parameter it will default it to a variable with the same name

  ```js
  <component onMousedown isfocused/>
  ```

  This module produces:

  ```js
  JSX(component, {onMousedown: onMousedown, isfocused: isfocused})
  ```

  While a Standard JSX transpiler would produce:

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

## Related projects

- [eslint-plugin-jsx](//github.com/jkroso/eslint-plugin-jsx)
