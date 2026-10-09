/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Main Client Controller (js/main.js)
 * High-performance, accessible vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all interactive modules
  initStickyHeader();
  initMobileNavigation();
  initSmoothScroll();
  initSkillFilters();
  initHeroExchangeDemo();
  initAccessibilityHelpers();
});

/**
 * 1. Sticky Header Blur and Border on Scroll
 */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 24) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check
}

/**
 * 2. Responsive Mobile Drawer Navigation
 */
function initMobileNavigation() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const navLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-actions .btn');

  if (!toggleBtn || !drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('open');
    toggleBtn.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    toggleBtn.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  overlay.addEventListener('click', closeDrawer);

  navLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // Close drawer on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
      toggleBtn.focus();
    }
  });
}

/**
 * 3. Smooth Anchor Scrolling with Header Offset & Active State
 */
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  const header = document.querySelector('.site-header');
  const headerHeight = header ? header.offsetHeight : 76;

  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 16;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Set focus to the target section for screen readers
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
      }
    });
  });

  // IntersectionObserver to update active navigation links on scroll
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navItems = document.querySelectorAll('.desktop-nav .nav-link');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            navItems.forEach((navLink) => {
              if (navLink.getAttribute('href') === `#${currentId}`) {
                navLink.classList.add('active');
              } else if (navLink.getAttribute('href').startsWith('#')) {
                navLink.classList.remove('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px'
      }
    );

    sections.forEach((section) => observer.observe(section));
  }
}

/**
 * 4. Popular Skills Category Filtering
 */
function initSkillFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  if (!filterButtons.length || !skillCards.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Update active state on buttons
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      skillCards.forEach((card) => {
        const category = card.getAttribute('data-category');

        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.96)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/**
 * 5. Hero Skill Exchange Interactive Demo
 */
function initHeroExchangeDemo() {
  const swapActionBtn = document.querySelector('.exchange-action-btn');
  const swapArrows = document.querySelector('.swap-arrows-icon');
  const statusIndicator = document.querySelector('.exchange-status-text');

  if (!swapActionBtn) return;

  swapActionBtn.addEventListener('click', () => {
    // Add micro-animation effect
    if (swapArrows) {
      swapArrows.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        swapArrows.style.transform = '';
      }, 500);
    }

    if (statusIndicator) {
      statusIndicator.textContent = 'Match Confirmed!';
      statusIndicator.style.color = 'var(--secondary)';
      setTimeout(() => {
        statusIndicator.textContent = 'Active Peer Exchange';
        statusIndicator.style.color = '';
      }, 2500);
    }

    showToast(
      'Mutual Exchange Verified!',
      'Alex (JavaScript) & Elena (UI/UX Design) have confirmed their peer swap session.',
      'success'
    );
  });
}

/**
 * 6. Accessibility & General Micro-Interactions
 */
function initAccessibilityHelpers() {
  // Add listeners for any "Find Matches" or "Explore" buttons to trigger polite feedback
  const demoActionButtons = document.querySelectorAll('.skill-link, [data-demo-toast]');
  demoActionButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const skillName = btn.getAttribute('data-skill-name') || 'this skill';
      if (btn.getAttribute('href') === '#' || btn.getAttribute('href') === '') {
        e.preventDefault();
        showToast(
          `Exploring ${skillName}`,
          'Connecting to active student peers in the SkillSwap network...',
          'info'
        );
      }
    });
  });
}

/**
 * Global Toast Notification Generator
 * @param {string} title
 * @param {string} message
 * @param {'info' | 'success'} type
 */
function showToast(title, message, type = 'info') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'status');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';

  const iconSvg =
    type === 'success'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

  toast.innerHTML = `
    <div class="toast-icon toast-icon-${type}">
      ${iconSvg}
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close-btn" aria-label="Dismiss notification">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const dismissToast = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  };

  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', dismissToast);
  }

  // Auto-dismiss after 4 seconds
  setTimeout(dismissToast, 4000);
}

// Attach toast utility to window
window.showToast = showToast;
