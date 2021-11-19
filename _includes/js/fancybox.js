(function() {
  const defaults = $.fancybox.defaults;

  defaults.lang = {{ site.lang | jsonify }};
  defaults.i18n[defaults.lang] = {{ site.data.lang.fancybox | jsonify }};

  defaults.buttons = [
    'zoom',
    'close',
  ];

  defaults.beforeLoad = function(instance, current) {
    const customCaption = current.opts.$orig[0].parentElement.querySelector('.fancybox-custom-caption');
    if (customCaption) {
      const captionBody = instance.$refs.caption[0].querySelector('.fancybox-caption__body');
      captionBody.innerHTML = '';
      captionBody.appendChild(customCaption.cloneNode(true));
    }
  };

  defaults.afterLoad = function(instance, current) {
    if (current.contentType === 'iframe') {
      const iframeDocument = current.$iframe[0].contentDocument;
      const svg = iframeDocument.firstElementChild;

      const bg = iframeDocument.createElementNS(svg.getAttribute('xmlns'), 'rect');
      bg.setAttribute('width', '100%');
      bg.setAttribute('height', '100%');
      bg.setAttribute('fill', 'white');

      svg.insertBefore(bg, svg.firstChild);
    }
  };
})();
