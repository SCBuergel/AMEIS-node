# AMEIS-node
This project connects to an Arduino Uno running the [AMEIS-arduino](https://github.com/SCBuergel/AMEIS-Arduino) firmware. It also wraps some basic functionalities with a REST API.

# Setup
1. Install Node.JS and the node package manager NPM
2. Clone (or download) this repository, open a terminal and navigate inside the folder of this repository.
3. Run `npm install` to load all dependencies.
4. Connect an Arduino Uno via USB.
5. Install the Arduino PC software and driver, connect the Arduino and note the serial port name (in Windows, e.g. `COM3`)
6. Install the [AMEIS-arduino](https://github.com/SCBuergel/AMEIS-Arduino) firmware on the Arduino.
6. Open the file `app.js` and edit all the way on the bottom the line `setupSerialPort('COM3');` to match the serial port name that was identified in the previous step, save the file.
7. Run `node app.js` to run the main Node.JS script.
