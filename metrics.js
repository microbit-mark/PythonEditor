function sendMetric(slug) {
  $.ajax({
    type: "GET",
    url: "https://metrics.microbit.org/pyeditor-" + EDITOR_VERSION + slug,
    complete: function(res) {
    }
  })
}

$(".action").click(function (e) {
    var slug = "/action/" + $(e.target).closest(".action")[0].id;
    slug = slug.replace("command-", "");
    sendMetric(slug);
});
