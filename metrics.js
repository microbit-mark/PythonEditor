"use strict";

// Used to track when a hex file is downloaded without code modifications
var defaultScript = "";

window.addEventListener("load", function() {
  sendMetric("/page-load");
  // Capture the default script loaded in the editor
  defaultScript = EDITOR.getCode();
});

function sendMetric(slug) {
    slug = slug.replace(/,/g, '-');
    $.ajax({
        type: "GET",
        url: "https://metrics.microbit.org/pyeditor-" + EDITOR_VERSION + slug,
        complete: function(res) {
            // Do nothing
        }
    });
}

function trackLines() {
    var range = [[0, 20], [21, 50], [51, 100], [101, 200], [201, 500], [501, 1000], [1001, 1000000]];
    var currentCode = EDITOR.getCode();
    var slug = "/lines/";

    if (currentCode == defaultScript) {
      slug += "default-script";
    } else {
      var lines = currentCode.split(/\r\n|\r|\n/).length;
      var bucket = range.filter(function(a) {
          if (lines >= a[0] && lines <= a[1]) return a;
      });
      slug += bucket[0].toString();
    }

    sendMetric(slug);
}

function trackFiles() {
    var range = [[11, 15], [16, 20], [21, 25], [26, 1000]];
    var files;

    try {
        // Will always be at least 1 due to main.py
        files = micropythonFs.ls().length;
    }
    catch(e) {
        // If the filesystem is not present assume one file (main.py)
        sendMetric("/files/1");
        return;
    }

    if (files > 10) {
        var bucket = range.filter(function(a) {
            if (files >= a[0] && files <= a[1]) return a;
        });
        var slug = "/files/" + bucket[0].toString();
        sendMetric(slug);
    }
    else {
        var slug = "/files/" + files.toString();
        sendMetric(slug);
    }
}

// Records flashing times
function trackflashingTime(){
  var flashTime = 0;
  var timeBracket = "error";
  var flashing = setInterval(function(){
    if ($("#flashing-overlay-error").html() !== "") {
      // Error appeared
      sendMetric("/flash-time/error");
      clearInterval(flashing);
    }
    flashTime += 100;
    if ($("#flashing-overlay-container").css("display") === "none") {
      if (flashTime < 10000) {
        timeBracket = "0-10";
      }
      else if (flashTime <= 20000) {
        timeBracket = "10-20";
      }
      else if (flashTime <= 30000) {
        timeBracket = "20-30";
      }
      else if (flashTime <= 60000) {
        timeBracket = "30-60";
      }
      else if (flashTime <= 120000) {
        timeBracket = "60-120";
      }
      else {
        timeBracket = "120+";
      }
      sendMetric("/flash-time/" + timeBracket);
      clearInterval(flashing);
    }
  }, 100);
};

// Dropping into editor
$('#editor').on('drop', function (e) {
    var file = e.originalEvent.dataTransfer.files[0];
    var ext = (/[.]/.exec(file.name)) ? /[^.]+$/.exec(file.name) : ["none"];

    switch(ext[0]) {
      case "py":
        sendMetric("/drop/py");
        break;
      case "hex":
        sendMetric("/drop/hex");
        break;
      default:
        sendMetric("/drop/invalid");
    }
});

// Dropping into load area
document.addEventListener('load-drop', function (e) {
    var file = e.detail;
    var ext = (/[.]/.exec(file.name)) ? /[^.]+$/.exec(file.name) : ["none"];

    switch(ext[0]) {
      case "py":
        sendMetric("/drop/py");
        break;
      case "hex":
        sendMetric("/drop/hex");
        break;
      default:
        sendMetric("/drop/invalid");
    }
});

$(".action").click(function (e) {
    var slug = "/action/" + $(e.target).closest(".action")[0].id;
    slug = slug.replace("command-", "");

    if (slug.match(/_save/)) {
      slug = "/action/file-save";
    }
    else if (slug.match(/_remove/)) {
      slug = "/action/file-remove";
    }
    // Note - The save action has been renamed to save-hex in the combined save/load button
    switch(slug) {
      case "/action/flash":
        trackflashingTime();
        /* Intentional fall-through */
      case "/action/download":
      case "/action/save":
      case "/action/save-hex":
        trackLines();
        trackFiles();
        /* Intentional fall-through */
      default:
        sendMetric(slug);
        break;
    }
});
