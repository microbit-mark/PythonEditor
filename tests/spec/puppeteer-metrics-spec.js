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

    let preparePageForMetrics = async (metrics) => {
        const page = await browser.newPage();
        await addRequestIntercept(page, metrics);
        await page.goto(editorURL);
        return page;
    };

    /* Helper function to wait until all metric pings have been requested. */
    let waitForAllRequests = async (page, metrics) => {
        const waitStepMs = 10;
        const waitEndMs = 3000;
        for (let ms = 0; ms < waitEndMs; ms += waitStepMs) {
            let allMetricsRequested = true;
            for (let metric in metrics) {
                if (metrics[metric].requested === false) {
                    allMetricsRequested = false;
                }
            }
            if (allMetricsRequested) break;
            await page.waitFor(waitStepMs);
        }
    };

    it('Page load and viewport width.', async function() {
        let metrics = {
            pageLoaded: {
                slug: '/page-load',
                partial: false,
                requested: false,
            },
            viewport: {
                slug: '/width/',
                partial: true,
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

    it('Click Download button: Click, lines and files sent.', async function() {
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
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Detect default-script.', async function() {
        let metrics = {
            codeLines: {
                slug: '/lines/default-script',
                partial: false,
                requested: false,
            },
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Number of lines.', async function() {
        let metrics = {
            codeLines: {
                slug: '/lines/21-50',
                partial: false,
                requested: false,
            },
        };
        const page = await preparePageForMetrics(metrics);

        await page.evaluate('EDITOR.setCode("\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n# code\\n")');
        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Number of files.', async function() {
        let metrics = {
            hexFiles: {
                slug: '/files/2',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click("#command-files");
        const fileInput = await page.$("#fs-file-upload-input");
        await fileInput.uploadFile("./spec/test-files/samplefile.py");
        await page.evaluate("$('div.vex-close').click()");
        await page.waitForSelector('#load-drag-target', { hidden: true });
        await page.click('#command-download');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Connect button.', async function() {
        let metrics = {
            connectButton: {
                slug: '/action/connect',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-connect');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Load/Save button.', async function() {
        let metrics = {
            loadSaveButton: {
                slug: '/action/files',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    // TODO: Drag and drop Python file to the load modal
    // TODO: Drag and drop Hex file to the load modal
    // TODO: Drag and drop invalid file to the load modal

    it('Load/Save modal: Click Save Python button.', async function() {
        let metrics = {
            savePyButton: {
                slug: '/action/save-py',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#load-drag-target', { visible: true });
        await page.click('#save-py');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click Save Hex button.', async function() {
        let metrics = {
            saveHexButton: {
                slug: '/action/save-hex',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#load-drag-target', { visible: true });
        await page.click('#save-hex');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click file upload link and upload Python file.', async function() {
        let metrics = {
            fileUploadLink: {
                slug: '/action/file-upload-link',
                partial: false,
                requested: false,
            },
            fileUploadPy: {
                slug: '/file-upload/py',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#file-upload-link', { visible: true });
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#file-upload-link')
        ]);
        await fileChooser.cancel();
        const fileInput = await page.$("#file-upload-input");
        await fileInput.uploadFile("./spec/test-files/samplefile.py");
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click file upload link and upload Hex file.', async function() {
        let metrics = {
            fileUploadLink: {
                slug: '/action/file-upload-link',
                partial: false,
                requested: false,
            },
            fileUploadPy: {
                slug: '/file-upload/hex',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#file-upload-link', { visible: true });
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#file-upload-link')
        ]);
        await fileChooser.cancel();
        const fileInput = await page.$("#file-upload-input");
        await fileInput.uploadFile("./spec/test-files/1.0.1.hex");
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click file upload link and upload invalid file.', async function() {
        let metrics = {
            fileUploadLink: {
                slug: '/action/file-upload-link',
                partial: false,
                requested: false,
            },
            fileUploadPy: {
                slug: '/file-upload/error/invalid',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#file-upload-link', { visible: true });
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#file-upload-link')
        ]);
        await fileChooser.cancel();
        const fileInput = await page.$("#file-upload-input");
        await fileInput.uploadFile("./spec/test-files/invalid.txt");
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Upload file to filesystem, download fs file, and delete fs file.', async function() {
        let metrics = {
            showHideFilesButton: { slug: '/action/hide-files', partial: false, requested: false },
            fsFileUploadButton:  { slug: '/action/fs-file-upload-button', partial: false, requested: false },
            fsFileSaveButton:    { slug: '/action/fs-file-save', partial: false, requested: false },
            fsFileDeleteButton:  { slug: '/action/fs-file-remove', partial: false, requested: false }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#show-files', { visible: true });
        await page.click('#show-files');
        await page.waitForSelector('#fs-file-upload-button', { visible: true });
        await page.evaluate('$(".save-button.save")[0].click()');
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#fs-file-upload-button'),
        ]);
        await fileChooser.cancel();
        const fsFileInput = await page.$("#fs-file-upload-input");
        await fsFileInput.uploadFile("./spec/test-files/samplefile.py");
        // Metrics are for new files only added 1 sec after
        await page.waitFor(1050);
        await page.evaluate('$(".save-button.remove")[1].click()');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    }, 60 * 1000);

    it('Click Snippets button.', async function() {
        let metrics = {
            snippetsButton: {
                slug: '/action/snippet',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-snippet');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Snippets modal: Insert all snippets.', async function() {
        let metrics = {
            'snippet-docs': { slug: '/action/snippet-docs', partial: false, requested: false },
            'snippet-wh':   { slug: '/action/snippet-wh',   partial: false, requested: false },
            'snippet-with': { slug: '/action/snippet-with', partial: false, requested: false },
            'snippet-cl':   { slug: '/action/snippet-cl',   partial: false, requested: false },
            'snippet-def':  { slug: '/action/snippet-def',  partial: false, requested: false },
            'snippet-if':   { slug: '/action/snippet-if',   partial: false, requested: false },
            'snippet-ei':   { slug: '/action/snippet-ei',   partial: false, requested: false },
            'snippet-el':   { slug: '/action/snippet-el',   partial: false, requested: false },
            'snippet-for':  { slug: '/action/snippet-for',  partial: false, requested: false },
            'snippet-try':  { slug: '/action/snippet-try',  partial: false, requested: false },
        };
        const page = await preparePageForMetrics(metrics);

        for (let metric in metrics) {
            await page.click('#command-snippet');
            await page.waitForSelector('#' + metric, { visible: true });
            await page.click('#' + metric);
        }
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Options button.', async function() {
        let metrics = {
            optionsButton: {
                slug: '/action/options',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            await page.click('#command-options');
            await waitForAllRequests(page, metrics);
            await page.close();
        } else {
            console.warn('Skipping Options button test in non-beta editor.')
            await page.close();
            return;
        }

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Options menu: Click Autocomplete.', async function() {
        let metrics = {
            autocompleteSwitch: {
                slug: '/action/menu-switch-autocomplete',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            await page.click('#command-options');
            //await page.waitForSelector('#menu-switch-autocomplete-label', { visible: true });
            await page.click('#menu-switch-autocomplete-label');
            await waitForAllRequests(page, metrics);
            await page.close();
        } else {
            console.warn('Skipping Options button test in non-beta editor.')
            await page.close();
            return;
        }

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Options menu: Click Autocomplete on Enter.', async function() {
        let metrics = {
            autocompleteEnterSwitch: {
                slug: '/action/menu-switch-autocomplete-enter',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            await page.click('#command-options');
            //await page.waitForSelector('#menu-switch-autocomplete-enter-label', { visible: true });
            await page.click('#menu-switch-autocomplete-enter-label');
            await waitForAllRequests(page, metrics);
            await page.close();
        } else {
            console.warn('Skipping Options button test in non-beta editor.')
            await page.close();
            return;
        }

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Help button.', async function() {
        let metrics = {
            helpButton: {
                slug: '/action/help',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-help');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Help menu: Click all (non-beta) links.', async function() {
        let metrics = {
            'docs-link': {
                slug: '/action/docs-link',
                partial: false,
                requested: false,
            },
            'help-link': {
                slug: '/action/help-link',
                partial: false,
                requested: false,
            },
            'support-link': {
                slug: '/action/support-link',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        for (let metric in metrics) {
            await page.click('#command-help');
            //await page.waitForSelector('#' + metric, { visible: true });
            await page.click('#' + metric);
        }
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Help menu: Click all beta links.', async function() {
        let metrics = {
            'feedback-link': {
                slug: '/action/feedback-link',
                partial: false,
                requested: false,
            },
            'issues-link': {
                slug: '/action/issues-link',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            for (let metric in metrics) {
                await page.click('#command-help');
                //await page.waitForSelector('#' + metric, { visible: true });
                await page.click('#' + metric);
            }
            await waitForAllRequests(page, metrics);
            await page.close();
        } else {
            console.warn('Skipping Help menu beta links test in non-beta editor.')
            await page.close();
            return;
        }

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Zoom In button.', async function() {
        let metrics = {
            zommInButton: {
                slug: '/action/zoom-in',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-zoom-in');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Zoom Out button.', async function() {
        let metrics = {
            zommInButton: {
                slug: '/action/zoom-out',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-zoom-out');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Script Name text input.', async function() {
        let metrics = {
            scriptNameInput: {
                slug: '/action/script-box',
                partial: false,
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#script-box');
        await waitForAllRequests(page, metrics);
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    // TODO: Drag and drop Python file to the code editor area
    // TODO: Drag and drop Hex file to the code editor area
    // TODO: Drag and drop invalid file  to the code editor area
});
