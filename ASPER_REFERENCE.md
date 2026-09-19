# ASPER / iMSNC Referenzstand für CutAI v0.8.1

CutAI orientiert sein internes Modell an den bereitgestellten ASPER-5-Unterlagen und Maschinen-Snapshots.

Wichtige Modellbegriffe:
- Entity: Linie, Polylinie, Kreis oder Bogen.
- Section / Abschnitt: Gruppe benachbarter Entities mit gemeinsamen technologischen Eigenschaften.
- Chain / Kette: Gruppe benachbarter Abschnitte; Außenkontur und Innenketten bilden ein Part.
- Lead-in / Lead-out, Startpunkt, Kompensation und Schneidfolge bleiben eigene CAM-Eigenschaften.
- Fasen werden abschnittsweise definiert; deshalb können Ketten in mehrere Abschnitte aufgeteilt werden.

NC/DIN in v0.8.1:
- Machine-Snapshots werden nach `CNCDEF.INI` durchsucht.
- Aus `CNCDEF.INI` werden erlaubte G-/M-Befehle, interne Befehlsnamen, Argumentmuster sowie `CIRCLE_CENTER=ABS/REL` gelesen.
- G0/G1/G2/G3 und G90/G91 werden geometrisch interpretiert.
- Bekannte Sonderbefehle wie M6, M26, M29, M34/M35, M90, M94, M102, M120, M121, M122, M123 und M134 werden als Ereignisse angezeigt, aber nicht zur Maschinensteuerung ausgeführt.
- Maschinenabhängige Semantik wird nicht erfunden. Wo ein Befehl nur als PARAM/SWITCH definiert ist, bleibt die Analyse entsprechend vorsichtig.

Die bereitgestellten Binärdateien werden nicht ausgeführt. Der aktuelle Stand ist Analyse und Referenz, kein validierter Postprozessor.
