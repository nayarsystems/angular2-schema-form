import { AtomicProperty } from './atomicproperty';

export class StringProperty extends AtomicProperty {

  fallbackValue() {
    return '';
  }

  public _hasValue(): boolean {
    return true;
  }

}
