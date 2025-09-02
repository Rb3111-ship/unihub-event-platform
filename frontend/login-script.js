/**
 * @file This script manages user authentication functionalities including
 * opening/closing a login modal, switching between login/register/password reset tabs,
 * and handling form submissions for login, registration, and password reset.
 */

/**
 * --- Modal Functionality ---
 */

/**
 * Opens the login modal by setting its display style to 'flex'.
 */
function openLoginModal() {
  console.log('INFO: Attempting to open login modal.');
  document.getElementById('loginModal').style.display = 'flex';
  console.log('INFO: Login modal opened successfully.');
}

/**
 * Closes the login modal by setting its display style to 'none'.
 */
function closeLoginModal() {
  console.log('INFO: Attempting to close login modal.');
  document.getElementById('loginModal').style.display = 'none';
  console.log('INFO: Login modal closed successfully.');
}


/**
 * --- Tab Functionality ---
 */

/**
 * Displays the specified tab content and activates its corresponding tab header.
 * Hides all other tab content and deactivates their headers.
 * @param {string} tabId - The ID of the tab content to display (e.g., 'login-tab', 'register-tab', 'reset-tab').
 */
function showTab(tabId) {
  console.log(`INFO: Switching to tab: '${tabId}'`);

  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
    console.log(`DEBUG: Deactivated tab content: #${tab.id}`);
  });

  // Remove active class from all tab headers
  document.querySelectorAll('.tab-header div').forEach(header => {
    header.classList.remove('active');
    console.log(`DEBUG: Deactivated tab header: ${header.textContent.trim()}`);
  });

  // Show the selected tab and activate corresponding header
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active');
    console.log(`INFO: Activated tab content: #${tabId}`);
    if (tabId === 'login-tab') {
      document.querySelector('.tab-header div:first-child').classList.add('active');
      console.log('DEBUG: Activated login tab header.');
    } else if (tabId === 'register-tab') {
      document.querySelector('.tab-header div:last-child').classList.add('active');
      console.log('DEBUG: Activated register tab header.');
    } else if (tabId === 'reset-tab') {
      // Assuming 'reset-tab' might not have a direct header, or handled differently
      console.log('DEBUG: Activated password reset tab content.');
    }
  } else {
    console.warn(`WARNING: Tab with ID '${tabId}' not found.`);
  }
}

/**
 * Shows the password reset tab. This is a convenience function that calls `showTab` with 'reset-tab'.
 */
function showPasswordReset() {
  console.log('INFO: Initiating display of password reset tab.');
  showTab('reset-tab');
}

/**
 * --- API Configuration and Form Submission Handlers ---
 */

/**
 * Determines the authentication service URL based on the hostname.
 * Uses 'localhost' for local development, otherwise '192.168.41.157' (for potential internal network access).
 * @type {string}
 */
const host = location.hostname === 'localhost' ? 'localhost' : '192.168.41.157';
const AUTH_SERVICE_URL = `http://${host}:8000/api`;
console.log(`CONFIG: Authentication service API URL set to: ${AUTH_SERVICE_URL}`);

