"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporaryStorageManager = void 0;
var crypto_1 = require("crypto");
var path_1 = require("path");
var fs_1 = require("fs");
var TemporaryStorageManager = /** @class */ (function () {
    function TemporaryStorageManager(config) {
        if (config === void 0) { config = {}; }
        this.cleanupHandlers = [];
        this.isCleanedUp = false;
        this.config = __assign({ runId: (0, crypto_1.randomUUID)(), baseStoragePath: (0, path_1.join)(process.cwd(), 'temp-storage'), cleanupOnExit: true, retainOnError: false }, config);
        // Setup cleanup handlers
        if (this.config.cleanupOnExit) {
            this.setupCleanupHandlers();
        }
    }
    /**
     * Get the storage path for this run
     */
    TemporaryStorageManager.prototype.getStoragePath = function () {
        return (0, path_1.join)(this.config.baseStoragePath, this.config.runId);
    };
    /**
     * Get the storage path for a specific storage type (datasets, request_queues, etc.)
     */
    TemporaryStorageManager.prototype.getStorageTypePath = function (storageType) {
        return (0, path_1.join)(this.getStoragePath(), storageType);
    };
    /**
     * Initialize the temporary storage directory
     */
    TemporaryStorageManager.prototype.initialize = function () {
        var _this = this;
        var storagePath = this.getStoragePath();
        if (!(0, fs_1.existsSync)(storagePath)) {
            (0, fs_1.mkdirSync)(storagePath, { recursive: true });
            console.log("\uD83D\uDDC2\uFE0F  Created temporary storage: ".concat(storagePath));
        }
        // Create subdirectories for different storage types
        var storageTypes = ['datasets', 'request_queues', 'key_value_stores'];
        storageTypes.forEach(function (type) {
            var typePath = _this.getStorageTypePath(type);
            if (!(0, fs_1.existsSync)(typePath)) {
                (0, fs_1.mkdirSync)(typePath, { recursive: true });
            }
        });
    };
    /**
     * Clean up the temporary storage
     */
    TemporaryStorageManager.prototype.cleanup = function (force) {
        if (force === void 0) { force = false; }
        if (this.isCleanedUp && !force) {
            return;
        }
        var storagePath = this.getStoragePath();
        try {
            if ((0, fs_1.existsSync)(storagePath)) {
                (0, fs_1.rmSync)(storagePath, { recursive: true, force: true });
                console.log("\uD83E\uDDF9 Cleaned up temporary storage: ".concat(storagePath));
            }
            this.isCleanedUp = true;
        }
        catch (error) {
            console.warn("\u26A0\uFE0F Failed to clean up temporary storage: ".concat(error instanceof Error ? error.message : String(error)));
        }
    };
    /**
     * Get Crawlee configuration object for this temporary storage
     */
    TemporaryStorageManager.prototype.getCrawleeConfig = function () {
        var storagePath = this.getStoragePath();
        return {
            storageDir: storagePath,
            persistStorage: false, // Don't persist between runs
            purgeOnStart: true // Clear any existing data on start
        };
    };
    /**
     * Add a custom cleanup handler
     */
    TemporaryStorageManager.prototype.addCleanupHandler = function (handler) {
        this.cleanupHandlers.push(handler);
    };
    /**
     * Setup automatic cleanup on process exit
     */
    TemporaryStorageManager.prototype.setupCleanupHandlers = function () {
        var _this = this;
        var cleanupWrapper = function (signal) {
            if (signal) {
                console.log("\n\uD83D\uDCE1 Received ".concat(signal, ", cleaning up temporary storage..."));
            }
            // Run custom cleanup handlers first
            _this.cleanupHandlers.forEach(function (handler) {
                try {
                    handler();
                }
                catch (error) {
                    console.warn("\u26A0\uFE0F Cleanup handler failed: ".concat(error));
                }
            });
            // Clean up storage
            _this.cleanup();
            if (signal) {
                process.exit(0);
            }
        };
        // Handle various exit scenarios
        process.on('exit', function () { return cleanupWrapper(); });
        process.on('SIGINT', function (signal) { return cleanupWrapper(signal); });
        process.on('SIGTERM', function (signal) { return cleanupWrapper(signal); });
        process.on('SIGUSR1', function (signal) { return cleanupWrapper(signal); });
        process.on('SIGUSR2', function (signal) { return cleanupWrapper(signal); });
        // Handle uncaught exceptions
        process.on('uncaughtException', function (error) {
            console.error('💥 Uncaught Exception:', error);
            if (_this.config.retainOnError) {
                console.log("\uD83D\uDCC1 Retaining temporary storage for debugging: ".concat(_this.getStoragePath()));
            }
            else {
                cleanupWrapper();
            }
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', function (reason, promise) {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            if (_this.config.retainOnError) {
                console.log("\uD83D\uDCC1 Retaining temporary storage for debugging: ".concat(_this.getStoragePath()));
            }
            else {
                cleanupWrapper();
            }
            process.exit(1);
        });
    };
    /**
     * Get run information
     */
    TemporaryStorageManager.prototype.getRunInfo = function () {
        return {
            runId: this.config.runId,
            storagePath: this.getStoragePath(),
            isCleanedUp: this.isCleanedUp,
            cleanupOnExit: this.config.cleanupOnExit,
            retainOnError: this.config.retainOnError
        };
    };
    /**
     * Create a child storage manager with a different namespace
     */
    TemporaryStorageManager.prototype.createChild = function (namespace) {
        return new TemporaryStorageManager(__assign(__assign({}, this.config), { runId: "".concat(this.config.runId, "_").concat(namespace), cleanupOnExit: false // Parent handles cleanup
         }));
    };
    return TemporaryStorageManager;
}());
exports.TemporaryStorageManager = TemporaryStorageManager;
