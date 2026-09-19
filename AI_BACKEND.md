# CutAI KI-Backend-Vertrag v0.7.9

Die GitHub-Pages-App enthält absichtlich keinen API-Schlüssel. Eine echte Modell-KI wird über einen eigenen HTTPS-Proxy angebunden.

## Request

```json
{
  "version": "cutai-ai-request/0.7.9",
  "prompt": "S235 10 mm, Kjellberg HiFocus 280 mit 130 A ...",
  "context": {"schema": "cutai-ai-context/0.7.9"},
  "allowedActions": [
    "set_sheet", "set_material", "add_rect", "add_circle", "corner_holes",
    "select_all", "clear_selection", "move", "duplicate", "delete",
    "assign_station", "set_technology_reference", "set_template_reference",
    "assign_tool", "set_bevel", "set_lead_in", "set_lead_out",
    "apply_reference_metadata", "import_reference_geometry", "compare_reference",
    "auto_order", "set_view", "fit_view", "validate"
  ]
}
```

`context.machinePackage` ist standardmäßig bei Online-KI **nicht** enthalten. Der lokale Browser fügt den begrenzten Maschinen-/Technologiekontext nur hinzu, wenn der Benutzer „Maschinen-/Technologiekontext an Online-KI senden“ aktiviert.

## Response

```json
{
  "summary": "Bauteil mit vier Löchern auf vorhandener Kjellberg-Plasmastation",
  "actions": [
    {"type":"set_material","params":{"name":"S235","thicknessMm":10},"target":"project"},
    {"type":"add_rect","params":{"widthMm":300,"heightMm":200,"x":0,"y":0},"target":"new"},
    {"type":"assign_station","params":{"stationId":"...","process":"plasma","manufacturer":"Kjellberg"},"target":"created_all_or_selection"},
    {"type":"set_technology_reference","params":{"id":"...","stationId":"..."},"target":"project"}
  ],
  "warnings": []
}
```

CutAI verwirft unbekannte Aktionstypen. Der Online-Dienst darf keine Maschinenbefehle, Shell-Kommandos oder beliebiges JavaScript zurückgeben. Ein Backend soll keine Technologieparameter erfinden, wenn sie im übergebenen Maschinenkontext nicht vorhanden sind.


Ab v0.7.9 kann der freigegebene Kontext zusätzlich `templateLibrary` und `templateReference` enthalten. Die Bibliothek stammt aus einer lokal geladenen ASPER-Schablonen-ZIP und wird an einen Online-Endpunkt nur weitergegeben, wenn die Freigabe für lokalen Maschinen-/Technologiekontext aktiviert ist. Neue erlaubte Aktion: `set_template_reference`.


## Werkzeugrollen statt globaler T-Codes

Ein KI-Backend soll Werkzeugwünsche bevorzugt semantisch zurückgeben, z. B. `{"type":"assign_tool","params":{"semanticRole":"bevel_top"}}`. Konkrete T-Codes dürfen nur verwendet werden, wenn sie im übergebenen Maschinen-/Schablonenkontext tatsächlich vorhanden sind. T111/T211/T311 sind ausdrücklich **keine globalen Konstanten**.

## CNC/PLA-Referenzaktionen

Wenn `context.fileReference` vorhanden ist, darf ein Backend zusätzlich `apply_reference_metadata`, `import_reference_geometry` und `compare_reference` verwenden. `import_reference_geometry` ist nur für eine als CNC erkannte Referenz zulässig. PLA bleibt eine Metadatenreferenz, bis das native Format vollständig dokumentiert und geprüft ist.
