import {TemplateElement} from '../../../angular-parse.utils';
import {SourceBounds, TranslationKey} from '../../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../../message/placeholder-parser';

export abstract class UpdateElementStrategy {

  abstract update(templateContent: string, translationKey: TranslationKey, templateElement: TemplateElement, parsedPlaceholdersMap: ParsedPlaceholdersMap, sourceBounds: SourceBounds): string;

}
