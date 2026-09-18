# CutAI CAD/CAM v0.7.2

Diese Version baut auf v0.7.1 auf und gleicht drei zentrale Punkte stärker an den dokumentierten ASPER-Workflow an: Abschnitte, Werkzeugfarben und sichtbare Fasen.

## Neu in v0.7.2

- Werkzeugansicht als Standard: verschiedene Werkzeuge erhalten unterschiedliche Farben.
- Zusätzliche Ansichtsmodi: Normal, Werkzeuge und Fasen.
- Werkzeuglegende mit Code, Name und Farbe.
- Sichtbare Fasenmarkierung direkt an der Geometrie:
  - farbige Hervorhebung,
  - Trennmarken an Anfang/Ende,
  - Beschriftung wie `V↑ 30°`, `Y↑ 30° · Steg 5`, `K↕ 30°/30°`.
- Werkzeug- und Fasenfarbe bleibt auch nach DXF-Import sichtbar.
- Neuer Modus **Abschnitt trennen**:
  - bei einer geschlossenen Kontur setzt der erste Klick den ersten Abschnittspunkt,
  - der zweite Klick erzeugt getrennte Abschnitte,
  - weitere Teilungen sind möglich,
  - jeder Abschnitt kann ein eigenes Werkzeug, eigene Fase und eigene CAM-Parameter erhalten.
- Abschnittsgrenzen werden in der Zeichnung markiert.
- Abschnitte einer geschlossenen Kette werden gemeinsam als Kette geführt.
- **Abschnitte verbinden** verbindet ausgewählte, zusammenhängende Abschnitte wieder, wenn ihre CAM-/Fasenparameter identisch sind.
- CAM-Plan v0.7.2 enthält `chainId`, `chainName`, `sectionIndex` und `chainClosed`.
- Projektformat wurde auf `cutai-cad/0.7.2` erweitert; v0.7/v0.7.1 und v0.6 werden weiterhin geladen.
- Tastenkürzel `X` wechselt die Ansichtsmodi; `L` aktiviert Abschnitt trennen.

## ASPER-Abgleich

Der Schulungsleitfaden beschreibt ausdrücklich, dass Fasen nicht auf einzelne Kanten, sondern auf komplette Abschnitte angewendet werden. Deshalb müssen die benötigten Kanten vorher mit **Abschnitt -> Auftrennen** freigestellt werden. Außerdem empfiehlt die Schulung den Ansichtsmodus **Werkzeug**, um verschiedene Werkzeuge in unterschiedlichen Farben zu erkennen.

Die v0.7.2-Darstellung folgt diesem Grundprinzip, ohne proprietäre ASPER-Grafiken oder Maschinenlogik zu kopieren.

## DXF-Testdateien

Die bereitgestellten Dateien wurden mit dem aktuellen DXF-Kern geprüft:

- `2Q001692.DXF`: 1 geschlossene Kontur aus 8 Linien/Bögen erkannt.
- `3Q100711.DXF`: 6 geschlossene Konturen erkannt.
- `KELEM-A.DXF`: 2 geschlossene Konturen erkannt.
- `KELEM-E.DXF`: 2 geschlossene Konturen erkannt.

POINT-Objekte werden wie im ASPER-Handbuch nicht als Schneidgeometrie interpretiert.

## Sicherheit

CutAI erzeugt weiterhin **kein ausführbares Maschinen-NC**. Postprozessoren und M-Codes bleiben Referenzwissen, bis Maschinenkonfiguration und Gutprogramme sicher validiert sind.
