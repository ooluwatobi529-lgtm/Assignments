
/* ==================================================
   AURELIA AIR — COMPLETE JAVASCRIPT
   BOOKING SYSTEM + CINEMATIC CAROUSEL
================================================== */

"use strict";

// DOM ELEMENTS

const flightSearchForm = document.getElementById("flightSearchForm");
const fromCity = document.getElementById("fromCity");
const toCity = document.getElementById("toCity");
const departureDate = document.getElementById("departureDate");
const returnDate = document.getElementById("returnDate");
const returnDateGroup = document.getElementById("returnDateGroup");
const passengerCount = document.getElementById("passengerCount");
const cabinClass = document.getElementById("cabinClass");

const flightResults = document.getElementById("flightResults");
const resultsContainer = document.getElementById("resultsContainer");
const resultsDescription = document.getElementById("resultsDescription");

const passengerForm = document.getElementById("passengerForm");
const passengerFields = document.getElementById("passengerFields");
const selectedFlightSummary = document.getElementById("selectedFlightSummary");
const confirmationDetails = document.getElementById("confirmationDetails");
const myBookingsList = document.getElementById("myBookingsList");

const bookingModal = new bootstrap.Modal(
  document.getElementById("bookingModal")
);

const confirmationModal = new bootstrap.Modal(
  document.getElementById("confirmationModal")
);

const STORAGE_KEY = "aurelia_air_demo_bookings_v1";

let currentSearch = null;
let selectedFlight = null;
let pendingConfirmation = null;

// CITY DATA

const cities = {
  LOS: { name: "Lagos", country: "Nigeria" },
  ABV: { name: "Abuja", country: "Nigeria" },
  DXB: { name: "Dubai", country: "UAE" },
  LHR: { name: "London", country: "UK" },
  JFK: { name: "New York", country: "USA" }
};

// DEMO FARES — NOT REAL AIRLINE PRICES

const basePrices = {
  LOS: { ABV: 90, DXB: 620, LHR: 790, JFK: 1100 },
  ABV: { LOS: 90, DXB: 590, LHR: 820, JFK: 1150 },
  DXB: { LOS: 620, ABV: 590, LHR: 490, JFK: 920 },
  LHR: { LOS: 790, ABV: 820, DXB: 490, JFK: 650 },
  JFK: { LOS: 1100, ABV: 1150, DXB: 920, LHR: 650 }
};

const cabinMultipliers = {
  economy: 1,
  premium: 1.6,
  business: 2.7,
  first: 4.2
};

const cabinNames = {
  economy: "Economy",
  premium: "Premium Economy",
  business: "Business",
  first: "First Class"
};

// HELPERS

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function datePlusDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function formatDate(dateString) {
  if (!dateString) return "Not applicable";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

function showToast(message) {
  document.getElementById("toastMessage").textContent = message;

  bootstrap.Toast.getOrCreateInstance(
    document.getElementById("appToast"),
    { delay: 3500 }
  ).show();
}

function getTripType() {
  return document.querySelector('input[name="tripType"]:checked').value;
}

function getBookings() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch {
    showToast("Browser storage is unavailable. Booking was not saved.");
    return false;
  }
}

function generateReference() {
  const random = new Uint8Array(5);
  crypto.getRandomValues(random);

  return "AUR-" +
    Array.from(random, byte => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
}

// DATE SETUP

function setupDates() {
  const today = localDateString(new Date());

  departureDate.min = today;
  returnDate.min = today;

  if (!departureDate.value || departureDate.value < today) {
    departureDate.value = datePlusDays(today, 7);
  }

  if (!returnDate.value || returnDate.value < departureDate.value) {
    returnDate.value = datePlusDays(departureDate.value, 7);
  }

  returnDate.min = departureDate.value;
}

departureDate.addEventListener("change", () => {
  returnDate.min = departureDate.value;

  if (returnDate.value < departureDate.value) {
    returnDate.value = datePlusDays(departureDate.value, 7);
  }
});

// TRIP TYPE

document.querySelectorAll('input[name="tripType"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const isRoundTrip = getTripType() === "round";
    returnDateGroup.classList.toggle("d-none", !isRoundTrip);
    returnDate.required = isRoundTrip;
    returnDate.disabled = !isRoundTrip;
  });
});

// SEARCH VALIDATION

function validateSearch() {
  const today = localDateString(new Date());

  if (fromCity.value === toCity.value) {
    showToast("Departure and destination cities must be different.");
    toCity.focus();
    return false;
  }

  if (!departureDate.value || departureDate.value < today) {
    showToast("Please choose a valid future departure date.");
    departureDate.focus();
    return false;
  }

  if (getTripType() === "round") {
    if (!returnDate.value || returnDate.value < departureDate.value) {
      showToast("Return date cannot be earlier than departure date.");
      returnDate.focus();
      return false;
    }
  }

  return true;
}

