window.a1 = window.a1 || {};

(function() {
    // capture context
    let self = this;

    self.ready = function() {
        document.getElementById('hamburger').classList.remove('loading');
        document.getElementById('hamburger').addEventListener('click', () => {
            let classes = document.getElementById('nav').classList;
            if (classes.contains('show')) {
                // menu is visible
                classes.remove('show');
            } else {
                // menu is not visible
                classes.add('show');
            }
        });
    };
}).apply(window.a1);
