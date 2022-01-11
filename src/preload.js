// // contextIsolation === true
// const { contextBridge } = require('electron');
// const __CPP_MODULE__ = require('./src/test-cpp/build/Release/test-cpp.node');

// contextBridge.exposeInMainWorld('__CPP_MODULE__', __CPP_MODULE__);


// contextIsolation === false
window.__CPP_MODULE__ = require('./addons/test-cpp/build/Release/test-cpp.node');
