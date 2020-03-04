// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";
import json from 'rollup-plugin-json';

export default {
  input: 'src/panel.js',
  output: {
    file: 'devtools-extension/dist/panel.js',
    format: 'cjs'
  },
  plugins: [
    resolve({
      // browser: true,
      preferBuiltins: false

    }),
    babel({
      exclude: /node_modules/
    }),
    commonjs(),
    json(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("development")
    })
  ]
};
