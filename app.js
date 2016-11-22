var express = require('express');
var serialport = require('serialport');
var chamberToPad = require('./ChipConfig.json');
var padToSwitch = require('./PcbConfig.json');

var app = express();
var port = 0;

function setupSerialPort(serialPortName) {
    // setting up the serial port for communication with the arduino, reads to console
    console.log('setting up serial port...');
    port = new serialport(serialPortName, {
	baudrate: 9600,
	parser: serialport.parsers.readline("\n")
    });

    port.on("open", function () {
	console.log('opened serial port ' + serialPortName);

	port.on('data', function(data) {
	    console.log('[serial port] ' + data);
	});
    });

    this.setTimeout(function(){send('setclockspeed 1\r\n');}, 3000);
    this.setTimeout(function(){send('setbitsperchunk 9\r\n');}, 6000);
    this.setTimeout(function(){send('setpins 5 4 7 2 8 9 10 11 12\r\n');}, 9000); // (for new PCB)
    //    this.setTimeout(function(){send('setpins 4 5 6 3 8 9 10 11 12\r\n');}, 9000); // (for old PCB (not really working))
    this.setTimeout(function(){send('setreset 1\r\n');}, 12000);
}

function ChamberToPad(stimPadId, recPadId) {
    // storing the indices of the stimulating and recording electrodes of a given chamber
    // stored in an array which is exported/imported via JSON in which the first entry corresponds to the first chamber
    this.stimPadId = stimPadId;
    this.recPadId = recPadId;
}

function PadToSwitch(padId, padType) {
    // storing the indices of a pad (connecting PCB and chip) and type of that pad connected to a given switch
    // stored in an array which is exported/imported via JSON in which the first entry corresponds to the first switch
    this.padId = padId;
    this.padType = padType;
}

app.get('/', function(req, res) {
    send('test\r\n');

    res.send('Can I haz AMEIS? <br />' +
	     JSON.stringify(getActiveSwitchIndices(1)));
});

function getActiveSwitchIndices(activeChamber) {
    // gets the switch indices which are to be activated when the indicated chamber is active
    var switchesToActivate = [];
    var pads = chamberToPad[activeChamber];
    console.log('length: ' + padToSwitch.length);
    console.log('pads: ' + JSON.stringify(pads));
    for (switchId = 0; switchId < padToSwitch.length; switchId++) {
	if (padToSwitch[switchId].padId == pads.stimPadId && padToSwitch[switchId].padType == 'stim')
	    switchesToActivate.push(switchId);
	if (padToSwitch[switchId].padId == pads.recPadId && padToSwitch[switchId].padType == 'rec')
	    switchesToActivate.push(switchId);
    }
    return switchesToActivate;
}

function BitField(clock, sync, din) {
    this.clock = clock;
    this.sync = sync;
    this.din = din;
}

function getBitField(activeChamber) {
    // gets bitfield (clock sync din) array for currently active chamber

    var headerLength = 2;
    var footerLength = 2;
    var bufLength = headerLength + footerLength + padToSwitch.length * 2; // * 2 in since for each value clock is high and low
    //(encoding a chamber is wasting a lot of bits, TODO: this is should be off-loaded from sending the switch sequence)
    var buf = [];
    
    // set header (SYNC low)
    buf.push(new BitField(1, 1, 0));
    buf.push(new BitField(0, 1, 0));

    console.log('Active chamber: ' + activeChamber);
    var activeSwitches = getActiveSwitchIndices(activeChamber);
    console.log('Active switches' + JSON.stringify(activeSwitches));

    // set payload of bitstream
    
    // iterate through all switches
    for (b = headerLength; b < bufLength - footerLength; b++) {

	var foundActive = 0;
	// iterate through active switches
	for (s = 0; s < activeSwitches.length; s++) {
	    // if active switch 
	    if (Math.floor((b - headerLength) / 2) == activeSwitches[s]){
		foundActive = 1;
		break;
	    }
	}
	buf.push(new BitField((b + 1) % 2, 0, foundActive));
    }
    
    // set footer (SYNC high)
//    buf.push(new BitField(1, 0, 0));
//    buf.push(new BitField(0, 0, 0));
    buf.push(new BitField(1, 1, 0));
    buf.push(new BitField(0, 1, 0));

    console.log('buffer length (in creating function): ' + buf.length + '.');
    return buf;
}

