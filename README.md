# CutAI CAD/CAM v0.7.7

v0.7.7 ergänzt die Maschinenpaket-Auswertung und eine maschinenbewusste KI-Eingabe. Reale Maschinen-Snapshots und Technologie-INIs werden **nicht** fest in die öffentliche GitHub-Pages-App eingebettet, sondern ausschließlich lokal im Browser gelesen.

## Maschinenmodell

CutAI trennt:

- Steuerung/CNC: MicroStep iMSNC, Eckelmann oder neutral
- Bearbeitungsstation(en)
- Verfahren: Plasma, Laser, Autogen, Bohren, Wasserstrahl
- Hersteller/Quelle: z. B. Hypertherm, Kjellberg, IPG, Raycus
- Kopfkinematik: senkrecht, Rotator/Bevel, Laser-Bevel, Bohrspindel
- Werkzeug je Abschnitt
- Technologiedatei je tatsächlicher Station, Material und Dicke

## Maschinen-Snapshot lokal laden

Unter **Projekt / Maschine → Maschinen-Snapshot** kann eine Snapshot-ZIP ausgewählt werden. CutAI liest die ZIP mit JSZip direkt im Browser. Die Datei wird nicht zu einem Server hochgeladen.

Aus einem unterstützten MicroStep-Maschinenpaket liest CutAI unter anderem:

- `machine.ini` und aktive Tool-Stacks
- zugehörige `Tool_*.ini`-Definitionen
- passende Technologie-INIs unter `Tools/Txx/`
- Maschinenname und Seriennummer aus `MachInfo.xml`, soweit vorhanden

Kundendaten wie Anschrift werden nicht in das CutAI-Maschinenprofil übernommen. Der Parser unterscheidet aktive Stationen von bloß im Paket vorhandenen Definitionen und lädt nur die zur erkannten Station passenden Technologieprofile. Diese Daten bleiben lokal und werden nicht mit CutAI ausgeliefert.

## KI-Eingabe

Die Schaltfläche **✦ KI Eingabe** akzeptiert normale deutschsprachige Arbeitsaufträge. Der lokale Planer kann unter anderem:

- Material und Dicke setzen
- Rechtecke, Kreise und Ecklochbilder erzeugen
- eine tatsächlich vorhandene Station auswählen
- eine exakte Technologie aus dem geladenen Maschinenpaket anhand von Hersteller, Material, Dicke und Strom referenzieren
- Werkzeuge zuweisen
- V-/Y-/X-/K-Fasen setzen
- An- und Ausläufe setzen
- Schneidfolge automatisch erzeugen und CAM prüfen

Beispiel:

`S235 10 mm. Kjellberg HiFocus 280 mit 130 A. Rechteck 300 x 200, vier Löcher Ø12 mit 20 mm Eckabstand. Außenkontur senkrecht. Schneidfolge automatisch und CAM prüfen.`

Wenn mehrere Technologie-INIs passen, verlangt CutAI eine genauere Angabe. Wenn die geladene Maschine die gewünschte Station nicht besitzt, wird keine erfundene Station angelegt. Gleiches gilt für Technologieparameter.

Jeder KI-Plan wird vor der Ausführung sichtbar angezeigt und muss bestätigt werden.

## Optionale Online-KI

Für eine echte Modell-KI kann ein eigener HTTPS-Proxy eingetragen werden. API-Schlüssel gehören **nicht** in GitHub Pages oder Browser-JavaScript. Maschinen-/Technologiekontext wird an die Online-KI nur gesendet, wenn der Benutzer die entsprechende Checkbox ausdrücklich aktiviert.

Der Online-Dienst darf ausschließlich Aktionen aus der dokumentierten Allowlist zurückgeben; CutAI validiert die Antwort nochmals lokal.

## CAM und Sicherheit

DXF-Import/-Export, Konturerkennung, Abschnitte trennen/verbinden, Werkzeugfarben, Fasenvisualisierung, Alfa1/Alfa2, TP/TN, An-/Ausläufe, Startpunkte, automatische/manuelle Schneidfolge, CAM-Prüfung, Simulation und neutraler CAM-Plan bleiben enthalten.

**v0.7.7 erzeugt weiterhin kein freigegebenes, maschinenausführbares NC und steuert keine Maschine direkt.**
