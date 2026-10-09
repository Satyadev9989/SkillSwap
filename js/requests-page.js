/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Requests Page Controller (js/requests-page.js)
 * Manages Incoming, Sent, and Connections tabs, accept/reject workflows, and modals.
 */

const SkillSwapRequestsPage = (function () {
  'use strict';

  let currentTab = 'incoming';
  let activeRejectRequestId = null;
  let activeDetailsRequest = null;
  let lastFocusedElement = null;

  /**
   * Escape HTML utility
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
   * Switch Active Tab (incoming | sent | connections)
   * @param {string} tabName 
   */
  function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.requests-tab-btn').forEach(btn => {
      const match = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    // Update tab panels
    document.querySelectorAll('.requests-tab-panel').forEach(panel => {
      const match = panel.id === `panel-${tabName}`;
      panel.classList.toggle('active', match);
    });

    renderAll();
  }

  /**
   * Render Tab Badges / Counters
   */
  function renderTabBadges(currentUser) {
    if (!currentUser || typeof SkillSwapRequests === 'undefined') return;

    const counts = SkillSwapRequests.getPendingCounts(currentUser.id);
    const connections = SkillSwapRequests.getUserConnections(currentUser.id);

    const incomingBadge = document.getElementById('badge-incoming-count');
    const sentBadge = document.getElementById('badge-sent-count');
    const connectionsBadge = document.getElementById('badge-connections-count');

    if (incomingBadge) {
      incomingBadge.textContent = counts.incoming.length;
    }
    if (sentBadge) {
      sentBadge.textContent = counts.outgoing.length;
    }
    if (connectionsBadge) {
      connectionsBadge.textContent = connections.length;
    }
  }

  /**
   * Render Incoming Requests Tab
   */
  function renderIncomingTab(currentUser, users) {
    const container = document.getElementById('incoming-cards-grid');
    const emptyState = document.getElementById('incoming-empty-state');
    if (!container || !emptyState) return;

    const incoming = SkillSwapRequests.getIncomingRequests(currentUser.id);
    // Sort: pending first, then by date descending
    incoming.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (incoming.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'grid';

    container.innerHTML = incoming.map(req => {
      const sender = users.find(u => u.id === req.fromUserId) || {
        id: req.fromUserId,
        name: 'Peer',
        skillLevel: 'Intermediate'
      };

      const initials = sender.name
        ? sender.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'SS';

      // Match label & icon from Stage 4 module if available
      const matchLabel = typeof SkillSwapMatches !== 'undefined'
        ? SkillSwapMatches.getMatchLabel(req.matchScore)
        : { label: 'Match', icon: '✨' };

      const timeAgo = SkillSwapRequests.formatRelativeTime(req.createdAt);

      const statusBadge = `
        <span class="badge-status badge-status-${req.status}">
          ${req.status === 'pending' ? '⏳ Pending' : req.status === 'accepted' ? '✓ Accepted' : '✕ Rejected'}
        </span>
      `;

      // Skills chips
      const theyTeachHtml = req.theyTeachMe && req.theyTeachMe.length > 0
        ? req.theyTeachMe.map(s => `<span class="match-chip match-chip-cyan">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">General mentorship</span>';

      const iTeachHtml = req.iTeachThem && req.iTeachThem.length > 0
        ? req.iTeachThem.map(s => `<span class="match-chip match-chip-purple">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">General mentorship</span>';

      // Message Quote Box
      const messageHtml = req.message
        ? `
          <div class="request-message-box">
            <svg class="request-message-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>"${escapeHtml(req.message)}"</span>
          </div>
        `
        : '';

      // Action buttons: Accept / Reject only for pending
      let actionButtons = `
        <a href="profile.html?id=${encodeURIComponent(sender.id)}" class="btn btn-outline btn-sm">
          <span>View Profile</span>
        </a>
      `;

      if (req.status === 'pending') {
        actionButtons += `
          <button type="button" class="btn btn-secondary btn-sm js-accept-btn" data-req-id="${req.id}" data-sender-name="${escapeHtml(sender.name)}">
            <span>Accept</span>
          </button>
          <button type="button" class="btn btn-outline btn-sm js-reject-btn" data-req-id="${req.id}" data-sender-name="${escapeHtml(sender.name)}" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">
            <span>Reject</span>
          </button>
        `;
      }

      return `
        <article class="request-card request-card-incoming" data-req-id="${req.id}">
          <div class="request-card-header">
            <div class="request-peer-info">
              <div class="request-peer-avatar">${initials}</div>
              <div>
                <h3 class="request-peer-name">${escapeHtml(sender.name)}</h3>
                <div class="request-meta-tags">
                  <span class="match-level-badge">${escapeHtml(sender.skillLevel || 'Intermediate')}</span>
                  <span class="match-quality-badge badge-purple">${matchLabel.icon} ${req.matchScore}% ${matchLabel.label}</span>
                </div>
              </div>
            </div>
            ${statusBadge}
          </div>

          ${messageHtml}

          <div class="request-skills-box">
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--secondary-light); margin-bottom: 0.3rem;">THEY TEACH YOU:</div>
              <div class="match-chips-list">${theyTeachHtml}</div>
            </div>
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--primary-light); margin-bottom: 0.3rem;">YOU TEACH THEM:</div>
              <div class="match-chips-list">${iTeachHtml}</div>
            </div>
          </div>

          <div class="request-card-footer">
            <span class="request-time-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Received ${timeAgo}</span>
            </span>
            <div class="request-actions-group">
              ${actionButtons}
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach Accept button listener
    container.querySelectorAll('.js-accept-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const reqId = btn.getAttribute('data-req-id');
        handleAccept(reqId);
      });
    });

    // Attach Reject button listener
    container.querySelectorAll('.js-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const reqId = btn.getAttribute('data-req-id');
        const senderName = btn.getAttribute('data-sender-name');
        openRejectModal(reqId, senderName, btn);
      });
    });
  }

  /**
   * Render Sent Requests Tab
   */
  function renderSentTab(currentUser, users) {
    const container = document.getElementById('sent-cards-grid');
    const emptyState = document.getElementById('sent-empty-state');
    if (!container || !emptyState) return;

    const outgoing = SkillSwapRequests.getOutgoingRequests(currentUser.id);
    outgoing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (outgoing.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'grid';

    container.innerHTML = outgoing.map(req => {
      const recipient = users.find(u => u.id === req.toUserId) || {
        id: req.toUserId,
        name: 'Peer',
        skillLevel: 'Intermediate'
      };

      const initials = recipient.name
        ? recipient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'SS';

      const matchLabel = typeof SkillSwapMatches !== 'undefined'
        ? SkillSwapMatches.getMatchLabel(req.matchScore)
        : { label: 'Match', icon: '✨' };

      const timeAgo = SkillSwapRequests.formatRelativeTime(req.createdAt);

      const statusBadge = `
        <span class="badge-status badge-status-${req.status}">
          ${req.status === 'pending' ? '⏳ Pending' : req.status === 'accepted' ? '✓ Accepted' : '✕ Rejected'}
        </span>
      `;

      const youTeachHtml = req.iTeachThem && req.iTeachThem.length > 0
        ? req.iTeachThem.map(s => `<span class="match-chip match-chip-purple">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">General mentorship</span>';

      const theyTeachHtml = req.theyTeachMe && req.theyTeachMe.length > 0
        ? req.theyTeachMe.map(s => `<span class="match-chip match-chip-cyan">✓ ${escapeHtml(s)}</span>`).join('')
        : '<span class="match-chip-empty">General mentorship</span>';

      const messageHtml = req.message
        ? `
          <div class="request-message-box">
            <svg class="request-message-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>"${escapeHtml(req.message)}"</span>
          </div>
        `
        : '';

      return `
        <article class="request-card request-card-sent" data-req-id="${req.id}">
          <div class="request-card-header">
            <div class="request-peer-info">
              <div class="request-peer-avatar">${initials}</div>
              <div>
                <h3 class="request-peer-name">To: ${escapeHtml(recipient.name)}</h3>
                <div class="request-meta-tags">
                  <span class="match-level-badge">${escapeHtml(recipient.skillLevel || 'Intermediate')}</span>
                  <span class="match-quality-badge badge-cyan">${matchLabel.icon} ${req.matchScore}% ${matchLabel.label}</span>
                </div>
              </div>
            </div>
            ${statusBadge}
          </div>

          ${messageHtml}

          <div class="request-skills-box">
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--primary-light); margin-bottom: 0.3rem;">YOU OFFER:</div>
              <div class="match-chips-list">${youTeachHtml}</div>
            </div>
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--secondary-light); margin-bottom: 0.3rem;">THEY OFFER:</div>
              <div class="match-chips-list">${theyTeachHtml}</div>
            </div>
          </div>

          <div class="request-card-footer">
            <span class="request-time-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Sent ${timeAgo}</span>
            </span>
            <div class="request-actions-group">
              <a href="profile.html?id=${encodeURIComponent(recipient.id)}" class="btn btn-outline btn-sm">
                <span>View Profile</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Render Connections Tab
   */
  function renderConnectionsTab(currentUser) {
    const container = document.getElementById('connections-cards-grid');
    const emptyState = document.getElementById('connections-empty-state');
    if (!container || !emptyState) return;

    const connections = SkillSwapRequests.getUserConnections(currentUser.id);
    connections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (connections.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'grid';

    container.innerHTML = connections.map(conn => {
      const peer = conn.peer;
      const initials = peer.name
        ? peer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'SS';

      const connectedDate = new Date(conn.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // You teach them skills (intersection of my teachSkills and their learnSkills)
      const youTeach = currentUser.teachSkills
        ? currentUser.teachSkills.filter(s => (peer.learnSkills || []).some(ls => ls.toLowerCase() === s.toLowerCase()))
        : [];
      const peerTeaches = peer.teachSkills
        ? peer.teachSkills.filter(s => (currentUser.learnSkills || []).some(ls => ls.toLowerCase() === s.toLowerCase()))
        : [];

      const youTeachStr = youTeach.length > 0 ? youTeach.join(', ') : (currentUser.teachSkills || []).slice(0, 2).join(', ') || 'Skills';
      const peerTeachesStr = peerTeaches.length > 0 ? peerTeaches.join(', ') : (peer.teachSkills || []).slice(0, 2).join(', ') || 'Skills';

      return `
        <article class="connection-card" data-conn-id="${conn.connectionId}">
          <div class="request-card-header">
            <div class="request-peer-info">
              <div class="request-peer-avatar">${initials}</div>
              <div>
                <h3 class="request-peer-name">${escapeHtml(peer.name)}</h3>
                <div class="request-meta-tags">
                  <span class="match-level-badge">${escapeHtml(peer.skillLevel || 'Intermediate')}</span>
                  <span class="badge-status badge-status-accepted">✓ Connected</span>
                </div>
              </div>
            </div>
            <div class="connection-date-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${connectedDate}</span>
            </div>
          </div>

          <div class="modal-skills-box" style="padding: 0.9rem; font-size: 0.85rem;">
            <div style="display: flex; gap: 0.5rem; align-items: baseline;">
              <span style="font-weight: 700; color: var(--primary-light); min-width: 90px;">You teach:</span>
              <span style="color: var(--text-primary);">${escapeHtml(youTeachStr)}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: baseline;">
              <span style="font-weight: 700; color: var(--secondary-light); min-width: 90px;">${escapeHtml(peer.name.split(' ')[0])} teaches:</span>
              <span style="color: var(--text-primary);">${escapeHtml(peerTeachesStr)}</span>
            </div>
          </div>

          <div class="request-card-footer">
            <span style="font-size: 0.78rem; color: var(--text-muted);">
              Chat & scheduling coming in Stage 6
            </span>
            <div class="request-actions-group">
              <a href="profile.html?id=${encodeURIComponent(peer.id)}" class="btn btn-outline btn-sm">
                <span>View Profile</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Master Render Function
   */
  function renderAll() {
    const currentUser = SkillSwapAuth.getCurrentUser();
    if (!currentUser) return;

    const users = SkillSwapAuth.getUsers();

    renderTabBadges(currentUser);
    renderIncomingTab(currentUser, users);
    renderSentTab(currentUser, users);
    renderConnectionsTab(currentUser);
  }

  /**
   * Handle Request Acceptance
   * @param {string} requestId 
   */
  function handleAccept(requestId) {
    const currentUser = SkillSwapAuth.getCurrentUser();
    if (!currentUser) return;

    const result = SkillSwapRequests.acceptRequest(requestId, currentUser.id);
    if (result.success) {
      SkillSwapRequests.showToast('Connected!', result.message, 'success');
      renderAll();
    } else {
      SkillSwapRequests.showToast('Notice', result.message, 'info');
    }
  }

  /**
   * Open Reject Confirmation Modal Dialog
   * @param {string} requestId 
   * @param {string} senderName 
   * @param {HTMLElement} triggerBtn 
   */
  function openRejectModal(requestId, senderName, triggerBtn = null) {
    activeRejectRequestId = requestId;
    lastFocusedElement = triggerBtn || document.activeElement;

    const modal = document.getElementById('reject-confirm-modal');
    if (!modal) return;

    const nameEl = document.getElementById('reject-modal-sender-name');
    if (nameEl) nameEl.textContent = senderName;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const cancelBtn = document.getElementById('reject-modal-cancel-btn');
    if (cancelBtn) cancelBtn.focus();
  }

  /**
   * Close Reject Confirmation Modal Dialog
   */
  function closeRejectModal() {
    const modal = document.getElementById('reject-confirm-modal');
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeRejectRequestId = null;

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  /**
   * Confirm Reject
   */
  function handleConfirmReject() {
    if (!activeRejectRequestId) return;
    const currentUser = SkillSwapAuth.getCurrentUser();
    if (!currentUser) return;

    const result = SkillSwapRequests.rejectRequest(activeRejectRequestId, currentUser.id);
    if (result.success) {
      SkillSwapRequests.showToast('Request Rejected', result.message, 'info');
      closeRejectModal();
      renderAll();
    } else {
      SkillSwapRequests.showToast('Notice', result.message, 'info');
      closeRejectModal();
    }
  }

  /**
   * Initialize Requests Page
   */
  function initRequestsPage() {
    // 1. Guard authentication
    SkillSwapAuth.requireAuth('login.html');

    const currentUser = SkillSwapAuth.getCurrentUser();
    if (!currentUser) return;

    // 2. Tab Navigation clicks
    document.querySelectorAll('.requests-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // 3. Reject Modal Events
    const rejectModal = document.getElementById('reject-confirm-modal');
    const rejectCancelBtn = document.getElementById('reject-modal-cancel-btn');
    const rejectConfirmBtn = document.getElementById('reject-modal-confirm-btn');
    const rejectCloseBtn = document.getElementById('reject-modal-close-btn');

    if (rejectCancelBtn) rejectCancelBtn.addEventListener('click', closeRejectModal);
    if (rejectCloseBtn) rejectCloseBtn.addEventListener('click', closeRejectModal);
    if (rejectConfirmBtn) rejectConfirmBtn.addEventListener('click', handleConfirmReject);

    if (rejectModal) {
      rejectModal.addEventListener('click', (e) => {
        if (e.target === rejectModal) closeRejectModal();
      });
    }

    // 4. Escape Key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (activeRejectRequestId) {
          closeRejectModal();
        }
      }
    });

    // 5. Initial Render based on URL query parameter or default incoming
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get('tab');
    if (requestedTab === 'connections' || requestedTab === 'sent') {
      switchTab(requestedTab);
    } else {
      switchTab('incoming');
    }
  }

  // Self-initialize on DOMContentLoaded if on requests.html
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.pathname.includes('requests.html')) {
        initRequestsPage();
      }
    });
  }

  return {
    switchTab,
    renderAll,
    handleAccept,
    openRejectModal,
    closeRejectModal,
    handleConfirmReject,
    initRequestsPage
  };
})();

// Export for browser and Node.js
if (typeof window !== 'undefined') {
  window.SkillSwapRequestsPage = SkillSwapRequestsPage;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSwapRequestsPage;
}
