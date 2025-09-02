// ---------------------------- DOM Elements ----------------------------
// Get the modal and related elements
const modal = document.getElementById('registrationModal');
const modalTitle = document.getElementById('modalTitle');
const eventNameInput = document.getElementById('eventName');
const registrationForm = document.getElementById('registrationForm');
const submitButton = document.getElementById('submitButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Get all "I'm Interested" buttons
const interestedButtons = document.querySelectorAll('.interested-btn');

// Get the <span> element that closes the modal
const closeBtn = document.querySelector('.close-modal');

// Event filtering variables
const categoryItems = document.querySelectorAll('.category-item');
const eventCards = document.querySelectorAll('.event-card');
const eventsContainer = document.getElementById('eventsContainer');
const noEventsMessage = document.getElementById('noEvents');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const seeAll = document.getElementById('seeAll');

const overlayModal = document.getElementById('eventDetailsModal');
const closeModal = document.querySelector('.close-modal');

const createEvent = document.querySelector('.createEvent');
// const deleteEv = document.querySelector('.deleteEvent');
// const editEvent = document.querySelector('.editEvent');


const reviewBtn = document.querySelector('.see-more-reviews');

const reviewsSection = document.querySelector('.reviews');
//get token from local storage
const token = localStorage.getItem('token');


const user = JSON.parse(localStorage.getItem('user'));
const userType = user?.role;
const userName = user?.name;

let reviews; 
const btn = document.querySelector('.Btn');

//------------------------test--------------------
let reviewOpen = false;

// ---------------------------- Helper Functions ----------------------------
/**
 * Formats a date string into a readable format.
 * @param {string} dateString - The date string to format.
 * @returns {string} - The formatted date string.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// ---------------------------- Modal Functions ----------------------------
/**
 * Opens the event details modal.
 */
function openEventDetailsModal() {
  overlayModal.style.display = 'flex';

  console.log("Event details modal opened.");
  reviewsSection.style.display = 'none';
}

// Close the modal when the close button is clicked
closeModal.addEventListener('click', () => {
  console.log("Closing the overlay modal.");
  overlayModal.style.display = 'none';
});

// Close the modal when clicking outside the modal content
overlayModal.addEventListener('click', (e) => {
  if (e.target === overlayModal) {
    console.log("Closing the overlay modal.");
    overlayModal.style.display = 'none';
    reviewOpen = false;
    reviewsSection.style.display = 'none';
    reviewBtn.textContent = 'SEE MORE';
  }
});

function closeModalManual() {
  console.log("Closing the overlay modal.");
  overlayModal.style.display = 'none';
  reviewOpen = false;
  reviewsSection.style.display = 'none';
  reviewBtn.textContent = 'SEE MORE';
}

// Logout button 
btn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html"; // or wherever your login/landing page is
});


// ---------------------------- RSVP Function ----------------------------
/**
 * Handles RSVP for an event.
 * @param {string} eventId - The ID of the event.
 */
