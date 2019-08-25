:warning: This project has been discontinued in favor of [fluent-react.macro](https://github.com/ts-delight/fluent-react.macro).

---

![Introduction](https://raw.githubusercontent.com/lorefnon/molosser/master/assets/PrimaryIntroImage.png)
# About

A concise indentation based templating language that compiles to idiomatic typescript based React function components

## Usage

```
molosser -i <input-directory> -o <output-directory>
```

This will generate typescript files in the `output-directory` which will have to be separately compiled
through `tsc` for wrappers over it. Refer [typescript documentation](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) for other details.

## Syntax

Tags can be composed through indentation:

```
// hello.mol
div
    | Hello world
```

The above is automatically converted to a function component exported as default:

```
// hello.tsx

import * as React from "react";

export default function Hello() {
    return (
        <div>
            Hello world
        </div>
    );
}
```

Typescript can be embedded through script blocks (which are outside the function exported by default) and inline code blocks (which are inside):

```
// hello.mol
script.
    import * as cowsay from "cowsay";

pre
  = cowsay.say({text: 'Moo...'})
```

Render Props:

```
- const Consumer = AppContext.Consumer
Consumer
  = (app) =>
    if app.repositoryRoot
        #workspace Success
```

Note usage of `-` for code block which is not an embedded expression.

Also, note that `AppContext.Consumer` had to be aliased because of conflict with a tag like `AppContext.Consumer` will compile to element of type `AppContext` with className as `Consumer`.

Multiple components in the same file:

```
script(type="text/molosser")
    - export const SomeComponent = () =>
        div.hello
            | World
    - export const SomeOtherComponent = () =>
        div.lorem
            | Ipsum
```

## Motivation

- React is awesome, but JSX is verbose and unweildy.
- Haml/Jade's indented syntax is much cleaner and succint.
- [babel-plugin-transform-react-pug](https://github.com/pugjs/babel-plugin-transform-react-pug) is not typescript friendly.
- With the introduction of hooks, it is very much possible to restrict ourselves to functional components and get advantage of most of react.

## About the name

Molosser is a breed of dog. The name is indicative of a shared lineage with [Pug](https://pugjs.org).
Molosser is inspired by Pug and borrows the syntax and parts of the compiler code.

## Differences from Pug

1. Pug compiles to HTML/Javascript, Molosser compiles to typescript code which uses React.
2. Molosser supports embedded typescript
3. Pug allows fragments of code which are not valid javascript and has some smart detection of blocks:
   ```
   - for (var x = 0; x < 3; x++)
     li item
   ```
   Molosser expects (and validates) code blocks to be valid typescript - so above usage is illegal.

4. Following pug features are not supported, because they don't blend well with component oriented idioms in React world:
   1. Includes/Extends/Blocks - Just use ES6 imports and Composition of components
   2. Mixins - Use composition of components
   3. Filters - May be implemented someday

## TODO

- [ ] Language server plugin
- [ ] Webpack loader

## Contributing

Contributions are welcome in form of bug reports and pull requests through [github](https://github.com/lorefnon/molosser).

## License

MIT
