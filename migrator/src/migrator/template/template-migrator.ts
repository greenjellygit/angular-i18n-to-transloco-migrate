import {AngularParseUtils, TemplateElement} from '../angular-parse.utils';
import {MessageUtils, TranslationKey} from '../message/message.utils';
import {ParsedPlaceholdersMap} from '../message/placeholder-parser';
import {StringUtils} from '../string.utils';
import {UpdateElementStrategyBuilder} from './update-element-strategy/base/update-element.strategy-builder';
import jsBeautify = require('js-beautify');

export class TemplateMigrator {

  public migrate(translationKey: TranslationKey, templateElement: TemplateElement, parsedPlaceholdersMap: ParsedPlaceholdersMap, templateContent: string): string {
    const sourceBounds = MessageUtils.getSourceBounds(templateElement.message);
    templateContent = StringUtils.remove(templateContent, sourceBounds.startOffset, sourceBounds.endOffset - sourceBounds.startOffset);
    const updateElementStrategyBuilder = new UpdateElementStrategyBuilder();
    const updateElementStrategy = updateElementStrategyBuilder.createStrategy(templateElement.type);
    return updateElementStrategy.update(templateContent, translationKey, templateElement, parsedPlaceholdersMap, sourceBounds);
  }

  public removeI18nTags(templateContent: string): string {
    const i18nAttributes = AngularParseUtils.findI18nAttributes(templateContent);
    for (const attr of i18nAttributes) {
      templateContent = StringUtils.removeRange(templateContent, attr.sourceSpan.start.offset, attr.sourceSpan.end.offset);
      templateContent = StringUtils.removeWhitespacesAtIndex(templateContent, attr.sourceSpan.start.offset);
    }
    return jsBeautify.html(templateContent, {wrap_attributes: 'preserve-aligned', indent_size: 2});
  }

}
