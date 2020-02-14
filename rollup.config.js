// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";

export default {
  input: 'src/panel.js',
  output: {
    file: 'devtools-extension/dist/panel.js',
    format: 'esm'
  },
  plugins: [
    babel({
      exclude: /node_modules/
    }),
    resolve(),
	commonjs(),
	replace({
      "process.env.NODE_ENV": JSON.stringify("development")
    })
  ]
};
