---
# Adding empty front matter to get access to Jekyll variables.
---

class Search {
    constructor() {
        this.fuse = null;
        this.searchString = null;
        this.timeout = null;

        // CSS classes to use for different modes.
        this.classes = Object.freeze({
            selectedEntry: 'active',
            searchingMode: 'navbar-search',
            openSearchbox: 'searchbox-open',
        });

        // CSS selectors for accessing page elements.
        this.selectors = Object.freeze({
            searchbox: '#searchbox',
            results: '#omnisearch-suggestions',
            resultElements: '#omnisearch-suggestions *',
            resultAllEntries: '#omnisearch-suggestions a',
            resultSelectedEntry: `#omnisearch-suggestions a.${this.classes.selectedEntry}`,
            resultsFirstEntry: '#omnisearch-suggestions a:first-of-type',
            nav: 'nav',
            show: '#searchShow',
            hide: '#searchHide',
        });

        // Search index types.
        this.types = Object.freeze({
            title: 'title',
            perex: 'perex',
            content: 'content',
        });

        // Keycodes used in navigation shortcuts.
        this.shortcuts = Object.freeze({
            escape: 27,
            enter: 13,
            up: 38,
            down: 40,
        });

        // Options for the fuse library.
        this.fuseOptions = Object.freeze({
            shouldSort: true,
            threshold: 0.3,
            ignoreLocation: true,
            maxPatternLength: 32,
            minMatchCharLength: 2,
            includeMatches: true,
            includeScore: true,
            keys: [
                {
                    name: this.types.title,
                    weight: 0.2		// give title more importance
                },
                {
                    name: this.types.perex,
                    weight: 0.3		// give perex more importance
                },
                {
                    name: this.types.content,
                    weight: 0.6
                }
            ]
        });

        $(this.selectors.show).on('click', $.proxy(this.showSearch, this));
        $(this.selectors.hide).on('click', $.proxy(this.hideSearch, this));

        $(this.selectors.searchbox).on('blur', $.proxy(this.maybeHideSearch, this));
        $(this.selectors.searchbox).on('keydown', $.proxy(this.navigate, this));
        $(this.selectors.searchbox).on('focus', $.proxy(this.instantSearch, this));
        $(this.selectors.searchbox).on('keyup', $.proxy(this.delayedSearch, this));

        $(this.selectors.results).on('blur', $.proxy(this.maybeHideSearch, this));

        // With open suggestions we set a fixed body width which does not work with resizing content. Hide search on resize
        // to avoid this glitch.
        $(window).on('resize', $.proxy(this.hideSearch, this));
    }

    /**
     * Event callbacks.
     */
    showSearch() {
        $(this.selectors.nav).addClass(this.classes.searchingMode);
        $(this.selectors.searchbox).focus();
    }

    hideSearch() {
        $(this.selectors.nav).removeClass(this.classes.searchingMode);
        this.hideSuggestions();
    }

    maybeHideSearch(event) {
        if ($(this.selectors.searchbox)[0].contains(event.relatedTarget) ||
            $(this.selectors.results)[0].contains(event.relatedTarget)) {
            return;
        }
        this.hideSearch();
    }

    navigate(e) {
        switch (e.keyCode) {
            case this.shortcuts.escape:
                e.preventDefault();
                this.hideSearch();
                return;
            case this.shortcuts.enter:
                $(this.selectors.resultSelectedEntry)[0].click();
                return false;
            case this.shortcuts.down:
                e.preventDefault();
                this.move(true);
                return;
            case this.shortcuts.up:
                e.preventDefault();
                this.move(false);
                return;
        }
    }

    move(down) {
        let allEntries = $(this.selectors.resultAllEntries);
        for (let i = 0; i < allEntries.length; i++) {
            if (allEntries.eq(i).hasClass(this.classes.selectedEntry)) {
                let next = i + (down ? 1 : -1);
                if (next < 0 || next >= allEntries.length) {
                    return;
                }
                allEntries.eq(i).removeClass(this.classes.selectedEntry);
                allEntries.eq(next).addClass(this.classes.selectedEntry);
                allEntries.get(next).scrollIntoView({block: "nearest", inline: "nearest"});
                break;
            }
        }
    }

    isShortcut(keyCode) {
        return Object.values(this.shortcuts).includes(keyCode);
    }
    
