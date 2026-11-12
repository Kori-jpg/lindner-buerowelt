# LindnerNet – Lern-Intranet der Lindner Bürowelt

Lern-Intranet zum Unterricht (Kaufleute für Büromanagement, Lernfeld 7 und 8). Modellunternehmen: Lindner Bürowelt am Main KG. Alle Namen, Personen und Daten sind frei erfunden.

- Statische Seite für GitHub Pages, ohne Konten, ohne Tracking, ohne Schülerdaten. Der Lernstand bleibt im Browser des Geräts.
- Die Inhalte der Lernfelder liegen nur verschlüsselt in `content/*.enc.json` (AES-256-GCM, Schlüssel aus dem Klassencode). Klartext-Inhalte und Codes gehören nicht in dieses Repository.
- `tools/encrypt.mjs` verschlüsselt eine Inhaltsdatei mit einem Klassencode.
