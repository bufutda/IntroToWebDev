/*
 * SENG513 Assignment 2
 * Mitchell Sawatzky
 * Feb 15 2019
 * 10146721
 */

window.a2 = window.a2 || {};

(function() {
    // capture context
    let self = this;

    self.ready = function() {
        console.log('Ready');
    };
}).apply(window.a2);
