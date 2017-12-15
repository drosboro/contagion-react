import React, { Component } from 'react'
import Locus from './locus'
import _ from 'lodash'
import { random_normal } from '../lib/random_normal'
import Button from 'material-ui/Button'
import Grid from 'material-ui/Grid'
import NumericField from './numericField'
import PercentField from './percentField'
import SwitchField from './switchField'

class World extends Component {
  constructor (props) {
    super(props)

    this.state = {
      height: 15,
      width: 25,
      population_size: 40,
      initially_infected: 1,
      contagiousness: 100,
      contagion_distance: 1,
      mean_contagion_period: 8,
      st_dev_contagion_period: 0,
      probability_of_death: 100,
      probability_of_moving: 100,
      mean_turns_to_fate: 8,
      st_dev_turns_to_fate: 1,
      allow_immunity: true,
      seconds_per_turn: 1.0,
      max_turns: 1000,
      grid: [[]],
      current_turn: 0,
      total_healthy: 0,
      total_sick: 0,
      total_dead: 0,
      total_immune: 0,
      timer: null
    }

    this.setupGrid = this.setupGrid.bind(this)
    this.handleAdvanceClick = this.handleAdvanceClick.bind(this)
    this.handleRunClick = this.handleRunClick.bind(this)
    this.handleResetClick = this.handleResetClick.bind(this)
    this.advanceTurn = this.advanceTurn.bind(this)
    this.inflictFates = this.inflictFates.bind(this)
    this.infect = this.infect.bind(this)
    this.populate = this.populate.bind(this)
    this.startSimulation = this.startSimulation.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.computeStats = this.computeStats.bind(this)
  }  

  setupGrid () {
    var newGrid = Array(this.state.height).fill().map( () => [...Array(this.state.width)] )

    this.setState({ grid: newGrid, current_turn: 0 }, () => this.populate())
  }

  populate () {
    const people = [...Array(this.state.population_size)].map( () => {
      return { status: "healthy" }
    })

    var grid = this.state.grid
    var empties = []
    _.forEach(grid, (row, row_idx) => {
      _.forEach(row, (loc, col_idx) => {
        if (loc === undefined) {
          empties.push([row_idx, col_idx])
        }
      })
    })
    
    _.forEach(people, (person, idx) => {
      const loc_idx = _.random(0, _.size(empties) - 1)
      const location = empties[loc_idx]
      empties.splice(loc_idx, 1)
      grid[location[0]][location[1]] = person
      if (idx < this.state.initially_infected) {
        this.infect(grid, location[0], location[1])
      }
    })

    this.setState({grid: grid}, () => this.computeStats())
  }

  infect(grid, grid_row, grid_col) {
    var person = grid[grid_row][grid_col]

    person.status = "sick"
    if (Math.random() * 100 > this.state.probability_of_death) {
      person.fate = this.state.allow_immunity ? "immune" : "healthy"
    } else {
      person.fate = "dead"
    }

    person.turn_of_fate = this.state.current_turn + random_normal(this.state.mean_turns_to_fate, this.state.st_dev_turns_to_fate);
    person.turn_of_noncontagion = this.state.current_turn + random_normal(this.state.mean_contagion_period, this.state.st_dev_contagion_period)
    person.infected_this_turn = true
    grid[grid_row][grid_col] = person

    return grid
  }

  move(grid, grid_row, grid_col) {
    var person = grid[grid_row][grid_col]

    if (Math.random() * 100 < this.state.probability_of_moving && person.status !== "dead") {
      // look for available moves
      var rows = [grid_row - 1, grid_row, grid_row + 1]
      var cols = [grid_col - 1, grid_col, grid_col + 1]

      rows = _.without(rows, -1, _.size(grid))
      cols = _.without(cols, -1, _.size(grid[0]))

      // randomly select a move
      var new_row = grid_row
      var new_col = grid_col

      var attempts = 0
      while (grid[new_row][new_col] !== undefined && attempts < 100) {
        attempts = attempts + 1
        new_row = _.sample(rows)
        new_col = _.sample(cols)
      }

      // move person
      person.moved_this_turn = true

      grid[grid_row][grid_col] = undefined
      grid[new_row][new_col] = person
    }
  }

