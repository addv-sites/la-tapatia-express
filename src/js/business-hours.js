/**
 * Calcula estado abierto/cerrado y horario semanal a partir de los campos
 * hours_<dia>_open / hours_<dia>_close de la hoja CONFIG (HH:MM, 24h).
 * Contrato completo: docs/apps-script-contract.md
 */
(function () {
  const TIMEZONE = 'America/Mexico_City';
  const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const WEEKDAY_MAP = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };
  const DAY_LABELS = { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' };

  function nowInBusinessTz_() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date());
    const map = {};
    parts.forEach((p) => { map[p.type] = p.value; });
    return { dayKey: WEEKDAY_MAP[map.weekday], minutes: Number(map.hour) * 60 + Number(map.minute) };
  }

  function toMinutes_(hhmm) {
    if (!hhmm) return null;
    const [h, m] = String(hhmm).split(':');
    return Number(h) * 60 + Number(m || 0);
  }

  function formatHHMM_(hhmm) {
    if (!hhmm) return '';
    const [h, m] = String(hhmm).split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return hour12 + ':' + (m || '00') + ' ' + suffix;
  }

  function dayHours_(config, dayKey) {
    const open = config['hours_' + dayKey + '_open'];
    const close = config['hours_' + dayKey + '_close'];
    if (!open || !close) return null;
    return { open, close };
  }

  /** { isOpen: bool, label: string } — label listo para mostrar al usuario. */
  function getStatus(config) {
    const now = nowInBusinessTz_();
    const today = dayHours_(config, now.dayKey);
    if (today) {
      const openMin = toMinutes_(today.open);
      const closeMin = toMinutes_(today.close);
      if (now.minutes >= openMin && now.minutes < closeMin) {
        return { isOpen: true, label: 'Abierto para pedidos' };
      }
    }
    const startIdx = DAY_ORDER.indexOf(now.dayKey);
    for (let i = 0; i < 7; i++) {
      const key = DAY_ORDER[(startIdx + i) % 7];
      const h = dayHours_(config, key);
      if (!h) continue;
      if (i === 0 && now.minutes < toMinutes_(h.open)) {
        return { isOpen: false, label: 'Cerrado — abre hoy a las ' + formatHHMM_(h.open) };
      }
      if (i > 0) {
        const when = i === 1 ? 'mañana' : DAY_LABELS[key].toLowerCase();
        return { isOpen: false, label: 'Cerrado — abre ' + when + ' a las ' + formatHHMM_(h.open) };
      }
    }
    return { isOpen: false, label: 'Cerrado' };
  }

  /** Array Lunes→Domingo: { dayKey, dayLabel, display, isToday }. */
  function getWeekSchedule(config) {
    const now = nowInBusinessTz_();
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return order.map((key) => {
      const h = dayHours_(config, key);
      return {
        dayKey: key,
        dayLabel: DAY_LABELS[key],
        display: h ? (formatHHMM_(h.open) + ' – ' + formatHHMM_(h.close)) : 'Cerrado',
        isToday: key === now.dayKey
      };
    });
  }

  window.LTA_HOURS = { getStatus, getWeekSchedule };
})();
