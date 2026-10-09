/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Explore Skills & Peer Directory Controller (js/explore.js)
 * Clean, modular discovery engine for browsing member skills
 */

const SkillSwapExplore = (function () {
  // Central active filter & sort state
  const filterState = {
    search: '',
    category: 'all',
    skillLevel: 'all',
    teachingSkill: 'all',
    sortBy: 'recommended',
    showCurrentUser: false
  };

  /**
   * 1. Load All Users from localStorage (seeds demo users if not present)
   * @returns {Array<Object>}
   */
  function loadExploreUsers() {
    if (window.SkillSwapAuth && typeof window.SkillSwapAuth.initDemoAccount === 'function') {
      window.SkillSwapAuth.initDemoAccount();
    }
    const users = (window.SkillSwapAuth && typeof window.SkillSwapAuth.getUsers === 'function')
      ? window.SkillSwapAuth.getUsers()
      : [];
    return users;
  }

  /**
   * Helper to retrieve currently logged-in user
   * @returns {Object|null}
   */
  function getCurrentUser() {
    return (window.SkillSwapAuth && typeof window.SkillSwapAuth.getCurrentUser === 'function')
      ? window.SkillSwapAuth.getCurrentUser()
      : null;
  }

  /**
   * 2. Category Helper: Check if user teaches any skill within a category
   * @param {Object} user 
   * @param {string} categoryId 
   * @returns {boolean}
   */
  function userTeachesCategory(user, categoryId) {
    if (categoryId === 'all') return true;
    if (!user || !user.teachSkills) return false;

    const categoriesMap = (window.SkillSwapData && window.SkillSwapData.skillCategories) || {
      'programming': { skills: ['Java', 'Python', 'C++', 'JavaScript', 'Data Analysis'] },
      'web-dev': { skills: ['HTML & CSS', 'JavaScript', 'Web Development'] },
      'design': { skills: ['UI/UX Design', 'Graphic Design', 'Photoshop', 'Figma'] },
      'media': { skills: ['Video Editing', 'Photography', 'Content Creation'] },
      'communication': { skills: ['Public Speaking', 'Communication', 'Content Writing'] },
      'productivity': { skills: ['Excel'] }
    };

    const categoryObj = categoriesMap[categoryId];
    if (!categoryObj || !categoryObj.skills) return false;

    // Case-insensitive match between user's teaching skills and category's skills
    const catSkillsLower = categoryObj.skills.map(s => s.toLowerCase());
    return user.teachSkills.some(skill => catSkillsLower.includes(skill.toLowerCase()));
  }

  /**
   * 3. Filter Users based on search query, category, level, skill, and current-user toggle
   * @param {Array<Object>} users 
   * @param {Object} state 
   * @returns {Array<Object>}
   */
  function filterUsers(users, state = filterState) {
    const currentUser = getCurrentUser();
    const query = (state.search || '').trim().toLowerCase();

    return users.filter(user => {
      // Rule 1: Current User Visibility Toggle (Hidden by default)
      if (!state.showCurrentUser && currentUser && user.id === currentUser.id) {
        return false;
      }

      // Rule 2: Search Query (Matches user name and skills they teach)
      if (query) {
        const nameMatches = user.name && user.name.toLowerCase().includes(query);
        const teachMatches = user.teachSkills && user.teachSkills.some(s => s.toLowerCase().includes(query));

        if (!nameMatches && !teachMatches) {
          return false;
        }
      }

      // Rule 3: Category Filter
      if (state.category !== 'all') {
        if (!userTeachesCategory(user, state.category)) {
          return false;
        }
      }

      // Rule 4: Skill Level Filter
      if (state.skillLevel !== 'all') {
        if (!user.skillLevel || user.skillLevel.toLowerCase() !== state.skillLevel.toLowerCase()) {
          return false;
        }
      }

      // Rule 5: Specific Teaching Skill Filter
      if (state.teachingSkill !== 'all') {
        const targetSkill = state.teachingSkill.toLowerCase();
        const teachesSpecific = user.teachSkills && user.teachSkills.some(s => s.toLowerCase() === targetSkill);
        if (!teachesSpecific) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 4. Sort Users based on sorting criteria
   * @param {Array<Object>} users 
   * @param {string} sortBy 
   * @param {string} searchQuery 
   * @returns {Array<Object>}
   */
  function sortUsers(users, sortBy = 'recommended', searchQuery = '') {
    const copy = [...users];
    const q = (searchQuery || '').trim().toLowerCase();

    switch (sortBy) {
      case 'name-asc':
        return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      case 'skills-offered':
        return copy.sort((a, b) => (b.teachSkills?.length || 0) - (a.teachSkills?.length || 0));

      case 'skills-wanted':
        return copy.sort((a, b) => (b.learnSkills?.length || 0) - (a.learnSkills?.length || 0));

      case 'recommended':
      default:
        return copy.sort((a, b) => {
          // If searching, prioritize profiles where teaching skill directly matches
          if (q) {
            const aDirectTeach = a.teachSkills?.some(s => s.toLowerCase().includes(q)) ? 1 : 0;
            const bDirectTeach = b.teachSkills?.some(s => s.toLowerCase().includes(q)) ? 1 : 0;
            if (bDirectTeach !== aDirectTeach) return bDirectTeach - aDirectTeach;
          }
          // Otherwise prioritize depth of offered skills, then total skills
          const aTotal = (a.teachSkills?.length || 0) * 2 + (a.learnSkills?.length || 0);
          const bTotal = (b.teachSkills?.length || 0) * 2 + (b.learnSkills?.length || 0);
          return bTotal - aTotal;
        });
    }
  }

  /**
   * 5. Format results count string
   * @param {number} count 
   * @returns {string} e.g. "4 people found", "1 person found", "No people found"
   */
  function formatResultsCount(count) {
    if (count === 0) return 'No people found';
    if (count === 1) return '1 person found';
    return `${count} people found`;
  }

  /**
   * 6. Render User Profile Cards into Grid
   * @param {Array<Object>} users 
   * @param {HTMLElement} gridContainer 
   * @param {HTMLElement} countElement 
   */
  function renderUserCards(users, gridContainer, countElement) {
    if (!gridContainer) return;

    // Update count display
    if (countElement) {
      countElement.textContent = formatResultsCount(users.length);
    }

    gridContainer.innerHTML = '';

    // Empty State
    if (users.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'empty-state-box';
      emptyBox.style.gridColumn = '1 / -1';
      emptyBox.innerHTML = `
        <div class="empty-state-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <h3 class="empty-state-title">No skill matches found</h3>
        <p class="empty-state-desc">Try changing your search keywords or adjusting your filters to discover more peers offering what you need.</p>
        <button type="button" class="btn btn-secondary btn-sm js-clear-filters-btn">
          <span>Clear All Filters</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      gridContainer.appendChild(emptyBox);
      return;
    }

    // Render Each Peer Card
    users.forEach(user => {
      const card = document.createElement('article');
      card.className = 'peer-explore-card';
      card.setAttribute('aria-label', `${user.name} skill exchange card`);

      // Avatar Initials
      const initials = (user.name || 'Peer')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      // Skill level badge class
      const level = user.skillLevel || 'Intermediate';
      const levelBadgeClass = level === 'Advanced' ? 'badge-cyan' : 'badge-purple';

      // Teaching chips HTML
      const teachCount = user.teachSkills ? user.teachSkills.length : 0;
      const teachChipsHtml = user.teachSkills && user.teachSkills.length > 0
        ? user.teachSkills.map(skill => `
            <span class="display-chip display-chip-teach" title="Offers ${skill}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${skill}</span>
            </span>
          `).join('')
        : '<span style="font-size: 0.78rem; color: var(--text-muted);">None listed</span>';

      // Learning chips HTML
      const learnCount = user.learnSkills ? user.learnSkills.length : 0;
      const learnChipsHtml = user.learnSkills && user.learnSkills.length > 0
        ? user.learnSkills.map(skill => `
            <span class="display-chip display-chip-learn" title="Wants to learn ${skill}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${skill}</span>
            </span>
          `).join('')
        : '<span style="font-size: 0.78rem; color: var(--text-muted);">None listed</span>';

      const demoBadgeHtml = user.isDemo ? `<span class="demo-user-tag" title="Demo student profile">Demo</span>` : '';

      card.innerHTML = `
        <div class="peer-card-header">
          <div class="peer-card-identity">
            <div class="peer-card-avatar" aria-hidden="true">${initials}</div>
            <div class="peer-card-name-group">
              <h3>${user.name}</h3>
              <span class="badge ${levelBadgeClass} peer-card-level-badge">${level}</span>
            </div>
          </div>
          <div class="peer-card-badges">
            ${demoBadgeHtml}
          </div>
        </div>

        <div class="peer-card-skills-section">
          <!-- Teaches Block -->
          <div class="peer-skills-block">
            <span class="peer-skills-label peer-skills-label-teach">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Teaches (${teachCount})
            </span>
            <div class="peer-chips-list">
              ${teachChipsHtml}
            </div>
          </div>

          <!-- Wants Block -->
          <div class="peer-skills-block">
            <span class="peer-skills-label peer-skills-label-learn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
              Wants To Learn (${learnCount})
            </span>
            <div class="peer-chips-list">
              ${learnChipsHtml}
            </div>
          </div>
        </div>

        <div class="peer-card-footer">
          <span class="peer-card-stats-summary">${teachCount} offered • ${learnCount} wanted</span>
          <a href="profile.html?id=${encodeURIComponent(user.id)}" class="peer-view-btn">
            <span>View Profile</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      `;

      gridContainer.appendChild(card);
    });
  }

  /**
   * 7. Clear all filters back to default
   */
  function clearFilters() {
    filterState.search = '';
    filterState.category = 'all';
    filterState.skillLevel = 'all';
    filterState.teachingSkill = 'all';
    filterState.sortBy = 'recommended';
    filterState.showCurrentUser = false;

    // Reset UI elements
    const searchInput = document.getElementById('explore-search-input');
    if (searchInput) searchInput.value = '';

    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) clearSearchBtn.classList.remove('visible');

    // Reset category pills
    document.querySelectorAll('.cat-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
    });

    // Reset dropdowns
    const levelSelect = document.getElementById('filter-level-select');
    if (levelSelect) levelSelect.value = 'all';

    const skillSelect = document.getElementById('filter-skill-select');
    if (skillSelect) skillSelect.value = 'all';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'recommended';

    const showProfileToggle = document.getElementById('show-my-profile-toggle');
    if (showProfileToggle) showProfileToggle.checked = false;

    applyFiltersAndRender();
  }

  /**
   * 8. Filter Pipeline: Loads users, applies filters, sorts, and renders
   */
  function applyFiltersAndRender() {
    const allUsers = loadExploreUsers();
    const filtered = filterUsers(allUsers, filterState);
    const sorted = sortUsers(filtered, filterState.sortBy, filterState.search);

    const grid = document.getElementById('explore-cards-grid');
    const countEl = document.getElementById('results-count-text');

    renderUserCards(sorted, grid, countEl);
  }

  /**
   * 9. Populate Skill Filter Dropdown from Catalog
   */
  function populateSkillSelect(selectElement) {
    if (!selectElement) return;

    const catalog = (window.SkillSwapData && window.SkillSwapData.allSkills) || [
      'Java', 'Python', 'JavaScript', 'HTML & CSS', 'C++', 'UI/UX Design',
      'Figma', 'Graphic Design', 'Video Editing', 'Photoshop', 'Public Speaking',
      'Communication', 'Excel', 'Photography', 'Content Writing', 'Data Analysis', 'Web Development'
    ];

    // Preserve 'all' option
    selectElement.innerHTML = `<option value="all">All Skills</option>`;

    catalog.forEach(skill => {
      const opt = document.createElement('option');
      opt.value = skill;
      opt.textContent = skill;
      selectElement.appendChild(opt);
    });
  }

  /**
   * 10. Initialize Explore Page Event Listeners
   */
  function initExplore() {
    const searchInput = document.getElementById('explore-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const catPillBtns = document.querySelectorAll('.cat-pill-btn');
    const levelSelect = document.getElementById('filter-level-select');
    const skillSelect = document.getElementById('filter-skill-select');
    const sortSelect = document.getElementById('sort-select');
    const showProfileToggle = document.getElementById('show-my-profile-toggle');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const grid = document.getElementById('explore-cards-grid');

    // Populate teaching skills dropdown
    if (skillSelect) {
      populateSkillSelect(skillSelect);
    }

    // A. Real-time Search Input Listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        filterState.search = val;
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('visible', val.length > 0);
        }
        applyFiltersAndRender();
      });
    }

    // B. Clear Search Button Click
    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterState.search = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.focus();
        applyFiltersAndRender();
      });
    }

    // C. Category Filter Pills
    catPillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catPillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterState.category = btn.getAttribute('data-category') || 'all';
        applyFiltersAndRender();
      });
    });

    // D. Skill Level Dropdown
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        filterState.skillLevel = e.target.value;
        applyFiltersAndRender();
      });
    }

    // E. Specific Teaching Skill Dropdown
    if (skillSelect) {
      skillSelect.addEventListener('change', (e) => {
        filterState.teachingSkill = e.target.value;
        applyFiltersAndRender();
      });
    }

    // F. Sorting Dropdown
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        filterState.sortBy = e.target.value;
        applyFiltersAndRender();
      });
    }

    // G. "Show My Profile" Toggle Switch
    if (showProfileToggle) {
      const currentUser = getCurrentUser();
      // If not logged in, visually mute toggle
      if (!currentUser) {
        showProfileToggle.disabled = true;
        const toggleWrap = showProfileToggle.closest('.toggle-switch-wrap');
        if (toggleWrap) {
          toggleWrap.title = 'Sign in to toggle your profile visibility in results';
          toggleWrap.style.opacity = '0.6';
        }
      }

      showProfileToggle.addEventListener('change', (e) => {
        filterState.showCurrentUser = e.target.checked;
        applyFiltersAndRender();
      });
    }

    // H. Reset Filters Button
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', clearFilters);
    }

    // I. Event delegation for "Clear All Filters" button inside empty state
    if (grid) {
      grid.addEventListener('click', (e) => {
        if (e.target.closest('.js-clear-filters-btn')) {
          clearFilters();
        }
      });
    }

    // Initial render
    applyFiltersAndRender();
  }

  // Self-initialize if on explore page
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('explore-cards-grid')) {
      initExplore();
    }
  });

  return {
    loadExploreUsers,
    getExploreUsers: loadExploreUsers,
    getCurrentUser,
    filterState,
    filterUsers,
    sortUsers,
    userTeachesCategory,
    formatResultsCount,
    renderUserCards,
    clearFilters,
    applyFiltersAndRender,
    initExplore
  };
})();

// Attach to window & module for browser and test access
if (typeof window !== 'undefined') {
  window.SkillSwapExplore = SkillSwapExplore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSwapExplore;
}
