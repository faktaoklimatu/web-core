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
    var navbars = new Navbars();

    // Custom expanders for expandable preview blocks.
    $(".preview-blocks-expander .expander").click(function() {
        let buttonCollapsedClass = "collapsed";
        // Animate the chevron icon.
        $(this).toggleClass(buttonCollapsedClass);
        // Swap the "More" / "Less" labels.
        $(this).find("span").toggleClass("d-none");

        var root = $(this).parents(".expandable-block");
        var expandables = root.find(".expandable");

        // Show / hide the preview blocks. Do a 2-phase transition to make sure the 'display' property does not change
        // in one of the phases. This is the animated phase (change in 'display' blocks css transition to happen).
        let blockExpandingClass = "expanding";
        let blockExpandedClass = "expanded";
        if (expandables.hasClass(blockExpandedClass)) {
            // Hiding the block may cause scrolling, esp. on mobile. Minimize the chaos by freezing navbar updates.
            navbars.freezeUpdates();
            expandables.removeClass(blockExpandedClass);
            setTimeout(() => {
                expandables.removeClass(blockExpandingClass);
                navbars.unfreezeUpdates();
              }, "550");
        } else {
            expandables.addClass(blockExpandingClass);
            setTimeout(() => {
                expandables.addClass(blockExpandedClass);
              }, "50");
        }
    });
});
