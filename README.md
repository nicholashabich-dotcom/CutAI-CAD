# CutAI CAD/CAM Windows v0.8.1

Windows-11-Desktoppaket auf Basis von CutAI CAD/CAM v0.7.2 und dem bisher ausgewerteten ASPER/MicroStep-Referenzmaterial.

## Installation auf Windows 11

1. ZIP vollständig entpacken.
2. `Install-CutAI.cmd` doppelklicken.
3. Windows PowerShell kopiert CutAI nach `%LOCALAPPDATA%\CutAI CAD`.
4. Auf Desktop und im Startmenü wird `CutAI CAD` angelegt.
5. CutAI startet in einem eigenen App-Fenster über Microsoft Edge oder, falls vorhanden, Google Chrome.

Für die Installation sind keine Administratorrechte vorgesehen.

## Neu in v0.8.1

- DXF-Import grundlegend ueberarbeitet
- erkennt ASCII/ANSI/UTF-8/UTF-16 DXF
- unterstuetzt LINE, ARC, CIRCLE, LWPOLYLINE, POLYLINE, ELLIPSE und SPLINE
- BLOCK/INSERT-Geometrie wird expandiert
- LWPOLYLINE/POLYLINE-Bulges werden als echte Bogenabschnitte uebernommen
- DXF-Boegen werden mit korrekter Richtung importiert/exportiert
- kleine Konturluecken bis 0,5 mm werden automatisch geschlossen
- offene Ketten werden nicht als Schneidkontur importiert und im Status gemeldet
- bei binaerem DXF erscheint eine klare Meldung statt eines stillen Fehlers

## Bereits aus v0.8 enthalten

- sichtbare Fangpunkte an Endpunkten, Mittelpunkten, Kreismittelpunkten und Quadranten
- Fangpunkte unter `Punkte > Fangpunkte anzeigen` oder `Shift+P` ein-/ausblendbar
- der Fang verwendet diese Punkte auch beim Zeichnen
- aufgetrennte Konturen werden als echte Einzelabschnitte angelegt
- nach `Kontur auftrennen` wird automatisch Einzelauswahl aktiviert
- jeder Abschnitt kann separat angeklickt, verschoben und mit eigenem Werkzeug/Fasenprofil versehen werden
- Werkzeugfarben und Fasenanzeige aus v0.7.2 bleiben erhalten
- obere ASPER-orientierte Funktionsleiste und Schnellbefehle bleiben erhalten
- lokaler Windows-Betrieb ohne GitHub erforderlich

## Wichtige Grenze

CutAI v0.8 erzeugt weiterhin **kein produktionsfreigegebenes Maschinen-NC**. Die aus ASPER/MicroStep-Dateien gewonnenen Informationen werden zur Datenmodellierung und Vorbereitung des Postprozessors verwendet. Vor einer Maschinenanbindung müssen NC-Ausgabe, Werkzeugparameter, Fasenlogik und Maschinenkonfiguration gegen dokumentierte Daten sowie bekannte Gutprogramme validiert werden.

## Deinstallation

Im Startmenü `CutAI CAD deinstallieren` wählen oder `Uninstall-CutAI.cmd` aus dem Installationsordner ausführen.

## Tastenkürzel

- `V` Auswahl
- `L` Linie
- `Q` Rechteck
- `C` Kreis
- `A` Bogen
- `P` Pan
- `G` Fang Ein/Aus
- `Shift+P` Fangpunkte anzeigen/ausblenden
- `X` Kontur auftrennen
- `J` Abschnitte verbinden
- `R` Richtung umkehren
- `S` Startpunkt setzen
- `Shift+S` Startpunkt löschen
- `M` Mehrfachauswahl
- Pfeiltasten Auswahl um 1 mm bewegen
- `[` / `]` Schneidfolge vor/zurück
- `Ctrl+Z` / `Ctrl+Y` Rückgängig / Wiederholen
- `Ctrl+S` Projekt speichern
- `Ctrl+O` Projekt laden
- `Ctrl+I` DXF importieren
- `F1` Anleitung öffnen



## DXF-Hinweis

CutAI v0.8.1 verarbeitet textbasierte DXF-Dateien direkt. Wenn im Status `Binaeres DXF erkannt` erscheint, muss die Datei derzeit als ASCII-DXF (z. B. R12 oder R2000 ASCII) gespeichert werden. Nicht geschlossene Ketten werden bewusst nicht als Schneidkonturen uebernommen.
