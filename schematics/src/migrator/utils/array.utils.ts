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

  public static flatten(arrayOfArrays: any[]): any[] {
    return arrayOfArrays.reduce((flat, subElem) => flat.concat(Array.isArray(subElem) ? this.flatten(subElem) : subElem), []);
  }

}

declare global {
  interface Array<T> {
    flat(selector): T;
  }
}

interface Array<T> {
  flat(selector): T;
}

Array.prototype.flat = function(selector): any[] {
  return this.reduce((prev, next) => (selector(prev) || prev).concat(selector(next)), []);
};
