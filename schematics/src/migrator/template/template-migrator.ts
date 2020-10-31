import {HtmlParser, ParseTreeResult} from '@angular/compiler';
import * as html from '@angular/compiler/src/ml_parser/ast';
import {TemplateMessage} from '../angular/template-message-visitor';
import {MessageUtils, TranslationKey} from '../message/message.utils';
import {ParsedPlaceholdersMap} from '../message/placeholder-parser';
import {StringUtils} from '../utils/string.utils';
import {UpdateElementStrategyBuilder} from './update-element-strategy/base/update-element.strategy-builder';
import jsBeautify = require('js-beautify');

export class TemplateMigrator {

  private updateElementStrategyBuilder = new UpdateElementStrategyBuilder();

  public migrate(translationKey: TranslationKey, templateMessage: TemplateMessage, parsedPlaceholdersMap: ParsedPlaceholdersMap, templateContent: string): string {
    const sourceBounds = MessageUtils.getSourceBounds(templateMessage.message);
    templateContent = StringUtils.remove(templateContent, sourceBounds.startOffset, sourceBounds.endOffset - sourceBounds.startOffset);
    const updateElementStrategy = this.updateElementStrategyBuilder.createStrategy(templateMessage);
    return updateElementStrategy.update(templateContent, translationKey, templateMessage, parsedPlaceholdersMap, sourceBounds);
  }

  public removeI18nTags(templateContent: string): string {
    const i18nAttributes = this.findI18nAttributes(templateContent);
    for (const attr of i18nAttributes) {
      templateContent = StringUtils.removeRange(templateContent, attr.sourceSpan.start.offset, attr.sourceSpan.end.offset);
      templateContent = StringUtils.removeWhitespacesAtIndex(templateContent, attr.sourceSpan.start.offset);
    }
    return jsBeautify.html(templateContent, {wrap_attributes: 'preserve-aligned', indent_size: 2});
  }

  private findI18nAttributes(fileContent: string): html.Attribute[] {
    const parser = new HtmlParser();
    const tree = parser.parse(fileContent, '');
    return this.findAttributesByName(tree, /i18n-?/);
  }

  private findAttributesByName(tree: ParseTreeResult, pattern: RegExp) {
    const foundAttributes: html.Attribute[] = [];
    this.searchAttributeRecursive(tree.rootNodes, pattern, foundAttributes);
    return foundAttributes
      .sort((a, b) => b.sourceSpan.start.offset - a.sourceSpan.start.offset);
  }

  private searchAttributeRecursive(nodes: html.Node[], pattern: RegExp, foundAttributes: html.Attribute[]) {
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
