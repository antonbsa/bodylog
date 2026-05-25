CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  body_fat_percentage REAL,
  muscle_percentage REAL,
  resting_metabolism_kcal INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_measurements_date ON measurements(date);