const rsvp = async (eventId) => {
  console.log("RSVP initiated for event ID:", eventId);
  try {
    const response = await fetch(`/api/events/event/rsvpCount/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },

    });

    if (response.ok) {
      const updatedEvent = await response.json();
      console.log("RSVP successful:", updatedEvent);
      let btn = updatedEvent.btnColor;

      overlayModal.querySelector('.interest-count').textContent = `${updatedEvent.rsvpCount} people have shown interest`;
      const interestedButtons = document.querySelectorAll(`.interested-btn[data-event-id="${eventId}"]`);

      //---------------------------------------------------------
      if (btn) {
        interestedButtons.forEach(button => {
          button.style.backgroundColor = 'blue';
          button.textContent = 'Interested!';
        });
      }
      else {
        interestedButtons.forEach(button => {
          button.style.backgroundColor = '';
          button.textContent = 'Im Interested';
        });
      }
      //------------------------------------------------------------
    } else {
      throw new Error('Request Failed');
    }
  } catch (err) {
    console.error('RSVP failed:', err);
  }
};

// ---------------------------- Event Display Functions ----------------------------
/**
 * Displays event details in the overlay modal.
 * @param {Object} event - The event object containing details to display.
 */
function showEventDetailsModal(event) {
  console.log("Displaying event details in overlay modal.");
  overlayModal.querySelector('.event-title').textContent = event.title || 'No Title';
  overlayModal.querySelector('.organizer-name').textContent = event.organizer || 'Unknown Organizer';
  overlayModal.querySelector('.event-poster img').src = event.image || 'images/logo.jpeg';
  overlayModal.querySelector('.interest-count').textContent = `${event.rsvpCount || 0} people have shown interest`;

  overlayModal.querySelector('.event-details-section').innerHTML = `
    <h3>Event Details</h3>
    <p><i class="fas fa-calendar-alt"></i> Date & Time: ${formatDate(event.date)} At: ${(event.time)}</p>
    <p><i class="fas fa-map-marker-alt"></i> Location: ${event.location}</p>
    <p><i class="fas fa-dollar-sign"></i> Price: ${event.price || 'Free'}</p>
    <p><i class="fas fa-users"></i> Capacity: ${event.capacity || 'N/A'}</p>
    <button class="interested-btn user" data-event="${event.title}" data-event-id="${event._id}">I'm Interested</button>
    <button class="interested-btn organizer editEvent"  data-event="${event.title}" data-event-id="${event._id}">Edit Event</button>
    <button class="interested-btn organizer deleteEvent"  data-event="${event.title}" data-event-id="${event._id}">Delete</button>
    <button class="interested-btn organizer feedBackPage"  data-event="${event.title}" data-event-id="${event._id}">View Feedback</button>
  `;


  displayBasedOnRole();

  getReviews(event.title);

  const interestedBtn = overlayModal.querySelector('.interested-btn.user');
  interestedBtn.addEventListener('click', (e) => {
    console.log(`RSVP clicked for: ${event.title}`);
    rsvp(event._id);
  });


  const deleteBtn = overlayModal.querySelector('.deleteEvent');
  deleteBtn.addEventListener('click', () => {
    localStorage.setItem('eventId', event._id);
    deleteEvent(event._id);
  })

  //Event Listener for Edit Event opens the event creation html
  const editBtn = overlayModal.querySelector('.editEvent');
  editBtn.addEventListener('click', () => {
    localStorage.setItem('eventAction', 'update');
    localStorage.setItem('eventId', event._id);
    window.location.href = 'index_create_event.html';
  })

  const feedBackPage = overlayModal.querySelector('.feedBackPage');
  feedBackPage.addEventListener('click',()=>{
  window.location.href = 'feedBackPage.html';
  getFeedback(reviews ,event.rsvpCount);
})



  // overlayModal.querySelector('.about-event p').textContent = event.description || 'No description available.';

  overlayModal.querySelector('.about-event p').innerHTML = (event.description || 'No description available.')
    .replace(/\n/g, '<br>')
    .replace(/ {2}/g, '&nbsp;&nbsp;');


  const tagsContainer = overlayModal.querySelector('.event-tags');
  tagsContainer.innerHTML = '';
  (event.tags || []).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });

  openEventDetailsModal();
}


const getFeedback = (review, rsvpCount)=>{
  localStorage.setItem('reviews',JSON.stringify(review));
  localStorage.setItem('rsvpCount', rsvpCount);
}

/**
 * Displays a list of events in the events container.
 * @param {Array} events - The array of event objects to display.
 */
const displayEvents = (events) => {
  eventsContainer.innerHTML = '';

  if (!events || events.length === 0) {
    eventsContainer.innerHTML = '<div class="no-events"><h3>No Events Found</h3><p>Try adjusting your search criteria.</p></div>';
    return;
  }

  events.forEach((event) => {
    const eventCard = document.createElement('div');
    eventCard.classList.add('event-card');
    eventCard.setAttribute('data-category', event.category);

    const interestedButton = userType === 'User' ?
      `<button class="interested-btn user" data-event="${event.title}" data-event-id="${event._id}">I'm Interested</button>` :
      '';

    eventCard.innerHTML = `
      <div class="event-image">
        <img src="${event.image || 'images/logo.jpeg'}" alt="${event.title}"/>
      </div>
      <div class="event-details">
        <h3 class="event-title">${event.title}</h3>
        <p class="event-date"><i class="far fa-calendar-alt"></i> ${formatDate(event.date)}  At: ${(event.time)}</p>
        <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
       ${interestedButton}
      </div>
    `;

    console.log("Generated HTML:", eventCard.innerHTML);
    eventCard.dataset.event = JSON.stringify(event);

    eventCard.addEventListener('click', () => {
      const eventData = JSON.parse(eventCard.dataset.event);
      showEventDetailsModal(eventData);
    });

    if (userType === 'User') {

      const interestedBtn = eventCard.querySelector('.interested-btn');
      interestedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`RSVP clicked for: ${event.title}`);
        rsvp(event._id);
      });

    }

    eventsContainer.appendChild(eventCard);
  });
};