function bitfieldToBuffer(custBuf, activeChamber) {
    // transforms a custom bitfield to a standard buffer which can be sent out to Arduino
    var buf = new Buffer(custBuf.length * 2); // we need twice as many entries as we have 2 bytes per bitfield
    var clockIndex = 0;
    var syncIndex = 1;
    var dinIndex = 2;
    var tiltIndex = 3;
    var markIndex = 4;
    for (c = 0; c < custBuf.length; c++) {
	var tmpBuf =
	    custBuf[c].clock << clockIndex |
	    custBuf[c].sync << syncIndex |
	    custBuf[c].din << dinIndex |
	    (activeChamber + 1) << markIndex;
	buf[c * 2] = tmpBuf;
	buf[c * 2 + 1] = tmpBuf >> 8;
    }
    return buf
}

function tilt() {
    var tiltIndex = 3;
    var bufHigh = new Buffer(1);
    bufHigh[0] = 1 << tiltIndex;
    var bufLow = new Buffer(1);
    bufLow[0] = 0;
    send('sendbinarydata 1 1\r\n');
    setTimeout(function(){
		send(bufHigh);
		setTimeout(function(){
			send('sendbinarydata 1 1\r\n');
			setTimeout(function(){
			send(bufLow);
			}, 1000);
		}, 1000);
    }, 1000);
}

function send(message) {
    port.write(message);
    console.log('sending: ' + message);
}

app.get('/tilt', function(req, res) {
    tilt();
    res.send('initiated tilting');
});

app.get('/switch', function(req, res) {
    var chamber = req.query.chamber;
	console.log('chamber: ' + chamber);
    switchToChamber(chamber);
    res.jsonp({result: 1});
});

function switchToChamber(activeChamber) {
    var bitField = getBitField(activeChamber);
    var buf = bitfieldToBuffer(bitField, activeChamber);
    send('sendbinarydata 2 ' + buf.length/2 + '\r\n');//buf.length);
    setTimeout(function(){
	send(buf);
    }, 3000);
	// tilt
    //setTimeout(function(){
	//console.log('active chamber: ' + activeChamber);
	//console.log('bit field size: ' + bitField.length);
	//console.log('buf length: ' + buf.length);
	//tilt();
    //}, 6000);
}

app.get('/test', function(req, res) {
    send('test\r\n');
    res.send('test\r\n');
});

app.get('/debug', function(req, res) {
	var chamber = req.query.chamber;
	console.log('chamber = ' + chamber);
	res.jsonp({debug: 123});
});

curChamber = 0;
numChambers = 14;
holdTimeS = 10;
switchChamberHandler = 0;

app.get('/startExperiment', function(req, res) {
    holdTimeS = req.query.holdTime;
    curChamber = 0;
    res.send('started experiment');
    if (switchChamberHandler)
	this.clearInterval(switchChamberHandler);
    switchChamberHandler = this.setInterval(setNextChamber, holdTimeS * 1000);
});

function setNextChamber() {
    if (++curChamber >= numChambers) {
	curChamber = 0;
    }
    switchToChamber(curChamber);
}

app.get('/getNumRecordingSites', (req, res) => {
	res.jsonp(chamberToPad);
});

console.log('num pads: ' + chamberToPad.length);

var WebServerPort = 8080;
app.listen(WebServerPort, function() {
    console.log('Express webserver running on ' + WebServerPort);;
    setupSerialPort('COM3');
});