  inflictFates (grid) {
    const current_turn = this.state.current_turn

    _.forEach(grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        if (person !== undefined) {
          if (person.turn_of_fate <= current_turn) {
            person.status = person.fate
            person.fate = undefined
            person.turn_of_fate = undefined
          }
        }
      })
    })

    this.setState({ grid: grid })
  }

  movePeople (grid) {
    _.forEach(grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        if (person !== undefined && !person.moved_this_turn) {
          this.move(grid, row_idx, col_idx)
        }
      })
    })

    _.forEach(grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        if (person !== undefined) {
          person.moved_this_turn = false
        }
      })
    })
  }

  spreadInfection(grid) {
    // clear infected_this_turn flags (they're stale)
    _.forEach(grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        if (person !== undefined && person.infected_this_turn) {
          person.infected_this_turn = false
        }
      })
    })

    // iterate over grid
    _.forEach(grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        // check that the person is alive, contagious, and hasn't been infected this turn
        if (person !== undefined && 
            person.status === "sick" && 
            person.turn_of_noncontagion > this.state.current_turn && 
            !person.infected_this_turn ) {
          // iterate over all squares within the contagion range

          const rows = _.range(row_idx - this.state.contagion_distance, row_idx + this.state.contagion_distance + 1)
          const cols = _.range(col_idx - this.state.contagion_distance, col_idx + this.state.contagion_distance + 1)

          _.forEach(rows, (r, ri) => {
            _.forEach(cols, (c, ci) => {
              if (r >= 0 && r < _.size(grid) && c >= 0 && c < _.size(grid[0])) {
                // infect others within range, respecting contagiousness probability (<)
                var newPerson = grid[r][c]
                if ((newPerson !== undefined) && (newPerson.status === "healthy") && (Math.random() * 100 < this.state.contagiousness)) {
                  this.infect(grid, r, c)
                }
              }
            })
          })
        }
      })
    })

  }

  isComplete () {
    var completion = true

    _.forEach(this.state.grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        if ((person || {}).status === "sick") {
          completion = false
        }
      })
    })
    console.log("Board completion", completion)
    return completion
  }

  advanceTurn () {
    this.setState({ current_turn: this.state.current_turn + 1 }, () => {
      var grid = this.state.grid
      if (this.isComplete()) {
        this.stopSimulation()
      } else {
        this.inflictFates(grid)
        this.movePeople(grid)
        this.spreadInfection(grid)
        this.setState({ grid: grid }, () => this.computeStats())
      }
    })
  }

  computeStats () {
    var total_healthy = 0
    var total_dead = 0
    var total_sick = 0
    var total_immune = 0

    _.forEach(this.state.grid, (row, row_idx) => {
      _.forEach(row, (person, col_idx) => {
        switch ((person || {}).status) {
          case "healthy":
            total_healthy += 1
            break
          case "sick":
            total_sick += 1
            break
          case "dead":
            total_dead += 1
            break
          case "immune":
            total_immune += 1
            break
          default:
            break
        }
      })
    })

    this.setState({
      total_healthy: total_healthy,
      total_sick: total_sick,
      total_dead: total_dead,
      total_immune: total_immune
    })
  }

  startSimulation () {
    clearInterval(this.state.timer)
    this.setState({ timer: setInterval(this.advanceTurn, this.state.seconds_per_turn * 1000)})
  }

  stopSimulation() {
    clearInterval(this.state.timer)
    this.setState({ timer: null })
  }

  handleAdvanceClick (event) {
    event.preventDefault()
    this.advanceTurn()
  }

  handleRunClick (event) {
    event.preventDefault()
    this.startSimulation()
  }

  handleResetClick (event) {
    event.preventDefault()
    this.stopSimulation()
    this.setupGrid()
  }

  handleChange = name => event => {
    var parsedValue = null

    switch (typeof(this.state[name])) {
      case 'number':
        parsedValue = parseInt(event.target.value)
        break
      case 'boolean':
        parsedValue = (event.target.checked)
        break
      default:
        parsedValue = event.target.value
    }

    this.setState({ [name]: parsedValue }, () => {
        console.log("New state", this.state)
        this.stopSimulation()
        this.setupGrid()
    })
  }

  componentWillMount () {
    this.setupGrid()
  }

  componentWillReceiveProps (newProps) {
    this.setState(newProps)
    this.setupGrid()
  }

  render () {
    const gridView = this.state.grid.map( (row, rowIdx) => {
      return <div className="row" key={rowIdx}>
        {
          row.map( (loc, colIdx) => {
            return <Locus status={(loc || {}).status} key={colIdx} />
          })
        }
      </div>
    })

    return (
      <div className="world">
        <div className="grid">
          {gridView}
        </div>
        <div className="statistics">
          <span>Turn: {this.state.current_turn}</span>
          <span>Healthy: {this.state.total_healthy}</span>
          <span>Infected: {this.state.total_sick}</span>
          <span>Immune: {this.state.total_immune}</span>
          <span>Dead: {this.state.total_dead}</span>
        </div>
        <div className="actions">
          <Button raised color="primary" onClick={this.handleRunClick}>Run</Button>
          <Button onClick={this.handleAdvanceClick}>Advance</Button>
          <Button onClick={this.handleResetClick}>Reset</Button>
        </div>
        <div className="settings">
          <Grid container>
            <NumericField label="Width" value={this.state.width} min={1} max={50} handler={this.handleChange('width')} />
            <NumericField label="Height" value={this.state.height} min={1} max={50} handler={this.handleChange('height')} />
          </Grid>
          <Grid container>
            <NumericField label="Population" value={this.state.population_size} min={1} max={this.state.width * this.state.height} handler={this.handleChange('population_size')} />
            <NumericField label="Initial Infections" value={this.state.initially_infected} min={1} max={this.state.population_size} handler={this.handleChange('initially_infected')} />
            <PercentField label="Probability of Moving" value={this.state.probability_of_moving} handler={this.handleChange('probability_of_moving')} />
          </Grid>
          <Grid container>
            <PercentField label="Contagiousness" value={this.state.contagiousness} handler={this.handleChange('contagiousness')} />
            <NumericField label="Avg Contagion Turns" value={this.state.mean_contagion_period} min={1} handler={this.handleChange('mean_contagion_period')} />
            <NumericField label="St Dev Contagion" value={this.state.st_dev_contagion_period} min={0} handler={this.handleChange('st_dev_contagion_period')} />
            <NumericField label="Contagion Distance" value={this.state.contagion_distance} min={1} max={_.max([this.state.width, this.state.height])} handler={this.handleChange('contagion_distance')} />
          </Grid>
          <Grid container>
            <PercentField label="Lethality" value={this.state.probability_of_death} handler={this.handleChange('probability_of_death')} />
            <NumericField label="Mean Turns until Fate" value={this.state.mean_turns_to_fate} min={1} handler={this.handleChange('mean_turns_to_fate')} />
            <NumericField label="St Dev Turns until Fate" value={this.state.st_dev_turns_to_fate} min={0} handler={this.handleChange('st_dev_turns_to_fate')} />
          </Grid>
          <Grid container>
            <SwitchField label="Immunity" value={this.state.allow_immunity} handler={this.handleChange('allow_immunity')} />
          </Grid>
        </div>
      </div>
    )
  }
}

export default World