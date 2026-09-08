/**
 * MissedCallStack — Missed-Call Revenue & Stack Cost Calculator
 * All outputs are estimates based on user assumptions — not guarantees.
 */
(function () {
  'use strict';

  var RECOVERY_PRESETS = {
    conservative: 0.15,
    default: 0.28,
    optimistic: 0.42,
  };

  var ANSWERING_DEFAULTS = {
    none: 0,
    voicemail: 0,
    answering: 350, // typical small-shop answering service ballpark; user can override via note
  };

  function money(n) {
    if (!isFinite(n)) return '—';
    return (
      '$' +
      Math.round(n).toLocaleString('en-US', {
        maximumFractionDigits: 0,
      })
    );
  }

  function pct(n) {
    return (n * 100).toFixed(0) + '%';
  }

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(el.value);
    return isFinite(v) ? v : 0;
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  var started = false;

  function markStart() {
    if (started) return;
    started = true;
    if (window.MCSAnalytics) window.MCSAnalytics.track('calculator_start', {});
  }

  function compute() {
    var calls = clamp(num('calls'), 0, 100000);
    var missRate = clamp(num('miss-rate'), 0, 100) / 100;
    var ticket = clamp(num('ticket'), 0, 1000000);
    var bookingLive = clamp(num('booking-live'), 0, 100) / 100;
    var recoveryMode = val('recovery-mode') || 'default';
    var recoveryCustom = clamp(num('recovery-custom'), 0, 100) / 100;
    var recovery =
      recoveryMode === 'custom' ? recoveryCustom : RECOVERY_PRESETS[recoveryMode] || RECOVERY_PRESETS.default;
    var coverage = val('coverage') || 'none';
    var answeringCost = coverage === 'answering' ? clamp(num('answering-cost'), 0, 50000) : 0;
    var afterHours = clamp(num('after-hours'), 0, 100) / 100;
    var smsVol = clamp(num('sms-vol'), 0, 1000000);
    var trade = val('trade') || 'hvac';
    var crm = val('crm') || 'jobber';
    var ghlPlan = val('ghl-plan') || '97';

    var missed = calls * missRate;
    // Revenue at risk: missed calls that would have booked if live, at avg ticket
    var monthlyAtRisk = missed * bookingLive * ticket;
    var annualAtRisk = monthlyAtRisk * 12;

    // Recovered with text-back: apply recovery rate to the at-risk pool
    // After-hours share weights importance of automated recovery (informational)
    var afterHoursWeight = 0.85 + afterHours * 0.15; // slight uplift emphasis when more AH
    var monthlyRecovered = monthlyAtRisk * recovery * afterHoursWeight;
    // Cap recovered so it never exceeds at-risk
    monthlyRecovered = Math.min(monthlyRecovered, monthlyAtRisk);
    var annualRecovered = monthlyRecovered * 12;

    var ghlBase = ghlPlan === '297' ? 297 : 97;
    // SMS band estimate (US A2P-ish ballpark; labeled as estimate)
    // ~$0.0075–$0.02 per segment; use mid band $0.012 for outbound recovery texts
    var smsLow = smsVol * 0.0075;
    var smsMid = smsVol * 0.012;
    var smsHigh = smsVol * 0.02;
    // If user left SMS blank, estimate from missed calls * ~2 msgs
    if (smsVol <= 0) {
      var estMsgs = missed * 2;
      smsLow = estMsgs * 0.0075;
      smsMid = estMsgs * 0.012;
      smsHigh = estMsgs * 0.02;
    }

    var monthlyStackGHL = ghlBase + smsMid;
    var breakEvenJobs = ticket > 0 ? monthlyStackGHL / ticket : null;
    var breakEvenJobs97 = ticket > 0 ? (97 + smsMid) / ticket : null;
    var breakEvenJobs297 = ticket > 0 ? (297 + smsMid) / ticket : null;

    // Side-by-side: answering service vs GHL (assumptions labeled)
    // Answering: keep paying answeringCost; recover some share via live answer
    // Heuristic: answering recovers ~40–60% of missed that reach them; use 50% of miss pool * booking
    var answeringRecoveryRate = 0.5;
    var answeringRecovered = coverage === 'answering'
      ? missed * answeringRecoveryRate * bookingLive * ticket
      : 0;
    var answeringNet = answeringRecovered - answeringCost;
    var ghlNet = monthlyRecovered - monthlyStackGHL;

    return {
      trade: trade,
      crm: crm,
      calls: calls,
      missRate: missRate,
      missed: missed,
      ticket: ticket,
      bookingLive: bookingLive,
      recovery: recovery,
      recoveryMode: recoveryMode,
      afterHours: afterHours,
      coverage: coverage,
      answeringCost: answeringCost,
      ghlBase: ghlBase,
      smsLow: smsLow,
      smsMid: smsMid,
      smsHigh: smsHigh,
      monthlyAtRisk: monthlyAtRisk,
      annualAtRisk: annualAtRisk,
      monthlyRecovered: monthlyRecovered,
      annualRecovered: annualRecovered,
      monthlyStackGHL: monthlyStackGHL,
      breakEvenJobs: breakEvenJobs,
      breakEvenJobs97: breakEvenJobs97,
      breakEvenJobs297: breakEvenJobs297,
      answeringRecovered: answeringRecovered,
      answeringNet: answeringNet,
      ghlNet: ghlNet,
    };
  }

  function crmLabel(crm) {
    var map = {
      jobber: 'Jobber',
      hcp: 'Housecall Pro',
      servicetitan: 'ServiceTitan',
      none: 'no field CRM yet',
      other: 'your current field CRM',
    };
    return map[crm] || crm;
  }

  function tradeLabel(t) {
    var map = {
      hvac: 'HVAC',
      plumbing: 'plumbing',
      electrical: 'electrical',
      multi: 'multi-trade home services',
      other: 'home services',
    };
    return map[t] || t;
  }

  function recommendation(r) {
    var keep =
      r.crm === 'none'
        ? 'If you are still scheduling on paper or a generic calendar, pick a field CRM (Jobber is a common fit for solo-to-mid HVAC/plumbing shops) for jobs, invoices, and tech routes.'
        : 'Keep ' +
          crmLabel(r.crm) +
          ' as your operations layer (dispatch, job costing, invoices, tech app). Do not rip-and-replace it for marketing.';
    var add =
      'Add HighLevel (GHL) as the marketing / SMS / calendar / missed-call recovery layer. Use the official Jobber↔HighLevel client sync for contacts when on Jobber; for Housecall Pro or ServiceTitan, plan Zapier/Make or CSV sync until a native path exists.';
    var plan =
      r.ghlBase === 297
        ? 'Unlimited ($297/mo) makes sense if you need more than 3 sub-accounts or agency-style usage. Most single shops start on Starter ($97/mo).'
        : 'Starter ($97/mo) is usually enough for a single shop (up to 3 sub-accounts). Confirm current pricing on HighLevel’s site.';
    return { keep: keep, add: add, plan: plan };
  }

  function render(r) {
    var box = document.getElementById('results');
    if (!box) return;
    box.classList.add('is-visible');

    document.getElementById('out-at-risk-mo').textContent = money(r.monthlyAtRisk);
    document.getElementById('out-at-risk-yr').textContent = money(r.annualAtRisk);
    document.getElementById('out-recovered-mo').textContent = money(r.monthlyRecovered);
    document.getElementById('out-recovered-yr').textContent = money(r.annualRecovered);
    document.getElementById('out-be-97').textContent =
      r.breakEvenJobs97 != null ? r.breakEvenJobs97.toFixed(2) + ' jobs/mo' : '—';
    document.getElementById('out-be-297').textContent =
      r.breakEvenJobs297 != null ? r.breakEvenJobs297.toFixed(2) + ' jobs/mo' : '—';
    document.getElementById('out-sms-band').textContent =
      money(r.smsLow) + ' – ' + money(r.smsHigh) + '/mo (est.)';
    document.getElementById('out-missed').textContent =
      Math.round(r.missed).toLocaleString('en-US') + ' missed calls/mo';

    var rec = recommendation(r);
    document.getElementById('rec-keep').textContent = rec.keep;
    document.getElementById('rec-add').textContent = rec.add;
    document.getElementById('rec-plan').textContent = rec.plan;
    document.getElementById('rec-crm').textContent = crmLabel(r.crm);
    document.getElementById('rec-trade').textContent = tradeLabel(r.trade);

    document.getElementById('cmp-ans-cost').textContent = money(r.answeringCost);
    document.getElementById('cmp-ans-rec').textContent = money(r.answeringRecovered);
    document.getElementById('cmp-ans-net').textContent = money(r.answeringNet);
    document.getElementById('cmp-ghl-cost').textContent = money(r.monthlyStackGHL);
    document.getElementById('cmp-ghl-rec').textContent = money(r.monthlyRecovered);
    document.getElementById('cmp-ghl-net').textContent = money(r.ghlNet);

    document.getElementById('assumptions-line').textContent =
      'Estimates only — not guarantees. Assumed live booking rate ' +
      pct(r.bookingLive) +
      ', text-back recovery ' +
      pct(r.recovery) +
      ' (' +
      r.recoveryMode +
      '), avg ticket ' +
      money(r.ticket) +
      ', miss rate ' +
      pct(r.missRate) +
      '. See Methodology.';

    box.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.MCSAnalytics) {
      window.MCSAnalytics.track('calculator_complete', {
        trade: r.trade,
        crm: r.crm,
        monthlyAtRisk: Math.round(r.monthlyAtRisk),
        monthlyRecovered: Math.round(r.monthlyRecovered),
      });
    }

    try {
      sessionStorage.setItem('mcs_last_calc', JSON.stringify(r));
    } catch (e) {}
  }

  function downloadSummary() {
    var raw;
    try {
      raw = sessionStorage.getItem('mcs_last_calc');
    } catch (e) {
      raw = null;
    }
    if (!raw) {
      alert('Run the calculator first.');
      return;
    }
    var r = JSON.parse(raw);
    var rec = recommendation(r);
    var lines = [
      'MissedCallStack — Calculator Results Summary',
      'Generated: ' + new Date().toISOString(),
      '',
      '*** ESTIMATES ONLY — NOT GUARANTEES OR INCOME CLAIMS ***',
      'Affiliate disclosure: MissedCallStack may earn a commission if you subscribe via our HighLevel links.',
      '',
      'Inputs',
      '------',
      'Trade: ' + tradeLabel(r.trade),
      'Field CRM: ' + crmLabel(r.crm),
      'Inbound calls/mo: ' + r.calls,
      'Miss rate: ' + pct(r.missRate),
      'Missed calls/mo: ' + Math.round(r.missed),
      'Avg ticket: ' + money(r.ticket),
      'Live booking rate: ' + pct(r.bookingLive),
      'Text-back recovery: ' + pct(r.recovery) + ' (' + r.recoveryMode + ')',
      'After-hours share: ' + pct(r.afterHours),
      'Phone coverage: ' + r.coverage,
      'Answering service cost (if any): ' + money(r.answeringCost),
      '',
      'Outputs (estimates)',
      '-------------------',
      'Monthly revenue at risk: ' + money(r.monthlyAtRisk),
      'Annual revenue at risk: ' + money(r.annualAtRisk),
      'Monthly recovered (text-back assumptions): ' + money(r.monthlyRecovered),
      'Annual recovered (text-back assumptions): ' + money(r.annualRecovered),
      'GHL plan used: $' + r.ghlBase + '/mo',
      'SMS band estimate: ' + money(r.smsLow) + ' – ' + money(r.smsHigh) + '/mo',
      'Break-even jobs @ $97 + SMS mid: ' +
        (r.breakEvenJobs97 != null ? r.breakEvenJobs97.toFixed(2) : '—'),
      'Break-even jobs @ $297 + SMS mid: ' +
        (r.breakEvenJobs297 != null ? r.breakEvenJobs297.toFixed(2) : '—'),
      '',
      'Stack recommendation',
      '--------------------',
      rec.keep,
      rec.add,
      rec.plan,
      '',
      'Answering service vs GHL (labeled assumptions)',
      '----------------------------------------------',
      'Answering monthly cost: ' + money(r.answeringCost),
      'Answering recovered (est. 50% of miss pool × booking × ticket): ' + money(r.answeringRecovered),
      'Answering net (est.): ' + money(r.answeringNet),
      'GHL monthly cost (plan + SMS mid): ' + money(r.monthlyStackGHL),
      'GHL recovered (est.): ' + money(r.monthlyRecovered),
      'GHL net (est.): ' + money(r.ghlNet),
      '',
      'Methodology: /methodology/',
      'HighLevel pricing: https://www.gohighlevel.com/pricing/',
    ];
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'missedcallstack-results.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function printResults() {
    window.print();
  }

  function toggleAnswering() {
    var cov = val('coverage');
    var wrap = document.getElementById('answering-cost-wrap');
    if (wrap) wrap.style.display = cov === 'answering' ? 'block' : 'none';
  }

  function toggleRecoveryCustom() {
    var mode = val('recovery-mode');
    var wrap = document.getElementById('recovery-custom-wrap');
    if (wrap) wrap.style.display = mode === 'custom' ? 'block' : 'none';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('calc-form');
    if (!form) return;

    form.addEventListener('input', markStart);
    form.addEventListener('change', markStart);

    document.getElementById('coverage').addEventListener('change', toggleAnswering);
    document.getElementById('recovery-mode').addEventListener('change', toggleRecoveryCustom);
    toggleAnswering();
    toggleRecoveryCustom();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      markStart();
      render(compute());
    });

    var dl = document.getElementById('btn-download');
    if (dl) dl.addEventListener('click', downloadSummary);
    var pr = document.getElementById('btn-print');
    if (pr) pr.addEventListener('click', printResults);
  });
})();
