CREATE TABLE poker_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('loss', 'win', 'jackpot')),
  multiplier INTEGER NOT NULL CHECK (multiplier >= 0),
  created_at TIMESTAMP DEFAULT NOW()
);
