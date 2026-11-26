// TicketLab: bez datu migrācijas novērš vecās pogas un jauno prasību neatbilstību.
// Vecā poga līdz šim pārbaudīja tikai globālo "pārsteigumu".
document.addEventListener('click', event => {
  const oldButton = event.target.closest('[data-action="check-twist"]');
  if (oldButton) oldButton.dataset.action = 'check-client-changes';
}, true);

const root = document.getElementById('root');
function showClientChangesFirst() {
  const section = document.getElementById('change-timeline');
  if (!section) return;
  const cards = section.querySelectorAll('[data-change-card]');
  // Nepārvietojam tukšu sadaļu; jaunais pieprasījums kļūst redzams pirmais.
  if (cards.length && section.parentElement?.firstElementChild !== section) {
    section.parentElement.prepend(section);
  }
  const oldButton = root.querySelector('[data-action="check-twist"]');
  if (oldButton) {
    oldButton.dataset.action = 'check-client-changes';
    oldButton.textContent = '🔔 Pārbaudīt visus klienta pieprasījumus';
  }
}
let pending = false;
const observer = new MutationObserver(() => {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    showClientChangesFirst();
  });
});
observer.observe(root, {childList:true,subtree:true});
showClientChangesFirst();
