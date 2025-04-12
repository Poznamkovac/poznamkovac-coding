/**
 * Tests for the Python Hello World challenge
 */
export default class PythonTester {
    /**
     * Test that the script correctly outputs "Hello, World!"
     */
    async test_hello_output(previewWindow) {
        try {
            // First ensure the iframe is fully loaded
            if (!previewWindow || !previewWindow.document) {
                return {
                    detaily_zle: 'Preview window not available or not fully loaded'
                };
            }

            // Wait for pyodide to be ready - maximum 15 seconds
            await this.waitForElement(previewWindow, '#console', 15000);

            // Get the console output
            const consoleElement = previewWindow.document.getElementById('console');
            if (!consoleElement) {
                return {
                    detaily_zle: 'Console element not found in preview'
                };
            }

            // Make sure Pyodide loader is gone (means loading completed)
            const loader = previewWindow.document.getElementById('loader');
            if (loader && loader.style.display !== 'none') {
                // Wait up to 10 more seconds for the loader to disappear
                try {
                    await this.waitForCondition(
                        () => loader.style.display === 'none',
                        10000,
                        'Pyodide is still loading'
                    );
                } catch (timeoutError) {
                    return {
                        detaily_zle: 'Timed out waiting for Python environment to load'
                    };
                }
            }

            // Wait to ensure output is fully rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check the console output for "Hello, World!"
            const consoleText = consoleElement.textContent || '';

            if (consoleText.includes('Hello, World!')) {
                return {
                    detaily_ok: 'Your program correctly output "Hello, World!"'
                };
            } else {
                return {
                    detaily_zle: `Expected to find "Hello, World!" in the output, but found: "${consoleText}"`
                };
            }
        } catch (error) {
            return {
                detaily_zle: `Test error: ${error.message}`
            };
        }
    }

    /**
     * Wait for an element to appear in the DOM
     */
    waitForElement(window, selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            // Check if element already exists
            if (window.document.querySelector(selector)) {
                return resolve(window.document.querySelector(selector));
            }

            // Set up a timeout
            const timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timed out waiting for element: ${selector}`));
            }, timeout);

            // Set up a mutation observer to watch for the element
            const observer = new window.MutationObserver((mutations) => {
                if (window.document.querySelector(selector)) {
                    clearTimeout(timeoutId);
                    observer.disconnect();
                    resolve(window.document.querySelector(selector));
                }
            });

            // Start observing
            observer.observe(window.document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    /**
     * Wait for a condition to be true
     */
    waitForCondition(checkFn, timeout = 5000, errorMessage = 'Condition timeout') {
        return new Promise((resolve, reject) => {
            // Check if condition is already met
            if (checkFn()) {
                return resolve();
            }

            // Set the timeout
            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(errorMessage));
            }, timeout);

            // Check the condition periodically
            const intervalId = setInterval(() => {
                if (checkFn()) {
                    clearTimeout(timeoutId);
                    clearInterval(intervalId);
                    resolve();
                }
            }, 100);
        });
    }
} 