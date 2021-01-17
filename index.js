#!/usr/bin/env node

 const parser = require('fast-xml-parser');
const fetch = require('node-fetch');
const AsciiTable = require('ascii-table')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).option('cp', {
  alias: 'cp',
  type: 'boolean',
  description: 'Copy'
}).argv
const inquirer = require('inquirer');

function transformWord(word) {
  if (Array.isArray(word)) {
    return word.join('; ');
  }

  return word;
}

function queryLeo(langCode, query) {
  function transformEntry(entry) {
    const leftWord = transformWord(entry.side[0].words.word);
    const rightWord = transformWord(entry.side[1].words.word);
    return [leftWord, rightWord];
  }

  function handleSectionEntry(item) {
    if (Array.isArray(item.entry)) {
      return item.entry.map(transformEntry)
    } else {
      return [transformEntry(item.entry)];
    }
  }

  return fetch(`https://dict.leo.org/dictQuery/m-vocab/${langCode}de/query.xml?lp=${langCode}de&lang=de&search=${query}&side=both&order=basic&partial=show&sectLenMax=16&n=1&filtered=-1&trigger=`)
    .then(res => res.text())
    .then(res => parser.parse(res))
    .then(res => {
      if (Array.isArray(res.xml.sectionlist.section)) {
        return res.xml.sectionlist.section.flatMap(handleSectionEntry)
      } else {
        return [handleSectionEntry(res.xml.sectionlist.section)];
      }
    })
    
}

const lang = argv.lang || 'en';
const query = argv._.join(' ');

if(argv.cp) {
  queryLeo(lang, query).then(res => {
    inquirer.prompt({
      name: 'results',
      type: 'list',
      choices: res.map(([left, right]) => ({
        value: left,
        name: `${left} -> ${right}`,
      }))
    }).then(prompt => {
      pbcopy(prompt.results);
    });
  })
} else {
  const table = new AsciiTable();
  queryLeo(lang, query)
    .then(res => {
      return res.forEach(item => table.addRow(...item));
    })
    .then(() => console.log(table.toString()))
}

function pbcopy(data) {
  // Only works on macOS
  var proc = require('child_process').spawn('pbcopy'); 
  proc.stdin.write(data); proc.stdin.end();
}
