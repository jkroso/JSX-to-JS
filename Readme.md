# JSX-to-JS

Transpile JSX to JS. Unlike other implementations it keeps track of the variable scope and uses this to determine whether or not to convert the tag to a string. Other implementations just test if the tag's name is all lowercase.

## Installation

`npm install JSX-to-JS`

then in your app:

```js
const JSX = require('JSX-to-JS')
```

## API

```js
JSX('<div/>') // => parse('JSX("div")')
JSX(parse('<div/>')) // => parse('JSX("div")')
```
