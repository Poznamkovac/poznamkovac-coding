export default class HTMLChallengeTester {
    /** @param {Document} dom */
    test_nadpisy(dom) {
        const nadpisy = dom.querySelectorAll('h1, h2, h3');

        if (nadpisy.length !== 3) return {
            detaily_zle: `Nenašli sa 3 nadpisy.`
        };

        let poslednyLevel = 0;
        for (const nadpis of nadpisy) {
            const level = parseInt(nadpis.tagName[1]);
            if (level <= poslednyLevel) return {
                detaily_zle: `Nadpisy nie sú zoradené podľa veľkosti.`
            };

            poslednyLevel = level;

            const paragraf = nadpis.nextElementSibling;
            if (!paragraf || paragraf.tagName !== 'P') return {
                detaily_zle: `Nadpis ${nadpis.tagName} nemá paragraf.`
            };

        }

        return {
            skore: 5,
            detaily_ok: 'Super!'
        };
    }
}