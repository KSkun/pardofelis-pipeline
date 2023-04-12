export class EditorUtil {
  static drawField(func: any, label: string, inputValue: any, inputCallback: any): boolean {
    if (func(label, inputValue)) {
      inputCallback(inputValue);
      return true;
    }
    return false;
  }
}