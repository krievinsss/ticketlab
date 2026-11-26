# TicketLab · IT konsultantu birojs

Interaktīvs DBVS uzdevums 3. kursa 4 mācību stundu nodarbībai (160 minūtes). Skolēni ievada vārdu, saņem nejaušu klienta ticketu, aizpilda konsultācijas formu un iesniedz. Skolotājs redz visus darbus, var ieslēgt "klienta pārsteigumu", vērtēt 0–10 punktu skalā, pievienot komentāru un eksportēt CSV.

## Ko students var darīt

1. Atvērt sākuma lapu un izvēlēties **Saņemt savu ticketu**.
2. Ievadīt konsultanta vārdu, grupu un skolotāja iedoto **klases piekļuves kodu**.
3. Saņemt **vienu nejaušu** klienta situāciju (12 scenāriji ar atšķirīgām prasībām).
4. Izvēlēties **MySQL / PostgreSQL / SQLite**, ierakstīt trīs argumentus, salīdzinājumu, riska analīzi, datu integritātes/rezerves kopiju plānu un secinājumu.
5. Saglabāt melnrakstu vai iesniegt gatavu atbildi. Melnraksti saglabājas automātiski.
6. Saglabāt savu **privāto atgriešanās saiti** (ticketu atver bez atsevišķa skolēna konta). Skolēns pēc iesniegšanas nevar mainīt atbildi.
7. Saņemt skolotāja vērtējumu un komentāru savā ticketā.

## Ko skolotājs var darīt

- Pieslēgties no **Skolotājam** sadaļas ar lietotājvārdu un paroli.
- Redzēt konsultantus, grupas, visus ticketus, statusus, iesniegšanas laiku, visas atbildes, vērtējumus.
- Meklēt un filtrēt pēc statusa, vārda, grupas un ticketu koda.
- Ievadīt formatīvo vērtējumu no 0 līdz 10 un atgriezenisko saiti.
- Eksportēt iesniegumus CSV (Excel atverams ar semikola atdalītāju).
- Ieslēgt **Klienta pārsteigumu** — skolēniem parādās sava scenārija jaunā prasība.
- Saglabāt darbu vēsturi Neon PostgreSQL datubāzē.

## Lokālā palaišana (bez Neon)

Nepieciešams **Node.js 20+**. Lokālajai demonstrācijai **npm install nav nepieciešams**.

```bash
npm run dev
```

Atver `http://127.0.0.1:3000`.

**Tikai lokālajā demonstrācijas režīmā**, bez `.env.local` faila:

- Skolotāja lietotājvārds: `skolotajs`
- Skolotāja parole: `DevTeacher123!`
- Klases PIN: `DB2026`

Lokālie ticketi tiek glabāti `data/dev-db.json`, kas ir iekļauts `.gitignore`. Pārstartējot serveri, tie saglabājas. Lokālo režīmu izmanto tikai izstrādei, nevis publiskai skolas nodarbībai.

Ieteicams kopēt `.env.example` uz `.env.local` un iestatīt savas paroles un klases PIN. Atstāj `DATABASE_URL` tukšu, ja vēlies glabāt datus lokāli.

## Publicēšana Vercel + Neon

