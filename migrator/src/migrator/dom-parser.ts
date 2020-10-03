import {JSDOM} from 'jsdom';


function parseFile(parsedTemplate: any) {
  /*  const fileDom = cheerio.load(FileUtils.loadFile(parsedTemplate.filePath), {
      xmlMode: true,
      decodeEntities: false
    });*/
}

function parseTemplateFile(filePath: string, dom: JSDOM, regex: RegExp): ParsedTemplateFile {
  const i18nTags = [];

  for (const htmlElement of Array.from(dom.window.document.body.querySelectorAll('*'))) {
    const attributes = Array.from(htmlElement.attributes);
    for (const attr of attributes) {
      if (regex.test(attr.name)) {
        i18nTags.push(parseI18nTag(dom, htmlElement, attr));
      }
    }
  }

  return {
    filePath,
    i18nTags
  };
}

function parseI18nTag(dom: JSDOM, htmlElement: Element, attr: Attr): I18nTag {
  const startIndex = dom.nodeLocation(htmlElement).startOffset + htmlElement.outerHTML.indexOf(attr.name);
  const length = !!attr.value ? `${attr.name}="${attr.value}"`.length : attr.name.length;

  return {
    name: attr.name,
    value: attr.value,
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
  htmlElement: Element;
  startIndex: number;
  length: number;
  hasHtml?: boolean;
  hasInterpolation?: boolean;
  hasPlural?: boolean;
  hasSelect?: boolean;
}
