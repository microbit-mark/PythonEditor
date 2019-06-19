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

$(".action").click(function (e) {
    var slug = "/action/" + $(e.target).closest(".action")[0].id;
    slug = slug.replace("command-", "");

    switch(slug) {
      case "/action/download":
      case "/action/flash":
      case "/action/save":
      case "/action/save-hex":
        sendMetric(slug);
        trackLines();
        break;
      default:
        sendMetric(slug);
    }
});
