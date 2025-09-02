/**
 * @file Manages the display of event feedback (reviews) and calculates/updates
 * event metrics such as average rating, total feedback count, and RSVP count.
 * This script interacts directly with the DOM to render feedback and metrics.
 */

// DOM element references
/**
 * The container element where individual feedback reviews will be displayed.
 * @type {HTMLElement}
 */
const feedbackSection = document.querySelector('.feedback-section');

/**
 * The element that displays a message when no feedback is available.
 * @type {HTMLElement}
 */
const noFeedback = document.querySelector('.no-feedback');


/**
 * Function that retrieves data from local storage
 */
const getData = () => {
    let review = JSON.parse(localStorage.getItem('reviews')) || [];
    let rsvpCount = parseInt(localStorage.getItem('rsvpCount')) || 0;
    feedBackPage(review, rsvpCount);
}

/**
 * --- Core Feedback Display Function ---
 */

/**
 * Populates the feedback section with reviews and updates event metrics.
 * If reviews are available, the "no feedback" message is hidden, and each review
 * is added to the DOM. It also calculates the average rating and updates metrics.
 * @param {Array<Object>} reviews - An array of review objects, each expected to have a 'rating' and 'message'.
 * @param {number} rsvpCount - The total number of RSVPs for the event.
 */
function feedBackPage(reviews, rsvpCount) {
    console.log('INFO: Initiating feedback page rendering.');
    console.log('DEBUG: Reviews received:', reviews);
    console.log('DEBUG: RSVP count received:', rsvpCount);

    if (reviews && reviews.length > 0) {
        console.log(`INFO: ${reviews.length} review(s) found. Hiding 'no feedback' message.`);
        // Hide the "no feedback" message as there are reviews to display
        noFeedback.style.display = 'none';

        let reviewCount = 0;
        let totalRating = 0;

        /**
         * Iterates through each review to calculate total rating and count,
         * and to add each review to the DOM.
         */
        reviews.forEach(review => {
            reviewCount++;
            totalRating += review.rating;
            addFeedback(review); // Renders each individual feedback item
        });

        /**
         * Calculates the average rating. Defaults to 0 if no reviews exist to prevent division by zero.
         * @type {number}
         */
        const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
        console.log(`INFO: Calculated average rating: ${averageRating.toFixed(1)}, Total reviews: ${reviewCount}`);

        // Update the metrics display with the calculated values
        updateMetrics({
            averageRating: averageRating,
            totalFeedback: reviewCount, // 'x' was undefined, replaced with 'reviewCount'
            totalRSVPs: rsvpCount,
        });
        console.log('INFO: Metrics updated based on feedback data.');
    } else {
        // If no reviews, ensure the "no feedback" message is visible and metrics reflect no data
        console.log('INFO: No feedback found. Displaying "no feedback" message.');
        noFeedback.style.display = 'block'; // Ensure it's visible if no feedback
        updateMetrics({
            averageRating: 0,
            totalFeedback: 0,
            totalRSVPs: rsvpCount, // Still display RSVP count even without reviews
        });
    }
}


/**
 * --- Metrics Update Functionality ---
 */

/**
 * Updates the displayed metric cards with new data including average rating,
 * total feedback count, sentiment, and total RSVPs.
 * @param {Object} data - An object containing the metrics to update.
 * @param {number} data.averageRating - The calculated average rating.
 * @param {number} data.totalFeedback - The total number of feedback entries.
 * @param {number} data.totalRSVPs - The total number of RSVPs.
 */
