
/* ============================================
   YOUTUBE CLONE — INTERACTIONS
============================================ */

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-btn");
const videoCards = document.querySelectorAll(".video-card");
const noResults = document.getElementById("noResults");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");

let selectedCategory = "All";
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Search and filter videos
function filterVideos() {
  const search = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  videoCards.forEach((card) => {
    const title = card.dataset.title.toLowerCase();
    const categories = card.dataset.category.split(" ");
    const cardText = card.innerText.toLowerCase();

    const matchesSearch =
      title.includes(search) || cardText.includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      categories.some((category) =>
        category.toLowerCase() === selectedCategory.toLowerCase()
      );

    const visible = matchesSearch && matchesCategory;
    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  noResults.hidden = visibleCount !== 0;
}

// Search form
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  filterVideos();
});

searchInput.addEventListener("input", filterVideos);

// Category buttons
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) =>
      btn.classList.remove("selected")
    );

    button.classList.add("selected");
    selectedCategory = button.dataset.category;
    filterVideos();
  });
});

// Scroll categories
document.getElementById("categoryNext").addEventListener("click", () => {
  document.getElementById("categoryBar").scrollBy({
    left: 300,
    behavior: "smooth"
  });
});

// Toggle sidebar
document.getElementById("menuBtn").addEventListener("click", () => {
  sidebar.classList.toggle("expanded");
});

// Sidebar interactions
document.querySelectorAll(".sidebar-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();

    document.querySelectorAll(".sidebar-item").forEach((link) =>
      link.classList.remove("active")
    );

    item.classList.add("active");

    const section = item.dataset.sidebar;

    if (section === "Home") {
      searchInput.value = "";
      selectedCategory = "All";
      categoryButtons.forEach((button) => {
        button.classList.toggle(
          "selected",
          button.dataset.category === "All"
        );
      });
      filterVideos();
    } else {
      showToast(`${section} page is a demo feature.`);
    }
  });
});

// Voice search
document.getElementById("micBtn").addEventListener("click", () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast("Voice search is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    searchInput.value = event.results[0][0].transcript;
    filterVideos();
  };

  recognition.onerror = () => {
    showToast("Could not recognize speech. Please try again.");
  };

  try {
    recognition.start();
    showToast("Listening...");
  } catch {
    showToast("Microphone could not be started.");
  }
});

// Demo buttons
document.getElementById("createBtn").addEventListener("click", () => {
  showToast("Create video feature is a demo.");
});

document.getElementById("notificationBtn").addEventListener("click", () => {
  showToast("You have 9+ demo notifications.");
});

document.getElementById("profileBtn").addEventListener("click", () => {
  showToast("Profile menu is a demo feature.");
});

document.querySelectorAll(".more-btn").forEach((button) => {
  button.addEventListener("click", () => {
    showToast("Video options menu is a demo feature.");
  });
});

// Initial display
filterVideos();
