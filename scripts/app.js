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
    const transition = $("#orgi-transition"), transitionStart = $("#transition-start");
    const transitionTitle = $("#transition-title"), transitionDescription = $("#transition-description"), transitionCaption = $("#transition-caption");
    const transitionScenes = [
      { phase: "collecting", title: "Todo comienza en tu bandeja.", description: "Distintas comunicaciones llegan a un mismo lugar. Visualicemos cómo darles espacio sin perder el contexto.", caption: "01 / Reunir lo disperso" },
      { phase: "finding", title: "Ahora, lo que merece atención.", description: "Entre tantos mensajes, hay asuntos que conviene revisar con calma. La decisión siempre es tuya.", caption: "02 / Reconocer lo importante" },
      { phase: "arranging", title: "Cada cosa encuentra su lugar.", description: "Comunicaciones, asuntos por revisar y compromisos: una vista más clara para decidir qué sigue.", caption: "03 / Darle forma al espacio" },
      { phase: "ready", title: "Tu espacio está listo.", description: "Ya podés explorar tu centro de control. Esta fue una representación de la experiencia, no un análisis de tus datos.", caption: "Listo para explorar" }
    ];
    let transitionTimer = 0;
    function resetTransition() {
      clearTimeout(transitionTimer);
      transitionTimer = 0;
      transition.dataset.phase = "intro";
      transitionTitle.textContent = "Hagamos espacio para lo importante.";
      transitionDescription.textContent = "Soy Orgi. Te muestro cómo pasar de comunicaciones dispersas a un centro de control más claro.";
      transitionCaption.textContent = "Un lugar para ver lo que importa";
      transitionStart.disabled = false;
      transitionStart.classList.remove("hidden");
    }
    function showTransition() {
      resetTransition();
      toggleOrgi(false);
      $("#outlook-view").classList.add("hidden");
      transition.classList.remove("hidden");
      transitionStart.focus();
    }
    function returnFromTransition() {
      resetTransition();
      transition.classList.add("hidden");
      $("#outlook-view").classList.remove("hidden");
      $("#orgi-launcher").focus();
    }
    function playTransitionScene(index, reducedMotion) {
      const scene = transitionScenes[index];
      transition.dataset.phase = scene.phase;
      transitionTitle.textContent = scene.title;
      transitionDescription.textContent = scene.description;
      transitionCaption.textContent = scene.caption;
      const delay = reducedMotion ? (index === transitionScenes.length - 1 ? 400 : 160) : (index === transitionScenes.length - 1 ? 800 : 850);
      transitionTimer = window.setTimeout(() => {
        if (index + 1 < transitionScenes.length) playTransitionScene(index + 1, reducedMotion);
        else {
          transition.classList.add("hidden");
          openDashboardForMail(null);
          resetTransition();
        }
      }, delay);
    }
    $("#open-control-center").addEventListener("click", showTransition);
    $("#transition-back").addEventListener("click", returnFromTransition);
    transitionStart.addEventListener("click", () => {
      if (transitionStart.disabled) return;
      transitionStart.disabled = true;
      transitionStart.classList.add("hidden");
      playTransitionScene(0, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    });
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
