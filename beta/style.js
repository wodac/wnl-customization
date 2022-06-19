
(function(){
const styles = `:root {
    --uniform-font-size: 0.93em;
    --scaled-font-size: 110%;
}

html {
    scroll-behavior: smooth;
}

.custom-script-bottom-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 1rem;
    gap: 1rem;
}

.custom-script-bottom-container>div {
    border: 1px solid rgb(239, 240, 243);
    padding: 15px;
    flex-grow: 1;
    flex-basis: 45%;
}

.questionsList__paginationContainer {
    /* position: absolute!important; */
    top: 0;
    left: 0;
    z-index: 1000;
    background: white;
}

.custom-script-increase-font-size .sl-block-content span[style*='21px'] {
    font-size: 0.75em !important;
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
    font-size: var(--scaled-font-size) !important;
}

.custom-script-uniform-font-size .sl-block-content :not(h1, h2, h3, h1 *, h2 *, h3 *, sub) {
    font-size: var(--uniform-font-size) !important;
}

.reveal.reveal-viewport.has-vertical-slides.has-horizontal-slides.custom-script-background-color {
    background: var(--custom-slideshow-bg-color)!important;
    color: var(--custom-slideshow-fg-color)!important;
}

.custom-script-setting input[type="color"] {    
    appearance: none;
    border: 0;
    padding: 0;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    background: transparent;
}

@media screen and (orientation:landscape) {
    section.stack.present section {
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 1em;
    }
}

@media screen and (max-width: 980px) {

    .custom-notes-view-btn,
    .custom-tags-view-btn {
        display: none !important;
    }

    div.custom-tag:not(.editing) .custom-remove,
    div.custom-tag:not(.editing) .custom-change-color {
        width: 16px;
    }

    .custom-script-bottom-container>div {
        flex-basis: 100%;
    }
}

@media screen and (orientation: landscape) {
    .reveal.reveal-viewport.image-custom-background {
        background-size: max(var(--scaled-font-size),100%);
        background-position-y: min(100%, calc(200% - var(--scaled-font-size)));
    }
}

@media screen and (min-width: 980px) {
    .fullscreen .reveal.reveal-viewport.image-custom-background {
        background-position-y: max(100%,var(--scaled-font-size));
        background-size: 120%;
    }
}

@media screen and (orientation: portrait) and (max-width: 980px) {
    .slides {
        height: 259vh !important;
    }

    .stack.present section.present {
        display: flex !important;
        align-items: center;
        flex-direction: column;
        gap: 3rem;
        justify-content: center;
    }

    .reveal-scope .reveal .sl-block {
        position: unset !important;
    }
}

.custom-script-increase-font-size .wnl-reference {
    margin-left: 0.5em
}

.custom-script-increase-font-size .wnl-reference svg,
.custom-script-uniform-font-size .wnl-reference svg {
    transform: scale(1.6) !important;
}

sub.small {
    margin-left: 0.5rem !important;
    font-size: 1.5rem !important;
}

.m-imageFullscreenWrapper {
    max-height: 80vh;
    text-align: center;
}

.m-imageFullscreenWrapper img {
    max-height: 80vh;
    margin: auto !important;
}

.image-fullscreen-index {
    margin: 0 0.3rem;
    color: #8b8b8b;
    padding: 0;
    font-size: 0.8rem;
}

.custom-script-setting {
    padding: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.custom-script-setting svg {
    flex-shrink: 0;
}

.custom-script-setting * {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin-right: 0 !important;
}

.custom-setting-divider {
    padding: 0.5rem;
}

.custom-setting-divider>div {
    border-bottom: solid 1px #eff0f3;
}

.custom-script-page-number-container {
    position: absolute;
    top: 30px;
    left: 0;
    z-index: 10;
    font-size: 0.8rem;
    color: #7a7a7a;
    padding-left: 10px;
    padding-bottom: 1rem;
    padding-right: 1.5rem;
    cursor: pointer;
}

body.custom-script-hide-cursor {
    cursor: none;
}

.custom-script-hidden {
    visibility: hidden;
    top: -70vh !important;
}

.custom-script-summary-close {
    text-align: center;
    cursor: pointer;
    background: #ffffff8c;
    margin: 0.2rem;
    border-radius: 5px;
    height: 16px;
}

.custom-script-summary-link-container ul {
    margin-left: 1rem;
}

.custom-script-summary-link-container:not(.active) ul {
    display: none;
}

.custom-script-summary-link-container.active>a {
    font-weight: 700;
}

.custom-script-summary {
    left: 10px;
}

.slideshow-container .custom-script-search {
    right: 10px;
}

.custom-script-summary,
.slideshow-container .custom-script-search,
.custom-script-notes-column {
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
    transition: top 1s, visibility 1s;
    resize: horizontal;
    min-width: 11rem;
}

.custom-script-search {
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.custom-script-search>.custom-search-results {
    height: 100%;
    overflow-y: auto;
    max-height: 70vh;
}

p.custom-search-invitation {
    display: flex;
    height: 100%;
    opacity: 0.6;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
}

.custom-search-input-container {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.custom-search-result.custom-loading {
    opacity: 0.6;
}

.custom-search-result.custom-loading:nth-child(2) {
    opacity: 0.3;
}

.custom-search-result.custom-loading>div {
    background: linear-gradient(314deg, #707070, #ffffff);
    background-size: 400% 400%;
    margin: 0.4rem 0;
    border-radius: 5px;
    animation: LoadingParagraph 4s ease infinite;
}

@keyframes LoadingParagraph {
    0% {
        background-position: 0% 50%
    }

    50% {
        background-position: 100% 50%
    }

    100% {
        background-position: 0% 50%
    }
}

a.custom-clear-search {
    position: absolute;
    display: flex;
    right: 4px;
    color: #555;
}

.custom-search-input-container a.custom-search-submit {
    display: flex;
    padding: 0 0.4rem;
}

.custom-search-input-container div {
    display: flex;
    align-items: center;
    flex-grow: 1;
    position: relative;
}

.custom-search-input-container input {
    width: 100%;
    border-radius: 0;
    border: 0;
    background: #eff0f3;
}

.slideshow-container .custom-search-input-container input {
    border-radius: 5px;
    background: white;
    border: solid 1px #666;
}

.custom-search-result {
    margin: 0.2rem;
    background: white;
    border-radius: 5px;
    padding: 5px;
    display: block;
    color: #222;
    overflow: hidden;
    word-break: break-word;
    flex-shrink: 0;
}

.custom-script-bottom-container .custom-search-result {
    background: #eff0f3;
}

.custom-search-result em {
    font-weight: 900;
    padding-right: 0.2rem;
}

.custom-tagList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
}

a.custom-script-summary-link {
    display: block;
    padding: 0.1rem 0.2rem;
}

.custom-script-additional-options {
    position: absolute;
    top: 55px;
    right: 5px;
    max-height: 30%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    width: 100px;
    align-items: flex-end;
    transition: all 1s;
}

a.custom-script-slideshow-btn.wnl-rounded-button {
    align-items: center;
    flex-direction: column;
    z-index: 5;
    display: flex;
    background-color: #fafafabf;
    border-radius: 5%;
    height: 40px;
    justify-content: center;
    width: 40px;
    margin: 5px;
    overflow: hidden;
    transition: width 0.5s, margin 0.5s;
}

span.custom-btn-caption {
    font-size: 0.675rem;
    line-height: 1.2rem;
}

a.wnl-rounded-button.bookmark {
    position: unset;
    margin: 5px;
}

a.custom-options-btn {
    top: 5px;
    position: absolute;
    right: 5px;
}

a.custom-options-btn svg {
    transform: rotateX(180deg);
    transition: transform 1s;
}

a.custom-options-btn.active svg {
    transform: none;
}

.custom-script-font-size-label {
    margin: 0 0.5rem;
    height: 16px;
    font-size: 24px;
    vertical-align: top;
    width: 4.3rem;
    display: inline-block;
    text-align: center;
}

.custom-script-font-size-input-increase,
.custom-script-font-size-input-decrease {
    vertical-align: sub;
}

.custom-script-font-size-input,
.custom-script-setting input[type=range] {
    -webkit-appearance: none;
    appearance: none;
    margin-right: 0.9em;
    outline: none;
    height: 0.6rem;
    background: #96dbdf !important;
    border-radius: 5px;
    vertical-align: middle;
}

.custom-script-font-size-input::-webkit-slider-thumb,
.custom-script-setting input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.custom-script-font-size-input::-moz-range-thumb {
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.custom-notes-btns-container {
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: wrap-reverse;
    display: none !important;
}

.custom-notes-additional-btns {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
}

.custom-add-note-btns.active {
    height: 90px;
}

.custom-add-note-btns {
    height: 0;
    overflow: hidden;
    transition: height 0.5s;
}

.custom-add-note-btns-container {
    display: flex;
    flex-direction: column-reverse;
}

.custom-script-use-notes .fullscreen-mode .wnl-comments,
.custom-script-use-notes .wnl-lesson-previous-next-nav {
    z-index: 12 !important;
}

.custom-notes-btns-container .wnl-rounded-button {
    color: black !important;
}

.slideshow-container.fullscreen .custom-notes-btns-container {
    margin-left: 70px;
}

.custom-script-notes-column:empty {
    display: none;
}

.custom-script-notes-column .custom-note {
    display: flex;
    align-content: space-between;
    flex-direction: row;
    padding: 5px;
    margin: 5px;
    border-radius: 5px;
    background: white;
}

.custom-script-notes-column .custom-note .custom-note-move {
    display: none;
}

.custom-script-notes-column .custom-note .custom-note-remove {
    color: black;
    margin-right: 0;
    margin-left: auto;
}

.custom-notes-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
}

.custom-notes-overlay .custom-note {
    font-size: 1.6rem !important;
    background: #feffcc;
    position: absolute;
    border: solid 2px #b1b18e;
    padding: 0.5rem 35px 0.5rem 0.5rem !important;
    border-radius: 0.5rem 0.5rem 1.5rem 0.5rem;
    box-shadow: 2px 1px 2px 2px #72725c57;
    min-width: 7rem;
    max-width: 25%;
    max-height: 30%;
    z-index: 11;
    min-height: 70px;
    overflow-y: auto;
}

.custom-note form,
.custom-tag form {
    display: none;
}

.custom-note.editing form,
.custom-tag.editing form {
    display: block;
}

.custom-note.editing .custom-note-content,
.custom-tag.editing .custom-tag-content {
    display: none;
}

.custom-note textarea,
.custom-tag input {
    appearance: none;
    border: none;
    width: 100% !important;
    height: 100% !important;
    background: none;
}

.custom-tag input[type=color] {
    display: none;
}

.custom-notes-overlay a.custom-note-remove {
    top: 0;
}

a.custom-note-move {
    bottom: 12px;
    cursor: move;
}

.custom-note-content {
    text-align: left;
}

.custom-notes-overlay a.custom-note-remove,
a.custom-note-move {
    position: absolute !important;
    right: 4px;
    color: black !important;
    width: 25px;
    height: 25px;
    transition: color 0.5s;
}

.custom-notes-overlay a.custom-note-remove svg,
a.custom-note-move svg {
    width: 25px;
    height: 25px;
}

a.custom-note-remove:hover {
    color: red !important;
}

div.custom-tags-container:hover {
    opacity: 1;
}

.custom-tags-and-btns-container {
    left: 5px;
    position: absolute;
    bottom: 5px;
    z-index: 11;
    display: flex;
    flex-direction: column;
    max-width: 25%;
}

div.custom-tags-container {
    z-index: 11;
    flex-wrap: wrap-reverse;
    opacity: 0.5;
    transition: opacity 0.4s;
    display: none;
    gap: 3px 5px;
}

.custom-tag.custom-new-tag {
    color: #95b9f9;
    background: none;
    align-items: center;
}

.custom-tag {
    border-radius: 5px;
    padding: 2px 5px;
    display: flex;
    font-size: 12px;
    max-width: 70px;
    height: 25px;
    overflow: hidden;
    align-content: space-between;
    justify-content: space-between;
    flex-wrap: nowrap;
    flex-direction: row;
}

.custom-tag-content {
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
}

div.custom-tag .custom-remove,
div.custom-tag .custom-change-color {
    display: inline-block;
    text-align: right;
    cursor: pointer;
    width: 0;
    overflow: hidden;
    transition: width 0.5s, color 0.5s;
    color: inherit;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
}

div.custom-tag .custom-remove:hover {
    color: #870000;
}

div.custom-tag .custom-remove svg,
div.custom-tag .custom-change-color svg {
    width: 13px;
    height: 13px;
}

div.custom-tag:not(.editing):hover .custom-remove,
div.custom-tag:not(.editing):hover .custom-change-color {
    width: 16px;
}

.custom-notes-btns-container.custom-no-notes .custom-clear-notes-btn,
.custom-notes-btns-container.custom-no-notes .custom-notes-view-type-btn,
.inactive.custom-notes-additional-btns>.wnl-rounded-button {
    width: 0;
    margin: 5px 0;
}

.custom-new-tag.custom-tag:only-child {
    display: none;
}

.custom-while-active {
    display: none !important;
}

.active .custom-while-active.a-icon {
    display: inline-flex !important;
}

.active .custom-while-inactive {
    display: none !important;
}

.custom-script-use-notes.custom-script-notes-visible .custom-notes-overlay {
    display: block !important;
}

.custom-script-use-notes .custom-notes-btns-container,
.custom-script-use-notes.custom-script-tags-visible div.custom-tags-container {
    display: flex !important;
}

.custom-main-nav-container>a svg {
    transition: transform 0.5s;
    transform: rotateX(180deg);
}

.custom-main-nav-container>a {
    display: flex;
    padding: 15px;
    width: 100%;
    gap: 0.4rem;
    text-align: center;
    align-items: center;
    font-size: 11px;
}

.custom-main-nav-container.active>a svg {
    transform: none;
}

.custom-main-nav-container>div {
    transition: height 0.6s;
    height: 0;
    overflow: hidden;
}

.custom-main-nav-container.active>div {
    height: 100%;
    overflow: auto;
}

.custom-main-nav-container.active {
    height: 100%;
}

.custom-main-nav-container {
    transition: height 0.6s;
    height: 3.3rem;
    padding-bottom: 3.3rem;
}

span.custom-heading {
    margin-bottom: 0.9rem;
    display: flex;
    gap: 0.4rem;
}

.custom-script-hideBottomSearch .custom-script-bottom-container .custom-script-search,
.custom-script-hideTools .custom-script-tools-container,
.custom-script-hideTags .custom-tagListContainer,
.custom-script-hide-chat .wnl-chat-toggle {
    display: none !important;
}

.custom-script-hide-chat .wnl-course-content.wnl-column {
    max-width: initial !important;
}

.custom-script-invert-images img.iv-large-image,
.logo-mobile {
    filter: invert(1) hue-rotate(180deg) saturate(1.4);
}

.custom-script-slide-nav-chat .navigate-right.wnl-slideshow-control,
.custom-script-slide-nav-chat .navigate-left.wnl-slideshow-control {
    opacity: 0.2;
    transition: opacity 0.4s;
}

.custom-script-slide-nav-chat .navigate-right.wnl-slideshow-control:hover,
.custom-script-slide-nav-chat .navigate-left.wnl-slideshow-control:hover {
    opacity: 1;
}`;
const stylesheet = document.createElement('style');
stylesheet.innerHTML = styles;
document.head.append(stylesheet);})()