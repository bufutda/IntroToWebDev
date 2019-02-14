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

    self.freshExpression = true;
    self.error = false;

    /**
     * Page initialization. Fires when the page body loads.
     */
    self.ready = function() {
        self.input = document.getElementById('input');
        self.previousExpression = document.getElementById('expression');

        // handle button clicks
        for (let button of document.getElementsByClassName('calc-button')) {
            button.addEventListener('click', (e) => {
                self.processInput(e.target.attributes['data-symbol'].value);
            });
        }

        // handle keyboard inputs when the input box is focussed
        self.input.addEventListener('keydown', (e) => {
            if (/^[0-9.+*/=()-]$/.test(e.key)) {
                self.processInput(e.key);
            } else if (e.key === 'Backspace' || e.key === 'c') {
                self.processInput('C');
            } else if (e.key === 'Enter') {
                self.processInput('=');
            }
        });
    };

    /**
     * Process inputs
     * @param {string} input - the input to process. One character representative of the button being hit
     * @throws when input is not something that can be handled
     * @returns {bool} true when the input was accepted, false otherwise
     */
    self.processInput = function(input) {
        if (self.error) {
            self.input.textContent = '0';
            self.error = false;
        }

        switch (input) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                if (self.freshExpression || self.input.textContent === '0' || self.input.textContent.length === 0) {
                    self.input.textContent = input;
                } else if ((input === '0' && /[1-9.]0*$/.test(self.input.textContent))
                    || input !== '0'
                    || /[^0-9.]/.test(self.input.textContent[self.input.textContent.length - 1])
                ) {
                    // if we're in the middle of an expression, make sure to block multiple consecutive
                    // leading 0's if they are at the start of a number
                    // ... 0 -> block
                    // ... 0. -> allow
                    // ... 90 -> allow
                    // ... + -> allow
                    // ... ( -> allow
                    self.input.textContent += input;
                } else {
                    return false;
                }
                break;
            case '-':
            case '+':
            case '*':
            case '/':
                if (self.input.textContent === '0' && input === '-') {
                    self.input.textContent = input;
                } else {
                    // if the expression currently ends in an operator, replace that operator with this new one.
                    // if the new operator is -, then append it only if the old operator was not -
                    let lastCharacter = self.input.textContent.substr(self.input.textContent.length - 1);
                    if (['-', '+', '*', '/'].indexOf(lastCharacter) !== -1) {
                        if (lastCharacter === '-' && input === '-') {
                            return false;
                        } else if (lastCharacter !== '-' && input === '-') {
                            self.input.textContent += input;
                        } else {
                            if (lastCharacter === '-') {
                                return false;
                            }
                            self.input.textContent = self.input.textContent.substr(0, self.input.textContent.length - 1) + input;
                        }
                    } else if (lastCharacter === '(' || lastCharacter === ')') {
                        if (input === '-') {
                            self.input.textContent += input;
                        } else {
                            return false;
                        }
                    } else {
                        self.input.textContent += input;
                    }
                }
                break;
            case '.':
                // if the expression currently ends in a ., don't add this .
                // if the expression ends in a number with a decimal, don't allow another decimal
                if (/\.[0-9]*$/.test(self.input.textContent)) {
                    return false;
                }
                self.input.textContent += input;
                break;
            case '(':
            case ')':
                if (self.freshExpression || self.input.textContent === '0' || self.input.textContent.length === 0) {
                    self.input.textContent = input;
                } else {
                    self.input.textContent += input;
                }
                break;
            case 'C':
                // backspace until it's the last character.
                // If it's the last character, replace it with a 0
                let newContent = self.input.textContent.substr(0, self.input.textContent.length - 1);
                if (newContent.length === 0) {
                    newContent = '0';
                }
                self.input.textContent = newContent;
                break;
            case '=':
                if (self.freshExpression) {
                    return false;
                }
                self.previousExpression.textContent = self.input.textContent + '=';
                self.input.textContent = self.evaluateExpression(self.input.textContent);
                return true;
                break;
            default:
                throw new Error(`Unknown input: ${input}`);
        }
        self.freshExpression = false;
    };

    /**
     * Evaluate an arithmetic expression
     * @param {string} expression
     * @return {string|number} the result of the expression, or 'Error' if there was an error
     */
    self.evaluateExpression = function(expression) {
        let res;

        // just eval the expression - an AST is overkill here
        try {
            // replace all instances of implicit multiplication (eg, 8(10) // 100)
            // with explicit multiplication (8*(10) // 100) so it can be eval'd
            expression = expression.replace(/([0-9\)])\(/g, ($0, $1) => `${$1}*(`);
            res = eval(expression);
        } catch (e) {
            res = NaN;
        }

        self.freshExpression = true;

        // check for error
        if (isNaN(res)
            || res === Infinity
            || res === -Infinity
            || typeof res === 'undefined'
        ) {
            self.error = true;
            return 'Error';
        }

        return res;
    };
}).apply(window.a2);
