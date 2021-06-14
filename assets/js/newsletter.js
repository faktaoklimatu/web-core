$(document).ready(() => {
    $('#newsletter-modal').one('show.bs.modal', (event) => {
        const newsletterId = event.target.dataset.newsletterId;

        window['ecm-widget'] = 'ecmwidget';
        window['ecmwidget'] = window['ecmwidget'] || function() {
            (window['ecmwidget'].q = window['ecmwidget'].q || []).push(arguments)
        };

        const js = document.createElement('script');
        js.id = newsletterId;
        js.dataset.a = 'faktaoklimatu';
        js.src = 'https://d70shl7vidtft.cloudfront.net/widget.js';

        document.head.appendChild(js);
    });
});
