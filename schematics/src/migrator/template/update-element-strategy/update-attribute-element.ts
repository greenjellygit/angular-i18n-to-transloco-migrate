import {TemplateAttrMessage, TemplateMessage} from '../../angular/template-message-visitor';
import {SourceBounds} from '../../message/message.utils';
import {StringUtils} from '../../utils/string.utils';
import {UpdateElementStrategy} from './base/update-element.strategy';

export class UpdateAttributeElement implements UpdateElementStrategy {

  update(templateContent: string, templateMessage: TemplateMessage, sourceBounds: SourceBounds): string {
    const templateAttrMessage = templateMessage as TemplateAttrMessage;
    const tagContent = `[${templateAttrMessage.attrName}]="'${templateMessage.key.asText()}' | transloco"`;
    return StringUtils.insertLeft(templateContent, sourceBounds.startOffset, tagContent);
  }

}
