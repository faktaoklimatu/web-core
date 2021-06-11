---
# Empty front matter to enable Jekyll processing
---
$("#newsletter-modal").on('shown.bs.modal', function(w, d, s, o, f, js, fjs) {
    w['ecm-widget'] = o;
    w[o] = w[o] || function() {
        (w[o].q = w[o].q || []).push(arguments)
    };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = '{{ site.newsletter }}';
    js.dataset.a = 'faktaoklimatu';
    js.src = f;
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
}(window, document, 'script', 'ecmwidget', 'https://d70shl7vidtft.cloudfront.net/widget.js'));
