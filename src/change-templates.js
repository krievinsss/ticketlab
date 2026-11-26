// Skolotāja ieteikumi jaunām klientu prasībām. Skolēniem automātiski netiek atklāti.
export const changeLevels = Object.freeze({
  easy: {label:'Viegls', explanation:'Viena vai divu lauku / ierobežojumu papildināšana'},
  medium: {label:'Vidējs', explanation:'Jauna tabula, relācija vai biznesa noteikums'},
  hard: {label:'Sarežģīts', explanation:'Struktūras pārveide un esošo datu migrācija'}
});

const scenarios = {
  'offline-notes': {
    easy: ['Piezīmju kategorijas', 'Lietotājs vēlas katrai piezīmei norādīt kategoriju un svarīguma pakāpi. Papildini esošo datu modeli, nezaudējot jau izveidotās piezīmes.'],
    medium: ['Piezīmju koplietošana', 'Vienu piezīmi drīkst kopīgot ar vairākiem lietotājiem, katram piešķirot lasīšanas vai rediģēšanas tiesības. Izveido atbilstošās relācijas un ierobežojumus.'],
    hard: ['Vairāku ierīču sinhronizācija', 'No lokālas viena lietotāja glabātuves jāpāriet uz vairāku lietotāju un ierīču sinhronizāciju ar izmaiņu vēsturi. Pārprojektē vajadzīgās relācijas un izstrādā plānu veco piezīmju migrācijai.']
  },
  'school-register': {
    easy: ['Atzīmes labojuma pamatojums', 'Skolotājiem jāspēj pievienot atzīmes labojuma iemeslu. Esošās atzīmes un skolēnu ieraksti jāsaglabā.'],
    medium: ['Skolēnu dalība vairākās grupās', 'Viens skolēns var apgūt vairākus izvēles kursus, un kursā var būt daudzi skolēni. Ievies korektu daudzi-pret-daudziem relāciju.'],
    hard: ['Vairāku skolu datu modelis', 'Platformai pievienojas vēl piecas skolas. Pārveido struktūru, lai katras skolas klases, skolotāji un skolēni būtu nodalīti, saglabājot esošās atzīmes un kavējumu vēsturi.']
  },
  webshop: {
    easy: ['Produktu pieejamības statuss', 'Katram produktam nepieciešams statuss: pieejams, nav pieejams vai arhivēts. Nodrošini derīgās vērtības un saglabā esošos produktus.'],
    medium: ['Noliktavas kustību vēsture', 'Klients vēlas reģistrēt katru produktu papildināšanu un izsniegšanu. Papildini datubāzi ar kustību uzskaiti, sasaisti to ar produktiem un aizliedz nepamatotus daudzumus.'],
    hard: ['Vairākas noliktavas un atlikumi', 'Veikals atver vēl divas noliktavas. Produktu atlikumi tagad jāuzskaita pa noliktavām, saglabājot esošos pasūtījumus un preču atlikumu vēsturi. Pārveido struktūru un migrē iepriekšējos atlikumus.']
  },
  warehouse: {
    easy: ['Minimālais krājumu līmenis', 'Katram produktam jāpievieno minimālā krājuma robeža. Tā nevar būt negatīva, un esošie krājumi jāsaglabā.'],
    medium: ['Preču pārvietošana', 'Preces pārvieto starp noliktavām. Veido pārvietošanas uzskaiti ar avota un saņēmēja noliktavu un korektu saiti uz produktu.'],
    hard: ['Krājumu sadalīšana partijās', 'Katrs produkts turpmāk glabājams vairākās piegādes partijās ar derīguma termiņu. Pārveido krājumu shēmu un pārvieto esošos atlikumus uz sākotnējām partijām bez datu zuduma.']
  },
  library: {
    easy: ['Grāmatu eksemplāru stāvoklis', 'Katram fiziskajam grāmatas eksemplāram jānorāda stāvoklis. Pieļauj tikai definētas vērtības, saglabājot esošos izsniegumus.'],
    medium: ['Grāmatu rezervācijas', 'Lasītāji var iestāties rindā uz izsniegtu grāmatas eksemplāru. Modelē rezervācijas un neļauj tam pašam lasītājam atkārtoti rezervēt to pašu eksemplāru aktīvā rindā.'],
    hard: ['Bibliotēku filiāļu tīkls', 'Bibliotēka atver filiāles. Eksemplāri tagad pieder konkrētai filiālei un var pārvietoties, nezaudējot izsniegšanas vēsturi. Pārveido struktūru un migrē esošos eksemplārus.']
  },
  'game-scores': {
    easy: ['Spēļu līmeņi', 'Katram rezultātam jāglabā līmenis un sasniegšanas datums. Esošie rezultāti nedrīkst pazust.'],
    medium: ['Turnīru sistēma', 'Katrs spēlētājs var piedalīties vairākos turnīros. Saglabā dalības saites un rezultātus katrā turnīrā.'],
    hard: ['Tiešsaistes līderu saraksts', 'Spēle kļūst par vairāku lietotāju platformu ar sezonām un spēlētāju kontiem. Pārstrukturē lokālo rezultātu glabāšanu, saglabājot veco līderu sarakstu un vēsturiskos rekordus.']
  },
  rentals: {
    easy: ['Velosipēdu tehniskais stāvoklis', 'Velosipēdiem jāpievieno tehniskā stāvokļa statuss ar atļautām vērtībām. Saglabā nomas vēsturi.'],
    medium: ['Apkopes pieraksti', 'Mehāniķi reģistrē katra velosipēda apkopes un nomainītās detaļas. Izveido relācijas un nodrošini, ka apkope nevar atsaukties uz neeksistējošu velosipēdu.'],
    hard: ['Nomas punkti vairākās pilsētās', 'Velosipēdi pārvietojas starp nomas punktiem dažādās pilsētās. Pārprojektē glabāšanas vietu un nomu modeli, saglabājot esošos klientus, rezervācijas un nomas vēsturi.']
  },
  'school-music': {
    easy: ['Dziesmu garuma ierobežojums', 'Rindai drīkst pievienot tikai dziesmas ar derīgu ilgumu. Saglabā iepriekšējās dziesmas un atskaņošanas vēsturi.'],
    medium: ['Kabinetu atsevišķās rindas', 'Katrā kabinetā jābūt savai dziesmu rindai. Saisti rindas ierakstus ar kabinetiem, neizdzēšot esošo atskaņošanas vēsturi.'],
    hard: ['Lietotāju kvotas un abonementi', 'Sistēma ievieš dažādus lietotāju plānus un dienas limitus katram kabinetam. Pārstrukturē lietotāju, kvotu un atskaņošanas ierakstus, saglabājot iepriekšējo vēsturi.']
  },
  events: {
    easy: ['Biļešu kategorijas', 'Biļetēm jāpievieno kategorija un derīga cena. Esošās rezervācijas nedrīkst pazust.'],
    medium: ['Konkrētu sēdvietu izvēle', 'Pasākumiem ir numurētas sēdvietas. Izveido relācijas, lai vienu sēdvietu konkrētā pasākumā nevarētu pārdot divas reizes.'],
    hard: ['Vairāki organizatori un vietu plāni', 'Platforma apkalpos daudzus organizatorus un dažādas zāles ar atšķirīgiem sēdvietu plāniem. Pārveido shēmu, migrējot esošos pasākumus, rezervācijas un biļetes.']
  },
  portfolio: {
    easy: ['Projektu publicēšanas statuss', 'Katra portfeļa projektam jāglabā publicēšanas statuss un datums. Saglabā jau publicētos ierakstus.'],
    medium: ['Projekta autori', 'Vienam projektam var būt vairāki autori, un viens autors strādā pie vairākiem projektiem. Izveido piemērotas saites un ierobežojumus.'],
    hard: ['Daudzu klientu CMS', 'No viena dizainera portfolio jāpāriet uz aģentūras sistēmu, kurā vairāki klienti pārvalda savus projektus, attēlus un piekļuves tiesības. Pārstrukturē datu modeli, nezaudējot iepriekšējo saturu.']
  },
  fitness: {
    easy: ['Vingrinājumu kategorijas', 'Vingrinājumiem jānorāda kategorija un mērķa atkārtojumu skaits. Saglabā esošo treniņu vēsturi.'],
    medium: ['Treneru un audzēkņu relācijas', 'Viens treneris vada vairākus audzēkņus, un audzēknim laika gaitā var mainīties treneris. Modelē attiecības ar vēsturi.'],
    hard: ['Komandu un koplietojamu plānu sistēma', 'Lietotne kļūst par daudzlietotāju treniņu platformu ar komandām, treneriem un kopīgiem plāniem. Pārveido struktūru un migrē iepriekšējo personisko dienasgrāmatu datus.']
  },
  club: {
    easy: ['Biedra dalības statuss', 'Biedriem nepieciešams aktīvs/neaktīvs statuss un reģistrācijas datums. Pievieno ierobežojumus un saglabā iepriekšējos biedrus.'],
    medium: ['Pasākumu apmeklējumu uzskaite', 'Papildus pieteikumam nepieciešams reģistrēt faktisko apmeklējumu un atbildīgo administratoru. Pievieno relācijas un pārbaudes.'],
    hard: ['Dalības abonementu vēsture', 'Klubs ievieš maksas plānus, maksājumu vēsturi un abonementu maiņu. Pārprojektē biedru un dalības datu glabāšanu, saglabājot esošos biedrus un pieteikumus.']
  }
};

