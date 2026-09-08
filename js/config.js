/**
 * MissedCallStack — site config
 *
 * AFFILIATE_LINK: Replace PLACEHOLDER with the real HighLevel affiliate ref.
 * Pattern: https://www.gohighlevel.com/?fp_ref=YOUR_REF
 * Until then, the link goes to the public HighLevel homepage (no commission tracking).
 */
window.MCS_CONFIG = Object.freeze({
  siteName: 'MissedCallStack',
  siteTagline: 'Home-service marketing stack notes (Jobber + HighLevel)',
  AFFILIATE_LINK: 'https://www.gohighlevel.com/?fp_ref=PLACEHOLDER',
  // When you have the real ref, set AFFILIATE_LINK to e.g.:
  // 'https://www.gohighlevel.com/?fp_ref=YOUR_REF'
  ghlPricingStarter: 97,
  ghlPricingUnlimited: 297,
  ghlTrialDays: 14,
  ghlPricingUrl: 'https://www.gohighlevel.com/pricing/',
  jobberHelpUrl:
    'https://help.gohighlevel.com/support/solutions/articles/155000005429-how-to-integrate-jobber-with-highlevel',
  jobberPostUrl:
    'https://www.gohighlevel.com/post/highlevel-jobber-smarter-service-businesses-connected',
  emailCaptureNote:
    'Email capture stores locally for MVP. Wire Kit or Formspree when ready — no paid services in this build.',
  analyticsEndpoint: null, // set to a free webhook URL later if available
});
