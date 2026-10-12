/**
 * When true, refreshing the browser (F5, Ctrl+R or the reload button) on any page takes the visitor to the
 * home page, scrolled to the top. Normal links, the back button and typed or bookmarked URLs are unaffected.
 * Set to false to make a refresh stay on the current page.
 */
export const REFRESH_GOES_HOME = true;

/**
 * The brand intro animation (name fills the screen, shrinks, then flies into the header logo).
 * true: plays once per browser tab session. false: plays on every page load and refresh.
 * It is always skipped for visitors who prefer reduced motion.
 */
export const INTRO_ONCE_PER_SESSION = false;
