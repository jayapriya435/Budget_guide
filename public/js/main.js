/**
 * PocketSmart AI - Client Logic & Loading Animation (Phase 15.2)
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("PocketSmart AI Client Initialized.");

  const overlay = document.getElementById("ai-loading-overlay");
  const stepText = document.getElementById("loading-step-text");
  const progressBar = document.getElementById("loading-bar-fill");

  if (!overlay || !stepText || !progressBar) return;

  const steps = [
    { text: "Analyzing your budget & requirements...", width: "25%" },
    { text: "Optimizing room & category budget allocations...", width: "50%" },
    { text: "Curating verified products & platform deals...", width: "75%" },
    { text: "Finalizing your personalized plan...", width: "95%" }
  ];

  // Attach submit listener to all recommendation forms
  const forms = document.querySelectorAll('form[action*="recommendations"]');
  forms.forEach(form => {
    form.addEventListener("submit", () => {
      overlay.classList.add("active");
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep < steps.length) {
          stepText.textContent = steps[currentStep].text;
          progressBar.style.width = steps[currentStep].width;
        } else {
          clearInterval(interval);
        }
      }, 1200);
    });
  });
});
