// @ts-check
// import './globals'

const styles = `
:root {
    --uniform-font-size: 0.93em;
    --scaled-font-size: 110%;
}

html {
    scroll-behavior: smooth;
}

.questionsList__paginationContainer {
    /* position: absolute!important; */
    top: 0;
    left: 0;
    z-index: 1000;
    background: white;
}

.custom-script-increase-font-size .sl-block-content span[style*='21px'] {
    font-size: 0.75em!important;
}

.custom-script-option-container {
    padding: 5px 15px;
}

.custom-script-option-container:hover {
    background-color: #f6f6f6
}

a.custom-script-option {
    color: #0c1726
}

.custom-script-increase-annotations article.content.-styleguide p {
    font-size: var(--scaled-font-size);
    line-height: 150%;
}

.custom-script-increase-font-size .sl-block-content p {
    font-size: var(--scaled-font-size)!important;
}

.custom-script-uniform-font-size .sl-block-content :not(h1,h2,h3,h1 *,h2 *,h3 *) {
    font-size: var(--uniform-font-size)!important;
}

@media screen and (orientation:landscape) {
   section.stack.present section {
       overflow-y: auto;
       overflow-x: hidden;
       padding-bottom: 1em;
   }
}


.custom-script-increase-font-size .wnl-reference {
    margin-left: 0.5em
}

.custom-script-increase-font-size .wnl-reference svg,
.custom-script-uniform-font-size .wnl-reference svg {
    transform: scale(1.6)!important;
}

sub.small {
    margin-left: 0.5rem!important;
    font-size: 1.5rem!important;
}

.m-imageFullscreenWrapper {
    max-height: 80vh;
    text-align: center;
}

.m-imageFullscreenWrapper img {
    max-height: 80vh;
    margin: auto!important;
}

.image-fullscreen-index {
    margin: 0 0.3rem;
    color: #8b8b8b;
    padding: 0;
    font-size: 0.8rem;
}

.custom-script-page-number-container {
    position: absolute;
    top: 30px;
    left: 10px;
    z-index: 10;
    font-size: 0.8rem;
    color: #7a7a7a;
}

body.custom-script-hide-cursor {
    cursor: none;
}

.custom-script-hidden, .custom-script-hidden>* {
    visibility: hidden;
    top: -70vh!important;
}

.custom-script-summary-close {
    text-align: center;
    cursor: pointer;
    background: #ffffff8c;
    margin: 0.2rem;
    border-radius: 5px;
    height: 16px;
}

.custom-script-summary{
    left: 10px;
}
.custom-script-search {
    right: 10px;
}
.custom-script-summary, .custom-script-search {
    position: absolute;
    top: 50px;
    left: 10px;
    z-index: 10;
    font-size: 0.8rem;
    width: 11rem;
    max-height: 70%;
    overflow-y: auto;
    background-color: rgb(247 247 247 / 90%);
    border-radius: 5px;
    box-shadow: 0px 1px 2px 2px #00000014;
    transition: all 1s;
}

.custom-search-result {
    margin: 0.2rem;
    background: white;
    border-radius: 5px;
    padding: 5px;
    display: block;
    color: #222;
}

a.custom-script-summary-link {
    display: block;
    padding: 0.1rem 0.2rem;
}

a.custom-script-slideshow-btn.wnl-rounded-button {
    align-items: center;
    cursor: pointer;
    flex-direction: column;
    position: absolute;
    right: 10px;
    z-index: 5;
    display: flex;background-color: #fafafabf;
    border-radius: 5%;
    height: 40px;
    justify-content: center;
    width: 40px;
    /*box-shadow: 0 0 2px #333;*/
    transition: all 1s;
}

span.custom-btn-caption {
    font-size: 0.675rem;
    line-height: 1.2rem;
}

a.wnl-rounded-button.bookmark {
    top: 60px!important;
    transition: all 1s;
}

a.custom-options-btn svg {transform: rotateX(180deg);transition: transform 1s;}

a.custom-options-btn.active svg {transform: none;}

.custom-script-invert-images img.iv-large-image, .logo-mobile {
    filter: invert(1) hue-rotate(
180deg) saturate(1.4);
}`

const head = unsafeWindow.document.querySelector('head')
const stylesheet = document.createElement('style')
stylesheet.innerHTML = styles
head.appendChild(stylesheet)