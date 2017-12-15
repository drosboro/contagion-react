import React from 'react'
import TextField from 'material-ui/TextField'
import Grid from 'material-ui/Grid'

const NumericField = (props) => (
  <Grid item xs={6} sm={3}>
    <TextField type="number" fullWidth={true} label={props.label} value={props.value} InputProps={{ inputProps: { step: props.step || 1, min: props.min || undefined, max: props.max || undefined } }} onChange={props.handler} />
  </Grid>
)

export default NumericField