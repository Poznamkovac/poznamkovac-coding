export default class HTMLChallengeTester {
    test_ma_nadpis(dom) {
      const heading = dom.querySelector('h1, h2, h3, h4, h5, h6');
      return {
        score: heading ? 1 : 0,
        details_pass: 'Našiel sa nadpis',
        details_fail: 'Nenašiel sa nadpis'
      };
    }
  
    test_ma_odsek(dom) {
      const paragraph = dom.querySelector('p');
      return {
        score: paragraph?.textContent?.toLowerCase()?.includes("ahoj") ? 1 : 0,
        details_pass: 'Odsek sa našiel',
        details_fail: 'Nebol nájdený žiadny odsek s textom "ahoj"'
      };
    }

  }