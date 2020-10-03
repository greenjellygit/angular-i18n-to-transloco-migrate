import {underscore} from '@angular-devkit/core/src/utils/strings';

export class StringUtils {

  public static underscore(text: string): string {
    return underscore(
      text.replace(/\//g, '_')
        .replace(/\./g, '_')
    );
  }

}
