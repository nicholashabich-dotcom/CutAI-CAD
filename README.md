# CutAI CAD/CAM v0.7.1

Diese Version ist der erste CutAI-Build, der systematisch aus den bereitgestellten ASPER-/MicroStep-Dateien abgeleitet wurde. Die Dateien wurden ausschließlich statisch ausgewertet. Keine EXE oder DLL wurde ausgeführt.

## Was v0.7.1 jetzt kann

- echte Konturen statt nur loser Zeichenobjekte
- CAD: Linie, Rechteck, Kreis und Bogen
- Fang, Pan, Pinch-Zoom, Verschieben, Kopieren, Mehrfachauswahl, Undo/Redo
- DXF R12 Import: LINE, ARC, CIRCLE, POLYLINE/VERTEX, LWPOLYLINE
- layerweises Verketten einzelner LINE-/ARC-Elemente zu Konturen
- DXF R12 Export, bei reinen Linienkonturen als geschlossene POLYLINE
- ASPER-orientiertes Werkzeugmodell aus `param.xml`
- Werkzeug-Metadaten wie RotType, CanVarBev, SupportsTHT, CanPunch und HeadCount
- lokaler Import eigener `param.xml` / `param-multi.xml` direkt im Browser
- lokaler Import von `asf.ini` und `essi.ini`
- DXF-Layerregeln aus importierten ASPER-Parametern können Werkzeug und Fasenwinkel automatisch auf importierte Konturen übertragen
- Material und Dicke
- Startpunkt, Innen/Außen, Richtung und Schnittreihenfolge
- Lead-In / Lead-Out
- neutrale Schnittfuge/Kompensation als CAM-Metadaten
- Fasenprofil mit bis zu vier Flächen, V/Y/K/X bzw. benutzerdefiniert, Steg, Azimut und variable Fase
- Fasenlimit standardmäßig 50°
- Additional-Bevel-Modus und HP2CNC als Maschinenprofil-Metadaten
- Auto-CAM: Innenkonturen vor Außenkonturen, Richtung und fehlende Startpunkte
- geometrische CAM-Simulation mit Reihenfolge, Schnittlänge und Eilweg
- CAM-Prüfung
- neutraler CAM-Plan JSON
- auswählbares Postprozessor-Ziel als Metadatum
- ASPER-Referenzdialog mit analysiertem Build und Modulstruktur
- Migration von v0.6 und v0.7-Projekten
- lokales Autosave

## Bewusst noch nicht enthalten

CutAI erzeugt in v0.7.1 **kein ausführbares Maschinen-NC**. Obwohl in `P_DIN1.dll`, `P_DIN1aw.dll`, `NCSim.exe` und `CCnc1.Exe` konkrete MicroStep-DIN-/Fasenstrukturen erkennbar sind, werden diese nicht blind ausgegeben. Für einen echten Postprozessor fehlen weiterhin die konkrete Maschinenkonfiguration und eine Validierung gegen bekannte Gutprogramme bzw. Herstellerdaten.

Das auswählbare Postprozessor-Ziel dient daher nur dazu, den späteren Datenfluss vorzubereiten.

## ASPER-Konfiguration lokal benutzen

Unter **Projekt / Maschine** kann eine lokale ASPER-Datei geladen werden. `param.xml` und `param-multi.xml` werden im Browser gelesen und nicht an einen Server übertragen. Maschinenprofile, Werkzeuglisten und vorhandene DXF-Layerregeln stehen danach in CutAI zur Auswahl.

`asf.ini` übernimmt derzeit insbesondere `ADDITIONAL_BEVEL` und `HP2CNC`. `essi.ini` wird als ESSI-Profil-Metadatum gespeichert.

## GitHub Pages

Alle Dateien aus diesem Ordner in die Repository-Wurzel hochladen. Die eigentlichen originalen ASPER-/MicroStep-Binärdateien und Firmenkonfigurationen gehören **nicht** in das öffentliche Repository. CutAI enthält nur daraus abgeleitete, für diesen Prototyp notwendige Referenzdaten.
