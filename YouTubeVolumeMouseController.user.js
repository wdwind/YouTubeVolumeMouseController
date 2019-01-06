// ==UserScript==
// @name            YouTube Volume Mouse Controller
// @namespace       wddd
// @version         1.4.0
// @author          wddd
// @license         MIT
// @description     Control YouTube video volume by mouse wheel.
// @homepage        https://github.com/wdwind/YouTubeVolumeMouseController
// @downloadURL     https://github.com/wdwind/YouTubeVolumeMouseController/raw/master/YouTubeVolumeMouseController.user.js
// @match           *://www.youtube.com/*
// ==/UserScript==

function getVideo() {
    return document.getElementsByTagName("video")[0];
}

function run() {
    var player = getVideo();
    var timer = 0;

    // detect available wheel event
    var support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
        document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
            "DOMMouseScroll"; // let"s assume that remaining browsers are older Firefox

    player.addEventListener(support, function (event) {
        var originalEvent = event;
        var volume = player.volume;
        var volumeDelta = 0.05;
        var deltaY = 0;

        if (support == "mousewheel") {
            deltaY = originalEvent.wheelDelta;
        } else {
            deltaY = originalEvent.deltaY || originalEvent.detail;
        }

        volume += (deltaY > 0 ? -volumeDelta : volumeDelta);

        if (player.muted) {
            // Unmute first
            document.getElementsByClassName("ytp-mute-button")[0].click();
        }

        player.volume = Math.max(0, Math.min(1, volume));

        document.getElementsByClassName("ytp-volume-panel")[0].setAttribute("aria-valuenow", (player.volume * 100).toFixed(0));
        addCss(document.getElementsByClassName("ytp-volume-slider-handle")[0], {left: ((player.volume * 100) * 0.4) + "px"});

        timer = showSlider(timer);

        // Prevent the page to scroll
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
    });
}

function showSlider(timer) {
    if (timer) {
        clearTimeout(timer);
    }

    var sliderBar = appendSlideBar();

    sliderBar.style.display = "block";
    timer = setTimeout(function () {
        sliderBar.style.display = "none";
    }, 1000);

    sliderBar.innerText = "Volume: " + (getVideo().volume * 100).toFixed(0);

    return timer;
}

function appendSlideBar() {
    var sliderBar = document.getElementById("sliderBar");
    if (!sliderBar) {
        var sliderBarElement = document.createElement("div");
        sliderBarElement.id = "sliderBar";

        document.getElementsByClassName("html5-video-container")[0].appendChild(sliderBarElement);

        sliderBar = document.getElementById("sliderBar");
        addCss(sliderBar, {
            "width": "100%",
            "height": "20px",
            "position": "relative",
            "z-index": "9999",
            "text-align": "center",
            "color": "#fff",
            "font-size": "initial",
            "opacity": "0.9",
            "background-color": "rgba(0,0,0,0.2)",
        });
    }

    addCss(sliderBar, {"top": getSliderBarTopProp() + "px"});

    return sliderBar;
}

function addCss(element, css) {
    for (var cssAttr in css) {
        element.style[cssAttr] = css[cssAttr];
    }
}

function getSliderBarTopProp() {
    var fullScreenTitleHeight = 0;

    var fullScreenTitle = document.getElementsByClassName("ytp-title")[0];
    if (fullScreenTitle && fullScreenTitle.offsetParent) {
        fullScreenTitleHeight = fullScreenTitle.offsetHeight;
    }

    var videoTop = getVideo().getBoundingClientRect().top;
    var headerBoundingBox = 
        (document.getElementById("masthead-positioner") || document.getElementById("masthead-container")).getBoundingClientRect();
    var headerTop = headerBoundingBox.top;
    var headerHeight = headerBoundingBox.height;

    var overlap = (headerHeight + headerTop > 0) ? Math.max(0, headerHeight - videoTop) : 0;

    return Math.max(fullScreenTitleHeight, overlap);
}

/**
 * YouTube use Javascript to navigate between pages. So the script will not work:
 * 1. If the script only includes/matches the sub pages (like the video page www.youtube.com/watch?v=...)
 * 2. And the user navigates to the sub page from a page which is not included/matched by the script
 *
 * In the above scenario, the script will not be executed.
 *
 * To run the script in all cases,
 * 1. Include/match the whole YouTube host
 * 2. Detect Javascript events, and run the script appropriately
 *
 * Details:
 * * https://stackoverflow.com/questions/32275387/recall-tampermonkey-script-when-page-location-changes/32277150#32277150
 * * https://stackoverflow.com/questions/34077641/how-to-detect-page-navigation-on-youtube-and-modify-html-before-page-is-rendered
 * * https://github.com/1c7/Youtube-Auto-Subtitle-Download/blob/master/Youtube-Subtitle-Downloader/Tampermonkey.js#L122-L152
 */

// trigger when navigating to new material design page
window.addEventListener("yt-navigate-finish", function () {
    if (window.location.href.includes("/watch?v=")) {
        run();
    }
});

// trigger when navigating to the old page
window.addEventListener("spfdone", function () {
    if (window.location.href.includes("/watch?v=")) {
        run();
    }
});

// trigger when directly loading the page
window.addEventListener("DOMContentLoaded", function () {
    if (window.location.href.includes("/watch?v=")) {
        run();
    }
});

/**
 * Use MutationObserver to cover all edge cases.
 * https://stackoverflow.com/a/39803618
 * 
 * This is to handle the use case where navigation happens but <video> has not been loaded yet. 
 * (In YouTube the contents are loaded asynchronously.)
 */
var observer = new MutationObserver(function() {
    if (getVideo()) {
        observer.disconnect();
        run();
    }
});

observer.observe(document.body, /* config */ {childList: true, subtree: true});
