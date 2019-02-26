/**
 * Client logic for SENG513 A3
 * Mitchell Sawatzky
 * 10146721
 */

window.a3 = window.a3 || {};

/**
 * Application logic
 * @namespace a3
 */
(function() {
    // capture context
    let self = this;

    self.ws = null;
    self.connectionID = null;
    self.userID = null;
    self.connectedUsers = null;
    self.nickList = null;
    self.display = null;

    /**
     * Page initialization
     * @function init
     * @memberof a3
     */
    self.init = function() {
        self.display = {
            input: document.getElementById('chatinput'),
            history: document.getElementById('chat'),
            room: document.getElementById('room'),
            name: document.getElementById('self-user')
        };

        self.display.input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && self.ws) {
                let message = self.display.input.value.trim();

                if (message.length) {
                    self.display.input.value = '';
                    if (message.substr(0, 1) === '/') {
                        self.processClientCommand(message);
                    } else {
                        self.send(['Message', message]);
                    }
                }
            }
        });

        self.connect();
    };

    /**
     * Process a client-side command (starting with /)
     * @function processClientCommand
     * @memberof a3
     * @param {string} message - the chatline that the client sent
     */
    self.processClientCommand = function(message) {
        message = message.substr(1).split(' ');
        let command = message[0];
        message.splice(0, 1);
        switch (command.toLowerCase()) {
            case 'nick':
                self.send(['SetNick', message.join(' ')]);
                break;
            case 'nickcolor':
                self.send(['NickColor', message.join(' ')]);
                break;
            default:
                self.displayServerMessage(`Unknown command: ${command}`);
                break;
        }
    };

    /**
     * Update nicknames everywhere they appear on the page to reflect the contents of connectedUsers
     * @function updateDisplayRoom
     * @memberof a3
     */
    self.updateDisplayRoom = function() {
        let users = [];
        for (let uid in self.connectedUsers) {
            users.push({uid: uid, name: self.connectedUsers[uid].name, color: self.connectedUsers[uid].color});
        }

        users.sort((a, b) => {
            if (a.name === b.name) {
                return 0;
            }
            return a.name < b.name ? -1 : 1;
        });

        self.display.room.innerHTML = '';
        for (let user of users) {
            self.display.room.innerHTML += `<span class="connectedUser user-${user.uid}"></span>`;
            for (let elem of document.querySelectorAll(`.user-${user.uid}`)) {
                elem.innerText = user.name;
                elem.style.color = `#${user.color}`;
            }
        }

        self.display.name.innerHTML = self.nickList[self.userID].name;
        self.display.name.style.color = `#${self.nickList[self.userID].color}`;
    };

    /**
     * Clear the chat log
     * @function clear
     * @memberof a3
     */
    self.clear = function() {
        self.display.history.innerHTML = '';
    };

    /**
     * Put a chat message into the chat log
     * @function displayMessage
     * @memberof a3
     * @param {number} message.time - the unix epoch when the message was sent
     * @param {string} message.uid - the uid of the user that sent the message
     * @param {string} message.content - the message that the user sent
     */
    self.displayMessage = function(message) {
        let messageTime = new Date(message.time);
        let timeString = `${messageTime.getHours().toString().padStart(2, '0')}:${messageTime.getMinutes().toString().padStart(2, '0')}`;
        self.display.history.innerHTML += `<span class="message ${message.uid === self.userID ? 'bold' : ''}">
            <span class="messageTime">${timeString}</span>
            <span class="user-${message.uid}" style="color: #${self.nickList[message.uid].color};">${self.nickList[message.uid].name}</span>:
            <span class="content">${message.content}</span>
        </span>`;
        document.querySelector('#chat > span:last-child').scrollIntoView();
    };

    /**
     * Put a server message into the chat log
     * @function displayServerMessage
     * @memberof a3
     * @param {string} message - the message to display
     */
    self.displayServerMessage = function(message) {
        self.display.history.innerHTML += `<span class="message serverMessage">
            <span class="content">${message}</span>
        </span>`;
        document.querySelector('#chat > span:last-child').scrollIntoView();
    }

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

    /**
     * Send data to the server
     * @function send
     * @memberof a3
     * @param {*} message - a JSON-serializable message to send
     */
    self.send = function(message) {
        console.log(`[WS] <<`, message);
        message = JSON.stringify(message);
        self.ws.send(message);
    };

    /**
     * Handle data coming back from the server
     * @function handleMessage
     * @memberof a3
     * @param {string} message[0] - the OPCODE of the data
     * @param {*} [message*] - any arguments to the instruction
     */
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
                ]);
                break;
            case 'ServerMessage':
                // ServerMessage <message>
                self.displayServerMessage(message[1]);
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
                for (let msg of message[1]) {
                    self.displayMessage(msg);
                }
                document.querySelector('#chatCell').style.height = '100%';
                setTimeout(() => {
                    document.querySelector('#chatCell').style.height = '';
                    self.displayServerMessage('Welcome to the room.');
                }, 30);
                break;
            case 'NickList':
                // NickList {userID: nick, ...}
                self.connectedUsers = message[1];
                self.nickList = message[1];
                self.send([
                    'History'
                ]);
                self.displayServerMessage(`You are ${self.nickList[self.userID].name}.`);
                self.updateDisplayRoom();
                break;
            case 'NickColor':
                // NickColor userID color
                self.connectedUsers[message[1]].color = message[2];
                self.nickList[message[1]].color = message[2];
                self.updateDisplayRoom();
                break;
            case 'Nick':
                // Nick userID nick
                self.connectedUsers[message[1]].name = message[2];
                self.nickList[message[1]].name = message[2];
                self.updateDisplayRoom();
                break;
            case 'Join':
                // Join userID nick
                self.connectedUsers[message[1]] = message[2];
                self.nickList[message[1]] = message[2];
                self.updateDisplayRoom();
                break;
            case 'Part':
                // Part userID
                delete self.connectedUsers[message[1]];
                self.updateDisplayRoom();
                break;
            default:
                console.warn(`Unknown OPCODE: ${message[0]}`);
                break;
        }
    };

    /**
     * Connect the websocket to the server
     * @function connect
     * @memberof a3
     */
    self.connect = function() {
        if (!self.ws) {
            try {
                self.ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);
            } catch (e) {
                self.displayServerMessage('Could not connect to server. Attempting to reconnect in 3 seconds...');
                setTimeout(() => {
                    self.ws = null;
                    self.connect();
                }, 3000);
                return;
            }

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
                self.displayServerMessage('Could not connect to server. Attempting to reconnect in 3 seconds...');

                setTimeout(() => {
                    self.ws = null;
                    self.connect();
                }, 3000);
            }
        }
    };

    /**
     * Disconnect from the server
     * @function disconnect
     * @memberof a3
     */
    self.disconnect = function() {
        if (self.ws) {
            self.ws.close();
            self.ws = null;
        }
    }
}).apply(window.a3);
