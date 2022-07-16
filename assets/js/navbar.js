class Navbars {
  constructor() {
    this.primaryNav = $(".navbar");
    this.secondaryNav = $("#secondary-navbar");
    this.prevScrollpos = window.pageYOffset;

    this.updateNavbars();

    $(document).scroll($.proxy(this.onScroll, this));
  }

  onScroll() {
    this.updateNavbars();
    this.prevScrollpos = window.pageYOffset;
  }

  updateNavbars() {
    var primaryNavHeight = this.primaryNav.height();
    var navbarsVisible = this.areNavbarsVisible();

    this.primaryNav.css('top', navbarsVisible ? 0 : this.getTopForHiddenElement(this.primaryNav));

    var primaryScrolled = $(document).scrollTop() > 50;
    if (primaryScrolled && !this.isSecondaryNavStuck()) {
      this.primaryNav.addClass('navbar-scrolled');
    } else {
      this.primaryNav.removeClass('navbar-scrolled');
    }

    if (this.secondaryNav) {
      this.secondaryNav.css('top',
        navbarsVisible
          ? 'calc(' + primaryNavHeight + 'px - 0.5rem)'
          : this.getTopForHiddenElement(this.secondaryNav));

      if (this.isSecondaryNavStuck()) {
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

  areNavbarsVisible() {
    // Hide navbar if the screen is small and the page is scrolled.
    if ($(window).height() > 741) { // iPhone 6 plus / Galaxy S9 screen viewport height.
      return true;
    }

    var currentScrollPos = window.pageYOffset;
    return currentScrollPos < this.primaryNav.height() || this.prevScrollpos > currentScrollPos;
  }

  isSecondaryNavStuck() {
    if (!this.secondaryNav) {
      return false;
    }
    var secondaryTop = this.secondaryNav[0].getBoundingClientRect().top;
    return secondaryTop >= 0 && secondaryTop <= this.primaryNav.height();
  }

  getTopForHiddenElement(element) {
    let heightWithShadow = element.height() + 10;
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
    return "uvod";
  }

  isSelected(heading) {
    return window.location.hash == "#" + heading.id;
  }

  isVisible(heading, secondaryNavBottom) {
    return heading.getBoundingClientRect().top > secondaryNavBottom &&
      heading.getBoundingClientRect().top < window.innerHeight;
  }
}
