import {TemplateElement} from '../angular-parse.utils';
import {ParsedPlaceholdersMap, SourceBounds, TranslationKey} from '../index';
import {StringUtils} from '../string.utils';
import {UpdateElementStrategy} from './base/update-element.strategy';

export class UpdateAttributeElement implements UpdateElementStrategy {

  update(templateContent: string, translationKey: TranslationKey, templateElement: TemplateElement, parsedPlaceholdersMap: ParsedPlaceholdersMap, sourceBounds: SourceBounds): string {
    const tagContent = `[${templateElement.name}]="'${translationKey.group}.${translationKey.id}' | transloco"`;
    return StringUtils.insertLeft(templateContent, sourceBounds.startOffset, tagContent);
  }

}
