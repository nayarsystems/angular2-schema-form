import { FormProperty, PropertyGroup } from './formproperty';
import { FormPropertyFactory } from './formpropertyfactory';
import { SchemaValidatorFactory } from '../schemavalidatorfactory';
import { ValidatorRegistry } from './validatorregistry';

export class ObjectProperty extends PropertyGroup {

  public propertiesId: string[]= [];

  constructor(private formPropertyFactory: FormPropertyFactory,
              schemaValidatorFactory: SchemaValidatorFactory,
              validatorRegistry: ValidatorRegistry,
              schema: any,
              parent: PropertyGroup,
              path: string) {
    super(schemaValidatorFactory, validatorRegistry, schema, parent, path);
    this.createProperties();
  }

  setValue(value: any, onlySelf: boolean) {
    for (const propertyId in value) {
      if (value.hasOwnProperty(propertyId)) {
        this.properties[propertyId].setValue(value[propertyId], true);
      }
    }
    this.updateValueAndValidity(onlySelf, true);
  }

  addProperty(propertyId: string): boolean {
    let newProperty = this.addProp(propertyId);
    if (newProperty) {
      newProperty.reset(null, false);
      return true;
    }
    return false;
  }

  private addProp(propId: string) {
    if (this.schema.additionalProperties) {
      if (!(propId in this.properties)) {
        if (this.schema.additionalProperties instanceof Boolean) {
          let newProperty = this.formPropertyFactory.createProperty({type: 'string', widget: {id: 'string'}}, this, propId);
          (<FormProperty[]>this.properties)[propId] = newProperty;
          this.propertiesId.push(propId);
          return newProperty;
        } else {
          let sch = this.schema.additionalProperties;
          sch["widget"] = {id: sch.type};
          let newProperty = this.formPropertyFactory.createProperty(sch, this, propId);
          (<FormProperty[]>this.properties)[propId] = newProperty;
          this.propertiesId.push(propId);
          return newProperty;
        }
      }
    }
    return null;
  }

  delProperty(propertyId: string) {
    this.delProp(propertyId);
    this.updateValueAndValidity(false, true);
  }

  private delProp(propId: string) {
    if (this.schema.additionalProperties) {
      if (propId in this.properties) {
        delete (<FormProperty[]>this.properties)[propId];
        let index: number = this.propertiesId.indexOf(propId);
        if (index !== -1) {
          this.propertiesId.splice(index, 1);
        }
      }
    }
  }

  reset(value: any, onlySelf = true) {
    if (value) {
      let me: any = this;
      me._modelValue = value;
    }
    value = value || this.schema.default || {};
    this.resetProperties(value);
    this.updateValueAndValidity(onlySelf, true);
  }

  resetProperties(value: any) {
    for (let prop in this.properties) {
      if (prop in value) {
        this.properties[prop].reset(value[prop], false);
        let p: any = this.properties[prop];
        p._modelValue = value[prop];
      } else {
        this.properties[prop].reset(value[prop], false);
        this.delProp(prop);
      }
    }
    for (let propertyId in value) {
      let newProperty = this.addProp(propertyId);
      if (newProperty) {
        newProperty.reset(value[propertyId], false);
      }
    }
    this.updateValueAndValidity(false, true);
  }

  createProperties() {
    this.properties = {};
    this.propertiesId = [];
    for (const propertyId in this.schema.properties) {
      if (this.schema.properties.hasOwnProperty(propertyId)) {
        let propertySchema = this.schema.properties[propertyId];
        if (!("widget" in propertySchema)) {
            propertySchema["widget"] = { id: propertySchema.type };
        }
        let property = this.formPropertyFactory.createProperty(propertySchema, this, propertyId);
        this.properties[propertyId] = property;
        this.propertiesId.push(propertyId);
      }
    }
  }

  public _hasValue(): boolean {
    return !!Object.keys(this.value).length;
  }

  public _updateValue() {
    this.reduceValue();
  }

  public _runValidation() {
    super._runValidation();

    if (this._errors) {
      this._errors.forEach(error => {
        const prop = this.searchProperty(error.path.slice(1));
        if (prop) {
          prop.extendErrors(error);
        }
      });
    }
  }

  private reduceValue(): void {
    const value = {};
    this.forEachChild((property, propertyId: string) => {
      if (property.visible && property._hasValue()) {
        value[propertyId] = property.value;
      }
    });
    this._value = value;
  }
}
