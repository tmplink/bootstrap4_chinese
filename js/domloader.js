/*!
 * domloader.js
 * v2.0
 * https://github.com/tmplink/domloader/
 * 
 * Licensed GPLv3 © TMPLINK STUDIO
 */

var domloader = {
    queue: [],
    queue_after: [],
    queue_preload: [],
    loading_page: false,
    version: 0,
    progressbar: true,
    total: 0,
    icon: false,
    id: 1,
    debug: true,
    root: '',

    html: function (dom, path) {
        domloader.id++;
        domloader.log('Include::HTML::' + path);
        domloader.queue.push(
                function () {
                    $.get(domloader.root + path, {v: domloader.version}, function (response) {
                        $(dom).replaceWith(response);
                        domloader.load(path);
                    }, 'text');
                }
        );
    },

    preload: function (path) {
        domloader.id++;
        domloader.log('Preload::' + path);
        domloader.queue_preload.push(
                function () {
                    $.get(domloader.root + path, {v: Date.now()}, function (response) {
                        $('head').append(response);
                        domloader.load(path);
                    }, 'text');
                }
        );
    },

    css: function (path) {
        domloader.log('Include::CSS::' + path);
        domloader.queue.push(
                function () {
                    domloader.id++;
                    $('head').append("<link async id=\"domloader_" + domloader.id + "\" rel=\"stylesheet\" href=\"" + domloader.root + path + '?version=' + domloader.version + "\" >\n");
                    $('#domloader_' + domloader.id).ready(function () {
                        domloader.load(path);
                    });
                }
        );
    },

    js: function (path) {
        domloader.log('Include::JS::' + path);
        domloader.queue.push(
                function () {
                    $.get(domloader.root + path, {v: domloader.version}, function (response) {
                        domloader.id++;
                        $('body').append("<script id=\"domloader_" + domloader.id + "\" type=\"text/javascript\">\n" + response + "</script>\n");
                        domloader.load(path);
                    }, 'text');
                }
        );
    },

    load: function (src) {
        if (domloader.queue_preload.length !== 0) {
            var fn = domloader.queue_preload.shift();
            if (typeof (fn) === 'function') {
                fn();
            }
            return false;
        } else {
            this.init_loading_page();
        }
        if (domloader.queue.length === 0) {
            if (domloader.queue_after.length !== 0) {
                var cb = null;
                for (cb in domloader.queue_after) {
                    domloader.queue_after[cb]();
                }
            }

            if (domloader.progressbar === false) {
                this.autofix();
            }
        } else {
            if (domloader.progressbar) {
                domloader.total = domloader.queue.length;
                domloader.progressbar = false;
                $('#domloader_loading_bg').show();
                $('#domloader_loading_show').show();
            }
        }
        if (typeof (src) !== 'undefined') {
            var percent = Math.ceil((this.total - this.queue.length) / this.total * 100);
            $('.domloader_curRate').animate({'width': percent + '%'}, 100, function () {
                if (percent === 100) {
                    $('#domloader_loading_show').fadeOut(300);
                    $('#domloader_loading_bg').fadeOut(300);
                    $('body').css('overflow', '');
                }
            });
            domloader.log("Loaded::" + src);
        }
        var fn = domloader.queue.shift();
        if (typeof (fn) === 'function') {
            fn();
        }
    },

    onload: function (cb) {
        domloader.log('Add::OnLoad callback');
        domloader.queue_after.push(cb);
    },

    autofix: function () {
        if (domloader.root !== '') {
            $('[data-dl-root]').each(function () {
                var autofixer = $(this).attr("data-dl-root");
                var src = $(this).attr("src");
                var href = $(this).attr("href");
                if (autofixer === 'true' && src !== undefined && src !== null) {
                    $(this).attr("src", domloader.root + src);
                    $(this).attr("data-dl-root", 'false');
                }
                if (autofixer === 'true' && href !== undefined && href !== null) {
                    $(this).attr("href", domloader.root + href);
                    $(this).attr("data-dl-root", 'false');
                }
            });
        }
    },

    init: function () {
        $('body').ready(function () {
            $('body').css('overflow', 'hidden');
            $('body').append('<div id="domloader_loading_bg"></div>');
        });
        window.onload = function () {
            domloader.log('Page ready.Domloader start.');
            domloader.load();
        };
    },

    init_loading_page: function () {
        if (this.loading_page === false) {
            $('#domloader_loading_bg').append('<div id="domloader_loading_show"></div>');
            if (domloader.icon !== false) {
                $('#domloader_loading_show').append('<div style="text-align:center;margin-bottom:20px;"><img src="' + domloader.icon + '" style="vertical-align: middle;border-style: none;width:129px;height:129px;"/></div>');
            }
            $('#domloader_loading_show').append('<div class="domloader_progress domloader_round_conner"><div class="domloader_curRate domloader_round_conner"></div></div>');
            $('body').css('visibility','visible');
            $('#domloader_loading_show').fadeIn(500);
            this.loading_page = true;
        } else {
            return false;
        }
    },

    log: function (msg) {
        if (this.debug) {
            console.log(msg);
        }
    }
};