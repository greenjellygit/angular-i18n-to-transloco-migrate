import {WorkspaceProject, WorkspaceSchema} from '@angular-devkit/core/src/experimental/workspace';
import {SchematicsException} from '@angular-devkit/schematics';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {Xliff1TranslationParser} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xliff1_translation_parser';
import * as fs from 'fs';
import {ParsedLocaleConfig} from '../transloco/transloco-writer';

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
      bundle: this.parseXlfFile(localesConfig[name].translation)
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

  private parseXlfFile(filePath: string): ParsedTranslationBundle {
    const parser = new Xliff1TranslationParser();
    return parser.parse(filePath, fs.readFileSync(filePath).toString());
  }

}
