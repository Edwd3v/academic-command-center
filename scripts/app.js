"use strict";
    function openOrgi() {
      const opening = !$("#orgi-panel").classList.contains("open");
      if (opening) renderOutlook();
      toggleOrgi(opening);
    }
    function handleLauncherClick() {
      if (!$("#orgi-transition").classList.contains("hidden")) return;
      if (!dashboardApp.classList.contains("hidden")) {
        setSidebarCollapsed(!dashboardApp.classList.contains("sidebar-collapsed"));
        return;
      }
      openOrgi();
    }
    $("#orgi-launcher").addEventListener("click", handleLauncherClick);
    $("#orgi-close").addEventListener("click", () => toggleOrgi(false));
    $("#orgi-backdrop").addEventListener("click", () => toggleOrgi(false));
    const transition = $("#orgi-transition"), transitionStart = $("#transition-start"), transitionFinish = $("#transition-finish");
    const transitionTitle = $("#transition-title"), transitionDescription = $("#transition-description"), transitionCaption = $("#transition-caption");
    const transitionCopy = $(".transition-copy"), transitionCaptionWrap = $(".transition-visual-bottom");
    const transitionScenes = [
      { phase: "collecting", title: "Todo comienza en tu bandeja.", description: "Distintas comunicaciones llegan a un mismo lugar. Visualicemos cómo darles espacio sin perder el contexto.", caption: "01 / Reunir lo disperso" },
      { phase: "finding", title: "Ahora, lo que merece atención.", description: "Entre tantos mensajes, hay asuntos que conviene revisar con calma. La decisión siempre es tuya.", caption: "02 / Reconocer lo importante" },
      { phase: "arranging", title: "Cada cosa encuentra su lugar.", description: "Comunicaciones, asuntos por revisar y compromisos: una vista más clara para decidir qué sigue.", caption: "03 / Darle forma al espacio" },
      { phase: "ready", title: "Tu espacio está listo.", description: "", caption: "Listo para explorar" }
    ];
    let transitionTimer = 0, transitionFrame = 0;
    function resetTransition() {
      clearTimeout(transitionTimer);
      cancelAnimationFrame(transitionFrame);
      transitionTimer = 0;
      transitionFrame = 0;
      transitionCopy.classList.remove("is-changing");
      transitionCaptionWrap.classList.remove("is-changing");
      transition.dataset.phase = "intro";
      transitionTitle.textContent = "Hagamos espacio para lo importante.";
      transitionDescription.textContent = "Soy Orgi. Te muestro cómo pasar de comunicaciones dispersas a un centro de control más claro.";
      transitionCaption.textContent = "Un lugar para ver lo que importa";
      transitionStart.disabled = false;
      transitionFinish.tabIndex = -1;
    }
    function showTransition() {
      resetTransition();
      toggleOrgi(false);
      $("#outlook-view").classList.add("hidden");
      $("#transition-portrait").append(orgiLauncher);
      orgiLauncher.tabIndex = -1;
      transition.classList.remove("hidden");
      transitionStart.focus();
    }
    function returnFromTransition() {
      resetTransition();
      transition.classList.add("hidden");
      orgiLauncher.removeAttribute("tabindex");
      setAvatarContext(false);
      $("#outlook-view").classList.remove("hidden");
      $("#orgi-launcher").focus();
    }
    function playTransitionScene(index, reducedMotion) {
      const scene = transitionScenes[index];
      transition.dataset.phase = scene.phase;
      transitionTitle.textContent = scene.title;
      transitionDescription.textContent = scene.description;
      transitionCaption.textContent = scene.caption;
      if (index === transitionScenes.length - 1) {
        transitionFinish.removeAttribute("tabindex");
        if (reducedMotion) transitionFinish.focus({ preventScroll:true });
        return;
      }
      transitionTimer = window.setTimeout(() => advanceTransitionScene(index + 1, reducedMotion), reducedMotion ? 160 : 2050);
    }
    function advanceTransitionScene(index, reducedMotion) {
      if (reducedMotion) { playTransitionScene(index, true); return; }
      transitionCopy.classList.add("is-changing");
      transitionCaptionWrap.classList.add("is-changing");
      transitionTimer = window.setTimeout(() => {
        playTransitionScene(index, false);
        transitionFrame = requestAnimationFrame(() => {
          transitionCopy.classList.remove("is-changing");
          transitionCaptionWrap.classList.remove("is-changing");
          if (index === transitionScenes.length - 1) transitionFinish.focus({ preventScroll:true });
          transitionFrame = 0;
        });
      }, 260);
    }
    $("#open-control-center").addEventListener("click", showTransition);
    $("#transition-back").addEventListener("click", returnFromTransition);
    transitionFinish.addEventListener("click", () => {
      if (transition.dataset.phase !== "ready" || transition.classList.contains("hidden")) return;
      transition.classList.add("hidden");
      orgiLauncher.removeAttribute("tabindex");
      openDashboardForMail(null);
      resetTransition();
    });
    transitionStart.addEventListener("click", () => {
      if (transitionStart.disabled) return;
      transitionStart.disabled = true;
      advanceTransitionScene(0, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
