import {DEFAULT_INTERPOLATION_CONFIG, HtmlParser, parseTemplate, ParseTreeResult} from '@angular/compiler';
import {computeDigest} from '@angular/compiler/src/i18n/digest';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import * as html from '@angular/compiler/src/ml_parser/ast';
import {Element, Node} from '@angular/compiler/src/render3/r3_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {Xliff1TranslationParser} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xliff1_translation_parser';
import * as fs from 'fs';

export class AngularParseUtils {

  public static parseXlfFile(filePath: string): ParsedTranslationBundle {
    const parser = new Xliff1TranslationParser();
    return parser.parse(filePath, fs.readFileSync(filePath).toString());
  }

  public static parseTemplateFile(filePath: string): ParsedFile {
    const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
    const i18nMap = AngularParseUtils.retrieveI18nMap(filePath, content);
    return {filePath, i18nMap, content, parseStatus: 'SUCCESS'};
  }

  public static findI18nAttributes(fileContent: string): html.Attribute[] {
    const parser = new HtmlParser();
    const tree = parser.parse(fileContent, '');
    return this.findAttributesByName(tree, /i18n-?/);
  }

  private static findAttributesByName(tree: ParseTreeResult, pattern: RegExp) {
    const foundAttributes: html.Attribute[] = [];
    this.searchAttributeRecursive(tree.rootNodes, pattern, foundAttributes);
    return foundAttributes
      .sort((a, b) => b.sourceSpan.start.offset - a.sourceSpan.start.offset);
  }

  private static searchAttributeRecursive(nodes: html.Node[], pattern: RegExp, foundAttributes: html.Attribute[]) {
    for (const node of nodes) {
      const element = node as html.Element;
      if (!!element.attrs) {
        for (const attr of element.attrs) {
          if (pattern.test(attr.name)) {
            foundAttributes.push(attr);
          }
        }
      }
      if (!!element.children) {
        this.searchAttributeRecursive(element.children, pattern, foundAttributes);
      }
    }
  }

  private static retrieveI18nMap(filePath: string, fileContent: string): TemplateElement[] {
    const template = parseTemplate(fileContent, filePath, {
      interpolationConfig: DEFAULT_INTERPOLATION_CONFIG,
      preserveWhitespaces: true,
      leadingTriviaChars: []
    });
    const i18nMessages: TemplateElement[] = [];
    this.recursiveSearch(template.nodes, i18nMessages);
    return this.sortByPosition(i18nMessages);
  }

  private static sortByPosition(templateElements: TemplateElement[]): TemplateElement[] {
    return templateElements
      .sort((a, b) => b.startLine - a.startLine || b.startCol - a.startCol);
  }

  private static getMessageId(element: Message) {
    return element.customId || computeDigest(element as Message);
  }

  private static recursiveSearch(rootNodes: Node[], templateElements: TemplateElement[]) {
    for (const node of rootNodes) {
      const element = node as Element;
      if (!!element.i18n && element.i18n.constructor.name === 'Message') {
        const type = element.constructor.name === 'TextAttribute' ? 'ATTR' : 'TAG';
        const message = element.i18n as Message;
        const source = message.sources[0];
        message.id = this.getMessageId(message);

        const hasHtml = Object.keys(message.placeholders).some(placeholder => placeholder.startsWith('START_'));
        const hasInterpolation = message.placeholders.hasOwnProperty('INTERPOLATION');
        const hasICU = this.hasICU(element);
        const classes = Object.values(message.placeholders)
          .filter(e => e.includes('class=')).map(e => {
            return e.match(/class="(.*?)"/g)
              .map(k => k.replace('class=', '').replace(/"/g, '').split(' '))
              .reduce((x, y) => x.concat(y), []);
          })
          .reduce((x, y) => x.concat(y), []);

        const templateElement: TemplateElement = {
          message,
          name: element.name,
          type,
          startCol: source.startCol,
          startLine: source.startLine,
          hasHtml,
          hasInterpolation,
          hasICU,
          classes
        };

        const alreadyExists = templateElements.some(a => a.message.id === templateElement.message.id
          && a.startLine === templateElement.startLine
          && a.startCol === templateElement.startCol);

        if (!alreadyExists) {
          templateElements.push(templateElement);
        }
      }

      if (!!element.children) {
        if (!this.hasICU(element)) {
          this.recursiveSearch(element.children, templateElements);
        } else if (!!element.i18n) {
          Object.values(element.i18n['placeholderToMessage']).forEach((icuMessage: Message) => {
            icuMessage.id = this.getMessageId(icuMessage);
          });
        }
      }

      if (!!element.attributes) {
        this.recursiveSearch(element.attributes, templateElements);
      }
    }
  }

  private static hasICU(value: Element) {
    return value.i18n && value.i18n['placeholderToMessage'] && value.i18n['placeholderToMessage'].hasOwnProperty('ICU');
  }
}

export interface TemplateElement {
  message: Message;
  name: string;
  startLine: number;
  startCol: number;
  type: 'ATTR' | 'TAG';
  hasHtml: boolean;
  hasInterpolation: boolean;
  hasICU: boolean;
  classes: string[];
}

export interface ParsedFile {
  filePath: string;
  i18nMap: TemplateElement[];
  content: string;
  parseStatus: 'ERROR' | 'SUCCESS';
}
