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

  public static insertLeft(text: string, startIndex: number, textToInsert: string) {
    return [text.slice(0, startIndex), textToInsert, text.slice(startIndex)].join('');
  }

}
