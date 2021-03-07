class Search {
    constructor() {
        this.fuse = null;
        this.searchString = null;
        this.timeout = null;

        $('#searchShow').on('click', $.proxy(this.showSearch, this));
        $('#searchHide').on('click', $.proxy(this.hideSearch, this));

        $('#searchbox').on('keydown', $.proxy(this.navigate, this));
        $('#searchbox').on('focus', $.proxy(this.instantSearch, this));
        $('#searchbox').on('keyup', $.proxy(this.delayedSearch, this));
        $('#searchbox').on('blur', $.proxy(this.maybeHideSearch, this));

        $('#omnisearch-suggestions').on('blur', $.proxy(this.maybeHideSearch, this));
    }

    /**
     * Event callbacks.
     */
    showSearch() {
        $('nav').addClass('navbar-search');
        $('#searchbox').focus();
    }

    hideSearch() {
        $('nav').removeClass('navbar-search');
        this._hideSuggestions();
    }

    maybeHideSearch(event) {
        if ($("#searchbox")[0].contains(event.relatedTarget) ||
            $('#omnisearch-suggestions')[0].contains(event.relatedTarget)) {
            return;
        }
        this.hideSearch();
    }

    navigate(e) {
        if (e.keyCode == '27') {  // escape
            e.preventDefault();
            this.hideSearch();
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

    instantSearch(e) {
        if (e.keyCode == '13' || e.keyCode == '27' || e.keyCode == '38' || e.keyCode == '40') {
            return;
        }
        this._initAndSearch();
    }

    delayedSearch(e) {
        if (e.keyCode == '13' || e.keyCode == '27' || e.keyCode == '38' || e.keyCode == '40') {
            return;
        }
        window.clearTimeout(this.timeout);
        this.timeout = window.setTimeout($.proxy(this._initAndSearch, this), 200);
    }

    /**
     * Private implementation functions.
     */

    _initAndSearch() {
        if (this.fuse === null) {
            // Init by fetching site.json file
            jQuery.get("/search.json", $.proxy(this._onSiteJsonFetched, this)).fail(() => {
                // TODO: handle failure gracefully.
            });
            return;
        }

        this._search();
    }

    _onSiteJsonFetched (data) {
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
        this.fuse = new Fuse(data, options);
        this._search();
    }

    _search() {
        let searchResults = [];
        let newSearchString = $('#searchbox').val();
        if (newSearchString != this.searchString) {
            this.searchString = newSearchString;
            searchResults = this.searchString.length > 1 ? this.fuse.search(this.searchString) : null;
            this._updateResults(searchResults);
        }
        if ($('#omnisearch-suggestions *').length > 0) {
            this._showSuggestions();
        } else {
            this._hideSuggestions();
        }
    }

    _showSuggestions() {
        let $body = $(document.body);
        let oldWidth = $body.innerWidth();
        $body.width(oldWidth);
        $('nav').width(oldWidth);
        $body.css("overflow", "hidden");
        $('#omnisearch-suggestions').show();
        $('#searchbox').addClass('searchbox-open');
    }

    _hideSuggestions() {
        $('#omnisearch-suggestions').hide();
        let $body = $(document.body);
        $body.css("overflow", "auto");
        $body.width("auto");
        $('nav').width("auto");
        $('#searchbox').removeClass('searchbox-open');
    }

    _updateResults(results) {
        $('#omnisearch-suggestions').html(this._getResultsHtml(results));
        $('#omnisearch-suggestions a:first-of-type').addClass('active');
    }

    _getResultsHtml(results) {
        if (results == null) {
            return '';
        }
        if (results.length == 0) {
            return '<div class="dropdown-item empty">Nic nenalezeno</div>';
        }
        var resultsHtml = '';
        results.forEach(res => {
            let item = res.item;
            let snippet = this._getSnippet(res.matches);
            let title = this._getTitle(res.matches, item.title);
            resultsHtml += '<a class="dropdown-item clearfix" href="' + item.url + '">';
            resultsHtml += '<div class="title">' + title + '</div>';
            resultsHtml += '<div class="search-preview card">' + item.block + '</div>' +
                           '<div class="snippet">' + snippet + '</div>' +
                           '</a>';
        });
        return resultsHtml;
    }

    _getSnippet(matches) {
        let instances = this._getKeywordInstances(matches, false);
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

    _getTitle(matches, unmatchedTitle) {
        let instances = this._getKeywordInstances(matches, true);
        if (instances.length == 0)
            return unmatchedTitle;
        // Only consider the first.
        let instance = instances[0];
        let prefix = instance.text.substring(0, instance.start);
        let suffix = instance.text.substring(instance.end);
        let result = '';
        if (prefix) result += prefix;
        result += '<span class="keyword">' + instance.text.substring(instance.start, instance.end) + '</span>';
        if (suffix) result += suffix;
        return result;
    }

    _getKeywordInstances(matches, shouldMatchTitle) {
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
}
