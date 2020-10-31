import {underscore} from '@angular-devkit/core/src/utils/strings';

export class StringUtils {

  public static underscore(text: string): string {
    return underscore(
      text.replace(/\//g, '_')
        .replace(/\./g, '_')
    );
  }

  public static remove(text: string, startIndex: number, length: number): string {
    return text.slice(0, startIndex) + text.slice(startIndex + length, text.length);
  }

  public static removeRange(text: string, fromIndex: number, toIndex: number): string {
    return text.slice(0, fromIndex) + text.slice(toIndex, text.length);
  }

  public static removeWhitespacesAtIndex(text: string, index: number): string {
    let leftPart = text.substring(0, index);
    let rightPart = text.substring(index - 1, text.length);

    leftPart = leftPart.replace(/\s*$/g, '');
    rightPart = rightPart.replace(/^\s*/g, ' ');

    return leftPart + rightPart;
  }

  public static insertLeft(text: string, startIndex: number, textToInsert: string): string {
    return [text.slice(0, startIndex), textToInsert, text.slice(startIndex)].join('');
  }

  public static isBlank(text: string): boolean {
    return text != null && text?.trim()?.length === 0;
  }

}
