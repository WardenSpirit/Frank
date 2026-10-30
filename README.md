Czech version follows. :czech_republic::ice_hockey::1st_place_medal:

# Frank the Game ( :gb: + :us: )

## Technical Details
- Communication with the server via WebSockets, see [the messaging protocol](docs/PROTOCOL.md).
- Built on the Node.js framework.
- Utilizes the Express JS framework.
- Graphics:
  - Custom implementation of parsing spritesheets, rendering, and animations.
  - Uses 2 canvases (HTMLCanvasElements) layered on top of each other.

## Running publicly
- Visit [Frank's Game](https://frank-kps0.onrender.com/).
  - It may take a minute for the server to launch.

## Running Locally
Requires [Node.js](https://nodejs.org/) 22.x (22.12 or newer), 24.x, or 26 or newer, with npm ([installation guide](https://nodejs.org/en/download)).

```sh
git clone git@gitlab.fel.cvut.cz:muchaja3/frank.git
cd frank
npm ci      # install dependencies pinned in package-lock.json
npm start   # start the server on port 3000
```

Then open [http://localhost:3000/](http://localhost:3000/). To simulate additional players, open more tabs on the same page.
It may appear that the game stops working, but please follow the instructions below.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development, testing, issue, and merge request guidelines.

## Instructions
### Basics
- The goal is to guide the character to the destination using arrow keys.
  - the character (cat, snake, etc.) and destination (chests, mouses, etc.) image depends on the current version
- The number of points increases when reaching chests and decreases when stepping off the path.
- The score is displayed on the left in the bottom table, along with the number of connected players on the right.

### Multiplayer Mode
- Players collaborate, controlling characters on the same map.
- For serious play, players should avoid seeing each other's keyboards and communicate effectively.
- The character waits for instructions (movement direction) from all players before moving.
  - This may give the impression that the game stops working when additional players join.
- The character executes all received instructions.
- Instructions are processed in the order they were given by players (based on when they arrived at the server).
- Players must anticipate when and how to move the character to avoid obstacles and reach the goal.
- Successful cooperation with other players involves observing the character's movements and predicting their behavior.
- You can join an ongoing game.
  - The incoming player's score is set to 0, and each player maintains their own score.
  
### Map Settings & Controls
- **Open / close settings**: Press `S` (or `Escape` to close) on a keyboard, or use a **two-finger tap** (or **long tap** of 400 ms+) on a touchscreen. Opening or closing settings neither sends a move nor toggles music.
- **Navigate settings**: Use `Up` / `Down` arrow keys or drag vertically (`up` / `down`) to move the highlight between settings and the `APPLY` / `CLOSE` buttons.
- **Change values**: Use `Left` / `Right` arrow keys or drag horizontally (`left` / `right`) to change the highlighted setting by 1 (or switch textures). Values wrap around at their lower and upper bounds.
- **Apply / Close**: Press `Enter` when `APPLY` or `CLOSE` is highlighted, or tap `APPLY` / `CLOSE` on a touchscreen.
- **Music**: Press `M` or single-tap with one finger to pause/resume music (works both inside and outside the settings form).

***A big thanks to my friend Sheydy for creating the assets!***

#  Hra Frank ( :czech_republic: )

## Technologické detaily
- komunikace se serverem skrz WebSockety, viz [protokol zpráv](docs/PROTOCOL.md)
- framework Node.js
- na frameworku Express JS
- grafika:
  - vlastní implementace parsování spritesheetů, renderování a animací
  - využívá 2 pláten (HTMLCanvasElements) přes sebe

## Spuštění
- https://frank-kps0.onrender.com/
	- Zapnutí serveru může minutu trvat.

## Spuštění lokálně
Vyžaduje [Node.js](https://nodejs.org/) řady 22 (od 22.12), řady 24 nebo 26 a novější a npm ([návod k instalaci](https://nodejs.org/en/download)).

```sh
git clone git@gitlab.fel.cvut.cz:muchaja3/frank.git
cd frank
npm ci      # instalace závislostí podle package-lock.json
npm start   # spuštění serveru na portu 3000
```

Poté otevřít http://localhost:3000/. Pro simulaci dalších hráčů otevřít další karty na téže stránce.
Hra jen zdánlivě přestane fungovat (viz instrukce níže).

## Přispívání
Pravidla vývoje, testování, práce s issues a merge requesty jsou v souboru [CONTRIBUTING.md](CONTRIBUTING.md).

## Instrukce
### Základ
- Cílem je dostat postavu k cíli pomocí šipek,
  - přesná podoba postavy (kočka, had apod.) a cíle (truhla, myš apod.) závisí na verze
- S truhlami skóre roste, při kroku mimo cestu klesá,
- Skóre je ve spodní tabulce vlevo, počet připojených hráčů tamtéž, ale vpravo.

### Více hráčů
- Hráči spolupracují, ovládají též postavu na též mapě.
- Pokud je hra brána vážně, hráči by měli hrát tak, aby si vzájemně neviděli na klávesnici a nedorozumívali se.
- Postava čeká na instrukci (tj. směr pohybu) od všech hráčů, než se pohne.
	- Proto se zdá, že hra přestává fungovat, když se připojí další hráč(i).
- Poté postava provede všechny obdržené instrukce.
- Postava provádí instrukce v takovém pořadí, ve kterém je hráči zadali (přesněji ve kterém přišly na server).
- Je na jednotlivých hráčích, aby odhadli, kdy a jak mají hrát, aby se postava úspěšně vyhýbala překážkám a došla k cíli.
- Jediný způsob, jak s ostatními hráči dojít ke zdárné spolupracovat, je sledovat pohyb postavy a odhadovat z něj jejich budoucí chování.
- Lze se připojit i do již probíhající hry.
  - Skóre přicházejícího hráče je nastaveno na 0, každý hráč má své skóre.

### Nastavení mapy a ovládání
- **Otevření / zavření nastavení**: Zmáčkni `S` (nebo `Escape` pro zavření) na klávesnici nebo poklepej na obrazovku **dvěma prsty** (případně **dlouze podrž jeden prst**, alespoň 400 ms). Otevření ani zavření nastavení nehýbe s postavou ani neovládá hudbu.
- **Orientace / pohyb v nastavení**: Použij klávesy šipek `Nahoru` / `Dolů` nebo vertikálně přejeď prstem (`nahoru` / `dolů`) pro přesun zvýraznění mezi jednotlivými nastaveními a `APPLY` / `CLOSE` tlačítky (`Potvrdit` / `Zavřít`).
- **Změna hodnot**: Použij klávesy šipek `Doleva` / `Doprava` nebo horizontálně přejeď prstem (`doleva` / `doprava`) pro změnu zvýrazněného nastavení o 1 (nebo pro změnu designu). Maximální a minimální hodnota (1. a poslední) jdou cyklicky za sebou (z poslední hodnoty se dá opět dostat na tu 1. a naopak bez dlouhého překlikávání mezi ostatními hodnotami). 
- **Potvrdit / Zavřít**: Zmáčkni `Enter` pokud jsou zvýrazněné `APPLY` nebo `CLOSE` (`Potvrdit` / `Zavřít`), nebo poklepej na `APPLY` / `CLOSE` (`Potvrdit` / `Zavřít`) na dotykové obrazovce.
- **Hudba**: Zmáčkni `M` nebo poklepej jedním prstem pro nastavení (vypnutí/zapnutí) hudby (funguje uvnitř i mimo obrazovku nastavení).

***Moc děkuji Sheydy za vytvoření obrázků do hry!***
