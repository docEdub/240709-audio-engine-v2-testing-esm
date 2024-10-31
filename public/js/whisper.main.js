var Module = typeof Module != "undefined" ? Module : {};
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && self.name?.startsWith("em-pthread");
if (ENVIRONMENT_IS_NODE) {
    var worker_threads = require("worker_threads");
    global.Worker = worker_threads.Worker;
    ENVIRONMENT_IS_WORKER = !worker_threads.isMainThread;
    ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && worker_threads["workerData"] == "em-pthread";
}
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
    throw toThrow;
};
var _scriptName = typeof document != "undefined" ? document.currentScript?.src : undefined;
if (ENVIRONMENT_IS_NODE) {
    _scriptName = __filename;
} else if (ENVIRONMENT_IS_WORKER) {
    _scriptName = self.location.href;
}
var scriptDirectory = "";
var readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
    if (typeof process == "undefined" || !process.release || process.release.name !== "node")
        throw new Error(
            "not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"
        );
    var nodeVersion = process.versions.node;
    var numericVersion = nodeVersion.split(".").slice(0, 3);
    numericVersion = numericVersion[0] * 1e4 + numericVersion[1] * 100 + numericVersion[2].split("-")[0] * 1;
    if (numericVersion < 16e4) {
        throw new Error("This emscripten-generated code requires node v16.0.0 (detected v" + nodeVersion + ")");
    }
    var fs = require("fs");
    var nodePath = require("path");
    scriptDirectory = __dirname + "/";
    readBinary = (filename) => {
        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
        var ret = fs.readFileSync(filename);
        assert(ret.buffer);
        return ret;
    };
    readAsync = (filename, binary = true) => {
        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
        return new Promise((resolve, reject) => {
            fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
                if (err) reject(err);
                else resolve(binary ? data.buffer : data);
            });
        });
    };
    if (!Module["thisProgram"] && process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, "/");
    }
    arguments_ = process.argv.slice(2);
    if (typeof module != "undefined") {
        module["exports"] = Module;
    }
    quit_ = (status, toThrow) => {
        process.exitCode = status;
        throw toThrow;
    };
} else if (ENVIRONMENT_IS_SHELL) {
    if ((typeof process == "object" && typeof require === "function") || typeof window == "object" || typeof importScripts == "function")
        throw new Error(
            "not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"
        );
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
    } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
    }
    if (scriptDirectory.startsWith("blob:")) {
        scriptDirectory = "";
    } else {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
    }
    if (!(typeof window == "object" || typeof importScripts == "function"))
        throw new Error(
            "not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"
        );
    if (!ENVIRONMENT_IS_NODE) {
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = (url) => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response);
            };
        }
        readAsync = (url) => {
            if (isFileURI(url)) {
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = () => {
                        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                            resolve(xhr.response);
                            return;
                        }
                        reject(xhr.status);
                    };
                    xhr.onerror = reject;
                    xhr.send(null);
                });
            }
            return fetch(url, { credentials: "same-origin" }).then((response) => {
                if (response.ok) {
                    return response.arrayBuffer();
                }
                return Promise.reject(new Error(response.status + " : " + response.url));
            });
        };
    }
} else {
    throw new Error("environment detection error");
}
var defaultPrint = console.log.bind(console);
var defaultPrintErr = console.error.bind(console);
if (ENVIRONMENT_IS_NODE) {
    defaultPrint = (...args) => fs.writeSync(1, args.join(" ") + "\n");
    defaultPrintErr = (...args) => fs.writeSync(2, args.join(" ") + "\n");
}
var out = Module["print"] || defaultPrint;
var err = Module["printErr"] || defaultPrintErr;
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
checkIncomingModuleAPI();
if (Module["arguments"]) arguments_ = Module["arguments"];
legacyModuleProp("arguments", "arguments_");
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
legacyModuleProp("thisProgram", "thisProgram");
assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["read"] == "undefined", "Module.read option was removed");
assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
legacyModuleProp("asm", "wasmExports");
legacyModuleProp("readAsync", "readAsync");
legacyModuleProp("readBinary", "readBinary");
legacyModuleProp("setWindowTitle", "setWindowTitle");
assert(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_NODE, "Pthreads do not work in this environment yet (need Web Workers, or an alternative to them)");
assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");
var wasmBinary = Module["wasmBinary"];
legacyModuleProp("wasmBinary", "wasmBinary");
if (typeof WebAssembly != "object") {
    err("no native wasm support detected");
}
function intArrayFromBase64(s) {
    if (typeof ENVIRONMENT_IS_NODE != "undefined" && ENVIRONMENT_IS_NODE) {
        var buf = Buffer.from(s, "base64");
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    }
    var decoded = atob(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0; i < decoded.length; ++i) {
        bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
}
function tryParseAsDataURI(filename) {
    if (!isDataURI(filename)) {
        return;
    }
    return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
var wasmMemory;
var wasmModule;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed" + (text ? ": " + text : ""));
    }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module["HEAP8"] = HEAP8 = new Int8Array(b);
    Module["HEAP16"] = HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}
