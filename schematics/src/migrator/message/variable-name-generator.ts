export class VariableNameGenerator {

  private readonly MAX_VARIABLE_LENGTH = 25;
  private readonly MIN_WORD_LENGTH_TO_STRIP_CONSONANTS = 8;
  private readonly MAX_CONSONANTS_IN_STRIPPED_WORD = 3;

  public generate(expression: string): string {

    let variableName = expression
      .replace(/[_.'-+)(\]\[]+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/[A-Z][a-z]/g, $1 => ' ' + $1)
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/ (.)/g, $1 => $1.toUpperCase())
      .replace(/(^\d)/g, $1 => 'var' + $1)
      .replace(/\s+/g, '')
      .replace(/^\S/g, $1 => $1.toLowerCase());

    // strip words to n-th consonant
    if (variableName.length > this.MAX_VARIABLE_LENGTH) {
      variableName = variableName
        .replace(/([A-Z]+)/g, $1 => ' ' + $1)
        .split(' ')
        .map(e => e.length > this.MIN_WORD_LENGTH_TO_STRIP_CONSONANTS ? this.removeAfterConsonant(e, this.MAX_CONSONANTS_IN_STRIPPED_WORD) : e)
        .join(' ')
        .replace(/\s+/g, '');
    }

    // remove duplicated words
    if (variableName.length > this.MAX_VARIABLE_LENGTH) {
      variableName = variableName
        .replace(/([A-Z]+)/g, $1 => ' ' + $1)
        .split(' ')
        .filter((item, i, allItems) => i === allItems.indexOf(item))
        .join(' ')
        .replace(/\s+/g, '');
    }

    // cut text
    if (variableName.length > this.MAX_VARIABLE_LENGTH) {
      variableName = variableName
        .substring(0, this.MAX_VARIABLE_LENGTH)
        .replace(/[A-Z][a-z]*$/, '');
    }
    return variableName;
  }

  private removeAfterConsonant(text: string, maxConsonants: number): string {
    let consonantCount = 0;
    let result = '';
    for (const char of text) {
      if (!'aeoiuy'.includes(char)) {
        consonantCount++;
      }
      result += char;
      if (consonantCount >= maxConsonants) {
        return result;
      }
    }
    return result;
  }

}
