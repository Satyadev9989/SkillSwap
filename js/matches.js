/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Mutual Skill Matchmaking Engine (js/matches.js)
 * 
 * ============================================================================
 * ARCHITECTURAL SPECIFICATION & PBL DEMONSTRATION NOTE:
 * This module implements a rule-based bidirectional skill compatibility algorithm
 * running purely client-side via localStorage. It compares the active user's
 * learning goals and teaching catalog against all other registered peers.
 * 
 * Compatibility Formula:
 * - Direction A: Percentage of user's desired skills taught by peer
 * - Direction B: Percentage of peer's desired skills taught by user
 * - Final Score: Math.round((Direction A + Direction B) / 2)
 * ============================================================================
 */

const SkillSwapMatches = (function () {
  'use strict';

  // State Management
  let allCalculatedMatches = [];
  let currentFilteredMatches = [];
  let activeSort = 'best';
  let activeFilter = 'all';
  let activeModalMatch = null;
  let lastFocusedElement = null;

  /**
   * 1. Normalize Skill string for exact case-insensitive matching
   * Strips extra whitespace and converts to lowercase
   * @param {string} skill 
   * @returns {string}
   */
  function normalizeSkill(skill) {
    if (!skill || typeof skill !== 'string') return '';
    return skill.trim().toLowerCase();
  }

  /**
   * 2. Quality tier and label definition based on final score
   * @param {number} score - 0 to 100
   * @returns {{ label: string, icon: string, tier: string }}
   */
  function getMatchLabel(score) {
    if (score >= 90) {
      return { label: 'Perfect Match', icon: '🔥', tier: 'perfect' };
    } else if (score >= 70) {
      return { label: 'Strong Match', icon: '⚡', tier: 'strong' };
    } else if (score >= 50) {
      return { label: 'Good Match', icon: '✨', tier: 'good' };
    } else if (score >= 25) {
      return { label: 'Potential Match', icon: '💡', tier: 'potential' };
    } else if (score > 0) {
      return { label: 'Low Match', icon: '🌱', tier: 'low' };
    }
    return { label: 'No Match', icon: '—', tier: 'none' };
  }

  /**
   * 3. Calculate bidirectional match between two users
   * @param {Object} currentUser 
   * @param {Object} otherUser 
   * @returns {Object|null}
   */
  function calculateMatch(currentUser, otherUser) {
    if (!currentUser || !otherUser) return null;
    if (currentUser.id === otherUser.id) return null;

    const myLearn = Array.isArray(currentUser.learnSkills) ? currentUser.learnSkills : [];
    const myTeach = Array.isArray(currentUser.teachSkills) ? currentUser.teachSkills : [];
    const theirLearn = Array.isArray(otherUser.learnSkills) ? otherUser.learnSkills : [];
    const theirTeach = Array.isArray(otherUser.teachSkills) ? otherUser.teachSkills : [];

    // Direction A: What they teach that I want to learn
    const normalizedTheirTeach = theirTeach.map(normalizeSkill);
    const theyTeachYou = [];
    myLearn.forEach(skill => {
      const norm = normalizeSkill(skill);
      if (norm && normalizedTheirTeach.includes(norm)) {
        if (!theyTeachYou.some(s => normalizeSkill(s) === norm)) {
          theyTeachYou.push(skill);
        }
      }
    });

    // Direction B: What I teach that they want to learn
    const normalizedMyTeach = myTeach.map(normalizeSkill);
    const youTeachThem = [];
    theirLearn.forEach(skill => {
      const norm = normalizeSkill(skill);
      if (norm && normalizedMyTeach.includes(norm)) {
        if (!youTeachThem.some(s => normalizeSkill(s) === norm)) {
          youTeachThem.push(skill);
        }
      }
    });

    // Handle empty skill edge cases
    if (myLearn.length === 0 && myTeach.length === 0) {
      return {
        userId: otherUser.id,
        otherUser,
        score: 0,
        directionA: 0,
        directionB: 0,
        theyTeachYou: [],
        youTeachThem: [],
        label: 'No Match',
        icon: '—',
        tier: 'none'
      };
    }

    // Direction A:
    // Proportion of wanted skills satisfied, normalized against candidate offerings
    const denomA = Math.max(myLearn.length, theirTeach.length) || 1;
    const directionA = Math.round((theyTeachYou.length / denomA) * 100);

    // Direction B:
    // Proportion of peer's desired skills taught by current user, normalized against offerings
    const denomB = Math.max(theirLearn.length, myTeach.length) || 1;
    const directionB = Math.round((youTeachThem.length / denomB) * 100);

    // Final Compatibility Score: (Direction A + Direction B) / 2
    const score = Math.round((directionA + directionB) / 2);
    const labelObj = getMatchLabel(score);

    return {
      userId: otherUser.id,
      otherUser,
      score,
      label: labelObj.label,
      icon: labelObj.icon,
      tier: labelObj.tier,
      directionA,
      directionB,
      theyTeachYou,
      youTeachThem
    };
  }

  /**
   * 4. Generate dynamic plain-English explanation for why this peer matched
   * @param {Object} currentUser 
   * @param {Object} otherUser 
   * @param {Object} match 
   * @returns {string}
   */
  function generateMatchExplanation(currentUser, otherUser, match) {
    const peerFirstName = otherUser.name ? otherUser.name.split(' ')[0] : 'They';
    const teachCount = match.theyTeachYou.length;
    const learnCount = match.youTeachThem.length;

    if (teachCount > 0 && learnCount > 0) {
      const teachStr = match.theyTeachYou.join(' & ');
      const learnStr = match.youTeachThem.join(' & ');
      if (match.score >= 90) {
        return `Perfect mutual exchange: ${peerFirstName} can teach you ${teachStr}, and you can teach ${peerFirstName} ${learnStr}.`;
      } else if (match.score >= 70) {
        return `Strong mutual match: ${peerFirstName} can teach you ${teachStr}. In exchange, you can teach ${peerFirstName} ${learnStr}.`;
      } else {
        return `Balanced trade: ${peerFirstName} offers ${teachStr}, while you can offer ${learnStr}.`;
      }
    } else if (teachCount > 0) {
      const teachStr = match.theyTeachYou.join(' & ');
      return `One-way mentorship: ${peerFirstName} can teach you ${teachStr}. Add more skills they want to increase mutual balance.`;
    } else if (learnCount > 0) {
      const learnStr = match.youTeachThem.join(' & ');
      return `Mentorship opportunity: You can teach ${peerFirstName} ${learnStr}. Check their profile for future skill alignment.`;
    }

    return `Skill exchange opportunity with ${peerFirstName}.`;
  }

  /**
   * 5. Generate dynamic recommendation text for modal dialog
   * @param {Object} match 
   * @returns {string}
   */
  function generateRecommendation(match) {
    if (match.score >= 90) {
      return 'Outstanding mutual compatibility! Both of your primary learning goals and teaching skills align seamlessly. Highly recommended for immediate exchange.';
    } else if (match.score >= 70) {
      return 'Looks like a strong skill exchange. You have high mutual skill overlap with practical mentorship value. Consider connecting soon.';
    } else if (match.score >= 50) {
      return 'Solid learning match. One party gets full coverage while the other gets partial exchange. A structured weekly session would work well.';
    } else if (match.score >= 25) {
      return 'Potential skill pairing. There is some skill overlap that could form the foundation of an exploratory session.';
    }
    return 'Basic skill overlap detected. Great for introductory peer networking.';
  }

  /**
   * 6. Generate matches for current user against all other users
   * Filters out scores <= 0 and self-matches
   * @param {Object} currentUser 
   * @param {Array<Object>} allUsers 
   * @returns {Array<Object>}
   */
  function generateMatches(currentUser, allUsers) {
    if (!currentUser || !Array.isArray(allUsers)) return [];

    const matches = [];
    allUsers.forEach(peer => {
      if (peer.id === currentUser.id) return; // Never match against self
      const match = calculateMatch(currentUser, peer);
      if (match && match.score > 0) {
        matches.push(match);
      }
    });

    return matches;
  }

  /**
   * 7. Filter matches by strength tier
   * @param {Array<Object>} matches 
   * @param {string} strengthFilter - 'all' | 'perfect' | 'strong' | 'good' | 'potential'
   * @returns {Array<Object>}
   */
  function filterMatches(matches, strengthFilter = 'all') {
    if (!Array.isArray(matches)) return [];
    if (!strengthFilter || strengthFilter === 'all') return [...matches];

    return matches.filter(m => {
      if (strengthFilter === 'perfect') return m.score >= 90;
      if (strengthFilter === 'strong') return m.score >= 70 && m.score < 90;
      if (strengthFilter === 'good') return m.score >= 50 && m.score < 70;
      if (strengthFilter === 'potential') return m.score >= 25 && m.score < 50;
      if (strengthFilter === 'low') return m.score > 0 && m.score < 25;
      return true;
    });
  }

  /**
   * 8. Sort matches
   * @param {Array<Object>} matches 
   * @param {string} sortBy - 'best' | 'perfect' | 'strong' | 'name'
   * @returns {Array<Object>}
   */
  function sortMatches(matches, sortBy = 'best') {
    if (!Array.isArray(matches)) return [];
    const sorted = [...matches];

    switch (sortBy) {
      case 'perfect':
        // Perfect matches first, then score descending
        sorted.sort((a, b) => {
          const aIsPerfect = a.score >= 90 ? 1 : 0;
          const bIsPerfect = b.score >= 90 ? 1 : 0;
          if (aIsPerfect !== bIsPerfect) return bIsPerfect - aIsPerfect;
          return b.score - a.score;
        });
        break;

      case 'strong':
        // Strong matches (>= 70) first, then score descending
        sorted.sort((a, b) => {
          const aIsStrong = a.score >= 70 ? 1 : 0;
          const bIsStrong = b.score >= 70 ? 1 : 0;
          if (aIsStrong !== bIsStrong) return bIsStrong - aIsStrong;
          return b.score - a.score;
        });
        break;

      case 'name':
        // Name A-Z
        sorted.sort((a, b) => {
          const nameA = (a.otherUser.name || '').toLowerCase();
          const nameB = (b.otherUser.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;

      case 'best':
      default:
        // Highest compatibility score first; tiebreak alphabetically
        sorted.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.otherUser.name || '').localeCompare(b.otherUser.name || '');
        });
        break;
    }

    return sorted;
  }

  /**
   * 9. Render Match Summary Ribbon at the top of the page
   * @param {Array<Object>} matches 
   */
  function renderMatchSummary(matches) {
    const summaryEl = document.getElementById('match-summary-ribbon');
    if (!summaryEl) return;

    const totalCount = matches.length;
    const perfectCount = matches.filter(m => m.score >= 90).length;
    const strongCount = matches.filter(m => m.score >= 70 && m.score < 90).length;
    const goodCount = matches.filter(m => m.score >= 50 && m.score < 70).length;
    const potentialCount = matches.filter(m => m.score >= 25 && m.score < 50).length;

    summaryEl.innerHTML = `
      <div class="summary-pill summary-pill-total" data-filter="all" role="button" tabindex="0" title="View all matches">
        <span class="pill-number">${totalCount}</span>
        <span class="pill-label">${totalCount === 1 ? 'Match Found' : 'Matches Found'}</span>
      </div>
      <div class="summary-pill summary-pill-perfect" data-filter="perfect" role="button" tabindex="0" title="Filter by Perfect matches">
        <span class="pill-badge">🔥</span>
        <span class="pill-number">${perfectCount}</span>
        <span class="pill-label">Perfect</span>
      </div>
      <div class="summary-pill summary-pill-strong" data-filter="strong" role="button" tabindex="0" title="Filter by Strong matches">
        <span class="pill-badge">⚡</span>
        <span class="pill-number">${strongCount}</span>
        <span class="pill-label">Strong</span>
      </div>
      <div class="summary-pill summary-pill-good" data-filter="good" role="button" tabindex="0" title="Filter by Good matches">
        <span class="pill-badge">✨</span>
        <span class="pill-number">${goodCount}</span>
        <span class="pill-label">Good</span>
      </div>
      <div class="summary-pill summary-pill-potential" data-filter="potential" role="button" tabindex="0" title="Filter by Potential matches">
        <span class="pill-badge">💡</span>
        <span class="pill-number">${potentialCount}</span>
        <span class="pill-label">Potential</span>
      </div>
    `;

    // Add click listeners to summary pills to quickly switch filters
    summaryEl.querySelectorAll('.summary-pill').forEach(pill => {
      const handler = () => {
        const filterVal = pill.getAttribute('data-filter');
        setFilter(filterVal);
      };
      pill.addEventListener('click', handler);
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  /**
   * 10. Render Match Cards Grid
   * @param {Array<Object>} matches 
   * @param {Object} currentUser 
   */
  function renderMatchCards(matches, currentUser) {
    const gridContainer = document.getElementById('matches-grid');
    const emptyContainer = document.getElementById('matches-empty-state');
    const resultsCountEl = document.getElementById('matches-results-count');

    if (!gridContainer || !emptyContainer) return;

    if (resultsCountEl) {
      if (matches.length === 0) {
        resultsCountEl.textContent = 'No matching peers found';
      } else if (matches.length === 1) {
        resultsCountEl.textContent = 'Showing 1 peer match';
      } else {
        resultsCountEl.textContent = `Showing ${matches.length} peer matches`;
      }
    }

    if (matches.length === 0) {
      gridContainer.innerHTML = '';
      gridContainer.style.display = 'none';
      emptyContainer.style.display = 'block';
      return;
    }

    emptyContainer.style.display = 'none';
    gridContainer.style.display = 'grid';

    gridContainer.innerHTML = matches.map(match => {
      const peer = match.otherUser;
      const initials = peer.name
        ? peer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'SS';

      const level = peer.skillLevel || 'Intermediate';
      const explanation = generateMatchExplanation(currentUser, peer, match);

      // SVG Circle Progress calculation (r = 28, circumference = 2 * PI * 28 ≈ 175.93)
      const radius = 28;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (match.score / 100) * circumference;

      // Color scheme based on tier
      let strokeColor = 'var(--secondary)'; // Cyan for good/strong
      let badgeClass = 'badge-cyan';
      if (match.score >= 90) {
        strokeColor = '#F59E0B'; // Amber flame
        badgeClass = 'badge-amber';
      } else if (match.score >= 70) {
        strokeColor = 'var(--primary)'; // Purple
        badgeClass = 'badge-purple';
      }

      // Format chip lists
      const theyTeachHtml = match.theyTeachYou.length > 0
        ? match.theyTeachYou.map(s => `<span class="match-chip match-chip-cyan">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">None directly matched</span>';

      const youTeachHtml = match.youTeachThem.length > 0
        ? match.youTeachThem.map(s => `<span class="match-chip match-chip-purple">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">None directly matched</span>';

      // Check relationship status with peer
      const rel = typeof SkillSwapRequests !== 'undefined' && currentUser
        ? SkillSwapRequests.getRelationshipStatus(currentUser.id, peer.id)
        : { status: 'none' };

      let requestBtnHtml = '';
      if (rel.status === 'connected') {
        requestBtnHtml = `<span class="badge badge-cyan" style="padding: 0.45rem 0.75rem; font-size: 0.8rem; font-weight: 700;">✓ Connected</span>`;
      } else if (rel.status === 'pending_sent') {
        requestBtnHtml = `<span class="badge badge-amber" style="padding: 0.45rem 0.75rem; font-size: 0.8rem; font-weight: 700;">⏳ Request Pending</span>`;
      } else if (rel.status === 'pending_received') {
        requestBtnHtml = `<a href="requests.html" class="btn btn-secondary btn-sm"><span>Respond</span></a>`;
      } else {
        requestBtnHtml = `
          <button 
            type="button" 
            class="btn btn-primary btn-sm btn-primary-glow js-card-send-request-btn" 
            data-user-id="${peer.id}"
          >
            <span>Request Swap</span>
          </button>
        `;
      }

      return `
        <article class="match-card match-card-${match.tier}" data-user-id="${peer.id}">
          <!-- Match Card Header -->
          <div class="match-card-top">
            <div class="match-peer-info">
              <div class="match-peer-avatar" aria-hidden="true">${initials}</div>
              <div>
                <h2 class="match-peer-name">${escapeHtml(peer.name)}</h2>
                <div class="match-peer-meta">
                  <span class="match-level-badge">${escapeHtml(level)}</span>
                  <span class="match-quality-badge ${badgeClass}">${match.icon} ${match.label}</span>
                </div>
              </div>
            </div>

            <!-- Score Visualizer Ring -->
            <div class="match-score-ring-wrap" title="${match.score}% Compatibility Score">
              <svg class="match-score-svg" width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="${match.score}% match">
                <circle class="score-ring-bg" cx="36" cy="36" r="${radius}" />
                <circle 
                  class="score-ring-progress" 
                  cx="36" 
                  cy="36" 
                  r="${radius}" 
                  stroke="${strokeColor}" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${strokeDashoffset}" 
                />
              </svg>
              <div class="match-score-text">
                <span class="score-number">${match.score}%</span>
                <span class="score-caption">MATCH</span>
              </div>
            </div>
          </div>

          <!-- Dynamic Explanation Sentence -->
          <div class="match-explanation-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p class="match-explanation-text">${escapeHtml(explanation)}</p>
          </div>

          <!-- Skill Exchange Grid -->
          <div class="match-exchange-grid">
            <div class="match-exchange-column">
              <div class="match-col-header text-cyan">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>THEY CAN TEACH YOU</span>
              </div>
              <div class="match-chips-list">
                ${theyTeachHtml}
              </div>
            </div>

            <div class="match-exchange-column">
              <div class="match-col-header text-purple">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>YOU CAN TEACH THEM</span>
              </div>
              <div class="match-chips-list">
                ${youTeachHtml}
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="match-card-actions">
            <button 
              type="button" 
              class="btn btn-outline btn-sm js-view-details-btn" 
              data-user-id="${peer.id}" 
              aria-haspopup="dialog"
            >
              <span>View Details</span>
            </button>
            ${requestBtnHtml}
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to Details buttons
    gridContainer.querySelectorAll('.js-view-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        openMatchDetails(userId, btn);
      });
    });

    // Attach click listeners to Request Swap buttons on cards
    gridContainer.querySelectorAll('.js-card-send-request-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute('data-user-id');
        const match = allCalculatedMatches.find(m => m.userId === userId);
        if (match) {
          openSendRequestModal(match, btn);
        }
      });
    });
  }

  /**
   * 11. Open Match Details Modal Dialog
   * @param {string} userId 
   * @param {HTMLElement} triggerBtn 
   */
  function openMatchDetails(userId, triggerBtn = null) {
    const match = allCalculatedMatches.find(m => m.userId === userId);
    if (!match) return;

    activeModalMatch = match;
    lastFocusedElement = triggerBtn || document.activeElement;

    const modalOverlay = document.getElementById('match-details-modal');
    if (!modalOverlay) return;

    const peer = match.otherUser;
    const initials = peer.name
      ? peer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'SS';

    // Populate Modal Content
    document.getElementById('modal-peer-avatar').textContent = initials;
    document.getElementById('modal-peer-name').textContent = peer.name || 'Peer';
    document.getElementById('modal-peer-level').textContent = peer.skillLevel || 'Intermediate';
    document.getElementById('modal-score-badge').innerHTML = `${match.icon} ${match.score}% ${match.label}`;

    // Circular or Bar indicator values
    document.getElementById('modal-dir-a-bar').style.width = `${match.directionA}%`;
    document.getElementById('modal-dir-a-val').textContent = `${match.directionA}%`;

    document.getElementById('modal-dir-b-bar').style.width = `${match.directionB}%`;
    document.getElementById('modal-dir-b-val').textContent = `${match.directionB}%`;

    // Chip Lists
    const modalTeachChips = document.getElementById('modal-they-teach-chips');
    if (modalTeachChips) {
      modalTeachChips.innerHTML = match.theyTeachYou.length > 0
        ? match.theyTeachYou.map(s => `<span class="display-chip display-chip-learn">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="text-secondary" style="font-size:0.85rem;">No direct teaching match</span>';
    }

    const modalLearnChips = document.getElementById('modal-you-teach-chips');
    if (modalLearnChips) {
      modalLearnChips.innerHTML = match.youTeachThem.length > 0
        ? match.youTeachThem.map(s => `<span class="display-chip display-chip-teach">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="text-secondary" style="font-size:0.85rem;">No direct teaching match</span>';
    }

    // Recommendation sentence
    const recEl = document.getElementById('modal-recommendation-text');
    if (recEl) {
      recEl.textContent = generateRecommendation(match);
    }

    // Profile Link
    const profileLink = document.getElementById('modal-profile-link');
    if (profileLink) {
      profileLink.href = `profile.html?id=${encodeURIComponent(peer.id)}`;
    }

    // Update Send Swap Request button in details modal
    const currentUser = SkillSwapAuth.getCurrentUser();
    const rel = typeof SkillSwapRequests !== 'undefined' && currentUser
      ? SkillSwapRequests.getRelationshipStatus(currentUser.id, peer.id)
      : { status: 'none' };

    const modalSendBtn = document.getElementById('modal-send-request-btn');
    if (modalSendBtn) {
      modalSendBtn.className = 'btn btn-sm';
      modalSendBtn.onclick = null;
      if (rel.status === 'connected') {
        modalSendBtn.classList.add('btn-secondary');
        modalSendBtn.disabled = true;
        modalSendBtn.innerHTML = `<span>✓ Connected</span>`;
      } else if (rel.status === 'pending_sent') {
        modalSendBtn.classList.add('btn-outline');
        modalSendBtn.disabled = true;
        modalSendBtn.style.color = '#F59E0B';
        modalSendBtn.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        modalSendBtn.innerHTML = `<span>⏳ Request Pending</span>`;
      } else if (rel.status === 'pending_received') {
        modalSendBtn.classList.add('btn-secondary');
        modalSendBtn.disabled = false;
        modalSendBtn.innerHTML = `<span>Respond to Request →</span>`;
        modalSendBtn.onclick = () => {
          window.location.href = 'requests.html';
        };
      } else {
        modalSendBtn.classList.add('btn-primary', 'btn-primary-glow');
        modalSendBtn.disabled = false;
        modalSendBtn.style.color = '';
        modalSendBtn.style.borderColor = '';
        modalSendBtn.innerHTML = `<span>Send Swap Request</span>`;
        modalSendBtn.onclick = () => {
          openSendRequestModal(match, modalSendBtn);
        };
      }
    }

    // Display Modal
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Set focus to the modal close button for accessibility
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * 12. Close Match Details Modal Dialog
   */
  function closeMatchDetails() {
    const modalOverlay = document.getElementById('match-details-modal');
    if (!modalOverlay) return;

    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    activeModalMatch = null;

    if (!activeSendRequestMatch) {
      document.body.style.overflow = '';
    }

    // Restore focus to triggering button
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  // Active state for send request confirmation modal
  let activeSendRequestMatch = null;
  let sendModalLastFocus = null;

  /**
   * 13. Open Send Swap Request Confirmation Modal Dialog
   * @param {Object} match 
   * @param {HTMLElement} triggerBtn 
   */
  function openSendRequestModal(match, triggerBtn = null) {
    if (!match) return;
    activeSendRequestMatch = match;
    sendModalLastFocus = triggerBtn || document.activeElement;

    const modal = document.getElementById('send-request-modal');
    if (!modal) return;

    const peer = match.otherUser;
    const nameEl = document.getElementById('send-modal-peer-name');
    if (nameEl) nameEl.textContent = peer.name || 'Peer';

    // Skill coverage lists
    const theyTeachEl = document.getElementById('send-modal-they-teach');
    if (theyTeachEl) {
      theyTeachEl.innerHTML = match.theyTeachYou.length > 0
        ? match.theyTeachYou.map(s => `<span class="match-chip match-chip-cyan">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">None directly matched</span>';
    }

    const youTeachEl = document.getElementById('send-modal-you-teach');
    if (youTeachEl) {
      youTeachEl.innerHTML = match.youTeachThem.length > 0
        ? match.youTeachThem.map(s => `<span class="match-chip match-chip-purple">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">None directly matched</span>';
    }

    const messageInput = document.getElementById('send-request-message-input');
    if (messageInput) {
      messageInput.value = '';
    }
    const countEl = document.getElementById('send-request-char-count');
    if (countEl) {
      countEl.textContent = '0 / 250';
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const cancelBtn = document.getElementById('send-modal-cancel-btn');
    if (cancelBtn) cancelBtn.focus();
  }

  /**
   * 14. Close Send Swap Request Confirmation Modal Dialog
   */
  function closeSendRequestModal() {
    const modal = document.getElementById('send-request-modal');
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    activeSendRequestMatch = null;

    if (!activeModalMatch) {
      document.body.style.overflow = '';
    }

    if (sendModalLastFocus && typeof sendModalLastFocus.focus === 'function') {
      sendModalLastFocus.focus();
    }
  }

  /**
   * 15. Submit Swap Request handler
   */
  function handleSendRequestSubmit() {
    if (!activeSendRequestMatch) return;
    const currentUser = SkillSwapAuth.getCurrentUser();
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    const messageInput = document.getElementById('send-request-message-input');
    const message = messageInput ? messageInput.value : '';

    if (typeof SkillSwapRequests === 'undefined') {
      console.error('SkillSwapRequests module not found.');
      return;
    }

    const result = SkillSwapRequests.createRequest({
      fromUserId: currentUser.id,
      toUserId: activeSendRequestMatch.userId,
      message,
      matchScore: activeSendRequestMatch.score,
      theyTeachMe: activeSendRequestMatch.theyTeachYou,
      iTeachThem: activeSendRequestMatch.youTeachThem
    });

    if (result.success) {
      SkillSwapRequests.showToast('Request Sent', result.message, 'success');
      closeSendRequestModal();
      closeMatchDetails();
      // Re-render matches to update button states immediately
      applyFilterAndSort();
    } else {
      SkillSwapRequests.showToast('Notice', result.message, 'info');
      closeSendRequestModal();
    }
  }

  /**
   * Helper to set filter programmatically and re-render
   * @param {string} filterVal 
   */
  function setFilter(filterVal) {
    activeFilter = filterVal;

    // Update filter pill UI buttons
    document.querySelectorAll('.match-filter-btn').forEach(btn => {
      const match = btn.getAttribute('data-filter') === filterVal;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-pressed', match ? 'true' : 'false');
    });

    // Update summary pills active highlight
    document.querySelectorAll('.summary-pill').forEach(pill => {
      const match = pill.getAttribute('data-filter') === filterVal;
      pill.classList.toggle('active', match);
    });

    applyFilterAndSort();
  }

  /**
   * Helper to set sorting programmatically and re-render
   * @param {string} sortVal 
   */
  function setSort(sortVal) {
    activeSort = sortVal;
    const sortSelect = document.getElementById('match-sort-select');
    if (sortSelect && sortSelect.value !== sortVal) {
      sortSelect.value = sortVal;
    }
    applyFilterAndSort();
  }

  /**
   * Apply current filter & sort and update UI
   */
  function applyFilterAndSort() {
    const currentUser = SkillSwapAuth.getCurrentUser();
    currentFilteredMatches = filterMatches(allCalculatedMatches, activeFilter);
    currentFilteredMatches = sortMatches(currentFilteredMatches, activeSort);
    renderMatchCards(currentFilteredMatches, currentUser);
  }

  /**
   * Escape HTML utility
   * @param {string} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 16. Initialize Matchmaking Page
   */
  function initMatches() {
    // 1. Guard page authentication
    if (typeof SkillSwapAuth !== 'undefined') {
      SkillSwapAuth.requireAuth('login.html');
    }

    const currentUser = typeof SkillSwapAuth !== 'undefined' ? SkillSwapAuth.getCurrentUser() : null;
    if (!currentUser) return; // Guard already redirected

    // Check if user has an incomplete profile (0 learn skills or 0 teach skills)
    const teachSkills = currentUser.teachSkills || [];
    const learnSkills = currentUser.learnSkills || [];
    const incompleteBanner = document.getElementById('incomplete-profile-banner');

    if (teachSkills.length === 0 || learnSkills.length === 0) {
      if (incompleteBanner) {
        incompleteBanner.style.display = 'flex';
      }
    } else {
      if (incompleteBanner) {
        incompleteBanner.style.display = 'none';
      }
    }

    // 2. Fetch all users from localStorage
    const allUsers = typeof SkillSwapAuth !== 'undefined' ? SkillSwapAuth.getUsers() : [];

    // 3. Generate matches
    allCalculatedMatches = generateMatches(currentUser, allUsers);

    // 4. Render top summary
    renderMatchSummary(allCalculatedMatches);

    // 5. Initial render with default filter and sort
    setFilter('all');

    // 6. Bind Filter Buttons
    document.querySelectorAll('.match-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterVal = btn.getAttribute('data-filter');
        setFilter(filterVal);
      });
    });

    // 7. Bind Sort Dropdown
    const sortSelect = document.getElementById('match-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        setSort(e.target.value);
      });
    }

    // 8. Bind Match Details Modal Events
    const modalOverlay = document.getElementById('match-details-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMatchDetails);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeMatchDetails();
        }
      });
    }

    // 9. Bind Send Swap Request Modal Events
    const sendModal = document.getElementById('send-request-modal');
    const sendCloseBtn = document.getElementById('send-modal-close-btn');
    const sendCancelBtn = document.getElementById('send-modal-cancel-btn');
    const sendSubmitBtn = document.getElementById('send-modal-submit-btn');
    const sendMsgInput = document.getElementById('send-request-message-input');
    const sendCharCount = document.getElementById('send-request-char-count');

    if (sendCloseBtn) sendCloseBtn.addEventListener('click', closeSendRequestModal);
    if (sendCancelBtn) sendCancelBtn.addEventListener('click', closeSendRequestModal);
    if (sendSubmitBtn) sendSubmitBtn.addEventListener('click', handleSendRequestSubmit);

    if (sendModal) {
      sendModal.addEventListener('click', (e) => {
        if (e.target === sendModal) closeSendRequestModal();
      });
    }

    if (sendMsgInput && sendCharCount) {
      sendMsgInput.addEventListener('input', () => {
        sendCharCount.textContent = `${sendMsgInput.value.length} / 250`;
      });
    }

    // 10. Escape Key listener for accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (activeSendRequestMatch) {
          closeSendRequestModal();
        } else if (activeModalMatch) {
          closeMatchDetails();
        }
      }
    });
  }

  // Self-initialize on DOMContentLoaded if on matches.html
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.pathname.includes('matches.html')) {
        initMatches();
      }
    });
  }

  // Public API
  return {
    normalizeSkill,
    getMatchLabel,
    calculateMatch,
    generateMatchExplanation,
    generateRecommendation,
    generateMatches,
    filterMatches,
    sortMatches,
    renderMatchCards,
    renderMatchSummary,
    openMatchDetails,
    closeMatchDetails,
    initMatches
  };
})();

// Export for browser global and Node.js testing
if (typeof window !== 'undefined') {
  window.SkillSwapMatches = SkillSwapMatches;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSwapMatches;
}
