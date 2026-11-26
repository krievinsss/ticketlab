-- TicketLab: klienta prasību vairākas kārtas.
-- Droša PAPILDINOŠA migrācija. Neizdzēš un nepārraksta esošos tickets, answers, grade.
-- Izpildi Neon SQL Editor tikai datubāzē, kuru izmanto TicketLab DATABASE_URL.
CREATE TABLE IF NOT EXISTS ticket_changes (
  id BIGSERIAL PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL REFERENCES tickets(code) ON DELETE CASCADE,
  difficulty VARCHAR(8) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  response TEXT NOT NULL DEFAULT '',
  status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ticket_changes_ticket_order ON ticket_changes(ticket_code, id);
