var CACHE_ID = new Date().toLocaleString();

var debug = 1;
var cacheType = /\.(js|css|tpl|jpg|jpeg|png|gif)$/i;
var fileList = {};
var ignoreList = [
    'test/common/lib/lib-index.css',
    'test/common/common-ignore.js'
];
var cacheList = [
    'test/common/lib/'
];

this.addEventListener('install', function(event) {
    console.log('cache install');
});

this.addEventListener('activate', onActive);

this.addEventListener('fetch', onFetch);

function onActive(event) {
    console.log('cache activate');
};

function onFetch(event) {

    setExport();

    event.respondWith(
        caches.match(event.request)
            .then(function(res) {
                var path = getPath(event.request.url);
                var needCache = checkIfCache(event.request);

                if(!fileList[path]) {
                    fileList[path] = 1;  
                }

                if(needCache) {
                    if(res) {
                        return res;
                    }
                }

                return fetch(event.request)
                    then(function(res) {
                        if(needCache) {
                            caches.open(CACHE_ID)
                                .then(function(cache) {
                                    cache.push(event.request, res.clone());
                                });
                        }
                        return res;
                    });
            }) 
    );

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
        return item.indexOf(path) === 0;
    });

    if(remote) {
        return true;
    }

    return false;
}

function getPath(url) {
    return url
        .replace(/\?.*|#.*/g, '')
        .replace(/https?:\/\/[^/]*\//i, '');
}

function debugLog() {
    if(!debug) {
        return;
    }
    console.debug.apply(this, arguments);
}

function setExport() {
    if(caches.cacheInfo) {
        return;
    }

    caches.cacheInfo = {
        fileList: fileList,
        ignoreList: ignoreList,
        cacheList: cacheList,
        cacheType: cacheType
    };
}

setExport();