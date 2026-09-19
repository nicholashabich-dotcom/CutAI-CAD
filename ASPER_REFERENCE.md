# ASPER / MicroStep Referenz für CutAI v0.7.9

## Getrenntes Maschinenmodell

Die ASPER-Unterlagen behandeln Postprozessor, Werkzeugkonfiguration und Technologieparameter als getrennte Ebenen. CutAI bildet deshalb nicht „Maschine = Plasmaquelle“ ab, sondern trennt Steuerung, Bearbeitungsstation, Verfahren, Hersteller/Quelle, Kopfkinematik, Werkzeug und Technologiereferenz.

## Maschinenpakete statt fest eingebetteter Technologiedaten

Reale Maschinen-Snapshots werden in v0.7.9 nicht in den öffentlichen Quellcode eingebettet. Der Benutzer lädt eine Snapshot-ZIP lokal im Browser. Der Parser liest daraus die aktive Maschinenkonfiguration und die zugehörigen Technologie-INIs.

Die bereitgestellten Snapshots dienen als Testfälle für unterschiedliche Maschinenkonfigurationen. CutAI unterscheidet zwischen **aktiv konfigurierter Station** und lediglich im Paket vorhandener Definition/Vorlage und übernimmt keine kundenspezifischen Adressdaten in den öffentlichen Programmcode.

## Abschnittsmodell und Fasen

ASPER unterscheidet Entity, Section, Chain und Part. Eine Chain kann für spezielle technologische Operationen in mehrere Sections aufgetrennt werden. Fasendefinitionen wirken auf komplette Abschnitte. CutAI hält deshalb `chainId`, `sectionIndex`, `stationId` und eigene CAM-Parameter pro Abschnitt vor.

## KI-Ebene

Die KI-Eingabe ist eine eigenständige CutAI-Funktion. Sie übersetzt Sprache in ein begrenztes internes CAD/CAM-Aktionsmodell. Bei geladenem Maschinenpaket darf der lokale Planer nur tatsächlich erkannte aktive Stationen und vorhandene Technologieprofile referenzieren. Mehrdeutige oder fehlende Technologien werden gemeldet statt erfunden.

## Noch bewusst nicht implementiert

- freigegebener MicroStep-DIN-Postprozessor
- freigegebener Eckelmann-Postprozessor
- direkte Maschinenkommunikation
- vollständige ATHC-/Höhenkontrolllogik
- Corner-Loops als maschinenspezifische Technologie

CutAI v0.7.9 erzeugt keinen maschinenausführbaren NC-Code.


## Reale Schablonen- und Dateireferenzen in v0.7.9

Die Anwendung kann nun lokal eine ASPER-Schablonensammlung mit CFG/PLB-Dateien indexieren. Die nativen Binärdateien werden nicht verändert. Zusätzlich gibt es einen Offline-Referenzleser für bestehende CNC/DIN-Dateien sowie eine Metadateninspektion für PLA. Diese Funktionen dienen der Kompatibilitätsanalyse; CutAI erzeugt weiterhin kein freigegebenes Maschinen-NC.


## Erkenntnis aus realen Schablonen

Gleich benannte Schablonen können in CFG und PLB unterschiedliche erkannte ASPER-Profile und damit unterschiedliche Werkzeugcodes enthalten. CutAI v0.7.9 führt solche Varianten getrennt und löst Werkzeugfunktionen semantisch gegen das ausgewählte Profil auf. Ein Werkzeugcode wird deshalb nicht mehr als universelle Bedeutung behandelt.

## CNC/PLA als Gegenprobe

Vorhandene ASPER-CNC-Dateien können als Offline-Gegenprobe für Tafel, Material, Werkzeugwahl, kommentierte Konturbewegungen, Kompensation und An-/Ausläufe verwendet werden. PLA wird weiterhin nur auf sichtbare Metadaten untersucht. Referenzdaten dürfen in ein CutAI-Projekt übernommen und mit dem Projekt verglichen werden, ohne die Datei auszuführen.
