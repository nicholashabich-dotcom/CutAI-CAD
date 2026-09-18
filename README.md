# CutAI CAD/CAM v0.8.0

v0.8.0 baut den Prototyp zu einem strukturierten CAD/CAM-Kern aus. Grundlage sind die bereitgestellten ASPER-5.0-Handbücher, Schulungsunterlagen, Konfigurationsdateien, Beispiel-DXF-Dateien und die statische Analyse der relevanten MicroStep-Module. CutAI bleibt eine eigenständig entwickelte Anwendung: keine ASPER-Grafiken, Icons, Programmcodes oder Binärmodule werden eingebettet.

## Neu in v0.8.0

### Abschnitt / Technologie
Jeder Abschnitt besitzt jetzt zusätzlich zu Werkzeug, Konturtyp und Fase eigene technologische Attribute:
- Bearbeitung aktiv / deaktiviert
- Priorität
- relative Geschwindigkeit und optionale eigene Geschwindigkeit
- Leistung
- ATHC-Modus
- Kopf- und Portalindex
- IHS-Punkt und IHS-Versatz
- Vorstechen
- Kühlen vor dem Abschnitt
- Werkzeughöhe sperren
- Kettenschnitt-Metadatum
- Schneidfolge nach dem Abschnitt trennen
- Überlappung und Loop-Metadatum

Die Struktur orientiert sich an den dokumentierten ASPER-Funktionen für Abschnitte und Entity-Technologieparameter, die Implementierung und Oberfläche sind eigenständig.

### Mikrostege
- neues Werkzeug **Mikrosteg setzen** in der linken Werkzeugleiste
- Mikrostege werden punktweise auf einer Kontur gesetzt
- Länge und „am Ende nachschneiden“ werden gespeichert
- Mikrostege werden sichtbar markiert
- alle Mikrostege der Auswahl können gelöscht werden
- neutraler CAM-Plan enthält die Mikrosteg-Daten

### An- und Ausläufe
- Linie oder Bogen
- Länge, Winkel und Radius
- senkrechter Anteil für Fasen-Anläufe
- Anlauf/Auslauf per Aktion hinzufügen oder entfernen
- Projektstandard für Anlauflänge
- Fasen-Anlauffaktor und Standardwert für senkrechten Fasen-Anlauf

### Ansichtsmodi
`X` schaltet zyklisch durch:
- Normal
- Werkzeuge
- Fasen
- Geschwindigkeit
- ATHC
- Kopf
- Portal
- Leistung
- Schneidfolge

### Tafel- und Projekteinstellungen
- Tafelbreite / Tafelhöhe
- DXF-Einlesetoleranz
- Schachtelrichtung X/Y als Vorbereitung für eigenes Nesting
- Schnittfugenmodus: Maschinensteuerung / CutAI offline / keine
- Standard-Mikrosteg
- Standard-Anlauf
- neutrale NC-Ausgabeparameter: relative Koordinaten, Kommentare, Werkzeugwechsel erzwingen, Bögen als Polylinien, Approximationstoleranz
- NC-Start- und Endposition als neutrale Projektmetadaten

### Schneidfolge
- automatische Reihenfolge berücksichtigt jetzt deaktivierte Abschnitte und Abschnittsprioritäten
- manuelle Reihenfolge bleibt vorhanden
- formaler Reihenfolgetest bleibt vorhanden
- deaktivierte Abschnitte erhalten keine aktive Bearbeitungsreihenfolge

### Simulation
- neutrale CAM-Simulation
- Schritt vor
- Schritt zurück
- Reset
- aktueller Bearbeitungsabschnitt wird hervorgehoben
- Schnitt- und Eilweglänge werden berechnet

### Funktionsregister
Der Button **Funktionsregister** zeigt direkt in CutAI, welche ASPER-Funktionsbereiche bereits umgesetzt, teilweise umgesetzt oder noch geplant sind. Die ausführlichere Matrix liegt in `ASPER_FEATURE_MATRIX.md`.

## Wichtiger Sicherheitsstand

CutAI v0.8.0 erzeugt weiterhin **kein ausführbares Maschinen-NC**. DIN-/ESSI-/Postprozessor-Informationen werden nur als Referenz und Metadaten geführt, bis die maschinenspezifischen Konfigurationen und bekannte Gutprogramme sicher gegengeprüft werden können.

## Teststand

Geprüft wurden unter anderem:
- JavaScript-Syntax aller Module
- Start der Anwendung im Headless-Browser ohne JavaScript-Fehler
- alle 9 Ansichtsmodi
- Projekt-/Maschinendialog
- Feature-Register
- DXF-Import
- Technologiefelder
- automatische Reihenfolge
- Simulation Schritt vor/zurück/reset
- Mikrosteg setzen
- CAM-Prüfung
- neutraler CAM-Plan v0.8.0

DXF-Regression:
- `2Q001692.DXF`: 1 geschlossene Kontur, 8 Geometriesegmente
- `3Q100711.DXF`: 6 geschlossene Konturen, 12 Geometriesegmente
- `KELEM-A.DXF`: 2 geschlossene Konturen, 11 Geometriesegmente
- `KELEM-E.DXF`: 2 geschlossene Konturen, 16 Geometriesegmente

Siehe `TEST_REPORT.md`.