/**
 * Attaches event listeners to form submissions and other UI elements once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function () {

  /**
   * --- Login Form Submission ---
   * Handles the submission of the login form.
   */
  document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission behavior

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    console.log(`INFO: Attempting login for email: '${email}'`);

    // Basic client-side validation
    if (!email || !password) {
      console.warn('VALIDATION: Login attempt failed: Email or password not provided.');
      // Using Swal.fire for consistent alerts
      Swal.fire({
        icon: 'warning',
        title: 'Input Required',
        text: 'Please enter both your email and password to log in.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      /**
       * Sends a POST request to the login API endpoint.
       * @type {Response}
       */
      const response = await fetch(`${AUTH_SERVICE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      /**
       * Parses the JSON response from the API.
       * @type {object}
       */
      const data = await response.json();
      console.log('INFO: Login API response received:', data);

      if (response.ok) {
        // Store user data and token in localStorage upon successful login
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        console.log('SUCCESS: User data and token stored in local storage.');

        Swal.fire({
          title: 'Login Successful!',
          text: 'You have successfully logged in.',
          icon: 'success',
          showConfirmButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: 'Continue'
        }).then((result) => {
          if (result.isConfirmed) {
            // Redirect to event.html after successful login
            console.log('INFO: Redirecting to event.html after successful login.');
            window.location.href = 'event.html';
          }
        });
      } else {
        // Handle API errors for login failure
        const errorMessage = data.error || "An unexpected error occurred during login.";
        console.error('ERROR: Login failed:', errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: errorMessage,
          confirmButtonText: 'Try Again'
        });
      }
    } catch (error) {
      console.error('CRITICAL: Network or unexpected error during login fetch:', error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Could not connect to the authentication service. Please try again later.',
        confirmButtonText: 'OK'
      });
    }
  });

  /**
   * --- Register Form Submission ---
   * Handles the submission of the registration form.
   */
  document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission behavior

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const roleInput = document.querySelector('input[name="value-radio"]:checked');
    const roleChosen = roleInput ? roleInput.value : '';
    console.log(`INFO: Attempting registration for email: '${email}' with role: '${roleChosen}'`);

    // Client-side validation for registration
    if (!name || !email || !password || !confirmPassword || !roleChosen) {
      console.warn('VALIDATION: Registration attempt failed: All fields are required.');
      Swal.fire({
        icon: 'warning',
        title: 'Input Required',
        text: 'Please fill in all required fields and select a role.',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (password !== confirmPassword) {
      console.warn('VALIDATION: Registration attempt failed: Passwords do not match.');
      Swal.fire({
        icon: 'warning',
        title: 'Password Mismatch',
        text: 'The entered passwords do not match. Please try again.',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (password.length < 6) {
      console.warn('VALIDATION: Registration attempt failed: Password too short.');
      Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'Your password must be at least 6 characters long.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      /**
       * Sends a POST request to the registration API endpoint.
       * @type {Response}
       */
      const response = await fetch(`${AUTH_SERVICE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: roleChosen })
      });

      /**
       * Parses the JSON response from the API.
       * @type {object}
       */
      const data = await response.json();
      console.log('INFO: Registration API response received:', data);

      if (response.ok) {
        Swal.fire({
          title: 'Registration Successful!',
          text: 'Your account has been created. You can now log in.',
          icon: 'success',
          showConfirmButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: 'Great!'
        }).then((result) => {
          if (result.isConfirmed) {
            console.log('INFO: Closing modal after successful registration.');
            closeLoginModal(); // Close the modal
            showTab('login-tab'); // Optionally switch back to login tab
          }
        });
      } else {
        // Handle API errors for registration failure
        const errorMessage = data.error || "An unexpected error occurred during registration.";
        console.error('ERROR: Registration failed:', errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorMessage,
          confirmButtonText: 'Try Again'
        });
      }
    } catch (error) {
      console.error('CRITICAL: Network or unexpected error during registration fetch:', error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Could not connect to the authentication service. Please try again later.',
        confirmButtonText: 'OK'
      });
    }
  });

  /**
   * --- Password Reset Form Submission ---
   * Handles the submission of the password reset form.
   * NOTE: This is currently a simulated process and needs actual API integration.
   */
  document.getElementById('resetForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission behavior

    const email = document.getElementById('resetEmail').value.trim();
    console.log(`INFO: Attempting password reset for email: '${email}'`);

    if (!email) {
      console.warn('VALIDATION: Password reset attempt failed: Email not provided.');
      Swal.fire({
        icon: 'warning',
        title: 'Input Required',
        text: 'Please enter your email address to reset your password.',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Simulate password reset process
    console.log(`DEBUG: Simulating password reset link sent to: '${email}'`);
    Swal.fire({
      title: 'Password Reset',
      text: `A password reset link has been sent to ${email}. Please check your inbox.`,
      icon: 'info',
      confirmButtonText: 'OK'
    }).then(() => {
      console.log('INFO: Redirecting to login tab after simulated password reset.');
      showTab('login-tab'); // Redirects to the login tab after simulation
    });
    // In a real application, you would send a fetch request here to your password reset API endpoint
    // Example: await fetch(`${AUTH_SERVICE_URL}/reset-password.php`, { ... });
  });

  /**
   * --- Modal Outside Click Listener ---
   * Closes the login modal when a click occurs outside of its content (on the modal overlay).
   */
  window.addEventListener('click', function (event) {
    const loginModal = document.getElementById('loginModal');
    if (event.target === loginModal) {
      console.log('INFO: Click detected outside modal, closing login modal.');
      closeLoginModal();
    }
  });
});