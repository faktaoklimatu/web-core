$(document).ready(function() {
    // Development version adjustments
    var navHeight = $("nav").height();
    if ($("#dev-warning")) {
        console.log('This is the local development version of the website.');
        $("body").css('padding-top', navHeight + 'px');
        $(".sticky-toc").css('top', navHeight + 'px');
    }

    // change styling of navbar if the page is scrolled
    $(document).scroll(function() {
        var scrolled = $(this).scrollTop();
        if(scrolled > 50) {
            $(".navbar").addClass('navbar-scrolled');
        } else {
            $(".navbar").removeClass('navbar-scrolled');
        }
    });
    // hide navbar if the screen is small and the page is scrolled
    var prevScrollpos = window.pageYOffset;
    $(document).scroll(function () {
        if ($(window).height() > 741) { // iPhone 6 plus / Galaxy S9 screen viewport height
            $(".navbar").css('top', 0);
            return;
        }
        var currentScrollPos = window.pageYOffset;
        if (currentScrollPos < navHeight || prevScrollpos > currentScrollPos) {
            $(".navbar").css('top', 0);
        } else {
            $(".navbar").css('top', (-1 * navHeight) + 'px');
        }
        prevScrollpos = currentScrollPos;
    });

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

    $('#searchbox').on('keydown', navigate);
    $('#searchbox').on('keyup', search);
});

var posts = []; // will hold the json array from your site.json file
var fuse = null;

function navigate(e) {
    if (e.keyCode == '27') {  // escape
        e.preventDefault();
        $('#omnisearch-suggestions').hide();
        return;
    }
    if (e.keyCode == '13') {  // enter
        $('#omnisearch-suggestions a.active')[0].click();
        return false;
    }
    if (e.keyCode == '38' || e.keyCode == '40') {  // up/down arrow
        e.preventDefault();
        let up = e.keyCode == '38';
        let allLinks = $('#omnisearch-suggestions a');
        for (let i = 0; i < allLinks.length; i++) {
            if (allLinks.eq(i).hasClass('active')) {
                let next = i + (up ? -1 : 1);
                if (next >= 0 && next < allLinks.length) {
                    allLinks.eq(i).removeClass('active');
                    allLinks.eq(next).addClass('active');
                    allLinks.get(next).scrollIntoView({block: "nearest", inline: "nearest"});
                }
                return;
            }
        }
        return;
    }
}

function search(e) {
    if (e.keyCode == '13' || e.keyCode == '27' || e.keyCode == '38' || e.keyCode == '40') {
        return;
    }
    let searchStr = $('#searchbox').val();
	fetchSiteJson(function () {
        if (searchStr.length !== 0) {
            updateResults(fuse.search(searchStr));
        } else {
            updateResults([]);
        }
    });
}

function getSnippet(matches) {
    if (!matches || matches.length == 0)
        return '';
    let instances = [];
    for (const match of matches) {
        for (const index of match.indices) {
            // Ignore matches of length 1;
            if (index[1] - index[0] == 0) continue;
            instances.push({start: index[0], end: index[1] + 1, text: match.value});
        }
    }
    // Sort by match length, descending.
    instances.sort((a,b) => (b.end - b.start) - (a.end - a.start));

    let maxSnippets = 2;
    let context = 30;

    let results = [];
    for (let i = 0; i < instances.length && i < maxSnippets; i++) {
        let instance = instances[i];
        let prefix = instance.text.substring(instance.start - context, instance.start);
        let suffix = instance.text.substring(instance.end, instance.end + context);
        let result = '';
        if (instance.start - context - 1 >= 0) result += '...';
        if (prefix) result += prefix;
        result += '<span class="keyword">' + instance.text.substring(instance.start, instance.end) + '</span>';
        if (suffix) result += suffix;
        if (instance.end + context + 1 < instance.text.length) result += '...';
        results.push(result);
    }
    return results.join(' ');
}

function updateResults(results) {
    var resultsHtml = '';
    resultsHtml += getResultsCategory(results.filter(a => a.item.picture), 'Infografiky');
    resultsHtml += getResultsCategory(results.filter(a => !a.item.picture), 'Ostatní');
    $('#omnisearch-suggestions').html(resultsHtml);
    $('#omnisearch-suggestions a:first-of-type').addClass('active');
    if (results.length > 0) {
        $('#omnisearch-suggestions').show();
    } else {
        $('#omnisearch-suggestions').hide();
    }
}

function getResultsCategory(results, heading) {
    var resultsHtml = '';
    if (results.length > 0) {
        resultsHtml += '<h2>' + heading + '</h2>';
    }
    results.forEach(function (res) {
        let item = res.item;
        snippet = getSnippet(res.matches);
        resultsHtml += '<a class="dropdown-item clearfix" href="' + item.url + '">';
        resultsHtml += item.picture ? '<img class="search-preview card" src="' + item.picture + '"/>' : ''
        resultsHtml += '<div class="search-description">' +
                       '<span class="title">' + item.title + '</span>' +
                       '<span class="date">' + item.date + '</span>' +
                       '<span class="snippet">' + snippet + '</span>' +
                       '</div></a>';
    });
    return resultsHtml;
}

function postFilter(data) {
    // TODO: strip {% ... %}
    return data;
}

function fetchSiteJson(callback) {
    if (posts.length === 0) {
        // fetch site.json file
        jQuery.get("/search.json", function (data) {
            posts = postFilter(data);
            var options = { 		// initialize options for fuse.js
                shouldSort: true,
                threshold: 0.3,
                ignoreLocation: true,
                maxPatternLength: 32,
                minMatchCharLength: 2,
                includeMatches: true,
                includeScore: true,
                keys: [
                    {
                        name: "title",
                        weight: 0.2		// give title more importance
                    },
                    {
                        name: "perex",
                        weight: 0.3		// give perex more importance
                    },
                    {
                        name: "content",
                        weight: 0.6
                    }
                ]
            };
            fuse = new Fuse(posts, options);
            callback();
        }).fail(function() {
            // TODO: handle failure gracefully.
        });
    } else { // we already have the posts so simply use it instead of downloading the file again
        callback();
    }
}
