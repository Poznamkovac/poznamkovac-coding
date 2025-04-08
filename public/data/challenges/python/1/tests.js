// ?

export default class PythonChallengeTester {
  /** @param {Window} window */
  test_hello(window) {
    if (window.pyodide.globals.hello !== "hello") // ?
      return {
        detaily_zle: "Funkcia nevracia hello",
      };

    return {
      skore: 1,
      detaily_ok: "Funkcia vrátila hello",
    };
  }
}
