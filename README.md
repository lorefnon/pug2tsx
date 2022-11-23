# About

Pug is a concise low-boilerplate templating language. It was originally designed for generating HTML strings.

Pug2tsx is a simple framework-agnostic utility that compiles pug templates to Typescript TSX files, enabling pug to be used for libraries like Solid.js & React in type-safe manner.

## Usage

```
pug2tsx -i <input-directory> -o <output-directory>
```

This will generate typescript files in the `output-directory` which will have to be separately compiled
through `tsc` or other typescript compatible bundler. Refer [typescript documentation](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) for other details.

## Syntax

```
// hello.pug
- import * as React from "react"

- export const Hello = () =>
    div
        | Hello world
```

The above is compiled to:

```
// hello.tsx

import * as React from "react";

export const Hello = () => {
    return (
        <div>
            Hello world
        </div>
    );
}
```

## Motivation

- Due to popularity of React the JS ecosystem has settled on unweildy XML based syntax for component composition.
- Pug/Haml/Slim's indented syntax is much cleaner and succint.
- Solutions like [babel-plugin-transform-react-pug](https://github.com/pugjs/babel-plugin-transform-react-pug) are framework dependent (only React) and are not Typescript friendly.

## Differences from primary Pug compiler

1. Pug compiles to HTML/Javascript, Pug2tsx compiles to typescript code.
1. Pug allows fragments of code which are not valid javascript and has some smart detection of blocks:
   ```
   - for (var x = 0; x < 3; x++)
     li item
   ```
   pug2tsx expects (and validates) code blocks to be valid typescript - so above usage is illegal.

4. Following pug features are not supported, because they don't blend well with component oriented usage:
   1. Includes/Extends/Blocks - Just use ES6 imports and Composition of components
   2. Mixins - Use composition of components
   3. Filters - May be implemented someday

## TODO

- [ ] Language server plugin
- [ ] Webpack loader

## Contributing

Contributions are welcome in form of bug reports and pull requests through [github](https://github.com/lorefnon/pug2tsx).

## License

MIT
