document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to create initials from an email address
  function getInitialsFromEmail(email) {
    const local = email.split("@")[0];
    const parts = local.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (parts.length === 0) return email.charAt(0).toUpperCase();
    if (parts.length === 1) return (parts[0].charAt(0) || '').toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message and activity options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '';

      // Re-add placeholder option for activity select
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = '-- Select an activity --';
      activitySelect.appendChild(placeholderOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';

        const participantsTitle = document.createElement('h5');
        participantsTitle.textContent = 'Participants';
        participantsSection.appendChild(participantsTitle);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const list = document.createElement('ul');
          list.className = 'participant-list';

          details.participants.forEach(email => {
            const li = document.createElement('li');
            li.className = 'participant';
            li.dataset.email = email;

            const avatar = document.createElement('span');
            avatar.className = 'avatar';
            avatar.textContent = getInitialsFromEmail(email);

            const label = document.createElement('span');
            label.className = 'participant-email';
            label.textContent = email;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-participant';
            removeBtn.type = 'button';
            removeBtn.title = `Remove ${email}`;
            removeBtn.setAttribute('aria-label', `Remove ${email}`);
            removeBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;

            // Remove participant handler
            removeBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${email} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE', cache: 'no-store' }
                );
                const data = await res.json();
                if (res.ok) {
                  messageDiv.textContent = data.message;
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  // Refresh view
                  fetchActivities();
                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                } else {
                  messageDiv.textContent = data.detail || 'An error occurred';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                console.error('Error removing participant:', err);
              }
            });

            li.appendChild(avatar);
            li.appendChild(label);
            li.appendChild(removeBtn);
            list.appendChild(li);
          });

          participantsSection.appendChild(list);
        } else {
          const empty = document.createElement('p');
          empty.className = 'info';
          empty.textContent = 'No participants yet — be the first!';
          participantsSection.appendChild(empty);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: 'no-store'
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants and availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
