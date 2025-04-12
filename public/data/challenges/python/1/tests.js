/**
 * Tests for the Python Hello World challenge
 */
export default class PythonTester {
    /**
     * Test that the script correctly outputs "Hello, World!"
     */
    async test_hello_output(previewWindow) {
        try {
            await this.wait_for_loader(previewWindow);

            const STDOUT = previewWindow.document.getElementById('stdout');
            const STDERR = previewWindow.document.getElementById('stderr');

            let stdout = STDOUT.textContent;
            let stderr = STDERR.textContent;
            if (stderr.length > 0) {
                return {
                    detaily_zle: `Expected no errors, but found stderr`
                };
            }

            if (stdout.includes('Hello, World!')) {
                return {
                    detaily_ok: 'Your program correctly output "Hello, World!"'
                };
            } else {
                return {
                    detaily_zle: `Expected to find "Hello, World!" in the output, but found: "${stdout}"`
                };
            }
        } catch (error) {
            return {
                detaily_zle: `Test error: ${error.message}`
            };
        }
    }

    async wait_for_loader(previewWindow) {
        const loader = previewWindow.document.getElementById('loader');
        if (loader && loader.style.display !== 'none') {
            try {
                await this.waitForCondition(
                    () => loader.style.display === 'none',
                    10000,
                    'Pyodide is still loading'
                );
            } catch (timeoutError) {
                return {
                    detaily_zle: 'Timed out waiting for Python environment to load'
                }
            }
        }
    }

    /**
     * Wait for a condition to be true
     */
    waitForCondition(checkFn, timeout = 5000, errorMessage = 'Condition timeout') {
        return new Promise((resolve, reject) => {
            if (checkFn()) {
                return resolve();
            }

            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(errorMessage));
            }, timeout);

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
