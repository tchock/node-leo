#!/usr/bin/env node

 const parser = require('fast-xml-parser');
const fetch = require('node-fetch');
const AsciiTable = require('ascii-table')

function queryLeo(langCode, query) {
  const table = new AsciiTable();

  function addEntryToTable(entry) {
    table.addRow(entry.side[0].words.word, entry.side[1].words.word);
  }

  function handleSectionEntry(item) {
    if (Array.isArray(item.entry)) {
      item.entry.map(addEntryToTable)
    } else {
      addEntryToTable(item.entry);
    }
  }

  fetch(`https://dict.leo.org/dictQuery/m-vocab/${langCode}de/query.xml?lp=${langCode}de&lang=de&search=${query}&side=both&order=basic&partial=show&sectLenMax=16&n=1&filtered=-1&trigger=`)
    .then(res => res.text())
    .then(res => parser.parse(res))
    .then(res => {
      if (Array.isArray(res.xml.sectionlist.section)) {
        return res.xml.sectionlist.section.map(handleSectionEntry)
      } else {
        return handleSectionEntry(res.xml.sectionlist.section);
      }
    })
    .then(() => console.log(table.toString()))
}

const [,,lang,...queryArr] = process.argv;
const query = queryArr.join(' ');
queryLeo(lang, query);
