export class ObjectUtils {

  public static isNotEmpty(object: any): boolean {
    return !!object && Object.keys(object).length > 0;
  }

}
