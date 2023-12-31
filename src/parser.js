export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');

  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error('parseError');
  }

  const channel = doc.querySelector('channel');
  const feedTitle = channel.querySelector('title').textContent;
  const feedDescription = channel.querySelector('description').textContent;
  const feedLink = channel.querySelector('link').textContent;
  const feed = { title: feedTitle, description: feedDescription, link: feedLink };

  const items = Array.from(doc.querySelectorAll('item'));

  const posts = items.map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;

    return { title, description, link };
  });

  return { feed, posts };
};
