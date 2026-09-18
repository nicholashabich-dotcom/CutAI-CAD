# ASPER / MicroStep Referenz für CutAI v0.7.1

## Ausgewertete Bereiche

Die bereitgestellten Dateien wurden nur statisch analysiert. Für CutAI wurden daraus Architektur und Datenmodell abgeleitet, nicht proprietärer Programmcode übernommen.

### CAD / Konturen / DXF

`Asper.exe`, `DxfDrawDll.dll`, `P_DXF.dll`, `WSelect.exe` und die Parameterdateien zeigen ein konturbasiertes Modell mit DXF-Layern, Teilen, Konturen, Werkzeugzuordnung und Exportmodulen. Daraus stammt in CutAI die Trennung `Teil/Kontur -> Geometrie -> CAM-Attribute` sowie die layerweise Konturerkennung.

### Werkzeuge / Technologie

`param.xml`, `param-multi.xml`, `AnalyzerCNC.dll`, `SqlCommon.dll`, `DataContexts.dll` und `CadCamMaterialFilter.dll` zeigen getrennte Werkzeug-, Material-, Dicken- und Technologieinformationen. Das integrierte Referenzprofil wird aus der bereitgestellten `param.xml` erzeugt. Weitere ASPER-Parameterdateien können lokal im Browser importiert werden.

### Fasen

`param.xml` und `param-multi.xml` enthalten u. a. RotType, BevelCorrectionType, CanVarBev, Winkel und Layerzuordnungen. `P_DIN1.dll`/`P_DIN1aw.dll` zeigen zusätzliche mehrstufige Fasenstrukturen. CutAI modelliert deshalb bis zu vier Fasenflächen, Variable-Bevel-Metadaten, Azimut und Additional-Bevel-Modi, erzeugt daraus aber noch kein Maschinen-NC.

### Postprozessoren

Die bereitgestellten Module `P_DIN1`, `P_ESSI`, `P_DXF`, `P_Beckhoff`, `P_Eckelmann`, `P_EdgeG`, `P_Flex`, `P_Kinetic`, `P_Rez1` und `P_awac` exportieren dieselbe ASPER-Plugin-Grundschnittstelle. CutAI bildet dieses Prinzip mit einem neutralen CAM-Plan plus auswählbarem späterem Postprozessor-Ziel nach.

### Simulation

`NCSim.exe` bestätigt eine getrennte NC-Simulation mit Werkzeug-, Fasen- und Mehrkopfbezug. V0.7.1 enthält deshalb zunächst eine sichere geometrische CAM-Simulation für Reihenfolge, Schnittweg und Eilweg.

### Nesting

`N32DLL*`, `n64dll.dll`, `AutoNester-T_x64.dll` und `NestMTNG.exe` zeigen, dass Schachtelung ein eigener Baustein ist. Nesting bleibt deshalb bewusst getrennt vom CAD/CAM-Kern und ist noch nicht Teil dieser Version.

### Produktions-/Datenbankebene

`CadcamMzm.dll`, `CadcamMZMWrap.dll`, `MZM.dll`, `MRP.dll`, `DataContextsCadcam.dll` und `ConnectionStringManager.dll` betreffen u. a. Projekte, Material, Lager/Restplatten und Produktionsdaten. Diese Ebene wird in v0.7.1 noch nicht angebunden.

### Infrastruktur

OpenSSL-, GLUT-, Crystal-Reports-, ACL-, Sprach- und sonstige Laufzeitbibliotheken wurden zur Einordnung geprüft, beeinflussen den CAD/CAM-Kern aber nicht direkt.

## Sicherheitsgrenze

Die aktuelle Software ist ein CAD/CAM-Prototyp und kein freigegebener Maschinen-Postprozessor. Maschinenbefehle werden erst dann erzeugt, wenn konkrete Maschinenparameter, Steuerungsvariante und Referenzprogramme sicher abgeglichen werden können.
