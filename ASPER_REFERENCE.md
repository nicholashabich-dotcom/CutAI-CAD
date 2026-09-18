# ASPER / MicroStep Referenz für CutAI v0.7.5

## Warum das Maschinenmodell getrennt ist

Die ASPER-Unterlagen behandeln die Auswahl des Postprozessors und die Werkzeugkonfiguration als getrennte Einstellungen. Der Schulungsleitfaden nennt „DIN“ für MicroStep-Anlagen und „Eckelmann“ für MSE SmartFL-Anlagen, während Werkzeuge abhängig von Maschinentyp und Konfiguration separat definiert werden.

CutAI bildet deshalb nicht mehr „Maschine = Hypertherm“ oder „Maschine = Laser“ ab. Stattdessen gibt es die Ebenen:

1. Steuerung/CNC
2. Bearbeitungsstation
3. Verfahren
4. Hersteller/Quelle
5. Kopfkinematik/Ausführung
6. Werkzeug
7. herstellerspezifische Technologiereferenz

## Aktuell bekannte Hersteller-/Verfahrensgruppen

- Plasma: Hypertherm, Kjellberg, generisch
- Laser: IPG, Raycus, generisch
- Autogen
- Bohren
- Wasserstrahl

Plasma kann als senkrechte Station oder Rotator/Bevel-Station angelegt werden. Eine Rotator/Bevel-Station kann sowohl das senkrechte Werkzeug als auch Fasenwerkzeuge führen.

## Snapshot-Grenze

Der bislang analysierte Machine Snapshot liefert Hypertherm-XPR-Plasmatechnologien und Fasen-Korrekturreferenzen. Diese Daten dürfen nur an passende Hypertherm-Plasmastationen gebunden werden. Für Kjellberg, IPG und Raycus liegen aus den bisher bereitgestellten Quellen keine gleichartigen Technologie-Kataloge vor.

## Abschnittsmodell und Fasen

ASPER unterscheidet Entity, Section, Chain und Part. Eine Chain kann für spezielle technologische Operationen in mehrere Sections aufgetrennt werden. Fasendefinitionen wirken auf komplette Abschnitte. CutAI hält deshalb `chainId`, `sectionIndex`, `stationId` und eigene CAM-Parameter pro Abschnitt vor.

## Noch bewusst nicht implementiert

- freigegebener MicroStep-DIN-Postprozessor
- freigegebener Eckelmann-Postprozessor
- direkte Maschinenkommunikation
- herstellerspezifische Technologie-Datenbanken für Kjellberg, IPG und Raycus
- vollständige ATHC-/Höhenkontrolllogik
- Corner-Loops als maschinenspezifische Technologie
