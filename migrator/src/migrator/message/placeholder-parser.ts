import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ObjectUtils} from '../utils/object.utils';
import {VariableGenerator} from './variable-generator';

export class PlaceholderParser {

  private variableGenerator: VariableGenerator = new VariableGenerator();

  public parse(message: Message): ParsedPlaceholdersMap {
    const placeholders = this.collectPlaceholders(message);
    const parsedPlaceholdersMap: ParsedPlaceholdersMap = {};
    const variableIndex: { [variableName: string]: number } = {};

    for (const placeholder of placeholders) {
      if (!!parsedPlaceholdersMap[placeholder.name]) {
        continue;
      }

      const expressionWithoutInterpolation = this.removeInterpolation(placeholder.expression);
      let variableName = this.variableGenerator.generateFromExpression(expressionWithoutInterpolation);

      const differentExpressionSameVariableName = Object.values(parsedPlaceholdersMap)
        .some(e => e.variableName === variableName && e.expression !== expressionWithoutInterpolation);
      if (differentExpressionSameVariableName) {
        variableIndex[variableName] = variableIndex[variableName] == null ? 1 : variableIndex[variableName]++;
        variableName += variableIndex[variableName];
      }

      parsedPlaceholdersMap[placeholder.name] = {
        variableName,
        rawExpression: placeholder.expression,
        expression: expressionWithoutInterpolation
      };
    }

    return parsedPlaceholdersMap;
  }

  private collectPlaceholders(message: Message): { name: string, expression: string }[] {
    let placeholders = Object.entries(message.placeholders)
      .map(e => ({name: e[0], expression: e[1]}));

    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      Object.values(message.placeholderToMessage).forEach(icuMessage => {
        placeholders = [...placeholders, ...this.collectPlaceholders(icuMessage)];
      });
    }

    return placeholders;
  }

  private removeInterpolation(expression: string): string {
    const stripInterpolationRegex = /(?<={{)(.*?)(?=}})/;
    if (stripInterpolationRegex.test(expression)) {
      expression = expression.match(stripInterpolationRegex)[0];
    }
    return expression;
  }

}

export interface ParsedPlaceholdersMap {
  [name: string]: ParsedPlaceholder;
}

export interface ParsedPlaceholder {
  expression: string;
  rawExpression: string;
  variableName: string;
}
