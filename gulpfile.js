//@ts-check

const { src, dest, series, parallel, watch } = require('gulp')
const gulpts = require('gulp-typescript')
const cleanCSS = require('gulp-clean-css')
const gulpinsert = require('gulp-insert')
const gulpconcat = require('gulp-concat')
const gulprename = require('gulp-rename')
const gulpuglify = require('gulp-uglify')
const sass = require('sass')
const gulpsass = require('gulp-sass')(sass)

const tsProject = gulpts.createProject('tsconfig.json')


const addStylesheetJS1 = `
(function(){
const styles = \``
const addStylesheetJS2 = `\`;
const stylesheet = document.createElement('style');
stylesheet.innerHTML = styles;
document.head.append(stylesheet);})()`

function styles(cb) {
    return cssToJS(src('style.scss')
        .pipe(gulpsass()))
}

function cssToJS(stream) {
    return stream
        .pipe(cleanCSS())
        .pipe(gulpinsert.wrap(addStylesheetJS1, addStylesheetJS2))
        .pipe(gulprename(path => { path.extname = '.js' }))
        .pipe(dest('dist/temp'))
}

function typescript(cb) {
    return tsProject.src()
        .pipe(tsProject())
        .js
        .pipe(dest('dist/temp'))
}

function main(env) {
    return series(configureRequire(env), _concat)

    function _concat(cb) {
        return src(['dist/temp/require.js', 'dist/temp/*.js', 'dist/temp/**/*.js'])
            .pipe(gulpuglify())
            .pipe(src('packageMetadata.ts'))
            .pipe(gulpconcat('wnl-customization.user.js'))
            .pipe(dest('dist'))
    }
}

/**
 * @param {'beta' | 'local' | 'prod'} env
 */
function configureRequire(env) {
    const beta = `var require = {baseUrl: 'https://wodac.github.io/wnl-customization/beta'}`
    const prod = `var require = {baseUrl: 'https://wodac.github.io/wnl-customization/dist'}`
    const local = `var require = {baseUrl: 'https://127.0.0.1:8080/'}`
    let configString

    switch (env) {
        case 'beta':
            configString = beta
            break;

        case 'local':
            configString = local
            break;

        case 'prod':
        default:
            configString = prod
            break;
    }

    return _configureRequire

    function _configureRequire() {
        return src('vendor/require.js')
            .pipe(gulpinsert.append(configString))
            .pipe(dest('dist/temp'))
    }
}

exports.default = build('prod')
exports.build = build('prod')
exports.buildLocal = build('local')
exports.local = watchLocal
exports.beta = build('beta')

function build(env) {
    return series(parallel(typescript, styles), main(env))
}

function watchLocal(cb) {
    watch(['*.ts', 'utils/*.ts'], series(typescript, main('local')))
    watch(['*.scss', 'styles/*.scss'], series(styles, main('local')))
    return build('local')(cb)
}

