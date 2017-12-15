import React from 'react'
import TextField from 'material-ui/TextField'
import {InputAdornment} from 'material-ui/Input'
import Grid from 'material-ui/Grid'

const NumericField = (props) => (
  <Grid item xs={6} sm={3}>
    <TextField type="number" 
               fullWidth={true} 
               label={props.label} 
               value={props.value} 
               InputProps={{ 
                 endAdornment: <InputAdornment position="end">%</InputAdornment>,
                 inputProps: { step: props.step || 1, min: props.min || 0, max: props.max || 100 } 
               }} 
               onChange={props.handler} />
  </Grid>
)

export default NumericField