import {TemplateElementMessage, TemplateMessage} from '../../angular/template-message-visitor';
import {SourceBounds} from '../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../message/placeholder-parser';
import {StringUtils} from '../../utils/string.utils';
import {UpdateElementStrategy} from './base/update-element.strategy';

export class UpdateTagElement implements UpdateElementStrategy {

  update(templateContent: string, templateMessage: TemplateMessage, sourceBounds: SourceBounds): string {
    const templateElementMessage = templateMessage as TemplateElementMessage;
    const tagContent = this.prepareTagContent(templateElementMessage);
    return StringUtils.insertLeft(templateContent, templateElementMessage.hasHtml ? sourceBounds.startOffset - 1 : sourceBounds.startOffset, tagContent);
  }

  private prepareTagContent(templateElementMessage: TemplateElementMessage): string {
    const params = this.mapPlaceholdersToTranslocoParams(templateElementMessage.placeholders);
    if (templateElementMessage.hasHtml) {
      return ` [innerHtml]="'${templateElementMessage.key.asText()}' | transloco${params}"`;
    } else {
      return `{{'${templateElementMessage.key.asText()}' | transloco${params ? params + ' ' : ''}}}`;
    }
  }

  private mapPlaceholdersToTranslocoParams(parsedPlaceholdersMap: ParsedPlaceholdersMap): string {
    const paramsArray: any[] = Object.entries(parsedPlaceholdersMap)
      .map(e => ({name: e[0], placeholder: e[1]}))
      .filter(e => e.name.startsWith('INTERPOLATION') || e.name.startsWith('VAR_SELECT') || e.name.startsWith('VAR_PLURAL'))
      .map((e) => ({[`${e.placeholder.variableName}`]: e.placeholder.expression}));

    const paramsObject = paramsArray.reduce((result, current) => Object.assign(result, current), {});

    return paramsArray.length === 0 ? '' : ':' + JSON.stringify(paramsObject)
      .replace(/\"/g, '')
      .replace(/\:/g, ': ')
      .replace(/,/g, ', ');
  }

}
