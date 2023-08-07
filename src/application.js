/* eslint-disable no-param-reassign */
import onChange from 'on-change';
import axios from 'axios';
import * as yup from 'yup';
import { string } from 'yup';
import _ from 'lodash';
import render from './view';
import parser from './parser';
import i18n from './init.js';

yup.setLocale({
  mixed: {
    notOneOf: () => 'urlRepeatable',
    required: () => 'emptyField',
  },
  string: {
    url: () => 'invalidUrl',
  },
});

const timeout = 5000;

const validation = (url, urls) => {
  const schema = string()
    .trim()
    .required()
    .url()
    .notOneOf(urls);
  return schema.validate(url);
};

const axiosFunc = (url) => {
  const response = axios({
    method: 'get',
    url: `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`,
    timeout: 10000,
  });
  return response;
};

const createPosts = (state, newPosts, feedId) => {
  const preparedPosts = newPosts.map((post) => ({ ...post, feedId, id: _.uniqueId() }));
  state.content.posts = [...preparedPosts, ...state.content.posts];
};

const getNewPosts = (state) => {
  const promises = state.content.feeds
    .map(({ link, feedId }) => axiosFunc(link)
      .then((response) => {
        const { posts } = parser(response.data.contents);
        const addedPosts = state.content.posts.map((post) => post.link);
        const newPosts = posts.filter((post) => !addedPosts.includes(post.link));
        if (newPosts.length > 0) {
          createPosts(state, newPosts, feedId);
        }
        return Promise.resolve();
      }));

  Promise.allSettled(promises)
    .finally(() => {
      setTimeout(() => getNewPosts(state), timeout);
    });
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('input[id="url-input"]'),
    button: document.querySelector('button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modal: {
      modalWindow: document.querySelector('.modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      button: document.querySelector('.full-article'),
    },
  };

  const initialState = {
    urls: [],
    inputValue: '',
    processState: 'filling',
    validation: '',
    error: '',
    content: {
      feeds: [],
      posts: [],
    },
    uiState: {
      watchedPostsIds: [],
      modalPostId: '',
    },
  };

  const watchedState = onChange(initialState, render(elements, initialState, i18n));
  getNewPosts(watchedState);

  elements.form.addEventListener('input', (e) => {
    e.preventDefault();
    watchedState.processState = 'filling';
    watchedState.inputValue = e.target.value;
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const urlName = formData.get('url');
    const urls = watchedState.content.feeds.map(({ link }) => link);

    validation(urlName, urls)
      .then(() => {
        watchedState.processState = 'sending';
        return axiosFunc(urlName);
      })
      .then((response) => {
        const data = response.data.contents;
        const { feed, posts } = parser(data);
        const feedId = _.uniqueId();
        watchedState.content.feeds.push({ ...feed, feedId, link: urlName });
        createPosts(watchedState, posts, feedId);
        watchedState.processState = 'done';
      })
      .catch((error) => {
        watchedState.processState = 'error';
        if (error.name === 'AxiosError') {
          watchedState.error = 'networkError';
        } else {
          watchedState.error = error.message;
        }
      });
  });

  elements.modal.modalWindow.addEventListener('show.bs.modal', (e) => {
    const currentPostId = e.relatedTarget.getAttribute('data-id');
    watchedState.uiState.watchedPostsIds.push(currentPostId);
    watchedState.uiState.modalPostId = currentPostId;
  });

  elements.posts.addEventListener('click', (e) => {
    const currentPostId = e.target.dataset.id;
    if (currentPostId) {
      watchedState.uiState.watchedPostsIds.push(currentPostId);
    }
  });
};

export default app;
