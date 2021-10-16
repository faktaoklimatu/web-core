(function() {
  const i18n = {
    cs: {
      CLOSE: 'Zavřít',
      NEXT: 'Další',
      PREV: 'Předchozí',
      DOWNLOAD: 'Stáhnout',
    },
    sk: {
      CLOSE: 'Zavrieť',
      NEXT: 'Ďalší',
      PREV: 'Predchádzajúca',
      DOWNLOAD: 'Stiahnuť',
    },
  };

  const defaults = $.fancybox.defaults;
  defaults.lang = window.fakta.lang;
  defaults.buttons = [
    'zoom',
    'close',
  ];
  for (const [lang, values] of Object.entries(i18n)) {
    defaults.i18n[lang] = {
      ...defaults.i18n.en,
      ...values,
    };
  }
  defaults.beforeLoad = function(instance, current) {
    const customCaption = current.opts.$orig[0].parentElement.querySelector('.fancybox-custom-caption');
    if (customCaption) {
      const captionBody = instance.$refs.caption[0].querySelector('.fancybox-caption__body');
      captionBody.innerHTML = '';
      captionBody.appendChild(customCaption.cloneNode(true));
    }
  };
})();
