"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageClient = exports.functionsClient = exports.firestoreClient = exports.authClient = exports.firebaseApp = void 0;
const firebase_1 = require("./firebase");
Object.defineProperty(exports, "firestoreClient", { enumerable: true, get: function () { return firebase_1.db; } });
const firebase_2 = require("./firebase");
Object.defineProperty(exports, "functionsClient", { enumerable: true, get: function () { return firebase_2.functions; } });
const firebase_3 = require("./firebase");
Object.defineProperty(exports, "authClient", { enumerable: true, get: function () { return firebase_3.auth; } });
const firebase_4 = require("./firebase");
Object.defineProperty(exports, "storageClient", { enumerable: true, get: function () { return firebase_4.storage; } });
const firebase_5 = __importDefault(require("./firebase")); // app is the default export from firebase.ts
exports.firebaseApp = firebase_5.default;
//# sourceMappingURL=firebaseClient.js.map