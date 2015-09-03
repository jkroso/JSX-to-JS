# JSX

Transpile JSX to JS. Unlike other implementations it keeps track of the variable scope and uses this to determine whether or not to convert the tag to a string. Other implementations just test if the tag's name is all lowercase.

## Installation

`npm install jkroso/JSX`

then in your app:

```js
const JSX = require('JSX')
```

## API

```js
JSX('<div/>') // => 'JSX('div');'
```
