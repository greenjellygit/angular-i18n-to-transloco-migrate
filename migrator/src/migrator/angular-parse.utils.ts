import {Tree} from '@angular-devkit/schematics';
import {DEFAULT_INTERPOLATION_CONFIG, HtmlParser, ParseTreeResult, visitAll} from '@angular/compiler';
import {computeDigest} from '@angular/compiler/src/i18n/digest';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import * as html from '@angular/compiler/src/ml_parser/ast';
import {I18nMetaVisitor} from '@angular/compiler/src/render3/view/i18n/meta';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {Xliff1TranslationParser} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xliff1_translation_parser';

export class AngularParseUtils {

  public static parseXlfFile(filePath: string, tree: Tree): ParsedTranslationBundle {
    const parser = new Xliff1TranslationParser();
    return parser.parse(filePath, tree.read(filePath).toString());
  }

  public static parseTemplateFile(filePath: string, tree: Tree): ParsedFile {
    try {
      const i18nMap = AngularParseUtils.retrieveI18nMap(filePath, tree.read(filePath).toString());
      return {filePath, i18nMap, parseStatus: 'SUCCESS'};
    } catch (a) {
      console.warn('Cannot parse file: ' + filePath);
      return {filePath, i18nMap: null, parseStatus: 'ERROR'};
    }
  }

  private static retrieveI18nMap(filePath: string, fileContent: string): I18nMap {
    const treeWithI18n = this.parseAsTreeWithI18n(filePath, fileContent);
    const i18nMessages: I18nMap = {};
    this.recursiveSearch(treeWithI18n.rootNodes, i18nMessages);
    return i18nMessages;
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
        const message = element.i18n as Message;
        message.id = this.getMessageId(message);
        i18nMap[message.id] = {message, name: element.name};
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
  [key: string]: MessageWithName;
}

export interface MessageWithName {
  message: Message;
  name: string;
}

export interface ParsedFile {
  filePath: string;
  i18nMap: I18nMap;
  parseStatus: 'ERROR' | 'SUCCESS';
}
