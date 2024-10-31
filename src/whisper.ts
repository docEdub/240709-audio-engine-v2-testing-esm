declare const Module: any;

const WhisperModule = Module;

let instance = 0;

export class Whisper {
    public async init() {
        await loadRemote("whisper-models/ggml-model-whisper-tiny.bin", "whisper.bin", 75, (fname, buf) => {
            // write to WASM file using FS_createDataFile
            // if the file exists, delete it
            try {
                WhisperModule.FS_unlink(fname);
            } catch (e) {
                // ignore
            }

            WhisperModule.FS_createDataFile("/", fname, buf, true, true);

            //model_whisper = fname;

            console.log("loadRemote: stored model: " + fname + " size: " + buf.length);

            if (!instance) {
                instance = WhisperModule.init("whisper.bin");

                if (instance) {
                    console.log("js: whisper initialized, instance: " + instance);
                }
            }
        });
    }

    public transcribe(audio: Float32Array): any {
        const ret = WhisperModule.full_default(instance, audio, "en", 8, false);

        console.log("js: whisper returned: " + ret);
        return ret;
    }

    public async getText(): Promise<string> {
        return new Promise<string>((resolve) => {
            const timer = setInterval(async () => {
                const text = await WhisperModule.get_text(instance);

                // TOOD: Stop trying after some amount of time.
                if (text) {
                    clearInterval(timer);
                    console.log(`RESULT = ${text}`);
                    resolve(text);
                }
            }, 1000);
        });
    }
}

let dbVersion = 1;
let dbName = "whisper.ggerganov.com";
let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

// fetch a remote file from remote URL using the Fetch API
async function fetchRemote(url: string): Promise<Uint8Array | null> {
    const cbPrint = (msg) => {
        console.log(msg);
    };

    // const cbProgress = (progress) => {
    //     console.log("fetchRemote: progress: " + progress);
    // };

    cbPrint("fetchRemote: downloading with fetch()...");

    const response = await fetch(url, {
        method: "GET",
    });

    if (!response.ok) {
        cbPrint("fetchRemote: failed to fetch " + url);
        return null;
    }

    if (!response.body) {
        cbPrint("fetchRemote: missing response body");
        return null;
    }

    const contentLength = response.headers.get("content-length");
    if (!contentLength) {
        cbPrint("fetchRemote: missing content-length header");
        return null;
    }

    const total = parseInt(contentLength, 10);
    const reader = response.body.getReader();

    var chunks = new Array<Uint8Array>();
    var receivedLength = 0;
    var progressLast = -1;

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        chunks.push(value);
        receivedLength += value.length;

        if (contentLength) {
            // cbProgress(receivedLength / total);

            var progressCur = Math.round((receivedLength / total) * 10);
            if (progressCur != progressLast) {
                cbPrint("fetchRemote: fetching " + 10 * progressCur + "% ...");
                progressLast = progressCur;
            }
        }
    }

    var position = 0;
    var chunksAll = new Uint8Array(receivedLength);

    for (var chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }

    return chunksAll;
}

// load remote data
// - check if the data is already in the IndexedDB
// - if not, fetch it from the remote URL and store it in the IndexedDB
async function loadRemote(url, dst, size_mb, cbReady): Promise<void> {
    let resolve: any;

    const cbPrint = (msg) => {
        console.log(msg);
    };

    if (!navigator.storage || !navigator.storage.estimate) {
        cbPrint("loadRemote: navigator.storage.estimate() is not supported");
    } else {
        // query the storage quota and print it
        navigator.storage.estimate().then(function (estimate) {
            cbPrint("loadRemote: storage quota: " + estimate.quota + " bytes");
            cbPrint("loadRemote: storage usage: " + estimate.usage + " bytes");
        });
    }

    // check if the data is already in the IndexedDB
    var rq = indexedDB.open(dbName, dbVersion);

    rq.onupgradeneeded = function (event: any) {
        var db = event.target.result;
        if (db.version == 1) {
            var os = db.createObjectStore("models", { autoIncrement: false });
            cbPrint("loadRemote: created IndexedDB " + db.name + " version " + db.version);
        } else {
            // clear the database
            var os = event.currentTarget.transaction.objectStore("models");
            os.clear();
            cbPrint("loadRemote: cleared IndexedDB " + db.name + " version " + db.version);
        }
    };

    rq.onsuccess = function (event: any) {
        var db = event.target.result;
        var tx = db.transaction(["models"], "readonly");
        var os = tx.objectStore("models");
        var rq = os.get(url);

        rq.onsuccess = function (event: any) {
            if (rq.result) {
                cbPrint('loadRemote: "' + url + '" is already in the IndexedDB');
                cbReady(dst, rq.result);
                resolve();
            } else {
                // data is not in the IndexedDB
                cbPrint('loadRemote: "' + url + '" is not in the IndexedDB');

                // // alert and ask the user to confirm
                // if (
                //     !confirm(
                //         "You are about to download " + size_mb + " MB of data.\n" + "The model data will be cached in the browser for future use.\n\n" + "Press OK to continue."
                //     )
                // ) {
                //     //cbCancel();
                //     return;
                // }

                fetchRemote(url).then(function (data) {
                    if (data) {
                        // store the data in the IndexedDB
                        var rq = indexedDB.open(dbName, dbVersion);
                        rq.onsuccess = function (event: any) {
                            var db = event.target.result;
                            var tx = db.transaction(["models"], "readwrite");
                            var os = tx.objectStore("models");

                            var rq: any = null;
                            try {
                                var rq = os.put(data, url);
                            } catch (e) {
                                cbPrint('loadRemote: failed to store "' + url + '" in the IndexedDB: \n' + e);
                                //cbCancel();
                                return;
                            }

                            rq.onsuccess = function (event) {
                                cbPrint('loadRemote: "' + url + '" stored in the IndexedDB');
                                cbReady(dst, data);
                                resolve();
                            };

                            rq.onerror = function (event) {
                                cbPrint('loadRemote: failed to store "' + url + '" in the IndexedDB');
                                //cbCancel();
                            };
                        };
                    }
                });
            }
        };

        rq.onerror = function (event) {
            cbPrint("loadRemote: failed to get data from the IndexedDB");
            //cbCancel();
        };
    };

    rq.onerror = function (event) {
        cbPrint("loadRemote: failed to open IndexedDB");
        //cbCancel();
    };

    rq.onblocked = function (event) {
        cbPrint("loadRemote: failed to open IndexedDB: blocked");
        //cbCancel();
    };

    (rq as any).onabort = function (event) {
        cbPrint("loadRemote: failed to open IndexedDB: abort");
        //cbCancel();
    };

    return new Promise((r) => {
        resolve = r;
    });
}
