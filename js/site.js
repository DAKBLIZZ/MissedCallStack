/**
 * MissedCallStack — shared UI: nav toggle, affiliate CTAs, email capture
 */
(function () {
  'use strict';

  function affiliateHref() {
    var cfg = window.MCS_CONFIG || {};
    return cfg.AFFILIATE_LINK || 'https://www.gohighlevel.com/';
  }

  function wireAffiliateLinks() {
    document.querySelectorAll('[data-affiliate]').forEach(function (el) {
      el.setAttribute('href', affiliateHref());
      el.setAttribute('rel', 'sponsored noopener noreferrer');
      el.setAttribute('target', '_blank');
      el.addEventListener('click', function () {
        if (window.MCSAnalytics) {
          window.MCSAnalytics.track('cta_affiliate_click', {
            location: el.getAttribute('data-affiliate') || 'unknown',
          });
        }
      });
    });
  }

  function wireNav() {
    var btn = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  }

  function wireEmailForms() {
    document.querySelectorAll('[data-email-capture]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var err = form.querySelector('.form-error');
        var ok = form.querySelector('.form-success');
        var email = input ? input.value.trim() : '';
        if (!isValidEmail(email)) {
          if (err) {
            err.textContent = 'Enter a valid email address.';
            err.classList.add('is-visible');
          }
          if (input) input.focus();
          return;
        }
        if (err) err.classList.remove('is-visible');
        var subs = [];
        try {
          subs = JSON.parse(localStorage.getItem('mcs_email_subs') || '[]');
        } catch (ex) {}
        subs.push({
          email: email,
          source: form.getAttribute('data-email-capture') || 'unknown',
          path: location.pathname,
          ts: new Date().toISOString(),
        });
        try {
          localStorage.setItem('mcs_email_subs', JSON.stringify(subs));
        } catch (ex) {}
        if (window.MCSAnalytics) {
          window.MCSAnalytics.track('email_submit', {
            source: form.getAttribute('data-email-capture') || 'unknown',
          });
        }
        if (ok) {
          ok.classList.add('is-visible');
          ok.innerHTML =
            'Saved on this device. Check your downloads/notes — we will wire Kit/Formspree when ready. ' +
            '<a href="mailto:' +
            encodeURIComponent(email) +
            '?subject=' +
            encodeURIComponent('MissedCallStack — 7-day missed-call SOP request') +
            '&body=' +
            encodeURIComponent(
              'Hi,\n\nPlease send the 7-day missed-call SOP.\n\nMy shop email: ' +
                email +
                '\n\n(Optional: trade / city)\n'
            ) +
            '">Or email yourself a reminder (mailto)</a>.';
        }
        form.querySelectorAll('input, button[type="submit"]').forEach(function (el) {
          if (el.type !== 'hidden') el.disabled = true;
        });
      });
    });
  }

  function setYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireNav();
    wireAffiliateLinks();
    wireEmailForms();
    setYear();
  });
})();
