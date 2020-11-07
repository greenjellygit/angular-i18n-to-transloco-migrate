import {Message, Node} from '@angular/compiler/src/i18n/i18n_ast';
import {TemplateMessage} from '../angular/template-message-visitor';
import {ArrayUtils} from '../utils/array.utils';
import {ObjectUtils} from '../utils/object.utils';
import {TranslationKey} from './message.utils';

export class MessageAnalyzer {

  public analyze(templateMessage: TemplateMessage, selectorPrefix: string): MessageInfo {
    const notMigrateElements = this.findNonMigrateElements(templateMessage.message, selectorPrefix);
    return {
      translationKey: templateMessage.key,
      notMigrateElements,
      needsManualChanges: notMigrateElements.length > 0
    };
  }

  private findNonMigrateElements(message: Message, selectorPrefix: string): string[] {
    const notMigrateElements: string[] = [];

    if (ArrayUtils.isNotEmpty(message.nodes)) {
      const nodesElements = this.analyzeNodes(message.nodes);
      notMigrateElements.push(...nodesElements);
    }

    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      const placeholderToMessageElements = this.analyzePlaceholderToMessage(message.placeholderToMessage, selectorPrefix);
      notMigrateElements.push(...placeholderToMessageElements);
    }

    if (ObjectUtils.isNotEmpty(message.placeholders)) {
      const placeholderElements = this.analyzePlaceholders(message.placeholders, selectorPrefix);
      notMigrateElements.push(...placeholderElements);
    }

    return [...new Set([...notMigrateElements])];
  }

  private analyzeNodes(nodes: Node[]): string[] {
    return nodes
      .filter(node => ObjectUtils.isNotEmpty(node['attrs']))
      .map(node => Object.keys(node['attrs']))
      .flat(e => e)
      .filter(attrName => attrName.startsWith('*') || attrName.startsWith('[') || attrName.startsWith('(') || (attrName !== attrName.toLowerCase()));
  }

  private analyzePlaceholderToMessage(placeholderToMessage: Record<string, Message>, selectorPrefix: string): string[] {
    return Object.values(placeholderToMessage)
      .map(icuMessage => this.findNonMigrateElements(icuMessage, selectorPrefix))
      .flat(element => element);
  }

  private analyzePlaceholders(placeholders: Record<string, string>, selectorPrefix: string): string[] {
    return Object.keys(placeholders)
      .map(placeholder => placeholder.toLowerCase())
      .filter(placeholder => placeholder.startsWith('start_tag'))
      .filter(selector => selector.startsWith(`start_tag_${selectorPrefix}-`) || selector.startsWith(`start_tag_mat-`))
      .map(selector => selector.split('start_tag_')[1]);
  }

}

export interface MessageInfo {
  translationKey: TranslationKey;
  notMigrateElements: string[];
  needsManualChanges: boolean;
}
