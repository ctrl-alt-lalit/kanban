"use strict";

const { series, parallel, src, dest } = require("gulp");
const minifyJS = require("gulp-minify");
const minifyCSS = require("gulp-clean-css");
const minifyHTML = require("gulp-htmlmin");

const minifyAll = parallel(minifyAllCSS, minifyAllHTML, minifyAllJS);

function minifyAllJS() {
    return src("src/**/*.js")
    .pipe(minifyJS({
        noSource: true, 
        ext: {min: ".js"}
    }))
    .pipe(dest("dist"));
}

function minifyAllHTML() {
    return src("src/**/*.html")
    .pipe(minifyHTML({collapseWhitespace: true}))
    .pipe(dest("dist"));
}

function minifyAllCSS() {
    return src("src/**/*.css")
    .pipe(minifyCSS())
    .pipe(dest("dist"));
}

exports.minify = minifyAll;
exports.default = minifyAll;

