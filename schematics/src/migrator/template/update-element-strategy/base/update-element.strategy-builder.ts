import {TemplateAttrMessage, TemplateElementMessage, TemplateMessage} from '../../../angular/template-message-visitor';
import {UpdateAttributeElement} from '../update-attribute-element';
import {UpdateTagElement} from '../update-tag-element';
import {UpdateElementStrategy} from './update-element.strategy';

export class UpdateElementStrategyBuilder {

  public createStrategy(elementType: TemplateMessage): UpdateElementStrategy {
    switch (elementType.constructor.name) {
      case TemplateAttrMessage.name:
        return new UpdateAttributeElement();
      case TemplateElementMessage.name:
        return new UpdateTagElement();
      default:
        throw new Error('Not supported template message');
    }
  }

}