// ---------------------------- Event Retrieval Functions ----------------------------
/**
 * Retrieves and displays recent events.
 */
const displayRecent = async () => {
  try {
    const response = await fetch(`/api/events/event/recent`);
    if (response.ok) {
      const jsonResponse = await response.json();
      console.log('Recent events retrieved:', jsonResponse);
      displayEvents(jsonResponse);
    } else {
      throw new Error('Request Failed');
    }
  } catch (err) {
    console.error('Failed to retrieve recent events:', err);
  }

  console.log("NAME OF USER",);
};

/**
 * Retrieves and displays upcoming events.
 */
async function retrieveUpcoming() {
  console.log("Retrieving upcoming events.");
  try {
    const response = await fetch(`/api/events/event/upcoming`);
    if (response.ok) {
      const jsonResponse = await response.json();
      console.log('Upcoming events retrieved:', jsonResponse);
      displayEvents(jsonResponse);
    } else {
      throw new Error('Request Failed');
    }
  } catch (err) {
    console.error('Failed to retrieve upcoming events:', err);
  }
}

/**
 * Retrieves and displays all events.
 */
async function seeAllEvents() {
  console.log("Retrieving all events.");
  try {
    const response = await fetch(`/api/events/event`);
    if (response.ok) {
      const jsonResponse = await response.json();
      console.log('All events retrieved:', jsonResponse);
      displayEvents(jsonResponse.events);
    } else {
      throw new Error('Request Failed');
    }
  } catch (err) {
    console.error('Failed to retrieve all events:', err);
  }
}

async function displayByOrganizer() {
  console.log("Retrieving organizer events. token", token);
  try {
    const response = await fetch(`/api/events/event/organizer`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const jsonResponse = await response.json();
      console.log('All events retrieved:', jsonResponse);
      displayEvents(jsonResponse);
    } else {
      eventsContainer.innerHTML = '<div class="no-events"><h3>No Events Found</h3><p>Make A New Event.</p></div>';
      throw new Error('Request Failed');


    }
  } catch (err) {
    console.error('Failed to retrieve all events:', err);
  }
}

