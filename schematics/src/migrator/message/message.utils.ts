import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ArrayUtils} from '../utils/array.utils';
import {ObjectUtils} from '../utils/object.utils';
import {StringUtils} from '../utils/string.utils';

export class MessageUtils {

  public static prepareTranslationKey(messageId: string): TranslationKey {
    const customGroups = ['component', 'filters', 'common.errors', 'common-headers', 'common-errors', 'common-buttons', 'common.buttons', 'common-placeholders', 'common.placeholders', 'common'];
    const group = customGroups.find(g => messageId.indexOf(g + '.') !== -1);
    const idParts = messageId.split(group + '.');

    if (!!idParts && idParts.length === 2) {
      return {id: StringUtils.underscore(idParts[1]), group: StringUtils.underscore(idParts[0] + group)};
    } else {
      return {id: StringUtils.underscore(messageId), group: 'no_group'};
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

  public static analyzeMessage(message: Message, translationKey: TranslationKey): MessageInfo {
    const notMigrateElements = this.findNonMigratableAttributes(message);
    return {
      translationKey,
      notMigrateElements,
      needsManualChanges: notMigrateElements.length > 0
    };
  }

  private static findNonMigratableAttributes(message: Message): string[] {
    let notMigrateElements = [];

    if (ArrayUtils.isNotEmpty(message.nodes)) {
      message.nodes.forEach(node => {
        if (ObjectUtils.isNotEmpty(node['attrs'])) {
          Object.keys(node['attrs'])
            .filter(attrName => attrName.startsWith('*') || attrName.startsWith('[') || attrName.startsWith('(') || (attrName !== attrName.toLowerCase()))
            .forEach(attrName => {
              notMigrateElements.push(attrName);
            });
        }
      });
    }

    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      Object.values(message.placeholderToMessage)
        .forEach(icuMessage => {
          notMigrateElements = [...notMigrateElements, ...this.findNonMigratableAttributes(icuMessage)];
        });
    }

    return notMigrateElements;
  }

}

export interface TranslationKey {
  id: string;
  group: string;
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
