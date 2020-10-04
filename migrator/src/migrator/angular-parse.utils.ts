import {DEFAULT_INTERPOLATION_CONFIG, HtmlParser, ParseTreeResult, visitAll} from '@angular/compiler';
import {computeDigest} from '@angular/compiler/src/i18n/digest';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import * as html from '@angular/compiler/src/ml_parser/ast';
import {I18nMetaVisitor} from '@angular/compiler/src/render3/view/i18n/meta';
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
    const treeWithI18n = this.parseAsTreeWithI18n(filePath, fileContent);
    const i18nMessages: I18nMap = {};
    this.recursiveSearch(treeWithI18n.rootNodes, i18nMessages);
    return this.sortByPosition(i18nMessages);
  }

  private static sortByPosition(i18nMessages: I18nMap) {
    return Object.entries(i18nMessages)
      .sort(([, a], [, b]) => b.startCol - a.startCol)
      .sort(([, a], [, b]) => b.startLine - a.startLine)
      .reduce((r, [k, v]) => ({...r, [k]: v}), {});
  }

  private static parseAsTreeWithI18n(filePath: string, fileContent: string): ParseTreeResult {
    const htmlParser = new HtmlParser();
    const parseResult = htmlParser.parse(fileContent, filePath, {tokenizeExpansionForms: true});
    const visitor = new I18nMetaVisitor(DEFAULT_INTERPOLATION_CONFIG, false);
    return new ParseTreeResult(visitAll(visitor, parseResult.rootNodes), parseResult.errors);
  }

  private static getMessageId(element: Message) {
    return element.customId || computeDigest(element as Message);
  }

  private static recursiveSearch(rootNodes: html.Node[], i18nMap: I18nMap) {
    for (const node of rootNodes) {
      const element = node as html.Element;
      if (!!element.i18n) {
        const type = element.constructor.name === 'Attribute' ? 'ATTR' : 'TAG';
        const message = element.i18n as Message;
        const source = element.sourceSpan.start;
        message.id = this.getMessageId(message);
        i18nMap[message.id] = {message, name: element.name, type, startCol: source.col, startLine: source.line};
      }
      if (!!element.children) {
        this.recursiveSearch(element.children, i18nMap);
      }
      if (!!element.attrs) {
        this.recursiveSearch(element.attrs, i18nMap);
      }
    }
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
}

export interface ParsedFile {
  filePath: string;
  i18nMap: I18nMap;
  content: string;
  parseStatus: 'ERROR' | 'SUCCESS';
}
