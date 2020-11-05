import {logging} from '@angular-devkit/core';
import {ParsedLocaleConfig} from '../angular/configuration-reader';
import {ParsedFile} from '../angular/template-parser';
import {MessageInfo} from '../message/message.utils';
import {GenerateTranslationSummary, MissingTranslationError} from '../translation/placeholder-filler/placeholder-filler';
import {ArrayUtils} from '../utils/array.utils';

export class Logger {

  private readonly startTime;

  constructor(private logger: logging.LoggerApi) {
    this.startTime = process.hrtime();
  }

  public printTranslationSummary(generateTranslationSummaries: GenerateTranslationSummary[]): void {
    const errors = generateTranslationSummaries
      .filter(value => value.error)
      .map(value => value.error);

    if (errors.length > 0) {
      this.logger.warn('Warning - Missing translations:');
      const groupedByLocale = ArrayUtils.groupByKey(errors, 'locale');
      Object.keys(groupedByLocale).forEach((locale) => {
        this.logger.info(`    Locale: ${locale}`);
        Object.values(groupedByLocale[locale]).forEach((e: MissingTranslationError, index) => {
          this.logger.info(`        ${index + 1}. ${e.translationKey.asText()}`);
        });
      });
    } else {
      this.logger.info('Success - All translations generated');
    }
  }

  public printMigrationSummary(migrationInfo: MessageInfo[]): void {
    const needsManualChangesElements = migrationInfo.filter(value => value.needsManualChanges);
    if (needsManualChangesElements.length > 0) {
      this.logger.warn('Warning - Not supported attributes in translations:');
      needsManualChangesElements.forEach((value, index) => {
        this.logger.info(`    ${index + 1}. ${value.translationKey.asText()}: ${value.notMigrateElements.join(', ')}`);
      });
    } else {
      this.logger.info('Success - All templates migrated');
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

  public printMigrationTime(): void {
    const precision = 0;
    const elapsed = process.hrtime(this.startTime)[1] / 1000000;
    this.logger.info('Successful finished after: ' + process.hrtime(this.startTime)[0] + 's ' + elapsed.toFixed(precision) + 'ms');
  }

  private analyzeTemplatesMessages(parsedFiles: ParsedFile[]): MessagesStats {
    const filesWithI18n = parsedFiles.filter(value => value.templateMessages.length > 0);
    const messagesCount = filesWithI18n.reduce((previousValue, currentValue) => previousValue += currentValue.templateMessages.length, 0);
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
