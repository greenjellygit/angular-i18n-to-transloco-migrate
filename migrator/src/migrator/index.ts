import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {map} from 'rxjs/operators';
import {AngularParseUtils, I18nMap} from './angular-parse.utils';
import {FileUtils} from './file.utils';

export function migrator(_options: any): Rule {

  return (tree: Tree, _context: SchematicContext) => {
    FileUtils.findFiles('src/**/*.html')
      .pipe(
        map(paths => parseFiles(paths, tree))
      )
      .subscribe(parsedFiles => {
        console.log(parsedFiles.length);
      });
    return tree;
  };

  function parseFiles(paths: string[], tree: Tree) {
    const parsedFiles: ParsedFile[] = [];
    for (const filePath of paths) {
      try {
        const i18nMap = AngularParseUtils.retrieveI18nMap(filePath, tree.read(filePath).toString());
        parsedFiles.push({filePath, i18nMap, parseStatus: 'SUCCESS'});
      } catch (a) {
        parsedFiles.push({filePath, i18nMap: null, parseStatus: 'ERROR'});
        console.log('Cannot parse file: ' + filePath);
      }
    }
    return parsedFiles;
  }

}

export interface ParsedFile {
  filePath: string;
  i18nMap: I18nMap;
  parseStatus: 'ERROR' | 'SUCCESS';
}
