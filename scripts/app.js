"use strict";
    function openOrgi() {
      const opening = !$("#orgi-panel").classList.contains("open");
      if (opening) renderOutlook();
      toggleOrgi(opening);
    }
    function handleLauncherClick() {
      if (!dashboardApp.classList.contains("hidden")) {
        setSidebarCollapsed(!dashboardApp.classList.contains("sidebar-collapsed"));
        return;
      }
      openOrgi();
    }
    $("#orgi-launcher").addEventListener("click", handleLauncherClick);
    $("#orgi-close").addEventListener("click", () => toggleOrgi(false));
    $("#orgi-backdrop").addEventListener("click", () => toggleOrgi(false));
    $("#open-control-center").addEventListener("click", () => openDashboardForMail(null));
    $("#back-to-inbox").addEventListener("click", () => { setAvatarContext(false); $("#dashboard-app").classList.add("hidden"); $("#outlook-view").classList.remove("hidden"); $("#orgi-launcher").focus(); });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if ($("#orgi-panel").classList.contains("open")) toggleOrgi(false);
      else if (!$("#outlook-reading-pane").classList.contains("hidden")) closeOutlookReader();
    });
    $("#outlook-search").addEventListener("input", event => { outlookSearchQuery = event.currentTarget.value.trim(); renderOutlook(); });
    $("#demo-reference-date").addEventListener("change", event => { demoReferenceDate = parseISODate(event.currentTarget.value) ? event.currentTarget.value : DEMO_REFERENCE_DATE; event.currentTarget.value = demoReferenceDate; renderOutlook(); if (!$("#outlook-reading-pane").classList.contains("hidden")) { const selected = emails.find(mail => mail.id === selectedOutlookMailId); if (selected) renderOutlookReader(selected); } });
    $("#close-reading-pane").addEventListener("click", closeOutlookReader);
    $("#mark-mail-read").addEventListener("click", () => {
      if (!selectedOutlookMailId) return;
      const shouldRead = !readEmailIds.has(selectedOutlookMailId);
      if (setReadState(selectedOutlookMailId, shouldRead)) {
        renderOutlook();
      }
    });
    init();