    instantSearch(e) {
        // Skip for special shortcuts, these are handled by navigate().
        if (this.isShortcut(e.keyCode)) {
            return;
        }
        this.search();
    }

    delayedSearch(e) {
        // Skip for special shortcuts, these are handled by navigate().
        if (this.isShortcut(e.keyCode)) {
            return;
        }
        window.clearTimeout(this.timeout);
        this.timeout = window.setTimeout($.proxy(this.search, this), 200);
    }

    /**
     * Private implementation functions.
     */

    search() {
        if (this.fuse === null) {
            jQuery.get("/search.json", $.proxy(this.onSiteJsonSucceeded, this)).fail($.proxy(this.onSiteJsonFailed, this));
            return;
        }

        let newSearchString = $(this.selectors.searchbox).val();
        if (newSearchString != this.searchString) {
            this.searchString = newSearchString;
            let searchResultsHtml = '';
            if (this.searchString.length > 1) {
                let searchResults = this.fuse.search(this.searchString);
                searchResultsHtml = searchResults.length ? 
                                        this.getResultsHtml(searchResults) : 
                                        this.getEmptyResultsHtml('{{ site.data.lang.navigation.search-empty }}');
            } else {
                searchResultsHtml = '';
            }
            this.updateResults(searchResultsHtml);
        }
        if ($(this.selectors.resultElements).length > 0) {
            this.showSuggestions();
        } else {
            this.hideSuggestions();
        }
    }

    onSiteJsonSucceeded (data) {
        this.fuse = new Fuse(data, this.fuseOptions);
        this.search();
    }

    onSiteJsonFailed () {
        this.updateResults(this.getEmptyResultsHtml('{{ site.data.lang.navigation.search-failed }}'));
        this.showSuggestions();
    }

    updateResults(resultsHtml) {
        $(this.selectors.results).html(resultsHtml);
        $(this.selectors.resultsFirstEntry).addClass(this.classes.selectedEntry);
    }

    showSuggestions() {
        let $body = $(document.body);
        let oldWidth = $body.innerWidth();
        $body.width(oldWidth);
        $(this.selectors.nav).width(oldWidth);
        $body.css("overflow", "hidden");
        $(this.selectors.results).show();
        $(this.selectors.searchbox).addClass(this.classes.openSearchbox);
    }

    hideSuggestions() {
        $(this.selectors.results).hide();
        let $body = $(document.body);
        $body.css("overflow", "auto");
        $body.width("auto");
        $(this.selectors.nav).width("auto");
        $(this.selectors.searchbox).removeClass(this.classes.openSearchbox);
    }

    getResultsHtml(results) {
        var resultsHtml = '';
        results.forEach(res => {
            let item = res.item;
            let title = this.getTitle(res.matches, item.title);
            let snippet = this.getSnippet(res.matches);
            let card = `<div class="title">${title}</div>` +
                       `<div class="search-preview card">${item.block}</div>` +
                       `<div class="snippet">${snippet}</div>`;
            let url = `${item.url}?q=${encodeURIComponent(this.searchString)}`;
            resultsHtml += `<a class="dropdown-item clearfix" href="${url}">${card}</a>`;
        });
        return resultsHtml;
    }

    getEmptyResultsHtml(infoText) {
        return `<div class="dropdown-item empty">${infoText}</div>`;
    }

    getSnippet(matches) {
        let instances = this.getKeywordInstances(matches, false);
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
            result += this.getKeywordHTML(instance.text.substring(instance.start, instance.end));
            if (suffix) result += suffix;
            if (instance.end + context + 1 < instance.text.length) result += '...';
            results.push(result);
        }
        return results.join(' ');
    }

    getTitle(matches, unmatchedTitle) {
        let instances = this.getKeywordInstances(matches, true);
        if (instances.length == 0)
            return unmatchedTitle;
        // Only consider the first.
        let instance = instances[0];
        let prefix = instance.text.substring(0, instance.start);
        let suffix = instance.text.substring(instance.end);
        let result = '';
        if (prefix) result += prefix;
        result += this.getKeywordHTML(instance.text.substring(instance.start, instance.end));
        if (suffix) result += suffix;
        return result;
    }

    getKeywordHTML(text) {
        return `<span class="keyword">${text}</span>`;
    }

    getKeywordInstances(matches, shouldMatchTitle) {
        let instances = [];
        if (!matches)
            return instances;
        for (const match of matches) {
            let isTitle = (match.key == this.types.title);
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