function updateMetrics(data) {
    console.log('INFO: Updating metric cards with new data.');
    console.log('DEBUG: Metric data received for update:', data);

    const avg = data.averageRating;
    let sentiment;

    // Determine sentiment based on average rating
    if (avg >= 4.5) {
        sentiment = "Very Good";
    } else if (avg >= 3.5) {
        sentiment = "Good";
    } else if (avg >= 2.5) {
        sentiment = "Moderate";
    } else if (avg > 0) { // Ensures "Bad" only applies if there's a rating > 0
        sentiment = "Bad";
    } else { // For 0 or no rating
        sentiment = "No rating";
    }
    console.log(`INFO: Calculated sentiment: '${sentiment}' for average rating: ${avg.toFixed(1)}`);


    /**
     * Consolidated metrics object for display.
     * Ensures default values of 0 for numerical metrics if data is undefined.
     * @type {object}
     */
    const metrics = {
        averageRating: parseFloat(avg.toFixed(1)) || 0, // Format to one decimal place, default to 0
        totalFeedback: data.totalFeedback || 0,
        sentiment: sentiment,
        totalRSVPs: data.totalRSVPs || 0
    };

    console.log('DEBUG: Final metrics object for display:', metrics);

    // Update the DOM with new values for each metric card
    const averageRatingElement = document.querySelector('.metric-card:nth-child(1) .metric-value');
    if (averageRatingElement) {
        averageRatingElement.innerHTML = `${metrics.averageRating}<span class="metric-suffix">/5</span>`;
        console.log(`DEBUG: Updated average rating to: ${metrics.averageRating}/5`);
    } else {
        console.warn('WARNING: Metric card for average rating not found in DOM.');
    }

    const totalFeedbackElement = document.querySelector('.metric-card:nth-child(2) .metric-value');
    if (totalFeedbackElement) {
        totalFeedbackElement.textContent = metrics.totalFeedback;
        console.log(`DEBUG: Updated total feedback to: ${metrics.totalFeedback}`);
    } else {
        console.warn('WARNING: Metric card for total feedback not found in DOM.');
    }

    const sentimentElement = document.querySelector('.metric-card:nth-child(3) .metric-value');
    if (sentimentElement) {
        // Note: The original code appended '%' to sentiment. If sentiment is a word (e.g., "Good"), '%' is inappropriate.
        // Assuming sentiment should be a descriptive word, not a percentage.
        sentimentElement.textContent = metrics.sentiment;
        console.log(`DEBUG: Updated sentiment to: ${metrics.sentiment}`);
    } else {
        console.warn('WARNING: Metric card for sentiment not found in DOM.');
    }

    const totalRsvpsElement = document.querySelector('.metric-card:nth-child(4) .metric-value');
    if (totalRsvpsElement) {
        totalRsvpsElement.textContent = metrics.totalRSVPs;
        console.log(`DEBUG: Updated total RSVPs to: ${metrics.totalRSVPs}`);
    } else {
        console.warn('WARNING: Metric card for total RSVPs not found in DOM.');
    }

    console.log('INFO: Metric card DOM updates complete.');
}

/**
 * --- Individual Feedback Rendering Function ---
 */

/**
 * Adds a single feedback review item to the feedback section in the DOM.
 * It generates star ratings based on the review's rating and displays the review message.
 * @param {Object} review - The review object to add.
 * @param {number} review.rating - The numerical rating (e.g., 1-5).
 * @param {string} review.message - The textual feedback message.
 */
function addFeedback(review) {
    console.log(`INFO: Adding feedback review to DOM for rating: ${review.rating}`);

    /**
     * Generates a string of Unicode star characters for visual rating representation.
     * Solid stars (★) for the given rating, hollow stars (☆) for the remainder up to 5.
     * @type {string}
     */
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    /**
     * The HTML string for a single review item.
     * @type {string}
     */
    const reviewHTML = `
    <div class="review">
      <p class="review-stars">${stars}</p>
      <p class="review-message">${review.message}</p>
      <hr class="review-divider"/>
    </div>
  `;
    console.log(`DEBUG: Generated HTML for review with message: "${review.message.substring(0, 30)}..."`);


    // Appends the new review HTML to the feedback section.
    // Using insertAdjacentHTML('beforeend') is generally more performant than innerHTML +=
    // as it avoids re-parsing the entire content of the element.
    if (feedbackSection) {
        feedbackSection.insertAdjacentHTML('beforeend', reviewHTML);
        console.log('INFO: Review successfully added to feedback section.');
    } else {
        console.error('ERROR: Feedback section element (.feedback-section) not found. Cannot add review.');
    }
}


/**
 * --- Initialization ---
 */

/**
 * Executes once the entire HTML document has been completely loaded and parsed.
 * This ensures that all DOM elements are available before script execution.
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('INFO: Feedback Analytics page script loaded and DOM content is ready.');
    getData();
});