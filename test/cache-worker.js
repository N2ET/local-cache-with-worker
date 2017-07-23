var CACHE_ID = 'v1';

var debug = 1;
var messageHandlers = {};
var cacheType = /\.(js|css|tpl|jpg|jpeg|png|gif)$/i;
var fileList = {};
var ignoreList = [
    '/test/common/lib/lib-index.css',
    '/test/common/common-ignore.js'
];
var cacheList = [
    '/test/common/lib/'
];

this.addEventListener('install', function(event) {
    console.log('cache install');
});

this.addEventListener('activate', onActive);

this.addEventListener('fetch', onFetch);

this.addEventListener('message', onMessage);

function onActive(event) {
    console.log('cache activate');
};

function onFetch(event) {

    // setExport();
    var needCache = checkIfCache(event.request);
    if(!needCache) {
        return;
    }

    // cache.open(CACHE_ID)
    //     .then(function(cache) {
    //         cache.add(path);
    //     });

    event.respondWith(
        caches.match(event.request)
            .then(function(res) {
                var path = getPath(event.request.url);   

                if(!fileList[path]) {
                    fileList[path] = 1;  
                }

                if(needCache) {
                    if(res) {
                        return res;
                    }
                }

                return fetch(event.request.clone())
                    .then(function(res) {
                        var cacheRes = res.clone();
                        if(needCache) {
                            caches.open(CACHE_ID)
                                .then(function(cache) {
                                    debugLog('cache put ', path);
                                    cache.put(event.request, cacheRes);
                                });
                        }
                        return res;
                    });
            })
            .catch(function(e) {
                console.log(e);
            })
    );

}

function onMessage(event) {
    var fn = event.data.fn;
    fn = messageHandlers[fn];
    if(!fn) {
        return;
    }
    fn(event.data.data);
}

function checkIfCache(request) {
    var path = getPath(request.url);
    var remote = false;
    
    if(!cacheType.test(path)) {
        return false;
    }

    remote = ignoreList.some(function(item) {
        return item.indexOf(path) === 0;
    });

    if(remote) {
        debugLog('cache ignore ', path);
        return false;
    }

    remote = cacheList.some(function(item) {
        return path.indexOf(item) === 0;
    });

    if(remote) {
        return true;
    }

    debugLog('cache pass ', path);

    return false;
}

function getPath(url) {
    return url
        .replace(/\?.*|#.*/g, '')
        .replace(/https?:\/\/[^/]*/i, '');
}

function debugLog() {
    if(!debug) {
        return;
    }
    console.debug.apply(this, arguments);
}

function getExport() {
    return {
        fileList: fileList,
        ignoreList: ignoreList,
        cacheList: cacheList,
        cacheType: cacheType
    };
}

function clear() {
    caches.open(CACHE_ID).then(function(cache) {
        cache.keys().then(function(keys) {
            keys.forEach(function(req) {
                debugLog('cache delete ', getPath(req.url));
                cache.delete(req);
            });
        });
    });
}

messageHandlers.getCacheInfo = function(data) {
    if(data && data.ret) {
        data.ret = getExport();
    }
};