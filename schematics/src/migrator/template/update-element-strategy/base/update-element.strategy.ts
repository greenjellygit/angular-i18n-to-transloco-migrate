import {SourceBounds, TemplateMessage} from '../../../angular/template-message-visitor';

export abstract class UpdateElementStrategy {

  abstract update(templateContent: string, templateMessage: TemplateMessage, sourceBounds: SourceBounds): string;

}
