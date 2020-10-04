import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {FileUtils} from './file.utils';

export class TransLocoUtils {

  public static initializeLocoFiles(localeConfig: ParsedLocaleConfig): TransLocoFile[] {
    return Object.values(localeConfig).map(value => ({fileName: `${value.lang}.json`, lang: value.lang, entries: {}}));
  }

  public static saveTransLocoFiles(directoryPath: string, transLocoFiles: TransLocoFile[]): void {
    for (const file of transLocoFiles) {
      FileUtils.writeJsonToFile(file.entries, directoryPath + file.fileName);
    }
  }

}

export interface TransLocoFile {
  fileName: string;
  lang: string;
  entries: TransLocoEntries;
}

export interface TransLocoEntries {
  [group: string]: JsonKey;
}

export interface JsonKey {
  [key: string]: string;
}

export interface ParsedLocaleConfig {
  [lang: string]: LocaleConfig;
}

export interface LocaleConfig {
  lang: string;
  filePath: string;
  bundle: ParsedTranslationBundle;
}
