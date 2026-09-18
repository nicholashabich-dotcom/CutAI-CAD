# ASPER / MicroStep Referenz für CutAI v0.7.2

## Dokumentierter Workflow

Die bereitgestellten ASPER-Unterlagen bestätigen die interne Modellierung, die CutAI jetzt verwendet:

- **Entity**: Linie, Polylinie, Kreis oder Bogen.
- **Section / Abschnitt**: zusammenhängende Entities mit gemeinsamen technologischen Eigenschaften.
- **Chain / Kette**: Gruppe angrenzender Abschnitte; ein Teil besitzt eine Außenkette und ggf. Innenketten.
- Fasen werden auf einen **kompletten Abschnitt** angewendet.
- Für unterschiedliche Bearbeitungen an einzelnen Kanten muss eine Kette deshalb vorher in mehrere Abschnitte aufgetrennt werden.

Der Schulungsleitfaden Asper Bevel 5.0 beschreibt auf Seite 73 ausdrücklich das Auftrennen der Außenkontur mit Fangpunkt und Befehl **Abschnitt auftrennen**. Seite 75 zeigt anschließend, dass die Fasenparameter auf den gewünschten Abschnitt angewendet werden.

## Werkzeugfarben

Der Schulungsleitfaden Asper 5.0, Seite 36, empfiehlt den Ansichtsmodus **Werkzeug**, um unterschiedliche Werkzeuge in unterschiedlichen Farben zu sehen.

Das ASPER 5.0 User Manual beschreibt auf den Seiten 103-105 mehrere farbcodierte Ansichtsmodi. Im Werkzeugmodus werden gerade Schnitte und Fasenschnitte farblich unterschieden.

CutAI v0.7.2 führt deshalb drei Ansichten:
- Normal
- Werkzeuge
- Fasen

Die konkrete CutAI-Farbpalette ist eine eigene UI-Entscheidung und keine 1:1-Kopie der ASPER-Farben.

## Fasen

Der Schulungsleitfaden unterscheidet:
- V oben / positiv
- V unten / negativ
- Y oben
- Y unten
- X
- K

Die Schulungsunterlagen zeigen außerdem eine K-Fase mit getrennten oberen und unteren Winkeln sowie Steghöhe. CutAI stellt Fasen deshalb als Profil mit mehreren aktiven Flächen dar und markiert sie zusätzlich direkt an der Geometrie.

## Simulation

Das NC-Simulator-Handbuch beschreibt unterschiedliche Darstellungen für Halbproduktkontur, Sollkontur, kompensierten Werkzeugpfad, Startpunkt und Verfahrwege. CutAI nutzt diese Information nur als UI-/Architektur-Referenz. Es simuliert weiterhin neutral und erzeugt kein freigegebenes Maschinenprogramm.

## Binär- und Konfigurationsquellen

Weiterhin als Referenz ausgewertet wurden u. a.:
`Asper.exe`, `AnalyzerCNC.dll`, `DxfDrawDll.dll`, `P_DIN1.dll`, `P_DIN1aw.dll`, `P_ESSI.dll`, `P_DXF.dll`, `NCSim.exe`, `N32DLL.DLL`, `n64dll.dll`, `param.xml`, `param-multi.xml`, `asf.ini`, `asf_example.ini`, `essi.ini`.

Alle Binärdateien wurden ausschließlich statisch betrachtet und nicht ausgeführt.
