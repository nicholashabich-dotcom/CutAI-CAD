# CutAI CAD/CAM v0.7.5

v0.7.5 korrigiert das Maschinenmodell grundlegend: Steuerung, Schneidverfahren, Hersteller/Quelle, Kopfkinematik und Werkzeug werden nicht mehr als ein einziges „Maschinenprofil“ vermischt.

## Anlagenmodell

Ein Projekt speichert jetzt getrennt:

- Steuerung/CNC: MicroStep iMSNC, Eckelmann oder neutral
- Bearbeitungsstation(en)
- Verfahren je Station: Plasma, Laser, Autogen, Bohren, Wasserstrahl
- Hersteller/Quelle: bei Plasma Hypertherm oder Kjellberg; bei Laser IPG oder Raycus; weitere generische Quellen sind möglich
- Ausführung/Kinematik: z. B. senkrecht, Rotator/Bevel, Bevel-Kopf oder Bohrspindel
- Werkzeug je Abschnitt innerhalb der gewählten Station

Damit sind z. B. `iMSNC + Hypertherm Plasma + Rotator/Bevel` und `Eckelmann + IPG Laser + senkrecht` zwei klar getrennte Konfigurationen.

## Herstellerdaten

Der vorhandene Machine Snapshot enthält Hypertherm-XPR-Plasmadaten. Diese Referenz wird nur noch einer passenden Plasma-/Hypertherm-Station zugeordnet. Sie wird nicht auf Kjellberg, IPG, Raycus, Autogen, Bohren oder Wasserstrahl übertragen.

Für Kjellberg-, IPG- und Raycus-spezifische Technologieparameter liegen in den bisher ausgewerteten Dateien keine entsprechenden Datensätze vor. CutAI erfindet dafür keine Parameter.

## CAM pro Abschnitt

Jeder Abschnitt speichert jetzt zusätzlich `stationId`. Dadurch kann ein Teil verschiedene Bearbeitungen kombinieren, z. B. Plasma schneiden, Laser markieren oder Bohren, sofern die entsprechenden Stationen im Anlagenaufbau vorhanden sind.

Werkzeugfarben berücksichtigen Station und Verfahren. Fasen bleiben auf Bevel-/Rotator-fähige Stationen beschränkt und die CAM-Prüfung meldet eine Fase auf einer nicht dafür konfigurierten Station als Fehler.

## Postprozessor

Steuerung und Postprozessor bleiben getrennte Ebenen. Für iMSNC ist MicroStep DIN als passende Referenz hinterlegt, für Eckelmann der Eckelmann-Postprozessor. Der Benutzer kann das Ziel weiterhin sehen und prüfen. v0.7.5 erzeugt weiterhin kein freigegebenes, maschinenausführbares NC.

## Bestehende Funktionen

DXF-Import/-Export, Konturerkennung, Abschnitte trennen/verbinden, Werkzeugansicht, Fasenvisualisierung, V/Y/X/K, Alfa1/Alfa2, TP/TN, An-/Ausläufe, Startpunkte, automatische/manuelle Schneidfolge, CAM-Prüfung, Simulation und neutraler CAM-Plan bleiben erhalten.
