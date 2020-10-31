import {TemplateMessage} from '../../../angular/template-message-visitor';
import {SourceBounds, TranslationKey} from '../../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../../message/placeholder-parser';

export abstract class UpdateElementStrategy {

  abstract update(templateContent: string, translationKey: TranslationKey, templateMessage: TemplateMessage, parsedPlaceholdersMap: ParsedPlaceholdersMap, sourceBounds: SourceBounds): string;

}