// GENERATE DEMO FLIGHTS

function createDemoFlights(search) {
  const base = basePrices[search.from]?.[search.to];

  if (!base) return [];

  const multiplier = cabinMultipliers[search.cabin];
  const tripMultiplier = search.tripType === "round" ? 1.85 : 1;

  const options = [
    {
      id: "standard",
      name: "Classic Journey",
      departureTime: "08:30",
      arrivalTime: "14:45",
      duration: "6h 15m",
      stops: "1 stop",
      priceMultiplier: 1
    },
    {
      id: "comfort",
      name: "Comfort Journey",
      departureTime: "12:15",
      arrivalTime: "18:00",
      duration: "5h 45m",
      stops: "1 stop",
      priceMultiplier: 1.22
    },
    {
      id: "signature",
      name: "Signature Journey",
      departureTime: "21:00",
      arrivalTime: "04:30 +1",
      duration: "7h 30m",
      stops: "1 stop",
      priceMultiplier: 1.48
    }
  ];

  return options.map(option => ({
    ...option,
    price: Math.round(
      base *
      multiplier *
      tripMultiplier *
      search.passengers *
      option.priceMultiplier
    )
  }));
}

// FLIGHT SEARCH

flightSearchForm.addEventListener("submit", event => {
  event.preventDefault();

  setupDates();

  if (!validateSearch()) return;

  currentSearch = {
    from: fromCity.value,
    to: toCity.value,
    departure: departureDate.value,
    returnDate: getTripType() === "round" ? returnDate.value : null,
    tripType: getTripType(),
    passengers: Number(passengerCount.value),
    cabin: cabinClass.value
  };

  const flights = createDemoFlights(currentSearch);

  if (!flights.length) {
    showToast("No demo flights generated for this route.");
    return;
  }

  resultsDescription.textContent =
    `${cities[currentSearch.from].name} to ${cities[currentSearch.to].name}` +
    ` · ${formatDate(currentSearch.departure)}` +
    ` · ${currentSearch.passengers} passenger(s)` +
    ` · ${cabinNames[currentSearch.cabin]}`;

  resultsContainer.innerHTML = flights.map(flight => `
    <div class="col-lg-4 col-md-6">
      <article class="flight-result-card">

        <div class="flight-result-top">
          <span class="airline-mark">
            <i class="bi bi-airplane-engines-fill"></i>
            AURELIA AIR
          </span>

          <span class="flight-class-tag">
            ${escapeHTML(cabinNames[currentSearch.cabin])}
          </span>
        </div>

        <h5 class="fw-bold mb-4">${escapeHTML(flight.name)}</h5>

        <div class="flight-route">
          <div>
            <strong>${escapeHTML(currentSearch.from)}</strong>
            <small>${escapeHTML(flight.departureTime)}</small>
          </div>

          <div class="route-line">
            <i class="bi bi-airplane-fill"></i>
          </div>

          <div>
            <strong>${escapeHTML(currentSearch.to)}</strong>
            <small>${escapeHTML(flight.arrivalTime)}</small>
          </div>
        </div>

        <div class="flight-meta">
          <i class="bi bi-clock me-1"></i>
          ${escapeHTML(flight.duration)}
          <span class="mx-2">·</span>
          ${escapeHTML(flight.stops)}
        </div>

        <div class="flight-meta">
          <i class="bi bi-calendar3 me-1"></i>
          ${formatDate(currentSearch.departure)}
        </div>

        <hr>

        <div class="flight-price">${formatMoney(flight.price)}</div>
        <small class="text-muted">Total estimated demo fare</small>

        <button class="btn btn-gold w-100 mt-3 select-flight"
          data-flight="${escapeHTML(flight.id)}">
          Select Flight
          <i class="bi bi-arrow-right ms-2"></i>
        </button>

      </article>
    </div>
  `).join("");

  flightResults.classList.remove("d-none");

  flightResults.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

// SELECT FLIGHT

resultsContainer.addEventListener("click", event => {
  const button = event.target.closest(".select-flight");
  if (!button || !currentSearch) return;

  const flight = createDemoFlights(currentSearch)
    .find(item => item.id === button.dataset.flight);

  if (!flight) return;

  selectedFlight = { ...flight, ...currentSearch };
  openBookingModal();
});

// BOOKING MODAL

function openBookingModal() {
  if (!selectedFlight) return;

  const flight = selectedFlight;

  selectedFlightSummary.innerHTML = `
    <div class="d-flex justify-content-between flex-wrap gap-2">
      <div>
        <strong>
          ${escapeHTML(cities[flight.from].name)}
          <i class="bi bi-arrow-right mx-2"></i>
          ${escapeHTML(cities[flight.to].name)}
        </strong>

        <p class="small text-muted mb-0 mt-2">
          ${formatDate(flight.departure)}
          ${flight.returnDate ? " — " + formatDate(flight.returnDate) : ""}
          · ${escapeHTML(cabinNames[flight.cabin])}
        </p>
      </div>

      <strong class="fs-5">${formatMoney(flight.price)}</strong>
    </div>
  `;

  passengerFields.innerHTML = "";

  for (let index = 1; index <= flight.passengers; index++) {
    passengerFields.innerHTML += `
      <div class="passenger-group">
        <h5 class="passenger-heading">
          <i class="bi bi-person me-2"></i>
          Passenger ${index}
        </h5>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="firstName${index}">
              First Name
            </label>
            <input type="text" class="form-control luxury-input"
              id="firstName${index}"
              maxlength="60"
              placeholder="First name" required>
          </div>

          <div class="col-md-6">
            <label class="form-label" for="lastName${index}">
              Last Name
            </label>
            <input type="text" class="form-control luxury-input"
              id="lastName${index}"
              maxlength="60"
              placeholder="Last name" required>
          </div>

          <div class="col-md-6">
            <label class="form-label" for="gender${index}">
              Gender
            </label>
            <select class="form-select luxury-input"
              id="gender${index}" required>
              <option value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label" for="nationality${index}">
              Nationality
            </label>
            <input type="text" class="form-control luxury-input"
              id="nationality${index}"
              maxlength="60"
              placeholder="e.g. Nigerian" required>
          </div>
        </div>
      </div>
    `;
  }

  passengerForm.reset();
  bookingModal.show();
}

// CONFIRM BOOKING

passengerForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!selectedFlight) return;

  if (!passengerForm.checkValidity()) {
    passengerForm.reportValidity();
    return;
  }

  const passengers = [];

  for (let index = 1; index <= selectedFlight.passengers; index++) {
    const firstName = document.getElementById(`firstName${index}`).value.trim();
    const lastName = document.getElementById(`lastName${index}`).value.trim();
    const gender = document.getElementById(`gender${index}`).value;
    const nationality = document.getElementById(`nationality${index}`).value.trim();

    if (!firstName || !lastName || !nationality) {
      showToast("Please complete all passenger information.");
      return;
    }

    passengers.push({ firstName, lastName, gender, nationality });
  }

  const booking = {
    reference: generateReference(),
    createdAt: new Date().toISOString(),
    from: selectedFlight.from,
    to: selectedFlight.to,
    departure: selectedFlight.departure,
    returnDate: selectedFlight.returnDate,
    tripType: selectedFlight.tripType,
    cabin: selectedFlight.cabin,
    flightName: selectedFlight.name,
    departureTime: selectedFlight.departureTime,
    price: selectedFlight.price,
    passengers,
    contactEmail: document.getElementById("contactEmail").value.trim(),
    contactPhone: document.getElementById("contactPhone").value.trim(),
    status: "Demo only — not ticketed"
  };

  const bookings = getBookings();
  bookings.unshift(booking);

  if (!saveBookings(bookings)) return;

  pendingConfirmation = booking;

  const bookingElement = document.getElementById("bookingModal");

  bookingElement.addEventListener("hidden.bs.modal", () => {
    if (pendingConfirmation) {
      showConfirmation(pendingConfirmation);
      pendingConfirmation = null;
    }
  }, { once: true });

  bookingModal.hide();
});

