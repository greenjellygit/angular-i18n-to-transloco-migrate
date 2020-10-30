import {WorkspaceProject, WorkspaceSchema} from '@angular-devkit/core/src/experimental/workspace';
import {SchematicsException} from '@angular-devkit/schematics';
import * as fs from 'fs';
import {AngularParseUtils} from '../angular-parse.utils';
import {ParsedLocaleConfig} from '../trans-loco.utils';

export class ConfigurationReader {

  private config: WorkspaceSchema;

  constructor() {
    this.readProjectConfig();
  }

  public getLocales(): ParsedLocaleConfig {
    const localesConfig = this.getDefaultProject().i18n.locales as any;
    return Object.keys(localesConfig).map(name => ({
      lang: name,
      filePath: localesConfig[name].translation,
      bundle: AngularParseUtils.parseXlfFile(localesConfig[name].translation)
    })).reduce((json, value) => {
      json[value.lang] = value;
      return json;
    }, {});
  }

  private getDefaultProject(): WorkspaceProject {
    return this.config.projects[this.config.defaultProject];
  }

  private readProjectConfig(): void {
    const workspaceConfig = fs.readFileSync('angular.json');
    if (!workspaceConfig) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }
    this.config = JSON.parse(workspaceConfig.toString());
  }

}
