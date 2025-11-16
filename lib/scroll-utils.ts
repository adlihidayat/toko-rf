// lib/scroll-utils.ts
export const scrollToSection = (sectionId: string) => {
  // Try multiple times to find the section
  let attempts = 0;
  const maxAttempts = 5;

  const tryScroll = () => {
    const section = document.getElementById(sectionId);

    if (section) {
      // Scroll to section smoothly
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      attempts++;
      if (attempts < maxAttempts) {
        // Retry after a short delay
        setTimeout(tryScroll, 200);
      } else {
        console.warn(`Section with id="${sectionId}" not found after multiple attempts`);
      }
    }
  };

  // Start trying to scroll
  tryScroll();
};