# ASPER-Funktionsmatrix -> CutAI

Legende:
- ✅ umgesetzt und bedienbar
- 🟡 teilweise umgesetzt / neutrales Datenmodell vorhanden
- ⬜ geplant
- 🔒 bewusst noch ohne ausführbares Maschinen-NC

Die Matrix ist eine Entwicklungsreferenz. Sie paraphrasiert die Funktionsgruppen aus dem bereitgestellten ASPER-5.0-Handbuch und den Schulungsunterlagen und ist keine Kopie der ASPER-Oberfläche.

## Datei / Daten

| Bereich | Stand | CutAI |
|---|---:|---|
| Neues Projekt / Öffnen / Speichern | ✅ | eigenes JSON-Projektformat mit Autosave |
| DXF importieren | ✅ | LINE, ARC, CIRCLE, POLYLINE/LWPOLYLINE, Verkettung |
| SVG importieren | ✅ | Linie, Rechteck, Kreis, Polyline/Polygon |
| DXF exportieren | ✅ | DXF R12 |
| PLA | ⬜ | eigenes Projektformat vorhanden; proprietäres PLA wird nicht kopiert |
| CNC/DIN/ESSI Import/Export | 🔒 | Architektur und Referenzprofile vorhanden, keine freigegebene Maschinen-Ausgabe |
| Eigenschaften / Projektinformationen | 🟡 | Material, Dicke, Tafel, Maschinenprofil, CAM-Prüfung |
| Simulation | 🟡 | neutrale CAM-Simulation mit Schrittsteuerung |

## Bearbeiten / Geometrie

| Bereich | Stand | CutAI |
|---|---:|---|
| Undo / Redo | ✅ | bis 100 Projektzustände |
| Kopieren / Löschen | ✅ | Mehrfachauswahl unterstützt |
| Verschieben | ✅ | Touch/Drag und ΔX/ΔY |
| Drehen / Spiegeln | ⬜ | nächster CAD-Ausbau |
| Vergrößern / Verkleinern Geometrie | ⬜ | geplant |
| Konturen erkennen / verketten | ✅ | Linien/Bögen werden zu Konturen verbunden |
| Entity / Section / Chain | ✅ | eigenständiges Datenmodell |
| Abschnitt trennen / verbinden | ✅ | technologisch getrennte Abschnitte möglich |

## Ansicht

| Modus | Stand |
|---|---:|
| Normal | ✅ |
| Werkzeug | ✅ |
| Fase | ✅ |
| Geschwindigkeit | ✅ |
| ATHC | ✅ |
| Kopfindex | ✅ |
| Portalindex | ✅ |
| Leistung | ✅ |
| Schneidfolge | ✅ |
| Maßanzeige / Koordinaten | ✅ |
| frei konfigurierbare Farbpalette | ⬜ |

## Abschnitt / Technologie

| Funktion | Stand | CutAI |
|---|---:|---|
| Werkzeug zuweisen | ✅ | Werkzeugprofil + Farben |
| Schnitt aktivieren/deaktivieren | ✅ | deaktivierte Abschnitte werden nicht geordnet/simuliert |
| Startpunkt | ✅ | direkt auf Kontur setzen |
| Schneidrichtung | ✅ | geschlossen CW/CCW, offene Abschnitte vor/zurück |
| Kompensation an/aus/Seite | 🟡 | Attribute vorhanden; echte CutAI-Offsetbahn folgt |
| Priorität | ✅ | automatische Reihenfolge berücksichtigt Abschnitts-/Werkzeugpriorität |
| Vorstechen | 🟡 | Attribut + Darstellung, Maschinenzyklus noch neutral |
| IHS-Versatz | ✅ | Punkt und XY-Versatz gespeichert |
| Werkzeughöhe sperren | 🟡 | neutrales Attribut |
| relative Geschwindigkeit | ✅ | Abschnittsparameter + Farbansicht |
| eigene Geschwindigkeit | ✅ | neutrales Attribut in mm/min |
| Kühlen vor Abschnitt | 🟡 | neutrales Attribut |
| Leistung | ✅ | Abschnittsparameter + Farbansicht |
| Kopf / Portal | ✅ | Abschnittsparameter + Farbansicht |
| ATHC-Modus | ✅ | Standard, erkannte Oberfläche, Spannung lernen, gelernte Spannung, Aus |
| dynamisches Stechen | ⬜ | geplant |
| Fräsoperationen | ⬜ | Werkzeugdaten erkannt, Zykluseditor fehlt |

