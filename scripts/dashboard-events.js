"use strict";
    document.querySelectorAll("nav [data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
    const sidebarToggle = $("#orgi-launcher"), dashboardApp = $("#dashboard-app");
    function setSidebarCollapsed(collapsed) {
      dashboardApp.classList.toggle("sidebar-collapsed", collapsed);
      sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
      sidebarToggle.setAttribute("aria-label", collapsed ? "Expandir panel" : "Contraer panel");
      sidebarToggle.setAttribute("aria-controls", "primary-navigation");
      sidebarToggle.title = collapsed ? "Expandir panel" : "Contraer panel";
      sidebarToggle.setAttribute("data-tooltip", collapsed ? "Expandir panel" : "Contraer panel");
      document.querySelectorAll(".sidebar nav button[data-view]").forEach(button => {
        button.title = collapsed ? button.querySelector(".nav-label").textContent.trim() : "";
      });
    }
    function setAvatarContext(inSidebar) {
      if (inSidebar) {
        $(".sidebar-heading").append(sidebarToggle);
        setSidebarCollapsed(dashboardApp.classList.contains("sidebar-collapsed"));
        return;
      }
      orgiLauncherSlot.append(sidebarToggle);
      sidebarToggle.setAttribute("aria-label", "Abrir Ory");
      sidebarToggle.setAttribute("aria-expanded", String($("#orgi-panel").classList.contains("open")));
      sidebarToggle.setAttribute("aria-controls", "orgi-panel");
      sidebarToggle.title = "Abrir el panel de Ory";
      sidebarToggle.setAttribute("data-tooltip", "Ory");
    }
    $("#explore-messages").addEventListener("click", () => openCommunications());
    $("#global-search-form").addEventListener("submit", event => { event.preventDefault(); $("#communications-title").textContent = search.value.trim() ? "Resultados de búsqueda" : "Comunicaciones"; setView("communications"); });
    $("#close-detail").addEventListener("click", () => detailDialog.close());
    $("#filters").addEventListener("submit", event => event.preventDefault());
    const updateFilterControls = () => { $("#reset").disabled = !search.value.trim() && !categoryFilter.value && !reviewFilter.value && !relevanceFilter.value; };
    [search, categoryFilter, reviewFilter, relevanceFilter].forEach(control => control.addEventListener(control === search ? "input" : "change", () => { currentMailPage = 1; activeCategory = categoryFilter.value; $("#communications-title").textContent = search.value.trim() ? "Resultados de búsqueda" : activeCategory === UNCLASSIFIED_CATEGORY ? "Sin clasificar" : activeCategory ? categoryName(activeCategory) : "Todos los correos"; updateFilterControls(); renderMailList(); }));
    $("#reset").addEventListener("click", () => { search.value = ""; categoryFilter.value = ""; reviewFilter.value = ""; relevanceFilter.value = ""; activeCategory = ""; updateFilterControls(); $("#communications-title").textContent = "Todos los correos"; renderMailList(); search.focus(); });
    $("#sort").addEventListener("click", event => { newestFirst = !newestFirst; event.currentTarget.querySelector("use").setAttribute("href", `icons/fluent.svg#arrow-${newestFirst ? "down" : "up"}-16-regular`); event.currentTarget.setAttribute("aria-label", `Ordenar por fecha ${newestFirst ? "descendente" : "ascendente"}`); currentMailPage = 1; renderMailList(); });
    $("#task-grouping").addEventListener("change", renderTasks);
    $("#cancel-task").addEventListener("click", () => taskDialog.close());
    taskForm.addEventListener("submit", event => {
      event.preventDefault(); const title = $("#task-title").value.trim(); if (!title) return;
      if (!window.confirm(`${editingTaskId ? "¿Guardar los cambios del compromiso" : "¿Crear este compromiso"} «${title}»?`)) return;
      const prior = tasks, oldTask = tasks.find(task => task.id === editingTaskId);
      const task = { id: editingTaskId ?? (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`), sourceEmailId: taskSourceId, title, description: $("#task-description").value.trim(), dueDate: $("#task-due").value, course: $("#task-course").value.trim(), status: oldTask?.status ?? "pendiente", createdAt: oldTask?.createdAt ?? new Date().toISOString() };
      tasks = editingTaskId ? tasks.map(item => item.id === editingTaskId ? task : item) : [...tasks, task];
      if (saveLocal()) { taskDialog.close(); renderTasks(); renderHome(); if (!$("#communications-view").classList.contains("hidden") && selectedId) showMail(emails.find(mail => mail.id === selectedId)); } else tasks = prior;
    });
    async function init() {
      const savedTasks = loadLocal(KEYS.tasks, []), savedDecisions = loadLocal(KEYS.decisions, {}), savedRelevance = loadLocal(KEYS.relevance, null);
      const hasSavedTasks = (() => { try { return localStorage.getItem(KEYS.tasks) !== null; } catch { return true; } })();
      tasks = Array.isArray(savedTasks) ? savedTasks.filter(task => task && typeof task.id === "string" && typeof task.title === "string") : [];
      decisions = savedDecisions && typeof savedDecisions === "object" && !Array.isArray(savedDecisions) ? savedDecisions : {};
      try {
        const response = await fetch(DATA_SOURCE); if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json(); if (!Array.isArray(data.correos)) throw new Error("El archivo no contiene correos[].");
        emails = data.correos;
        if (!hasSavedTasks && Array.isArray(data.compromisos_demo)) {
          const validEmailIds = new Set(emails.map(mail => mail.id));
          tasks = data.compromisos_demo.filter(task => task && typeof task.id === "string" && typeof task.title === "string" && validEmailIds.has(task.sourceEmailId));
        }
        const storedReadIds = loadLocal(KEYS.readEmails, null);
        const validEmailIds = new Set(emails.map(mail => mail.id));
        relevanceIds = new Set(Array.isArray(savedRelevance)
          ? savedRelevance.filter(id => typeof id === "string" && validEmailIds.has(id))
          : emails.filter(mail => decisions[mail.id] === "relevante").map(mail => mail.id));
        if (Array.isArray(storedReadIds)) readEmailIds = new Set(storedReadIds.filter(id => typeof id === "string" && validEmailIds.has(id)));
        else readEmailIds = new Set(emails.slice().sort((a, b) => mailSortKey(b).localeCompare(mailSortKey(a))).slice(8).map(mail => mail.id));
        $("#demo-reference-date").value = DEMO_REFERENCE_DATE;
        renderOutlook();
        populate(categoryFilter, emails.map(mail => mail.hipotesis_diseno?.categoria).filter(key => CATEGORY_META[key]), categoryName);
        const unclassifiedOption = node("option", "", "Sin clasificar"); unclassifiedOption.value = UNCLASSIFIED_CATEGORY; categoryFilter.append(unclassifiedOption);
        renderHome(); renderMailList();
      } catch (error) { $("#outlook-view").classList.add("hidden"); $("#dashboard-app").classList.remove("hidden"); showError(`No se pudo cargar la demostración. Ejecutá el sitio desde un servidor local y verificá ${DATA_SOURCE}. ${error.message}`); }
    }
