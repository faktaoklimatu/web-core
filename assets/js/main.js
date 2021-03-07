$(document).ready(function() {
    if ($("#dev-warning")) {
        console.log('This is the local development version of the website.');
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
    var navHeight = $("nav").height();
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
    $('#searchbox').on('keyup', delayedSearch);
    $('#searchbox').on('focus', search);
    $('#searchbox').on('blur', maybeHideSearch);
    $('#omnisearch-suggestions').on('blur', maybeHideSearch);
});

var posts = []; // will hold the json array from your site.json file
var fuse = null;
var searchString = null;
var timeout = null;

function showSearch() {
    $('nav').addClass('navbar-search');
    $('#searchbox').focus();
}

function hideSearch() {
    $('nav').removeClass('navbar-search');
    hideSuggestions();
}

function maybeHideSearch(event) {
    if ($("#searchbox")[0].contains(event.relatedTarget) ||
        $('#omnisearch-suggestions')[0].contains(event.relatedTarget)) {
        return;
    }
    hideSearch();
}

function showSuggestions() {
    var $body = $(document.body);
    var oldWidth = $body.innerWidth();
    $body.width(oldWidth);
    $('nav').width(oldWidth);
    $body.css("overflow", "hidden");
    $('#omnisearch-suggestions').show();
    $('#searchbox').addClass('searchbox-open');
}

function hideSuggestions() {
    $('#omnisearch-suggestions').hide();
    var $body = $(document.body);
    $body.css("overflow", "auto");
    $body.width("auto");
    $('nav').width("auto");
    $('#searchbox').removeClass('searchbox-open');
}

function navigate(e) {
    if (e.keyCode == '27') {  // escape
        e.preventDefault();
        hideSearch();
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
    searchInternal();
}

function delayedSearch(e) {
    if (e.keyCode == '13' || e.keyCode == '27' || e.keyCode == '38' || e.keyCode == '40') {
        return;
    }
    window.clearTimeout(timeout);
    timeout = window.setTimeout(searchInternal, 200);
}

function searchInternal() {
    fetchSiteJson(function () {
        let searchResults = [];
        let newSearchString = $('#searchbox').val();
        if (newSearchString != searchString) {
            searchString = newSearchString;
            searchResults = searchString.length > 1 ? fuse.search(searchString) : null;
            updateResults(searchResults);
        }
        if ($('#omnisearch-suggestions *').length > 0) {
            showSuggestions();
        } else {
            hideSuggestions();
        }
    });
}

function getInstances(matches, shouldMatchTitle) {
    let instances = [];
    if (!matches)
        return instances;
    for (const match of matches) {
        let isTitle = (match.key == 'title');
        if (isTitle != shouldMatchTitle) {
            continue;
        }
        for (const index of match.indices) {
            // Ignore matches of length 1;
            if (index[1] - index[0] == 0) continue;
            instances.push({start: index[0], end: index[1] + 1, text: match.value});
        }
    }
    // Sort by match length, descending.
    instances.sort((a,b) => (b.end - b.start) - (a.end - a.start));
    return instances;
}

function getSnippet(matches) {
    let instances = getInstances(matches, false);
    if (instances.length == 0)
        return '';
    
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

function getTitle(matches, unmatchedTitle) {
    let instances = getInstances(matches, true);
    if (instances.length == 0)
        return unmatchedTitle;
    // Only consider the first 
    let instance = instances[0];
    let prefix = instance.text.substring(0, instance.start);
    let suffix = instance.text.substring(instance.end);
    let result = '';
    if (prefix) result += prefix;
    result += '<span class="keyword">' + instance.text.substring(instance.start, instance.end) + '</span>';
    if (suffix) result += suffix;
    return result;
}

function getResultsHtml(results) {
    if (results == null) {
        return '';
    }
    if (results.length == 0) {
        return '<div class="dropdown-item empty">Nic nenalezeno</div>';
    }
    var resultsHtml = '';
    results.forEach(function (res) {
        let item = res.item;
        snippet = getSnippet(res.matches);
        title = getTitle(res.matches, item.title);
        resultsHtml += '<a class="dropdown-item clearfix" href="' + item.url + '">';
        resultsHtml += '<div class="title">' + title + '</div>';
        resultsHtml += '<div class="search-preview card">' + item.block + '</div>' +
                       '<div class="snippet">' + snippet + '</div>' +
                       '</a>';
    });
    return resultsHtml;
}

function updateResults(results) {
    $('#omnisearch-suggestions').html(getResultsHtml(results));
    $('#omnisearch-suggestions a:first-of-type').addClass('active');
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
