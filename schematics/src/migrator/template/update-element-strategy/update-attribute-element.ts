import {TemplateElement} from '../../angular/template-parser';
import {SourceBounds, TranslationKey} from '../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../message/placeholder-parser';
import {StringUtils} from '../../utils/string.utils';
import {UpdateElementStrategy} from './base/update-element.strategy';

export class UpdateAttributeElement implements UpdateElementStrategy {

  update(templateContent: string, translationKey: TranslationKey, templateElement: TemplateElement, parsedPlaceholdersMap: ParsedPlaceholdersMap, sourceBounds: SourceBounds): string {
    const tagContent = `[${templateElement.name}]="'${translationKey.group}.${translationKey.id}' | transloco"`;
    return StringUtils.insertLeft(templateContent, sourceBounds.startOffset, tagContent);
  }

}
