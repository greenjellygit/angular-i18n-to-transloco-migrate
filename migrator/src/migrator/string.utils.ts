import {underscore} from '@angular-devkit/core/src/utils/strings';

export class StringUtils {

  public static underscore(text: string): string {
    return underscore(
      text.replace(/\//g, '_')
        .replace(/\./g, '_')
    );
  }

  public static remove(text: string, startIndex: number, length: number) {
    return text.slice(0, startIndex) + text.slice(startIndex + length, text.length);
  }

  public static removeRange(text: string, fromIndex: number, toIndex: number) {
    return text.slice(0, fromIndex) + text.slice(toIndex, text.length);
  }

  public static removeWhitespacesAtIndex(text: string, index: number) {
    let leftPart = text.substring(0, index);
    let rightPart = text.substring(index - 1, text.length);

    leftPart = leftPart.replace(/\s*$/g, '');
    rightPart = rightPart.replace(/^\s*/g, ' ');

    return leftPart + rightPart;
  }

  public static insertLeft(text: string, startIndex: number, textToInsert: string) {
    return [text.slice(0, startIndex), textToInsert, text.slice(startIndex)].join('');
  }

  public static prepareVariableName(expression: string): string {
    const MAX_VARIABLE_LENGTH = 25;
    const MAX_WORD_LENGTH_TO_NOT_STRIP_CONSONANTS = 8;
    const MAX_CONSONANTS_IN_STRIPPED_WORD = 3;

    let variableName = expression
      .replace(/[_.'-+)(\]\[]+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/[A-Z][a-z]/g, $1 => ' ' + $1)
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/ (.)/g, $1 => $1.toUpperCase())
      .replace(/(^\d)/g, $1 => 'var' + $1)
      .replace(/\s+/g, '')
      .replace(/^\S/g, $1 => $1.toLowerCase());

    // strip words to n-th consonant
    if (variableName.length > MAX_VARIABLE_LENGTH) {
      variableName = variableName
        .replace(/([A-Z]+)/g, $1 => ' ' + $1)
        .split(' ')
        .map(e => e.length > MAX_WORD_LENGTH_TO_NOT_STRIP_CONSONANTS ? this.removeAfterConsonant(e, MAX_CONSONANTS_IN_STRIPPED_WORD) : e)
        .join(' ')
        .replace(/\s+/g, '');
    }

    // remove duplicated words
    if (variableName.length > MAX_VARIABLE_LENGTH) {
      variableName = variableName
        .replace(/([A-Z]+)/g, $1 => ' ' + $1)
        .split(' ')
        .filter((item, i, allItems) => i === allItems.indexOf(item))
        .join(' ')
        .replace(/\s+/g, '');
    }

    // cut text
    if (variableName.length > MAX_VARIABLE_LENGTH) {
      variableName = variableName
        .substring(0, MAX_VARIABLE_LENGTH)
        .replace(/[A-Z][a-z]*$/, '');
    }
    return variableName;
  }

  private static removeAfterConsonant(text: string, maxConsonants: number): string {
    let consonantCount = 0;
    let result = '';
    for (const char of text) {
      if (!'aeoiuy'.includes(char)) {
        consonantCount++;
      }
      result += char;
      if (consonantCount >= maxConsonants) {
        return result;
      }
    }
    return result;
  }

}
