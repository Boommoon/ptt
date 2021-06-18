'use strict';

const Promise = require('bluebird');
const debug = require('debug')('ptt:article');
const HTMLParser = require('node-html-parser');
const request = require('./config').request;
const AUTHOR_SELECTOR = 'div.article-metaline:nth-child(1) > span:nth-child(2)';
const TITLE_SELECTOR = 'div.article-metaline:nth-child(3) > span:nth-child(2)';

function getArticleFromHtml(html, link) {
  let root = HTMLParser.parse(html).removeWhitespace();
  let article = {
    content: '',
    date: new Date(link.replace(/[\:\/A-Za-z]+\.|\.A(?:\.[0-9A-F]{3})?\.html/g, '') * 1000),
    author: root.querySelector(AUTHOR_SELECTOR).text,
    boardName: root.querySelector('a.board').text.replace(/[^\w]+/g, ''),
    title: root.querySelector(TITLE_SELECTOR).text,
    images: [],
    links: [],
  };

  root.querySelector('div.article-metaline').remove();
  root.querySelector('div.article-metaline-right').remove();
  article.content = root.querySelector('#main-content').text;

  try {
    root.querySelectorAll('img').forEach((entry) => {
      article.images.push(entry.getAttribute('src'));
    });
  } catch (error) {
    debug('no img url found, skip!');
    return;
  }

  try {
    root.querySelectorAll('a').forEach((entry) => {
      article.links.push(entry.getAttribute('href'));
    });
  } catch (error) {
    debug('no a url found, skip!');
    return;
  }

  try {
    root.querySelectorAll('.imgur-embed-pub').forEach((entry) => {
      article.images.push(`//imgur.com/${entry.getAttribute('data-id')}`);
    });
  } catch (error) {
    debug('no imgur url found, skip!');
    return;
  }

  debug('article', article);
  return Promise.resolve(article);
}

function getArticleFromLink(link) {
  return request.get(link)
    .then((html) => getArticleFromHtml(html, link))
    .then(article => Object.assign({ url: link }, article));
}

module.exports = {
  getArticleFromLink,
  getArticleFromHtml,
};
