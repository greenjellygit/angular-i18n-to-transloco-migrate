import {glob} from 'glob';
import {Observable, ReplaySubject} from 'rxjs';

export class FileUtils {

  static findFiles(pattern: string): Observable<string> {
    const subject: ReplaySubject<string> = new ReplaySubject<string>();
    glob(pattern, {}, (_er, files) => {
      for (const file of files) {
        subject.next(file);
      }
    });
    return subject.asObservable();
  }

}
