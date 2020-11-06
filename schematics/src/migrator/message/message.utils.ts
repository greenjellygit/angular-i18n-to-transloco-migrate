import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import * as path from 'path';
import {TemplateMessage} from '../angular/template-message-visitor';
import {ArrayUtils} from '../utils/array.utils';
import {ObjectUtils} from '../utils/object.utils';
import {StringUtils} from '../utils/string.utils';

export class MessageUtils {

  public static prepareTranslationKey(message: Message): TranslationKey {
    return this.get(message);
    // return this.getWithCustomGroups(message);
  }

  private static get(message: Message): TranslationKey {
    const fileName = this.getFileName(message);
    return new TranslationKey(StringUtils.underscore(message.id), StringUtils.underscore(fileName));
  }

  private static getFileName(message: Message): string {
    if (!!message?.sources && !!message.sources[0] && !!message.sources[0].filePath) {
      return path.basename(message.sources[0].filePath, '.html');
    }
    return 'no_name';
  }

  private static getWithCustomGroups(message: Message): TranslationKey {
    const customGroups = ['component', 'filters', 'common.errors', 'common-headers', 'common-errors', 'common-buttons', 'common.buttons', 'common-placeholders', 'common.placeholders', 'common'];
    const group = customGroups.find(g => message.id.indexOf(g + '.') !== -1);
    const idParts = message.id.split(group + '.');

    if (!!idParts && idParts.length === 2) {
      return new TranslationKey(StringUtils.underscore(idParts[1]), StringUtils.underscore(idParts[0] + group));
    } else {
      return new TranslationKey(StringUtils.underscore(message.id), 'no_group');
    }
  }

  public static getSourceBounds(message: Message): SourceBounds {
    const bounds: number[] = message.nodes.map(e => [e.sourceSpan, e['startSourceSpan'], e['endSourceSpan']])
      .flat(e => e)
      .filter(value => !!value)
      .map(value => [value.end.offset, value.start.offset])
      .flat(e => e);
    return {startOffset: Math.min(...bounds), endOffset: Math.max(...bounds)};
  }

  public static analyzeMessage(templateMessage: TemplateMessage, selectorPrefix: string): MessageInfo {
    const notMigrateElements = this.findNonMigrateElements(templateMessage.message, selectorPrefix);
    return {
      translationKey: templateMessage.key,
      notMigrateElements,
      needsManualChanges: notMigrateElements.length > 0
    };
  }

  private static findNonMigrateElements(message: Message, selectorPrefix: string): string[] {
    let notMigrateElements = [];

    if (ArrayUtils.isNotEmpty(message.nodes)) {
      message.nodes.forEach(node => {
        if (ObjectUtils.isNotEmpty(node['attrs'])) {
          Object.keys(node['attrs'])
            .filter(attrName => attrName.startsWith('*') || attrName.startsWith('[') || attrName.startsWith('(') || (attrName !== attrName.toLowerCase()))
            .forEach(attrName => notMigrateElements.push(attrName));
        }
      });
    }

    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      Object.values(message.placeholderToMessage)
        .forEach(icuMessage => {
          notMigrateElements = [...notMigrateElements, ...this.findNonMigrateElements(icuMessage, selectorPrefix)];
        });
    }

    if (ObjectUtils.isNotEmpty(message.placeholders)) {
      Object.keys(message.placeholders)
        .map(placeholder => placeholder.toLowerCase())
        .filter(placeholder => placeholder.startsWith('start_tag'))
        .filter(selector => selector.startsWith(`start_tag_${selectorPrefix}-`) || selector.startsWith(`start_tag_mat-`))
        .forEach(selector => notMigrateElements.push(selector.split('start_tag_')[1]));
    }

    return [...new Set([...notMigrateElements])];
  }

}

export class TranslationKey {
  id: string;
  group: string;

  constructor(id: string, group: string) {
    this.id = id;
    this.group = group;
  }

  public asText(): string {
    return `${this.group}.${this.id}`;
  }
}

export interface MessageInfo {
  translationKey: TranslationKey;
  notMigrateElements: string[];
  needsManualChanges: boolean;
}

export interface SourceBounds {
  startOffset: number;
  endOffset: number;
}
