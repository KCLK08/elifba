# Phase 4 – Kids UX: Elifba Kids

**Status:** Abgeschlossen  
**Datum:** 2026-07-18  
**Grundlage:** Phase 1–3 Dokumente  
**Code-Root:** `mobile/`

> Phase 4 macht aus dem Trainer eine **kindgerechte Lern-App**: Onboarding, Profile, Home, Lernpfad, Belohnungsbasis, Trainer-Polish, bessere arabische Darstellung.  
> **Nicht** enthalten: komplexe Gamification, Eltern-PIN, Content L4–12.

---

## 1. Onboarding

**Route:** `/onboarding` (`app/onboarding.tsx`)  
**Feature:** `src/features/profile/OnboardingScreen.tsx`

Flow:
1. Name eingeben  
2. Avatar wählen (🦊🦉🐱🐦⭐)  
3. Profil lokal speichern → Home  

Redirect in `app/index.tsx`: keine Profile → Onboarding, sonst Home.

Kein Login / keine Cloud.

---

## 2. Profile

**Store:** `src/store/profileStore.ts`

| Fähigkeit | Beschreibung |
|-----------|--------------|
| Mehrere Profile | `profiles[]` in AsyncStorage |
| Anlegen | `createProfile({ name, avatar })` |
| Wechseln | `setActiveProfile(id)` |
| UI | `ProfileSwitcher` im Profil-Tab |

Fortschritt und Rewards sind **pro `profileId`** getrennt (Progress-Keys / Rewards-Map).

---

## 3. Home UX

`app/(tabs)/home.tsx`

- Begrüßung + Avatar  
- `RewardsStrip` (Sterne + Serie)  
- Große **Weiterlernen**-Karte mit Lernziel, Preview-Buchstabe, Progress  
- Freundlicher Tipp-Text  

---

## 4. Lernpfad

Komponenten unter `src/features/learning/path/`:

| Komponente | Rolle |
|------------|--------|
| `LessonNode` | Karte mit Ring, Titel, Status |
| `ProgressRing` | SVG-Fortschrittskreis |
| `LockState` | ⭐ / ▶️ / 🔒 |
| `resolveLessonState` | lineare Freischaltung |

**Regel:** Lektion 1 offen; nächste Lektion erst wenn vorherige **100 %**.  
Aktuelle Lektion: leichter Pulse (Reanimated).

---

## 5. Reward-System (Basis)

`src/store/rewardsStore.ts` + `src/features/rewards/`

| Event | Sterne | UI |
|-------|-------:|-----|
| `exerciseCompleted` | +3 | CelebrationModal |
| `lessonCompleted` | +5 | CelebrationModal |
| tägliches Lernen | Streak++ | Home-Strip |

Idempotent über `awardedExercises` / `awardedLessons`.  
**Keine** Badges, Leaderboards, Shop.

---

## 6. Trainer Polish

- Kartenwechsel mit Zoom/Fade (`ArabicLetterView`)  
- Feedback-Texte: „Toll!“ / freundliches „Nochmal“ (kein negatives Framing)  
- Button-Labels klarer (`Richtig ✓`, Ghost für Nochmal)  
- Celebration bei Abschluss  

---

## 7. Arabische Darstellung

`src/features/learning/arabic/`

- RTL (`writingDirection` + `direction: 'rtl'`)  
- Highlight via `target` **und** `highlightMode` (`initial` / `middle` / `final`)  
- Tags: lispel (blau), accentGreen  
- Font: vorbereitet (System-Bold); Custom-Font kann später per `expo-font` geladen werden  

---

## 8. UX-Entscheidungen

1. Onboarding vor Tabs – kein Default-„Yusuf“ mehr ohne Zustimmung.  
2. Linearer Pfad statt freier Freischaltung (Motivation + Klarheit).  
3. Belohnung positiv und sparsam.  
4. Elternbereich unverändert (Long-Press) – nicht Fokus von Phase 4.  

---

## 9. Offene Punkte (Phase 5+)

- Custom arabische Fonts bundlen  
- Audio-Click-Feedback / Haptics  
- Onboarding beim „Neues Kind“ ohne Stack-History-Konflikt  
- Streak-Timezone / Mitternacht-Kante  
- Design-Tokens Animation-Presets zentralisieren  

---

*Ende Phase-4-Dokumentation. Nicht mit Phase 5 beginnen ohne Freigabe.*
