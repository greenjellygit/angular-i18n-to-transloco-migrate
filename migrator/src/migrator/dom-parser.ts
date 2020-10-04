import * as cheerio from 'cheerio';
import {JSDOM} from 'jsdom';
import {FileUtils} from './file.utils';

export class DomParser {

  public static parseFile(filePath: string): CheerioStatic {
    return cheerio.load(FileUtils.loadFile(filePath), {
      xmlMode: true,
      decodeEntities: false
    });
  }

}

export function parseTemplateFile(fileContent: string, attrPrefix: string): ParsedTemplateFile {
  const i18nTags = [];

  const dom = new JSDOM(fileContent, {includeNodeLocations: true});
  for (const htmlElement of Array.from(dom.window.document.body.querySelectorAll('*'))) {
    const attributes = Array.from(htmlElement.attributes);
    for (const attr of attributes) {
      if (attr.name.startsWith(attrPrefix)) {
        i18nTags.push(parseI18nTag(dom, htmlElement, attr));
      }
    }
  }

  return {
    filePath: 'asd',
    i18nTags: i18nTags.sort((a, b) => b.startIndex - a.startIndex)
  };
}

function parseI18nTag(dom: JSDOM, htmlElement: Element, attr: Attr): I18nTag {
  const startIndex = dom.nodeLocation(htmlElement).startOffset + htmlElement.outerHTML.indexOf(attr.name);
  const length = !!attr.value ? `${attr.name}="${attr.value}"`.length : attr.name.length;

  return {
    name: attr.name,
    value: attr.value,
    original: !!attr.value ? `${attr.name}="${attr.value}"` : `${attr.name} `,
    htmlElement,
    startIndex,
    length
  };
}

// 1. Sparsować wszystkie pliki html z listą I18nTag dla tagów które mają
// 2. Przygotować listę tłumaczeń {id, target} na podstawie plików xlf
// 3. Dla każego obiektu z I18nTag zaktualizować html w pliku template


interface ParsedTemplateFile {
  filePath: string;
  i18nTags: I18nTag[];
}

interface I18nTag {
  id?: string;
  name: string;
  value: string;
  original: string;
  htmlElement: Element;
  startIndex: number;
  length: number;
  hasHtml?: boolean;
  hasInterpolation?: boolean;
  hasPlural?: boolean;
  hasSelect?: boolean;
}
