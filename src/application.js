import onChange from 'on-change';
import * as yup from 'yup';
import { string } from 'yup';
import render from './view';
import parser from './parser';

yup.setLocale({
  string: {
    url: () => 'validate.errors.invalidUrl',
  },
});

const urlSchema = (string().url());

const state = {
  currentUrl: '',
  validateError: '',
  feeds: [],
  posts: [],
};

const watchedState = onChange(state, (path, value) => {
  if (path === 'currentUrl') {
    state.currentUrl = value;
  } else {
    render(state);
  }
});

const postsSelection = (url) => {
  fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
    .then((response) => response.json())
    .then((data) => data.contents)
    .then((text) => parser(text))
    .then((doc) => {
      const feedTitle = doc.body.querySelector('title').textContent;
      const feedDescription = doc.body.querySelector('description').textContent;
      watchedState.feeds.push({ feedTitle, feedDescription });
      const posts = doc.querySelectorAll('item');
      posts.forEach((post) => {
        const postTitle = post.querySelector('title').textContent;
        const postDescription = post.querySelector('description').textContent;
        const postLink = post.querySelector('link').textContent;
        watchedState.posts.push({ postTitle, postDescription, postLink });
      });
      // watchedState.validateError = 'none';
    })
    .catch(() => {
      watchedState.validateError = 'parseError';
    });
};

const app = () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const urlName = formData.get('url');
    if (urlName === state.currentUrl) {
      watchedState.validateError = 'validate.errors.urlRepeatable';
      return;
    }
    urlSchema.validate(urlName)
      .then((response) => {
        watchedState.currentUrl = response;
      })
      .then(() => {
        postsSelection(urlName);
      })
      .catch((error) => {
        watchedState.validateError = error.message;
      });
    // .catch((response) => console.log('error', response));
  });
};

export default app;