1. Izveido jaunu PostgreSQL datubāzi [Neon](https://neon.com) un atver SQL Editor.
2. Izpildi projekta `schema.sql` saturu. Tas izveidos `tickets` un `settings` tabulas.
3. Ievieto projekta mapi **privātā GitHub repozitorijā** (neiekļauj `.env.local` vai `data/`).
4. [Vercel](https://vercel.com) importē šo repozitoriju, izvēloties **Framework Preset: Other** un projekta sakni kā **Root Directory**. Izvietojot Vercel instalēs `@neondatabase/serverless`.
5. Vercel projekta Environment Variables iestati:

   | Atslēga | Nozīme |
   |---|---|
   | `DATABASE_URL` | Neon PostgreSQL savienojuma virkne |
   | `ADMIN_USERNAME` | Skolotāja lietotājvārds |
   | `ADMIN_PASSWORD` | Garā, unikālā skolotāja parole |
   | `SESSION_SECRET` | Nejauša 32+ simbolu virkne HMAC sesiju parakstīšanai |
   | `CLASS_PIN` | Nodarbības kods skolēniem, nevis admin parole |

6. Pārliecinies, ka izvietojumam ir pieejama gan statiskā sākuma lapa, gan funkcija `/api/index` (pārbaude: `/api/index?op=health`).
7. Veic **jaunu deployment**, ja vides mainīgie tika pievienoti pēc iepriekšējās izvietošanas.
8. Testē: izveido vienu ticketu kā skolēns → saglabā → iesniedz → pieslēdzies kā skolotājs → piešķir vērtējumu.

**Svarīgi:** Vercel serverless funkcijām nav piemērota lokāla JSON faila datubāze. Kodā ir drošības pārbaude, kas Vercel nepieļauj startu bez `DATABASE_URL`.

Neon vaicājumi tiek izpildīti ar parametrizētiem pieprasījumiem. Paroles un privātās DB piekļuves virknes nekad neliec frontend kodā un nepublicē GitHub.

## Arhitektūra

```text
public/index.html    — statiskā lapa
public/styles.css    — responsīvs noformējums
public/app.js        — skolēna un admin saskarne (vanilla JS)
api/index.js         — Vercel Node.js Function
src/core.js          — HTTP API, validācija, admin sesijas, drošība
src/store.js         — Neon Postgres vai lokālā JSON datubāze
src/cases.js         — 12 klientu situācijas un jaunās prasības
schema.sql           — DB sākotnējā shēma
dev.mjs              — lokālais attīstības serveris
```

## Piezīmes par privātumu un drošību

- Jauniešiem nav jāreģistrējas ar e-pastu. Vārdus/segvārdus un grupas redz tikai skolotājs.
- Students atver savu ticketu ar **slepeno saiti**; ja šo saiti pārsūta citam, tas var piekļūt konkrētajam uzdevumam. Iesaki saites neizpaust.
- Admin paneļa piekļuvi aizsargā servera pārbaudīta parole un parakstīta `HttpOnly` sesijas sīkdatne.
- Formas tiek validētas serverī. Admin CSV eksports pieejams tikai autentificētai skolotāja sesijai.
- Pirms publiskas lietošanas ar reāliem skolēniem jāpārskata personas datu glabāšanas politika, datu dzēšanas termiņi un jāievieš rate limiting/brute-force aizsardzība piekļuves un ticketu izveides galapunktiem. Šī ir pilotversija, nevis pilnībā auditēta skolas informācijas sistēma.

## Stundas scenārijs — 4 × 40 min

| Minūtes | Aktivitāte |
|---|---|
| 0–25 | Skolotāja DBVS prezentācija + saruna |
| 25–60 | Komandas veido DBVS reklāmas prezentācijas |
| 60–90 | Komandu prezentācijas, jautājumi un balsošana |
| 90–100 | DBVS mīti vai fakti? |
| 100–110 | Paskaidro TicketLab un klases kodu |
| 110–140 | Katrs ģenerē ticketu un aizpilda konsultāciju |
| 140–150 | Aktivizē "Klienta pārsteigumu" (ja ir laiks) |
| 150–160 | Apspriež risinājumus un reflektē |

Ja grupa ir liela, samazini komandu prezentāciju laiku vai pārcel daļu uz nākamo nodarbību.

## Testēšana

```bash
npm test
```

Pārbauda ievades validāciju un CSV eksporta drošību. Lokāli papildus var pārbaudīt API manuāli ar `curl`.


## Jaunums: neierobežotas klientu izmaiņu kārtas

Katram esošajam ticketam var piešķirt vairākus secīgus klienta papildpieprasījumus.
Skolotāja panelī izvēlies konkrētu ticketu, līmeni (**viegls / vidējs / sarežģīts**) un:
- spied **Ieteikt šī klienta situācijai**, lai iegūtu konkrētajam scenārijam pielāgotu uzdevumu;
- vai ieraksti savus norādījumus;
- vai atstāj virsrakstu/aprakstu tukšu — serveris ģenerēs individuālu uzdevumu atbilstoši katra ticketam.
- vari atzīmēt **Visiem esošajiem ticketiem**; jaunās prasības tiks pievienotas katram pašreizējam jaunietim, neizveidojot jaunus ticketus.

Skolēns atgriežas pie sava esošā ticketa ar **to pašu privāto saiti**.
Viņš redz **klienta izmaiņu vēsturi**, saglabā katras kārtas melnrakstu un iesniedz
katru prasību neatkarīgi, arī pēc sākotnējās konsultācijas novērtēšanas.

**Datu saglabāšana:** jaunās prasības ieraksta tikai `ticket_changes` tabulā.
Sākotnējie `tickets.answers`, `grade`, `feedback`, `status`, skolēnu saites un
iepriekšējās klienta prasības nemainās. Vecais globālais "Klienta pārsteigums"
ir atstāts saderībai ar iepriekšējiem darbiem.

### Obligāta Neon datubāzes migrācija pirms izvietošanas

1. **Izveido Neon datubāzes rezerves kopiju / branch** pirms izmaiņām.
2. Neon SQL Editor izvēlies **TicketLab `DATABASE_URL`**, nevis SQL Lab datubāzi.
3. Izpildi `migrations/001_ticket_changes.sql` (vai atjaunināto `schema.sql`).
4. Pārliecinies, ka `SELECT to_regclass('public.ticket_changes');` atgriež `ticket_changes`.
5. Tad izvieto šo kodu Vercel (merge PR / redeploy).

Migrācija izmanto tikai `CREATE TABLE IF NOT EXISTS` un jaunu indeksu.
Tajā nav neviena `DROP`, `TRUNCATE` vai esošo `tickets` ierakstu `UPDATE`.

**Piezīme par SQL Lab datiem:** TicketLab izmaiņu piešķiršana pati par sevi
nemaina skolēna MySQL/PostgreSQL/SQLite datubāzi. Sarežģītajos uzdevumos skolēnam
pirms shēmas pārveides jāsaglabā kopija un jāizmanto droša datu migrācija,
nevis jādzēš tabulas. TicketLab nevar automātiski novērst datu zudumu, ja
skolēns pats SQL Lab izpilda destruktīvus SQL vaicājumus.

### API

- `POST ?op=change-preview` — skolotājam ģenerē ieteikumu (`code,difficulty`).
- `POST ?op=issue-change` — skolotājam pievieno 1 vai visiem esošajiem ticketiem
  (`code,difficulty,all,title,description`).
- `POST ?op=save-change` — tikai privātās ticketa saites īpašniekam
  (`code,token,changeId,response,submit`).
- `POST ?op=ticket` / `GET ?op=admin-list` — tagad satur arī `ticket.changes` vēsturi.

Šis papildinājums neprasa jaunus Vercel vides mainīgos.
