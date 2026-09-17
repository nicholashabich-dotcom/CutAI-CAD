# CutAI CAD/CAM v0.4

## Ziel
V0.4 trennt Geometrie von CAM-Daten. Noch keine echten MicroStep-M-/NC-Codes.

## Neu
- Startpunkt pro Kontur setzen/löschen
- sichtbarer Startpunkt + Richtungsmarker
- Schneidrichtung CW/CCW
- Technologien: Plasma, Laser, Autogen, Markieren, Bohren, Keine
- Konturtypen: Auto, Außen, Innen, Markieren, Bohren, Keine
- Schnittreihenfolge
- Lead-In / Lead-Out als CAM-Attribute
- automatische CAM-Zuordnung: Innenkonturen vor Außenkonturen
- DXF R12 Import: LINE, CIRCLE, ARC
- DXF R12 Export mit Technologie/Konturtyp in Layernamen
- einfacher SVG-Import: line, rect, circle, polyline, polygon
- neutraler CAM-Plan als JSON
- Projekt speichern/laden

## Startpunkt
Objekt auswählen → `Startpunkt setzen` → gewünschte Position auf der Kontur antippen.

## CAM automatisch
Für eine Platte mit Kreisen:
- Kreise innerhalb des Rechtecks → Innenkontur
- Rechteck → Außenkontur
- Innenkonturen werden vor Außenkonturen einsortiert

## DXF Layer
Beispiele:
- `PLASMA_INSIDE`
- `PLASMA_OUTSIDE`
- `LASER_INSIDE`
- `MARKIEREN_MARK`

## Neutraler CAM-Plan
`CAM-Plan exportieren` erzeugt `cutai-cam-plan-v04.json`.

Dieser Plan enthält bereits Technologie, Konturtyp, Richtung, Reihenfolge, Startpunkt und Geometrie,
aber bewusst noch keine maschinenspezifischen M-Codes.

## Nächster Schritt
Ein MicroStep-Postprozessor kann später den neutralen CAM-Plan in echte NC-Befehle übersetzen.
Dafür brauchen wir die freigegebene Postprozessor-/iMSNC-Dokumentation oder echte Referenz-NC-Dateien.
