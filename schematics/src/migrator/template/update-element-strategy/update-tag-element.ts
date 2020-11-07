import {SourceBounds, TemplateElementMessage, TemplateMessage} from '../../angular/template-message-visitor';
import {MessageUtils} from '../../message/message.utils';
import {StringUtils} from '../../utils/string.utils';
import {UpdateElementStrategy} from './base/update-element.strategy';

export class UpdateTagElement implements UpdateElementStrategy {

  update(templateContent: string, templateMessage: TemplateMessage, sourceBounds: SourceBounds): string {
    const templateElementMessage = templateMessage as TemplateElementMessage;
    const tagContent = this.prepareTagContent(templateElementMessage);
    return StringUtils.insertLeft(templateContent, templateElementMessage.hasHtml ? sourceBounds.startOffset - 1 : sourceBounds.startOffset, tagContent);
  }

  private prepareTagContent(templateElementMessage: TemplateElementMessage): string {
    const params = MessageUtils.mapPlaceholdersToTranslocoParams(templateElementMessage.placeholders);
    if (templateElementMessage.hasHtml) {
      return ` [innerHtml]="'${templateElementMessage.key.asText()}' | transloco${params}"`;
    } else {
      return `{{'${templateElementMessage.key.asText()}' | transloco${params ? params + ' ' : ''}}}`;
    }
  }

}
