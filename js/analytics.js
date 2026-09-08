/**
 * MissedCallStack — first-party analytics (MVP)
 * Events: pageview, calculator_start, calculator_complete, cta_affiliate_click, email_submit
 * Persists to localStorage; optional POST to free endpoint; downloadable JSON export.
 */
(function () {
  'use strict';
  var STORAGE_KEY = 'mcs_analytics_events';
  var MAX_EVENTS = 500;

  function uid() {
    return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function save(events) {
    try {
      if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) { /* quota */ }
  }

  function track(name, props) {
    var evt = {
      id: uid(),
      name: name,
      props: props || {},
      path: location.pathname,
      ts: new Date().toISOString(),
    };
    var events = load();
    events.push(evt);
    save(events);

    var endpoint = (window.MCS_CONFIG && window.MCS_CONFIG.analyticsEndpoint) || null;
    if (endpoint) {
      try {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt),
          mode: 'cors',
          keepalive: true,
        }).catch(function () {});
      } catch (e) {}
    }
    return evt;
  }

  function exportJSON() {
    var blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mcs-analytics-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function summary() {
    var events = load();
    var counts = {};
    events.forEach(function (e) {
      counts[e.name] = (counts[e.name] || 0) + 1;
    });
    return { total: events.length, counts: counts, events: events };
  }

  window.MCSAnalytics = {
    track: track,
    exportJSON: exportJSON,
    summary: summary,
    load: load,
  };

  // Auto pageview
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      track('pageview', { title: document.title });
    });
  } else {
    track('pageview', { title: document.title });
  }
})();
