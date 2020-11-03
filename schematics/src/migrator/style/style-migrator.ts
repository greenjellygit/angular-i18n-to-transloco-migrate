import {TemplateElementMessage} from '../angular/template-message-visitor';
import {ParsedFile} from '../angular/template-parser';
import {FileUtils} from '../utils/file.utils';
import {CssEncapsulationRemover} from './css-encapsulation-remover/css-encapsulation-remover';

export class StyleMigrator {

  private cssEncapsulationRemover: CssEncapsulationRemover = new CssEncapsulationRemover();

  public updateStyleFile(parsedFile: ParsedFile): void {
    const styleFilePath = ['scss', 'css']
        .map(extType => parsedFile.filePath.split('.html')[0] + `.${extType}`)
        .filter(filePath => FileUtils.isFileExists(filePath));

    const cssClasses = parsedFile.templateMessages
      .filter((e: TemplateElementMessage) => !!e.classes && e.classes.length > 0)
      .map((e: TemplateElementMessage) => e.classes)
      .flat(e => e);

    if (styleFilePath.length > 0 && cssClasses.length > 0) {
      const styleFileContent = FileUtils.loadFile(styleFilePath[0]);
      const updatedStyleFile = this.cssEncapsulationRemover.remove(styleFileContent, cssClasses);
      if (updatedStyleFile !== styleFileContent) {
        FileUtils.writeToFile(updatedStyleFile, styleFilePath[0]);
      }
    }
  }

}
