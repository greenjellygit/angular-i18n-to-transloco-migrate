import {WorkspaceProject, WorkspaceSchema} from '@angular-devkit/core/src/experimental/workspace';
import {SchematicsException} from '@angular-devkit/schematics';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {Xliff1TranslationParser} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xliff1_translation_parser';
import {MessageId, ParsedTranslation} from '@angular/localize/src/utils';
import * as fs from 'fs';
import {ArrayUtils} from '../utils/array.utils';

export class ConfigurationReader {

  private config: WorkspaceSchema;

  constructor() {
    this.readProjectConfig();
  }

  public getLocales(): ParsedLocaleConfig {
    const i18nFiles = this.getI18nFiles();

    if (ArrayUtils.isEmpty(i18nFiles)) {
      throw new SchematicsException('Cannot found any i18n file in project');
    }

    const parsedLocales: LocaleConfig[] = i18nFiles
      .map(file => ({lang: file.locale, filePath: file.path, translations: this.parseXlfFile(file.path).translations}));

    return ArrayUtils.propToKey(parsedLocales, 'lang');
  }

  private getDefaultProject(): WorkspaceProject {
    return this.config.projects[this.config.defaultProject];
  }

  private readProjectConfig(): void {
    const workspaceConfig = fs.readFileSync('angular.json');
    if (!workspaceConfig) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }
    this.config = JSON.parse(this.removeComments(workspaceConfig.toString()));
  }

  private removeComments(workspaceConfig: string): string {
    return workspaceConfig
      .replace(/((["'])(?:\\[\s\S]|.)*?\2|\/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/)|\/\/.*?$|\/\*[\s\S]*?\*\//gm, '$1');
  }

  private parseXlfFile(filePath: string): ParsedTranslationBundle {
    const parser = new Xliff1TranslationParser();
    return parser.parse(filePath, fs.readFileSync(filePath).toString());
  }

  private getI18nFiles(): I18nFile[] {
    const project = this.getDefaultProject();

    const foundI18nFiles: I18nFile[] = [];

    this.findInBuildOptions(project, foundI18nFiles);
    this.findInI18nLocales(project, foundI18nFiles);
    this.findInBuildConfigurations(project, foundI18nFiles);

    return ArrayUtils.removeDuplicatesByProperty(foundI18nFiles, 'path');
  }

  private findInBuildOptions(project: WorkspaceProject, i18nFiles: I18nFile[]): void {
    if (!!project?.architect?.build?.options?.i18nFile) {
      const configuration = project?.architect?.build?.options as AngularJsonBuildConfiguration;
      i18nFiles.push({path: configuration.i18nFile, locale: configuration.i18nLocale});
    }
  }

  private findInBuildConfigurations(project: WorkspaceProject, i18nFiles: I18nFile[]): void {
    if (!!project?.architect?.build?.configurations) {
      const files: I18nFile[] = Object.values(project?.architect?.build?.configurations)
        .filter((entry: AngularJsonBuildConfiguration) => !!entry.i18nFile)
        .map((entry: AngularJsonBuildConfiguration) => ({locale: entry.i18nLocale, path: entry.i18nFile}));
      i18nFiles.push(...files);
    }
  }

  private findInI18nLocales(project: WorkspaceProject, i18nFiles: I18nFile[]): void {
    if (!!project?.i18n?.locales) {
      const files: I18nFile[] = Object.entries(project.i18n.locales as any as AngularJsonLocaleConfiguration)
        .map(([locale, config]: [string, AngularJsonLocale]) => ({locale, path: config.translation}));
      i18nFiles.push(...files);
    }
  }

}

export interface I18nFile {
  locale: string;
  path: string;
}

export interface AngularJsonBuildConfiguration {
  i18nFile: string;
  i18nLocale: string;
}

export interface AngularJsonLocaleConfiguration {
  [locale: string]: AngularJsonLocale;
}

export interface AngularJsonLocale {
  translation: string;
}

export interface ParsedLocaleConfig {
  [lang: string]: LocaleConfig;
}

export interface LocaleConfig {
  lang: string;
  filePath: string;
  translations: Record<MessageId, ParsedTranslation>;
}

