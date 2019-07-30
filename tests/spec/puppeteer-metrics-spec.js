/* Puppeteer tests for the editor metrics. */
const puppeteer = require('puppeteer');

describe("Puppeteer basic tests for the Python Editor.", function() {
    'use strict';

    const editorURL = 'http://localhost:5000/editor.html';
    let metricsUrl = 'https://metrics.microbit.org/pyeditor-';
    let browser = null;

    beforeAll(async () => {
        // Setup a headless Chromium browser.
        // Flags allow Puppeteer to run within a container.
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });
        // Get the editor version to form the metrics URL to intercept
        const page = await browser.newPage();
        await page.goto(editorURL);
        const editorVersion = await page.evaluate('EDITOR_VERSION');
        metricsUrl += editorVersion;
        await page.close();
    });

    afterAll(async () => {
        browser.close();
    });

    /* Helper function to add a request interceptor to check for metric pings. */
    let addRequestIntercept = async (page, metrics) => {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.resourceType().toUpperCase() === 'XHR') {
                // console.warn(request.url());
                for (let metric in metrics) {
                    const thisMetricUrl = metricsUrl + metrics[metric].slug;
                    if ((!metrics[metric].partial && (request.url() === thisMetricUrl)) ||
                        ( metrics[metric].partial && (request.url().lastIndexOf(thisMetricUrl, 0) === 0))) {
                        request.abort();
                        metrics[metric].requested = true;
                        return;
                    }
                }
            }
            request.continue();
        });
    };

    /* Helper function to wait until all metric pings have been requested. */
    let waitForAllRequests = async (page, metrics) => {
        const waitStepMs = 10;
        const waitEndMs = 1000;
        for (let ms = 0; ms < waitEndMs; ms += waitStepMs) {
            let allMetricsRequested = true;
            for (let metric in metrics) {
                if (metrics[metric].requested !== false) {
                    allMetricsRequested = false;
                }
            }
            if (allMetricsRequested) break;
            await page.waitFor(waitStepMs);
        }
    };

    it('Sends a page load metric.', async function() {
        let metrics = {
            pageLoaded: {
                slug: '/page-load',
                partial: false,
                requested: false,
            }
        };
        const page = await browser.newPage();
        await addRequestIntercept(page, metrics);

        await page.goto(editorURL);
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Sends click and program info metrics when the Download is clicked.', async function() {
        let metrics = {
            downloadButton: {
                slug: '/action/download',
                partial: false,
                requested: false,
            },
            codeLines: {
                slug: '/lines/',
                partial: true,
                requested: false,
            },
            hexFiles: {
                slug: '/files/',
                partial: true,
                requested: false,
            }
        };
        const page = await browser.newPage();
        await addRequestIntercept(page, metrics);

        await page.goto(editorURL);
        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Sends line range with default-script value when Download is clicked.', async function() {
        let metrics = {
            codeLines: {
                slug: '/lines/default-script',
                partial: false,
                requested: false,
            },
        };
        const page = await browser.newPage();
        await addRequestIntercept(page, metrics);

        await page.goto(editorURL);
        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Sends line range when script is edited and Download is clicked.', async function() {
        let metrics = {
            codeLines: {
                slug: '/lines/21-50',
                partial: false,
                requested: false,
            },
        };
        const page = await browser.newPage();
        await addRequestIntercept(page, metrics);

        await page.goto(editorURL);
        await page.evaluate('EDITOR.setCode("\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n# code\\n")');
        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });
});
