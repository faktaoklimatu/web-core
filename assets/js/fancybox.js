---
---
$(document).ready(function() {
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

  if (!$.fancybox.isMobile) {
    $('[data-lightbox]').fancybox();
  }
});
