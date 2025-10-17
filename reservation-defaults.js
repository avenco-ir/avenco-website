// reservation-defaults.js
(function () {
  // --- selectors (wait until DOM ready) ---
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    const yearSelect = document.getElementById('res-year');
    const monthSelect = document.getElementById('res-month');
    const daySelect = document.getElementById('res-day');
    const hourSelect = document.getElementById('res-hour');
    const minuteSelect = document.getElementById('res-minute');
    const openBtns = document.querySelectorAll('.open-reservation-modal-btn');

    if (!yearSelect || !monthSelect || !daySelect || !hourSelect || !minuteSelect) return;

    // --- Tehran time helpers ---
    const getTehranNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));

    const getNextSlotInTehran = () => {
      const now = getTehranNow();
      let dt = new Date(now.getTime() + 60 * 60 * 1000); // +1h

      // round minutes to next [0,15,30,45]
      const m = dt.getMinutes();
      const quarters = [0, 15, 30, 45];
      let nextMin = quarters.find(q => q >= m);
      if (nextMin === undefined) {
        dt.setHours(dt.getHours() + 1);
        nextMin = 0;
      }
      dt.setMinutes(nextMin, 0, 0);

      // business window 08:00..22:45 (inclusive on 22:45 only as 22:00/22:15/22:30/22:45 allowed)
      const h = dt.getHours();
      if (h < 8) dt.setHours(8, 0, 0, 0);
      if (h > 22 || (h === 22 && dt.getMinutes() > 45)) {
        dt.setDate(dt.getDate() + 1);
        dt.setHours(8, 0, 0, 0);
      }
      return dt;
    };

    // ensure option exists
    const ensureOption = (select, value, label) => {
      const exists = Array.from(select.options).some(o => o.value == value);
      if (!exists) {
        const opt = document.createElement('option');
        opt.value = String(value);
        opt.textContent = label ?? String(value);
        select.appendChild(opt);
      }
    };

    // set defaults
    const setDefaultReservationToNextHour = () => {
      const target = getNextSlotInTehran();

      // jalali parts in latin digits
      const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
        year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Tehran'
      }).formatToParts(target);

      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;

      if (!y || !m || !d) return;

      // make sure date options include needed values
      ensureOption(yearSelect, y, y);
      ensureOption(monthSelect, Number(m), Number(m));
      ensureOption(daySelect, Number(d), Number(d));

      yearSelect.value = String(y);
      monthSelect.value = String(Number(m));
      daySelect.value = String(Number(d));

      const hh = String(target.getHours()).padStart(2, '0');
      const mm = String(target.getMinutes()).padStart(2, '0');

      // hours/minutes might already be populated by page script
      if (Array.from(hourSelect.options).some(o => o.value === hh)) hourSelect.value = hh;
      if (Array.from(minuteSelect.options).some(o => o.value === mm)) minuteSelect.value = mm;
    };

    // run once after page scripts populate selects
    // slight delay to ensure existing populateDates/populateTimes finished
    setTimeout(setDefaultReservationToNextHour, 0);

    // refresh defaults every time modal opens
    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // run after page's own click handler (which resets the form)
        setTimeout(setDefaultReservationToNextHour, 0);
      });
    });
  });
})();
