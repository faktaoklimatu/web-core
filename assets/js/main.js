$(document).ready(function() {
    if ($("#dev-warning").length == 1) {
        console.log('This is the local development version of the website.');
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
    var search = new Search();

    // Create the instance that handles navbars.
    var navbars = new Navbars();

    // Custom handler for expanders for expandable preview blocks.
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
                this.scrollIntoView({block: "nearest"});
            }, 550);
            // Allow enough time for scrollIntoView to propagate before unfreezing navbar.
            setTimeout(() => {
                navbars.unfreezeUpdates();
            }, 1500);
        } else {
            expandables.addClass(blockExpandingClass);
            setTimeout(() => {
                expandables.addClass(blockExpandedClass);
              });
        }
    });
});
