$(document).ready(function() {
    if ($("#dev-warning").length == 1) {
        console.log('This is the local development version of the website.');
    }

    // Open the correponding <details> rolldown if the URL target is inside one
    // and scroll browser view to the target element.
    if (location.hash) {
        const targetEl = $(decodeURIComponent(location.hash));
        const parentDetails = targetEl.parents('details')[0];
        if (parentDetails) {
            parentDetails.open = true;
            targetEl[0].scrollIntoView();
        }
    }

    // Enable all poppers in the document
    setTimeout(function () {
        $('[data-toggle="popover"]').popover();
    }, 500);

    // Render table of contents if it is non-trivial.
    if ($('.longread h2, .longread h3').length > 1) {
        tocbot.init({
            tocSelector: '#TOC',
            contentSelector: '.longread',
            headingSelector: 'h2, h3',
            headingsOffset: -780,
            scrollSmooth: false,
        });
        $('.longread-toc').removeClass('invisible');
    } else {
        $('.longread-toc').addClass('longread-toc-none');
    }

    // Create the instance that handles js search.
    var s = new Search();

    // Create the instance that handles navbars.
    var n = new Navbars();
});
