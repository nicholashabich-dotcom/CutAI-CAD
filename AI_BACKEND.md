# CutAI KI-Backend

Die lokale KI-Eingabe bleibt ohne Server funktionsfähig. Für ein externes Sprachmodell kann weiterhin ein eigener HTTPS-Proxy verwendet werden. API-Schlüssel dürfen nicht in die öffentliche GitHub-Pages-Anwendung eingebettet werden.

Neu in v0.8.1: NC/DIN-Analysen bleiben vollständig lokal. NC-Programmtext wird nicht automatisch an einen Online-KI-Endpunkt gesendet. Ein späterer KI-NC-Assistent sollte nur strukturierte, ausdrücklich freigegebene Analysemerkmale erhalten und niemals selbständig ausführbaren Maschinen-Code an eine Steuerung übertragen.
