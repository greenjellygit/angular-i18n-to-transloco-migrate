import {DEFAULT_INTERPOLATION_CONFIG, parseTemplate} from '@angular/compiler';
import {computeDigest} from '@angular/compiler/src/i18n/digest';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
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
    try {
      const i18nMap = AngularParseUtils.retrieveI18nMap(filePath, content);
      return {filePath, i18nMap, content, parseStatus: 'SUCCESS'};
    } catch (a) {
      console.warn('Cannot parse file: ' + filePath);
      return {filePath, i18nMap: null, content, parseStatus: 'ERROR'};
    }
  }

  private static retrieveI18nMap(filePath: string, fileContent: string): I18nMap {
    const template = parseTemplate(fileContent, filePath, {interpolationConfig: DEFAULT_INTERPOLATION_CONFIG, preserveWhitespaces: true, leadingTriviaChars: []});
    const i18nMessages: I18nMap = {};
    this.recursiveSearch(template.nodes, i18nMessages);
    return this.sortByPosition(i18nMessages);
  }

  private static sortByPosition(i18nMessages: I18nMap) {
    return Object.entries(i18nMessages)
      .sort(([, a], [, b]) => b.startCol - a.startCol)
      .sort(([, a], [, b]) => b.startLine - a.startLine)
      .reduce((r, [k, v]) => ({...r, [k]: v}), {});
  }

  private static getMessageId(element: Message) {
    return element.customId || computeDigest(element as Message);
  }

  private static recursiveSearch(rootNodes: Node[], i18nMap: I18nMap) {
    for (const node of rootNodes) {
      const element = node as Element;
      if (!!element.i18n && element.i18n.constructor.name === 'Message') {
        const type = element.constructor.name === 'TextAttribute' ? 'ATTR' : 'TAG';
        const message = element.i18n as Message;
        const source = element.sourceSpan.start;
        message.id = this.getMessageId(message);

        const hasHtml = Object.keys(message.placeholders).some(placeholder => placeholder.startsWith('START_'));
        const hasInterpolation = message.placeholders.hasOwnProperty('INTERPOLATION');
        const hasICU = this.hasICU(element);
        const classes = Object.values(message.placeholders)
          .filter(e => e.includes('class=')).map(e => {
            return e.match(/class="(.*?)"/g)
              .map(k => k.replace('class=', '').replace(/"/g, '').split(' '))
              .reduce((x, y) => x.concat(y), []); })
          .reduce((x, y) => x.concat(y), []);

        i18nMap[message.id] = {
          message,
          name: element.name,
          type,
          startCol: source.col,
          startLine: source.line,
          hasHtml,
          hasInterpolation,
          hasICU,
          classes
        };
      }

      if (!!element.children) {
        if (!this.hasICU(element)) {
          this.recursiveSearch(element.children, i18nMap);
        } else if (!!element.i18n) {
          Object.values(element.i18n['placeholderToMessage']).forEach((icuMessage: Message) => {
            icuMessage.id = this.getMessageId(icuMessage);
          });
        }
      }

      if (!!element.attributes) {
        this.recursiveSearch(element.attributes, i18nMap);
      }
    }
  }

  private static hasICU(value: Element) {
    return value.i18n && value.i18n['placeholderToMessage'] && value.i18n['placeholderToMessage'].hasOwnProperty('ICU');
  }
}

export interface I18nMap {
  [key: string]: TemplateElement;
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
  i18nMap: I18nMap;
  content: string;
  parseStatus: 'ERROR' | 'SUCCESS';
}
