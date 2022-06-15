//@ts-check

const { src, dest, series, parallel, watch } = require('gulp')
const gulpts = require('gulp-typescript')
const gulpcss = require('gulp-clean-css')
const gulpinsert = require('gulp-insert')
const gulpconcat = require('gulp-concat')
const gulprename = require('gulp-rename')
const gulpuglify = require('gulp-uglify')

const tsProject = gulpts.createProject('tsconfig.json', {outFile: 'without-styles.js'})


const addStylesheetJS1 = `
(function(){
const styles = \``
const addStylesheetJS2 = `\`;
const stylesheet = document.createElement('style');
stylesheet.innerHTML = styles;
document.head.append(stylesheet);})()`

function styles(cb) {
    return cssToJS(src('style.css'))
}

function cssToJS(stream) {
    return stream
        .pipe(gulpcss())
        .pipe(gulpinsert.wrap(addStylesheetJS1, addStylesheetJS2))
        .pipe(gulprename(path => {path.extname = '.js'}))
        .pipe(dest('dist'))
}

function typescript(cb) {
    return tsProject.src()
        .pipe(tsProject())
        .js
        .pipe(dest('dist'))
}

function main(cb) {
    return src(['dist/without-styles.js', 'dist/style.js'])
        .pipe(gulpuglify())
        .pipe(src('packageMetadata.ts'))
        .pipe(gulpconcat('wnl-customization.gulp.user.js'))
        .pipe(dest('dist'))
}

exports.default = defaultTask
exports.build = series(parallel(typescript, styles), main)

function defaultTask() {
    watch(['*.ts', 'utils/*.ts', '*.css'], series(parallel(typescript, styles), main))
}

