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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentSelectorManager = void 0;
var google_sr_selectors_1 = require("google-sr-selectors");
// Helper to determine if page is Playwright or Puppeteer
var isPlaywrightPage = function (page) {
    return 'locator' in page;
};
/**
 * Intelligent Selector Manager that automatically generates, validates, and maintains
 * CSS selectors for web scraping with fallback strategies and caching.
 */
var IntelligentSelectorManager = /** @class */ (function () {
    function IntelligentSelectorManager() {
        this.selectorCache = new Map();
        this.CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
        this.MAX_FAILURE_COUNT = 3;
        this.VALIDATION_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
        console.log('🤖 Intelligent Selector Manager initialized');
    }
    /**
     * Main method to get a selector for a specific engine and purpose.
     * Implements intelligent fallback strategy with caching and validation.
     */
    IntelligentSelectorManager.prototype.evaluateOnPage = function (page, pageFunction) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isPlaywrightPage(page)) return [3 /*break*/, 2];
                        return [4 /*yield*/, page.evaluate.apply(page, __spreadArray([pageFunction], args, false))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, page.evaluate.apply(page, __spreadArray([pageFunction], args, false))];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IntelligentSelectorManager.prototype.querySelectorAll = function (page, selector) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isPlaywrightPage(page)) return [3 /*break*/, 2];
                        return [4 /*yield*/, page.locator(selector).all()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, page.$$(selector)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IntelligentSelectorManager.prototype.waitForSelector = function (page_1, selector_1) {
        return __awaiter(this, arguments, void 0, function (page, selector, timeout) {
            var _a;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        if (!isPlaywrightPage(page)) return [3 /*break*/, 2];
                        return [4 /*yield*/, page.waitForSelector(selector, { timeout: timeout })];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, page.waitForSelector(selector, { timeout: timeout })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, true];
                    case 5:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    IntelligentSelectorManager.prototype.getSelector = function (page, engine, purpose) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, _a, intelligentSelector, _b, fallbackSelector, _c, legacySelector, error_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        cacheKey = "".concat(engine, ":").concat(purpose);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 9, , 10]);
                        cached = this.getCachedSelector(cacheKey);
                        _a = cached;
                        if (!_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.validateSelector(page, cached.selector)];
                    case 2:
                        _a = (_d.sent());
                        _d.label = 3;
                    case 3:
                        if (_a) {
                            this.updateSelectorSuccess(cacheKey);
                            return [2 /*return*/, cached.selector];
                        }
                        return [4 /*yield*/, this.generateIntelligentSelector(page, engine, purpose)];
                    case 4:
                        intelligentSelector = _d.sent();
                        _b = intelligentSelector;
                        if (!_b) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.validateSelector(page, intelligentSelector)];
                    case 5:
                        _b = (_d.sent());
                        _d.label = 6;
                    case 6:
                        if (_b) {
                            this.cacheSelector(cacheKey, intelligentSelector);
                            console.log("\u2728 Generated intelligent selector for ".concat(engine, ":").concat(purpose, ": ").concat(intelligentSelector));
                            return [2 /*return*/, intelligentSelector];
                        }
                        fallbackSelector = this.getFallbackSelector(engine, purpose);
                        _c = fallbackSelector;
                        if (!_c) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.validateSelector(page, fallbackSelector)];
                    case 7:
                        _c = (_d.sent());
                        _d.label = 8;
                    case 8:
                        if (_c) {
                            this.cacheSelector(cacheKey, fallbackSelector);
                            console.log("\uD83D\uDD04 Using fallback selector for ".concat(engine, ":").concat(purpose, ": ").concat(fallbackSelector));
                            return [2 /*return*/, fallbackSelector];
                        }
                        legacySelector = this.getLegacySelector(engine, purpose);
                        if (legacySelector) {
                            console.warn("\u26A0\uFE0F Using legacy selector for ".concat(engine, ":").concat(purpose, ": ").concat(legacySelector));
                            return [2 /*return*/, legacySelector];
                        }
                        throw new Error("No valid selector found for ".concat(engine, ":").concat(purpose));
                    case 9:
                        error_1 = _d.sent();
                        this.updateSelectorFailure(cacheKey);
                        console.error("\u274C Selector generation failed for ".concat(engine, ":").concat(purpose, ":"), error_1);
                        // Return a basic fallback
                        return [2 /*return*/, this.getBasicFallback(purpose)];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate an intelligent selector using css-selector-generator
     */
    IntelligentSelectorManager.prototype.generateIntelligentSelector = function (page, engine, purpose) {
        return __awaiter(this, void 0, void 0, function () {
            var elements, selector, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.findTargetElements(page, engine, purpose)];
                    case 1:
                        elements = _a.sent();
                        if (elements.length === 0) {
                            console.log("\uD83D\uDD0D No target elements found for ".concat(engine, ":").concat(purpose));
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.evaluateOnPage(page, function (elementIndex, selectorOptions) {
                                var targetElements = document.querySelectorAll('*');
                                var element = targetElements[elementIndex];
                                if (!element)
                                    return null;
                                // Create a basic intelligent selector based on element properties
                                if (!element)
                                    return null;
                                // Prioritize by ID, then class, then tag
                                if (element.id && !element.id.match(/random|dynamic|temp/)) {
                                    return "#".concat(element.id);
                                }
                                if (element.className && typeof element.className === 'string') {
                                    var classes = element.className.split(' ')
                                        .filter(function (cls) { return cls && !cls.match(/dynamic|temp|random/); })
                                        .slice(0, 2); // Use max 2 classes
                                    if (classes.length > 0) {
                                        return ".".concat(classes.join('.'));
                                    }
                                }
                                return element.tagName.toLowerCase();
                            }, 0, this.getSelectorOptions(engine))];
                    case 2:
                        selector = _a.sent();
                        return [2 /*return*/, selector];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error generating intelligent selector:', error_2);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find target elements based on engine and purpose
     */
    IntelligentSelectorManager.prototype.findTargetElements = function (page, engine, purpose) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.evaluateOnPage(page, function (engine, purpose) {
                            var elements = [];
                            // Engine-specific element detection logic
                            switch (engine) {
                                case 'google':
                                    if (purpose === 'search-results') {
                                        // Look for Google result containers
                                        var googleSelectors = ['.g', '.tF2Cxc', '.rc', '#search .g', '.MjjYud'];
                                        for (var _i = 0, googleSelectors_1 = googleSelectors; _i < googleSelectors_1.length; _i++) {
                                            var selector = googleSelectors_1[_i];
                                            var found = document.querySelectorAll(selector);
                                            if (found.length > 0) {
                                                elements.push.apply(elements, Array.from(found));
                                                break;
                                            }
                                        }
                                    }
                                    break;
                                case 'duckduckgo':
                                    if (purpose === 'search-results') {
                                        var ddgSelectors = ['.results .result', '.result', '.web-result', '[data-testid="result"]'];
                                        for (var _a = 0, ddgSelectors_1 = ddgSelectors; _a < ddgSelectors_1.length; _a++) {
                                            var selector = ddgSelectors_1[_a];
                                            var found = document.querySelectorAll(selector);
                                            if (found.length > 0) {
                                                elements.push.apply(elements, Array.from(found));
                                                break;
                                            }
                                        }
                                    }
                                    break;
                                case 'bing':
                                    if (purpose === 'search-results') {
                                        var bingSelectors = ['.b_algo', '.b_searchResult', '.b_ans'];
                                        for (var _b = 0, bingSelectors_1 = bingSelectors; _b < bingSelectors_1.length; _b++) {
                                            var selector = bingSelectors_1[_b];
                                            var found = document.querySelectorAll(selector);
                                            if (found.length > 0) {
                                                elements.push.apply(elements, Array.from(found));
                                                break;
                                            }
                                        }
                                    }
                                    break;
                            }
                            return elements.map(function (el, index) { return ({ index: index, tagName: el.tagName, className: el.className }); });
                        }, engine, purpose)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Get selector generation options based on engine
     */
    IntelligentSelectorManager.prototype.getSelectorOptions = function (engine) {
        var baseOptions = {
            selectors: ['class', 'id', 'tag', 'attribute'],
            combineWithinSelector: true,
            combineBetweenSelectors: true,
            maxCombinations: 50,
            maxCandidates: 25,
        };
        // Engine-specific blacklists
        var engineBlacklists = {
            google: [
                '.dynamic-*',
                '[data-ved]',
                '[data-hveid]',
                '*[id*="random"]',
                '.g-*',
                '*[style*="display:none"]'
            ],
            duckduckgo: [
                '.dynamic-*',
                '[data-*]',
                '*[id*="random"]'
            ],
            bing: [
                '.dynamic-*',
                '[data-*]',
                '*[id*="random"]',
                '.b-*'
            ]
        };
        return __assign(__assign({}, baseOptions), { blacklist: engineBlacklists[engine] || engineBlacklists.google });
    };
    /**
     * Get fallback selector from maintained libraries
     */
    IntelligentSelectorManager.prototype.getFallbackSelector = function (engine, purpose) {
        if (engine === 'google') {
            switch (purpose) {
                case 'search-results':
                    return google_sr_selectors_1.GeneralSelector.block;
                case 'result-title':
                    return google_sr_selectors_1.OrganicSearchSelector.title;
                case 'result-link':
                    return google_sr_selectors_1.OrganicSearchSelector.link;
                case 'result-description':
                    return google_sr_selectors_1.OrganicSearchSelector.description;
                default:
                    return null;
            }
        }
        return null;
    };
    /**
     * Get legacy hardcoded selectors as last resort
     */
    IntelligentSelectorManager.prototype.getLegacySelector = function (engine, purpose) {
        var _a;
        var legacySelectors = {
            google: {
                'search-results': '.g, .tF2Cxc, .rc, #search .g',
                'result-title': 'h3, .r a h3, .LC20lb',
                'result-link': '.r a, .yuRUbf a',
                'result-description': '.st, .VwiC3b',
                'result-snippet': '.st, .VwiC3b'
            },
            duckduckgo: {
                'search-results': '.results .result, .result, .web-result',
                'result-title': '.result__title a, .result__a',
                'result-link': '.result__title a, .result__a',
                'result-description': '.result__snippet',
                'result-snippet': '.result__snippet'
            },
            bing: {
                'search-results': '.b_algo, .b_searchResult, .b_ans',
                'result-title': '.b_title a, h2 a',
                'result-link': '.b_title a, h2 a',
                'result-description': '.b_caption, .b_snippet',
                'result-snippet': '.b_caption, .b_snippet'
            }
        };
        return ((_a = legacySelectors[engine]) === null || _a === void 0 ? void 0 : _a[purpose]) || null;
    };
    /**
     * Basic fallback for when everything else fails
     */
    IntelligentSelectorManager.prototype.getBasicFallback = function (purpose) {
        var basicFallbacks = {
            'search-results': 'div, article, section',
            'result-title': 'h1, h2, h3, a',
            'result-link': 'a[href]',
            'result-description': 'p, span, div',
            'result-snippet': 'p, span, div'
        };
        return basicFallbacks[purpose];
    };
    /**
     * Validate if a selector works on the current page
     */
    IntelligentSelectorManager.prototype.validateSelector = function (page, selector) {
        return __awaiter(this, void 0, void 0, function () {
            var elements, isValid, hasContent, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.querySelectorAll(page, selector)];
                    case 1:
                        elements = _b.sent();
                        isValid = elements.length > 0;
                        if (!isValid) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.evaluateOnPage(page, function (sel) {
                                var elements = document.querySelectorAll(sel);
                                return Array.from(elements).some(function (el) {
                                    return el.textContent && el.textContent.trim().length > 0;
                                });
                            }, selector)];
                    case 2:
                        hasContent = _b.sent();
                        return [2 /*return*/, hasContent];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cache management methods
     */
    IntelligentSelectorManager.prototype.getCachedSelector = function (cacheKey) {
        var cached = this.selectorCache.get(cacheKey);
        if (!cached)
            return null;
        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.CACHE_EXPIRY_MS) {
            this.selectorCache.delete(cacheKey);
            return null;
        }
        // Check if selector has too many failures
        if (cached.failureCount >= this.MAX_FAILURE_COUNT) {
            this.selectorCache.delete(cacheKey);
            return null;
        }
        return cached;
    };
    IntelligentSelectorManager.prototype.cacheSelector = function (cacheKey, selector) {
        this.selectorCache.set(cacheKey, {
            selector: selector,
            timestamp: Date.now(),
            successCount: 1,
            failureCount: 0,
            lastValidated: Date.now()
        });
    };
    IntelligentSelectorManager.prototype.updateSelectorSuccess = function (cacheKey) {
        var cached = this.selectorCache.get(cacheKey);
        if (cached) {
            cached.successCount++;
            cached.lastValidated = Date.now();
            cached.failureCount = Math.max(0, cached.failureCount - 1); // Reduce failure count on success
        }
    };
    IntelligentSelectorManager.prototype.updateSelectorFailure = function (cacheKey) {
        var cached = this.selectorCache.get(cacheKey);
        if (cached) {
            cached.failureCount++;
        }
    };
    /**
     * Regenerate selector when current one fails
     */
    IntelligentSelectorManager.prototype.regenerateSelector = function (page, engine, purpose) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey;
            return __generator(this, function (_a) {
                cacheKey = "".concat(engine, ":").concat(purpose);
                this.selectorCache.delete(cacheKey);
                console.log("\uD83D\uDD04 Regenerating selector for ".concat(cacheKey));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get cache statistics for monitoring
     */
    IntelligentSelectorManager.prototype.getCacheStats = function () {
        var successful = 0;
        var failed = 0;
        for (var _i = 0, _a = this.selectorCache; _i < _a.length; _i++) {
            var _b = _a[_i], cache = _b[1];
            if (cache.successCount > cache.failureCount) {
                successful++;
            }
            else {
                failed++;
            }
        }
        return {
            total: this.selectorCache.size,
            successful: successful,
            failed: failed
        };
    };
    return IntelligentSelectorManager;
}());
exports.IntelligentSelectorManager = IntelligentSelectorManager;
