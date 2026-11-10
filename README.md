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
Requires [Node.js](https://nodejs.org/) 22.x (22.13 or newer), 24.x, or 26 or newer, with npm ([installation guide](https://nodejs.org/en/download)).

```sh
git clone git@gitlab.fel.cvut.cz:muchaja3/frank.git
cd frank
npm ci      # install dependencies pinned in package-lock.json
npm start   # start the server on 127.0.0.1:3000
```

Then open [http://localhost:3000/](http://localhost:3000/). To simulate additional players, open more tabs on the same page.
It may appear that the game stops working, but please follow the instructions below.

### Testing from other devices
By default, the server listens only on `127.0.0.1`, so other devices on the network can't connect to it. To test the game from another device, for example a phone, set `LISTEN_HOST=0.0.0.0` to listen on all IPv4 addresses of the computer. Use it only on a trusted network: anyone on the same network, for example on café or school Wi-Fi, can then connect to the server and join or disrupt the game.

```sh
LISTEN_HOST=0.0.0.0 npm start
```

On Windows, the `VAR=value command` syntax works in Git Bash, but not in PowerShell or cmd. In PowerShell:

```powershell
$env:LISTEN_HOST="0.0.0.0"; npm start
```

In cmd, put the quotes around the whole assignment, so the space before `&&` doesn't end up in the value:

```bat
set "LISTEN_HOST=0.0.0.0" && npm start
```

Unlike `LISTEN_HOST=0.0.0.0 npm start`, the PowerShell and cmd variants keep the variable for the rest of the terminal session, so every later `npm start` in the same window exposes the server again. Clear it when you are done: `Remove-Item Env:LISTEN_HOST` in PowerShell, `set "LISTEN_HOST="` in cmd (quoted, so a trailing space doesn't end up in the value).

Other devices then open `http://<LAN IPv4 address of the computer>:3000/`. `hostname -I` or `ip -4 addr` shows the address on Linux, `ipconfig` on Windows. The computer's firewall (for example ufw or Windows Defender Firewall) or client isolation on public Wi-Fi may still block the connection.

#### Windows Firewall configuration

If other devices still cannot connect, check the Windows network profile and firewall settings:

1. **Set the network profile to Private:**
    - Open `Settings`.
    - Go to `Network & Internet` → `Wi-Fi`.
    - Click the currently connected Wi-Fi network.
    - Under `Network profile`, select `Private`.
   

2. **Allow incoming connections through Windows Firewall:**
    - Press `Win + R`, enter `wf.msc`, and press `Enter`.
    - Open `Inbound Rules` in the left tab and click `New Rule...` on the right (under the `Action` tab).
    - Select `Port` and click `Next`.
    - Select `TCP` and enter the port used by the server (e.g. `3000`).
    - Select `Allow the connection`.
    - Check `Private` and click `Next`.
    - Give the rule a descriptive name (e.g. `Frank Development Server 3000`) and finish the config.

Only enable the rule for the `Private` network profile, and only on networks you trust.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development, testing, issue, and merge request guidelines.

## Instructions
### Basics
- The goal is to guide the character to the destination using arrow keys.
  - the character (cat, snake, etc.) and destination (chests, mouses, etc.) image depends on the current version
- The number of points increases when reaching chests and decreases when stepping off the path or when the time limit of the game runs out.
- The score is displayed on the left in the bottom table, along with the number of connected players on the right.

### Multiplayer Mode
- Players collaborate, controlling characters on the same map.
- For serious play, players should avoid seeing each other's keyboards and communicate effectively.
- The character waits for instructions (movement direction) from all players before moving.
  - This may give the impression that the game stops working when additional players join.
  - The wait is limited by the time limit of the game (60 seconds by default, see Map Settings & Controls below). It is counted from the start of the game, not of the turn.
  - When the time runs out, a new game on a new map starts for all players, even if some of them haven't sent their move yet or nobody has moved at all. The moves already entered in the current turn are discarded, not executed.
  - Every player loses a point (but never below 0), including players who have already sent their move and players who are idle.
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
- **Time limit**: The `time limit` setting (hourglass icon) is the length of a game in seconds, from 5 to 120, 60 by default. It is shared by all players. When it runs out, a new game starts and everyone loses a point, see Multiplayer Mode above. The countdown restarts with every new game (reaching a chest, stepping into a hole, applying settings, or a timeout), and a changed value applies from the game that `APPLY` starts.
- **Textures**: The `goal and hero` setting (`actors`) picks the look of the hero and the treasure (`cat` by default, or `snake`), the `map` setting (`tiles`) the look of the path and the holes (`garden` by default, or `volcano`). Like the other settings they are shared by all players: everyone sees the textures of the game that `APPLY` starts, and the server only passes them on.
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
Vyžaduje [Node.js](https://nodejs.org/) řady 22 (od 22.13), řady 24 nebo 26 a novější a npm ([návod k instalaci](https://nodejs.org/en/download)).

```sh
git clone git@gitlab.fel.cvut.cz:muchaja3/frank.git
cd frank
npm ci      # instalace závislostí podle package-lock.json
npm start   # spuštění serveru na 127.0.0.1:3000
```

Poté otevřít http://localhost:3000/. Pro simulaci dalších hráčů otevřít další karty na téže stránce.
Hra jen zdánlivě přestane fungovat (viz instrukce níže).

### Testování z jiných zařízení
Server ve výchozím stavu naslouchá jen na `127.0.0.1`, takže se k němu jiná zařízení v síti nepřipojí. Pro testování z jiného zařízení, např. z telefonu, nastavit `LISTEN_HOST=0.0.0.0`, aby server naslouchal na všech IPv4 adresách počítače. Jen v důvěryhodné síti: kdokoli ve stejné síti, např. na Wi-Fi v kavárně nebo ve škole, se pak může připojit k serveru a do hry nebo ji narušit.

```sh
LISTEN_HOST=0.0.0.0 npm start
```

Ve Windows funguje zápis `PROMĚNNÁ=hodnota příkaz` v Git Bash, ale ne v PowerShellu ani v cmd. V PowerShellu:

```powershell
$env:LISTEN_HOST="0.0.0.0"; npm start
```

V cmd uvozovky kolem celého přiřazení, aby mezera před `&&` neskončila v hodnotě:

```bat
set "LISTEN_HOST=0.0.0.0" && npm start
```

Na rozdíl od `LISTEN_HOST=0.0.0.0 npm start` zůstane proměnná ve variantě pro PowerShell i pro cmd nastavená po zbytek relace terminálu, takže každé další `npm start` ve stejném okně server opět zpřístupní. Po skončení ji smazat: v PowerShellu `Remove-Item Env:LISTEN_HOST`, v cmd `set "LISTEN_HOST="` (v uvozovkách, aby v hodnotě nezůstala mezera na konci).

Jiná zařízení pak otevřou `http://<IPv4 adresa počítače v LAN>:3000/`. Adresu ukáže `hostname -I` nebo `ip -4 addr` na Linuxu a `ipconfig` ve Windows. Připojení může i tak blokovat firewall počítače (např. ufw nebo Windows Defender Firewall) nebo izolace klientů na veřejné Wi-Fi.

#### Nastavení Windows Firewallu

Pokud se ostatní zařízení stále nemohou připojit, zkontroluj nastavení síťového profilu a firewallu ve Windows:

1. **Nastavení síťového profilu na privátní (soukromou) síť:**
    - Otevři `Nastavení`.
    - Přejdi do `Síť a internet` → `Wi-Fi`.
    - Klikni na aktuálně připojenou Wi-Fi síť.
    - V části `Profil sítě` vyber `Privátní`.


2. **Povolení příchozích připojení ve Windows Firewallu:**
    - Zmáčkni `Win + R`, zadej `wf.msc` a potvrď klávesou `Enter`.
    - V levém panelu otevři `Příchozí pravidla` a v pravém panelu (v části `Akce`) klikni na `Nové pravidlo...`.
    - Vyber `Port` a klikni na `Další`.
    - Vyber `TCP` a zadej port (`Konkrétní místní porty)`, na kterém server běží (např. `3000`).
    - Vyber `Povolit připojení`.
    - Zaškrtni `Privátní` a klikni na `Další`.
    - Pravidlo pojmenuj (např. `Frank Development Server 3000`) a stiskni `Dokončit`.

Pravidlo povol pouze pro soukromý profil `Privátní`, a to jen v důvěryhodných sítích.

## Přispívání
Pravidla vývoje, testování, práce s issues a merge requesty jsou v souboru [CONTRIBUTING.md](CONTRIBUTING.md).

## Instrukce
### Základ
- Cílem je dostat postavu k cíli pomocí šipek,
  - přesná podoba postavy (kočka, had apod.) a cíle (truhla, myš apod.) závisí na verze
- S truhlami skóre roste, při kroku mimo cestu nebo po vypršení časového limitu hry klesá,
- Skóre je ve spodní tabulce vlevo, počet připojených hráčů tamtéž, ale vpravo.

### Více hráčů
- Hráči spolupracují, ovládají též postavu na též mapě.
- Pokud je hra brána vážně, hráči by měli hrát tak, aby si vzájemně neviděli na klávesnici a nedorozumívali se.
- Postava čeká na instrukci (tj. směr pohybu) od všech hráčů, než se pohne.
	- Proto se zdá, že hra přestává fungovat, když se připojí další hráč(i).
	- Čekání omezuje časový limit hry (výchozí 60 sekund, viz Nastavení mapy a ovládání níže). Počítá se od začátku hry, ne od začátku tahu.
	- Po vypršení limitu začne pro všechny hráče nová hra na nové mapě, i když někteří ještě neposlali svůj tah nebo se zatím nikdo nepohnul. Tahy již zadané v aktuálním kole se zahodí, neprovedou se.
	- Každý hráč přijde o bod (ne však pod 0), i ten, kdo už svůj tah poslal, i ten, kdo nehraje.
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
- **Časový limit**: Nastavení `time limit` (ikona přesýpacích hodin) je délka hry v sekundách, od 5 do 120, výchozí 60. Společné je pro všechny hráče. Po jeho vypršení začne nová hra a všichni přijdou o bod, viz Více hráčů výše. Odpočet začíná znovu s každou novou hrou (dosažení truhly, pád do díry, potvrzení nastavení nebo vypršení limitu) a změněná hodnota platí od hry, kterou `APPLY` spustí.
- **Vzhled**: Nastavení `goal and hero` (`actors`) volí vzhled hrdiny a pokladu (výchozí `cat`, nebo `snake`), nastavení `map` (`tiles`) vzhled cesty a děr (výchozí `garden`, nebo `volcano`). Stejně jako ostatní nastavení je společné pro všechny hráče: každý vidí vzhled hry, kterou `APPLY` spustí, a server ho jen předává dál.
- **Potvrdit / Zavřít**: Zmáčkni `Enter` pokud jsou zvýrazněné `APPLY` nebo `CLOSE` (`Potvrdit` / `Zavřít`), nebo poklepej na `APPLY` / `CLOSE` (`Potvrdit` / `Zavřít`) na dotykové obrazovce.
- **Hudba**: Zmáčkni `M` nebo poklepej jedním prstem pro nastavení (vypnutí/zapnutí) hudby (funguje uvnitř i mimo obrazovku nastavení).

***Moc děkuji Sheydy za vytvoření obrázků do hry!***
