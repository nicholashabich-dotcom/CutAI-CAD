# CutAI CAD v0.3

## Neu
- DXF-Export als AutoCAD R12 ASCII (AC1009)
- Rechtecke werden im DXF als vier LINE-Elemente ausgegeben
- Kreise/Bohrungen als echte CIRCLE-Elemente
- Mehrfachauswahl
- Duplizieren (20 mm Versatz)
- Exakte X/Y- und Durchmesserbearbeitung
- Bei Kreisen innerhalb eines Rechtecks werden Randabstände angezeigt
- Projekt speichern/laden
- Fangpunkte und Touch-Bedienung

## DXF-Test
1. Befehl: `Platte 800 x 400 mit 4 Bohrungen Ø12 Rand 30`
2. `DXF exportieren`
3. Datei `cutai-export-r12.dxf` in ASPER oder einem anderen CAD/CAM öffnen.
4. Prüfen:
   - Außenkontur 800 × 400 mm
   - vier Kreise Ø12 mm
   - Mittelpunkte 30 mm von den jeweiligen Außenkanten

## Hinweis
Die Y-Achse wird beim DXF-Export invertiert, damit die Bildschirmkoordinaten in ein übliches CAD-Koordinatensystem überführt werden.

Noch keine NC-/Maschinenausgabe. DXF ist zunächst nur Geometrieaustausch.
