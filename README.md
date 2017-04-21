# PostCSS Extract Variable Scheme <img src="https://postcss.github.io/postcss/logo.svg" alt="PostCSS Logo" width="90" height="90" align="right">

[PostCSS Extract Variable Scheme](https://github.com/archnode/postcss-extract-variable-scheme) lets you export custom properties, selectors and media queries to one or multiple files based on a prefix you define in your variable name.

## Installation

```bash
npm install postcss-extract-variable-scheme
```

## Usage

With following setup (incomplete) ..

```js
var postcss = require("postcss")
var extractVariableScheme = require("postcss-extract-variable-scheme")

var output = postcss()
  .use(extractVariableScheme({
    dest: 'build/variables/',
    fileExports: [
      {
        prefixes: ['my-prefix'],
        filename: 'example'
      }
    ]
  }))
  .process(cssFile)
  .css
```

Processing following CSS:

```css
:root {
  --my-prefix-h1-size: 2rem;
  --my-prefix-box: {
    background-color: #000;
    font-weight: bold;
  }
}
```

Variables with ```--{prefix}-``` (Please note the finishing "-") get extracted to ```example.json```:

```json
{
  "my-prefix-h1-size": "2rem",
  "my-prefix-box": {
    "background-color": "#000",
    "font-weight": "bold"
  }
}
```

### Options

#### `dist`

Defines the Directory the file exports get written.

#### `fileExports`

Array of objects that specify individual exporters. Prefixes can be used multiple times with different exports.

```js
[
  {
    prefixes: ['my-prefix'],
    filename: 'example'
  }
]
```

## [License](LICENSE.md)