/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Swap Requests & Connections Controller (js/requests.js)
 * 
 * ============================================================================
 * ARCHITECTURAL SPECIFICATION & PBL DEMONSTRATION NOTE:
 * This module manages peer-to-peer swap proposals and mutual connections
 * client-side using browser localStorage for prototype & PBL demonstration.
 * In production, a secure server-side API with database transactions,
 * webhooks, rate-limiting, and push notifications would handle swap requests.
 * ============================================================================
 */

const SkillSwapRequests = (function () {
  'use strict';

  // Storage Keys as specified in requirements
  const REQUESTS_KEY = 'skillSwapRequests';
  const CONNECTIONS_KEY = 'skillSwapConnections';

  /**
   * 1. Retrieve all swap requests from localStorage
   * @returns {Array<Object>}
   */
  function getRequests() {
    try {
      const data = localStorage.getItem(REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error reading skillSwapRequests:', err);
      return [];
    }
  }

  /**
   * 2. Persist swap requests array to localStorage
   * @param {Array<Object>} requests 
   */
  function saveRequests(requests) {
    try {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    } catch (err) {
      console.error('Error saving skillSwapRequests:', err);
    }
  }

  /**
   * 3. Retrieve all connections from localStorage
   * @returns {Array<Object>}
   */
  function getConnections() {
    try {
      const data = localStorage.getItem(CONNECTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error reading skillSwapConnections:', err);
      return [];
    }
  }

  /**
   * 4. Persist connections array to localStorage
   * @param {Array<Object>} connections 
   */
  function saveConnections(connections) {
    try {
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
    } catch (err) {
      console.error('Error saving skillSwapConnections:', err);
    }
  }

  /**
   * Generate unique identifier with prefix
   * @param {string} prefix - e.g. "request" | "connection"
   * @returns {string}
   */
  function generateId(prefix = 'req') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * 5. Check if an active connection exists between two users (bidirectional)
   * @param {string} userAId 
   * @param {string} userBId 
   * @returns {boolean}
   */
  function hasExistingConnection(userAId, userBId) {
    if (!userAId || !userBId) return false;
    const connections = getConnections();
    return connections.some(c => 
      (c.userA === userAId && c.userB === userBId) ||
      (c.userA === userBId && c.userB === userAId)
    );
  }

  /**
   * 6. Retrieve existing connection object between two users if any
   * @param {string} userAId 
   * @param {string} userBId 
   * @returns {Object|null}
   */
  function getConnection(userAId, userBId) {
    if (!userAId || !userBId) return null;
    const connections = getConnections();
    return connections.find(c => 
      (c.userA === userAId && c.userB === userBId) ||
      (c.userA === userBId && c.userB === userAId)
    ) || null;
  }

  /**
   * 7. Check if a pending request exists between two users in EITHER direction
   * @param {string} userAId 
   * @param {string} userBId 
   * @returns {boolean}
   */
  function hasPendingRequest(userAId, userBId) {
    if (!userAId || !userBId) return false;
    const requests = getRequests();
    return requests.some(r => 
      r.status === 'pending' &&
      ((r.fromUserId === userAId && r.toUserId === userBId) ||
       (r.fromUserId === userBId && r.toUserId === userAId))
    );
  }

  /**
   * 8. Get specific relationship status between current user and peer
   * @param {string} currentUserId 
   * @param {string} peerId 
   * @returns {{ status: 'connected' | 'pending_sent' | 'pending_received' | 'none', request: Object|null, connection: Object|null }}
   */
  function getRelationshipStatus(currentUserId, peerId) {
    if (!currentUserId || !peerId) {
      return { status: 'none', request: null, connection: null };
    }

    if (hasExistingConnection(currentUserId, peerId)) {
      return { 
        status: 'connected', 
        request: null, 
        connection: getConnection(currentUserId, peerId) 
      };
    }

    const requests = getRequests();
    // Check pending sent by current user
    const sentPending = requests.find(r => 
      r.status === 'pending' && r.fromUserId === currentUserId && r.toUserId === peerId
    );
    if (sentPending) {
      return { status: 'pending_sent', request: sentPending, connection: null };
    }

    // Check pending received from peer
    const receivedPending = requests.find(r => 
      r.status === 'pending' && r.fromUserId === peerId && r.toUserId === currentUserId
    );
    if (receivedPending) {
      return { status: 'pending_received', request: receivedPending, connection: null };
    }

    return { status: 'none', request: null, connection: null };
  }

  /**
   * 9. Create a new swap request with comprehensive validations
   * @param {Object} params
   * @param {Object|string} paramsOrFromId - Object with options or fromUserId string
   * @param {string} [maybeToUserId] - toUserId if positional
   * @param {string} [maybeMessage] - message if positional
   * @param {number} [maybeMatchScore] - matchScore if positional
   * @param {Array<string>} [maybeTheyTeachMe] - theyTeachMe if positional
   * @param {Array<string>} [maybeITeachThem] - iTeachThem if positional
   * @returns {{ success: boolean, message: string, request?: Object }}
   */
  function createRequest(paramsOrFromId, maybeToUserId, maybeMessage, maybeMatchScore, maybeTheyTeachMe, maybeITeachThem) {
    let fromUserId, toUserId, message, matchScore, theyTeachMe, iTeachThem;
    if (typeof paramsOrFromId === 'object' && paramsOrFromId !== null) {
      ({ fromUserId, toUserId, message = '', matchScore = 0, theyTeachMe = [], iTeachThem = [] } = paramsOrFromId);
    } else {
      fromUserId = paramsOrFromId;
      toUserId = maybeToUserId;
      message = maybeMessage || '';
      matchScore = maybeMatchScore || 0;
      theyTeachMe = maybeTheyTeachMe || [];
      iTeachThem = maybeITeachThem || [];
    }
    if (!fromUserId || !toUserId) {
      return { success: false, message: 'Invalid user parameters.' };
    }

    if (fromUserId === toUserId) {
      return { success: false, message: 'You cannot send a swap request to yourself.' };
    }

    // Check if target user exists
    const users = typeof SkillSwapAuth !== 'undefined' ? SkillSwapAuth.getUsers() : [];
    const sender = users.find(u => u.id === fromUserId);
    const recipient = users.find(u => u.id === toUserId);

    if (!sender || !recipient) {
      return { success: false, message: 'User profile no longer exists.' };
    }

    // Rule 1: Connection duplication check
    if (hasExistingConnection(fromUserId, toUserId)) {
      return { success: false, message: `You are already connected with ${recipient.name}!` };
    }

    // Rule 2: Pending request duplication check in both directions
    const requests = getRequests();
    const reversePending = requests.find(r => 
      r.status === 'pending' && r.fromUserId === toUserId && r.toUserId === fromUserId
    );
    if (reversePending) {
      return { 
        success: false, 
        message: `${recipient.name} has already sent you a request. Check your Requests page.` 
      };
    }

    const directPending = requests.find(r => 
      r.status === 'pending' && r.fromUserId === fromUserId && r.toUserId === toUserId
    );
    if (directPending) {
      return { 
        success: false, 
        message: `You already have a pending request sent to ${recipient.name}.` 
      };
    }

    // Rule 3: Match validation check (Dynamic recalculation using Stage 4 algorithm)
    if (typeof SkillSwapMatches !== 'undefined') {
      const matchCheck = SkillSwapMatches.calculateMatch(sender, recipient);
      if (!matchCheck || matchCheck.score <= 0) {
        return { 
          success: false, 
          message: 'This match is no longer available. Your profiles may have changed.' 
        };
      }
      // Update match context with freshest values
      matchScore = matchCheck.score;
      theyTeachMe = matchCheck.theyTeachYou;
      iTeachThem = matchCheck.youTeachThem;
    }

    // Sanitize optional message (max 250 characters)
    const cleanMessage = (message || '').trim().substring(0, 250);

    const newRequest = {
      id: generateId('request'),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: cleanMessage,
      matchScore: matchScore || 0,
      theyTeachMe: Array.isArray(theyTeachMe) ? theyTeachMe : [],
      iTeachThem: Array.isArray(iTeachThem) ? iTeachThem : []
    };

    requests.push(newRequest);
    saveRequests(requests);

    return { 
      success: true, 
      message: `Swap request sent to ${recipient.name}!`,
      request: newRequest 
    };
  }

  /**
   * 10. Accept an incoming swap request and establish a mutual connection
   * @param {string} requestId 
   * @param {string} currentUserId 
   * @returns {{ success: boolean, message: string, connection?: Object }}
   */
  function acceptRequest(requestId, currentUserId) {
    const requests = getRequests();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, message: 'Request not found.' };
    }

    const req = requests[index];

    // Security check: Only the recipient can accept
    if (req.toUserId !== currentUserId) {
      return { success: false, message: 'Unauthorized: You are not the recipient of this request.' };
    }

    if (req.status !== 'pending') {
      return { success: false, message: `Request is already ${req.status}.` };
    }

    // 1. Update request status to accepted (preserves history)
    requests[index].status = 'accepted';
    requests[index].updatedAt = new Date().toISOString();
    saveRequests(requests);

    // 2. Create mutual connection
    const connectionResult = createConnection(req.fromUserId, req.toUserId, req.id);

    // Retrieve sender's name for friendly toast
    const users = typeof SkillSwapAuth !== 'undefined' ? SkillSwapAuth.getUsers() : [];
    const sender = users.find(u => u.id === req.fromUserId);
    const senderName = sender ? sender.name : 'Peer';

    return {
      success: true,
      message: `You're now connected with ${senderName}! 🎉`,
      connection: connectionResult.connection,
      request: requests[index]
    };
  }

  /**
   * 11. Reject an incoming swap request
   * @param {string} requestId 
   * @param {string} currentUserId 
   * @returns {{ success: boolean, message: string }}
   */
  function rejectRequest(requestId, currentUserId) {
    const requests = getRequests();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return { success: false, message: 'Request not found.' };
    }

    const req = requests[index];

    // Security check: Only recipient can reject
    if (req.toUserId !== currentUserId) {
      return { success: false, message: 'Unauthorized: You are not the recipient of this request.' };
    }

    if (req.status !== 'pending') {
      return { success: false, message: `Request is already ${req.status}.` };
    }

    // Update status to rejected (preserves history, allows sender to re-request later)
    requests[index].status = 'rejected';
    requests[index].updatedAt = new Date().toISOString();
    saveRequests(requests);

    return {
      success: true,
      message: 'Swap request rejected.'
    };
  }

  /**
   * 12. Create mutual connection between two users
   * @param {string} userA 
   * @param {string} userB 
   * @param {string} [requestId] 
   * @returns {{ success: boolean, connection: Object }}
   */
  function createConnection(userA, userB, requestId = '') {
    const connections = getConnections();

    // Check duplicate in either direction
    const existing = connections.find(c => 
      (c.userA === userA && c.userB === userB) ||
      (c.userA === userB && c.userB === userA)
    );

    if (existing) {
      return { success: true, connection: existing };
    }

    const newConnection = {
      id: generateId('connection'),
      userA,
      userB,
      createdAt: new Date().toISOString(),
      requestId
    };

    connections.push(newConnection);
    saveConnections(connections);

    return { success: true, connection: newConnection };
  }

  /**
   * 13. Get all incoming requests for a user
   * @param {string} userId 
   * @returns {Array<Object>}
   */
  function getIncomingRequests(userId) {
    if (!userId) return [];
    const requests = getRequests();
    return requests.filter(r => r.toUserId === userId);
  }

  /**
   * 14. Get all outgoing (sent) requests by a user
   * @param {string} userId 
   * @returns {Array<Object>}
   */
  function getOutgoingRequests(userId) {
    if (!userId) return [];
    const requests = getRequests();
    return requests.filter(r => r.fromUserId === userId);
  }

  /**
   * 15. Get all pending requests involving user
   * @param {string} userId 
   * @returns {{ incoming: Array<Object>, outgoing: Array<Object>, total: number }}
   */
  function getPendingCounts(userId) {
    if (!userId) return { incoming: [], outgoing: [], total: 0 };
    const requests = getRequests();
    const incomingPending = requests.filter(r => r.toUserId === userId && r.status === 'pending');
    const outgoingPending = requests.filter(r => r.fromUserId === userId && r.status === 'pending');

    return {
      incoming: incomingPending,
      outgoing: outgoingPending,
      incomingCount: incomingPending.length,
      sentCount: outgoingPending.length,
      outgoingCount: outgoingPending.length,
      total: incomingPending.length + outgoingPending.length
    };
  }

  /**
   * 16. Get all enriched connections for a user
   * @param {string} userId 
   * @returns {Array<Object>}
   */
  function getUserConnections(userId) {
    if (!userId) return [];
    const connections = getConnections();
    const users = typeof SkillSwapAuth !== 'undefined' ? SkillSwapAuth.getUsers() : [];

    return connections
      .filter(c => c.userA === userId || c.userB === userId)
      .map(c => {
        const peerId = c.userA === userId ? c.userB : c.userA;
        const peer = users.find(u => u.id === peerId) || {
          id: peerId,
          name: 'Former Member',
          skillLevel: 'Intermediate',
          teachSkills: [],
          learnSkills: []
        };

        return {
          connectionId: c.id,
          createdAt: c.createdAt,
          requestId: c.requestId,
          peer,
          partner: peer
        };
      });
  }

  /**
   * 17. Time Formatter Helper (Relative time e.g. "2 minutes ago", "Yesterday")
   * @param {string} dateIsoString 
   * @returns {string}
   */
  function formatRelativeTime(dateIsoString) {
    if (!dateIsoString) return 'recently';
    const date = new Date(dateIsoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * 18. Toast Notification Utility (Fallback if showToast is not globally attached)
   * @param {string} title 
   * @param {string} message 
   * @param {'info'|'success'|'warning'|'danger'} type 
   */
  function showToast(title, message, type = 'info') {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(title, message, type === 'warning' || type === 'danger' ? 'info' : type);
      return;
    }

    if (typeof document === 'undefined') return;

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

    const iconSvg = type === 'success'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    toast.innerHTML = `
      <div class="toast-icon toast-icon-${type === 'success' ? 'success' : 'info'}">
        ${iconSvg}
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close-btn" aria-label="Close notification">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const dismiss = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
  }

  // Public API
  return {
    getRequests,
    saveRequests,
    getConnections,
    saveConnections,
    hasExistingConnection,
    getConnection,
    hasPendingRequest,
    getRelationshipStatus,
    createRequest,
    acceptRequest,
    rejectRequest,
    createConnection,
    getIncomingRequests,
    getOutgoingRequests,
    getPendingCounts,
    getUserConnections,
    formatRelativeTime,
    showToast
  };
})();

// Export for browser global and Node.js testing
if (typeof window !== 'undefined') {
  window.SkillSwapRequests = SkillSwapRequests;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSwapRequests;
}