var workerID = 0;
if (ENVIRONMENT_IS_PTHREAD) {
    var wasmPromiseResolve;
    var wasmPromiseReject;
    if (ENVIRONMENT_IS_NODE) {
        var parentPort = worker_threads["parentPort"];
        parentPort.on("message", (msg) => onmessage({ data: msg }));
        Object.assign(globalThis, {
            self: global,
            importScripts: () => {
                assert(false, "dummy importScripts called");
            },
            postMessage: (msg) => parentPort.postMessage(msg),
        });
    }
    var initializedJS = false;
    function threadPrintErr(...args) {
        var text = args.join(" ");
        if (ENVIRONMENT_IS_NODE) {
            fs.writeSync(2, text + "\n");
            return;
        }
        console.error(text);
    }
    if (!Module["printErr"]) err = threadPrintErr;
    dbg = threadPrintErr;
    function threadAlert(...args) {
        var text = args.join(" ");
        postMessage({ cmd: "alert", text, threadId: _pthread_self() });
    }
    self.alert = threadAlert;
    Module["instantiateWasm"] = (info, receiveInstance) =>
        new Promise((resolve, reject) => {
            wasmPromiseResolve = (module) => {
                var instance = new WebAssembly.Instance(module, getWasmImports());
                receiveInstance(instance);
                resolve();
            };
            wasmPromiseReject = reject;
        });
    self.onunhandledrejection = (e) => {
        throw e.reason || e;
    };
    function handleMessage(e) {
        try {
            var msgData = e["data"];
            var cmd = msgData.cmd;
            if (cmd === "load") {
                workerID = msgData.workerID;
                let messageQueue = [];
                self.onmessage = (e) => messageQueue.push(e);
                self.startWorker = (instance) => {
                    postMessage({ cmd: "loaded" });
                    for (let msg of messageQueue) {
                        handleMessage(msg);
                    }
                    self.onmessage = handleMessage;
                };
                for (const handler of msgData.handlers) {
                    if (!Module[handler] || Module[handler].proxy) {
                        Module[handler] = (...args) => {
                            postMessage({ cmd: "callHandler", handler, args });
                        };
                        if (handler == "print") out = Module[handler];
                        if (handler == "printErr") err = Module[handler];
                    }
                }
                wasmMemory = msgData.wasmMemory;
                updateMemoryViews();
                wasmPromiseResolve(msgData.wasmModule);
            } else if (cmd === "run") {
                assert(msgData.pthread_ptr);
                establishStackSpace(msgData.pthread_ptr);
                __emscripten_thread_init(msgData.pthread_ptr, 0, 0, 1, 0, 0);
                PThread.receiveObjectTransfer(msgData);
                PThread.threadInitTLS();
                __emscripten_thread_mailbox_await(msgData.pthread_ptr);
                if (!initializedJS) {
                    __embind_initialize_bindings();
                    initializedJS = true;
                }
                try {
                    invokeEntryPoint(msgData.start_routine, msgData.arg);
                } catch (ex) {
                    if (ex != "unwind") {
                        throw ex;
                    }
                }
            } else if (msgData.target === "setimmediate") {
            } else if (cmd === "checkMailbox") {
                if (initializedJS) {
                    checkMailbox();
                }
            } else if (cmd) {
                err(`worker: received unknown command ${cmd}`);
                err(msgData);
            }
        } catch (ex) {
            err(`worker: onmessage() captured an uncaught exception: ${ex}`);
            if (ex?.stack) err(ex.stack);
            __emscripten_thread_crashed();
            throw ex;
        }
    }
    self.onmessage = handleMessage;
}
assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
assert(
    typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
    "JS engine does not provide full typed array support"
);
if (!ENVIRONMENT_IS_PTHREAD) {
    if (Module["wasmMemory"]) {
        wasmMemory = Module["wasmMemory"];
    } else {
        var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 2097152e3;
        legacyModuleProp("INITIAL_MEMORY", "INITIAL_MEMORY");
        assert(INITIAL_MEMORY >= 5242880, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 5242880 + ")");
        wasmMemory = new WebAssembly.Memory({ initial: INITIAL_MEMORY / 65536, maximum: INITIAL_MEMORY / 65536, shared: true });
    }
    updateMemoryViews();
}
function writeStackCookie() {
    var max = _emscripten_stack_get_end();
    assert((max & 3) == 0);
    if (max == 0) {
        max += 4;
    }
    HEAPU32[max >> 2] = 34821223;
    HEAPU32[(max + 4) >> 2] = 2310721022;
    HEAPU32[0 >> 2] = 1668509029;
}
function checkStackCookie() {
    if (ABORT) return;
    var max = _emscripten_stack_get_end();
    if (max == 0) {
        max += 4;
    }
    var cookie1 = HEAPU32[max >> 2];
    var cookie2 = HEAPU32[(max + 4) >> 2];
    if (cookie1 != 34821223 || cookie2 != 2310721022) {
        abort(
            `Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(
                cookie2
            )} ${ptrToString(cookie1)}`
        );
    }
    if (HEAPU32[0 >> 2] != 1668509029) {
        abort("Runtime error: The application has corrupted its heap memory area (address zero)!");
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
function preRun() {
    assert(!ENVIRONMENT_IS_PTHREAD);
    var preRuns = Module["preRun"];
    if (preRuns) {
        if (typeof preRuns == "function") preRuns = [preRuns];
        preRuns.forEach(addOnPreRun);
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
    assert(!runtimeInitialized);
    runtimeInitialized = true;
    if (ENVIRONMENT_IS_PTHREAD) return;
    checkStackCookie();
    if (!Module["noFSInit"] && !FS.initialized) FS.init();
    FS.ignorePermissions = false;
    TTY.init();
    callRuntimeCallbacks(__ATINIT__);
}
function postRun() {
    checkStackCookie();
    if (ENVIRONMENT_IS_PTHREAD) return;
    var postRuns = Module["postRun"];
    if (postRuns) {
        if (typeof postRuns == "function") postRuns = [postRuns];
        postRuns.forEach(addOnPostRun);
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
}
assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
var runDependencyTracking = {};
function getUniqueRunDependency(id) {
    var orig = id;
    while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random();
    }
}
function addRunDependency(id) {
    runDependencies++;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher === null && typeof setInterval != "undefined") {
            runDependencyWatcher = setInterval(() => {
                if (ABORT) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                    return;
                }
                var shown = false;
                for (var dep in runDependencyTracking) {
                    if (!shown) {
                        shown = true;
                        err("still waiting on run dependencies:");
                    }
                    err(`dependency: ${dep}`);
                }
                if (shown) {
                    err("(end of list)");
                }
            }, 1e4);
        }
    } else {
        err("warning: run dependency added without ID");
    }
}
function removeRunDependency(id) {
    runDependencies--;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
    } else {
        err("warning: run dependency removed without ID");
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
}
function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    var e = new WebAssembly.RuntimeError(what);
    throw e;
}
var dataURIPrefix = "data:application/octet-stream;base64,";
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
var isFileURI = (filename) => filename.startsWith("file://");
function createExportWrapper(name, nargs) {
    return (...args) => {
        assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
        var f = wasmExports[name];
        assert(f, `exported native function \`${name}\` not found`);
        assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
        return f(...args);
    };
}
function findWasmBinary() {
    var f =
    return f;
}
var wasmBinaryFile;
function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
        return binary;
    }
    if (readBinary) {
        return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
}
function getBinaryPromise(binaryFile) {
    return Promise.resolve().then(() => getBinarySync(binaryFile));
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
    return getBinaryPromise(binaryFile)
        .then((binary) => WebAssembly.instantiate(binary, imports))
        .then(receiver, (reason) => {
            err(`failed to asynchronously prepare wasm: ${reason}`);
            if (isFileURI(wasmBinaryFile)) {
                err(
                    `warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`
                );
            }
            abort(reason);
        });
}
function instantiateAsync(binary, binaryFile, imports, callback) {
    return instantiateArrayBuffer(binaryFile, imports, callback);
}
function getWasmImports() {
    assignWasmImports();
    return { env: wasmImports, wasi_snapshot_preview1: wasmImports };
}
function createWasm() {
    var info = getWasmImports();
    function receiveInstance(instance, module) {
        wasmExports = instance.exports;
        registerTLSInit(wasmExports["_emscripten_tls_init"]);
        wasmTable = wasmExports["__indirect_function_table"];
        assert(wasmTable, "table not found in wasm exports");
        addOnInit(wasmExports["__wasm_call_ctors"]);
        wasmModule = module;
        removeRunDependency("wasm-instantiate");
        return wasmExports;
    }
    addRunDependency("wasm-instantiate");
    var trueModule = Module;
    function receiveInstantiationResult(result) {
        assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
        trueModule = null;
        receiveInstance(result["instance"], result["module"]);
    }
    if (Module["instantiateWasm"]) {
        try {
            return Module["instantiateWasm"](info, receiveInstance);
        } catch (e) {
            err(`Module.instantiateWasm callback failed with error: ${e}`);
            return false;
        }
    }
    wasmBinaryFile ??= findWasmBinary();
    instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
    return {};
}
var tempDouble;
var tempI64;
(() => {
    var h16 = new Int16Array(1);
    var h8 = new Int8Array(h16.buffer);
    h16[0] = 25459;
    if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();
if (Module["ENVIRONMENT"]) {
    throw new Error(
        "Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)"
    );
}
function legacyModuleProp(prop, newName, incoming = true) {
    if (!Object.getOwnPropertyDescriptor(Module, prop)) {
        Object.defineProperty(Module, prop, {
            configurable: true,
            get() {
                let extra = incoming ? " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)" : "";
                abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);
            },
        });
    }
}
function ignoredModuleProp(prop) {
    if (Object.getOwnPropertyDescriptor(Module, prop)) {
        abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
    }
}
function isExportedByForceFilesystem(name) {
    return (
        name === "FS_createPath" ||
        name === "FS_createDataFile" ||
        name === "FS_createPreloadedFile" ||
        name === "FS_unlink" ||
        name === "addRunDependency" ||
        name === "FS_createLazyFile" ||
        name === "FS_createDevice" ||
        name === "removeRunDependency"
    );
}
function hookGlobalSymbolAccess(sym, func) {
    if (typeof globalThis != "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
        Object.defineProperty(globalThis, sym, {
            configurable: true,
            get() {
                func();
                return undefined;
            },
        });
    }
}
function missingGlobal(sym, msg) {
    hookGlobalSymbolAccess(sym, () => {
        warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
    });
}
missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");
missingGlobal("asm", "Please use wasmExports instead");
function missingLibrarySymbol(sym) {
    hookGlobalSymbolAccess(sym, () => {
        var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
        var librarySymbol = sym;
        if (!librarySymbol.startsWith("_")) {
            librarySymbol = "$" + sym;
        }
        msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
        if (isExportedByForceFilesystem(sym)) {
            msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        warnOnce(msg);
    });
    unexportedRuntimeSymbol(sym);
}
function unexportedRuntimeSymbol(sym) {
    if (ENVIRONMENT_IS_PTHREAD) {
        return;
    }
    if (!Object.getOwnPropertyDescriptor(Module, sym)) {
        Object.defineProperty(Module, sym, {
            configurable: true,
            get() {
                var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
                if (isExportedByForceFilesystem(sym)) {
                    msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
                }
                abort(msg);
            },
        });
    }
}
function dbg(...args) {
    if (ENVIRONMENT_IS_NODE && fs) {
        fs.writeSync(2, args.join(" ") + "\n");
    } else console.warn(...args);
}
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
}
var terminateWorker = (worker) => {
    worker.terminate();
    worker.onmessage = (e) => {
        var cmd = e["data"].cmd;
        err(`received "${cmd}" command from terminated worker: ${worker.workerID}`);
    };
};
var cleanupThread = (pthread_ptr) => {
    assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! cleanupThread() can only ever be called from main application thread!");
    assert(pthread_ptr, "Internal Error! Null pthread_ptr in cleanupThread!");
    var worker = PThread.pthreads[pthread_ptr];
    assert(worker);
    PThread.returnWorkerToPool(worker);
};
var spawnThread = (threadParams) => {
    assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! spawnThread() can only ever be called from main application thread!");
    assert(threadParams.pthread_ptr, "Internal error, no pthread ptr!");
    var worker = PThread.getNewWorker();
    if (!worker) {
        return 6;
    }
    assert(!worker.pthread_ptr, "Internal error!");
    PThread.runningWorkers.push(worker);
    PThread.pthreads[threadParams.pthread_ptr] = worker;
    worker.pthread_ptr = threadParams.pthread_ptr;
    var msg = { cmd: "run", start_routine: threadParams.startRoutine, arg: threadParams.arg, pthread_ptr: threadParams.pthread_ptr };
    if (ENVIRONMENT_IS_NODE) {
        worker.unref();
    }
    worker.postMessage(msg, threadParams.transferList);
    return 0;
};
var runtimeKeepaliveCounter = 0;
var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
var stackSave = () => _emscripten_stack_get_current();
var stackRestore = (val) => __emscripten_stack_restore(val);
var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
var convertI32PairToI53Checked = (lo, hi) => {
    assert(lo == lo >>> 0 || lo == (lo | 0));
    assert(hi === (hi | 0));
    return (hi + 2097152) >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
};
var proxyToMainThread = (funcIndex, emAsmAddr, sync, ...callArgs) => {
    var serializedNumCallArgs = callArgs.length;
    var sp = stackSave();
    var args = stackAlloc(serializedNumCallArgs * 8);
    var b = args >> 3;
    for (var i = 0; i < callArgs.length; i++) {
        var arg = callArgs[i];
        HEAPF64[b + i] = arg;
    }
    var rtn = __emscripten_run_on_main_thread_js(funcIndex, emAsmAddr, serializedNumCallArgs, args, sync);
    stackRestore(sp);
    return rtn;
};
function _proc_exit(code) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 1, code);
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
        PThread.terminateAllThreads();
        Module["onExit"]?.(code);
        ABORT = true;
    }
    quit_(code, new ExitStatus(code));
}
var handleException = (e) => {
    if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS;
    }
    checkStackCookie();
    if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
            err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 5242880)");
        }
    }
    quit_(1, e);
};
function exitOnMainThread(returnCode) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 0, returnCode);
    _exit(returnCode);
}
var exitJS = (status, implicit) => {
    EXITSTATUS = status;
    checkUnflushedContent();
    if (ENVIRONMENT_IS_PTHREAD) {
        assert(!implicit);
        exitOnMainThread(status);
        throw "unwind";
    }
    if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
    }
    _proc_exit(status);
};
var _exit = exitJS;
var ptrToString = (ptr) => {
    assert(typeof ptr === "number");
    ptr >>>= 0;
    return "0x" + ptr.toString(16).padStart(8, "0");
};
var PThread = {
    unusedWorkers: [],
    runningWorkers: [],
    tlsInitFunctions: [],
    pthreads: {},
    nextWorkerID: 1,
    debugInit() {
        function pthreadLogPrefix() {
            var t = 0;
            if (runtimeInitialized && typeof _pthread_self != "undefined") {
                t = _pthread_self();
            }
            return `w:${workerID},t:${ptrToString(t)}: `;
        }
        var origDbg = dbg;
        dbg = (...args) => origDbg(pthreadLogPrefix() + args.join(" "));
    },
    init() {
        PThread.debugInit();
        if (!ENVIRONMENT_IS_PTHREAD) {
            PThread.initMainThread();
        }
    },
    initMainThread() {
        addOnPreRun(() => {
            addRunDependency("loading-workers");
            PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"));
        });
    },
    terminateAllThreads: () => {
        assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! terminateAllThreads() can only ever be called from main application thread!");
        for (var worker of PThread.runningWorkers) {
            terminateWorker(worker);
        }
        for (var worker of PThread.unusedWorkers) {
            terminateWorker(worker);
        }
        PThread.unusedWorkers = [];
        PThread.runningWorkers = [];
        PThread.pthreads = [];
    },
    returnWorkerToPool: (worker) => {
        var pthread_ptr = worker.pthread_ptr;
        delete PThread.pthreads[pthread_ptr];
        PThread.unusedWorkers.push(worker);
        PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
        worker.pthread_ptr = 0;
        __emscripten_thread_free_data(pthread_ptr);
    },
    receiveObjectTransfer(data) {},
    threadInitTLS() {
        PThread.tlsInitFunctions.forEach((f) => f());
    },
    loadWasmModuleToWorker: (worker) =>
        new Promise((onFinishedLoading) => {
            worker.onmessage = (e) => {
                var d = e["data"];
                var cmd = d.cmd;
                if (d.targetThread && d.targetThread != _pthread_self()) {
                    var targetWorker = PThread.pthreads[d.targetThread];
                    if (targetWorker) {
                        targetWorker.postMessage(d, d.transferList);
                    } else {
                        err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d.targetThread}, but that thread no longer exists!`);
                    }
                    return;
                }
                if (cmd === "checkMailbox") {
                    checkMailbox();
                } else if (cmd === "spawnThread") {
                    spawnThread(d);
                } else if (cmd === "cleanupThread") {
                    cleanupThread(d.thread);
                } else if (cmd === "loaded") {
                    worker.loaded = true;
                    onFinishedLoading(worker);
                } else if (cmd === "alert") {
                    alert(`Thread ${d.threadId}: ${d.text}`);
                } else if (d.target === "setimmediate") {
                    worker.postMessage(d);
                } else if (cmd === "callHandler") {
                    Module[d.handler](...d.args);
                } else if (cmd) {
                    err(`worker sent an unknown command ${cmd}`);
                }
            };
            worker.onerror = (e) => {
                var message = "worker sent an error!";
                if (worker.pthread_ptr) {
                    message = `Pthread ${ptrToString(worker.pthread_ptr)} sent an error!`;
                }
                err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
                throw e;
            };
            if (ENVIRONMENT_IS_NODE) {
                worker.on("message", (data) => worker.onmessage({ data }));
                worker.on("error", (e) => worker.onerror(e));
            }
            assert(wasmMemory instanceof WebAssembly.Memory, "WebAssembly memory should have been loaded by now!");
            assert(wasmModule instanceof WebAssembly.Module, "WebAssembly Module should have been loaded by now!");
            var handlers = [];
            var knownHandlers = ["onExit", "onAbort", "print", "printErr"];
            for (var handler of knownHandlers) {
                if (Module.propertyIsEnumerable(handler)) {
                    handlers.push(handler);
                }
            }
            worker.workerID = PThread.nextWorkerID++;
            worker.postMessage({ cmd: "load", handlers, wasmMemory, wasmModule, workerID: worker.workerID });
        }),
    loadWasmModuleToAllWorkers(onMaybeReady) {
        onMaybeReady();
    },
    allocateUnusedWorker() {
        var worker;
        var workerOptions = { workerData: "em-pthread", name: "em-pthread-" + PThread.nextWorkerID };
        var pthreadMainJs = _scriptName;
        if (Module["mainScriptUrlOrBlob"]) {
            pthreadMainJs = Module["mainScriptUrlOrBlob"];
            if (typeof pthreadMainJs != "string") {
                pthreadMainJs = URL.createObjectURL(pthreadMainJs);
            }
        }
        worker = new Worker(pthreadMainJs, workerOptions);
        PThread.unusedWorkers.push(worker);
    },
    getNewWorker() {
        if (PThread.unusedWorkers.length == 0) {
            PThread.allocateUnusedWorker();
            PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
        }
        return PThread.unusedWorkers.pop();
    },
};
var callRuntimeCallbacks = (callbacks) => {
    callbacks.forEach((f) => f(Module));
};
var establishStackSpace = (pthread_ptr) => {
    var stackHigh = HEAPU32[(pthread_ptr + 52) >> 2];
    var stackSize = HEAPU32[(pthread_ptr + 56) >> 2];
    var stackLow = stackHigh - stackSize;
    assert(stackHigh != 0);
    assert(stackLow != 0);
    assert(stackHigh > stackLow, "stackHigh must be higher then stackLow");
    _emscripten_stack_set_limits(stackHigh, stackLow);
    stackRestore(stackHigh);
    writeStackCookie();
};
var wasmTableMirror = [];
var wasmTable;
var getWasmTableEntry = (funcPtr) => {
    var func = wasmTableMirror[funcPtr];
    if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
    }
    assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
    return func;
};
var invokeEntryPoint = (ptr, arg) => {
    runtimeKeepaliveCounter = 0;
    noExitRuntime = 0;
    var result = getWasmTableEntry(ptr)(arg);
    checkStackCookie();
    function finish(result) {
        if (keepRuntimeAlive()) {
            EXITSTATUS = result;
        } else {
            __emscripten_thread_exit(result);
        }
    }
    finish(result);
};
var noExitRuntime = Module["noExitRuntime"] || true;
var registerTLSInit = (tlsInitFunc) => PThread.tlsInitFunctions.push(tlsInitFunc);
var warnOnce = (text) => {
    warnOnce.shown ||= {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
        err(text);
    }
};
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : undefined;
var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.buffer instanceof SharedArrayBuffer ? heapOrArray.slice(idx, endPtr) : heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode(((u0 & 31) << 6) | u1);
            continue;
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
            if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
            u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0);
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
    }
    return str;
};
var UTF8ToString = (ptr, maxBytesToRead) => {
    assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
};
var ___assert_fail = (condition, filename, line, func) => {
    abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]);
};
class ExceptionInfo {
    constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
    }
    set_type(type) {
        HEAPU32[(this.ptr + 4) >> 2] = type;
    }
    get_type() {
        return HEAPU32[(this.ptr + 4) >> 2];
    }
    set_destructor(destructor) {
        HEAPU32[(this.ptr + 8) >> 2] = destructor;
    }
    get_destructor() {
        return HEAPU32[(this.ptr + 8) >> 2];
    }
    set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[this.ptr + 12] = caught;
    }
    get_caught() {
        return HEAP8[this.ptr + 12] != 0;
    }
    set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[this.ptr + 13] = rethrown;
    }
    get_rethrown() {
        return HEAP8[this.ptr + 13] != 0;
    }
    init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
    }
    set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(this.ptr + 16) >> 2] = adjustedPtr;
    }
    get_adjusted_ptr() {
        return HEAPU32[(this.ptr + 16) >> 2];
    }
}
var exceptionLast = 0;
var uncaughtExceptionCount = 0;
var ___cxa_throw = (ptr, type, destructor) => {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    exceptionLast = ptr;
    uncaughtExceptionCount++;
    assert(false, "Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.");
};
function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
    return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}
var _emscripten_has_threading_support = () => typeof SharedArrayBuffer != "undefined";
var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
    if (!_emscripten_has_threading_support()) {
        dbg("pthread_create: environment does not support SharedArrayBuffer, pthreads are not available");
        return 6;
    }
    var transferList = [];
    var error = 0;
    if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
        return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
    }
    if (error) return error;
    var threadParams = { startRoutine, pthread_ptr, arg, transferList };
    if (ENVIRONMENT_IS_PTHREAD) {
        threadParams.cmd = "spawnThread";
        postMessage(threadParams, transferList);
        return 0;
    }
    return spawnThread(threadParams);
};
function syscallGetVarargI() {
    assert(SYSCALLS.varargs != undefined);
    var ret = HEAP32[+SYSCALLS.varargs >> 2];
    SYSCALLS.varargs += 4;
    return ret;
}
var syscallGetVarargP = syscallGetVarargI;
var PATH = {
    isAbs: (path) => path.charAt(0) === "/",
    splitPath: (filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    },
    normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1);
            } else if (last === "..") {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..");
            }
        }
        return parts;
    },
    normalize: (path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(
            path.split("/").filter((p) => !!p),
            !isAbsolute
        ).join("/");
        if (!path && !isAbsolute) {
            path = ".";
        }
        if (path && trailingSlash) {
            path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
    },
    dirname: (path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return ".";
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
    },
    basename: (path) => {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
    },
    join: (...paths) => PATH.normalize(paths.join("/")),
    join2: (l, r) => PATH.normalize(l + "/" + r),
};
var initRandomFill = () => {
    if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
        return (view) => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), view);
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            var randomFillSync = crypto_module["randomFillSync"];
            if (randomFillSync) {
                return (view) => crypto_module["randomFillSync"](view);
            }
            var randomBytes = crypto_module["randomBytes"];
            return (view) => (view.set(randomBytes(view.byteLength)), view);
        } catch (e) {}
    }
    abort(
        "no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: (array) => { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"
    );
};
var randomFill = (view) => (randomFill = initRandomFill())(view);
var PATH_FS = {
    resolve: (...args) => {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? args[i] : FS.cwd();
            if (typeof path != "string") {
                throw new TypeError("Arguments to path.resolve must be strings");
            } else if (!path) {
                return "";
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path);
        }
        resolvedPath = PATH.normalizeArray(
            resolvedPath.split("/").filter((p) => !!p),
            !resolvedAbsolute
        ).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
    },
    relative: (from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break;
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
    },
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++;
        } else if (c <= 2047) {
            len += 2;
        } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i;
        } else {
            len += 3;
        }
    }
    return len;
};
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u;
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | (u >> 6);
            heap[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | (u >> 12);
            heap[outIdx++] = 128 | ((u >> 6) & 63);
            heap[outIdx++] = 128 | (u & 63);
        } else {
            if (outIdx + 3 >= endIdx) break;
            if (u > 1114111)
                warnOnce(
                    "Invalid Unicode code point " +
                        ptrToString(u) +
                        " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF)."
                );
            heap[outIdx++] = 240 | (u >> 18);
            heap[outIdx++] = 128 | ((u >> 12) & 63);
            heap[outIdx++] = 128 | ((u >> 6) & 63);
            heap[outIdx++] = 128 | (u & 63);
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
};
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
}
var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
            var BUFSIZE = 256;
            var buf = Buffer.alloc(BUFSIZE);
            var bytesRead = 0;
            var fd = process.stdin.fd;
            try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
            } catch (e) {
                if (e.toString().includes("EOF")) bytesRead = 0;
                else throw e;
            }
            if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString("utf-8");
            }
        } else if (typeof window != "undefined" && typeof window.prompt == "function") {
            result = window.prompt("Input: ");
            if (result !== null) {
                result += "\n";
            }
        } else {
        }
        if (!result) {
            return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
    }
    return FS_stdin_getChar_buffer.shift();
};
var TTY = {
    ttys: [],
    init() {},
    shutdown() {},
    register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops };
        FS.registerDevice(dev, TTY.stream_ops);
    },
    stream_ops: {
        open(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43);
            }
            stream.tty = tty;
            stream.seekable = false;
        },
        close(stream) {
            stream.tty.ops.fsync(stream.tty);
        },
        fsync(stream) {
            stream.tty.ops.fsync(stream.tty);
        },
        read(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                    throw new FS.ErrnoError(29);
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now();
            }
            return bytesRead;
        },
        write(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60);
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                }
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
            if (length) {
                stream.node.timestamp = Date.now();
            }
            return i;
        },
    },
    default_tty_ops: {
        get_char(tty) {
            return FS_stdin_getChar();
        },
        put_char(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        fsync(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output));
                tty.output = [];
            }
        },
        ioctl_tcgets(tty) {
            return {
                c_iflag: 25856,
                c_oflag: 5,
                c_cflag: 191,
                c_lflag: 35387,
                c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            };
        },
        ioctl_tcsets(tty, optional_actions, data) {
            return 0;
        },
        ioctl_tiocgwinsz(tty) {
            return [24, 80];
        },
    },
    default_tty1_ops: {
        put_char(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        fsync(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output));
                tty.output = [];
            }
        },
    },
};
var mmapAlloc = (size) => {
    abort("internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported");
};
var MEMFS = {
    ops_table: null,
    mount(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
    },
    createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
            dir: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    lookup: MEMFS.node_ops.lookup,
                    mknod: MEMFS.node_ops.mknod,
                    rename: MEMFS.node_ops.rename,
                    unlink: MEMFS.node_ops.unlink,
                    rmdir: MEMFS.node_ops.rmdir,
                    readdir: MEMFS.node_ops.readdir,
                    symlink: MEMFS.node_ops.symlink,
                },
                stream: { llseek: MEMFS.stream_ops.llseek },
            },
            file: {
                node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
                stream: {
                    llseek: MEMFS.stream_ops.llseek,
                    read: MEMFS.stream_ops.read,
                    write: MEMFS.stream_ops.write,
                    allocate: MEMFS.stream_ops.allocate,
                    mmap: MEMFS.stream_ops.mmap,
                    msync: MEMFS.stream_ops.msync,
                },
            },
            link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} },
            chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops },
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null;
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.timestamp = node.timestamp;
        }
        return node;
    },
    getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
    },
    expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
    },
    resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
            }
            node.usedBytes = newSize;
        }
    },
    node_ops: {
        getattr(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096;
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
            } else {
                attr.size = 0;
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
        },
        setattr(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
            }
        },
        lookup(parent, name) {
            throw FS.genericErrors[44];
        },
        mknod(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
        },
        rename(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.parent.timestamp = Date.now();
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            new_dir.timestamp = old_node.parent.timestamp;
        },
        unlink(parent, name) {
            delete parent.contents[name];
            parent.timestamp = Date.now();
        },
        rmdir(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55);
            }
            delete parent.contents[name];
            parent.timestamp = Date.now();
        },
        readdir(node) {
            var entries = [".", ".."];
            for (var key of Object.keys(node.contents)) {
                entries.push(key);
            }
            return entries;
        },
        symlink(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node;
        },
        readlink(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28);
            }
            return node.link;
        },
    },
    stream_ops: {
        read(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset);
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
            }
            return size;
        },
        write(stream, buffer, offset, length, position, canOwn) {
            assert(!(buffer instanceof ArrayBuffer));
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    assert(position === 0, "canOwn must imply no weird position inside the file");
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length;
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position);
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i];
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length;
        },
        llseek(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28);
            }
            return position;
        },
        allocate(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
        mmap(stream, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
                allocated = false;
                ptr = contents.byteOffset;
            } else {
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48);
                }
                if (contents) {
                    if (position > 0 || position + length < contents.length) {
                        if (contents.subarray) {
                            contents = contents.subarray(position, position + length);
                        } else {
                            contents = Array.prototype.slice.call(contents, position, position + length);
                        }
                    }
                    HEAP8.set(contents, ptr);
                }
            }
            return { ptr, allocated };
        },
        msync(stream, buffer, offset, length, mmapFlags) {
            MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0;
        },
    },
};
var asyncLoad = (url, onload, onerror, noRunDep) => {
    var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
    readAsync(url).then(
        (arrayBuffer) => {
            assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
            onload(new Uint8Array(arrayBuffer));
            if (dep) removeRunDependency(dep);
        },
        (err) => {
            if (onerror) {
                onerror();
            } else {
                throw `Loading data file "${url}" failed.`;
            }
        }
    );
    if (dep) addRunDependency(dep);
};
var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
    FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
};
var preloadPlugins = Module["preloadPlugins"] || [];
var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
    if (typeof Browser != "undefined") Browser.init();
    var handled = false;
    preloadPlugins.forEach((plugin) => {
        if (handled) return;
        if (plugin["canHandle"](fullname)) {
            plugin["handle"](byteArray, fullname, finish, onerror);
            handled = true;
        }
    });
    return handled;
};
var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    function processData(byteArray) {
        function finish(byteArray) {
            preFinish?.();
            if (!dontCreateFile) {
                FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            onload?.();
            removeRunDependency(dep);
        }
        if (
            FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
                onerror?.();
                removeRunDependency(dep);
            })
        ) {
            return;
        }
        finish(byteArray);
    }
    addRunDependency(dep);
    if (typeof url == "string") {
        asyncLoad(url, processData, onerror);
    } else {
        processData(url);
    }
};
var FS_modeStringToFlags = (str) => {
    var flagModes = { r: 0, "r+": 2, w: 512 | 64 | 1, "w+": 512 | 64 | 2, a: 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
        throw new Error(`Unknown file open mode: ${str}`);
    }
    return flags;
};
var FS_getMode = (canRead, canWrite) => {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
};
var strError = (errno) => UTF8ToString(_strerror(errno));
var ERRNO_CODES = {
    EPERM: 63,
    ENOENT: 44,
    ESRCH: 71,
    EINTR: 27,
    EIO: 29,
    ENXIO: 60,
    E2BIG: 1,
    ENOEXEC: 45,
    EBADF: 8,
    ECHILD: 12,
    EAGAIN: 6,
    EWOULDBLOCK: 6,
    ENOMEM: 48,
    EACCES: 2,
    EFAULT: 21,
    ENOTBLK: 105,
    EBUSY: 10,
    EEXIST: 20,
    EXDEV: 75,
    ENODEV: 43,
    ENOTDIR: 54,
    EISDIR: 31,
    EINVAL: 28,
    ENFILE: 41,
    EMFILE: 33,
    ENOTTY: 59,
    ETXTBSY: 74,
    EFBIG: 22,
    ENOSPC: 51,
    ESPIPE: 70,
    EROFS: 69,
    EMLINK: 34,
    EPIPE: 64,
    EDOM: 18,
    ERANGE: 68,
    ENOMSG: 49,
    EIDRM: 24,
    ECHRNG: 106,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELNRNG: 109,
    EUNATCH: 110,
    ENOCSI: 111,
    EL2HLT: 112,
    EDEADLK: 16,
    ENOLCK: 46,
    EBADE: 113,
    EBADR: 114,
    EXFULL: 115,
    ENOANO: 104,
    EBADRQC: 103,
    EBADSLT: 102,
    EDEADLOCK: 16,
    EBFONT: 101,
    ENOSTR: 100,
    ENODATA: 116,
    ETIME: 117,
    ENOSR: 118,
    ENONET: 119,
    ENOPKG: 120,
    EREMOTE: 121,
    ENOLINK: 47,
    EADV: 122,
    ESRMNT: 123,
    ECOMM: 124,
    EPROTO: 65,
    EMULTIHOP: 36,
    EDOTDOT: 125,
    EBADMSG: 9,
    ENOTUNIQ: 126,
    EBADFD: 127,
    EREMCHG: 128,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBSCN: 131,
    ELIBMAX: 132,
    ELIBEXEC: 133,
    ENOSYS: 52,
    ENOTEMPTY: 55,
    ENAMETOOLONG: 37,
    ELOOP: 32,
    EOPNOTSUPP: 138,
    EPFNOSUPPORT: 139,
    ECONNRESET: 15,
    ENOBUFS: 42,
    EAFNOSUPPORT: 5,
    EPROTOTYPE: 67,
    ENOTSOCK: 57,
    ENOPROTOOPT: 50,
    ESHUTDOWN: 140,
    ECONNREFUSED: 14,
    EADDRINUSE: 3,
    ECONNABORTED: 13,
    ENETUNREACH: 40,
    ENETDOWN: 38,
    ETIMEDOUT: 73,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EINPROGRESS: 26,
    EALREADY: 7,
    EDESTADDRREQ: 17,
    EMSGSIZE: 35,
    EPROTONOSUPPORT: 66,
    ESOCKTNOSUPPORT: 137,
    EADDRNOTAVAIL: 4,
    ENETRESET: 39,
    EISCONN: 30,
    ENOTCONN: 53,
    ETOOMANYREFS: 141,
    EUSERS: 136,
    EDQUOT: 19,
    ESTALE: 72,
    ENOTSUP: 138,
    ENOMEDIUM: 148,
    EILSEQ: 25,
    EOVERFLOW: 61,
    ECANCELED: 11,
    ENOTRECOVERABLE: 56,
    EOWNERDEAD: 62,
    ESTRPIPE: 135,
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    ErrnoError: class extends Error {
        constructor(errno) {
            super(runtimeInitialized ? strError(errno) : "");
            this.name = "ErrnoError";
            this.errno = errno;
            for (var key in ERRNO_CODES) {
                if (ERRNO_CODES[key] === errno) {
                    this.code = key;
                    break;
                }
            }
        }
    },
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    readFiles: {},
    FSStream: class {
        constructor() {
            this.shared = {};
        }
        get object() {
            return this.node;
        }
        set object(val) {
            this.node = val;
        }
        get isRead() {
            return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
            return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
            return this.flags & 1024;
        }
        get flags() {
            return this.shared.flags;
        }
        set flags(val) {
            this.shared.flags = val;
        }
        get position() {
            return this.shared.position;
        }
        set position(val) {
            this.shared.position = val;
        }
    },
    FSNode: class {
        constructor(parent, name, mode, rdev) {
            if (!parent) {
                parent = this;
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.readMode = 292 | 73;
            this.writeMode = 146;
        }
        get read() {
            return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
            val ? (this.mode |= this.readMode) : (this.mode &= ~this.readMode);
        }
        get write() {
            return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
            val ? (this.mode |= this.writeMode) : (this.mode &= ~this.writeMode);
        }
        get isFolder() {
            return FS.isDir(this.mode);
        }
        get isDevice() {
            return FS.isChrdev(this.mode);
        }
    },
    lookupPath(path, opts = {}) {
        path = PATH_FS.resolve(path);
        if (!path) return { path: "", node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        opts = Object.assign(defaults, opts);
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32);
        }
        var parts = path.split("/").filter((p) => !!p);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break;
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || (islast && opts.follow_mount)) {
                    current = current.mounted.root;
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count + 1 });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32);
                    }
                }
            }
        }
        return { path: current_path, node: current };
    },
    getPath(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
            }
            path = path ? `${node.name}/${path}` : node.name;
            node = node.parent;
        }
    },
    hashName(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
    },
    hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    },
    hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    },
    lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node;
            }
        }
        return FS.lookup(parent, name);
    },
    createNode(parent, name, mode, rdev) {
        assert(typeof parent == "object");
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    },
    destroyNode(node) {
        FS.hashRemoveNode(node);
    },
    isRoot(node) {
        return node === node.parent;
    },
    isMountpoint(node) {
        return !!node.mounted;
    },
    isFile(mode) {
        return (mode & 61440) === 32768;
    },
    isDir(mode) {
        return (mode & 61440) === 16384;
    },
    isLink(mode) {
        return (mode & 61440) === 40960;
    },
    isChrdev(mode) {
        return (mode & 61440) === 8192;
    },
    isBlkdev(mode) {
        return (mode & 61440) === 24576;
    },
    isFIFO(mode) {
        return (mode & 61440) === 4096;
    },
    isSocket(mode) {
        return (mode & 49152) === 49152;
    },
    flagsToPermissionString(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w";
        }
        return perms;
    },
    nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
            return 0;
        }
        if (perms.includes("r") && !(node.mode & 292)) {
            return 2;
        } else if (perms.includes("w") && !(node.mode & 146)) {
            return 2;
        } else if (perms.includes("x") && !(node.mode & 73)) {
            return 2;
        }
        return 0;
    },
    mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
    },
    mayCreate(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, "wx");
    },
    mayDelete(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name);
        } catch (e) {
            return e.errno;
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode;
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10;
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31;
            }
        }
        return 0;
    },
    mayOpen(node, flags) {
        if (!node) {
            return 44;
        }
        if (FS.isLink(node.mode)) {
            return 32;
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    },
    MAX_OPEN_FDS: 4096,
    nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
            if (!FS.streams[fd]) {
                return fd;
            }
        }
        throw new FS.ErrnoError(33);
    },
    getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        return stream;
    },
    getStream: (fd) => FS.streams[fd],
    createStream(stream, fd = -1) {
        assert(fd >= -1);
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
            fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    },
    closeStream(fd) {
        FS.streams[fd] = null;
    },
    dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
    },
    chrdev_stream_ops: {
        open(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            stream.stream_ops.open?.(stream);
        },
        llseek() {
            throw new FS.ErrnoError(70);
        },
    },
    major: (dev) => dev >> 8,
    minor: (dev) => dev & 255,
    makedev: (ma, mi) => (ma << 8) | mi,
    registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
    },
    getDevice: (dev) => FS.devices[dev],
    getMounts(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push(...m.mounts);
        }
        return mounts;
    },
    syncfs(populate, callback) {
        if (typeof populate == "function") {
            callback = populate;
            populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(errCode);
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode);
                }
                return;
            }
            if (++completed >= mounts.length) {
                doCallback(null);
            }
        }
        mounts.forEach((mount) => {
            if (!mount.type.syncfs) {
                return done(null);
            }
            mount.type.syncfs(mount, populate, done);
        });
    },
    mount(type, opts, mountpoint) {
        if (typeof type == "string") {
            throw type;
        }
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10);
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54);
            }
        }
        var mount = { type, opts, mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot;
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount);
            }
        }
        return mountRoot;
    },
    unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((hash) => {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.includes(current.mount)) {
                    FS.destroyNode(current);
                }
                current = next;
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
    },
    lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
    },
    mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
    },
    create(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    },
    mkdir(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    },
    mkdirTree(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode);
            } catch (e) {
                if (e.errno != 20) throw e;
            }
        }
    },
    mkdev(path, mode, dev) {
        if (typeof dev == "undefined") {
            dev = mode;
            mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
    },
    symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
    },
    rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
            return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
            throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
            old_node.parent = new_dir;
        } catch (e) {
            throw e;
        } finally {
            FS.hashAddNode(old_node);
        }
    },
    rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
    },
    readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
    },
    unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
    },
    readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
    },
    stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
    },
    lstat(path) {
        return FS.stat(path, true);
    },
    chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { mode: (mode & 4095) | (node.mode & ~4095), timestamp: Date.now() });
    },
    lchmod(path, mode) {
        FS.chmod(path, mode, true);
    },
    fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
    },
    chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
    },
    lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
    },
    fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
    },
    truncate(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
    },
    ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
    },
    utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
    },
    open(path, flags, mode) {
        if (path === "") {
            throw new FS.ErrnoError(44);
        }
        flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
        if (flags & 64) {
            mode = typeof mode == "undefined" ? 438 : mode;
            mode = (mode & 4095) | 32768;
        } else {
            mode = 0;
        }
        var node;
        if (typeof path == "object") {
            node = path;
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
                node = lookup.node;
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20);
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true;
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        if (flags & 512 && !created) {
            FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
            }
        }
        return stream;
    },
    close(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
            }
        } catch (e) {
            throw e;
        } finally {
            FS.closeStream(stream.fd);
        }
        stream.fd = null;
    },
    isClosed(stream) {
        return stream.fd === null;
    },
    llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
    },
    read(stream, buffer, offset, length, position) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
    },
    write(stream, buffer, offset, length, position, canOwn) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
    },
    allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
    },
    mmap(stream, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43);
        }
        if (!length) {
            throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
    },
    msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
            return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
    },
    ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
    },
    readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf);
        } else if (opts.encoding === "binary") {
            ret = buf;
        }
        FS.close(stream);
        return ret;
    },
    writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
            throw new Error("Unsupported data type");
        }
        FS.close(stream);
    },
    cwd: () => FS.currentPath,
    chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
    },
    createDefaultDirectories() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
    },
    createDefaultDevices() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024),
            randomLeft = 0;
        var randomByte = () => {
            if (randomLeft === 0) {
                randomLeft = randomFill(randomBuffer).byteLength;
            }
            return randomBuffer[--randomLeft];
        };
        FS.createDevice("/dev", "random", randomByte);
        FS.createDevice("/dev", "urandom", randomByte);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
    },
    createSpecialDirectories() {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount(
            {
                mount() {
                    var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
                    node.node_ops = {
                        lookup(parent, name) {
                            var fd = +name;
                            var stream = FS.getStreamChecked(fd);
                            var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path } };
                            ret.parent = ret;
                            return ret;
                        },
                    };
                    return node;
                },
            },
            {},
            "/proc/self/fd"
        );
    },
    createStandardStreams(input, output, error) {
        if (input) {
            FS.createDevice("/dev", "stdin", input);
        } else {
            FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (output) {
            FS.createDevice("/dev", "stdout", null, output);
        } else {
            FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (error) {
            FS.createDevice("/dev", "stderr", null, error);
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
    },
    staticInit() {
        [44].forEach((code) => {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>";
        });
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { MEMFS };
    },
    init(input, output, error) {
        assert(
            !FS.initialized,
            "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)"
        );
        FS.initialized = true;
        input ??= Module["stdin"];
        output ??= Module["stdout"];
        error ??= Module["stderr"];
        FS.createStandardStreams(input, output, error);
    },
    quit() {
        FS.initialized = false;
        _fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue;
            }
            FS.close(stream);
        }
    },
    findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
            return null;
        }
        return ret.object;
    },
    analyzePath(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
        } catch (e) {}
        var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
        try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/";
        } catch (e) {
            ret.error = e.errno;
        }
        return ret;
    },
    createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current);
            } catch (e) {}
            parent = current;
        }
        return current;
    },
    createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
    },
    createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
            parent = typeof parent == "string" ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data == "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr;
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
        }
    },
    createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open(stream) {
                stream.seekable = false;
            },
            close(stream) {
                if (output?.buffer?.length) {
                    output(10);
                }
            },
            read(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input();
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6);
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result;
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now();
                }
                return bytesRead;
            },
            write(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i]);
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now();
                }
                return i;
            },
        });
        return FS.mkdev(path, mode, dev);
    },
    forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != "undefined") {
            throw new Error(
                "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."
            );
        } else {
            try {
                obj.contents = readBinary(obj.url);
                obj.usedBytes = obj.contents.length;
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
        }
    },
    createLazyFile(parent, name, url, canRead, canWrite) {
        class LazyUint8Array {
            constructor() {
                this.lengthKnown = false;
                this.chunks = [];
            }
            get(idx) {
                if (idx > this.length - 1 || idx < 0) {
                    return undefined;
                }
                var chunkOffset = idx % this.chunkSize;
                var chunkNum = (idx / this.chunkSize) | 0;
                return this.getter(chunkNum)[chunkOffset];
            }
            setDataGetter(getter) {
                this.getter = getter;
            }
            cacheLength() {
                var xhr = new XMLHttpRequest();
                xhr.open("HEAD", url, false);
                xhr.send(null);
                if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                var datalength = Number(xhr.getResponseHeader("Content-length"));
                var header;
                var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                var chunkSize = 1024 * 1024;
                if (!hasByteServing) chunkSize = datalength;
                var doXHR = (from, to) => {
                    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url, false);
                    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                    xhr.responseType = "arraybuffer";
                    if (xhr.overrideMimeType) {
                        xhr.overrideMimeType("text/plain; charset=x-user-defined");
                    }
                    xhr.send(null);
                    if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                    if (xhr.response !== undefined) {
                        return new Uint8Array(xhr.response || []);
                    }
                    return intArrayFromString(xhr.responseText || "", true);
                };
                var lazyArray = this;
                lazyArray.setDataGetter((chunkNum) => {
                    var start = chunkNum * chunkSize;
                    var end = (chunkNum + 1) * chunkSize - 1;
                    end = Math.min(end, datalength - 1);
                    if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                        lazyArray.chunks[chunkNum] = doXHR(start, end);
                    }
                    if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
                    return lazyArray.chunks[chunkNum];
                });
                if (usesGzip || !datalength) {
                    chunkSize = datalength = 1;
                    datalength = this.getter(0).length;
                    chunkSize = datalength;
                    out("LazyFiles on gzip forces download of the whole file when length is accessed");
                }
                this._length = datalength;
                this._chunkSize = chunkSize;
                this.lengthKnown = true;
            }
            get length() {
                if (!this.lengthKnown) {
                    this.cacheLength();
                }
                return this._length;
            }
            get chunkSize() {
                if (!this.lengthKnown) {
                    this.cacheLength();
                }
                return this._chunkSize;
            }
        }
        if (typeof XMLHttpRequest != "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array();
            var properties = { isDevice: false, contents: lazyArray };
        } else {
            var properties = { isDevice: false, url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents;
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function () {
                    return this.contents.length;
                },
            },
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
            var fn = node.stream_ops[key];
            stream_ops[key] = (...args) => {
                FS.forceLoadFile(node);
                return fn(...args);
            };
        });
        function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i];
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i);
                }
            }
            return size;
        }
        stream_ops.read = (stream, buffer, offset, length, position) => {
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position);
        };
        stream_ops.mmap = (stream, length, position, prot, flags) => {
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
                throw new FS.ErrnoError(48);
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
    },
    absolutePath() {
        abort("FS.absolutePath has been removed; use PATH_FS.resolve instead");
    },
    createFolder() {
        abort("FS.createFolder has been removed; use FS.mkdir instead");
    },
    createLink() {
        abort("FS.createLink has been removed; use FS.symlink instead");
    },
    joinPath() {
        abort("FS.joinPath has been removed; use PATH.join instead");
    },
    mmapAlloc() {
        abort("FS.mmapAlloc has been replaced by the top level function mmapAlloc");
    },
    standardizePath() {
        abort("FS.standardizePath has been removed; use PATH.normalize instead");
    },
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
            return path;
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd();
        } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path;
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44);
            }
            return dir;
        }
        return PATH.join2(dir, path);
    },
    doStat(func, path, buf) {
        var stat = func(path);
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[(buf + 4) >> 2] = stat.mode;
        HEAPU32[(buf + 8) >> 2] = stat.nlink;
        HEAP32[(buf + 12) >> 2] = stat.uid;
        HEAP32[(buf + 16) >> 2] = stat.gid;
        HEAP32[(buf + 20) >> 2] = stat.rdev;
        (tempI64 = [
            stat.size >>> 0,
            ((tempDouble = stat.size),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 24) >> 2] = tempI64[0]),
            (HEAP32[(buf + 28) >> 2] = tempI64[1]);
        HEAP32[(buf + 32) >> 2] = 4096;
        HEAP32[(buf + 36) >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        (tempI64 = [
            Math.floor(atime / 1e3) >>> 0,
            ((tempDouble = Math.floor(atime / 1e3)),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 40) >> 2] = tempI64[0]),
            (HEAP32[(buf + 44) >> 2] = tempI64[1]);
        HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3 * 1e3;
        (tempI64 = [
            Math.floor(mtime / 1e3) >>> 0,
            ((tempDouble = Math.floor(mtime / 1e3)),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 56) >> 2] = tempI64[0]),
            (HEAP32[(buf + 60) >> 2] = tempI64[1]);
        HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3 * 1e3;
        (tempI64 = [
            Math.floor(ctime / 1e3) >>> 0,
            ((tempDouble = Math.floor(ctime / 1e3)),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 72) >> 2] = tempI64[0]),
            (HEAP32[(buf + 76) >> 2] = tempI64[1]);
        HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3 * 1e3;
        (tempI64 = [
            stat.ino >>> 0,
            ((tempDouble = stat.ino),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 88) >> 2] = tempI64[0]),
            (HEAP32[(buf + 92) >> 2] = tempI64[1]);
        return 0;
    },
    doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
            return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
    },
    getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
    },
    varargs: undefined,
    getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
    },
};
function ___syscall_fcntl64(fd, cmd, varargs) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 0, 1, fd, cmd, varargs);
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = syscallGetVarargI();
                if (arg < 0) {
                    return -28;
                }
                while (FS.streams[arg]) {
                    arg++;
                }
                var newStream;
                newStream = FS.dupStream(stream, arg);
                return newStream.fd;
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = syscallGetVarargI();
                stream.flags |= arg;
                return 0;
            }
            case 12: {
                var arg = syscallGetVarargP();
                var offset = 0;
                HEAP16[(arg + offset) >> 1] = 2;
                return 0;
            }
            case 13:
            case 14:
                return 0;
        }
        return -28;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_ioctl(fd, op, varargs) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 0, 1, fd, op, varargs);
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21505: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcgets) {
                    var termios = stream.tty.ops.ioctl_tcgets(stream);
                    var argp = syscallGetVarargP();
                    HEAP32[argp >> 2] = termios.c_iflag || 0;
                    HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
                    HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
                    HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
                    for (var i = 0; i < 32; i++) {
                        HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
                    }
                    return 0;
                }
                return 0;
            }
            case 21510:
            case 21511:
            case 21512: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcsets) {
                    var argp = syscallGetVarargP();
                    var c_iflag = HEAP32[argp >> 2];
                    var c_oflag = HEAP32[(argp + 4) >> 2];
                    var c_cflag = HEAP32[(argp + 8) >> 2];
                    var c_lflag = HEAP32[(argp + 12) >> 2];
                    var c_cc = [];
                    for (var i = 0; i < 32; i++) {
                        c_cc.push(HEAP8[argp + i + 17]);
                    }
                    return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
                }
                return 0;
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = syscallGetVarargP();
                HEAP32[argp >> 2] = 0;
                return 0;
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28;
            }
            case 21531: {
                var argp = syscallGetVarargP();
                return FS.ioctl(stream, op, argp);
            }
            case 21523: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tiocgwinsz) {
                    var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                    var argp = syscallGetVarargP();
                    HEAP16[argp >> 1] = winsize[0];
                    HEAP16[(argp + 2) >> 1] = winsize[1];
                }
                return 0;
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21515: {
                if (!stream.tty) return -59;
                return 0;
            }
            default:
                return -28;
        }
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 0, 1, dirfd, path, flags, varargs);
    SYSCALLS.varargs = varargs;
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var mode = varargs ? syscallGetVarargI() : 0;
        return FS.open(path, flags, mode).fd;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
var __abort_js = () => {
    abort("native code called abort()");
};
var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};
var embind_init_charCodes = () => {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i);
    }
    embind_charCodes = codes;
};
var embind_charCodes;
var readLatin1String = (ptr) => {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]];
    }
    return ret;
};
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var BindingError;
var throwBindingError = (message) => {
    throw new BindingError(message);
};
var InternalError;
var throwInternalError = (message) => {
    throw new InternalError(message);
};
var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
    myTypes.forEach((type) => (typeDependencies[type] = dependentTypes));
    function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
            throwInternalError("Mismatched type converter count");
        }
        for (var i = 0; i < myTypes.length; ++i) {
            registerType(myTypes[i], myTypeConverters[i]);
        }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach((dt, i) => {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt];
        } else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = [];
            }
            awaitingDependencies[dt].push(() => {
                typeConverters[i] = registeredTypes[dt];
                ++registered;
                if (registered === unregisteredTypes.length) {
                    onComplete(typeConverters);
                }
            });
        }
    });
    if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
    }
};
function sharedRegisterType(rawType, registeredInstance, options = {}) {
    var name = registeredInstance.name;
    if (!rawType) {
        throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
            return;
        } else {
            throwBindingError(`Cannot register type '${name}' twice`);
        }
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach((cb) => cb());
    }
}
function registerType(rawType, registeredInstance, options = {}) {
    if (registeredInstance.argPackAdvance === undefined) {
        throw new TypeError("registerType registeredInstance requires argPackAdvance");
    }
    return sharedRegisterType(rawType, registeredInstance, options);
}
var GenericWireTypeSize = 8;
var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
    name = readLatin1String(name);
    registerType(rawType, {
        name,
        fromWireType: function (wt) {
            return !!wt;
        },
        toWireType: function (destructors, o) {
            return o ? trueValue : falseValue;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: function (pointer) {
            return this["fromWireType"](HEAPU8[pointer]);
        },
        destructorFunction: null,
    });
};
var emval_freelist = [];
var emval_handles = [];
var __emval_decref = (handle) => {
    if (handle > 9 && 0 === --emval_handles[handle + 1]) {
        assert(emval_handles[handle] !== undefined, `Decref for unallocated handle.`);
        emval_handles[handle] = undefined;
        emval_freelist.push(handle);
    }
};
var count_emval_handles = () => emval_handles.length / 2 - 5 - emval_freelist.length;
var init_emval = () => {
    emval_handles.push(0, 1, undefined, 1, null, 1, true, 1, false, 1);
    assert(emval_handles.length === 5 * 2);
    Module["count_emval_handles"] = count_emval_handles;
};
var Emval = {
    toValue: (handle) => {
        if (!handle) {
            throwBindingError("Cannot use deleted val. handle = " + handle);
        }
        assert(handle === 2 || (emval_handles[handle] !== undefined && handle % 2 === 0), `invalid handle: ${handle}`);
        return emval_handles[handle];
    },
    toHandle: (value) => {
        switch (value) {
            case undefined:
                return 2;
            case null:
                return 4;
            case true:
                return 6;
            case false:
                return 8;
            default: {
                const handle = emval_freelist.pop() || emval_handles.length;
                emval_handles[handle] = value;
                emval_handles[handle + 1] = 1;
                return handle;
            }
        }
    },
};
function readPointer(pointer) {
    return this["fromWireType"](HEAPU32[pointer >> 2]);
}
var EmValType = {
    name: "emscripten::val",
    fromWireType: (handle) => {
        var rv = Emval.toValue(handle);
        __emval_decref(handle);
        return rv;
    },
    toWireType: (destructors, value) => Emval.toHandle(value),
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: readPointer,
    destructorFunction: null,
};
var __embind_register_emval = (rawType) => registerType(rawType, EmValType);
var embindRepr = (v) => {
    if (v === null) {
        return "null";
    }
    var t = typeof v;
    if (t === "object" || t === "array" || t === "function") {
        return v.toString();
    } else {
        return "" + v;
    }
};
var floatReadValueFromPointer = (name, width) => {
    switch (width) {
        case 4:
            return function (pointer) {
                return this["fromWireType"](HEAPF32[pointer >> 2]);
            };
        case 8:
            return function (pointer) {
                return this["fromWireType"](HEAPF64[pointer >> 3]);
            };
        default:
            throw new TypeError(`invalid float width (${width}): ${name}`);
    }
};
var __embind_register_float = (rawType, name, size) => {
    name = readLatin1String(name);
    registerType(rawType, {
        name,
        fromWireType: (value) => value,
        toWireType: (destructors, value) => {
            if (typeof value != "number" && typeof value != "boolean") {
                throw new TypeError(`Cannot convert ${embindRepr(value)} to ${this.name}`);
            }
            return value;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: floatReadValueFromPointer(name, size),
        destructorFunction: null,
    });
};
var createNamedFunction = (name, body) => Object.defineProperty(body, "name", { value: name });
var runDestructors = (destructors) => {
    while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
    }
};
function usesDestructorStack(argTypes) {
    for (var i = 1; i < argTypes.length; ++i) {
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
            return true;
        }
    }
    return false;
}
function newFunc(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
        throw new TypeError(`new_ called with constructor type ${typeof constructor} which is not a function`);
    }
    var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () {});
    dummy.prototype = constructor.prototype;
    var obj = new dummy();
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r : obj;
}
function checkArgCount(numArgs, minArgs, maxArgs, humanName, throwBindingError) {
    if (numArgs < minArgs || numArgs > maxArgs) {
        var argCountMessage = minArgs == maxArgs ? minArgs : `${minArgs} to ${maxArgs}`;
        throwBindingError(`function ${humanName} called with ${numArgs} arguments, expected ${argCountMessage}`);
    }
}
function createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync) {
    var needsDestructorStack = usesDestructorStack(argTypes);
    var argCount = argTypes.length - 2;
    var argsList = [];
    var argsListWired = ["fn"];
    if (isClassMethodFunc) {
        argsListWired.push("thisWired");
    }
    for (var i = 0; i < argCount; ++i) {
        argsList.push(`arg${i}`);
        argsListWired.push(`arg${i}Wired`);
    }
    argsList = argsList.join(",");
    argsListWired = argsListWired.join(",");
    var invokerFnBody = `return function (${argsList}) {\n`;
    invokerFnBody += "checkArgCount(arguments.length, minArgs, maxArgs, humanName, throwBindingError);\n";
    if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n";
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["humanName", "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
    if (isClassMethodFunc) {
        invokerFnBody += `var thisWired = classParam['toWireType'](${dtorStack}, this);\n`;
    }
    for (var i = 0; i < argCount; ++i) {
        invokerFnBody += `var arg${i}Wired = argType${i}['toWireType'](${dtorStack}, arg${i});\n`;
        args1.push(`argType${i}`);
    }
    invokerFnBody += (returns || isAsync ? "var rv = " : "") + `invoker(${argsListWired});\n`;
    if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
    } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
            var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
            if (argTypes[i].destructorFunction !== null) {
                invokerFnBody += `${paramName}_dtor(${paramName});\n`;
                args1.push(`${paramName}_dtor`);
            }
        }
    }
    if (returns) {
        invokerFnBody += "var ret = retType['fromWireType'](rv);\n" + "return ret;\n";
    } else {
    }
    invokerFnBody += "}\n";
    args1.push("checkArgCount", "minArgs", "maxArgs");
    invokerFnBody = `if (arguments.length !== ${args1.length}){ throw new Error(humanName + "Expected ${args1.length} closure arguments " + arguments.length + " given."); }\n${invokerFnBody}`;
    return [args1, invokerFnBody];
}
function getRequiredArgCount(argTypes) {
    var requiredArgCount = argTypes.length - 2;
    for (var i = argTypes.length - 1; i >= 2; --i) {
        if (!argTypes[i].optional) {
            break;
        }
        requiredArgCount--;
    }
    return requiredArgCount;
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) {
    var argCount = argTypes.length;
    if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
    }
    assert(!isAsync, "Async bindings are only supported with JSPI.");
    var isClassMethodFunc = argTypes[1] !== null && classType !== null;
    var needsDestructorStack = usesDestructorStack(argTypes);
    var returns = argTypes[0].name !== "void";
    var expectedArgCount = argCount - 2;
    var minArgs = getRequiredArgCount(argTypes);
    var closureArgs = [humanName, throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    for (var i = 0; i < argCount - 2; ++i) {
        closureArgs.push(argTypes[i + 2]);
    }
    if (!needsDestructorStack) {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
            if (argTypes[i].destructorFunction !== null) {
                closureArgs.push(argTypes[i].destructorFunction);
            }
        }
    }
    closureArgs.push(checkArgCount, minArgs, expectedArgCount);
    let [args, invokerFnBody] = createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync);
    args.push(invokerFnBody);
    var invokerFn = newFunc(Function, args)(...closureArgs);
    return createNamedFunction(humanName, invokerFn);
}
var ensureOverloadTable = (proto, methodName, humanName) => {
    if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = function (...args) {
            if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) {
                throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
            }
            return proto[methodName].overloadTable[args.length].apply(this, args);
        };
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
    }
};
var exposePublicSymbol = (name, value, numArguments) => {
    if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
            throwBindingError(`Cannot register public name '${name}' twice`);
        }
        ensureOverloadTable(Module, name, name);
        if (Module[name].overloadTable.hasOwnProperty(numArguments)) {
            throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
        }
        Module[name].overloadTable[numArguments] = value;
    } else {
        Module[name] = value;
        Module[name].argCount = numArguments;
    }
};
var heap32VectorToArray = (count, firstElement) => {
    var array = [];
    for (var i = 0; i < count; i++) {
        array.push(HEAPU32[(firstElement + i * 4) >> 2]);
    }
    return array;
};
var replacePublicSymbol = (name, value, numArguments) => {
    if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistent public symbol");
    }
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
    } else {
        Module[name] = value;
        Module[name].argCount = numArguments;
    }
};
var dynCallLegacy = (sig, ptr, args) => {
    sig = sig.replace(/p/g, "i");
    assert("dynCall_" + sig in Module, `bad function pointer type - dynCall function not found for sig '${sig}'`);
    if (args?.length) {
        assert(args.length === sig.substring(1).replace(/j/g, "--").length);
    } else {
        assert(sig.length == 1);
    }
    var f = Module["dynCall_" + sig];
    return f(ptr, ...args);
};
var dynCall = (sig, ptr, args = []) => {
    if (sig.includes("j")) {
        return dynCallLegacy(sig, ptr, args);
    }
    assert(getWasmTableEntry(ptr), `missing table entry in dynCall: ${ptr}`);
    var rtn = getWasmTableEntry(ptr)(...args);
    return rtn;
};
var getDynCaller = (sig, ptr) => {
    assert(sig.includes("j") || sig.includes("p"), "getDynCaller should only be called with i64 sigs");
    return (...args) => dynCall(sig, ptr, args);
};
var embind__requireFunction = (signature, rawFunction) => {
    signature = readLatin1String(signature);
    function makeDynCaller() {
        if (signature.includes("j")) {
            return getDynCaller(signature, rawFunction);
        }
        return getWasmTableEntry(rawFunction);
    }
    var fp = makeDynCaller();
    if (typeof fp != "function") {
        throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
    }
    return fp;
};
var extendError = (baseErrorType, errorName) => {
    var errorClass = createNamedFunction(errorName, function (message) {
        this.name = errorName;
        this.message = message;
        var stack = new Error(message).stack;
        if (stack !== undefined) {
            this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
        }
    });
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = function () {
        if (this.message === undefined) {
            return this.name;
        } else {
            return `${this.name}: ${this.message}`;
        }
    };
    return errorClass;
};
var UnboundTypeError;
var getTypeName = (type) => {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv;
};
var throwUnboundTypeError = (message, types) => {
    var unboundTypes = [];
    var seen = {};
    function visit(type) {
        if (seen[type]) {
            return;
        }
        if (registeredTypes[type]) {
            return;
        }
        if (typeDependencies[type]) {
            typeDependencies[type].forEach(visit);
            return;
        }
        unboundTypes.push(type);
        seen[type] = true;
    }
    types.forEach(visit);
    throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([", "]));
};
var getFunctionName = (signature) => {
    signature = signature.trim();
    const argsIndex = signature.indexOf("(");
    if (argsIndex !== -1) {
        assert(signature[signature.length - 1] == ")", "Parentheses for argument names should match.");
        return signature.substr(0, argsIndex);
    } else {
        return signature;
    }
};
var __embind_register_function = (name, argCount, rawArgTypesAddr, signature, rawInvoker, fn, isAsync, isNonnullReturn) => {
    var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    name = readLatin1String(name);
    name = getFunctionName(name);
    rawInvoker = embind__requireFunction(signature, rawInvoker);
    exposePublicSymbol(
        name,
        function () {
            throwUnboundTypeError(`Cannot call ${name} due to unbound types`, argTypes);
        },
        argCount - 1
    );
    whenDependentTypesAreResolved([], argTypes, (argTypes) => {
        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn, isAsync), argCount - 1);
        return [];
    });
};
var integerReadValueFromPointer = (name, width, signed) => {
    switch (width) {
        case 1:
            return signed ? (pointer) => HEAP8[pointer] : (pointer) => HEAPU8[pointer];
        case 2:
            return signed ? (pointer) => HEAP16[pointer >> 1] : (pointer) => HEAPU16[pointer >> 1];
        case 4:
            return signed ? (pointer) => HEAP32[pointer >> 2] : (pointer) => HEAPU32[pointer >> 2];
        default:
            throw new TypeError(`invalid integer width (${width}): ${name}`);
    }
};
var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
    name = readLatin1String(name);
    if (maxRange === -1) {
        maxRange = 4294967295;
    }
    var fromWireType = (value) => value;
    if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = (value) => (value << bitshift) >>> bitshift;
    }
    var isUnsignedType = name.includes("unsigned");
    var checkAssertions = (value, toTypeName) => {
        if (typeof value != "number" && typeof value != "boolean") {
            throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${toTypeName}`);
        }
        if (value < minRange || value > maxRange) {
            throw new TypeError(
                `Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`
            );
        }
    };
    var toWireType;
    if (isUnsignedType) {
        toWireType = function (destructors, value) {
            checkAssertions(value, this.name);
            return value >>> 0;
        };
    } else {
        toWireType = function (destructors, value) {
            checkAssertions(value, this.name);
            return value;
        };
    }
    registerType(primitiveType, {
        name,
        fromWireType,
        toWireType,
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0),
        destructorFunction: null,
    });
};
var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
    var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
    var TA = typeMapping[dataTypeIndex];
    function decodeMemoryView(handle) {
        var size = HEAPU32[handle >> 2];
        var data = HEAPU32[(handle + 4) >> 2];
        return new TA(HEAP8.buffer, data, size);
    }
    name = readLatin1String(name);
    registerType(
        rawType,
        { name, fromWireType: decodeMemoryView, argPackAdvance: GenericWireTypeSize, readValueFromPointer: decodeMemoryView },
        { ignoreDuplicateRegistrations: true }
    );
};
var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
    assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
};
var __embind_register_std_string = (rawType, name) => {
    name = readLatin1String(name);
    var stdStringIsUTF8 = name === "std::string";
    registerType(rawType, {
        name,
        fromWireType(value) {
            var length = HEAPU32[value >> 2];
            var payload = value + 4;
            var str;
            if (stdStringIsUTF8) {
                var decodeStartPtr = payload;
                for (var i = 0; i <= length; ++i) {
                    var currentBytePtr = payload + i;
                    if (i == length || HEAPU8[currentBytePtr] == 0) {
                        var maxRead = currentBytePtr - decodeStartPtr;
                        var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                        if (str === undefined) {
                            str = stringSegment;
                        } else {
                            str += String.fromCharCode(0);
                            str += stringSegment;
                        }
                        decodeStartPtr = currentBytePtr + 1;
                    }
                }
            } else {
                var a = new Array(length);
                for (var i = 0; i < length; ++i) {
                    a[i] = String.fromCharCode(HEAPU8[payload + i]);
                }
                str = a.join("");
            }
            _free(value);
            return str;
        },
        toWireType(destructors, value) {
            if (value instanceof ArrayBuffer) {
                value = new Uint8Array(value);
            }
            var length;
            var valueIsOfTypeString = typeof value == "string";
            if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                throwBindingError("Cannot pass non-string to std::string");
            }
            if (stdStringIsUTF8 && valueIsOfTypeString) {
                length = lengthBytesUTF8(value);
            } else {
                length = value.length;
            }
            var base = _malloc(4 + length + 1);
            var ptr = base + 4;
            HEAPU32[base >> 2] = length;
            if (stdStringIsUTF8 && valueIsOfTypeString) {
                stringToUTF8(value, ptr, length + 1);
            } else {
                if (valueIsOfTypeString) {
                    for (var i = 0; i < length; ++i) {
                        var charCode = value.charCodeAt(i);
                        if (charCode > 255) {
                            _free(ptr);
                            throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
                        }
                        HEAPU8[ptr + i] = charCode;
                    }
                } else {
                    for (var i = 0; i < length; ++i) {
                        HEAPU8[ptr + i] = value[i];
                    }
                }
            }
            if (destructors !== null) {
                destructors.push(_free, base);
            }
            return base;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        destructorFunction(ptr) {
            _free(ptr);
        },
    });
};
var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;
var UTF16ToString = (ptr, maxBytesToRead) => {
    assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
    var endPtr = ptr;
    var idx = endPtr >> 1;
    var maxIdx = idx + maxBytesToRead / 2;
    while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
    endPtr = idx << 1;
    if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.slice(ptr, endPtr));
    var str = "";
    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[(ptr + i * 2) >> 1];
        if (codeUnit == 0) break;
        str += String.fromCharCode(codeUnit);
    }
    return str;
};
var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
    assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
    assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
    maxBytesToWrite ??= 2147483647;
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2;
    }
    HEAP16[outPtr >> 1] = 0;
    return outPtr - startPtr;
};
var lengthBytesUTF16 = (str) => str.length * 2;
var UTF32ToString = (ptr, maxBytesToRead) => {
    assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
    var i = 0;
    var str = "";
    while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(ptr + i * 4) >> 2];
        if (utf32 == 0) break;
        ++i;
        if (utf32 >= 65536) {
            var ch = utf32 - 65536;
            str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        } else {
            str += String.fromCharCode(utf32);
        }
    }
    return str;
};
var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
    assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
    assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
    maxBytesToWrite ??= 2147483647;
    if (maxBytesToWrite < 4) return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) {
            var trailSurrogate = str.charCodeAt(++i);
            codeUnit = (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023);
        }
        HEAP32[outPtr >> 2] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
    }
    HEAP32[outPtr >> 2] = 0;
    return outPtr - startPtr;
};
var lengthBytesUTF32 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
        len += 4;
    }
    return len;
};
var __embind_register_std_wstring = (rawType, charSize, name) => {
    name = readLatin1String(name);
    var decodeString, encodeString, readCharAt, lengthBytesUTF;
    if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
        readCharAt = (pointer) => HEAPU16[pointer >> 1];
    } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        readCharAt = (pointer) => HEAPU32[pointer >> 2];
    }
    registerType(rawType, {
        name,
        fromWireType: (value) => {
            var length = HEAPU32[value >> 2];
            var str;
            var decodeStartPtr = value + 4;
            for (var i = 0; i <= length; ++i) {
                var currentBytePtr = value + 4 + i * charSize;
                if (i == length || readCharAt(currentBytePtr) == 0) {
                    var maxReadBytes = currentBytePtr - decodeStartPtr;
                    var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                    if (str === undefined) {
                        str = stringSegment;
                    } else {
                        str += String.fromCharCode(0);
                        str += stringSegment;
                    }
                    decodeStartPtr = currentBytePtr + charSize;
                }
            }
            _free(value);
            return str;
        },
        toWireType: (destructors, value) => {
            if (!(typeof value == "string")) {
                throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
            }
            var length = lengthBytesUTF(value);
            var ptr = _malloc(4 + length + charSize);
            HEAPU32[ptr >> 2] = length / charSize;
            encodeString(value, ptr + 4, length + charSize);
            if (destructors !== null) {
                destructors.push(_free, ptr);
            }
            return ptr;
        },
        argPackAdvance: GenericWireTypeSize,
        readValueFromPointer: readPointer,
        destructorFunction(ptr) {
            _free(ptr);
        },
    });
};
var __embind_register_void = (rawType, name) => {
    name = readLatin1String(name);
    registerType(rawType, { isVoid: true, name, argPackAdvance: 0, fromWireType: () => undefined, toWireType: (destructors, o) => undefined });
};
var nowIsMonotonic = 1;
var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
var __emscripten_init_main_thread_js = (tb) => {
    __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB, 5242880, false);
    PThread.threadInitTLS();
};
var maybeExit = () => {
    if (!keepRuntimeAlive()) {
        try {
            if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS);
            else _exit(EXITSTATUS);
        } catch (e) {
            handleException(e);
        }
    }
};
var callUserCallback = (func) => {
    if (ABORT) {
        err("user callback triggered after runtime exited or application aborted.  Ignoring.");
        return;
    }
    try {
        func();
        maybeExit();
    } catch (e) {
        handleException(e);
    }
};
var __emscripten_thread_mailbox_await = (pthread_ptr) => {
    if (typeof Atomics.waitAsync === "function") {
        var wait = Atomics.waitAsync(HEAP32, pthread_ptr >> 2, pthread_ptr);
        assert(wait.async);
        wait.value.then(checkMailbox);
        var waitingAsync = pthread_ptr + 128;
        Atomics.store(HEAP32, waitingAsync >> 2, 1);
    }
};
var checkMailbox = () => {
    var pthread_ptr = _pthread_self();
    if (pthread_ptr) {
        __emscripten_thread_mailbox_await(pthread_ptr);
        callUserCallback(__emscripten_check_mailbox);
    }
};
var __emscripten_notify_mailbox_postmessage = (targetThread, currThreadId) => {
    if (targetThread == currThreadId) {
        setTimeout(checkMailbox);
    } else if (ENVIRONMENT_IS_PTHREAD) {
        postMessage({ targetThread, cmd: "checkMailbox" });
    } else {
        var worker = PThread.pthreads[targetThread];
        if (!worker) {
            err(`Cannot send message to thread with ID ${targetThread}, unknown thread ID!`);
            return;
        }
        worker.postMessage({ cmd: "checkMailbox" });
    }
};
var proxiedJSCallArgs = [];
var __emscripten_receive_on_main_thread_js = (funcIndex, emAsmAddr, callingThread, numCallArgs, args) => {
    proxiedJSCallArgs.length = numCallArgs;
    var b = args >> 3;
    for (var i = 0; i < numCallArgs; i++) {
        proxiedJSCallArgs[i] = HEAPF64[b + i];
    }
    assert(!emAsmAddr);
    var func = proxiedFunctionTable[funcIndex];
    assert(!(funcIndex && emAsmAddr));
    assert(func.length == numCallArgs, "Call args mismatch in _emscripten_receive_on_main_thread_js");
    PThread.currentProxiedOperationCallerThread = callingThread;
    var rtn = func(...proxiedJSCallArgs);
    PThread.currentProxiedOperationCallerThread = 0;
    assert(typeof rtn != "bigint");
    return rtn;
};
var __emscripten_thread_cleanup = (thread) => {
    if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread);
    else postMessage({ cmd: "cleanupThread", thread });
};
var __emscripten_thread_set_strongref = (thread) => {
    if (ENVIRONMENT_IS_NODE) {
        PThread.pthreads[thread].ref();
    }
};
var requireRegisteredType = (rawType, humanName) => {
    var impl = registeredTypes[rawType];
    if (undefined === impl) {
        throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
    }
    return impl;
};
var emval_returnValue = (returnType, destructorsRef, handle) => {
    var destructors = [];
    var result = returnType["toWireType"](destructors, handle);
    if (destructors.length) {
        HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
    }
    return result;
};
var __emval_as = (handle, returnType, destructorsRef) => {
    handle = Emval.toValue(handle);
    returnType = requireRegisteredType(returnType, "emval::as");
    return emval_returnValue(returnType, destructorsRef, handle);
};
var emval_methodCallers = [];
var __emval_call = (caller, handle, destructorsRef, args) => {
    caller = emval_methodCallers[caller];
    handle = Emval.toValue(handle);
    return caller(null, handle, destructorsRef, args);
};
var emval_symbols = {};
var getStringOrSymbol = (address) => {
    var symbol = emval_symbols[address];
    if (symbol === undefined) {
        return readLatin1String(address);
    }
    return symbol;
};
var __emval_call_method = (caller, objHandle, methodName, destructorsRef, args) => {
    caller = emval_methodCallers[caller];
    objHandle = Emval.toValue(objHandle);
    methodName = getStringOrSymbol(methodName);
    return caller(objHandle, objHandle[methodName], destructorsRef, args);
};
var emval_addMethodCaller = (caller) => {
    var id = emval_methodCallers.length;
    emval_methodCallers.push(caller);
    return id;
};
var emval_lookupTypes = (argCount, argTypes) => {
    var a = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(HEAPU32[(argTypes + i * 4) >> 2], "parameter " + i);
    }
    return a;
};
var reflectConstruct = Reflect.construct;
var __emval_get_method_caller = (argCount, argTypes, kind) => {
    var types = emval_lookupTypes(argCount, argTypes);
    var retType = types.shift();
    argCount--;
    var functionBody = `return function (obj, func, destructorsRef, args) {\n`;
    var offset = 0;
    var argsList = [];
    if (kind === 0) {
        argsList.push("obj");
    }
    var params = ["retType"];
    var args = [retType];
    for (var i = 0; i < argCount; ++i) {
        argsList.push("arg" + i);
        params.push("argType" + i);
        args.push(types[i]);
        functionBody += `  var arg${i} = argType${i}.readValueFromPointer(args${offset ? "+" + offset : ""});\n`;
        offset += types[i].argPackAdvance;
    }
    var invoker = kind === 1 ? "new func" : "func.call";
    functionBody += `  var rv = ${invoker}(${argsList.join(", ")});\n`;
    if (!retType.isVoid) {
        params.push("emval_returnValue");
        args.push(emval_returnValue);
        functionBody += "  return emval_returnValue(retType, destructorsRef, rv);\n";
    }
    functionBody += "};\n";
    params.push(functionBody);
    var invokerFunction = newFunc(Function, params)(...args);
    var functionName = `methodCaller<(${types.map((t) => t.name).join(", ")}) => ${retType.name}>`;
    return emval_addMethodCaller(createNamedFunction(functionName, invokerFunction));
};
var __emval_get_module_property = (name) => {
    name = getStringOrSymbol(name);
    return Emval.toHandle(Module[name]);
};
var __emval_get_property = (handle, key) => {
    handle = Emval.toValue(handle);
    key = Emval.toValue(key);
    return Emval.toHandle(handle[key]);
};
var __emval_incref = (handle) => {
    if (handle > 9) {
        emval_handles[handle + 1] += 1;
    }
};
var __emval_new_cstring = (v) => Emval.toHandle(getStringOrSymbol(v));
var __emval_run_destructors = (handle) => {
    var destructors = Emval.toValue(handle);
    runDestructors(destructors);
    __emval_decref(handle);
};
var __tzset_js = (timezone, daylight, std_name, dst_name) => {
    var currentYear = new Date().getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    var extractZone = (timezoneOffset) => {
        var sign = timezoneOffset >= 0 ? "-" : "+";
        var absOffset = Math.abs(timezoneOffset);
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        var minutes = String(absOffset % 60).padStart(2, "0");
        return `UTC${sign}${hours}${minutes}`;
    };
    var winterName = extractZone(winterOffset);
    var summerName = extractZone(summerOffset);
    assert(winterName);
    assert(summerName);
    assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
    assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
    if (summerOffset < winterOffset) {
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
    } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
    }
};
var _emscripten_check_blocking_allowed = () => {
    if (ENVIRONMENT_IS_NODE) return;
    if (ENVIRONMENT_IS_WORKER) return;
    warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");
};
var _emscripten_date_now = () => Date.now();
var runtimeKeepalivePush = () => {
    runtimeKeepaliveCounter += 1;
};
var _emscripten_exit_with_live_runtime = () => {
    runtimeKeepalivePush();
    throw "unwind";
};
var getHeapMax = () => HEAPU8.length;
var _emscripten_get_heap_max = () => getHeapMax();
var _emscripten_get_now = () => performance.timeOrigin + performance.now();
var _emscripten_num_logical_cores = () => (ENVIRONMENT_IS_NODE ? require("os").cpus().length : navigator["hardwareConcurrency"]);
var abortOnCannotGrowMemory = (requestedSize) => {
    abort(
        `Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`
    );
};
var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    abortOnCannotGrowMemory(requestedSize);
};
var ENV = {};
var getExecutableName = () => thisProgram || "./this.program";
var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
        var lang = ((typeof navigator == "object" && navigator.languages && navigator.languages[0]) || "C").replace("-", "_") + ".UTF-8";
        var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
        for (var x in ENV) {
            if (ENV[x] === undefined) delete env[x];
            else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
            strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
};
var stringToAscii = (str, buffer) => {
    for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === (str.charCodeAt(i) & 255));
        HEAP8[buffer++] = str.charCodeAt(i);
    }
    HEAP8[buffer] = 0;
};
var _environ_get = function (__environ, environ_buf) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1, __environ, environ_buf);
    var bufSize = 0;
    getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[(__environ + i * 4) >> 2] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
    });
    return 0;
};
var _environ_sizes_get = function (penviron_count, penviron_buf_size) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 0, 1, penviron_count, penviron_buf_size);
    var strings = getEnvStrings();
    HEAPU32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    strings.forEach((string) => (bufSize += string.length + 1));
    HEAPU32[penviron_buf_size >> 2] = bufSize;
    return 0;
};
function _fd_close(fd) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 0, 1, fd);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break;
        if (typeof offset != "undefined") {
            offset += curr;
        }
    }
    return ret;
};
function _fd_read(fd, iov, iovcnt, pnum) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 0, 1, fd, iov, iovcnt, pnum);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doReadv(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, fd, offset_low, offset_high, whence, newOffset);
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
    try {
        if (isNaN(offset)) return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.llseek(stream, offset, whence);
        (tempI64 = [
            stream.position >>> 0,
            ((tempDouble = stream.position),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[newOffset >> 2] = tempI64[0]),
            (HEAP32[(newOffset + 4) >> 2] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
var doWritev = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
            break;
        }
        if (typeof offset != "undefined") {
            offset += curr;
        }
    }
    return ret;
};
function _fd_write(fd, iov, iovcnt, pnum) {
    if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 0, 1, fd, iov, iovcnt, pnum);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doWritev(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
var print = out;
var printErr = err;
var getCFunc = (ident) => {
    var func = Module["_" + ident];
    assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
    return func;
};
var writeArrayToMemory = (array, buffer) => {
    assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
    HEAP8.set(array, buffer);
};
var stringToUTF8OnStack = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
};
var ccall = (ident, returnType, argTypes, args, opts) => {
    var toC = {
        string: (str) => {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                ret = stringToUTF8OnStack(str);
            }
            return ret;
        },
        array: (arr) => {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret;
        },
    };
    function convertReturnValue(ret) {
        if (returnType === "string") {
            return UTF8ToString(ret);
        }
        if (returnType === "boolean") return Boolean(ret);
        return ret;
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== "array", 'Return type should not be "array".');
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i]);
            } else {
                cArgs[i] = args[i];
            }
        }
    }
    var ret = func(...cArgs);
    function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
    }
    ret = onDone(ret);
    return ret;
};
var cwrap =
    (ident, returnType, argTypes, opts) =>
    (...args) =>
        ccall(ident, returnType, argTypes, args, opts);
