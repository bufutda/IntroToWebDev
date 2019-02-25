#!/usr/bin/env node

/**
 * @file app.js
 * @overview Entry point for SENG513 Assignment 3
 * @author Mitchell Sawatzky
 */

// define project root path for absolute includes
global.__rootname = __dirname;

const server = require(`${__rootname}/server.js`);
const websocket = require(`${__rootname}/websocket.js`);

// start the http server
let httpServer = server.init();

// start the websocket server
websocket.init(httpServer);
