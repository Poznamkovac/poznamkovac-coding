/**
 * Tests for the Python Hello World challenge
 */
export default class PythonTester {
    constructor() {
        this.previewWindow = null;
    }

    /**
     * Set the preview window reference for all tests
     */
    setPreviewWindow(window) {
        this.previewWindow = window;
    }

    /**
     * Test that the script correctly outputs "Hello, World!"
     */
    async test_hello_output() {
        try {
            const STDOUT = this.previewWindow.document.getElementById('stdout');
            const STDERR = this.previewWindow.document.getElementById('stderr');

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
}
