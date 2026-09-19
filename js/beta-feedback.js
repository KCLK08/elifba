(function (global) {
  const BETA_SETTINGS_KEY = "elifba.settings.betaTestMode";
  const BETA_ISSUE_LABELS = {
    audio: "Audio",
    letters: "Buchstaben",
    both: "Audio & Buchstaben"
  };

  function readBetaTestMode() {
    return localStorage.getItem(BETA_SETTINGS_KEY) === "true";
  }

  function saveBetaTestMode(enabled) {
    localStorage.setItem(BETA_SETTINGS_KEY, enabled ? "true" : "false");
  }

  global.createElifbaBetaFeedback = function createElifbaBetaFeedback(ctx) {
    let betaTestMode = readBetaTestMode();
    let betaPhase = "marking";
    const betaIssues = {};
    let controlsEl = null;
    let issueModalEl = null;
    let reportModalEl = null;
    let draftCategory = "audio";
    let draftNote = "";
    let activeCardIdx = null;

    function getCardId(idx) {
      if (!Number.isFinite(idx)) return null;
      return ctx.progressId ? `${ctx.progressId}-card-${idx + 1}` : `card-${idx + 1}`;
    }

    function getAudioId(idx) {
      if (!ctx.progressId || !Number.isFinite(idx)) return null;
      return `${ctx.progressId}-${idx + 1}`;
    }

    function isActive() {
      return betaTestMode && Boolean(ctx.progressId) && !ctx.isRepeatMode();
    }

    function issueCount() {
      return Object.keys(betaIssues).length;
    }

    function isCardMarked(idx) {
      const id = getCardId(idx);
      return id ? Boolean(betaIssues[id]) : false;
    }

    function formatReport() {
      const title = document.querySelector(".header h1")?.textContent?.trim() || ctx.progressId || "Übung";
      const lessonMatch = ctx.progressId ? ctx.progressId.match(/-l(\d+)/) : null;
      const lessonId = lessonMatch ? `lesson-${lessonMatch[1]}` : "—";
      const issues = Object.values(betaIssues).sort(
        (a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime()
      );
      const lines = [
        "# Elifba Lernweg — Betatest-Report",
        "",
        `Erstellt: ${new Date().toLocaleString("de-DE")}`,
        `Übung: ${ctx.progressId || "—"} — ${title}`,
        `Lektion: ${lessonId}`,
        `Gemeldete Karten: ${issues.length}`,
        "",
        "---",
        ""
      ];
      if (!issues.length) {
        lines.push("Keine Karten markiert.");
      } else {
        issues.forEach((issue, index) => {
          lines.push(`## ${index + 1}. ${issue.cardId}`);
          lines.push(`Arabisch: ${issue.arabic}`);
          lines.push(`Audio-ID: ${issue.audioId ?? "—"}`);
          lines.push(`Problem: ${BETA_ISSUE_LABELS[issue.category]}`);
          if (issue.note.trim()) lines.push(`Notiz: ${issue.note.trim()}`);
          lines.push("");
        });
      }
      lines.push("---");
      lines.push("Bitte diesen Report an das Entwicklungsteam senden. Danke!");
      return lines.join("\n");
    }

    async function shareReport(text) {
      try {
        if (navigator.share) {
          await navigator.share({ title: "Elifba Betatest-Report", text });
          return "shared";
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return "copied";
        }
      } catch (err) {
        return "failed";
      }
      return "failed";
    }

    function ensureControls() {
      if (controlsEl) return controlsEl;
      const host = document.querySelector(".trainer-card");
      const anchor = document.getElementById("progress-bar");
      if (!host || !anchor) return null;
      controlsEl = document.createElement("div");
      controlsEl.id = "beta-feedback";
      controlsEl.className = "beta-feedback";
      controlsEl.hidden = true;
      controlsEl.innerHTML = `
        <p class="beta-feedback-label">Betatest</p>
        <button type="button" class="beta-feedback-primary" id="beta-primary-btn">Markieren</button>
        <p class="beta-feedback-hint" id="beta-feedback-hint">Aktuelle Karte markieren, wenn etwas falsch ist.</p>
        <button type="button" class="beta-feedback-link" id="beta-phase-btn" hidden></button>
      `;
      anchor.insertAdjacentElement("afterend", controlsEl);

      controlsEl.querySelector("#beta-primary-btn").addEventListener("click", () => {
        if (betaPhase === "finish") {
          openReportModal();
          return;
        }
        const idx = ctx.getCurrentIdx();
        if (idx == null) return;
        openIssueModal(idx);
      });

      controlsEl.querySelector("#beta-phase-btn").addEventListener("click", () => {
        if (betaPhase === "marking" && issueCount() > 0) {
          betaPhase = "finish";
        } else {
          betaPhase = "marking";
        }
        refreshControls();
      });

      return controlsEl;
    }

    function refreshControls() {
      ensureControls();
      if (!controlsEl) return;
      controlsEl.hidden = !isActive();
      if (!isActive()) return;

      const count = issueCount();
      const primaryBtn = controlsEl.querySelector("#beta-primary-btn");
      const hintEl = controlsEl.querySelector("#beta-feedback-hint");
      const phaseBtn = controlsEl.querySelector("#beta-phase-btn");

      if (betaPhase === "finish") {
        primaryBtn.textContent = `Abschließen (${count})`;
        hintEl.hidden = true;
        phaseBtn.hidden = false;
        phaseBtn.textContent = "Weitere Karte markieren";
      } else {
        primaryBtn.textContent = "Markieren";
        phaseBtn.hidden = count === 0;
        phaseBtn.textContent = count > 0 ? `Fertig — Report erstellen (${count})` : "";
        hintEl.hidden = count > 0;
      }
    }

    function buildIssueModal() {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay beta-modal";
      overlay.innerHTML = `
        <div class="modal">
          <p class="modal-eyebrow">Betatest</p>
          <h2 class="modal-title">Was ist falsch?</h2>
          <p class="modal-text" id="beta-issue-card"></p>
          <div class="modal-group">
            <p class="modal-subtitle">Problem</p>
            <div class="modal-inline">
              <button class="modal-btn ghost option-btn" type="button" data-beta-category="audio">Audio</button>
              <button class="modal-btn ghost option-btn" type="button" data-beta-category="letters">Buchstaben</button>
              <button class="modal-btn ghost option-btn" type="button" data-beta-category="both">Audio &amp; Buchstaben</button>
            </div>
          </div>
          <label class="beta-note-label" for="beta-issue-note">Kurzbeschreibung (optional)</label>
          <textarea id="beta-issue-note" class="beta-note-input" rows="3" placeholder="z. B. Audio knistert / falscher Buchstabe …"></textarea>
          <div class="modal-actions-row">
            <button class="modal-btn ghost" type="button" data-beta-action="cancel">Abbrechen</button>
            <button class="modal-btn danger beta-remove-btn" type="button" data-beta-action="remove" hidden>Markierung entfernen</button>
            <button class="modal-btn primary" type="button" data-beta-action="save">Karte markieren</button>
          </div>
        </div>
      `;

      function updateCategoryButtons() {
        overlay.querySelectorAll("[data-beta-category]").forEach((btn) => {
          btn.classList.toggle("active", btn.getAttribute("data-beta-category") === draftCategory);
        });
      }

      overlay.querySelectorAll("[data-beta-category]").forEach((btn) => {
        btn.addEventListener("click", () => {
          draftCategory = btn.getAttribute("data-beta-category");
          updateCategoryButtons();
        });
      });

      overlay.querySelector('[data-beta-action="cancel"]').addEventListener("click", () => {
        overlay.classList.remove("visible");
        activeCardIdx = null;
      });

      overlay.querySelector('[data-beta-action="save"]').addEventListener("click", () => {
        if (activeCardIdx == null) return;
        const cardId = getCardId(activeCardIdx);
        if (!cardId) return;
        betaIssues[cardId] = {
          cardId,
          arabic: ctx.getArabic(activeCardIdx),
          audioId: getAudioId(activeCardIdx),
          category: draftCategory,
          note: overlay.querySelector("#beta-issue-note").value.trim(),
          markedAt: new Date().toISOString()
        };
        overlay.classList.remove("visible");
        activeCardIdx = null;
        ctx.onChange();
      });

      overlay.querySelector('[data-beta-action="remove"]').addEventListener("click", () => {
        if (activeCardIdx == null) return;
        const cardId = getCardId(activeCardIdx);
        if (cardId) delete betaIssues[cardId];
        overlay.classList.remove("visible");
        activeCardIdx = null;
        ctx.onChange();
      });

      overlay.__updateCategoryButtons = updateCategoryButtons;
      document.body.appendChild(overlay);
      return overlay;
    }

    function openIssueModal(idx) {
      if (!issueModalEl) issueModalEl = buildIssueModal();
      activeCardIdx = idx;
      const cardId = getCardId(idx);
      const existing = cardId ? betaIssues[cardId] : null;
      draftCategory = existing?.category || "audio";
      draftNote = existing?.note || "";
      issueModalEl.querySelector("#beta-issue-card").textContent = `Karte: ${ctx.getArabic(idx)}`;
      issueModalEl.querySelector("#beta-issue-note").value = draftNote;
      issueModalEl.querySelector(".beta-remove-btn").hidden = !existing;
      issueModalEl.querySelector('[data-beta-action="save"]').textContent = existing
        ? "Markierung speichern"
        : "Karte markieren";
      issueModalEl.__updateCategoryButtons();
      issueModalEl.classList.add("visible");
    }

    function buildReportModal() {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay beta-modal";
      overlay.innerHTML = `
        <div class="modal">
          <p class="modal-eyebrow">Betatest</p>
          <h2 class="modal-title">Betatest-Report</h2>
          <p class="modal-text" id="beta-report-summary"></p>
          <pre class="beta-report-preview" id="beta-report-preview"></pre>
          <p class="beta-report-status" id="beta-report-status" hidden></p>
          <div class="modal-actions-row">
            <button class="modal-btn ghost" type="button" data-beta-action="close">Fertig</button>
            <button class="modal-btn primary" type="button" data-beta-action="share">Report teilen / kopieren</button>
          </div>
        </div>
      `;

      overlay.querySelector('[data-beta-action="close"]').addEventListener("click", () => {
        overlay.classList.remove("visible");
        betaPhase = "marking";
        refreshControls();
      });

      overlay.querySelector('[data-beta-action="share"]').addEventListener("click", async () => {
        const text = formatReport();
        const result = await shareReport(text);
        const statusEl = overlay.querySelector("#beta-report-status");
        statusEl.hidden = false;
        if (result === "shared") {
          statusEl.textContent = "Report geteilt — danke!";
          statusEl.className = "beta-report-status success";
        } else if (result === "copied") {
          statusEl.textContent = "Report in Zwischenablage kopiert — bitte einfügen und senden.";
          statusEl.className = "beta-report-status success";
        } else {
          statusEl.textContent = "Teilen fehlgeschlagen — Text oben markieren und manuell kopieren.";
          statusEl.className = "beta-report-status error";
        }
      });

      document.body.appendChild(overlay);
      return overlay;
    }

    function openReportModal() {
      if (!reportModalEl) reportModalEl = buildReportModal();
      const count = issueCount();
      const text = formatReport();
      reportModalEl.querySelector("#beta-report-summary").textContent =
        `${count} Karte(n) gemeldet — bitte an das Team senden.`;
      reportModalEl.querySelector("#beta-report-preview").textContent = text;
      reportModalEl.querySelector("#beta-report-status").hidden = true;
      reportModalEl.classList.add("visible");
    }

    return {
      readBetaTestMode,
      saveBetaTestMode,
      getBetaTestMode: () => betaTestMode,
      setBetaTestMode: (enabled) => {
        betaTestMode = enabled;
        saveBetaTestMode(enabled);
        if (!enabled) {
          betaPhase = "marking";
          Object.keys(betaIssues).forEach((key) => delete betaIssues[key]);
        }
        refreshControls();
        ctx.onChange();
      },
      isActive,
      isCardMarked,
      refreshControls,
      refreshLetterState: (letterEl, idx) => {
        if (!letterEl) return;
        const marked = isActive() && isCardMarked(idx);
        letterEl.classList.toggle("beta-marked", marked);
        let note = letterEl.parentElement?.querySelector(".beta-marked-note");
        if (marked) {
          if (!note) {
            note = document.createElement("p");
            note.className = "beta-marked-note";
            note.textContent = "Gemeldet im Betatest";
            letterEl.insertAdjacentElement("afterend", note);
          }
        } else if (note) {
          note.remove();
        }
      },
      progressSegClass: (idx) => (isActive() && isCardMarked(idx) ? " marked" : "")
    };
  };
})(window);
