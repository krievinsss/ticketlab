-- Izpildi Neon SQL Editor vienu reizi pirms pirmās publikācijas.
CREATE TABLE IF NOT EXISTS tickets (
    code VARCHAR(20) PRIMARY KEY,
    token_hash CHAR(64) NOT NULL,
    consultant_name VARCHAR(80) NOT NULL,
    class_group VARCHAR(60) NOT NULL DEFAULT '',
    case_id VARCHAR(40) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'reviewed')),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    grade SMALLINT CHECK (grade BETWEEN 0 AND 10),
    feedback TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_ticket_created ON tickets (created_at DESC);
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(60) PRIMARY KEY,
    value VARCHAR(200) NOT NULL
);
INSERT INTO settings (key, value) VALUES ('twist_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
