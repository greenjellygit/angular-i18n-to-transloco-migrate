import * as fs from 'fs';
import {glob} from 'glob';
import * as path from 'path';

export class FileUtils {

  static findFiles(pattern: string): string[] {
    return glob.sync(pattern, {});
  }

  public static writeToFile(json: any, filePath: string): void {
    const directoryName = path.dirname(filePath);
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
    }
    const fileContent = JSON.stringify(json, null, 2);
    fs.writeFileSync(filePath, fileContent, 'utf8');
  }

}
