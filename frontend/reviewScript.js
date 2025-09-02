const API_BASE_URL = 'http://localhost:4000';

let selectedRating = 0;

// Get eventId and eventName from query params
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('eventId');
const eventName = urlParams.get('eventName');

if (!eventId || !eventName) {
    alert("Invalid feedback link. Missing event information.");
}

// Rating system
const stars = document.querySelectorAll('.star');
const ratingText = document.getElementById('ratingText');

const ratingTexts = {
    1: 'Poor - Needs significant improvement',
    2: 'Fair - Below expectations',
    3: 'Good - Met expectations',
    4: 'Very Good - Exceeded expectations',
    5: 'Excellent - Outstanding event!'
};

stars.forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        updateStars();
        ratingText.textContent = ratingTexts[selectedRating];
    });

    star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        highlightStars(rating);
    });
});

document.getElementById('ratingStars').addEventListener('mouseleave', () => {
    updateStars();
});

function highlightStars(rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateStars() {
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Form submission
document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const messageContainer = document.getElementById('messageContainer');
    const message = document.getElementById('message').value.trim();

    if (!message) {
        showMessage('Please enter your feedback message', 'error');
        return;
    }

    if (selectedRating === 0) {
        showMessage('Please select a rating', 'error');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span>Submitting...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId,
                eventName,
                message,
                rating: selectedRating
            })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                title: 'Submitted',
                text: 'Your Feedback was recieved. Thank You.',
                icon: 'success',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'OK'
            })
        } else {
            showMessage(data.message || 'Failed to submit feedback', 'error');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Feedback';
    }
});

function showMessage(text, type) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;

    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

// Auto-resize textarea
const textarea = document.getElementById('message');
textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
