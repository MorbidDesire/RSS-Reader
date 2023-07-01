import i18n from './init.js';

const render = (state) => {
  const form = document.querySelector('form');
  const input = document.querySelector('input');
  const paragraph = document.querySelector('.feedback');
  const { validateError } = state;
  if (validateError.length !== 0) {
    input.classList.add('is-invalid');
    paragraph.textContent = i18n.t(`${validateError}`);
    paragraph.classList.remove('text-success');
    paragraph.classList.add('text-danger');
  } else {
    paragraph.textContent = i18n.t('validate.loadSuccess');
    input.classList.remove('is-invalid');
    paragraph.classList.remove('text-danger');
    paragraph.classList.add('text-success');
    form.reset();
    input.focus();

    // отрисовка фида
    const feedsContainer = document.querySelector('.feeds');
    const feedsTitle = feedsContainer.querySelector('.card-title');
    feedsTitle.textContent = 'Фиды';
    const feedsList = feedsContainer.querySelector('.list-group');
    feedsList.innerHTML = '';

    state.feeds.forEach(({ feedTitle, feedDescription }) => {
      const feed = document.createElement('li');
      feed.classList.add('list-group-item', 'border-0', 'border-end-0');
      const title = document.createElement('h6');
      const description = document.createElement('p');
      title.classList.add('m-0');
      title.textContent = feedTitle;
      description.classList.add('m-0', 'small', 'text-black-50');
      description.textContent = feedDescription;
      feed.append(title, description);
      feedsList.prepend(feed);
    });
  }
};

export default render;
