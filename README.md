![Introduction](https://raw.githubusercontent.com/lorefnon/molosser/master/assets/PrimaryIntroImage.png)
# About

A concise indentation based templating language that compiles to idiomatic typescript based React function components

## Usage

```
molosser -i <input-directory> -o <output-directory>
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
