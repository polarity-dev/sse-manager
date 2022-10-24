# Sf Module Template

A simple template to build modules for npm

## Features

- Typescript support for single file modules

## Usage

- Insert code in `src/index.ts`
- Write module behavior tests in `test/index.ts`
- Write module type test in `test/index.cjs`

To build the module run:

```npm run build```

To build in watch mode:

```npm run dev```

To test:

```npm test```

## Notes

- Only single file modules are supported
- Only default export is verified to work (`export default ...`)
- It is unnecessary to write behavior tests  in both `test/index.cjs` and `test/index.ts`  

It is recommended, however, to check if the module has the correct type in both `cjs` and `ts`, since the former uses `commonjs` as import method, the latter uses `esm`