// CONFIRMATION

function showConfirmation(booking) {
  confirmationDetails.innerHTML = `
    <div class="receipt-box">
      <p class="text-muted mb-1">DEMO BOOKING REFERENCE</p>

      <div class="receipt-reference mb-3">
        ${escapeHTML(booking.reference)}
      </div>

      <hr>

      <p><strong>Route:</strong>
        ${escapeHTML(cities[booking.from].name)}
        →
        ${escapeHTML(cities[booking.to].name)}
      </p>

      <p><strong>Departure:</strong>
        ${formatDate(booking.departure)}
      </p>

      <p><strong>Return:</strong>
        ${formatDate(booking.returnDate)}
      </p>

      <p><strong>Cabin:</strong>
        ${escapeHTML(cabinNames[booking.cabin])}
      </p>

      <p><strong>Passengers:</strong>
        ${booking.passengers.length}
      </p>

      <p><strong>Estimated total:</strong>
        ${formatMoney(booking.price)}
      </p>

      <p><strong>Status:</strong>
        ${escapeHTML(booking.status)}
      </p>
    </div>
  `;

  confirmationModal.show();
}

// MY BOOKINGS

function renderMyBookings() {
  const bookings = getBookings();

  if (!bookings.length) {
    myBookingsList.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-ticket-perforated fs-1 text-muted"></i>
        <h5 class="mt-3">No demo bookings yet</h5>
        <p class="text-muted">
          Search for a flight to create your first demo booking.
        </p>
      </div>
    `;
    return;
  }

  myBookingsList.innerHTML = bookings.map(booking => `
    <article class="booking-history-item">

      <div class="d-flex justify-content-between flex-wrap gap-2">
        <h5>
          ${escapeHTML(cities[booking.from]?.name || booking.from)}
          →
          ${escapeHTML(cities[booking.to]?.name || booking.to)}
        </h5>

        <span class="badge text-bg-warning">DEMO BOOKING</span>
      </div>

      <p><strong>Reference:</strong>
        ${escapeHTML(booking.reference)}
      </p>

      <p><strong>Departure:</strong>
        ${formatDate(booking.departure)}
      </p>

      <p><strong>Passengers:</strong>
        ${booking.passengers.length}
      </p>

      <p><strong>Estimated total:</strong>
        ${formatMoney(booking.price)}
      </p>

      <button class="btn btn-outline-danger btn-sm mt-2 delete-booking"
        data-reference="${escapeHTML(booking.reference)}">
        <i class="bi bi-trash me-1"></i>
        Delete Demo Booking
      </button>
    </article>
  `).join("");
}

document.getElementById("myBookingsModal").addEventListener(
  "show.bs.modal",
  renderMyBookings
);

myBookingsList.addEventListener("click", event => {
  const button = event.target.closest(".delete-booking");
  if (!button) return;

  const reference = button.dataset.reference;

  if (!confirm("Delete this demo booking from your browser?")) {
    return;
  }

  const updated = getBookings().filter(
    booking => booking.reference !== reference
  );

  if (saveBookings(updated)) {
    renderMyBookings();
    showToast("Demo booking deleted.");
  }
});

// DESTINATION BUTTONS

document.querySelectorAll(".book-destination").forEach(button => {
  button.addEventListener("click", () => {
    const destination = button.dataset.destination;
    toCity.value = destination;

    if (fromCity.value === destination) {
      fromCity.value = "LOS";
    }

    flightResults.classList.add("d-none");

    document.getElementById("booking").scrollIntoView({
      behavior: "smooth"
    });

    showToast(`Destination selected: ${cities[destination].name}`);
  });
});

// MOBILE NAVIGATION

document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
  link.addEventListener("click", () => {
    const menu = document.getElementById("navbarMenu");

    if (menu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });
});

// PRINT RECEIPT

document.getElementById("printReceiptBtn").addEventListener(
  "click",
  () => window.print()
);

// SCROLL REVEAL

function setupScrollReveal() {
  const elements = document.querySelectorAll(
    ".section-heading, .destination-card, .feature-item, .experience-image"
  );

  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  elements.forEach(element => {
    element.classList.add("reveal-on-scroll");
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: "0px 0px 40px 0px"
  });

  elements.forEach(element => observer.observe(element));
}

// CINEMATIC CAROUSEL

function setupCinematicCarousel() {
  const carouselElement = document.getElementById("heroCarousel");
  const slideNumber = document.getElementById("currentSlide");
  const progressFill = document.getElementById("heroProgressFill");

  if (!carouselElement || !slideNumber || !progressFill) return;

  const slides = carouselElement.querySelectorAll(".carousel-item");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const carousel = bootstrap.Carousel.getOrCreateInstance(carouselElement);

  function resetProgress() {
    progressFill.classList.remove("is-running");

    if (reducedMotion.matches) {
      progressFill.style.width = "100%";
      return;
    }

    progressFill.style.width = "";
    void progressFill.offsetWidth;
    progressFill.classList.add("is-running");
  }

  function updateSlideDisplay() {
    const activeIndex = Array.from(slides).findIndex(
      slide => slide.classList.contains("active")
    );

    slideNumber.textContent = String(activeIndex + 1).padStart(2, "0");
    resetProgress();
  }

  carouselElement.addEventListener(
    "slid.bs.carousel",
    updateSlideDisplay
  );

  carouselElement.addEventListener("mouseenter", () => {
    progressFill.style.animationPlayState = "paused";
  });

  carouselElement.addEventListener("mouseleave", () => {
    progressFill.style.animationPlayState = "running";
  });

  if (reducedMotion.matches) {
    carousel.pause();
  }

  updateSlideDisplay();
}

// INITIALIZE

document.getElementById("currentYear").textContent =
  new Date().getFullYear();

setupDates();
renderMyBookings();
setupScrollReveal();
setupCinematicCarousel();
