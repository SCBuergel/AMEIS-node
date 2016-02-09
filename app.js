var express = require('express');
var serialport = require('serialport');

var app = express();
var SerialPort = serialport.SerialPort; 

var serialPortName = '/dev/ttyACM0';//'/sys/class/tty/ttyACM0';
var serialPort = new SerialPort(serialPortName, {
  baudrate: 9600,
  parser: serialport.parsers.readline("\n")
});
serialPort.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
    console.log(data);
  });
});

app.get('/', function(req, res){
    serialPort.write('test\r\n');
    res.send('Can I haz AMEIS?');
});

var WebServerPort = 8080;
app.listen(WebServerPort, function() {
    console.log('Express webserver running on ' + WebServerPort);;
});