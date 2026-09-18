# ASPER-Referenz für CutAI v0.8.0

Diese Datei dokumentiert, welche bereitgestellten Quellen die Architekturentscheidungen von CutAI beeinflusst haben. Es werden Funktionsprinzipien und technische Begriffe als Referenz verwendet, nicht ASPER-Quellcode oder ASPER-Oberflächengrafiken.

## Dokumentationsquellen

### ASPER 5.0 User Manual, August 2023
Wichtige Bereiche für v0.8.0:
- S. 20 ff.: Chain / Section / technologische Struktur
- S. 103-105: farbcodierte Ansichtsmodi, u.a. Normal, Tools und ATHC
- S. 109: Entity-Technologieparameter, u.a. Kühlen, eigene Technologiegeschwindigkeit und ATHC-Modi
- S. 132-134: Schnitt an/aus, Kompensation, Vorstechen, IHS-Versatz und Priorität
- S. 140 ff.: Fasenschnitt
- S. 150-152: An- und Ausläufe hinzufügen, entfernen und ändern
- S. 155-157: Mikrostege und deren Eigenschaften
- S. 157-160: automatische/manuelle Schneidfolge und Prüfung
- S. 175-176: globale Mikrosteg- sowie An-/Auslaufparameter
- S. 203-204: Ausgabeparameter wie relative Koordinaten, Kommentare, erzwungener Werkzeugwechsel und Bögen als Polylinien
- S. 207 ff.: NC-Programmeinstellungen und Kompensationsoptionen

### Schulungsunterlagen Asper 5.0
- S. 35-36: Schnittfugenkompensation und Werkzeugzuordnung; Werkzeugansicht mit unterschiedlichen Farben
- S. 70: Fasenarten V oben/unten, Y oben/unten, X und K sowie A-/B-Achsen-Konzept
- S. 71: vollständiger Bevel-Arbeitsablauf
- S. 73-75: Abschnitte für einzelne Fasen auftrennen; Fasenparameter Alfa1/Alfa2, TP und TN
- S. 80-85: gleichbleibende Schräge und Corner-Loops

### NC-Kodesimulator Bedienungshandbuch
- S. 4-5: Darstellung von Tafelkontur, Sollkontur, kompensiertem Werkzeugpfad, Startpunkt und Verfahrwegen
- S. 11-12: Simulation, Einzelschritt und Simulationssteuerung

## Konfigurationen

- `param.xml`: Werkzeugprofil `PrA-QH`, Werkzeugcodes und Fähigkeiten
- `param-multi.xml`: mehrere Maschinenprofile, DXF-Layerregeln, variable Fase, Material-/Werkzeugzuordnungen
- `asf.ini` und `asf_example.ini`: zusätzliche ASPER-Funktionsschalter, z.B. Additional Bevel und HP2CNC
- `essi.ini`: ESSI-spezifische Konfiguration
- `AsperVerInfo.txt`: Referenz-Build Revision 58431 / RevRange 58438 vom 12.09.2025

## Statisch ausgewertete Kernmodule

CAD/CAM und Datenmodell:
`Asper.exe`, `AnalyzerCNC.dll`, `DxfDrawDll.dll`, `CadcamMzm.dll`, `CadcamMZMWrap.dll`, `MZM.dll`, `MRP.dll`, `SqlCommon.dll`, `DataContexts.dll`, `DataContextsCadcam.dll`, `CadCamMaterialFilter.dll`, `Microstep.Tools.dll`.

Postprozessor-/Formatfamilien:
`P_DIN1.dll`, `P_DIN1aw.dll`, `P_DXF.dll`, `P_ESSI.dll`, `P_awac.dll`, `P_Beckhoff.dll`, `P_Eckelmann.dll`, `P_EdgeG.dll`, `P_Flex.dll`, `P_Kinetic.dll`, `P_Rez1.dll`.

Nesting/Geometrie:
`N32DLL.DLL`, `N32DLLA.DLL`, `N32DLLB.DLL`, `N32DLLC.DLL`, `N32DLLD.DLL`, `n64dll.dll`, `AutoNester-T_x64.dll`, `NestMTNG.exe`.

Simulation/NC-Hilfskomponenten:
`NCSim.exe`, `CCnc1.Exe`, `Essi1.Exe`, `MsRez1.Exe`.

Weitere Bibliotheken wurden eingeordnet, aber nicht als CAD/CAM-Verhalten interpretiert, wenn sie erkennbar nur Laufzeit-, Bericht-, Lizenz-, Netzwerk- oder Grafik-Infrastruktur darstellen.

## CutAI-Prinzip

Interne Architektur:

`Geometrie -> Teil/Kette/Abschnitt -> Werkzeug/Technologie -> Fase/Anlauf/Mikrosteg -> Reihenfolge -> neutraler CAM-Plan -> separater Postprozessor`

Der Postprozessor bleibt absichtlich getrennt vom CAD/CAM-Datenmodell. Das verhindert, dass maschinenspezifische M-/G-Code-Annahmen in Geometrieobjekte eingebaut werden.
