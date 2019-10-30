"use strict";

// Used to track when a hex file is downloaded without code modifications
var defaultScript = "";

window.addEventListener("load", function() {
    measureViewport();
    // Retained so we can compare with GA.
    sendLegacyPageViewMetric();

    // Capture the default script loaded in the editor
    defaultScript = EDITOR.getCode();

    attachActionListeners();
    // Some buttons create modals that need the action listener to be attached
    $("#command-snippet").on("click", attachActionListeners);
    $("#command-files").on("click", function(e) {
        attachActionListeners();
        // Adding new files to the filesystem creates new nodes in the DOM
        $("#fs-file-upload-input").on("change", function(event) {
            // It takes some time for a file to upload and appear in the DOM
            setTimeout(attachActionListeners, 1000);
        });
    });
});

function attachActionListeners() {
    $(".action").off("click", actionClickListener);
    $(".action").on("click", actionClickListener);
}

function sendLegacyPageViewMetric() {
    if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1" &&
    location.hostname !== "") {
        $.ajax({
            type: "GET",
            url: "https://metrics.microbit.org/pyeditor-" + EDITOR_VERSION + "/page-load",
            complete: function(res) {
                // Do nothing
            }
        });
    }
    else {
        console.log("metric: pageview"); 
    }
}

function sendEvent(action, label, value) {
    // Do not send the metrics if running locally during development
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1" ||
            location.hostname === "") { 
        console.log("metric: " + action + " " + label + " " + value);
    } else {
        gtag('event', action, {
            event_category: 'Python Editor ' + EDITOR_VERSION,
            event_label: label,
            value: value
        });
    }
}

function measureViewport(){
    var  widthRange = [[0, 480], [481, 890], [891,1024], [1025, 1280], [1281, 10000]];
    var viewportWidth = $(window).width();

    var bucket = widthRange.filter(function(a) {
        if (viewportWidth >= a[0] && viewportWidth <= a[1]) return a;
    });
    var label = bucket.toString().replace(/,/g, '-');

    sendEvent('viewport', label, 1);
}

function trackLines() {
    var range = [[0, 20], [21, 50], [51, 100], [101, 200], [201, 500], [501, 1000], [1001, 1000000]];
    var currentCode = EDITOR.getCode();

    if (currentCode == defaultScript) {
        var label = 'default';
    } else {
        var lines = currentCode.split(/\r\n|\r|\n/).length;
        var bucket = range.filter(function(a) {
            if (lines >= a[0] && lines <= a[1]) return a;
        });
        var label = bucket.toString().replace(/,/g, '-');
    }

    sendEvent('lines', label, 1);
}

function trackFiles() {
    var range = [[11, 15], [16, 20], [21, 25], [26, 1000]];
    var files = micropythonFs.ls().length;

    var label = files.toString();
    if (files > 10) {
        var bucket = range.filter(function(a) {
            if (files >= a[0] && files <= a[1]) return a;
        });
        label = bucket.toString().replace(/,/g, '-');
    }

    sendEvent('files', label , 1);
}

function trackFsSize() {
    var range = [[0, 5], [6, 10], [11, 15], [16, 20], [21, 25], [26, 30], [30, 1000]];
    var fsUsed = micropythonFs.getStorageUsed() / 1024;

    var bucket = range.filter(function(a) {
        if (fsUsed >= a[0] && fsUsed <= a[1]) return a;
    });
    var label = bucket.toString().replace(/,/g, '-');

    sendEvent('fs-used', label , 1);
}

/**
 * Returns an analytics label for the file extension.
 * "none" is used when there is no extension.
 */
function fileExtension(file) {
  var lowerName = file.name.toLowerCase();
  var ext = (/[.]/.exec(lowerName)) ? /[^.]+$/.exec(lowerName) : ["none"];
  return ext[0];
}

// Dropping into editor
$('#editor').on('drop', function (e) {
    var file = e.originalEvent.dataTransfer.files[0];
    var label = fileExtension(file);
    if ((label === 'py') || (label==='hex')) {
        sendEvent('load', 'drop-editor-' + label, 1);
    } else {
        sendEvent('load', 'error-drop-editor-type-' + label, 1);
    }
});

// Dropping into load area
document.addEventListener('load-drop', function (e) {
    var file = e.detail;
    var label = fileExtension(file);
    if ((label === 'py') || (label==='hex')) {
        sendEvent('load', 'drop-load-' + label, 1);
    } else {
        sendEvent('load', 'error-drop-load-type-' + label, 1);
    }
});

// Uploading a file to the editor via Load/Save modal
document.addEventListener('file-upload', function (e) {
    var files = e.detail;
    if (files.length === 1) {
        var label = fileExtension(files[0]);
        if ((label === 'py') || (label==='hex')) {
            sendEvent('load', 'file-upload-' + label, 1);
        } else {
            sendEvent('load', 'error-file-upload-type-' + label, 1);
        }
    } else {
        sendEvent('load', 'error-file-upload-multiple', 1);
    }
});

// WebUSB flash time and errors
document.addEventListener('webusb', function (e) {
    var details = e.detail;
    if (details["event-type"] == "flash-time" ) {
        var flashAction = 'WebUSB-time';
        var flashTime = details["message"];
        var flashLabel = 'unknown';
        if (flashTime < 2000) {
            flashLabel = "0-2";
        } else if (flashTime <= 4000) {
            flashLabel = "2-4";
        } else if (flashTime <= 6000) {
            flashLabel = "4-6";
        } else if (flashTime <= 10000) {
            flashLabel = "6-10";
        } else if (flashTime <= 20000) {
            flashLabel = "10-20";
        } else if (flashTime <= 30000) {
            flashLabel = "20-30";
        } else if (flashTime <= 60000) {
            flashLabel = "30-60";
        } else if (flashTime <= 120000) {
            flashLabel = "60-120";
        } else {
            flashLabel = "120+";
        }
        var flashValue = 1;
    } else if (details["event-type"] == "info" ) {
        var flashAction = 'WebUSB-info';
        var flashLabel = details["message"];
        var flashValue = 1;
    } else if (details["event-type"] == "error" ) {
        var flashAction = 'WebUSB-error';
        // TODO: At the moment details["flash-type"] only indicates the flash
        // option selected and doesn't distinguish full flash fall-back
        // so we won't include it for now, but that could be changed
        var flashLabel = details["message"];
        var flashValue = 1;
    } else {
        var flashAction = 'WebUSB-error';
        var flashLabel = "unknown-event/" + details["event-type"] + "/" + details["message"];
        var flashValue = 1;
    }
    sendEvent(flashAction, flashLabel, flashValue);
});

// Any click on an element with the "action" class is captured here
function actionClickListener(e) {
    var actionId = 'unknown';
    if (e.target) {
        actionId = $(e.target).closest(".action")[0].id;
        actionId = actionId.replace("command-", "");
    }

    if (actionId.match(/_save/)) {
      actionId = "file-save";
    }
    else if (actionId.match(/_remove/)) {
      actionId = "file-remove";
    }
    else if (actionId.match(/flashing-overlay-download/)) {
      actionId = "webusb/error-modal/download-hex";
    }
    else if (actionId.match(/flashing-overlay-troubleshoot/)) {
      actionId = "webusb/error-modal/troubleshoot";
    }

    switch(actionId) {
      case "flash":
      case "download":
        trackFiles();
        trackFsSize();
        trackLines();
        /* Intentional fall-through */
      default:
        sendEvent('click', actionId, 1);
      break;
    }
}
