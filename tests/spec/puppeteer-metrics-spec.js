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

    /* Helper function to add a request interceptor to check for metric console logs. */
    const addMetricsIntercept = async (page, expectedMetrics) => {
        page.on('console', (message) => {
            const parts = message.text().split(" ");
            if (parts[0] === "metric:") {
                const [, action, label, value ] = parts;
                for (const metric of Object.values(expectedMetrics)) {
                    if  (metric.action === action && metric.label === label && metric.value === value) {
                        metric.requested = true;
                    }
                }
            }
        });
    };

    let preparePageForMetrics = async (metrics) => {
        const page = await browser.newPage();
        await addMetricsIntercept(page, metrics);
        await page.goto(editorURL);
        return page;
    };

    it('Prepare page: measure viewport width.', async function() {
        let metrics = {
            viewport: {
                action: 'viewport',
                label: '481-890',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Check download metric is sent.', async function() {
        let metrics = {
            downloadButton: {
                action: 'click',
                label: 'download',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-download');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Detect default-script.', async function() {
        let metrics = {
            codeLines: {
                action: 'lines',
                label: 'default',
                value: '1',
                requested: false,
            },
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-download');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Number of lines.', async function() {
        let metrics = {
            codeLines: {
                action: 'lines',
                label: '21-50',
                value: '1',
                requested: false,
            },
        };
        const page = await preparePageForMetrics(metrics);
        await page.evaluate('EDITOR.setCode("#first line' + '\\n'.repeat(21) + '#last line");');
        await page.click('#command-download');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Filesystem storage used.', async function() {
        let metrics = {
            codeLines: {
                action: 'fs-used',
                label: '11-15',
                value: '1',
                requested: false,
            },
        };
        const page = await preparePageForMetrics(metrics);
        await page.evaluate('EDITOR.setCode("' + 'x'.repeat(11*1024) + '");');
        await page.click('#command-download');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Download button: Number of files.', async function() {
        let metrics = {
            Files: {
                action: 'files',
                label: '2',
                value: '1',
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
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Connect button.', async function() {
        let metrics = {
            connectButton: {
                action: 'click',
                label: 'connect',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-connect');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Load/Save button.', async function() {
        let metrics = {
            loadSaveButton: {
                action: 'click',
                label: 'files',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
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
                action: 'click',
                label: 'save-py',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#load-drag-target', { visible: true });
        await page.click('#save-py');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click Save Hex button.', async function() {
        let metrics = {
            saveHexButton: {
                action: 'click',
                label: 'save-hex',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-files');
        await page.waitForSelector('#load-drag-target', { visible: true });
        await page.click('#save-hex');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click file upload link and upload Python file.', async function() {
        let metrics = {
            saveHexButton: {
                action: 'load',
                label: 'file-upload-py',
                value: '1',
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
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click file upload link and upload Hex file.', async function() {
        let metrics = {
            saveHexButton: {
                action: 'load',
                label: 'file-upload-hex',
                value: '1',
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
        await fileInput.uploadFile("./spec/test-files/samplefile.hex");
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Click file link and upload invalid file.', async function() {
        let metrics = {
            saveHexButton: {
                action: 'load',
                label: 'error-file-upload-type-txt',
                value: '1',
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
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Load/Save modal: Upload file to filesystem, download fs file, and delete fs file.', async function() {
        let metrics = {
            showHideFilesButton: { action: 'click', label: 'hide-files', value: '1', requested: false },
            fsFileUploadButton:  { action: 'click', label: 'file-save', value: '1', requested: false },
            fsFileSaveButton:    { action: 'click', label: 'fs-file-upload-button', value: '1', requested: false },
            fsFileDeleteButton:  { action: 'click', label: 'file-remove', value: '1', requested: false }
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
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    }, 60 * 1000);

    it('Click Snippets button.', async function() {
        let metrics = {
            snippetsButton: {
                action: 'click',
                label: 'snippet',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-snippet');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Snippets modal: Insert all snippets.', async function() {
        let metrics = {
            'snippet-docs': { action: 'click', label: 'snippet-docs', value: '1', requested: false },
            'snippet-wh':   { action: 'click', label: 'snippet-wh',   value: '1', requested: false },
            'snippet-with': { action: 'click', label: 'snippet-with', value: '1', requested: false },
            'snippet-cl':   { action: 'click', label: 'snippet-cl',   value: '1', requested: false },
            'snippet-def':  { action: 'click', label: 'snippet-def',  value: '1', requested: false },
            'snippet-if':   { action: 'click', label: 'snippet-if',   value: '1', requested: false },
            'snippet-ei':   { action: 'click', label: 'snippet-ei',   value: '1', requested: false },
            'snippet-el':   { action: 'click', label: 'snippet-el',   value: '1', requested: false },
            'snippet-for':  { action: 'click', label: 'snippet-for',  value: '1', requested: false },
            'snippet-try':  { action: 'click', label: 'snippet-try',  value: '1', requested: false },
        };
        const page = await preparePageForMetrics(metrics);

        for (let metric in metrics) {
            await page.click('#command-snippet');
            await page.waitForSelector('#' + metric, { visible: true });
            await page.click('#' + metric);
        }
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Options button.', async function() {
        let metrics = {
            optionsButton: {
                action: 'click',
                label: 'options',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            await page.click('#command-options');
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
                action: 'click',
                label: 'menu-switch-autocomplete',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            await page.click('#command-options');
            //await page.waitForSelector('#menu-switch-autocomplete-label', { visible: true });
            await page.click('#menu-switch-autocomplete-label');
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
                action: 'click',
                label: 'menu-switch-autocomplete-enter',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        const betaEditor = await page.evaluate('config.flags.experimental');
        if (betaEditor) {
            await page.click('#command-options');
            //await page.waitForSelector('#menu-switch-autocomplete-enter-label', { visible: true });
            await page.click('#menu-switch-autocomplete-enter-label');
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
                action: 'click',
                label: 'help',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-help');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Help menu: Click all (non-beta) links.', async function() {
        let metrics = {
            'docs-link': {
                action: 'click',
                label: 'docs-link',
                value: '1',
                requested: false,
            },
            'help-link': {
                action: 'click',
                label: 'help-link',
                value:'1',
                requested: false,
            },
            'support-link': {
                action: 'click',
                label: 'support-link',
                value:'1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        for (let metric in metrics) {
            await page.click('#command-help');
            //await page.waitForSelector('#' + metric, { visible: true });
            await page.click('#' + metric);
        }
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Help menu: Click all beta links.', async function() {
        let metrics = {
            'feedback-link': {
                action: 'click',
                label: 'feedback-link',
                value: '1',
                requested: false,
            },
            'issues-link': {
                action: 'click',
                label: 'issues-link', 
                value:'1',
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
            zoomInButton: {
                action: 'click',
                label: 'zoom-in',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-zoom-in');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Zoom Out button.', async function() {
        let metrics = {
            zoomOutButton: {
                action: 'click',
                label: 'zoom-out',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-zoom-out');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });
    
    it('Click language button.', async function() {
        let metrics = {
            language: {
                action: 'click',
                label: 'language',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-language');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });
    
    it('Click English button.', async function() {
        let metrics = {
            English: {
                action: 'click',
                label: 'en',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-language');
        await page.click('#en.action.lang-choice');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });
        
    it('Click Spanish button.', async function() {
        let metrics = {
            Spanish: {
                action: 'click',
                label: 'es',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-language');
        await page.click('#es.action.lang-choice');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });
        
    it('Click Polish button.', async function() {
        let metrics = {
            Polish: {
                action: 'click',
                label: 'pl',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-language');
        await page.click('#pl.action.lang-choice');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });
        
    it('Click Croatian button.', async function() {
        let metrics = {
            Croatian: {
                action: 'click',
                label: 'hr',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#command-language');
        await page.click('#hr.action.lang-choice');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    it('Click Script Name text input.', async function() {
        let metrics = {
            scriptNameInput: {
                action: 'click',
                label: 'script-box',
                value: '1',
                requested: false,
            }
        };
        const page = await preparePageForMetrics(metrics);

        await page.click('#script-box');
        await page.close();

        for (let metric in metrics) {
            expect(metrics[metric].requested).toBeTruthy();
        }
    });

    // TODO: Drag and drop Python file to the code editor area
    // TODO: Drag and drop Hex file to the code editor area
    // TODO: Drag and drop invalid file  to the code editor area
});
