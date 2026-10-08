Czech version follows. :czech_republic::ice_hockey::1st_place_medal:

# Frank the Game ( :gb: + :us: )

## Technical Details
- Communication with the server via WebSockets.
- Built on the Node.js framework.
- Utilizes the Express JS framework.
- Graphics:
  - Custom implementation of parsing spritesheets, rendering, and animations.
  - Uses 2 canvases (HTMLCanvasElements) layered on top of each other.

## Running publicly
- Visit [Frank's Game](https://frank-the-cat.glitch.me/).
  - Please be patient; it may take a moment for the app to start (10-90 seconds).

## Running Locally
1. Clone this repository and open a terminal in its root directory.
2. Run `./setup.sh` (Linux/macOS). It uses the system Node.js if it is 16.11.0 or newer,
   otherwise it downloads Node.js v24.21.0 into `.node/` (git-ignored), and then installs dependencies.
   - Manually: install Node.js ≥ 16.11.0 and run `npm ci`.
3. Make any necessary adjustments.
4. Start the server with the command printed by the script: `node .`, or `.node/bin/node .` with the local Node.js.
5. Open your browser and navigate to [http://localhost:3000/](http://localhost:3000/).
6. For simulating additional players: open additional tabs on the same page.
   - It may appear that the game stops working, but please follow the instructions below.

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

***A big thanks to my friend Sheydy for creating the assets!***

#  Hra Frank ( :czech_republic: )

## Technologické detaily
- komunikace se serverem skrz WebSockety
- framework Node.js
- na frameworku Express JS
- grafika:
  - vlastní implementace parsování spritesheetů, renderování a animací
  - využívá 2 pláten (HTMLCanvasElements) přes sebe

## Spuštění
- https://frank-the-cat.glitch.me/
	- Prosím o strpení, zapnutí apky na serveru chvilku trvá (10-90 sekund)

## Spuštění lokálně
1. clone tohoto repozitáře a otevření terminálu v jeho kořenové složce
2. příkaz `./setup.sh` (Linux/macOS): použije systémový Node.js, je-li verze aspoň 16.11.0,
	jinak stáhne Node.js v24.21.0 do `.node/` (ignorováno gitem), a nainstaluje závislosti
	- ručně: instalace Node.js ≥ 16.11.0 a příkaz `npm ci`
3. úprava
4. spuštění serveru příkazem vypsaným skriptem: `node .`, s lokálním Node.js `.node/bin/node .`
5. otevření prohlížeče na stránce http://localhost:3000/
6. pro simulaci dalších hráčů: otevření dalších n karet na téže stránce
	- jen zdánlivě přestane fungovat (viz instrukce níže)

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

***Moc děkuji Sheydy za vytvoření obrázků do hry!***
