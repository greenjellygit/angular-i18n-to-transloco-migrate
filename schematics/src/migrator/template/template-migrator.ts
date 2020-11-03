import {HtmlParser, ParseTreeResult} from '@angular/compiler';
import * as html from '@angular/compiler/src/ml_parser/ast';
import {TemplateMessage} from '../angular/template-message-visitor';
import {MessageInfo, MessageUtils} from '../message/message.utils';
import {StringUtils} from '../utils/string.utils';
import {UpdateElementStrategyBuilder} from './update-element-strategy/base/update-element.strategy-builder';
import jsBeautify = require('js-beautify');

export class TemplateMigrator {

  private updateElementStrategyBuilder = new UpdateElementStrategyBuilder();
  private migrationInfos: MessageInfo[] = [];

  public migrate(templateMessage: TemplateMessage, templateContent: string): string {
    this.migrationInfos.push(MessageUtils.analyzeMessage(templateMessage));
    const sourceBounds = MessageUtils.getSourceBounds(templateMessage.message);
    templateContent = StringUtils.remove(templateContent, sourceBounds.startOffset, sourceBounds.endOffset - sourceBounds.startOffset);
    const updateElementStrategy = this.updateElementStrategyBuilder.createStrategy(templateMessage);
    return updateElementStrategy.update(templateContent, templateMessage, sourceBounds);
  }

  public removeI18nAttributes(templateContent: string): string {
    const i18nAttributes = this.findI18nAttributes(templateContent);
    for (const attr of i18nAttributes) {
      templateContent = StringUtils.removeRange(templateContent, attr.sourceSpan.start.offset, attr.sourceSpan.end.offset);
      templateContent = StringUtils.removeWhitespacesAtIndex(templateContent, attr.sourceSpan.start.offset);
    }
    return jsBeautify.html(templateContent, {wrap_attributes: 'preserve-aligned', indent_size: 2});
  }

  public getSummary(): MessageInfo[] {
    return this.migrationInfos;
  }

  private findI18nAttributes(fileContent: string): html.Attribute[] {
    const parser = new HtmlParser();
    const tree = parser.parse(fileContent, '');
    return this.findAttributesByName(tree, /i18n-?/);
  }

  private findAttributesByName(tree: ParseTreeResult, pattern: RegExp): html.Attribute[] {
    const foundAttributes: html.Attribute[] = [];
    this.searchAttributeRecursive(tree.rootNodes, pattern, foundAttributes);
    return foundAttributes
      .sort((a, b) => b.sourceSpan.start.offset - a.sourceSpan.start.offset);
  }

  private searchAttributeRecursive(nodes: html.Node[], pattern: RegExp, foundAttributes: html.Attribute[]): void {
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

}
