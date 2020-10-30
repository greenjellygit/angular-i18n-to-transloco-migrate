import {ParsedFile} from '../angular-parse.utils';
import {FileUtils} from '../file.utils';
import {CssEncapsulationRemover} from './css-encapsulation-remover/css-encapsulation-remover';

export class StyleMigrator {

  public updateStyleFile(parsedFile: ParsedFile) {
    const styleFilePath = ['scss', 'css']
        .map(extType => parsedFile.filePath.split('.html')[0] + `.${extType}`)
        .filter(filePath => FileUtils.isFileExists(filePath));

    if (styleFilePath.length > 0) {
      const cssEncapsulationRemover: CssEncapsulationRemover = new CssEncapsulationRemover();
      const styleFileContent = FileUtils.loadFile(styleFilePath[0]);
      const updatedStyleFile = cssEncapsulationRemover.remove(styleFileContent, parsedFile.i18nMap);
      if (updatedStyleFile !== styleFileContent) {
        FileUtils.writeToFile(updatedStyleFile, styleFilePath[0]);
      }
    }
  }

}
