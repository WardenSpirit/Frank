#  Semestrální práce z předmětu KAJ: Schyzofrenie
## Instrukce pro hodnotitele
1. instalace Node.js, pokud chybí (funguje s verzí 16.11.0, ostatní nemám vyzkoušené)
2.	clone tohoto repozitáře
3. otevření 2 terminálů
4.	napsání následujícího (ze složky Frank):
	- v jednom terminálu: "npx serve"
	- v druhém: "node .\server\index.js"
5. otevření prohlížeče na stránce http://localhost:3000/client/
6. otevření dalších n karet na téže stránce

### Dobré vědět
- Cílem je dostat se co nejrychleji k truhle pomocí šipek, na mobilech pomocí gest jedním ze 4 směrů.
- Tahy se mají vždy provést až poté, co jsou odeslány tahy ode všech připojených klientů.
- V tabulce pod mapou jsem nestihl implementovat ukazatele času a skóre, ale to není v zadání (dostupném níže).
- Animace obláčků prachu za hrdinou (kočkou) mají ten účel, aby hráč znal pořadí tahů (a neměl motivaci dívat se do dev tools na příchozí zprávy). Je to jediná možnost, jak se s ostatními hráči dorozumět. Komunikace nabyde významu při počítání skóre a měření času.

### Nepovinné kategorie
|Položka         |Splněno?                       |
|----------------|-------------------------------|
|Validita |nevím, zda funguje pro všechny prohlížeče |
|Grafika - SVG / Canvas |ANO |
|Média - Audio/Video |NE, hra je bohužel bez zvuku |
|Formulářové prvky |NE, hráč se nechce zdržovat s vyplňováním |
|Offline aplikace |NE, běh zajišťuje server |
|Pokročilé selektory |ANO |
|Vendor prefixy |NE |
|CSS3 transformace 2D/3D |NE |
|Media queries |ANO |
|Použití JS frameworku či knihovny |Node.js |
|Funkční historie |NE |
|Ovládání medií |NE |
|Offline aplikace |NE |
|JS práce se SVG |NE, nicméně jsem čas trávil s canvasem (hlavně na animacích) |


## Zadání
Jedná se o tahovou hru pro 2 a více hráčů.
Herní prostor je náhodně vygenerovaná mřížka se 4 typy políček:
- políčko, kde je figurka (tuto jedinou figurku ve hře ovládají všichni hráči současně)
- políčko, kde je překážka (např. oheň; na toto políčko figurku hráči nesmí dostat)
- volné políčko
- cílové políčko

Cílem hry je společnými silami dostat figurku do cílového políčka.
V jednom tahu musí každý hráč dát figurce jeden z příkazů např. pomocí tlačítka (na počítači možnost použití klávesnice), příkazy jsou:
- vzhůru,
- vpravo,
- dolů,
- vlevo

Pořadí hráčů není nijak dáno a pořadí je určeno časy, v jakých je hráči odeslali.
Příkazy ostatních hráčů nikdo nevidí až do chvíle, kdy ten svůj vloží poslední hráč.
Figurka se poté pohybuje z políčka na políčko podle příkazů od hráčů v takovém pořadí, v jakém přišly.
Po příchodu nového hráče do hry se tento hráč může okamžitě přidat k ostatním a ovládat s nimi figurku začínaje probíhajícím tahem.

## Postup
Práci jsem si rozdělil na server a klient, server bude zdrojem pravdy a bude zpracovávat tahy sesbírané od klientů. Výsledky jejich tahů jim pak rozešle.

## Hlavní problémy
- Web Sockets - nebyly k nalezení zdroje pro moji strukturu aplikace
- Asset packs - asset pack bylo těžké vybrat
- Animations - náročné časování a překreslování
