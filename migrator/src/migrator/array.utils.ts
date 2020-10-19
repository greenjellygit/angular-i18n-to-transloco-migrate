export class ArrayUtils {

  public static isNotEmpty(array: any[]): boolean {
    return !!array && Array.isArray(array) && array.length > 0;
  }

  public static removeDuplicates(array: any[], byPropertyName): any[] {
    return array.filter((e, index, self) =>
      index === self.findIndex((t) => (
        t[byPropertyName] === e[byPropertyName]
      ))
    );
  }

}
