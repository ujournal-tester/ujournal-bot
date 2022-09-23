const { format } = require("date-fns");
const axios = require("axios");

module.exports = async (targetUrl) => {
  const response = await axios.get(targetUrl);

  return Array.from(
    response.data
      .replace(/\n/, "")
      .matchAll(
        /<a class="tgme_widget_message_date" href="(.+?)"><time datetime="(.+?)" class="time">(.+?)<\/time><\/a>/gm
      )
  )
    .map(([, messageUrl, date, time]) => ({ messageUrl, date, time }))
    .filter(
      ({ date }) => format(new Date(date), "P") === format(new Date(), "P")
    );
};
