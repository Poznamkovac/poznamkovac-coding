export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_struktura(window) {
    const doc = window.document;
    const html = doc.documentElement;
    const head = doc.head;
    const body = doc.body;

    if (!html || html.tagName !== "HTML")
      return {
        detaily_zle: "Chýba koreňový element <code>&lt;html&gt;</code>.",
      };

    if (!head || head.tagName !== "HEAD")
      return {
        detaily_zle: "Chýba element <code>&lt;head&gt;</code>.",
      };

    const title = head.querySelector("title");
    if (!title || title.textContent !== "Moja prvá stránka")
      return {
        detaily_zle: 'Chýba <code>&lt;title&gt;</code> s textom "Moja prvá stránka".',
      };

    if (!body || body.tagName !== "BODY")
      return {
        detaily_zle: "Chýba element <code>&lt;body&gt;</code>.",
      };

    const paragraph = body.querySelector("p");
    if (!paragraph || paragraph.textContent !== "Ahoj, svet!")
      return {
        detaily_zle: 'Chýba <code><p></code> s textom "Ahoj, svet!".',
      };

    return {
      skore: 10,
      detaily_ok: "Výborne! Vytvoril si správnu základnú štruktúru HTML.",
    };
  }
}
