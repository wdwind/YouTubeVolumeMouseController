// ==UserScript==
// @name YouTube Volume Mouse Controller
// @namespace wddd
// @version 1.0.0
// @author wddd
// @description Control YouTube volume by mouse.
// @include https://www.youtube.com/watch?v=*
// @require https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js
// @run-at document-end
// @grant GM_addStyle
// @noframes
// ==/UserScript==

(function () {
    "use strict";
    var player = $("video");
    var timer = 0;

    // detect available wheel event
    var support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
                document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                "DOMMouseScroll"; // let"s assume that remaining browsers are older Firefox

    player.bind(support, function(event) {
        var originalEvent = event.originalEvent;
        var volume = player[0].volume;
        var volumeDelta = 0.05;
        var deltaY = 0;
        
        if (support == "mousewheel") {
            deltaY = originalEvent.wheelDelta;
        } else {
            deltaY = originalEvent.deltaY || originalEvent.detail;
        }

        volume += (deltaY > 0 ? -volumeDelta : volumeDelta);
        player[0].volume = Math.max(0, Math.min(1, volume));

        $(".ytp-volume-panel").attr("aria-valuenow", (player[0].volume * 100).toFixed(0));
        $(".ytp-volume-slider-handle").css("left", ((player[0].volume * 100) * 0.4) + "px");

        showSlider();
        
        // Prevent the page to scroll
        return false;
    });

    function showSlider() {
        if (timer) {
            clearTimeout(timer);
        }

        var sliderBar = $("div#sliderBar");
        if (!sliderBar[0]) {
            $("body").append('<div id="sliderBar"></div>');
            GM_addStyle([
                "#sliderBar {width: 100%;",
                "height: 20px;",
                "position: fixed;",
                "top: 63px;",
                "z-index: 9999;",
                "text-align: center;",
                "color: #fff;",
                "font-size: initial;",
                "opacity: 0.9;",
                "background-color: rgba(0,0,0,0.2);}",
            ].join(" "));
            sliderBar = $("div#sliderBar");
        }

        sliderBar.fadeIn(100);
        timer = setTimeout(function() {
            sliderBar.fadeOut(700);
        }, 1000);

        sliderBar.html("Volume: " + (player[0].volume * 100).toFixed(0));
    }
})();