## Fasen

| Funktion | Stand |
|---|---:|
| V oben / positiv | ✅ |
| V unten / negativ | ✅ |
| Y oben | ✅ |
| Y unten | ✅ |
| X | ✅ |
| K | ✅ |
| Alfa1 / Alfa2 | ✅ |
| TP / TN | ✅ |
| berechnete untere Fasenhöhe | ✅ |
| variable Fase | ✅ |
| gleichbleibende Schräge | ✅ |
| mehrere Fasenflächen | ✅ bis 4 Flächen im neutralen Modell |
| sichtbare Fasen auf Kontur | ✅ |
| Bevel ATHC Expert | 🟡 ATHC-Grundmodell vorhanden, Expertenautomatik folgt |
| Corner-Loops | ⬜ geplant |

## An- und Ausläufe

| Funktion | Stand |
|---|---:|
| Anlauf Linie | ✅ |
| Anlauf Bogen | ✅ |
| Auslauf Linie | ✅ |
| Auslauf Bogen | ✅ |
| Länge / Winkel / Radius | ✅ |
| hinzufügen / entfernen | ✅ |
| senkrechter Fasen-Anlauf | ✅ als neutrales technologisches Attribut |
| Fasen-Anlauffaktor | ✅ Projektstandard |
| Überlappung | 🟡 gespeichert, echte Wegverlängerung im neutralen Modell vorbereitet |
| Loop | 🟡 gespeichert / sichtbar im Datensatz, Geometriealgorithmus folgt |
| automatische Kollisionsprüfung | ⬜ |

## Mikrostege

| Funktion | Stand |
|---|---:|
| punktweise erzeugen | ✅ |
| löschen | ✅ |
| Länge | ✅ |
| nach Programmende schneiden | ✅ als Attribut |
| schnelle Mikrostege | ⬜ |
| Frästiefe / vollständiger Fräsmikrosteg | ⬜ |
| automatische Verteilung nach Abstand | ⬜ |

## Schneidfolge

| Funktion | Stand |
|---|---:|
| automatisch | ✅ |
| manuell | ✅ |
| formaler Test | ✅ |
| Abschnittspriorität | ✅ |
| Folge trennen | 🟡 Metadatum vorhanden |
| Kettenschnitt | 🟡 Metadatum vorhanden |
| Common-line | ⬜ |
| Junction / Brücke | ⬜ |
| Traversierpfad mit Pausen | ⬜ |
| thermische Optimierung | ⬜ |

## Tafel / Nesting / Resttafel

| Funktion | Stand |
|---|---:|
| Tafelgröße | ✅ |
| Tafelansicht | ✅ |
| Schachtelrichtung | 🟡 als Einstellung vorhanden |
| manuelles Positionieren | ✅ |
| automatisches Nesting | ⬜ eigener Algorithmus geplant |
| in Löcher schachteln | ⬜ |
| Resttafel erzeugen/speichern | ⬜ |
| Multi-Head-Nesting | ⬜ |

## Dateigenerierung / NC-Parameter

| Einstellung | Stand |
|---|---:|
| Postprozessor-Ziel | ✅ Metadatum |
| relative Koordinaten | ✅ Metadatum |
| Kommentare | ✅ Metadatum |
| Werkzeugwechsel erzwingen | ✅ Metadatum |
| Bögen als Polylinien | ✅ Metadatum |
| Polylinien-Toleranz | ✅ |
| NC-Startposition | ✅ Metadatum |
| NC-Endposition | ✅ Metadatum |
| Schnittfugenmodus Steuerung/CutAI/Keine | ✅ |
| ausführbares MicroStep DIN | 🔒 nicht freigegeben |
| ausführbares ESSI | 🔒 nicht freigegeben |

## Nächste Ausbaustufen

1. CAD-Bearbeitung: Drehen, Spiegeln, Trimmen, Verlängern, Rundung/Fase als Geometrieoperation.
2. echte Offline-Schnittfugen-Offsetgeometrie.
3. automatische Mikrostege und echte Bahnunterbrechungen im neutralen Simulator.
4. Common-line, Junctions, Corner-Loops und Traversierpfade.
5. eigener Nesting-Kern und Resttafelverwaltung.
6. Bohr-/Fräszyklen als eigene Operationstypen.
7. erst danach validierter Maschinen-Postprozessor anhand vollständiger Konfiguration und Gutprogrammen.
