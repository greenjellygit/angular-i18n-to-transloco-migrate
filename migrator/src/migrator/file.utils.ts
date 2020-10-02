import {glob} from 'glob';
import {fromPromise} from 'rxjs/internal-compatibility';

export class FileUtils {

  static findFiles(pattern: string) {
    return fromPromise(new Promise<string[]>((resolve) => {
      glob(pattern, {}, (_er, files) => {
        resolve(files);
      });
    }));
  }

}
