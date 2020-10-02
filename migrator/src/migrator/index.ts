import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {filter, map} from 'rxjs/operators';
import {AngularParseUtils} from './angular-parse.utils';
import {FileUtils} from './file.utils';

export function migrator(_options: any): Rule {

  return (tree: Tree, _context: SchematicContext) => {

    const enI18n = AngularParseUtils.parseXlfFile('src/i18n/messages.en.xlf', tree);
    const plI18n = AngularParseUtils.parseXlfFile('src/i18n/messages.pl.xlf', tree);

    FileUtils.findFiles('src/**/*.html')
      .pipe(
        map(filePath => AngularParseUtils.parseTemplateFile(filePath, tree)),
        filter(parsedFile => parsedFile.parseStatus === 'SUCCESS')
      )
      .subscribe(parsedFile => {
        console.log(parsedFile);
      });

    // const locoTranslateFiles = initializeLocoFiles();
    //
    // for (let file of files) {
    //   for (let messageId of Object.keys(file.i18nElements)) {
    //     const translationElement = translations[messageId];
    //     const i18nElement = i18nElements[messageId];
    //
    //     const translationKey = prepareTranslationKey(messageId);
    //     for (const lang of translationElement.langs) {
    //       locoTranslateFiles[lang][translationKey] = prepareTranslationContent(translationElement[lang]);
    //     }
    //
    //     updateTemplate(i18nElement, translationKey);
    //   }
    // }


    return tree;
  };

}

export interface LocoTranslateFile {
  lang: string;
  entries: LocoTranslateEntries;
}

export interface LocoTranslateEntries {
  [key: string]: string;
}
