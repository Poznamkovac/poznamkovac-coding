export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_formular(window) {
    const doc = window.document;
    const form = doc.querySelector("form");

    if (!form)
      return {
        detaily_zle: "Formulár nebol nájdený. Použite tag &lt;form&gt;.",
      };

    const nameInput = form.querySelector('input[type="text"][name="meno"]');
    const emailInput = form.querySelector('input[type="email"][name="email"]');
    const messageTextarea = form.querySelector('textarea[name="sprava"]');
    const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');

    if (!nameInput || !nameInput.required)
      return {
        detaily_zle: 'Chýba <b>povinné</b> (<code>required</code>) pole pre meno (input s type="text" a name="meno").',
      };

    if (!emailInput || !emailInput.required)
      return {
        detaily_zle: 'Chýba povinné pole pre email (input s type="email" a name="email").',
      };

    if (!messageTextarea || !messageTextarea.required)
      return {
        detaily_zle: 'Chýba povinné pole pre správu (textarea s name="sprava").',
      };

    if (!submitButton)
      return {
        detaily_zle: "Chýba tlačidlo na odoslanie formulára.",
      };

    return {
      skore: 15,
      detaily_ok: "Výborne! Vytvoril si správny kontaktný formulár s povinnými poliami.",
    };
  }
}
