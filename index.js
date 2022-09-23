const axios = require("axios");
const { merge } = require("lodash");
const url = require("url");
const contentFetchers = require("./contentFetchers");
const postCreators = require("./postCreators");

// env variables
const lemmyApiUrl = process.env.LEMMY_API_URL;
const targetUrl = process.env.TARGET_URL;
const communityId = parseInt(process.env.COMMUNITY_ID, 10);
const authToken = process.env.AUTH_TOKEN;

// function: for creating post in Lemmy
const createLemmyPost = async (data) => {
  const _data = merge(
    {
      community_id: communityId,
      nsfw: false,
      name: "...",
      body: "",
    },
    data
  );

  console.log(_data);

  const url = `${lemmyApiUrl}/post`;

  return await axios.post(url, { ..._data, auth: authToken });
};

// function: start point
const main = async () => {
  if (!lemmyApiUrl || !targetUrl || !communityId || !authToken) {
    throw new Error(
      "Env variables LEMMY_API_URL, TARGET_URL, COMMUNITY_ID, AUTH_TOKEN are required."
    );
  }

  const { hostname } = url.parse(targetUrl);
  const fetchContent = contentFetchers[hostname];
  const createPost = postCreators[hostname];

  if (!fetchContent || !createPost) {
    throw new Error("URL is not supported.");
  }

  console.log("[info]: fetching content");
  const content = await fetchContent(targetUrl);

  if (content.length === 0) {
    throw new Error("Content is absent.");
  }

  console.log("[info]: get last post");

  console.log("[info]: creating post");
  const post = await createPost(url, content);

  console.log("[info]: push post to Lemmy");
  const {
    data: {
      post_view: { post: postView },
    },
  } = await createLemmyPost(post);

  console.log("[info]: OK");
  console.log(
    `[info]: https://ujournal.com.ua/new/post/?postId=${postView.id}`
  );
};

// run main
try {
  main();
} catch (error) {
  console.log(`[error]: Error happened`);
  console.log(`[error]`, error);
}
