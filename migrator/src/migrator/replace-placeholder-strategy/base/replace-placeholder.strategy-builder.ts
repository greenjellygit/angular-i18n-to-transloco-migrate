import {ReplacePlaceholderStrategy} from './replace-placeholder.strategy';
import {ReplaceDefaultPlaceholder} from '../replace-default-placeholder';
import {ReplaceIcuPlaceholder} from '../replace-icu-placeholder';
import {ReplaceInterpolationPlaceholder} from '../replace-interpolation-placeholder';
import {ReplaceVariablePlaceholder} from '../replace-variable-placeholder';

export class ReplacePlaceholderStrategyBuilder {

  public createStrategy(placeholder: string): ReplacePlaceholderStrategy {
    const placeholderType = placeholder.replace(/_\d+/g, '');
    switch (placeholderType) {
      case 'INTERPOLATION':
        return new ReplaceInterpolationPlaceholder(placeholder);
      case 'ICU':
        return new ReplaceIcuPlaceholder(placeholder);
      case 'VAR_SELECT':
      case 'VAR_PLURAL':
        return new ReplaceVariablePlaceholder(placeholder);
      default:
        return new ReplaceDefaultPlaceholder(placeholder);
    }
  }

}
