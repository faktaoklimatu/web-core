---
# Adding empty front matter to get access to Jekyll variables.
---

class Navbars {
  constructor() {
    this.primaryNav = $(".navbar");
    this.secondaryNav = $("#secondary-navbar");
    if (this.secondaryNav.length === 0) {
      this.secondaryNav = null;
    }
    this.prevScrollpos = window.pageYOffset;
    this.frozenUpdates = false;

    this.updateNavbars();

    $(document).scroll($.proxy(this.onScroll, this));
  }

  freezeUpdates() {
    this.frozenUpdates = true;
  }

  unfreezeUpdates() {
    this.frozenUpdates = false;
  }

  onScroll() {
    this.updateNavbars();
    this.prevScrollpos = window.pageYOffset;
  }

  updateNavbars() {
    if (this.frozenUpdates) {
      return;
    }
    var navbarsVisible = this.areNavbarsVisible();

    this.primaryNav.css('top', navbarsVisible ? 0 : this.getTopForHiddenElement(this.primaryNav));

    var primaryScrolled = $(document).scrollTop() > 30;
    if (primaryScrolled && !this.isSecondaryNavStuck()) {
      this.primaryNav.addClass('navbar-scrolled');
    } else {
      this.primaryNav.removeClass('navbar-scrolled');
    }

    if (this.secondaryNav) {
      var primaryNavHeight = this.primaryNav.outerHeight();
      this.secondaryNav.css('top',
        navbarsVisible
          ? 'calc(' + Math.floor(primaryNavHeight) + 'px - 0.2rem)'
          : this.getTopForHiddenElement(this.secondaryNav));

      if (navbarsVisible && this.isSecondaryNavStuck()) {
        this.secondaryNav.addClass('secondary-navbar-stuck');
      } else {
        this.secondaryNav.removeClass('secondary-navbar-stuck');
      }

      this.updateSecondaryNavHighlight();
    }
  }

  updateSecondaryNavHighlight() {
    var previousHeading = null;
    var headings = [];
    // Exclude the home link in the search for headings.
    for (const link of $("#secondary-navbar a:not(.home)")) {
      let heading = $(link.hash);
      if (heading) {
        headings.push(heading[0]);
      }
    }
    var highlightedId = this.getHighlightedId(headings);
    for (const link of $("#secondary-navbar a")) {
      if (link.hash == "#" + highlightedId) {
        $(link).addClass('highlighted');
      } else {
        $(link).removeClass('highlighted');
      }
    }
  }

  getSizeBetweenNavbars() {
    // Get the height of the heading that's between the primary and the secondary navbars.
    var element = $("#{{ site.data.lang.navigation.first-id }}");
    if (element.length !== 0) {
      return element.outerHeight();
    }
    // Default value that corresponds to one-line title.
    return 75;
  }

  getHidingOffset() {
    var offset = this.primaryNav.outerHeight() + this.getSizeBetweenNavbars();
    if (this.secondaryNav) {
      offset += this.secondaryNav.outerHeight();
    }
    return offset;
  }

  areNavbarsVisible() {
    // Always show navbars on large screens.
    if ($(window).height() > 741) { // iPhone 6 plus / Galaxy S9 screen viewport height.
      return true;
    }

    var currentScrollPos = window.pageYOffset;
    return currentScrollPos < this.getHidingOffset() || this.prevScrollpos > currentScrollPos;
  }

  isSecondaryNavStuck() {
    if (!this.secondaryNav) {
      return false;
    }
    var secondaryTop = this.secondaryNav[0].getBoundingClientRect().top;
    return secondaryTop <= this.primaryNav.outerHeight();
  }

  getTopForHiddenElement(element) {
    let heightWithShadow = element.outerHeight() + 10;
    return (-1 * heightWithShadow) + 'px';
  }

  getHighlightedId(headings) {
    var secondaryNavBottom = this.secondaryNav[0].getBoundingClientRect().bottom;

    // Special-case headings selected by clicking.
    for (const heading of headings) {
      if (this.isSelected(heading) && this.isVisible(heading, secondaryNavBottom)) {
        return heading.id;
      }
    }
    // Highlight the first visible heading or the last heading scrolled above the viewport.
    var lastAbove = null;
    for (const heading of headings) {
      if (this.isVisible(heading, secondaryNavBottom)) {
        return heading.id;
      }
      if (heading.getBoundingClientRect().top < secondaryNavBottom) {
        lastAbove = heading;
      }
    }

    if (lastAbove) {
      return lastAbove.id;
    }
    // If no section is visible, highlight the intro of the page.
    return "{{ site.data.lang.navigation.first-id }}";
  }

  isSelected(heading) {
    return window.location.hash == "#" + heading.id;
  }

  isVisible(heading, secondaryNavBottom) {
    return heading.getBoundingClientRect().top > secondaryNavBottom &&
      heading.getBoundingClientRect().top < window.innerHeight;
  }
}
