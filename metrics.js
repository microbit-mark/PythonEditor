function sendMetric(slug) {
    $.ajax({
      type: "GET",
      url: "https://metrics.microbit.org/pyeditor-" + EDITOR_VERSION + slug,
      complete: function(res) {
      }
    })
}

function trackLines() {
    var range = [[0, 20], [21, 30], [31, 50], [51, 100], [101, 200], [201, 1000], [1001, 1000000]];
    var lines = EDITOR.getCode().split(/\r\n|\r|\n/).length;

    var bucket = range.filter(function(a) {
      if (lines >= a[0] && lines <= a[1]) return a;
    })

    var slug = "/lines/" + bucket[0].toString();
    sendMetric(slug);
}

function trackFiles() {
    var range = [[11, 15], [16, 20], [21, 25], [26, 1000]];
    var files;

    try {
      // Will always be at least 1 due to main.py
      files = micropythonFs.ls().length;
    }
    catch {
      // If the filesystem is not present
      sendMetric("/files/-1");
      return;
    }

    if (files > 10) {
      var bucket = range.filter(function(a) {
        if (files >= a[0] && files <= a[1]) return a;
      })

      var slug = "/files/" + bucket[0].toString();
      sendMetric(slug);
    }
    else {
      var slug = "/files/" + files.toString();
      sendMetric(slug);
    }
}

window.onload = function() {
    sendMetric("/page-load/");
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

    if (slug.includes("_save")) {
      slug = "/action/file-save";
    }
    else if (slug.includes("_remove")) {
      slug = "/action/file-remove";
    }

    // Note - The save action has been renamed to save-hex in the combined save/load button
    switch(slug) {
      case "/action/download":
      case "/action/flash":
      case "/action/save":
      case "/action/save-hex":
        sendMetric(slug);
        trackLines();
        trackFiles();
        break;
      default:
        sendMetric(slug);
    }
});
