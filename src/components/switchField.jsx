import React from 'react'
import { FormControlLabel, FormGroup } from 'material-ui/Form';
import Switch from 'material-ui/Switch'
import Grid from 'material-ui/Grid'

const SwitchField = (props) => (
  <Grid item xs={6} sm={3}>
    <FormGroup>
      <FormControlLabel label={props.label} control={
          <Switch checked={props.value} onChange={props.handler} />
        } />
    </FormGroup>
  </Grid>
)

export default SwitchField