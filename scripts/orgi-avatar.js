"use strict";
    function initOrgiPersonality() {
      const launcher = $("#orgi-launcher"), avatar = $("#orgi-avatar"), cta = $("#orgi-cta"), ctaWrap = $("#orgi-cta-wrap"), ctaArrow = $("#orgi-cta-arrow");
      if (!launcher || !avatar) return () => {};
      const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)"), controller = new AbortController();
      if (avatar.dataset.personalityInitialized === "true") return () => {};
      avatar.dataset.personalityInitialized = "true";
      const timers = new Set(), idleActionTimers = new Set();
      let idleTimer = 0, blinkTimer = 0, headTimer = 0, stateTimer = 0, lastActivity = performance.now();
      let arrowTimer = 0, ctaLookTimer = 0, ctaReturnTimer = 0;
      let pointer = null, pointerAt = 0, wasNear = false, lastSurprise = 0, behaviorVersion = 0, temporaryState = "", destroyed = false;
      const random = (min, max) => min + Math.random() * (max - min);
      const later = (callback, delay, bucket = timers) => {
        const id = window.setTimeout(() => { timers.delete(id); bucket.delete(id); callback(); }, delay);
        timers.add(id); bucket.add(id); return id;
      };
      const clearTimer = id => { if (id) { clearTimeout(id); timers.delete(id); idleActionTimers.delete(id); } };
      const cancelCtaLook = () => {
        clearTimer(ctaLookTimer); clearTimer(ctaReturnTimer); ctaLookTimer = ctaReturnTimer = 0;
      };
      const cancelIdleActions = () => {
        behaviorVersion += 1; clearTimer(idleTimer); idleTimer = 0;
        idleActionTimers.forEach(id => { clearTimeout(id); timers.delete(id); }); idleActionTimers.clear();
      };
      const setState = (state, tilt = 0) => {
        avatar.dataset.state = state;
        avatar.style.setProperty("--orgi-tilt", `${tilt.toFixed(1)}deg`);
      };
      const setGaze = (x, y) => {
        avatar.style.setProperty("--orgi-eye-x", `${x.toFixed(1)}px`);
        avatar.style.setProperty("--orgi-eye-y", `${y.toFixed(1)}px`);
      };
      const showTemporaryState = (state, tilt, duration) => {
        clearTimer(stateTimer); temporaryState = state; setState(state, tilt);
        stateTimer = later(() => {
          temporaryState = ""; stateTimer = 0;
          setState(wasNear ? "watching" : "idle");
        }, duration);
      };
      const blink = (double = false) => {
        if (motionPreference.matches || document.hidden) return;
        avatar.classList.add("is-blinking");
        later(() => avatar.classList.remove("is-blinking"), 130);
        if (double) later(() => { avatar.classList.add("is-blinking"); later(() => avatar.classList.remove("is-blinking"), 130); }, 210);
      };
      const scheduleBlink = () => {
        clearTimer(blinkTimer);
        if (motionPreference.matches || document.hidden) return;
        blinkTimer = later(() => { blink(Math.random() < .16); scheduleBlink(); }, random(2600, 7200));
      };
      const scheduleArrowNudge = () => {
        clearTimer(arrowTimer); arrowTimer = 0;
        if (!ctaArrow || ctaWrap?.hidden || motionPreference.matches || document.hidden) return;
        arrowTimer = later(() => {
          if (Math.random() < .42) {
            ctaArrow.classList.add("is-nudging");
            later(() => ctaArrow.classList.remove("is-nudging"), 480);
          }
          scheduleArrowNudge();
        }, random(9000, 16000));
      };
      const revealCta = () => {
        if (!ctaWrap || ctaWrap.hidden) return;
        const reveal = () => {
          if (destroyed || ctaWrap.hidden) return;
          ctaWrap.classList.add("is-visible");
          if (motionPreference.matches || wasNear) return;
          setState("idle"); setGaze(-2.4, 0);
          ctaLookTimer = later(() => { if (!wasNear && !motionPreference.matches) setState("curious", -4); }, 260);
          ctaReturnTimer = later(() => {
            if (!wasNear && !motionPreference.matches) { setGaze(0, 0); setState("idle"); scheduleIdle(); }
          }, 1660);
        };
        if (motionPreference.matches) reveal();
        else if (window.requestAnimationFrame) window.requestAnimationFrame(reveal);
        else later(reveal, 16);
      };
      const scheduleIdle = () => {
        clearTimer(idleTimer);
        if (motionPreference.matches || document.hidden || wasNear) return;
        idleTimer = later(() => {
          idleTimer = 0;
          const version = behaviorVersion;
          const idleLater = (callback, delay) => later(() => {
            if (version === behaviorVersion && !wasNear && !document.hidden && !motionPreference.matches) callback();
          }, delay, idleActionTimers);
          if (performance.now() - lastActivity > 38000 && Math.random() < .13) {
            setState("sleepy");
            idleLater(() => { setState("idle"); scheduleIdle(); }, random(1100, 2100));
            return;
          }
          const action = Math.random();
          if (action < .52) {
            const x = random(-2.4, 2.4), y = Math.random() < .25 ? random(-1.8, -1) : random(-.5, .8);
            setGaze(x, y);
            if (Math.random() < .38) idleLater(() => setState("curious", random(-6, 6)), random(160, 360));
            if (Math.random() < .22) idleLater(() => setGaze(random(-2, 2), random(-1.5, 1.5)), random(100, 190));
            idleLater(() => { setGaze(0, 0); setState("idle"); }, random(850, 1900));
          } else if (action < .7) blink(Math.random() < .2);
          else if (action < .78) { setState("curious", random(-5, 5)); idleLater(() => setState("idle"), random(500, 1000)); }
          scheduleIdle();
        }, random(2200, 5600));
      };
      const handlePointer = event => {
        if (event.pointerType === "touch" || motionPreference.matches) return;
        const rect = launcher.getBoundingClientRect(), dx = event.clientX - (rect.left + rect.width / 2), dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy), now = performance.now();
        const overCta = Boolean(cta && (cta.contains(event.target) || cta.matches?.(":hover")));
        if (distance < 118 || overCta) {
          lastActivity = now;
          if (!wasNear) { wasNear = true; cancelIdleActions(); cancelCtaLook(); }
          if (!temporaryState) setState("watching");
          setGaze(Math.max(-2.5, Math.min(2.5, dx / 118 * 2.5)), Math.max(-1.8, Math.min(1.8, dy / 118 * 1.8)));
          if (!temporaryState) {
            clearTimer(headTimer);
            headTimer = later(() => { if (wasNear && !temporaryState) avatar.style.setProperty("--orgi-tilt", `${Math.max(-4, Math.min(4, dx / 118 * 4)).toFixed(1)}deg`); }, 110);
          }
          if (!temporaryState && pointer && now - pointerAt > 0 && now - pointerAt < 90 && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) / (now - pointerAt) > 1.05 && distance < 62 && now - lastSurprise > 8500) {
            lastSurprise = now; showTemporaryState("surprised", Math.max(-3, Math.min(3, dx / 118 * 3)), 720);
          }
        } else if (wasNear) {
          wasNear = false; lastActivity = now; clearTimer(headTimer);
          setGaze(0, 0); if (!temporaryState) setState("idle"); scheduleIdle();
        }
        pointer = { x: event.clientX, y: event.clientY }; pointerAt = now;
      };
      const handleEnter = () => {
        if (motionPreference.matches) return;
        lastActivity = performance.now(); wasNear = true; cancelIdleActions();
        showTemporaryState("happy", 0, 680);
      };
      const handleVisibility = () => {
        if (document.hidden) {
          timers.forEach(clearTimeout); timers.clear(); idleActionTimers.clear();
          idleTimer = blinkTimer = headTimer = stateTimer = arrowTimer = ctaLookTimer = ctaReturnTimer = 0; wasNear = false; temporaryState = ""; pointer = null;
          avatar.classList.remove("is-blinking");
          ctaArrow?.classList.remove("is-nudging");
          setGaze(0, 0); setState("idle");
        } else { lastActivity = performance.now(); scheduleBlink(); scheduleIdle(); scheduleArrowNudge(); }
      };
      const handleMotionPreference = () => {
        if (motionPreference.matches) {
          timers.forEach(clearTimeout); timers.clear(); idleActionTimers.clear(); idleTimer = blinkTimer = headTimer = stateTimer = arrowTimer = ctaLookTimer = ctaReturnTimer = 0;
          wasNear = false; temporaryState = ""; pointer = null; avatar.classList.remove("is-blinking"); ctaArrow?.classList.remove("is-nudging"); setGaze(0, 0); setState("idle");
          ctaWrap?.classList.add("is-visible");
        } else { lastActivity = performance.now(); scheduleBlink(); scheduleIdle(); scheduleArrowNudge(); }
      };
      document.addEventListener("pointermove", handlePointer, { passive:true, signal:controller.signal });
      document.addEventListener("visibilitychange", handleVisibility, { signal:controller.signal });
      launcher.addEventListener("pointerenter", handleEnter, { signal:controller.signal });
      launcher.addEventListener("pointerleave", () => { if (!wasNear) { setGaze(0, 0); setState("idle"); } }, { signal:controller.signal });
      motionPreference.addEventListener?.("change", handleMotionPreference, { signal:controller.signal });
      const cleanup = () => {
        if (destroyed) return; destroyed = true; controller.abort(); timers.forEach(clearTimeout); timers.clear(); idleActionTimers.clear();
        avatar.classList.remove("is-blinking"); setGaze(0, 0); setState("idle"); delete avatar.dataset.personalityInitialized;
      };
      window.addEventListener("pagehide", cleanup, { once:true, signal:controller.signal });
      revealCta(); scheduleBlink(); scheduleIdle(); scheduleArrowNudge();
      return cleanup;
    }
    initOrgiPersonality();