// ----------------------- Event Deletion ------------------------
async function deleteEvent(eventId) {
  console.log("Attempting to delete event:", eventId);

  try {
    const response = await fetch(`/api/events/event/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Event deleted successfully on backend:", data);

      Swal.fire({
        title: 'Event Deleted!',
        text: 'The event has been successfully removed.',
        icon: 'success',
        showConfirmButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          closeModalManual();
          displayBasedOnRole();
          console.log("UI updated after successful deletion and user confirmation.");
        }
      });
    } else {
      console.error("Error deleting event from server:", response.status, data);

      // Display a SweetAlert2 for the error
      Swal.fire({
        title: 'Deletion Failed',
        text: data.message || 'An error occurred while trying to delete the event.',
        icon: 'error', // Use 'error' icon for failures
        showConfirmButton: true,
        confirmButtonText: 'OK',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

    }
  } catch (err) {
    console.error('Network or unexpected error trying to delete event:', err);

  }
}


const API_BASE_URL = 'http://localhost:4000'; // Feedback microservice

// ---------------------------- Reviews ----------------------------
const getReviews = async (eventName) => {
  console.log("Getting reviews for event:", eventName);

  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback?eventName=${encodeURIComponent(eventName)}`);

    if (!response.ok) {
      console.error("Error getting event reviews from server:", response.status);
      return;
    }

    reviews = await response.json();
    console.log("Successfully got reviews:", reviews);

   

    reviewsSection.innerHTML = ""; // clear existing content

    // Show only up to 4 most recent reviews
    reviews.forEach(review => {
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
      const reviewHTML = `
        <div class="review">
          <p>${stars}</p>
          <p>${review.message}</p>
          <hr/>
        </div>
      `;
      reviewsSection.innerHTML += reviewHTML;
    });

  } catch (err) {
    console.error('Network or unexpected error trying to get review of event:', err);
  }
};




// ---------------------------- Event Listeners ----------------------------
searchButton.addEventListener('click', function () {
  const currentSearchQuery = searchInput.value.trim();
  console.log("Search button clicked. Search query:", currentSearchQuery);
  filterEvents(currentSearchQuery);
});

// Add event listener for Enter key in search input
searchInput.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    const currentSearchQuery = searchInput.value.trim();
    filterEvents(currentSearchQuery);
  }
});

// Event Listener for seeAll
seeAll.addEventListener('click', () => {
  seeAllEvents();
});

// Add event listeners to category items in grid
categoryItems.forEach(item => {
  item.addEventListener('click', function () {
    const category = this.getAttribute('data-category');
    console.log("Category selected:", category);

    if (category === 'upcoming') {
      retrieveUpcoming();
      return;
    }
    filterEvents(category);

    document.getElementById('eventsContainer').scrollIntoView({ behavior: 'smooth' });
  });
});


createEvent.addEventListener('click', () => {
  localStorage.setItem('eventAction', 'create');

  window.location.href = 'index_create_event.html';

});

reviewBtn.addEventListener('click', () => {
  if (!reviewOpen) {
    reviewOpen = true;
    reviewsSection.style.display = 'block';
    reviewBtn.textContent = 'SEE LESS';

  }
  else {
    reviewOpen = false;
    reviewsSection.style.display = 'none';
    reviewBtn.textContent = 'SEE MORE';
  }
})




// ---------------------------- Filter and Search Functions ----------------------------
/**
 * Filters events by category and search query.
 * @param {string} currentSearchQuery - The search query to filter events.
 */
const filterEvents = async (currentSearchQuery) => {
  const searchQuery = typeof currentSearchQuery === 'string' ? currentSearchQuery.toLowerCase() : '';
  console.log("Filtering events with search query:", searchQuery);
  try {
    const response = await fetch(`/api/events/event/search/${searchQuery}`);
    if (response.ok) {
      const jsonResponse = await response.json();
      console.log('Filtered events retrieved:', jsonResponse);
      displayEvents(jsonResponse);
    } else {
      throw new Error('Request Failed');
    }
  } catch (err) {
    console.error('Failed to filter events:', err);
  }
};


// ----------------------------- Get User role front end--------------------------------------

/**
 * Display based on user role
 */
const displayBasedOnRole = () => {

  console.log("User role received:", userType);

  const roleEl = document.querySelectorAll('.user, .organizer');
  roleEl.forEach(el => el.style.display = 'none');

  if (userType === 'User') {
    console.log("User role received:", user);
    document.querySelectorAll('.user').forEach(el => el.style.display = '');
    displayRecent();
  } else if (userType === 'Organizer') {
    document.querySelectorAll('.organizer').forEach(el => el.style.display = '');
    displayByOrganizer();
  } else {
    console.error("Unknown role or not logged in");
    return;
  }
};

document.addEventListener('DOMContentLoaded', displayBasedOnRole);



