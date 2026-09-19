# CutAI CAD/CAM v0.8.1

CutAI ist ein browserbasierter CAD/CAM-Prototyp für 2D-Schneidanlagen. Die Anwendung trennt Geometrie, CAM-Eigenschaften, Maschinenprofil und spätere Postprozessoren bewusst voneinander.

## Neu in v0.8.1

- NC/DIN-Dateien (`.CNC`, `.NC`, `.DIN`, `.TXT`) lokal analysieren.
- Der aus einem Machine-Snapshot gelesene `CNCDEF.INI` wird als Maschinen-Dialekt ausgewertet.
- G0/G1/G2/G3, G90/G91 sowie bekannte M-Befehle werden in eine neutrale Analyse übersetzt.
- Werkzeugbahn-Vorschau mit Eilweg, Leerbewegung und aktivem Schnitt.
- Statistik für Schnittweg, Eil-/Leerweg, Werkzeugwechsel, Fasenbefehle und THT/PowerHole.
- NC-Analyse kann mit dem aktuellen neutralen CutAI-CAM verglichen werden: Schnittweglänge, Arbeitsbereich und bekannte Fasen-/THT-Merkmale.
- Analyse kann als JSON exportiert werden.
- Maschinenpaket-Import übernimmt zusätzlich eine kompakte NC-Dialektbeschreibung aus `CNCDEF.INI`.

## Bestehende Funktionen

- DXF/SVG-Import und DXF-R12-Export.
- Kontur-/Abschnittsmodell, Auftrennen und Verbinden.
- Werkzeugfarben, Stationen und Maschinenarchitektur.
- Plasma, Laser, Autogen, Bohren und Wasserstrahl als getrennte Verfahren.
- Hersteller-/Quellentrennung z. B. Hypertherm, Kjellberg, IPG, Raycus.
- Senkrecht- und Rotator-/Bevel-Stationen.
- ASPER-orientierte Fasen V/Y/X/K mit Alfa1, Alfa2, TP und TN.
- An-/Ausläufe, Startpunkte und Schneidfolge.
- Machine-Snapshot-ZIP lokal auswerten und Technologie-INIs zuordnen.
- KI-CAM-Planer mit Vorprüfung und Undo.
- Neutraler CAM-Plan JSON.

## Sicherheit / Stand

v0.8.1 erzeugt **keinen maschinenausführbaren NC-Code**. Die NC-Funktion ist ein Offline-Analysator. Die Interpretation wird auf die im geladenen `CNCDEF.INI` definierten Befehle und eine kleine, dokumentierte Referenz bekannter iMSNC-Befehle begrenzt. Eine NC-Analyse ersetzt weder die Simulation an der Maschinensteuerung noch eine Herstellerfreigabe.

Für eine belastbare Ableitung eines eigenen Postprozessors werden echte, von ASPER erzeugte Referenzprogramme benötigt, idealerweise zusammen mit der zugehörigen DXF/PLA und der verwendeten Technologie.
