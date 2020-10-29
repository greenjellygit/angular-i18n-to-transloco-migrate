import {parse, stringify} from 'scss-parser';
import {ParsedFile} from '../angular-parse.utils';
import {FileUtils} from '../file.utils';
const createQueryWrapper = require('query-ast');

export class CssDeEncapsulator {

  public updateStyleFile(parsedFile: ParsedFile) {
    const styleFilePath = ['.scss', '.css']
      .map(fileType => parsedFile.filePath.split('.html')[0] + fileType)
      .filter(filePath => FileUtils.isFileExists(filePath))[0];

    const classessToEncapsule = Object.values(parsedFile.i18nMap)
      .map(value => value.classes)
      .reduce((x, y) => x.concat(y), []);

    if (!!styleFilePath && classessToEncapsule.length > 0) {
      const styleFileContent = FileUtils.loadFile(styleFilePath);
      const updatedContent = this.encapsulateClasses(styleFileContent, [...new Set(classessToEncapsule)]);
      FileUtils.writeToFile(updatedContent, styleFilePath);
    }
  }

  private encapsulateClasses(styleFileContent: string, classesToEncapsulation): string {
    const astCss = parse(this.addMissingSemicolons(styleFileContent));
    const $ = createQueryWrapper(astCss);

    classesToEncapsulation.forEach(className => {
      const parentSelector = this.getSelectorByClassName($, className);
      if (parentSelector.nodes.length > 0 && !this.hasHostAndDeepSelectors(parentSelector)) {
        const selectorElements = parentSelector.nodes[0].node.value;
        selectorElements.unshift(this.createSelector('space', ' '));
        selectorElements.unshift(this.createSelector('pseudo_class', ':ng-deep'));
        selectorElements.unshift(this.createSelector('space', ' '));
        selectorElements.unshift(this.createSelector('pseudo_class', 'host'));
      }
    });

    return stringify(astCss);
  }

  private getSelectorByClassName($, className: string) {
    return $((n) => n.node.value === className)
      .closest('selector');
  }

  private hasHostAndDeepSelectors($): boolean {
    return $
      .has(e => e.node.value === 'host')
      .has(e => e.node.value === 'ng-deep').nodes.length > 0;
  }

  private createSelector = (type: string, value: string) => ({type, value: [{type: 'identifier', value}]});

  private addMissingSemicolons(cssContent: string): string {
    return cssContent.replace(/(^[^}]\s+[^/]\S+:.+)([^/{\r\n;,])$/gm, '$1$2;');
  }

}
