'use strict'

const path = require('path');
const miniCss = require('mini-css-extract-plugin');


const PROD_BUILD = (process.env.NODE_ENV === 'production');

module.exports = {
  entry: './src/components/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '...']
  },
  plugins: [new miniCss()],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      {test: /\.css$/i, use: [miniCss.loader, 'css-loader']}
    ]
  },
  performance: {
    maxAssetSize: 1_000_000 // This is not a webpage, so asset can be 1 big blob  
  },
  target: 'webworker',
  stats: 'errors-only',
  devtool: PROD_BUILD ? false : 'cheap-source-map'
};