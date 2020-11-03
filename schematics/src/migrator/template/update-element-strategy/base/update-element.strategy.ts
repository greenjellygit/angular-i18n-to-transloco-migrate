import {TemplateMessage} from '../../../angular/template-message-visitor';
import {SourceBounds} from '../../../message/message.utils';

export abstract class UpdateElementStrategy {

  abstract update(templateContent: string, templateMessage: TemplateMessage, sourceBounds: SourceBounds): string;

}
