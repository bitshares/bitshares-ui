### Validation for bitshares-ui and ant getFieldDecorator

#### Supported types of validation

**Validation.Rules.required(name: String)** - check for field to be required

**Validation.Rules.range({min: Number, max: Number, name: String})** - Check number is in range from min to max

**Validation.Rules.min(Number)** - check value to be higher than min

**Validation.Rules.min({min: Number, name: String})** - check value to be higher than min

**Validation.Rules.max(Number)** - check value to be less than max

**Validation.Rules.max({max: Number, name: String})** - check value to be less than max

**Validation.Rules.number(name: String)** - check the value to be number

**Validation.Rules.integer(name: String)** - check the value to be integer

**Validation.Rules.float(name: String)** - check the value to be float

**Validation.Rules.email(name: String)** - check the value to be email

**Validation.Rules.url(name: String)** - check the value to be url

**Validation.Rules.oneOf({list: Array, name: String})** - check the value to be one of items in list

"name" it is a variable if you want to display specific name of field. 

For e.g. rule like: **Validation.Rules.required()** will display the following error message: **"The field is required"**.

For the following code: **Validation.Rules.required("Username")** the error message will be **"Username is required"**

####Examples of usage

```jsx

import React from "react";
import {Form, Input} from "bitshares-ui-style-guide";

export default Form.create({})(
    class exampleForm extends React.Component {
        render() {

            const {getFieldDecorator} = this.props.form;

            const usernameField = getFieldDecorator({
                rules: [
                    Validation.Rules.required("Username"),
                ]
            })(
                <Input placeholder="Username"/>
            );
            
            return (
                <Form onSubmit={this.props.onSubmit}>
                    <Form.Item label="Username">

                        {usernameField}
                        
                    </Form.Item>
                </Form>
            )
        }
    }
);

```
