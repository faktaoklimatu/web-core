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

    // Custom expanders for expandable preview blocks.
    $(".preview-blocks-expander .expander").click(function() {
        $(this).toggleClass("collapsed");
        $(this).find("span").toggleClass("d-none");
        var expandables = $(this).parents(".expandable-block").find(".expandable");
        if (expandables.hasClass("expanded")) {
            expandables.removeClass("expanded");
            setTimeout(() => {
                expandables.removeClass("expanding");
              }, "550");
        } else {
            expandables.addClass("expanding");
            setTimeout(() => {
                expandables.addClass("expanded");
              }, "50");
        }
        // Scroll back up after hiding blocks (notably needed for mobile).
        if ($(this).hasClass("collapsed")) {
            $(this).parents(".expandable-block").get(0).scrollIntoView({block: "nearest", inline: "nearest"});
        }
    });

    // Create the instance that handles js search.
    var s = new Search();

    // Create the instance that handles navbars.
    var n = new Navbars();
});
