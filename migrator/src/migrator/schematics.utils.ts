import {WorkspaceSchema} from '@angular-devkit/core/src/experimental/workspace';
import {SchematicsException} from '@angular-devkit/schematics';
import * as fs from 'fs';
import {AngularParseUtils} from './angular-parse.utils';

export class SchematicsUtils {

  public static readProjectConfig(): WorkspaceSchema {
    const workspaceConfig = fs.readFileSync('angular.json');
    if (!workspaceConfig) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }
    const workspaceContent = workspaceConfig.toString();
    return JSON.parse(workspaceContent);
  }

  public static getDefaultProjectLocales() {
    const config = SchematicsUtils.readProjectConfig();
    const localesConfig = config.projects[config.defaultProject].i18n.locales as any;
    return Object.keys(localesConfig).map(name => ({
      lang: name,
      filePath: localesConfig[name].translation,
      bundle: AngularParseUtils.parseXlfFile(localesConfig[name].translation)
    }));
  }

}
