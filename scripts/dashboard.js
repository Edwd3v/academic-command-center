"use strict";
    function toggleOrgi(open) {
      const panel = $("#orgi-panel"), launcher = $("#orgi-launcher");
      panel.classList.toggle("open", open); $("#orgi-backdrop").classList.toggle("open", open);
      panel.setAttribute("aria-hidden", String(!open)); launcher.setAttribute("aria-expanded", String(open));
      if (open) $("#orgi-close").focus(); else launcher.focus();
    }
    const mailDate = mail => `${mail.observado?.fecha_recibido ?? ""}T${mail.observado?.hora_recibido ?? "00:00"}`;
    const linkedTasks = id => tasks.filter(task => task.sourceEmailId === id);
    function mailState(mailId) {
      const saved = decisions[mailId];
      if (saved && typeof saved === "object") return { reviewed: saved.reviewed === true, relevant: relevanceIds.has(mailId) || saved.relevant === true };
      return { reviewed: saved === "relevante" || saved === "no_relevante", relevant: relevanceIds.has(mailId) || saved === "relevante" };
    }
    function saveMailState(mail, changes) {
      const previousDecision = decisions[mail.id], wasRelevant = relevanceIds.has(mail.id), current = mailState(mail.id);
      const next = { ...current, ...changes };
      if (next.relevant) relevanceIds.add(mail.id); else relevanceIds.delete(mail.id);
      decisions[mail.id] = { reviewed: next.reviewed };
      if (saveLocal()) {
        renderMailList(); renderHome(); renderOutlook(); showMail(mail);
        return true;
      }
      if (previousDecision === undefined) delete decisions[mail.id]; else decisions[mail.id] = previousDecision;
      if (wasRelevant) relevanceIds.add(mail.id); else relevanceIds.delete(mail.id);
      return false;
    }
    function mailBody(mail) {
      const observed = mail.observado ?? {};
      const body = [mail.cuerpo, mail.contenido, observed.cuerpo, observed.contenido].find(value => typeof value === "string" && value.trim());
      return mail.cuerpo_disponible === true && body ? body.trim() : "";
    }
    function showError(message) { appError.textContent = message; appError.classList.remove("hidden"); }
    function loadLocal(key, fallback) { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch (error) { showError(`No se pudieron leer los datos guardados (${error.message}); los cambios podrían no persistir.`); return fallback; } }
    function saveLocal() {
      const keys = [KEYS.tasks, KEYS.decisions, KEYS.relevance], previous = keys.map(key => localStorage.getItem(key));
      try {
        localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
        localStorage.setItem(KEYS.decisions, JSON.stringify(decisions));
        localStorage.setItem(KEYS.relevance, JSON.stringify([...relevanceIds]));
        return true;
      } catch (error) {
        keys.forEach((key, index) => { try { if (previous[index] === null) localStorage.removeItem(key); else localStorage.setItem(key, previous[index]); } catch {} });
        showError(`No se pudieron guardar los cambios en este navegador (${error.message}). Revisá el espacio disponible.`);
        return false;
      }
    }
    function setView(view) {
      $("#dashboard-app").classList.toggle("home-view-active", view === "home");
      ["home", "communications", "tasks"].forEach(name => $(`#${name}-view`).classList.toggle("hidden", name !== view));
      document.querySelectorAll("nav [data-view]").forEach(button => { if (button.dataset.view === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
      if (view === "home") renderHome();
      if (view === "communications") { renderMailList(); search.focus(); }
      if (view === "tasks") renderTasks();
      if (detailDialog.open) detailDialog.close();
    }
    function openCommunications(category = "", review = "") {
      activeCategory = category;
      categoryFilter.value = category;
      reviewFilter.value = review;
      relevanceFilter.value = "";
      search.value = "";
      setView("communications");
      $("#communications-title").textContent = category === UNCLASSIFIED_CATEGORY ? "Sin clasificar" : category ? categoryName(category) : "Todos los correos";
    }
    function renderHome() {
      const pendingMails = emails.filter(mail => !mailState(mail.id).reviewed);
      const pendingSorted = pendingMails.slice().sort((a, b) => mailDate(b).localeCompare(mailDate(a)) || String(a.id).localeCompare(String(b.id))).slice(0, 4);
      const priorityList = $("#priority-list"); priorityList.replaceChildren();
      $("#priority-empty").classList.toggle("hidden", pendingSorted.length !== 0);
      pendingSorted.forEach(mail => {
        const hypothesis = mail.hipotesis_diseno ?? {};
        const card = node("button", "priority-item"); card.type = "button";
        card.setAttribute("aria-label", `${text(mail.observado?.asunto)}. ${categoryName(hypothesis.categoria)}. Sin revisar. Abrir comunicación.`);
        card.append(node("strong", "", text(mail.observado?.asunto)), node("small", "", categoryName(hypothesis.categoria)));
        card.append(node("small", "", "Sin revisar"));
        card.addEventListener("click", () => { openCommunications(); showMail(mail); });
        priorityList.append(card);
      });
      const reviewedCount = emails.length - pendingMails.length;
      const reviewedPercent = emails.length ? reviewedCount / emails.length * 100 : 0;
      $(".review-percent").textContent = `${Math.round(reviewedPercent)}%`;
      $(".reviewed-count").textContent = String(reviewedCount);
      $(".unreviewed-count").textContent = String(pendingMails.length);
      $("#review-support").textContent = `${reviewedCount} de ${emails.length} comunicaciones revisadas`;
      $(".review-donut").style.setProperty("--reviewed-percent", `${reviewedPercent}%`);
      $(".review-donut").setAttribute("aria-label", `Revisadas: ${reviewedCount}; sin revisar: ${pendingMails.length}`);
      $(".review-empty").classList.toggle("hidden", emails.length !== 0);
      const activeCommitments = tasks.filter(task => task.status !== "finalizada").length;
      const grid = $("#category-grid"); grid.replaceChildren();
      const counts = new Map(); emails.forEach(mail => { const key = mail.hipotesis_diseno?.categoria; if (key) counts.set(key, (counts.get(key) ?? 0) + 1); });
      ["academico", "institucional", "administrativo", "bienestar", "oportunidad", ...[...counts.keys()].filter(key => !CATEGORY_META[key])].forEach(key => {
        const info = CATEGORY_META[key] ?? { label: label(key), icon: "mail-20-regular", description: "Comunicaciones de esta categoría." };
        const total = counts.get(key) ?? 0;
        const pendingCount = emails.filter(mail => mail.hipotesis_diseno?.categoria === key && !mailState(mail.id).reviewed).length;
        const button = node("button", "category-card"); button.type = "button"; button.dataset.category = key;
        button.setAttribute("aria-label", `${info.label}: ${total} comunicaciones, ${pendingCount} sin revisar`);
        const description = node("span"); description.append(node("strong", "", info.label), node("small", "", info.description), node("small", "category-secondary", `${pendingCount} sin revisar`));
        const tail = node("span", "category-tail"), arrow = node("span", "category-arrow"); arrow.append(icon("arrow-right-16-regular")); tail.append(node("span", "count", String(total)), arrow);
        const categoryIcon = node("span", "category-icon"); categoryIcon.append(icon(info.icon));
        button.replaceChildren(categoryIcon, description, tail);
        button.addEventListener("click", () => openCommunications(key)); grid.append(button);
      });
      const commitmentCard = node("button", "category-card commitment-category-card"); commitmentCard.type = "button"; commitmentCard.dataset.action = "tasks";
      commitmentCard.setAttribute("aria-label", `Mis compromisos: ${activeCommitments} activos. Abrir Mis compromisos.`);
      const commitmentText = node("span"); commitmentText.append(node("strong", "", "Mis compromisos"), node("small", "", activeCommitments ? "Seguimiento activo" : "Sin compromisos activos"));
      const commitmentTail = node("span", "category-tail"), commitmentArrow = node("span", "category-arrow"), commitmentIcon = node("span", "category-icon");
      commitmentIcon.append(icon("checkmark-20-regular")); commitmentArrow.append(icon("arrow-right-16-regular"));
      commitmentTail.append(node("span", "count", String(activeCommitments)), commitmentArrow);
      commitmentCard.append(commitmentIcon, commitmentText, commitmentTail);
      commitmentCard.addEventListener("click", () => setView("tasks")); grid.append(commitmentCard);
      const unclassifiedCount = emails.filter(mail => !CATEGORY_META[mail.hipotesis_diseno?.categoria]).length;
      const previousUnclassified = grid.nextElementSibling?.classList.contains("unclassified-link") ? grid.nextElementSibling : null;
      previousUnclassified?.remove();
      if (unclassifiedCount) {
        const link = node("button", "unclassified-link", `Sin clasificar: ${unclassifiedCount} comunicación${unclassifiedCount === 1 ? "" : "es"}`);
        link.type = "button"; link.addEventListener("click", () => openCommunications(UNCLASSIFIED_CATEGORY)); grid.after(link);
      }
      alignPriorityCards();
    }
    function alignPriorityCards() {
      const list = $("#priority-list");
      list.classList.remove("aligned"); list.style.removeProperty("--priority-list-height");
      if (list.children.length !== 4 || !matchMedia("(min-width: 821px)").matches) return;
      const availableHeight = $(".sidebar").getBoundingClientRect().bottom - list.getBoundingClientRect().top;
      if (availableHeight > 0) {
        list.style.setProperty("--priority-list-height", `${availableHeight}px`);
        list.classList.add("aligned");
      }
    }
    const priorityLayoutObserver = new ResizeObserver(() => alignPriorityCards());
    priorityLayoutObserver.observe($(".sidebar"));
    priorityLayoutObserver.observe($("#category-grid"));
    function localDateString() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
    function populate(select, values, format = label) { [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")).forEach(value => { const option = node("option", "", format(value)); option.value = value; select.append(option); }); }
    function filteredEmails() {
      const query = normalize(search.value.trim());
      return emails.filter(mail => {
        const observed = mail.observado ?? {}, hypothesis = mail.hipotesis_diseno ?? {};
        const state = mailState(mail.id);
        const matchesQuery = [observed.remitente, observed.asunto, mailBody(mail), hypothesis.categoria, categoryName(hypothesis.categoria)]
          .some(value => normalize(value).includes(query));
        return (!query || matchesQuery)
          && (!categoryFilter.value || (categoryFilter.value === UNCLASSIFIED_CATEGORY ? !CATEGORY_META[hypothesis.categoria] : hypothesis.categoria === categoryFilter.value))
          && (!reviewFilter.value || (reviewFilter.value === "reviewed" ? state.reviewed : !state.reviewed))
          && (!relevanceFilter.value || (relevanceFilter.value === "relevant" ? state.relevant : !state.relevant));
      }).sort((a, b) => mailDate(a).localeCompare(mailDate(b)) * (newestFirst ? -1 : 1));
    }
    const COMMUNICATIONS_PER_PAGE = 4;
    let currentMailPage = 1;
    function renderMailList() {
      const filtered = filteredEmails(), totalPages = Math.ceil(filtered.length / COMMUNICATIONS_PER_PAGE);
      currentMailPage = Math.min(Math.max(currentMailPage, 1), Math.max(totalPages, 1));
      list.replaceChildren();
      $("#communications-count").textContent = `${filtered.length} de ${emails.length}`;
      const firstIndex = filtered.length ? (currentMailPage - 1) * COMMUNICATIONS_PER_PAGE : 0;
      const pageItems = filtered.slice(firstIndex, firstIndex + COMMUNICATIONS_PER_PAGE);
      $("#pagination-summary").textContent = filtered.length ? `Mostrando ${firstIndex + 1}–${firstIndex + pageItems.length} de ${filtered.length} comunicaciones` : "Mostrando 0–0 de 0 comunicaciones";
      const controls = $("#pagination-controls"); controls.replaceChildren();
      const previous = node("button", "", "Anterior"); previous.type = "button"; previous.disabled = currentMailPage <= 1; previous.addEventListener("click", () => { currentMailPage--; renderMailList(); }); controls.append(previous);
      for (let page = 1; page <= totalPages; page++) {
        const button = node("button", "", String(page)); button.type = "button"; button.setAttribute("aria-label", `Página ${page}`);
        if (page === currentMailPage) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => { currentMailPage = page; renderMailList(); }); controls.append(button);
      }
      const next = node("button", "", "Siguiente"); next.type = "button"; next.disabled = currentMailPage >= totalPages; next.addEventListener("click", () => { currentMailPage++; renderMailList(); }); controls.append(next);
      if (!filtered.length) { list.append(node("p", "empty", "No hay comunicaciones que coincidan con la búsqueda y los filtros.")); return; }
      pageItems.forEach(mail => {
        const observed = mail.observado ?? {}, hypothesis = mail.hipotesis_diseno ?? {}, state = mailState(mail.id);
        const button = node("button", "mail-row"); button.type = "button"; button.setAttribute("aria-pressed", String(selectedId === mail.id));
        button.dataset.reviewed = String(state.reviewed);
        const byline = node("span", "mail-byline"); byline.append(node("span", "", text(observed.remitente)), node("span", "", formatMailDate(mail)));
        const badges = node("span", "mail-badges");
        badges.append(node("span", "badge", `${categoryName(hypothesis.categoria)} · propuesta`), node("span", `badge ${state.reviewed ? "reviewed" : "pending"}`, state.reviewed ? "Revisado" : "Sin revisar"));
        if (state.relevant) badges.append(node("span", "badge relevance", "Relevante para vos"));
        if (linkedTasks(mail.id).length) badges.append(node("span", "badge commitment-badge", "Con compromiso"));
        button.append(node("span", "mail-subject", text(observed.asunto)), byline, badges);
        button.addEventListener("click", () => showMail(mail)); list.append(button);
      });
    }
    function detailBlock(title, children) { const section = node("section", "detail-block"); section.append(node("h3", "", title)); children.forEach(child => section.append(child)); return section; }
    function definitionList(rows) { const dl = node("dl", "detail-dl"); rows.forEach(([term, value]) => dl.append(node("dt", "", term), node("dd", "", value))); return dl; }
    function showMail(mail) {
      selectedId = mail.id; const observed = mail.observado ?? {}, hypothesis = mail.hipotesis_diseno ?? {};
      detailContent.replaceChildren();
      const subject = node("h2", "detail-subject", text(observed.asunto)); subject.id = "detail-subject";
      const header = node("header", "detail-header"); header.append(node("p", "muted", `Comunicación · ${mail.id}`), subject, node("p", "", text(observed.remitente)), node("p", "meta", `Recibido: ${[observed.fecha_recibido, observed.hora_recibido].filter(Boolean).join(" · ") || "Fecha no indicada"}`)); detailContent.append(header);
      const state = mailState(mail.id), linked = linkedTasks(mail.id);
      detailContent.append(detailBlock("Estado de esta comunicación", [definitionList([["Categoría propuesta", categoryName(hypothesis.categoria)], ["Estado de revisión", state.reviewed ? "Revisado" : "Sin revisar"], ["Relevancia", state.relevant ? "Marcada como relevante por vos" : "Sin marcar"], ["Compromiso", linked.length ? "Tiene un compromiso asociado" : "Sin compromiso asociado"]])]));
      if (hypothesis.accion_sugerida) detailContent.append(detailBlock("Posible acción · propuesta", [node("p", "", hypothesis.accion_sugerida), node("p", "muted", "Orientación basada en los datos de ejemplo; no confirma una obligación ni una fecha límite.")]));
      const body = mailBody(mail);
      detailContent.append(detailBlock("Contenido de la comunicación", [body ? node("p", "detail-body", body) : node("p", "reading-unavailable", "Contenido no disponible en esta muestra.")]));
      const sourceRows = [["Remitente", text(observed.remitente)], ["Fecha", formatMailDate(mail)], ["Fuente del registro", `Registro ${mail.id} de ${DATA_SOURCE}`]];
      const capture = observed.captura, originalUrl = typeof capture === "string" ? capture : capture && typeof capture === "object" ? (capture.url ?? capture.href) : "";
      const sourceBlock = detailBlock("Información de origen", [definitionList(sourceRows)]);
      if (typeof originalUrl === "string" && /^https?:\/\//i.test(originalUrl)) {
        const link = node("a", "text-link", "Abrir mensaje original"); link.href = originalUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; sourceBlock.append(link);
      }
      detailContent.append(sourceBlock);
      const actions = node("div", "task-controls");
      const existing = linkedTasks(mail.id);
      const taskAction = node("button", "button primary", existing.length ? "Editar compromiso" : "Convertir en compromiso"); taskAction.type = "button"; taskAction.addEventListener("click", () => openTaskForm(mail, existing[0] ?? null)); actions.append(taskAction);
      const reviewAction = node("button", "button", state.reviewed ? "Dejar sin revisar" : "Marcar como revisado"); reviewAction.type = "button"; reviewAction.setAttribute("aria-pressed", String(state.reviewed)); reviewAction.addEventListener("click", () => saveMailState(mail, { reviewed: !state.reviewed })); actions.append(reviewAction);
      const relevanceAction = node("button", "button", state.relevant ? "Quitar relevancia" : "Marcar como relevante"); relevanceAction.type = "button"; relevanceAction.setAttribute("aria-pressed", String(state.relevant)); relevanceAction.addEventListener("click", () => saveMailState(mail, { relevant: !state.relevant })); actions.append(relevanceAction);
      const actionBlock = detailBlock("Acciones disponibles", [actions]); actionBlock.classList.add("detail-actions"); detailContent.append(actionBlock);
      if (!detailDialog.open) detailDialog.showModal();
      renderMailList();
    }
    function openTaskForm(mail, task = null) {
      editingTaskId = task?.id ?? null; taskSourceId = task?.sourceEmailId ?? mail?.id ?? null;
      $("#task-dialog-title").textContent = task ? "Editar compromiso" : "Crear compromiso";
      const sourceMail = emails.find(item => item.id === taskSourceId);
      $("#task-source").textContent = sourceMail ? `Vinculada a: ${text(sourceMail.observado?.asunto)}. La fecha es opcional y la definís vos.` : "Sin comunicación de origen disponible. La fecha es opcional y la definís vos.";
      $("#task-title").value = task?.title ?? text(mail?.observado?.asunto, ""); $("#task-description").value = task?.description ?? ""; $("#task-due").value = task?.dueDate ?? ""; $("#task-course").value = task?.course ?? "";
      taskDialog.showModal(); $("#task-title").focus();
    }
    const taskCompleted = task => task.status === "finalizada";
    function taskCard(task) {
      const card = node("article", "task-card"), head = node("div", "task-head"), completed = taskCompleted(task); head.append(node("h3", "", task.title), node("span", `tag task-state-${completed ? "finalizada" : "pendiente"}`, completed ? "Completado" : "Pendiente")); card.append(head);
      if (task.description) card.append(node("p", "", task.description));
      card.append(node("p", "meta", `${task.dueDate ? `Fecha: ${task.dueDate}` : "Sin fecha"} · ${task.course || "Materia sin indicar"}`));
      const sourceMail = emails.find(mail => mail.id === task.sourceEmailId);
      if (sourceMail) { const source = node("button", "text-link", `Comunicación relacionada: ${text(sourceMail.observado?.asunto)}`); source.type = "button"; source.addEventListener("click", () => { openCommunications(); showMail(sourceMail); }); card.append(source); }
      else card.append(node("p", "meta", "Sin comunicación relacionada disponible."));
      const controls = node("div", "task-controls"), status = document.createElement("select"); status.setAttribute("aria-label", `Estado de ${task.title}`);
      [["pendiente", "Pendiente"], ["finalizada", "Completado"]].forEach(([value, title]) => { const option = node("option", "", title); option.value = value; status.append(option); }); status.value = completed ? "finalizada" : "pendiente";
      status.addEventListener("change", () => { const old = task.status; task.status = status.value; if (saveLocal()) { renderTasks(); renderHome(); if (detailDialog.open && selectedId) showMail(emails.find(mail => mail.id === selectedId)); } else { task.status = old; status.value = taskCompleted(task) ? "finalizada" : "pendiente"; } }); controls.append(status);
      const edit = node("button", "button", "Editar"); edit.type = "button"; edit.addEventListener("click", () => openTaskForm(null, task));
      const remove = node("button", "button danger", "Eliminar"); remove.type = "button"; remove.addEventListener("click", () => { if (!confirm(`¿Eliminar el compromiso «${task.title}»?`)) return; const prior = tasks; tasks = tasks.filter(item => item.id !== task.id); if (saveLocal()) { renderTasks(); renderHome(); } else tasks = prior; }); controls.append(edit, remove); card.append(controls); return card;
    }
    function renderTasks() {
      const container = $("#task-list"), overview = $("#task-overview"); container.replaceChildren(); overview.replaceChildren(); if (!tasks.length) { const empty = node("section", "task-empty"); empty.append(node("h3", "", "Tu espacio de compromisos empieza acá"), node("p", "", "Abrí una comunicación y elegí Convertir en compromiso si decidís darle seguimiento. La fecha es opcional y la definís vos.")); const link = node("button", "button primary", "Explorar comunicaciones"); link.type = "button"; link.addEventListener("click", () => openCommunications()); empty.append(link); container.append(empty); return; }
      const mode = $("#task-grouping").value;
      if (mode === "status") {
        [[false, "Pendientes"], [true, "Completados"]].forEach(([completed, title]) => {
          const matching = tasks.filter(task => taskCompleted(task) === completed).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
          const group = node("section", "task-group"), heading = node("h2"); heading.append(node("span", "", title), node("span", "count", String(matching.length))); group.append(heading);
          const cards = node("div", "task-grid"); matching.forEach(task => cards.append(taskCard(task))); group.append(cards);
          if (matching.length) container.append(group);
        });
        return;
      }
      const groups = new Map(); tasks.forEach(task => { const key = mode === "date" ? (task.dueDate || "Sin fecha confirmada") : (task.course || "Materia sin indicar"); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(task); });
      [...groups.keys()].sort((a, b) => mode === "date" && a === "Sin fecha confirmada" ? 1 : mode === "date" && b === "Sin fecha confirmada" ? -1 : a.localeCompare(b, "es")).forEach(key => { const group = node("section", "task-group"), heading = node("h2", "", key), cards = node("div", "task-grid"); group.append(heading); groups.get(key).sort((a, b) => a.status.localeCompare(b.status)).forEach(task => cards.append(taskCard(task))); group.append(cards); container.append(group); });
    }
