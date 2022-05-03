const path = require('path');
const copy = require("copy-webpack-plugin");


const production = (process.env.NODE_ENV === 'production');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  plugins: [
    new copy({
      patterns: [{from: 'public', to: './'}]
    })
  ],
  performance: {
    maxAssetSize: 1_000_000 // This is not a webpage, so asset can be 1 big blob  
  },
  target: 'webworker',
  stats: 'errors-only',
  devtool: production ? false : 'cheap-source-map'
};