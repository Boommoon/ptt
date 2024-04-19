'use strict';

const urlencode = require('urlencode');
const BASE_URL = require('./config').BASE_URL;
const Promise = require('bluebird');
const debug = require('debug')('ptt:board');
const request = require('./config').request;
const HTMLParser = require('node-html-parser');

function getArticlesFromHtml(html) {
  const root = HTMLParser.parse(html).removeWhitespace();
  let articles = [];
  const nextPageUrl = BASE_URL + root.querySelector('a.wide:nth-child(2)').getAttribute('href');
  const boardName = root.querySelector('a.board').text.replace(/[^\w]+/g, '');

  root.querySelectorAll('div.r-ent:not(div.r-list-sep ~ div.r-ent)').forEach(
    (entry) => {
      try {
        let url = entry.querySelector('div.title > a').getAttribute('href');

        let push = entry.querySelector('div.nrec').text;
        if (push === '') {
          push = 0;
        } else if (push === '爆') {
          push = 100;
        } else if (push[0] === 'X') {
          push = -(+push.substr(1, 1));
        } else {
          push = +push;
        }

        let row = {
          title: entry.querySelector('div.title > a').text,
          date: new Date(url.replace(/[\/A-Za-z]+\.|\.A(?:\.[0-9A-F]{3})?\.html/g, '') * 1000),
          author: [{
            name: entry.querySelector('div.author').text,
            email: entry.querySelector('div.author').text + '.bbs@ptt.cc'
          }],
          push: push,
          link: BASE_URL + url,
        };

        debug(row);
        articles.push(row);
      } catch (error) {
        debug('no article url found, skip!');
        return;
      }
    });

  debug('get %s articles, next page link: %s', articles.length, nextPageUrl);
  return Promise.resolve({ nextPageUrl, articles, boardName });
}

function getArticlesFromLink(link) {
  debug('fetching %s', link);
  link = link.replace(/[\u4E00-\u9FA5]+/g, urlencode.encode(link.replace(/[^\u4E00-\u9FA5]+/g, '')));
  return request.get(link).then(html => getArticlesFromHtml(html));
}

module.exports = {
  getArticlesFromLink,
  getArticlesFromHtml,
};
