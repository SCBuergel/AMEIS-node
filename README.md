# AMEIS-node
This project connects to an Arduino Uno running the [AMEIS-arduino](https://github.com/SCBuergel/AMEIS-Arduino) firmware. It also wraps some basic functionalities with a REST API.

# Setup
1. [Install Node.JS](https://nodejs.org/en/download/) and the node package manager NPM (installed anyway with default settings).
2. [Install git bash](https://git-scm.com/download).
3. [Install Arduino software](https://www.arduino.cc/en/Main/Software).
4. Flash the Arduino firmware with [our software](https://github.com/SCBuergel/AMEIS-Arduino).
5. Clone (or download) this repository, open a terminal and navigate inside the folder of this repository

    `git clone https://github.com/SCBuergel/AMEIS-node`
 
6. Open a terminal an navigate into the folder `AMEIS-node`, then run `npm install` to load all dependencies.
7. Connect an Arduino Uno via USB.
8. Install the Arduino PC software and driver, connect the Arduino and note the serial port name (in Windows, e.g. `COM3`)
6. Install the [AMEIS-arduino](https://github.com/SCBuergel/AMEIS-Arduino) firmware on the Arduino.
6. Open the file `app.js` and edit all the way on the bottom the line `setupSerialPort('COM3');` to match the serial port name that was identified in the previous step, save the file.
7. Run `node app.js` to run the main Node.JS script.
