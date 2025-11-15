// lib/scroll-utils.ts
export const scrollToFooter = () => {
  // Scroll to bottom of page
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth',
  });
};