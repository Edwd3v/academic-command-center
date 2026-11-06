"use strict";
    function renderOutlook() {
      const container = $("#outlook-mail-list"), attention = $("#orgi-attention-list");
      const previousScrollTop = container.scrollTop;
      container.replaceChildren($("#outlook-header-strip")); attention.replaceChildren();
      const query = normalize(outlookSearchQuery);
      const visibleEmails = emails.filter(mail => !query || [mail.observado?.remitente, mail.observado?.asunto, previewFor(mail)].some(value => normalize(value).includes(query)))
        .slice().sort((a, b) => mailSortKey(b).localeCompare(mailSortKey(a)));
      let previousGroup = null;
      visibleEmails.forEach(mail => {
        const observed = mail.observado ?? {}, group = formatMailGroup(mail), isRead = readEmailIds.has(mail.id);
        if (group !== previousGroup) { const heading = node("div", "mail-group-label"); heading.append(icon("chevron-down-12-regular"), document.createTextNode(group)); container.append(heading); previousGroup = group; }
        const button = node("button", `outlook-mail ${isRead ? "read" : "unread"}${selectedOutlookMailId === mail.id ? " selected" : ""}`);
        button.type = "button";
        button.dataset.emailId = mail.id;
        button.setAttribute("aria-pressed", String(selectedOutlookMailId === mail.id));
        const sender = node("span", "outlook-sender-cell"); sender.append(node("span", "outlook-sender", text(observed.remitente)));
        const preview = previewFor(mail); if (preview) sender.append(node("span", "outlook-preview", preview));
        button.append(sender, node("span", "outlook-subject", text(observed.asunto)), node("span", "outlook-date", formatMailDate(mail)));
        button.setAttribute("aria-label", `${isRead ? "Leído" : "No leído"}: ${text(observed.remitente)}, ${text(observed.asunto)}, ${formatMailDate(mail)}`);
        button.addEventListener("click", () => showOutlookMail(mail));
        container.append(button);
      });
      if (!visibleEmails.length) container.append(node("p", "empty", "No hay correos que coincidan con la búsqueda."));
      const pendingEmails = emails.filter(mail => !mailState(mail.id).reviewed).slice(0, 3);
      pendingEmails.forEach(mail => {
        const item = node("button", "orgi-attention-item"); item.type = "button"; item.dataset.emailId = mail.id;
        item.append(node("strong", "", text(mail.observado?.asunto)), node("small", "", `${text(mail.observado?.remitente)} · ${categoryName(mail.hipotesis_diseno?.categoria)}`)); attention.append(item);
        item.addEventListener("click", () => openDashboardForMail(mail));
      });
      if (!attention.childElementCount) attention.append(node("p", "muted", "No hay comunicaciones pendientes de revisión."));
      $("#inbox-count").textContent = `${emails.length} correos · ${emails.length - readEmailIds.size} sin leer`;
      $("#unread-count").textContent = String(emails.length - readEmailIds.size);
      const selected = emails.find(mail => mail.id === selectedOutlookMailId);
      const markRead = $("#mark-mail-read"); markRead.disabled = !selected; markRead.textContent = selected && !readEmailIds.has(selected.id) ? "Marcar como leído" : "Marcar como no leído";
      if (selected) $("#reading-status").textContent = readEmailIds.has(selected.id) ? "Leído" : "No leído";
      $("#inbox-date-summary").textContent = `Referencia: ${new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseISODate(demoReferenceDate))}`;
      container.scrollTop = previousScrollTop;
    }
    function showOutlookMail(mail) {
      selectedOutlookMailId = mail.id;
      setReadState(mail.id, true);
      renderOutlookReader(mail);
      $("#outlook-reading-pane").classList.remove("hidden"); renderOutlook();
      document.querySelector(`[data-email-id="${CSS.escape(mail.id)}"]`)?.focus();
    }
    function renderOutlookReader(mail) {
      $("#reading-subject").textContent = text(mail.observado?.asunto);
      const content = $("#reading-content"); content.replaceChildren();
      const status = readEmailIds.has(mail.id) ? "Leído" : "No leído";
      const details = node("div", "reading-meta");
      details.append(node("div", "", `De: ${text(mail.observado?.remitente)}`), node("div", "", `Recibido: ${formatMailDate(mail)}`));
      const readLine = node("div", ""); readLine.append(document.createTextNode("Estado: "), node("strong", "", status));
      readLine.querySelector("strong").id = "reading-status"; details.append(readLine); content.append(details);
      const observed = mail.observado ?? {}, body = [mail.cuerpo, mail.contenido, observed.cuerpo, observed.contenido].find(value => typeof value === "string" && value.trim());
      const message = node("div", "reading-body");
      if (mail.cuerpo_disponible === true && body) message.textContent = body;
      else message.append(node("p", "reading-unavailable", "El contenido de este mensaje no está disponible en la muestra de demostración."));
      content.append(message);
    }
    function closeOutlookReader() {
      $("#outlook-reading-pane").classList.add("hidden");
      const selected = document.querySelector(`[data-email-id="${CSS.escape(selectedOutlookMailId ?? "")}"]`);
      if (selected) selected.focus(); else $("#outlook-search").focus();
    }
    function openDashboardForMail(mail) {
      $("#orgi-panel").classList.remove("open"); $("#orgi-backdrop").classList.remove("open");
      $("#orgi-panel").setAttribute("aria-hidden", "true"); $("#orgi-launcher").setAttribute("aria-expanded", "false");
      setSidebarCollapsed(true);
      $("#outlook-view").classList.add("hidden"); $("#dashboard-app").classList.remove("hidden");
      setAvatarContext(true);
      if (mail) { openCommunications(); showMail(mail); } else $("#back-to-inbox").focus();
    }
