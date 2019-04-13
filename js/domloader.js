/*!
 * domloader.js
 * v3.2
 * https://github.com/tmplink/domloader/
 * 
 * Licensed GPLv3 © TMPLINK STUDIO
 */

var domloader = {
    queue: [],
    queue_count: 0,
    queue_total: 0,
    queue_cache: [],
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
    animation: true,
    animation_time: 500,
    animation_stime: 0,

    preload: function (path) {
        this.id++;
        this.log('Preload::' + path);
        this.queue_preload.push(
                function () {
                    $.get(domloader.root + path, {v: Date.now()}, function (response) {
                        $('head').append(response);
                        domloader.load(path);
                    }, 'text');
                }
        );
    },

    css: function (path) {
        this.queue_count++;
        this.queue_total++;
        this.log('Include::CSS::' + path);
        this.queue.push([
            function () {
                $.get(domloader.root + path, {v: domloader.version}, function () {
                    domloader.async();
                });
            },
            function () {
                $('head').append("<link rel=\"stylesheet\" href=\"" + domloader.root + path + '?version=' + domloader.version + "\" >\n");
                domloader.sync();
            }
        ]);
    },

    html: function (dom, path) {
        this.queue_count++;
        this.queue_total++;
        this.log('Include::HTML::' + path);
        this.queue.push([
            function () {
                $.get(domloader.root + path, {v: domloader.version}, function () {
                    domloader.async();
                });
            },
            function () {
                $.get(domloader.root + path, {v: domloader.version}, function (response) {
                    $(dom).replaceWith(response);
                    domloader.sync();
                }, 'text');
            }
        ]);
    },

    js: function (path) {
        this.queue_count++;
        this.queue_total++;
        this.log('Include::JS::' + path);
        this.queue.push([
            function () {
                $.get(domloader.root + path, {v: domloader.version}, function () {
                    domloader.async();
                });
            },
            function () {
                $.get(domloader.root + path, {v: domloader.version}, function (response) {
                    $('body').append("<script type=\"text/javascript\">\n" + response + "</script>\n");
                    domloader.sync();
                }, 'text');
            }
        ]);
    },

    load: function () {
        if (this.queue_preload.length !== 0) {
            var fn = this.queue_preload.shift();
            if (typeof (fn) === 'function') {
                fn();
            }
            return false;
        } else {
            this.init_loading_page();
        }
        if (this.queue.length === 0) {
            if (this.queue_after.length !== 0) {
                var cb = null;
                for (cb in this.queue_after) {
                    this.queue_after[cb]();
                }
            }

            if (this.progressbar === false) {
                this.autofix();
            }

        } else {
            if (this.progressbar) {
                this.progressbar = false;
                $('#domloader_loading_bg').show();
                $('#domloader_loading_show').show();
            }
        }
        //
        if (this.queue.length !== 0) {
            var cb = null;
            for (cb in this.queue) {
                this.queue[cb][0]();
            }
        }
    },

    async: function () {
        this.queue_count--;
        if (this.queue_count === 0) {
            domloader.log('Sync...');
            this.sync();
        } else {
            this.draw();
        }
    },

    sync: function () {
        if (this.queue.length !== 0) {
            var fn = this.queue.shift();
            fn[1]();
            return false;
        } else {
            this.draw();
            this.load();
        }
    },

    draw: function () {
        var percent = Math.ceil((this.queue_total - this.queue_count) / this.queue_total * 100);
        if (this.animation) {
            $('.domloader_curRate').animate({'width': percent + '%'}, this.animation_stime, function () {
                if (percent === 100) {
                    $('#domloader_loading_show').fadeOut(300);
                    $('#domloader_loading_bg').fadeOut(300);
                    $('body').css('overflow', '');
                }
            });
        } else {
            if (percent === 100) {
                $('#domloader_loading_show').fadeOut(300);
                $('#domloader_loading_bg').fadeOut(300);
                $('body').css('overflow', '');
            }
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
        $(function () {
            $('body').css('overflow', 'hidden');
            $('body').append('<div id="domloader_loading_bg"></div>');
            domloader.log('Page ready.Domloader start.');
            domloader.load();
        });
    },

    animation_slice: function () {
        if (this.queue.length > 1) {
            this.animation_stime = Math.ceil(this.animation_time / this.queue.length);
        } else {
            this.animation_stime = this.animation_time;
        }
        domloader.log('Animation slice time: ' + this.animation_stime + ' ,total: ' + this.animation_time);
    },

    init_loading_page: function () {
        if (this.loading_page === false) {
            domloader.animation_slice();
            $('#domloader_loading_bg').append('<div id="domloader_loading_show"></div>');
            if (domloader.icon !== false) {
                $('#domloader_loading_show').append('<div style="text-align:center;margin-bottom:20px;"><img src="' + domloader.icon + '" style="vertical-align: middle;border-style: none;width:129px;height:129px;"/></div>');
            }
            if (domloader.animation) {
                $('#domloader_loading_show').append('<div class="domloader_progress domloader_round_conner"><div class="domloader_curRate domloader_round_conner"></div></div>');
            } else {
                $('#domloader_loading_show').append('Loading');
            }
            $('body').css('visibility', 'visible');
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