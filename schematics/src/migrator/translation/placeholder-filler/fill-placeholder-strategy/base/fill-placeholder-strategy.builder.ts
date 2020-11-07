import {FillPlaceholderStrategy} from './fill-placeholder.strategy';
import {FillHtmlPlaceholder} from '../fill-html-placeholder';
import {FillIcuPlaceholder} from '../fill-icu-placeholder';
import {FillInterpolationPlaceholder} from '../fill-interpolation-placeholder';
import {FillVariablePlaceholder} from '../fill-variable-placeholder';

export class FillPlaceholderStrategyBuilder {

  public createStrategy(placeholder: string): FillPlaceholderStrategy {
    const placeholderType = placeholder.replace(/_\d+/g, '');
    switch (placeholderType) {
      case 'INTERPOLATION':
        return new FillInterpolationPlaceholder(placeholder);
      case 'ICU':
        return new FillIcuPlaceholder(placeholder);
      case 'VAR_SELECT':
      case 'VAR_PLURAL':
        return new FillVariablePlaceholder(placeholder);
      default:
        return new FillHtmlPlaceholder(placeholder);
    }
  }

}
