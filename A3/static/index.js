/**
 * Client logic for SENG513 A3
 * Mitchell Sawatzky
 * 10146721
 */

window.a3 = window.a3 || {};

(function() {
    // capture context
    let self = this;

    self.ws = null;
    self.id = null;

    self.init = function() {

    };

    self.send = function(message) {
        console.log(`[WS] <<`, message);
        message = JSON.stringify(message);
        self.ws.send(message);
    };

    self.handleMessage = function(message) {
        if (!message.length) {
            console.log(`[WS] Empty payload`);
        }
        switch (message[0]) {
            case 'ServerHello':
                self.id = message[1];
                break;
            default:
                console.warn(`Unknown OPCODE: ${message[0]}`);
                break;
        }
    };

    self.connect = function() {
        if (!self.ws) {
            self.ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);

            self.ws.onopen = function(event) {
                self.send([
                    'ClientHello'
                ]);
            };

            self.ws.onmessage = function(event) {
                let incoming;
                try {
                    incoming = JSON.parse(event.data);
                } catch (e) {
                    console.log(`[WS] Invalid JSON (${event.data})`);
                    return;
                }
                console.log(`[WS] >>`, incoming);
                self.handleMessage(incoming);
            };

            self.ws.onclose = function(event) {
                console.log('Websocket closed by server');
                self.sw = null;
            }
        }
    };

    self.disconnect = function() {
        if (self.ws) {
            self.ws.close();
            self.ws = null;
        }
    }
}).apply(window.a3);
