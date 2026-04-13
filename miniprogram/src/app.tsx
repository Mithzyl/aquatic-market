import { Component } from 'react'
import './app.scss'

class App extends Component {
  componentDidMount() {
    console.log('小程序启动')
  }

  componentDidShow() {
    console.log('小程序显示')
  }

  componentDidHide() {
    console.log('小程序隐藏')
  }

  render() {
    return this.props.children
  }
}

export default App