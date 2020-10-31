import {logging} from '@angular-devkit/core';
import {ParsedFile} from '../angular/template-parser';
import {ArrayUtils} from '../utils/array.utils';
import {MessageInfo} from '../message/message.utils';
import {GenerateTranslationSummary, MissingTranslationError} from '../translation/placeholder-filler/placeholder-filler';
import {ParsedLocaleConfig} from '../transloco/transloco-writer';

export class Logger {

  constructor(private logger: logging.LoggerApi) { }

  public printErrors(generateTranslationSummaries: GenerateTranslationSummary[], migrationInfo: MessageInfo[]) {
    const errors = generateTranslationSummaries
      .filter(value => value.error)
      .map(value => value.error);

    if (errors.length > 0) {
      this.logger.warn('Warning - Missing translations:');
      const groupedByLocale = ArrayUtils.groupByKey(errors, 'locale');
      Object.keys(groupedByLocale).forEach((locale) => {
        this.logger.info(`    Locale: ${locale}`);
        Object.values(groupedByLocale[locale]).forEach((e: MissingTranslationError, index) => {
          this.logger.info(`        ${index + 1}. ${e.translationKey.group}.${e.translationKey.id}`);
        });
      });
    }

    const needsManualChangesElements = migrationInfo.filter(value => value.needsManualChanges);
    if (needsManualChangesElements.length > 0) {
      this.logger.warn('Warning - Not supported attributes in translations:');
      needsManualChangesElements.forEach((value, index) => {
        this.logger.info(`    ${index + 1}. ${value.translationKey.group}.${value.translationKey.id}: ${value.notMigrateElements.join(', ')}`);
      });
    }
  }

  public printTemplatesStats(parsedFiles: ParsedFile[], localeConfigs: ParsedLocaleConfig): void {
    const stats = this.analyzeTemplatesMessages(parsedFiles);
    this.logger.info(`Found locales: ${Object.keys(localeConfigs).join(', ')}`);
    this.logger.info('Statistics of templates:');
    this.logger.info(`    - Total templates: ${stats.totalFiles}`);
    this.logger.info(`    - Templates to migrate: ${stats.filesWithI18n}`);
    this.logger.info(`    - Total messages: ${stats.messagesCount}`);
  }

  public printMigrationTime(start: [number, number]) {
    const precision = 0;
    const elapsed = process.hrtime(start)[1] / 1000000;
    this.logger.info('Successful finished after: ' + process.hrtime(start)[0] + 's ' + elapsed.toFixed(precision) + 'ms');
  }

  private analyzeTemplatesMessages(parsedFiles: ParsedFile[]): MessagesStats {
    const filesWithI18n = parsedFiles.filter(value => value.templateElements.length > 0);
    const messagesCount = filesWithI18n.reduce((previousValue, currentValue) => previousValue += currentValue.templateElements.length, 0);
    return {
      totalFiles: parsedFiles.length,
      filesWithI18n: filesWithI18n.length,
      messagesCount
    };
  }

}

interface MessagesStats {
  totalFiles: number;
  filesWithI18n: number;
  messagesCount: number;
}
