'use strict';

const path = require('path');

const PROD_BUILD = (process.env.NODE_ENV === 'production');

module.exports = {
  target: 'webworker',

  entry: './src/extension/extension.ts',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  devtool: PROD_BUILD ? false : 'cheap-source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    fallback: {
      'path': require.resolve('path-browserify') //polyfill "path" module
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  stats: 'errors-only',
};