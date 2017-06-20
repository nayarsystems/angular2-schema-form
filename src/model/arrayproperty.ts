import { FormProperty, PropertyGroup } from './formproperty';
import { FormPropertyFactory } from './formpropertyfactory';
import { SchemaValidatorFactory } from '../schemavalidatorfactory';
import { ValidatorRegistry } from './validatorregistry';

export class ArrayProperty extends PropertyGroup {

  constructor(
    private formPropertyFactory: FormPropertyFactory,
    schemaValidatorFactory: SchemaValidatorFactory,
    validatorRegistry: ValidatorRegistry,
    schema: any,
    parent: PropertyGroup,
    path: string
  ) {
    super(schemaValidatorFactory, validatorRegistry, schema, parent, path);
  }

  addItem(value: any = null): FormProperty {
    let newPropSchema: any = {type: "string", widget:{id:"string"}};
    if (this.schema.items instanceof Array) {
      let items: Array<Object> = this.schema.items;
      let props = (<FormProperty[]>this.properties);
      if (props.length >= items.length) {
        return null;
      }
      newPropSchema = items[props.length];
    } else if (this.schema.items instanceof Object) {
      newPropSchema = this.schema.items;
    }

    let newProperty = this.addProperty(newPropSchema);
    newProperty.reset(value, false);
    return newProperty;
  }

  private addProperty(schema: any) {
    let newProperty = this.formPropertyFactory.createProperty(schema, this);
    (<FormProperty[]>this.properties).push(newProperty);
    return newProperty;
  }

  removeItem(index: number) {
    (<FormProperty[]>this.properties).splice(index, 1);
    this.updateValueAndValidity(false, true);
  }

  setValue(value: any, onlySelf: boolean) {
    this.createProperties();
    this.resetProperties(value);
    this.updateValueAndValidity(onlySelf, true);
  }

  public _updateValue() {
    this.reduceValue();
  }

  private reduceValue(): void {
    let value = [];
    this.forEachChild((property, _) => {
      if (property.visible) {
        value.push(property.value);
      }
    });
    this._value = value;
  }

  reset(value: any, onlySelf = true) {
    if (value) {
      let me: any = this;
      me._modelValue = value;
    }
    value = value || this.schema.default || [];
    this.properties = [];
    this.resetProperties(value);
    this.updateValueAndValidity(onlySelf, true);
  }

  private createProperties() {
    this.properties = [];
  }

  private resetProperties(value: any) {
    for (let idx in value) {
      if (value.hasOwnProperty(idx)) {
        let property = this.addItem(value[idx]);
        if (property != null) {
          //property.reset(value[idx], true);
          let prop: any = property;
          prop._modelValue = value[idx];
        }
      }
    }
  }

}
