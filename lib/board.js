'use strict';

const BASE_URL = require('./config').BASE_URL;
let Promise = require('bluebird');
let debug = require('debug')('ptt:board');
let request = require('./config').request;
let HTMLParser = require('node-html-parser');

function getArticlesFromHtml(html) {
  let root = HTMLParser.parse(html).removeWhitespace();
  let articles = [];
  let nextPageUrl = BASE_URL + root.querySelector('div.btn-group.btn-group-paging > a:nth-child(2)').getAttribute('href');
  debug('nextPageUrl %s', nextPageUrl);
  let boardName = root.querySelector('a.board').text.replace(/[^\w]+/g, '');
  debug('boardName %s', boardName);

  root.querySelectorAll('div.r-ent').forEach(
    (entry) => {
      let $elem = HTMLParser.parse(entry);
      try {
        let url = $elem.querySelector('div.title > a').getAttribute('href');

        let push = $elem.querySelector('div.nrec').text;
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
          title: $elem.querySelector('div.title > a').text,
          date: new Date(url.replace(/[\/A-Za-z]+\.|\.A(?:\.[0-9A-F]{3})?\.html/g, '') * 1000),
          author: [{
            name: $elem.querySelector('div.author').text,
            email: $elem.querySelector('div.author').text + '.bbs@ptt.cc'
          }],
          push: push,
          link: BASE_URL + url,
        };

        if (row.title === '') {
          debug('title empty, skip!');
          return;
        }

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
  return request.get(link).then(html => getArticlesFromHtml(html));
}

module.exports = {
  getArticlesFromLink,
  getArticlesFromHtml,
};
