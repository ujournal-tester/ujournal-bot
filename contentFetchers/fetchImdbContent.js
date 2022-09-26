const axios = require("axios");
const jsdom = require("jsdom");
const translate = require("translate-google");
const { makeAbsoluteUrl } = require("../utils/url");
const { format, add } = require("date-fns");

const { JSDOM } = jsdom;

module.exports = async (targetUrl) => {
  if (targetUrl.includes("imdb.com/calendar")) {
    const response = await axios.get(targetUrl);

    const dom = new JSDOM(response.data);

    const releases = [];

    const title = await translate(
      dom.window.document.querySelector("h1").textContent,
      { from: "en", to: "uk" }
    );

    let date = null;

    Array.from(dom.window.document.querySelectorAll("#main > *")).forEach(
      (el) => {
        if (el.tagName.toUpperCase() === "H4") {
          date = new Date(Date.parse(el.textContent.trim()));
        } else if (el.tagName.toUpperCase() === "UL") {
          Array.from(el.querySelectorAll("li")).forEach((el) => {
            const link = el.querySelector("a");
            releases.push({
              title: link.textContent.trim(),
              url: makeAbsoluteUrl(
                targetUrl,
                link.href.replace("?ref_=rlm", "")
              ),
              year:
                Number(
                  link.nextSibling.textContent.trim().replace(/\(|\)/g, "")
                ) || null,
              date,
            });
          });
        }
      },
      []
    );

    const _todayReleases = releases.filter(
      ({ date }) =>
        format(new Date(date), "P") ===
        format(add(new Date(), { days: 1 }), "P")
    );

    const tomorrowReleases = [];

    for (let release of _todayReleases) {
      const { url } = release;
      const response = await axios.get(url);
      const dom = new JSDOM(response.data);
      const title = dom.window.document
        .querySelector('meta[property="og:title"]')
        .getAttribute("content")
        .trim()
        .replace(" - IMDb", "");
      const description = dom.window.document
        .querySelector('meta[property="og:description"]')
        .getAttribute("content")
        .trim();
      const type = dom.window.document
        .querySelector('meta[property="og:type"]')
        .getAttribute("content")
        .trim();
      const image = dom.window.document
        .querySelector('meta[property="og:image"]')
        .getAttribute("content")
        .trim();
      tomorrowReleases.push({
        ...release,
        title,
        description: await translate(description, { from: "en", to: "uk" }),
        type,
        image,
      });
    }

    return {
      title,
      releases,
      tomorrowReleases,
    };
  }
};