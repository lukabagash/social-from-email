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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawleeSearchEngine = void 0;
var crawlee_1 = require("crawlee");
var cheerio = require("cheerio");
var temporary_storage_1 = require("../utils/temporary-storage");
var intelligent_selector_manager_1 = require("../selector-automation/intelligent-selector-manager");
var CrawleeSearchEngine = /** @class */ (function () {
    function CrawleeSearchEngine(options) {
        if (options === void 0) { options = {}; }
        this.searchResults = [];
        this.options = __assign({ maxResultsPerEngine: 10, searchEngines: ['duckduckgo', 'google', 'bing'], maxConcurrency: 3, requestTimeout: 30, retries: 2, enableJavaScript: true, blockResources: ['font', 'texttrack', 'object', 'beacon', 'csp_report'], waitForNetworkIdle: true, useTemporaryStorage: true, retainStorageOnError: false, useIntelligentSelectors: true, selectorCacheEnabled: true }, options);
        // Initialize intelligent selector manager
        this.selectorManager = new intelligent_selector_manager_1.IntelligentSelectorManager();
        // Initialize temporary storage if enabled
        if (this.options.useTemporaryStorage) {
            this.storageManager = new temporary_storage_1.TemporaryStorageManager({
                cleanupOnExit: true,
                retainOnError: this.options.retainStorageOnError || false
            });
            if (this.options.storageNamespace) {
                this.storageManager = this.storageManager.createChild(this.options.storageNamespace);
            }
        }
    }
    CrawleeSearchEngine.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var runInfo, crawleeConfig, _a, _b, runInfo;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log('🔍 Initializing Crawlee Search Engine...');
                        // Initialize temporary storage if enabled
                        if (this.storageManager) {
                            this.storageManager.initialize();
                            runInfo = this.storageManager.getRunInfo();
                            console.log("\uD83D\uDDC2\uFE0F  Using temporary search storage: ".concat(runInfo.runId));
                            crawleeConfig = this.storageManager.getCrawleeConfig();
                            crawlee_1.Configuration.getGlobalConfig().set('storageClientOptions', {
                                storageDir: crawleeConfig.storageDir
                            });
                            crawlee_1.Configuration.getGlobalConfig().set('persistStorage', crawleeConfig.persistStorage);
                            crawlee_1.Configuration.getGlobalConfig().set('purgeOnStart', crawleeConfig.purgeOnStart);
                        }
                        _a = this;
                        return [4 /*yield*/, crawlee_1.RequestQueue.open()];
                    case 1:
                        _a.requestQueue = _c.sent();
                        _b = this;
                        return [4 /*yield*/, crawlee_1.Dataset.open()];
                    case 2:
                        _b.dataset = _c.sent();
                        this.crawler = new crawlee_1.PlaywrightCrawler({
                            requestQueue: this.requestQueue,
                            maxConcurrency: this.options.maxConcurrency,
                            requestHandlerTimeoutSecs: this.options.requestTimeout,
                            maxRequestRetries: this.options.retries,
                            useSessionPool: true,
                            persistCookiesPerSession: false,
                            launchContext: {
                                launchOptions: {
                                    headless: true,
                                    args: [
                                        '--no-sandbox',
                                        '--disable-setuid-sandbox',
                                        '--disable-dev-shm-usage',
                                        '--disable-accelerated-2d-canvas',
                                        '--disable-gpu',
                                        '--disable-web-security',
                                        '--disable-blink-features=AutomationControlled',
                                        '--disable-features=VizDisplayCompositor'
                                    ]
                                }
                            },
                            preNavigationHooks: [
                                function (crawlingContext) { return __awaiter(_this, void 0, void 0, function () {
                                    var page, userAgents, randomUserAgent;
                                    var _this = this;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                page = crawlingContext.page;
                                                if (!(this.options.blockResources && this.options.blockResources.length > 0)) return [3 /*break*/, 2];
                                                return [4 /*yield*/, page.route('**/*', function (route) {
                                                        var resourceType = route.request().resourceType();
                                                        if (_this.options.blockResources.includes(resourceType)) {
                                                            route.abort();
                                                        }
                                                        else {
                                                            route.continue();
                                                        }
                                                    })];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2:
                                                userAgents = [
                                                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
                                                ];
                                                randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
                                                return [4 /*yield*/, page.setExtraHTTPHeaders({ 'User-Agent': randomUserAgent })];
                                            case 3:
                                                _a.sent();
                                                // Set viewport to common size
                                                return [4 /*yield*/, page.setViewportSize({ width: 1920, height: 1080 })];
                                            case 4:
                                                // Set viewport to common size
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }
                            ],
                            requestHandler: function (crawlingContext) { return __awaiter(_this, void 0, void 0, function () {
                                var page, request;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            page = crawlingContext.page, request = crawlingContext.request;
                                            return [4 /*yield*/, this.handleSearchRequest(page, request)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            failedRequestHandler: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var request = _b.request, error = _b.error;
                                return __generator(this, function (_c) {
                                    console.log("\u274C Failed to process search for ".concat(request.url, ": ").concat(error instanceof Error ? error.message : String(error)));
                                    return [2 /*return*/];
                                });
                            }); }
                        });
                        console.log('✅ Crawlee Search Engine initialized');
                        if (this.storageManager) {
                            runInfo = this.storageManager.getRunInfo();
                            console.log("\uD83D\uDCC1 Search storage location: ".concat(runInfo.storagePath));
                            console.log("\uD83E\uDDF9 Auto-cleanup: ".concat(runInfo.cleanupOnExit ? 'Enabled' : 'Disabled'));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    CrawleeSearchEngine.prototype.searchMultipleQueries = function (queries) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _i, queries_1, query, _b, _c, engine, searchUrl, uniqueResults;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log("\uD83D\uDD0D Starting multi-engine search for ".concat(queries.length, " queries..."));
                        this.searchResults = [];
                        // Clear previous data
                        return [4 /*yield*/, ((_d = this.dataset) === null || _d === void 0 ? void 0 : _d.drop())];
                    case 1:
                        // Clear previous data
                        _f.sent();
                        _a = this;
                        return [4 /*yield*/, crawlee_1.Dataset.open()];
                    case 2:
                        _a.dataset = _f.sent();
                        _i = 0, queries_1 = queries;
                        _f.label = 3;
                    case 3:
                        if (!(_i < queries_1.length)) return [3 /*break*/, 8];
                        query = queries_1[_i];
                        _b = 0, _c = this.options.searchEngines || ['duckduckgo'];
                        _f.label = 4;
                    case 4:
                        if (!(_b < _c.length)) return [3 /*break*/, 7];
                        engine = _c[_b];
                        searchUrl = this.buildSearchUrl(query, engine);
                        return [4 /*yield*/, ((_e = this.requestQueue) === null || _e === void 0 ? void 0 : _e.addRequest({
                                url: searchUrl,
                                userData: {
                                    query: query,
                                    engine: engine,
                                    isSearchPage: true,
                                    timestamp: new Date().toISOString()
                                }
                            }))];
                    case 5:
                        _f.sent();
                        _f.label = 6;
                    case 6:
                        _b++;
                        return [3 /*break*/, 4];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        if (!this.crawler) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.crawler.run()];
                    case 9:
                        _f.sent();
                        _f.label = 10;
                    case 10:
                        uniqueResults = this.removeDuplicateUrls(this.searchResults);
                        console.log("\u2705 Search completed! Found ".concat(uniqueResults.length, " unique results from ").concat(this.searchResults.length, " total results"));
                        return [2 /*return*/, uniqueResults];
                }
            });
        });
    };
    CrawleeSearchEngine.prototype.buildSearchUrl = function (query, engine) {
        var encodedQuery = encodeURIComponent(query);
        switch (engine) {
            case 'duckduckgo':
                return "https://duckduckgo.com/?q=".concat(encodedQuery, "&t=h_&ia=web");
            case 'google':
                return "https://www.google.com/search?q=".concat(encodedQuery, "&num=").concat(this.options.maxResultsPerEngine);
            case 'bing':
                return "https://www.bing.com/search?q=".concat(encodedQuery, "&count=").concat(this.options.maxResultsPerEngine);
            default:
                throw new Error("Unsupported search engine: ".concat(engine));
        }
    };
    CrawleeSearchEngine.prototype.handleSearchRequest = function (page, request) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, query, engine, timestamp, startTime, results, _i, results_1, result, loadTime, error_1;
            var _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = request.userData, query = _a.query, engine = _a.engine, timestamp = _a.timestamp;
                        startTime = Date.now();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 10, , 11]);
                        if (!this.options.waitForNetworkIdle) return [3 /*break*/, 3];
                        return [4 /*yield*/, page.waitForLoadState('networkidle', { timeout: 15000 })];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3: 
                    // Wait for search results to appear
                    return [4 /*yield*/, this.waitForSearchResults(page, engine)];
                    case 4:
                        // Wait for search results to appear
                        _d.sent();
                        return [4 /*yield*/, this.extractSearchResults(page, engine, query, timestamp)];
                    case 5:
                        results = _d.sent();
                        // Store results
                        (_b = this.searchResults).push.apply(_b, results);
                        _i = 0, results_1 = results;
                        _d.label = 6;
                    case 6:
                        if (!(_i < results_1.length)) return [3 /*break*/, 9];
                        result = results_1[_i];
                        return [4 /*yield*/, ((_c = this.dataset) === null || _c === void 0 ? void 0 : _c.pushData(result))];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9:
                        loadTime = Date.now() - startTime;
                        console.log("\u2705 Extracted ".concat(results.length, " results from ").concat(engine, " for \"").concat(query, "\" (").concat(loadTime, "ms)"));
                        return [3 /*break*/, 11];
                    case 10:
                        error_1 = _d.sent();
                        console.log("\u274C Error processing search ".concat(engine, " for \"").concat(query, "\": ").concat(error_1));
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    CrawleeSearchEngine.prototype.waitForSearchResults = function (page, engine) {
        return __awaiter(this, void 0, void 0, function () {
            var selectors, selectorList, _i, selectorList_1, selector, error_2, pageText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        selectors = {
                            duckduckgo: ['.results .result', '.result', '.web-result', '[data-testid="result"]'],
                            google: ['#search .g', '.g', '.MjjYud', '.hlcw0c'],
                            bing: ['.b_algo', '.algo', '.b_searchResult']
                        };
                        selectorList = selectors[engine] || [];
                        _i = 0, selectorList_1 = selectorList;
                        _a.label = 1;
                    case 1:
                        if (!(_i < selectorList_1.length)) return [3 /*break*/, 6];
                        selector = selectorList_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, page.waitForSelector(selector, { timeout: 5000 })];
                    case 3:
                        _a.sent();
                        console.log("\u2705 Found ".concat(engine, " results with selector: ").concat(selector));
                        return [2 /*return*/]; // Success, exit early
                    case 4:
                        error_2 = _a.sent();
                        console.log("\u26A0\uFE0F Selector ".concat(selector, " not found for ").concat(engine, ", trying next..."));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        // If no selectors worked, log the page content for debugging
                        console.log("\u26A0\uFE0F No result selectors worked for ".concat(engine, ", checking page content..."));
                        return [4 /*yield*/, page.textContent('body')];
                    case 7:
                        pageText = (_a.sent()) || '';
                        if (pageText.length > 100) {
                            console.log("\u2705 Page loaded for ".concat(engine, " (").concat(pageText.length, " characters), extracting with fallback method"));
                        }
                        else {
                            console.log("\u274C Page appears empty for ".concat(engine));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    CrawleeSearchEngine.prototype.extractSearchResults = function (page, engine, query, timestamp) {
        return __awaiter(this, void 0, void 0, function () {
            var results, searchEngine, resultSelector, titleSelector, linkSelector, descriptionSelector, extractedData, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.options.useIntelligentSelectors) {
                            // Fallback to original extraction method
                            return [2 /*return*/, this.extractSearchResultsLegacy(page, engine, query, timestamp)];
                        }
                        results = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        searchEngine = engine;
                        return [4 /*yield*/, this.selectorManager.getSelector(page, searchEngine, 'search-results')];
                    case 2:
                        resultSelector = _a.sent();
                        return [4 /*yield*/, this.selectorManager.getSelector(page, searchEngine, 'result-title')];
                    case 3:
                        titleSelector = _a.sent();
                        return [4 /*yield*/, this.selectorManager.getSelector(page, searchEngine, 'result-link')];
                    case 4:
                        linkSelector = _a.sent();
                        return [4 /*yield*/, this.selectorManager.getSelector(page, searchEngine, 'result-description')];
                    case 5:
                        descriptionSelector = _a.sent();
                        console.log("\uD83C\uDFAF Using intelligent selectors for ".concat(engine, ": ").concat(resultSelector));
                        return [4 /*yield*/, page.evaluate(function (_a) {
                                var resultSel = _a.resultSel, titleSel = _a.titleSel, linkSel = _a.linkSel, descSel = _a.descSel, query = _a.query, engine = _a.engine, timestamp = _a.timestamp;
                                var results = [];
                                var resultElements = document.querySelectorAll(resultSel);
                                resultElements.forEach(function (element, index) {
                                    var _a, _b;
                                    try {
                                        // Extract title
                                        var title = '';
                                        var titleEl = element.querySelector(titleSel);
                                        if (titleEl) {
                                            title = ((_a = titleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                                        }
                                        // Extract link
                                        var url = '';
                                        var linkEl = element.querySelector(linkSel) || element.querySelector('a[href]');
                                        if (linkEl) {
                                            url = linkEl.getAttribute('href') || '';
                                        }
                                        // Extract description
                                        var snippet = '';
                                        var descEl = element.querySelector(descSel);
                                        if (descEl) {
                                            snippet = ((_b = descEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                                        }
                                        // Validate and clean data
                                        if (title && url && !url.startsWith('/') && !url.includes("".concat(engine, ".com"))) {
                                            try {
                                                var urlObj = new URL(url.startsWith('http') ? url : "https://".concat(url));
                                                results.push({
                                                    title: title,
                                                    url: urlObj.href,
                                                    snippet: snippet,
                                                    domain: urlObj.hostname,
                                                    searchEngine: engine,
                                                    query: query,
                                                    rank: index + 1,
                                                    timestamp: timestamp,
                                                    metadata: {
                                                        hasRichSnippet: element.querySelector('.rich-snippet, .enhanced-snippet') !== null,
                                                        hasImage: element.querySelector('img') !== null,
                                                        isAd: element.classList.contains('ad') || element.querySelector('.ad-indicator') !== null,
                                                        estimatedLoadTime: 0,
                                                        selectorUsed: resultSel,
                                                        selectorType: 'intelligent'
                                                    }
                                                });
                                            }
                                            catch (urlError) {
                                                console.warn('Invalid URL found:', url);
                                            }
                                        }
                                    }
                                    catch (error) {
                                        console.warn('Error extracting result:', error);
                                    }
                                });
                                return results;
                            }, {
                                resultSel: resultSelector,
                                titleSel: titleSelector,
                                linkSel: linkSelector,
                                descSel: descriptionSelector,
                                query: query,
                                engine: engine,
                                timestamp: timestamp
                            })];
                    case 6:
                        extractedData = _a.sent();
                        results.push.apply(results, extractedData.slice(0, this.options.maxResultsPerEngine));
                        if (results.length === 0) {
                            console.warn("\u26A0\uFE0F No results found with intelligent selectors for ".concat(engine, ", trying fallback..."));
                            return [2 /*return*/, this.extractSearchResultsLegacy(page, engine, query, timestamp)];
                        }
                        console.log("\u2728 Successfully extracted ".concat(results.length, " results using intelligent selectors"));
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        console.error("\u274C Error with intelligent selectors for ".concat(engine, ":"), error_3);
                        console.log("\uD83D\uDD04 Falling back to legacy extraction...");
                        return [2 /*return*/, this.extractSearchResultsLegacy(page, engine, query, timestamp)];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CrawleeSearchEngine.prototype.extractSearchResultsLegacy = function (page, engine, query, timestamp) {
        return __awaiter(this, void 0, void 0, function () {
            var content, $, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, page.content()];
                    case 1:
                        content = _a.sent();
                        $ = cheerio.load(content);
                        results = [];
                        switch (engine) {
                            case 'duckduckgo':
                                results.push.apply(results, this.extractDuckDuckGoResults($, query, timestamp));
                                break;
                            case 'google':
                                results.push.apply(results, this.extractGoogleResults($, query, timestamp));
                                break;
                            case 'bing':
                                results.push.apply(results, this.extractBingResults($, query, timestamp));
                                break;
                        }
                        // Mark as legacy extraction
                        results.forEach(function (result) {
                            result.metadata.selectorType = 'legacy';
                        });
                        return [2 /*return*/, results.slice(0, this.options.maxResultsPerEngine)];
                }
            });
        });
    };
    CrawleeSearchEngine.prototype.extractDuckDuckGoResults = function ($, query, timestamp) {
        var results = [];
        // Try multiple selectors for DuckDuckGo results
        var selectors = [
            '.results .result',
            '.result',
            '.web-result',
            '[data-testid="result"]',
            '.links_main'
        ];
        for (var _i = 0, selectors_1 = selectors; _i < selectors_1.length; _i++) {
            var selector = selectors_1[_i];
            $(selector).each(function (index, element) {
                var $el = $(element);
                // Try different title selectors
                var titleEl = $el.find('.result__title a');
                if (!titleEl.length)
                    titleEl = $el.find('h2 a');
                if (!titleEl.length)
                    titleEl = $el.find('h3 a');
                if (!titleEl.length)
                    titleEl = $el.find('a[href]').first();
                // Try different snippet selectors
                var snippetEl = $el.find('.result__snippet');
                if (!snippetEl.length)
                    snippetEl = $el.find('.result__meta');
                if (!snippetEl.length)
                    snippetEl = $el.find('.snippet');
                var title = titleEl.text().trim();
                var url = titleEl.attr('href');
                var snippet = snippetEl.text().trim();
                if (title && url && !url.startsWith('/') && !url.includes('duckduckgo.com')) {
                    try {
                        var urlObj = new URL(url);
                        results.push({
                            title: title,
                            url: url,
                            snippet: snippet,
                            domain: urlObj.hostname,
                            searchEngine: 'duckduckgo',
                            query: query,
                            rank: index + 1,
                            timestamp: timestamp,
                            metadata: {
                                hasRichSnippet: snippetEl.find('.result__meta').length > 0,
                                hasImage: $el.find('.result__image').length > 0,
                                isAd: $el.hasClass('result--ad'),
                                estimatedLoadTime: 0
                            }
                        });
                    }
                    catch (error) {
                        console.log("\u26A0\uFE0F Invalid URL from DuckDuckGo: ".concat(url));
                    }
                }
            });
            if (results.length > 0) {
                console.log("\u2705 Extracted ".concat(results.length, " DuckDuckGo results using selector: ").concat(selector));
                break; // Success, no need to try other selectors
            }
        }
        return results;
    };
    CrawleeSearchEngine.prototype.extractGoogleResults = function ($, query, timestamp) {
        var results = [];
        // Try multiple selectors for Google results
        var selectors = [
            '#search .g',
            '.g',
            '.MjjYud',
            '.hlcw0c',
            '.tF2Cxc'
        ];
        for (var _i = 0, selectors_2 = selectors; _i < selectors_2.length; _i++) {
            var selector = selectors_2[_i];
            $(selector).each(function (index, element) {
                var $el = $(element);
                // Try different title and link selectors
                var titleEl = $el.find('h3').first();
                var linkEl = $el.find('a[href]').first();
                // Alternative selectors
                if (!titleEl.length || !linkEl.length) {
                    titleEl = $el.find('.LC20lb, .DKV0Md');
                    linkEl = $el.find('a[href]').first();
                }
                // Try different snippet selectors
                var snippetEl = $el.find('.VwiC3b, .yXK7lf, .hgKElc, .s3v9rd, .st');
                var title = titleEl.text().trim();
                var url = linkEl.attr('href');
                var snippet = snippetEl.text().trim();
                if (title && url && !url.startsWith('/') && !url.includes('google.com') && !url.startsWith('#')) {
                    try {
                        var urlObj = new URL(url);
                        results.push({
                            title: title,
                            url: url,
                            snippet: snippet,
                            domain: urlObj.hostname,
                            searchEngine: 'google',
                            query: query,
                            rank: index + 1,
                            timestamp: timestamp,
                            metadata: {
                                hasRichSnippet: $el.find('.kp-blk').length > 0,
                                hasImage: $el.find('img').length > 0,
                                isAd: $el.find('.ads-ad').length > 0,
                                estimatedLoadTime: 0
                            }
                        });
                    }
                    catch (error) {
                        console.log("\u26A0\uFE0F Invalid URL from Google: ".concat(url));
                    }
                }
            });
            if (results.length > 0) {
                console.log("\u2705 Extracted ".concat(results.length, " Google results using selector: ").concat(selector));
                break; // Success, no need to try other selectors
            }
        }
        return results;
    };
    CrawleeSearchEngine.prototype.extractBingResults = function ($, query, timestamp) {
        var results = [];
        $('.b_algo').each(function (index, element) {
            var $el = $(element);
            var titleEl = $el.find('h2 a');
            var snippetEl = $el.find('.b_caption p');
            var title = titleEl.text().trim();
            var url = titleEl.attr('href');
            var snippet = snippetEl.text().trim();
            if (title && url && !url.startsWith('/')) {
                try {
                    var urlObj = new URL(url);
                    results.push({
                        title: title,
                        url: url,
                        snippet: snippet,
                        domain: urlObj.hostname,
                        searchEngine: 'bing',
                        query: query,
                        rank: index + 1,
                        timestamp: timestamp,
                        metadata: {
                            hasRichSnippet: $el.find('.b_rich').length > 0,
                            hasImage: $el.find('.cico').length > 0,
                            isAd: $el.find('.b_ad').length > 0,
                            estimatedLoadTime: 0
                        }
                    });
                }
                catch (error) {
                    console.log("\u26A0\uFE0F Invalid URL from Bing: ".concat(url));
                }
            }
        });
        return results;
    };
    CrawleeSearchEngine.prototype.removeDuplicateUrls = function (results) {
        var seen = new Set();
        return results.filter(function (result) {
            if (seen.has(result.url)) {
                return false;
            }
            seen.add(result.url);
            return true;
        });
    };
    CrawleeSearchEngine.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔄 Closing Crawlee Search Engine...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        if (!this.crawler) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.crawler.teardown()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        console.log('✅ Crawlee Search Engine closed successfully');
                        // Clean up temporary storage if enabled
                        if (this.storageManager) {
                            this.storageManager.cleanup();
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        console.log("\u274C Error closing Crawlee Search Engine: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                        // Still try to clean up storage even if crawler teardown failed
                        if (this.storageManager) {
                            this.storageManager.cleanup();
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get storage manager for advanced control
     */
    CrawleeSearchEngine.prototype.getStorageManager = function () {
        return this.storageManager;
    };
    /**
     * Get intelligent selector performance statistics
     */
    CrawleeSearchEngine.prototype.getSelectorStats = function () {
        return this.selectorManager.getCacheStats();
    };
    /**
     * Clear selector cache (useful for testing)
     */
    CrawleeSearchEngine.prototype.clearSelectorCache = function () {
        // Clear the cache by creating a new instance
        this.selectorManager = new intelligent_selector_manager_1.IntelligentSelectorManager();
    };
    return CrawleeSearchEngine;
}());
exports.CrawleeSearchEngine = CrawleeSearchEngine;
