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
    self.connectionID = null;
    self.userID = null;
    self.nickList = null;

    self.init = function() {

    };

    self.updateDisplayRoom = function() {
        let res = [];
        for (let uid in self.nickList) {
            res.push({uid: uid, name: self.nickList[uid].name, color: self.nickList[uid].color});
        }
        console.table(res);
    };

    self.clear = function() {
        console.clear();
    };

    self.displayMessage = function(message) {
        console.log(`${message.time} ${self.nickList[message.uid].name}: ${message.content}`);
    };

    /**
     * Get the saved userID
     * @function getStoredUserID
     * @memberof a3
     * @returns {string} a UUID which is this user's ID or null if none was saved
     */
    self.getStoredUserID = function() {
        for (let cookie of document.cookie.split(';')) {
            if (cookie.split('=')[0].trim() === 'userID') {
                return decodeURIComponent(cookie.split('=')[1]);
            }
        }
        return null;
    };

    /**
     * Store the userID
     * @function storeUserID
     * @memberof a3
     * @param {string} id - the ID to save
     */
    self.storeUserID = function(id) {
        document.cookie = `userID=${encodeURIComponent(id)}`;
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
                // ServerHello connectionID userID
                self.connectionID = message[1];
                self.userID = message[2];
                self.storeUserID(self.userID);
                self.send([
                    'NickList'
                ])
                break;
            case 'ServerMessage':
                // ServerMessage <message>
                console.warn(message[1]);
                break;
            case 'Message':
                // Message uid time message
                self.displayMessage({
                    uid: message[1],
                    time: message[2],
                    content: message[3]
                });
                break;
            case 'History':
                // History [{uid, content, time}, ...]
                self.clear();
                for (let msg of message[1]) {
                    self.displayMessage(msg);
                }
                break;
            case 'NickList':
                // NickList {userID: nick, ...}
                self.nickList = message[1];
                console.log(`I am ${self.nickList[self.userID].name}`);
                self.updateDisplayRoom();
                break;
            case 'NickColor':
                // NickColor userID color
                self.nickList[message[1]].color = message[2];
                self.updateDisplayRoom();
                break;
            case 'Nick':
                // Nick userID nick
                self.nickList[message[1]].name = message[2];
                self.updateDisplayRoom();
                break;
            case 'Join':
                // Join userID nick
                self.nickList[message[1]] = message[2];
                self.updateDisplayRoom();
                break;
            case 'Part':
                // Part userID
                delete self.nickList[message[1]];
                self.updateDisplayRoom();
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
                let userID = self.getStoredUserID();
                if (userID) {
                    self.send([
                        'ClientHello',
                        userID
                    ]);
                } else {
                    self.send([
                        'ClientHello'
                    ]);
                }
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
