import {ParsedFile} from '../angular/template-parser';
import {FileUtils} from '../utils/file.utils';
import {CssEncapsulationRemover} from './css-encapsulation-remover/css-encapsulation-remover';

export class StyleMigrator {

  private cssEncapsulationRemover: CssEncapsulationRemover = new CssEncapsulationRemover();

  public updateStyleFile(parsedFile: ParsedFile) {
    const styleFilePath = ['scss', 'css']
        .map(extType => parsedFile.filePath.split('.html')[0] + `.${extType}`)
        .filter(filePath => FileUtils.isFileExists(filePath));

    if (styleFilePath.length > 0) {
      const styleFileContent = FileUtils.loadFile(styleFilePath[0]);
      const updatedStyleFile = this.cssEncapsulationRemover.remove(styleFileContent, parsedFile.templateElements);
      if (updatedStyleFile !== styleFileContent) {
        FileUtils.writeToFile(updatedStyleFile, styleFilePath[0]);
      }
    }
  }

}
