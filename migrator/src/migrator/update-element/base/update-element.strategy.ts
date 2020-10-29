import {TemplateElement} from '../../angular-parse.utils';
import {ParsedPlaceholdersMap, SourceBounds, TranslationKey} from '../../index';

export abstract class UpdateElementStrategy {

  abstract update(templateContent: string, translationKey: TranslationKey, templateElement: TemplateElement, parsedPlaceholdersMap: ParsedPlaceholdersMap, sourceBounds: SourceBounds): string;

}
