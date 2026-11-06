    "use strict";
    const KEYS = { tasks: "academic-followup.tasks.v1", decisions: "academic-followup.decisions.v1", relevance: "academic-followup.relevance.v1", readEmails: "academic-outlook-read.v1" };
    const DATA_SOURCE = "data/comunicaciones_demo_v01.json";
    const DEMO_REFERENCE_DATE = "2026-11-04";
    const $ = selector => document.querySelector(selector);
    const orgiLauncher = $("#orgi-launcher"), orgiLauncherSlot = document.createElement("span");
    orgiLauncherSlot.id = "orgi-launcher-slot";
    orgiLauncherSlot.className = "orgi-launcher-slot";
    orgiLauncher.setAttribute("data-tooltip", "Orgi");
    orgiLauncher.before(orgiLauncherSlot);
    orgiLauncherSlot.append(orgiLauncher);
    const list = $("#mail-list"), detailDialog = $("#detail-dialog"), detailContent = $("#detail-content");
    const search = $("#global-search"), categoryFilter = $("#category-filter"), reviewFilter = $("#review-filter"), relevanceFilter = $("#relevance-filter");
    const appError = $("#app-error"), taskDialog = $("#task-dialog"), taskForm = $("#task-form");
    const CATEGORY_META = {
      academico: { label: "Académicos", icon: "book-20-regular", description: "Avisos y actividades relacionadas con cursos." },
      institucional: { label: "Institucionales", icon: "building-20-regular", description: "Comunicaciones generales de la institución." },
      bienestar: { label: "Bienestar", icon: "plant-grass-20-regular", description: "Información de bienestar y acompañamiento." },
      oportunidad: { label: "Oportunidades", icon: "sparkle-20-regular", description: "Convocatorias e invitaciones para explorar." },
      administrativo: { label: "Administrativos", icon: "clipboard-20-regular", description: "Comunicaciones sobre gestiones administrativas." }
    };
    const UNCLASSIFIED_CATEGORY = "__unclassified__";
    let emails = [], tasks = [], decisions = {}, relevanceIds = new Set(), selectedId = null, newestFirst = true;
    let readEmailIds = new Set(), selectedOutlookMailId = null, outlookSearchQuery = "", demoReferenceDate = DEMO_REFERENCE_DATE;
    let activeCategory = "", editingTaskId = null, taskSourceId = null;
    const text = (value, fallback = "No indicado") => typeof value === "string" && value.trim() ? value : fallback;
    const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
    const label = value => String(value ?? "").replaceAll("_", " ").replace(/^./, c => c.toLocaleUpperCase("es"));
    const categoryName = value => CATEGORY_META[value]?.label ?? "Sin clasificar";
    const node = (tag, className, value) => { const el = document.createElement(tag); if (className) el.className = className; if (value !== undefined) el.textContent = value; return el; };
    const icon = name => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      svg.classList.add("fluent-icon"); svg.setAttribute("aria-hidden", "true");
      use.setAttribute("href", `icons/fluent.svg#${name}`); svg.append(use);
      return svg;
    };
    function parseISODate(value) {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
      const [year, month, day] = value.split("-").map(Number), date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
    }
    function dateOffset(dateValue, referenceValue = demoReferenceDate) {
      const date = parseISODate(dateValue), reference = parseISODate(referenceValue);
      return date && reference ? Math.round((reference.getTime() - date.getTime()) / 86400000) : null;
    }
    function formatMailDate(mail) {
      const observed = mail.observado ?? {}, date = parseISODate(observed.fecha_recibido);
      if (!date) return "Fecha no indicada";
      const offset = dateOffset(observed.fecha_recibido);
      const dateLabel = offset === 0 ? "Hoy" : offset === 1 ? "Ayer" : new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
      const time = typeof observed.hora_recibido === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(observed.hora_recibido) ? observed.hora_recibido : "";
      return time ? `${dateLabel} · ${time}` : dateLabel;
    }
    function formatMailGroup(mail) {
      const date = mail.observado?.fecha_recibido, offset = dateOffset(date);
      if (offset === 0) return "Hoy";
      if (offset === 1) return "Ayer";
      const parsed = parseISODate(date);
      return parsed ? new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parsed) : "Fecha no indicada";
    }
    function previewFor(mail) {
      const observed = mail.observado ?? {};
      const value = observed.vista_previa ?? observed.preview ?? observed.extracto ?? mail.vista_previa ?? mail.preview;
      return typeof value === "string" && value.trim() ? value.trim() : "";
    }
    function mailSortKey(mail) {
      const observed = mail.observado ?? {}, date = parseISODate(observed.fecha_recibido);
      if (!date) return "";
      const time = typeof observed.hora_recibido === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(observed.hora_recibido) ? observed.hora_recibido : "00:00";
      return `${observed.fecha_recibido}T${time}`;
    }
    function persistReadState() {
      try { localStorage.setItem(KEYS.readEmails, JSON.stringify([...readEmailIds])); return true; }
      catch (error) { const notice = $("#outlook-error"); notice.hidden = false; notice.classList.add("outlook-error"); notice.textContent = `No se pudo guardar el estado de lectura en este navegador (${error.message}).`; return false; }
    }
    function setReadState(mailId, isRead) {
      const wasRead = readEmailIds.has(mailId);
      if (wasRead === isRead) return true;
      if (isRead) readEmailIds.add(mailId); else readEmailIds.delete(mailId);
      if (persistReadState()) return true;
      if (wasRead) readEmailIds.add(mailId); else readEmailIds.delete(mailId);
      return false;
    }
