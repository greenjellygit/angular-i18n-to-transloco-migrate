export class ArrayUtils {

  public static isNotEmpty(array: any[]): boolean {
    return !!array && Array.isArray(array) && array.length > 0;
  }

  public static isEmpty(array: any[]): boolean {
    return !array || !Array.isArray(array) || array.length === 0;
  }

  public static groupByKey<T>(list: T[], key: keyof T, omitKey = false): {[key: string]: T[]} {
    return list.reduce((hash: T, {[key]: value, ...rest}) => ({
      ...hash,
      [value as any]: (hash[value as any] || []).concat(omitKey ? {...rest} : {[key]: value, ...rest})
    }), {});
  }

  public static removeDuplicatesByProperty<T>(array: T[], property: keyof T): T[] {
    return array.reduce((unique, o) => {
      if (!unique.some(obj => obj[property] === o[property])) {
        unique.push(o);
      }
      return unique;
    }, []);
  }

  public static propToKey<T>(array: T[], keyProp: keyof T): {[key: string]: T} {
    return array.reduce((obj, value) => {
      obj[value[keyProp as string]] = value;
      return obj;
    }, {} as {[key: string]: T});
  }

}

declare global {
  interface Array<T> {
    flat(selector): T;
  }
}

Array.prototype.flat = function(selector): any[] {
  return this.reduce((prev, next) => (selector(prev) || prev).concat(selector(next)), []);
};
