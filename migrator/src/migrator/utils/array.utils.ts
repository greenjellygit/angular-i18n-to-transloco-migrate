export class ArrayUtils {

  public static isNotEmpty(array: any[]): boolean {
    return !!array && Array.isArray(array) && array.length > 0;
  }

  public static groupByKey(list, key, omitKey = false) {
    return list.reduce((hash, {[key]: value, ...rest}) => ({
      ...hash,
      [value]: (hash[value] || []).concat(omitKey ? {...rest} : {[key]: value, ...rest})
    }), {});
  }

}
