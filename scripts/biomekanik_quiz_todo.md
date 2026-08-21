# TODO: nytt quiz-ämne "Biomekanik" (MC + TF) under Allmänt

**Status:** planerat, INTE påbörjat. Skapad 2026-08-21 på användarens begäran
("lägg upp en todo, gör inget annat än"). Ingen datafil, ingen inkoppling och
inget frågeunderlag är skrivet — den här filen är bara facit för bygget.

**Läs före bygget:** `CLAUDE_REGLER.md` §2 (hela frågekonstruktionen, särskilt
§2.3 MC, §2.4 TF, §2.9 formtellar, §2.11 unikhet inom ämnet, §2.12 distraktorer,
§2.13 validatorn, §2.14 manuell genomläsning), §3.2 + §3.2d (källor, och att de
ska föras in i `info.html`), §4 (databasstruktur, filnamn, en fråga = ett objekt).

---

## 1. Vad ämnet ska vara

Biomekanik = **kraft, moment och belastning på rörelseapparaten** — hur leder,
muskler och senor beter sig mekaniskt. Inte samma sak som ämnena som redan finns:

| Befintligt ämne | Vad det täcker | Gränsen mot biomekanik |
|---|---|---|
| `lagen_rorelser_riktningar` (Allmänt, MC) | Namn på lägen, rörelser och riktningar | Biomekanik frågar om *krafterna* i rörelsen, inte om vad rörelsen heter |
| `ergonomi` (arbetsterapeut, MC+FC) | Arbetsställning, hjälpmedel, arbetsmiljö | Biomekanik är den mekaniska grunden, inte tillämpningen i arbetslivet |
| `osteologi_allmant` / `muskler` | Vad strukturerna heter och var de sitter | Biomekanik frågar vad de gör mekaniskt |

**Mätt läge 2026-08-21:** ordet "biomekanik" förekommer i **två** frågor i hela
`data/` (en ergonomidefinition i `tentaplugg.json`, en ren träff i
`studenters_flashcards.json`). Ämnet är alltså i praktiken otäckt — inget
befintligt material behöver flyttas eller slås ihop.

### Utkast till innehållsområden (ska stämmas av innan frågeskrivningen börjar)

- Kraft, vektorer, resultant och kraftkomposant
- Vridmoment, hävarm och momentarm
- Hävstångstyper (I, II, III) och var de sitter i kroppen
- Tyngdpunkt, understödsyta, jämvikt och stabilitet
- Newtons lagar tillämpade på rörelseapparaten
- Ledmekanik: rullning, glidning, snurrning; momentan rotationsaxel
- Muskelmekanik: kraft–längd, kraft–hastighet, koncentrisk/excentrisk/isometrisk
- Materialmekanik i vävnad: stress/strain, elasticitet, viskoelasticitet, krypning
- Belastningstyper: tryck, drag, böj, vrid, skjuv — och typiska skademönster
- Gånganalys: gångcykelns faser, markreaktionskraft, ledbelastning
- Lyftteknik och ryggens belastning (mekaniskt, inte som ergonomiråd)

---

## 2. Placering och namn

- **Utbildning:** Allmänt → `data-edu="ovrigt"` i `index.html`.
- **Synlig etikett:** `Biomekanik (MC+TF)`.
- **Ordning:** Allmänt-blocket är alfabetiskt — `Biomekanik` hamnar **överst**,
  före `Farmakologi (FC)`.
- **Topic-id:** `biomekanik`.
- **Datafil:** `data/biomekanik.json` (§4.5).
- **Id-prefix:** `bim_q1…` (samma mönster som `fya_q`, `osa_q`, `mta_q`, `lrr_q`).

---

## 3. Inkoppling — checklista för bygget

Förlagor: 0.9.411 (Osteologi) och 0.9.414 (Fysiologi), båda enämnesbyggen under
Allmänt.

- [ ] `data/biomekanik.json` — nya frågor, `topic: "biomekanik"`
- [ ] `js/app.js` → `getQuestionsPath()`: `if (topic === 'biomekanik') return './data/biomekanik.json'`
- [ ] `index.html` → `<option value="biomekanik" data-edu="ovrigt">Biomekanik (MC+TF)</option>` i Allmänt-blocket
- [ ] `js/info.js` → raden i frågestatistiken (`{ label: 'Biomekanik', file: './data/biomekanik.json' }`)
- [ ] Cachebusters på `js/app.js` (`index.html`) och `js/info.js` (`info.html`)
- [ ] `VERSION` + `CHANGELOG.md`
- [ ] Källorna in i `info.html` (§3.2d) — hellre för många än för få, APA 7, aldrig gissade bibliografiska data

---

## 4. Kvalitetskrav som är särskilda för det här ämnet

- **TF-balansen mäts per ämne, inte per fil (§2.4).** Mål 40–60 % `Sant`. Falska
  påståenden görs genom ett **konkret byte** (fel hävstångstyp, fel momentarm,
  fel riktning på kraften) — aldrig genom att stoppa in "inte" och aldrig genom
  en hård avgränsning (`endast`, `alltid`, `bara`), som blir en egen genväg.
- **`"type": "tf"` måste sättas** — en tvåalternativsfråga märkt `mc` faller ur
  båda poolerna i `js/app.js` och dras aldrig.
- **TF-taket i `js/app.js` är ~10 % av en runda** när MC också ingår. Ett ämne
  som ska kännas som MC+TF behöver alltså tillräckligt många MC-frågor för att
  TF-andelen ska bli meningsfull i en runda om 10–20 frågor.
- **Siffror och enheter är formtellar här.** Ett ämne med mycket tal drar lätt på
  sig distraktorer som är osannolika på formen (avrundade tior mot ett exakt
  svar). Läs §2.9 innan talfrågorna skrivs.
- **Validatorn körs efter varje ändring:** `python3 scripts/validate_quiz.py`.
  Utöver den mäts för hand: längdbias, omvänd andel, absolut-ord i distraktorer,
  dubbletter inom ämnet, TF-balans. Sedan manuell isolerad genomläsning (§2.14).

---

## 5. Öppna frågor till användaren (besluta INNAN frågeskrivningen)

1. **Antal frågor och fördelning?** Förlagorna ligger på 100 MC (Fysiologi,
   Osteologi) respektive 200 (Medicinsk terminologi). Förslag: **100 MC + 30 TF**.
2. **Innehållsavgränsningen i §1** — ska gånganalys och lyftteknik ingå, eller
   hålls ämnet till ren grundmekanik?
3. **Nivå:** grundnivå för vård- och rehabprogram, eller djupare (momentberäkning
   med tal, kraft–längd-kurvor)?
4. **Källor:** vilka kursböcker ska ligga till grund? Nordin & Frankel, *Basic
   biomechanics of the musculoskeletal system*, är standardverket — bekräfta
   upplaga innan den skrivs in i `info.html`.
