(function () {
  window.addEventListener('message', function (event) {
    if (event.data.type === 'resize' && event.data.height) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(function (iframe) {
        try {
          if (iframe.contentWindow === event.source) {
            iframe.style.height = event.data.height + 'px';
          }
        } catch (e) {
          console.error("error when resizing iframes:", e)
        }
      });
    }
  });
})();
