# CutAI v0.8.0 Test Report

## Statische Prüfungen
- `node --check app-v080.js`: bestanden
- `node --check cutai-core-v080.js`: bestanden
- `node --check asper-reference-v080.js`: bestanden
- HTML-ID-Prüfung: alle statisch referenzierten UI-IDs vorhanden; `geomX`, `geomY`, `geomDiameter` werden erwartungsgemäß dynamisch erzeugt

## Browser-Smoke-Test
Die Anwendung wurde mit Chromium in einer isolierten Headless-Testseite gestartet.

Geprüft:
- Seitentitel und Initialstatus
- 66 ausführbare Buttons / UI-Aktionen geladen
- 9 Ansichtsmodi vorhanden
- keine `pageerror`- oder Console-Error-Ereignisse
- DXF importiert und Eigenschaftenpanel geöffnet
- Funktionsregister geöffnet/geschlossen
- Projekt-/Maschinendialog geöffnet, Tafelgröße und Einlesetoleranz geändert
- Abschnittsgeschwindigkeit, Leistung, ATHC und Vorstechen geändert
- automatische Schneidfolge ausgeführt
- Simulation ein/Schritt vor/Schritt zurück/reset ausgeführt
- Mikrosteg auf Kontur gesetzt
- CAM-Prüfung geöffnet

## DXF Regression
Mit Toleranz 0,1 mm:

| Datei | Konturen | geschlossen | Geometriesegmente |
|---|---:|---:|---:|
| 2Q001692.DXF | 1 | 1 | 8 |
| 3Q100711.DXF | 6 | 6 | 12 |
| KELEM-A.DXF | 2 | 2 | 11 |
| KELEM-E.DXF | 2 | 2 | 16 |

## CAM-Plan-Test
`3Q100711.DXF` wurde importiert, automatisch geordnet und als neutraler CAM-Plan exportiert.

Geprüft:
- Schema `cutai-cam-plan/0.8.0`
- 6 Operationen
- Tafel- und Projekteinstellungen enthalten
- Operationen enthalten u.a. `athcMode`, `microjoints`, `ihsPoint`, `priority`, `relativeSpeedPct`, `powerPct`, `headIndex`, `gantryIndex`, `prePiercing`, `chainCut` und Fasenparameter

## Nicht behauptete Prüfungen
Nicht geprüft und nicht freigegeben sind:
- reale Maschinenbewegungen
- Kollisionsfreiheit an einer konkreten Anlage
- Hersteller-Postprozessor-Konformität
- echte DIN-/ESSI-Maschinenausgabe
- Prozessparameter für eine konkrete Plasma-/Laser-/Autogenquelle