var FS_createPath = FS.createPath;
var FS_unlink = (path) => FS.unlink(path);
var FS_createLazyFile = FS.createLazyFile;
var FS_createDevice = FS.createDevice;
PThread.init();
FS.createPreloadedFile = FS_createPreloadedFile;
FS.staticInit();
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_unlink"] = FS.unlink;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
embind_init_charCodes();
BindingError = Module["BindingError"] = class BindingError extends Error {
    constructor(message) {
        super(message);
        this.name = "BindingError";
    }
};
InternalError = Module["InternalError"] = class InternalError extends Error {
    constructor(message) {
        super(message);
        this.name = "InternalError";
    }
};
init_emval();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
var proxiedFunctionTable = [
    _proc_exit,
    exitOnMainThread,
    pthreadCreateProxied,
    ___syscall_fcntl64,
    ___syscall_ioctl,
    ___syscall_openat,
    _environ_get,
    _environ_sizes_get,
    _fd_close,
    _fd_read,
    _fd_seek,
    _fd_write,
];
function checkIncomingModuleAPI() {
    ignoredModuleProp("fetchSettings");
}
var wasmImports;
function assignWasmImports() {
    wasmImports = {
        __assert_fail: ___assert_fail,
        __cxa_throw: ___cxa_throw,
        __pthread_create_js: ___pthread_create_js,
        __syscall_fcntl64: ___syscall_fcntl64,
        __syscall_ioctl: ___syscall_ioctl,
        __syscall_openat: ___syscall_openat,
        _abort_js: __abort_js,
        _embind_register_bigint: __embind_register_bigint,
        _embind_register_bool: __embind_register_bool,
        _embind_register_emval: __embind_register_emval,
        _embind_register_float: __embind_register_float,
        _embind_register_function: __embind_register_function,
        _embind_register_integer: __embind_register_integer,
        _embind_register_memory_view: __embind_register_memory_view,
        _embind_register_std_string: __embind_register_std_string,
        _embind_register_std_wstring: __embind_register_std_wstring,
        _embind_register_void: __embind_register_void,
        _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
        _emscripten_init_main_thread_js: __emscripten_init_main_thread_js,
        _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
        _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
        _emscripten_thread_cleanup: __emscripten_thread_cleanup,
        _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
        _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
        _emval_as: __emval_as,
        _emval_call: __emval_call,
        _emval_call_method: __emval_call_method,
        _emval_decref: __emval_decref,
        _emval_get_method_caller: __emval_get_method_caller,
        _emval_get_module_property: __emval_get_module_property,
        _emval_get_property: __emval_get_property,
        _emval_incref: __emval_incref,
        _emval_new_cstring: __emval_new_cstring,
        _emval_run_destructors: __emval_run_destructors,
        _tzset_js: __tzset_js,
        emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
        emscripten_date_now: _emscripten_date_now,
        emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
        emscripten_get_heap_max: _emscripten_get_heap_max,
        emscripten_get_now: _emscripten_get_now,
        emscripten_num_logical_cores: _emscripten_num_logical_cores,
        emscripten_resize_heap: _emscripten_resize_heap,
        environ_get: _environ_get,
        environ_sizes_get: _environ_sizes_get,
        exit: _exit,
        fd_close: _fd_close,
        fd_read: _fd_read,
        fd_seek: _fd_seek,
        fd_write: _fd_write,
        memory: wasmMemory,
    };
}
var wasmExports = createWasm();
var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);
var ___getTypeName = createExportWrapper("__getTypeName", 1);
var __embind_initialize_bindings = createExportWrapper("_embind_initialize_bindings", 0);
var _pthread_self = () => (_pthread_self = wasmExports["pthread_self"])();
var _malloc = createExportWrapper("malloc", 1);
var _free = createExportWrapper("free", 1);
var _fflush = createExportWrapper("fflush", 1);
var _strerror = createExportWrapper("strerror", 1);
var __emscripten_tls_init = createExportWrapper("_emscripten_tls_init", 0);
var __emscripten_thread_init = createExportWrapper("_emscripten_thread_init", 6);
var __emscripten_thread_crashed = createExportWrapper("_emscripten_thread_crashed", 0);
var _emscripten_main_thread_process_queued_calls = createExportWrapper("emscripten_main_thread_process_queued_calls", 0);
var _emscripten_main_runtime_thread_id = createExportWrapper("emscripten_main_runtime_thread_id", 0);
var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"])();
var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"])();
var __emscripten_run_on_main_thread_js = createExportWrapper("_emscripten_run_on_main_thread_js", 5);
var __emscripten_thread_free_data = createExportWrapper("_emscripten_thread_free_data", 1);
var __emscripten_thread_exit = createExportWrapper("_emscripten_thread_exit", 1);
var __emscripten_check_mailbox = createExportWrapper("_emscripten_check_mailbox", 0);
var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports["emscripten_stack_init"])();
var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"])(a0, a1);
var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"])();
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();
var dynCall_viij = (Module["dynCall_viij"] = createExportWrapper("dynCall_viij", 5));
var dynCall_viijjj = (Module["dynCall_viijjj"] = createExportWrapper("dynCall_viijjj", 9));
var dynCall_jiji = (Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", 5));
var dynCall_viijii = (Module["dynCall_viijii"] = createExportWrapper("dynCall_viijii", 7));
var dynCall_iiiiij = (Module["dynCall_iiiiij"] = createExportWrapper("dynCall_iiiiij", 7));
var dynCall_iiiiijj = (Module["dynCall_iiiiijj"] = createExportWrapper("dynCall_iiiiijj", 9));
var dynCall_iiiiiijj = (Module["dynCall_iiiiiijj"] = createExportWrapper("dynCall_iiiiiijj", 10));
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["FS_createPreloadedFile"] = FS_createPreloadedFile;
Module["FS_unlink"] = FS_unlink;
Module["FS_createPath"] = FS_createPath;
Module["FS_createDevice"] = FS_createDevice;
Module["FS_createDataFile"] = FS_createDataFile;
Module["FS_createLazyFile"] = FS_createLazyFile;
Module["print"] = print;
Module["printErr"] = printErr;
var missingLibrarySymbols = [
    "writeI53ToI64",
    "writeI53ToI64Clamped",
    "writeI53ToI64Signaling",
    "writeI53ToU64Clamped",
    "writeI53ToU64Signaling",
    "readI53FromI64",
    "readI53FromU64",
    "convertI32PairToI53",
    "convertU32PairToI53",
    "getTempRet0",
    "setTempRet0",
    "growMemory",
    "inetPton4",
    "inetNtop4",
    "inetPton6",
    "inetNtop6",
    "readSockaddr",
    "writeSockaddr",
    "emscriptenLog",
    "readEmAsmArgs",
    "jstoi_q",
    "listenOnce",
    "autoResumeAudioContext",
    "runtimeKeepalivePop",
    "asmjsMangle",
    "HandleAllocator",
    "getNativeTypeSize",
    "STACK_SIZE",
    "STACK_ALIGN",
    "POINTER_SIZE",
    "ASSERTIONS",
    "uleb128Encode",
    "sigToWasmTypes",
    "generateFuncType",
    "convertJsFunctionToWasm",
    "getEmptyTableSlot",
    "updateTableMap",
    "getFunctionAddress",
    "addFunction",
    "removeFunction",
    "reallyNegative",
    "unSign",
    "strLen",
    "reSign",
    "formatString",
    "intArrayToString",
    "AsciiToString",
    "stringToNewUTF8",
    "registerKeyEventCallback",
    "maybeCStringToJsString",
    "findEventTarget",
    "getBoundingClientRect",
    "fillMouseEventData",
    "registerMouseEventCallback",
    "registerWheelEventCallback",
    "registerUiEventCallback",
    "registerFocusEventCallback",
    "fillDeviceOrientationEventData",
    "registerDeviceOrientationEventCallback",
    "fillDeviceMotionEventData",
    "registerDeviceMotionEventCallback",
    "screenOrientation",
    "fillOrientationChangeEventData",
    "registerOrientationChangeEventCallback",
    "fillFullscreenChangeEventData",
    "registerFullscreenChangeEventCallback",
    "JSEvents_requestFullscreen",
    "JSEvents_resizeCanvasForFullscreen",
    "registerRestoreOldStyle",
    "hideEverythingExceptGivenElement",
    "restoreHiddenElements",
    "setLetterbox",
    "softFullscreenResizeWebGLRenderTarget",
    "doRequestFullscreen",
    "fillPointerlockChangeEventData",
    "registerPointerlockChangeEventCallback",
    "registerPointerlockErrorEventCallback",
    "requestPointerLock",
    "fillVisibilityChangeEventData",
    "registerVisibilityChangeEventCallback",
    "registerTouchEventCallback",
    "fillGamepadEventData",
    "registerGamepadEventCallback",
    "registerBeforeUnloadEventCallback",
    "fillBatteryEventData",
    "battery",
    "registerBatteryEventCallback",
    "setCanvasElementSizeCallingThread",
    "setCanvasElementSizeMainThread",
    "setCanvasElementSize",
    "getCanvasSizeCallingThread",
    "getCanvasSizeMainThread",
    "getCanvasElementSize",
    "jsStackTrace",
    "getCallstack",
    "convertPCtoSourceLocation",
    "checkWasiClock",
    "wasiRightsToMuslOFlags",
    "wasiOFlagsToMuslOFlags",
    "createDyncallWrapper",
    "safeSetTimeout",
    "setImmediateWrapped",
    "clearImmediateWrapped",
    "polyfillSetImmediate",
    "registerPostMainLoop",
    "registerPreMainLoop",
    "getPromise",
    "makePromise",
    "idsToPromises",
    "makePromiseCallback",
    "findMatchingCatch",
    "Browser_asyncPrepareDataCounter",
    "safeRequestAnimationFrame",
    "isLeapYear",
    "ydayFromDate",
    "arraySum",
    "addDays",
    "getSocketFromFD",
    "getSocketAddress",
    "FS_mkdirTree",
    "_setNetworkCallback",
    "heapObjectForWebGLType",
    "toTypedArrayIndex",
    "webgl_enable_ANGLE_instanced_arrays",
    "webgl_enable_OES_vertex_array_object",
    "webgl_enable_WEBGL_draw_buffers",
    "webgl_enable_WEBGL_multi_draw",
    "webgl_enable_EXT_polygon_offset_clamp",
    "webgl_enable_EXT_clip_control",
    "webgl_enable_WEBGL_polygon_mode",
    "emscriptenWebGLGet",
    "computeUnpackAlignedImageSize",
    "colorChannelsInGlTextureFormat",
    "emscriptenWebGLGetTexPixelData",
    "emscriptenWebGLGetUniform",
    "webglGetUniformLocation",
    "webglPrepareUniformLocationsBeforeFirstUse",
    "webglGetLeftBracePos",
    "emscriptenWebGLGetVertexAttrib",
    "__glGetActiveAttribOrUniform",
    "writeGLArray",
    "emscripten_webgl_destroy_context_before_on_calling_thread",
    "registerWebGlEventCallback",
    "runAndAbortIfError",
    "ALLOC_NORMAL",
    "ALLOC_STACK",
    "allocate",
    "writeStringToMemory",
    "writeAsciiToMemory",
    "setErrNo",
    "demangle",
    "stackTrace",
    "getFunctionArgsName",
    "createJsInvokerSignature",
    "getBasestPointer",
    "registerInheritedInstance",
    "unregisterInheritedInstance",
    "getInheritedInstance",
    "getInheritedInstanceCount",
    "getLiveInheritedInstances",
    "enumReadValueFromPointer",
    "genericPointerToWireType",
    "constNoSmartPtrRawPointerToWireType",
    "nonConstNoSmartPtrRawPointerToWireType",
    "init_RegisteredPointer",
    "RegisteredPointer",
    "RegisteredPointer_fromWireType",
    "runDestructor",
    "releaseClassHandle",
    "detachFinalizer",
    "attachFinalizer",
    "makeClassHandle",
    "init_ClassHandle",
    "ClassHandle",
    "throwInstanceAlreadyDeleted",
    "flushPendingDeletes",
    "setDelayFunction",
    "RegisteredClass",
    "shallowCopyInternalPointer",
    "downcastPointer",
    "upcastPointer",
    "validateThis",
    "char_0",
    "char_9",
    "makeLegalFunctionName",
    "emval_get_global",
];
missingLibrarySymbols.forEach(missingLibrarySymbol);
var unexportedSymbols = [
    "run",
    "addOnPreRun",
    "addOnInit",
    "addOnPreMain",
    "addOnExit",
    "addOnPostRun",
    "out",
    "err",
    "callMain",
    "abort",
    "wasmMemory",
    "wasmExports",
    "writeStackCookie",
    "checkStackCookie",
    "intArrayFromBase64",
    "tryParseAsDataURI",
    "convertI32PairToI53Checked",
    "stackSave",
    "stackRestore",
    "stackAlloc",
    "ptrToString",
    "zeroMemory",
    "exitJS",
    "getHeapMax",
    "abortOnCannotGrowMemory",
    "ENV",
    "ERRNO_CODES",
    "strError",
    "DNS",
    "Protocols",
    "Sockets",
    "initRandomFill",
    "randomFill",
    "timers",
    "warnOnce",
    "readEmAsmArgsArray",
    "jstoi_s",
    "getExecutableName",
    "dynCallLegacy",
    "getDynCaller",
    "dynCall",
    "handleException",
    "keepRuntimeAlive",
    "runtimeKeepalivePush",
    "callUserCallback",
    "maybeExit",
    "asyncLoad",
    "alignMemory",
    "mmapAlloc",
    "wasmTable",
    "noExitRuntime",
    "getCFunc",
    "freeTableIndexes",
    "functionsInTableMap",
    "setValue",
    "getValue",
    "PATH",
    "PATH_FS",
    "UTF8Decoder",
    "UTF8ArrayToString",
    "UTF8ToString",
    "stringToUTF8Array",
    "stringToUTF8",
    "lengthBytesUTF8",
    "intArrayFromString",
    "stringToAscii",
    "UTF16Decoder",
    "UTF16ToString",
    "stringToUTF16",
    "lengthBytesUTF16",
    "UTF32ToString",
    "stringToUTF32",
    "lengthBytesUTF32",
    "stringToUTF8OnStack",
    "writeArrayToMemory",
    "JSEvents",
    "specialHTMLTargets",
    "findCanvasEventTarget",
    "currentFullscreenStrategy",
    "restoreOldWindowedStyle",
    "UNWIND_CACHE",
    "ExitStatus",
    "getEnvStrings",
    "doReadv",
    "doWritev",
    "promiseMap",
    "uncaughtExceptionCount",
    "exceptionLast",
    "exceptionCaught",
    "ExceptionInfo",
    "Browser",
    "getPreloadedImageData__data",
    "wget",
    "MONTH_DAYS_REGULAR",
    "MONTH_DAYS_LEAP",
    "MONTH_DAYS_REGULAR_CUMULATIVE",
    "MONTH_DAYS_LEAP_CUMULATIVE",
    "SYSCALLS",
    "preloadPlugins",
    "FS_modeStringToFlags",
    "FS_getMode",
    "FS_stdin_getChar_buffer",
    "FS_stdin_getChar",
    "FS_readFile",
    "FS",
    "MEMFS",
    "TTY",
    "PIPEFS",
    "SOCKFS",
    "tempFixedLengthArray",
    "miniTempWebGLFloatBuffers",
    "miniTempWebGLIntBuffers",
    "GL",
    "AL",
    "GLUT",
    "EGL",
    "GLEW",
    "IDBStore",
    "SDL",
    "SDL_gfx",
    "allocateUTF8",
    "allocateUTF8OnStack",
    "PThread",
    "terminateWorker",
    "cleanupThread",
    "registerTLSInit",
    "spawnThread",
    "exitOnMainThread",
    "proxyToMainThread",
    "proxiedJSCallArgs",
    "invokeEntryPoint",
    "checkMailbox",
    "InternalError",
    "BindingError",
    "throwInternalError",
    "throwBindingError",
    "registeredTypes",
    "awaitingDependencies",
    "typeDependencies",
    "tupleRegistrations",
    "structRegistrations",
    "sharedRegisterType",
    "whenDependentTypesAreResolved",
    "embind_charCodes",
    "embind_init_charCodes",
    "readLatin1String",
    "getTypeName",
    "getFunctionName",
    "heap32VectorToArray",
    "requireRegisteredType",
    "usesDestructorStack",
    "checkArgCount",
    "getRequiredArgCount",
    "createJsInvoker",
    "UnboundTypeError",
    "PureVirtualError",
    "GenericWireTypeSize",
    "EmValType",
    "EmValOptionalType",
    "throwUnboundTypeError",
    "ensureOverloadTable",
    "exposePublicSymbol",
    "replacePublicSymbol",
    "extendError",
    "createNamedFunction",
    "embindRepr",
    "registeredInstances",
    "registeredPointers",
    "registerType",
    "integerReadValueFromPointer",
    "floatReadValueFromPointer",
    "readPointer",
    "runDestructors",
    "newFunc",
    "craftInvokerFunction",
    "embind__requireFunction",
    "finalizationRegistry",
    "detachFinalizer_deps",
    "deletionQueue",
    "delayFunction",
    "emval_freelist",
    "emval_handles",
    "emval_symbols",
    "init_emval",
    "count_emval_handles",
    "getStringOrSymbol",
    "Emval",
    "emval_returnValue",
    "emval_lookupTypes",
    "emval_methodCallers",
    "emval_addMethodCaller",
    "reflectConstruct",
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);
var calledRun;
var calledPrerun;
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller;
};
function stackCheckInit() {
    assert(!ENVIRONMENT_IS_PTHREAD);
    _emscripten_stack_init();
    writeStackCookie();
}
function run() {
    if (runDependencies > 0) {
        return;
    }
    if (ENVIRONMENT_IS_PTHREAD) {
        initRuntime();
        startWorker(Module);
        return;
    }
    stackCheckInit();
    if (!calledPrerun) {
        calledPrerun = 1;
        preRun();
        if (runDependencies > 0) {
            return;
        }
    }
    function doRun() {
        if (calledRun) return;
        calledRun = 1;
        Module["calledRun"] = 1;
        if (ABORT) return;
        initRuntime();
        Module["onRuntimeInitialized"]?.();
        assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
        postRun();
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(() => {
            setTimeout(() => Module["setStatus"](""), 1);
            doRun();
        }, 1);
    } else {
        doRun();
    }
    checkStackCookie();
}
function checkUnflushedContent() {
    var oldOut = out;
    var oldErr = err;
    var has = false;
    out = err = (x) => {
        has = true;
    };
    try {
        _fflush(0);
        ["stdout", "stderr"].forEach((name) => {
            var info = FS.analyzePath("/dev/" + name);
            if (!info) return;
            var stream = info.object;
            var rdev = stream.rdev;
            var tty = TTY.ttys[rdev];
            if (tty?.output?.length) {
                has = true;
            }
        });
    } catch (e) {}
    out = oldOut;
    err = oldErr;
    if (has) {
        warnOnce(
            "stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc."
        );
    }
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
    }
}
run();