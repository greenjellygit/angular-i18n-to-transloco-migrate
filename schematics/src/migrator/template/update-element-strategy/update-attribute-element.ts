import {TemplateAttrMessage, TemplateMessage} from '../../angular/template-message-visitor';
import {SourceBounds, TranslationKey} from '../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../message/placeholder-parser';
import {StringUtils} from '../../utils/string.utils';
import {UpdateElementStrategy} from './base/update-element.strategy';

export class UpdateAttributeElement implements UpdateElementStrategy {

  update(templateContent: string, translationKey: TranslationKey, templateMessage: TemplateMessage, parsedPlaceholdersMap: ParsedPlaceholdersMap, sourceBounds: SourceBounds): string {
    const templateAttrMessage = templateMessage as TemplateAttrMessage;
    const tagContent = `[${templateAttrMessage.attrName}]="'${translationKey.group}.${translationKey.id}' | transloco"`;
    return StringUtils.insertLeft(templateContent, sourceBounds.startOffset, tagContent);
  }

}