export function suggestChange(caseId, difficulty, round=1) {
  if (!Object.hasOwn(changeLevels,difficulty)) throw new Error('Neatļauts grūtības līmenis');
  const [baseTitle, task] = scenarios[caseId]?.[difficulty] ?? [
    'Jauna datubāzes prasība',
    'Pielāgo esošo datu modeli klienta papildu vajadzībām. Izvēlies atbilstošus datu tipus, relācijas un ierobežojumus.'
  ];
  const number = Number.isSafeInteger(round) && round > 0 ? round : 1;
  const instruction = difficulty === 'easy'
    ? 'Izmanto esošās tabulas; pārbaudi, ka agrāk ievadītie dati joprojām ir pieejami.'
    : difficulty === 'medium'
    ? 'Pievieno nepieciešamās tabulas vai relācijas; pārbaudi integritāti un esošo datu saglabāšanu.'
    : 'Pirms pārveides izveido datu rezerves kopiju. Plāno ALTER TABLE / datu migrāciju, nevis DROP TABLE un darba sākšanu no nulles. Pierādi, ka vecie ieraksti saglabājušies.';
  return {
    difficulty,
    title: number > 1 ? baseTitle + ' — ' + number + '. kārta' : baseTitle,
    description: task + '\n\nSvarīgi: ' + instruction + '\n\nIesniedz izmaiņu aprakstu, SQL Lab projekta saiti vai veiktā SQL piemēru un testu rezultātus.'
  };
}
