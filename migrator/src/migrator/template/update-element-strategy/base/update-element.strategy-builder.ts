import {ElementType} from '../../../angular-parse.utils';
import {UpdateAttributeElement} from '../update-attribute-element';
import {UpdateTagElement} from '../update-tag-element';
import {UpdateElementStrategy} from './update-element.strategy';

export class UpdateElementStrategyBuilder {

  public createStrategy(elementType: ElementType): UpdateElementStrategy {
    switch (elementType) {
      case ElementType.ATTRIBUTE:
        return new UpdateAttributeElement();
      case ElementType.TAG:
        return new UpdateTagElement();
      default:
        throw new Error('Not supported element');
    }
  }

}
