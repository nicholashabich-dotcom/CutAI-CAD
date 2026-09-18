# CutAI CAD/CAM v0.7.2

Mobile-first CAD/CAM-Prototyp mit ASPER-orientiertem Datenmodell. Diese Version erzeugt bewusst **kein direkt ausführbares Maschinen-NC**.

## Neu in v0.7.2

- obere, horizontal scrollbare Funktionsleiste mit Reitern:
  Datei, Blechtafel, Bearbeiten, Schachtelung, Ansicht, Punkte, Auswahl, Bewegen, Abschnitt, An- und Ausläufe, Mikrosteg, Schneidfolge, Einstellungen
- Werkzeugfarben pro Werkzeugcode plus Werkzeuglegende
- Fasen werden auf der Kontur optisch hervorgehoben und mit Profil/Winkel beschriftet
- Konturen können in einzelne Abschnitte zerlegt und anschließend wieder verbunden werden
- Kreis wird beim Auftrennen in vier Bogenabschnitte zerlegt
- Abschnitte können danach einzeln Werkzeug, Fase und CAM-Eigenschaften erhalten
- einfache Blechtafel mit frei wählbarer Größe und automatischem Anpassen an die Geometrie
- einfache Reihen-Schachtelung als funktionaler Vorläufer eines echten Nesting-Moduls
- Mikrosteg-Markierung im neutralen CAM-Modell
- Tastenkürzel/Schnellfunktionen, abrufbar unter Einstellungen > Tastenkürzel
- Projektformat `cutai-cad/0.7.2`, ältere v0.7/v0.7.1-Projekte werden weiter eingelesen

## Wichtige Schnellfunktionen

- `V` Auswahl, `L` Linie, `Q` Rechteck, `C` Kreis, `A` Bogen, `P` Pan
- `X` Kontur auftrennen, `J` Abschnitte verbinden, `R` Richtung umkehren
- `S` Startpunkt setzen, `Shift+S` löschen
- `G` Fang Ein/Aus, `Shift+G` Raster Ein/Aus
- `U` Mikrosteg Ein/Aus, `B` Blechtafel Ein/Aus, `N` einfache Schachtelung
- Pfeiltasten verschieben die Auswahl um 1 mm
- `[` / `]` verschiebt die Schneidfolge
- `Ctrl/Cmd+Z`, `Ctrl/Cmd+Y`, `Ctrl/Cmd+D`, `Ctrl/Cmd+A`, `Ctrl/Cmd+S`, `Ctrl/Cmd+O`

## Werkzeugfarben

Bekannte ASPER-Werkzeugcodes bekommen feste Farben, z. B. T111 blau, T211 orange, T311 rot, T411 grün, T511 gelb, T611 cyan und T12 violett. Unbekannte Werkzeugcodes erhalten deterministisch eine eigene Farbe.

## Fasenanzeige

Eine Fase wird zusätzlich zur Werkzeugfarbe als orange gestrichelte Kontur dargestellt. Ein Symbol zeigt oben/unten/beidseitig, daneben stehen Profil und aktive Winkel, z. B. `V 30°` oder `K 30°/-30°`.

## Sicherheit / Postprozessor

DXF- und neutrale CAM-Plan-Ausgabe sind vorhanden. Maschinen-M-Codes werden weiterhin nicht als produktionsfertige Ausgabe erzeugt, solange die maschinenspezifischen Parameter und Postprozessorregeln nicht validiert sind.
