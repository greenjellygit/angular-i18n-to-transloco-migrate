export class ArrayUtils {

  const;

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

  public static groupByKey(list, key, omitKey = false) {
    return list.reduce((hash, {[key]: value, ...rest}) => ({
      ...hash,
      [value]: (hash[value] || []).concat(omitKey ? {...rest} : {[key]: value, ...rest})
    }), {});
  }

}
