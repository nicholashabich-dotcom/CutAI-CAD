# CutAI CAD/CAM v0.7.9

v0.7.9 ergänzt die Maschinenpaket-Auswertung, eine maschinenbewusste KI-Eingabe, lokale ASPER-Schablonenbibliotheken sowie einen Offline-Referenzleser für CNC/PLA. Reale Maschinen-Snapshots und Technologie-INIs werden **nicht** fest in die öffentliche GitHub-Pages-App eingebettet, sondern ausschließlich lokal im Browser gelesen.

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

**v0.7.9 erzeugt weiterhin kein freigegebenes, maschinenausführbares NC und steuert keine Maschine direkt.**


## Neu in v0.7.9: ASPER-Schablonen

Unter **Projekt / Anlage → ASPER Schablonen** kann eine ZIP-Sammlung mit nativen `.CFG`- und `.PLB`-Dateien lokal eingelesen werden. CutAI indexiert Materialgruppe, aus dem Dateinamen ableitbare Dicke, Werkstoffbezeichnung sowie sichtbare Profil- und Werkzeugkennungen. Die Binärdateien werden nicht verändert und nicht hochgeladen. Eine ausgewählte Schablone wird als Referenz im Projekt und im neutralen CAM-Plan gespeichert.

Die lokale KI berücksichtigt die geladene Schablonenbibliothek. Dabei werden Schablonenvarianten nach erkanntem ASPER-Profil getrennt gehalten. Das ist wichtig, weil gleich benannte CFG/PLB-Dateien je nach Profil unterschiedliche Werkzeugcodes enthalten können. Werkzeugwünsche werden intern semantisch als z. B. `cut`, `bevel_top`, `bevel_bottom`, `mark`, `punch`, `quality`, `drill`, `oxyfuel` oder `waterjet` geführt und erst gegen die ausgewählte Schablone bzw. die aktive Station auf einen konkreten Werkzeugcode aufgelöst. Bei mehreren passenden Dateien fordert CutAI eine genauere Angabe statt eine Schablone zu erfinden.

## Neu in v0.7.9: CNC / PLA Referenz

Über **CNC / PLA Referenz** können vorhandene ASPER-Ausgabedateien lokal untersucht werden. Der CNC-Referenzleser erkennt unter anderem Tafel-/Materialangaben, Werkzeugwahl, G90/G91, G0/G1, G41/G42/G40, Werkzeug-Ein/Aus sowie als `LEAD IN`, `LINE - CONTOUR` und `LEAD OUT` kommentierte Bewegungen. Kommentierte Konturzüge können als Referenzgeometrie in das CutAI-Projekt übernommen werden. Zusätzlich können Tafel-/Materialdaten aus der Referenz übernommen und Referenz und aktuelles Projekt offline miteinander verglichen werden. Diese drei Schritte sind auch über die KI-Eingabe ansprechbar.

PLA wird derzeit nur als natives Binärformat auf ASPER-Signatur, sichtbare Werkzeug-, Material- und Profilkennungen untersucht. v0.7.9 behauptet bewusst keinen vollständigen PLA-Parser.
