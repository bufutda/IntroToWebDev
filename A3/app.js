#!/usr/bin/env node

/**
 * @file app.js
 * @overview Entry point for SENG513 Assignment 3
 * @author Mitchell Sawatzky
 */

// define project root path for absolute includes
global.__rootname = __dirname;

const server = require(`${__rootname}/server.js`);

// start the server
server.init();
