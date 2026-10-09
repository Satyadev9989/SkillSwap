/**
 * SkillSwap - Peer-to-Peer Skill Exchange Platform
 * Authentication & Session Management (js/auth.js)
 * 
 * ============================================================================
 * ⚠️ DEVELOPMENT & COLLEGE PBL PROTOTYPE NOTE:
 * This authentication system operates client-side using browser localStorage
 * for prototype, PBL evaluation, and demonstration purposes.
 * In a production software environment, user passwords MUST NEVER be stored in
 * plaintext or validated client-side. A secure backend (e.g. Node.js / Express,
 * Python / FastAPI, or Go) using strong password hashing (bcrypt / Argon2),
 * secure HTTP-only session cookies / JWTs, rate limiting, and CSRF protection
 * is required for real-world production security.
 * ============================================================================
 */

const SkillSwapAuth = (function () {
  // Storage Keys as specified in requirements
  const USERS_KEY = 'skillSwapUsers';
  const CURRENT_USER_KEY = 'skillSwapCurrentUser';

  /**
   * Helper to retrieve all registered users from localStorage
   * @returns {Array<Object>}
   */
  function getUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error reading skillSwapUsers from localStorage:', err);
      return [];
    }
  }

  /**
   * Helper to persist users array to localStorage
   * @param {Array<Object>} users 
   */
  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Error saving skillSwapUsers to localStorage:', err);
    }
  }

  /**
   * Generate a unique user ID
   * @returns {string} e.g. "user_1728123456_a1b2c"
   */
  function generateUserId() {
    return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }

  /**
   * Initialize Demo Accounts if they do not already exist
   * Seeds realistic peer profiles for Explore directory without overwriting real users:
   * 1. Alex Rivera (Intermediate - JavaScript, Java)
   * 2. Elena Chen (Advanced - UI/UX Design, Figma)
   * 3. Rahul Sharma (Intermediate - Python, Data Analysis)
   * 4. Maya Patel (Beginner - Graphic Design, Photoshop)
   */
  function initDemoAccount() {
    const users = getUsers();
    let hasChanges = false;

    const demoProfiles = [
      {
        id: 'user_demo_001',
        name: 'Alex Rivera',
        email: 'demo@skillswap.com',
        password: 'demo123',
        teachSkills: ['JavaScript', 'Java'],
        learnSkills: ['UI/UX Design', 'Figma'],
        skillLevel: 'Intermediate',
        isDemo: true,
        createdAt: '2026-10-01T10:00:00.000Z'
      },
      {
        id: 'user_demo_002',
        name: 'Elena Chen',
        email: 'elena@skillswap.com',
        password: 'demo123',
        teachSkills: ['UI/UX Design', 'Figma'],
        learnSkills: ['JavaScript'],
        skillLevel: 'Advanced',
        isDemo: true,
        createdAt: '2026-10-02T11:30:00.000Z'
      },
      {
        id: 'user_demo_003',
        name: 'Rahul Sharma',
        email: 'rahul@skillswap.com',
        password: 'demo123',
        teachSkills: ['Python', 'Data Analysis'],
        learnSkills: ['Web Development'],
        skillLevel: 'Intermediate',
        isDemo: true,
        createdAt: '2026-10-03T14:15:00.000Z'
      },
      {
        id: 'user_demo_004',
        name: 'Maya Patel',
        email: 'maya@skillswap.com',
        password: 'demo123',
        teachSkills: ['Graphic Design', 'Photoshop'],
        learnSkills: ['Video Editing'],
        skillLevel: 'Beginner',
        isDemo: true,
        createdAt: '2026-10-04T09:00:00.000Z'
      }
    ];

    demoProfiles.forEach(demo => {
      const existing = users.find(u => u.email && u.email.toLowerCase() === demo.email.toLowerCase());
      if (!existing) {
        users.push(demo);
        hasChanges = true;
      } else if (!existing.isDemo) {
        existing.isDemo = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveUsers(users);
      console.log('✅ Demo peer profiles seeded/verified in skillSwapUsers.');
    }
  }

  /**
   * Check if a session exists and is valid
   * @returns {boolean}
   */
  function isLoggedIn() {
    const currentId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentId) return false;
    const user = getUsers().find(u => u.id === currentId);
    return Boolean(user);
  }

  /**
   * Get the currently logged-in user profile
   * @returns {Object|null}
   */
  function getCurrentUser() {
    const currentId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentId) return null;
    const users = getUsers();
    return users.find(u => u.id === currentId) || null;
  }

  /**
   * Register a new user
   * @param {Object} userData - { name, email, password, teachSkills, learnSkills, skillLevel }
   * @returns {{ success: boolean, message?: string, user?: Object }}
   */
  function registerUser(userData) {
    const { name, email, password, teachSkills, learnSkills, skillLevel } = userData;

    // Sanity checks
    if (!name || !name.trim()) {
      return { success: false, message: 'Full name is required.' };
    }
    if (!email || !email.trim()) {
      return { success: false, message: 'Valid email address is required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    if (!teachSkills || !teachSkills.length) {
      return { success: false, message: 'Please select at least one skill you can teach.' };
    }
    if (!learnSkills || !learnSkills.length) {
      return { success: false, message: 'Please select at least one skill you want to learn.' };
    }

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const emailTaken = users.some(u => u.email && u.email.toLowerCase() === normalizedEmail);
    if (emailTaken) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Create new user profile matching specified data model
    const newUser = {
      id: generateUserId(),
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Note: Prototype storage, see security notice above
      teachSkills: Array.from(new Set(teachSkills)),
      learnSkills: Array.from(new Set(learnSkills)),
      skillLevel: skillLevel || 'Intermediate',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Automatically set current session on signup
    localStorage.setItem(CURRENT_USER_KEY, newUser.id);

    return { success: true, user: newUser };
  }

  /**
   * Authenticate user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {{ success: boolean, message?: string, user?: Object }}
   */
  function loginUser(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    // Ensure demo account is seeded before lookup
    initDemoAccount();

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(
      u => u.email && u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid email or password. Please try again.' };
    }

    // Save session ID
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return { success: true, user };
  }

  /**
   * Log out the current user and redirect
   * @param {string} redirectUrl - Optional redirect target (defaults to relative home)
   */
  function logoutUser(redirectUrl) {
    localStorage.removeItem(CURRENT_USER_KEY);
    
    // Determine appropriate relative redirect path based on directory location
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      const isSubPage = window.location.pathname.includes('/pages/');
      window.location.href = isSubPage ? '../index.html' : 'index.html';
    }
  }

  /**
   * Update an existing user profile (for profile page editing)
   * @param {string} userId 
   * @param {Object} updatedFields - { name, teachSkills, learnSkills, skillLevel }
   * @returns {{ success: boolean, message?: string, user?: Object }}
   */
  function updateUser(userId, updatedFields) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);

    if (index === -1) {
      return { success: false, message: 'User not found.' };
    }

    if (updatedFields.name && updatedFields.name.trim()) {
      users[index].name = updatedFields.name.trim();
    }
    if (Array.isArray(updatedFields.teachSkills) && updatedFields.teachSkills.length > 0) {
      users[index].teachSkills = Array.from(new Set(updatedFields.teachSkills));
    }
    if (Array.isArray(updatedFields.learnSkills) && updatedFields.learnSkills.length > 0) {
      users[index].learnSkills = Array.from(new Set(updatedFields.learnSkills));
    }
    if (updatedFields.skillLevel) {
      users[index].skillLevel = updatedFields.skillLevel;
    }

    users[index].updatedAt = new Date().toISOString();

    saveUsers(users);
    return { success: true, user: users[index] };
  }

  /**
   * Guard for protected pages (e.g. dashboard.html, profile.html)
   * Redirects to login if not authenticated.
   * @param {string} redirectUrl - default "login.html"
   */
  function requireAuth(redirectUrl = 'login.html') {
    if (!isLoggedIn()) {
      window.location.href = redirectUrl;
    }
  }

  /**
   * Guard for guest-only pages (e.g. login.html, signup.html)
   * Redirects to dashboard if already logged in.
   * @param {string} redirectUrl - default "dashboard.html"
   */
  function redirectIfLoggedIn(redirectUrl = 'dashboard.html') {
    if (isLoggedIn()) {
      window.location.href = redirectUrl;
    }
  }

  /**
   * Dynamically synchronize Navigation / Header UI based on login status
   * Ensures landing page and page headers display Dashboard/Profile/Logout when logged in,
   * or Login/Get Started when logged out.
   */
  function updateNavAuthUI() {
    const user = getCurrentUser();
    const isSubPage = window.location.pathname.includes('/pages/');
    const dashboardHref = isSubPage ? 'dashboard.html' : 'pages/dashboard.html';
    const profileHref = isSubPage ? 'profile.html' : 'pages/profile.html';
    const matchesHref = isSubPage ? 'matches.html' : 'pages/matches.html';
    const requestsHref = isSubPage ? 'requests.html' : 'pages/requests.html';
    const loginHref = isSubPage ? 'login.html' : 'pages/login.html';
    const signupHref = isSubPage ? 'signup.html' : 'pages/signup.html';

    // 1. Desktop Nav Actions container
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      if (user) {
        navActions.innerHTML = `
          <a href="${matchesHref}" class="btn btn-outline btn-sm" title="View Mutual Skill Matches">Matches</a>
          <a href="${requestsHref}" class="btn btn-outline btn-sm" title="Swap Requests & Connections">Requests</a>
          <a href="${dashboardHref}" class="btn btn-outline btn-sm">Dashboard</a>
          <a href="${profileHref}" class="btn btn-secondary btn-sm" title="${user.name}">
            <span>${user.name.split(' ')[0]}</span>
          </a>
          <button type="button" class="btn btn-outline btn-sm js-nav-logout-btn" aria-label="Log Out">Log Out</button>
        `;
      } else {
        navActions.innerHTML = `
          <a href="${loginHref}" class="btn btn-outline btn-sm">Log In</a>
          <a href="${signupHref}" class="btn btn-primary btn-sm btn-primary-glow">
            <span>Get Started</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        `;
      }
    }

    // 2. Mobile Nav Actions container
    const mobileActions = document.querySelector('.mobile-nav-actions');
    if (mobileActions) {
      if (user) {
        mobileActions.innerHTML = `
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
            Signed in as <strong style="color: var(--text-primary);">${user.name}</strong>
          </div>
          <a href="${matchesHref}" class="btn btn-outline btn-block" style="border-color: var(--primary); color: var(--primary-light);">🔥 Skill Matches</a>
          <a href="${requestsHref}" class="btn btn-outline btn-block">Swap Requests</a>
          <a href="${dashboardHref}" class="btn btn-outline btn-block">Dashboard</a>
          <a href="${profileHref}" class="btn btn-secondary btn-block">My Profile</a>
          <button type="button" class="btn btn-outline btn-block js-nav-logout-btn">Log Out</button>
        `;
      } else {
        mobileActions.innerHTML = `
          <a href="${loginHref}" class="btn btn-outline btn-block">Log In</a>
          <a href="${signupHref}" class="btn btn-primary btn-block btn-primary-glow">Get Started</a>
        `;
      }
    }

    // Attach click listener for any dynamic logout buttons
    document.querySelectorAll('.js-nav-logout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        logoutUser();
      });
    });
  }

  // Self-initialize demo account and nav state on script execution
  initDemoAccount();

  document.addEventListener('DOMContentLoaded', () => {
    updateNavAuthUI();
  });

  return {
    getUsers,
    saveUsers,
    generateUserId,
    initDemoAccount,
    isLoggedIn,
    getCurrentUser,
    registerUser,
    loginUser,
    logoutUser,
    updateUser,
    requireAuth,
    redirectIfLoggedIn,
    updateNavAuthUI
  };
})();

// Attach to window and module export for universal browser & testing support
if (typeof window !== 'undefined') {
  window.SkillSwapAuth = SkillSwapAuth;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSwapAuth;
}
