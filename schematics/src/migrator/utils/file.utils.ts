import * as fs from 'fs';
import {glob} from 'glob';
import * as path from 'path';

export class FileUtils {

  static findFiles(pattern: string): string[] {
    return glob.sync(pattern, {});
  }

  static loadFile(filePath: string): string {
    return fs.readFileSync(filePath).toString();
  }

  public static writeJsonToFile(json: any, filePath: string): void {
    const fileContent = JSON.stringify(json, null, 2);
    this.writeToFile(fileContent, filePath);
  }

  public static writeToFile(content: string, filePath: string): void {
    const directoryName = path.dirname(filePath);
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }

  public static isFileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

}
