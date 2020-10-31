import {DEFAULT_INTERPOLATION_CONFIG, parseTemplate} from '@angular/compiler';
import {computeDigest} from '@angular/compiler/src/i18n/digest';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {Element, Node} from '@angular/compiler/src/render3/r3_ast';
import * as fs from 'fs';
import {ArrayUtils} from '../utils/array.utils';

export class TemplateParser {

  public parse(filePath: string): ParsedFile {
    const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
    const i18nMap = this.retrieveI18nMap(filePath, content);
    return {filePath, i18nMap, content, parseStatus: 'SUCCESS'};
  }

  private retrieveI18nMap(filePath: string, fileContent: string): TemplateElement[] {
    const template = parseTemplate(fileContent, filePath, {
      interpolationConfig: DEFAULT_INTERPOLATION_CONFIG,
      preserveWhitespaces: true,
      leadingTriviaChars: []
    });
    const i18nMessages: TemplateElement[] = [];
    this.recursiveSearch(template.nodes, i18nMessages);
    return this.sortByPosition(i18nMessages);
  }

  private sortByPosition(templateElements: TemplateElement[]): TemplateElement[] {
    return templateElements
      .sort((a, b) => b.startLine - a.startLine || b.startCol - a.startCol);
  }

  private getMessageId(element: Message) {
    return element.customId || computeDigest(element as Message);
  }

  private recursiveSearch(rootNodes: Node[], templateElements: TemplateElement[]) {
    for (const node of rootNodes) {
      const element = node as Element;
      if (!!element.i18n && element.i18n.constructor.name === 'Message') {
        let type: ElementType = ElementType.TAG;
        if (['TextAttribute', 'BoundAttribute'].includes(element.constructor.name)) {
          type = ElementType.ATTRIBUTE;
        }
        const message = element.i18n as Message;
        const source = message.sources[0];
        message.id = this.getMessageId(message);

        const hasHtml = Object.keys(message.placeholders).some(placeholder => placeholder.startsWith('START_') || placeholder === 'LINE_BREAK');
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

      if (ArrayUtils.isNotEmpty(element.attributes)) {
        this.recursiveSearch(element.attributes, templateElements);
      }

      if (ArrayUtils.isNotEmpty(element.inputs)) {
        this.recursiveSearch(element.inputs, templateElements);
      }
    }
  }

  private hasICU(value: Element): boolean {
    return value.i18n && value.i18n['placeholderToMessage'] && value.i18n['placeholderToMessage'].hasOwnProperty('ICU');
  }

}

export enum ElementType {
  ATTRIBUTE,
  TAG
}

export interface TemplateElement {
  message: Message;
  name: string;
  startLine: number;
  startCol: number;
  type: ElementType;
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
